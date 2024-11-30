from django.conf import settings
from django.contrib.auth.models import User
from django.contrib.auth import authenticate, login, logout
from django.http import JsonResponse
import requests
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth import authenticate
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.decorators import api_view, permission_classes
from .models import Profile
from django.core.files.storage import default_storage
from .models import Rating, Book
import base64
import os
import time

GOOGLE_BOOKS_API_KEY = 'AIzaSyBjiBQrzkmRzpoE0CsiqBYAkEIQMKc-q1I'

@api_view(['POST'])
def register_user(request):
    username = request.data.get('username')
    password = request.data.get('password')
    email = request.data.get('email')

    if not username or not password or not email:
        return Response({'error': 'All fields are required.'}, status=status.HTTP_400_BAD_REQUEST)

    if User.objects.filter(username=username).exists():
        return Response({'error': 'Username already exists.'}, status=status.HTTP_400_BAD_REQUEST)

    if User.objects.filter(email=email).exists():
        return Response({'error': 'Email already exists.'}, status=status.HTTP_400_BAD_REQUEST)

    user = User.objects.create_user(username=username, password=password, email=email)
    Profile.objects.create(user=user)  # Create profile for new user
    
    # Generate token for the new user
    refresh = RefreshToken.for_user(user)
    
    return Response({
        'message': 'User registered successfully.',
        'token': str(refresh.access_token),
        'user': {
            'username': user.username,
            'email': user.email
        }
    }, status=status.HTTP_201_CREATED)

@api_view(['POST'])
def login_user(request):
    username = request.data.get('username')
    password = request.data.get('password')

    user = authenticate(username=username, password=password)
    if user:
        refresh = RefreshToken.for_user(user)
        profile = Profile.objects.get_or_create(user=user)[0]
        return Response({
            'token': str(refresh.access_token),
            'user': {
                'username': user.username,
                'email': user.email,
                'bio': profile.bio,
                'profile_image': request.build_absolute_uri(profile.profile_image.url) if profile.profile_image else None
            }
        }, status=status.HTTP_200_OK)
    return Response({'error': 'Invalid credentials.'}, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
def logout_user(request):
    return Response({'message': 'Logged out successfully.'}, status=status.HTTP_200_OK)

@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def update_profile(request):
    user = request.user
    try:
        profile = Profile.objects.get(user=user)
    except Profile.DoesNotExist:
        profile = Profile.objects.create(user=user)
    
    data = request.data
    
    try:
        # Create media directories if they don't exist
        profile_images_path = os.path.join(settings.MEDIA_ROOT, 'profile_images')
        os.makedirs(profile_images_path, exist_ok=True)

        # Update basic user info
        if 'username' in data and data['username'] != user.username:
            if User.objects.filter(username=data['username']).exists():
                return Response({'error': 'Username already taken'}, status=status.HTTP_400_BAD_REQUEST)
            user.username = data['username']
        
        if 'email' in data and data['email'] != user.email:
            if User.objects.filter(email=data['email']).exists():
                return Response({'error': 'Email already taken'}, status=status.HTTP_400_BAD_REQUEST)
            user.email = data['email']
            
        if 'password' in data and data['password']:
            user.set_password(data['password'])
        
        # Update profile fields
        if 'bio' in data:
            profile.bio = data['bio']
            
        if 'profile_image' in data and data['profile_image']:
            # Delete old image if it exists
            if profile.profile_image:
                old_image_path = os.path.join(settings.MEDIA_ROOT, str(profile.profile_image))
                if os.path.exists(old_image_path):
                    os.remove(old_image_path)
            
            # Handle base64 encoded image
            format, imgstr = data['profile_image'].split(';base64,')
            ext = format.split('/')[-1]
            filename = f"profile_image_{user.username}_{int(time.time())}.{ext}"  # Added timestamp to prevent caching
            
            # Save the decoded image
            file_path = os.path.join(profile_images_path, filename)
            image_data = base64.b64decode(imgstr)
            with open(file_path, 'wb') as f:
                f.write(image_data)
                
            profile.profile_image = f'profile_images/{filename}'
        
        user.save()
        profile.save()
        
        # Generate new token
        refresh = RefreshToken.for_user(user)
        
        return Response({
            'message': 'Profile updated successfully',
            'token': str(refresh.access_token),
            'user': {
                'username': user.username,
                'email': user.email,
                'bio': profile.bio,
                'profile_image': request.build_absolute_uri(profile.profile_image.url) if profile.profile_image else None
            }
        })
        
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def profile_view(request):
    user = request.user
    try:
        profile = Profile.objects.get(user=user)
    except Profile.DoesNotExist:
        profile = Profile.objects.create(user=user)
        
    return Response({
        'username': user.username,
        'email': user.email,
        'bio': profile.bio,
        'profile_image': request.build_absolute_uri(profile.profile_image.url) if profile.profile_image else None
    })

@csrf_exempt
def search_books(request):
    if request.method == 'GET':
        query = request.GET.get('q', '')
        page = int(request.GET.get('page', 1))  # Default to page 1
        sort_option = request.GET.get('sort', 'title')  # Default to sorting by title
        max_results = 10  # Number of results per page
        start_index = (page - 1) * max_results  # Calculate start index

        if query:
            url = f"https://www.googleapis.com/books/v1/volumes?q={query}&key={GOOGLE_BOOKS_API_KEY}&maxResults=40"
            response = requests.get(url)
            if response.status_code == 200:
                data = response.json()
                books = []
                for item in data.get('items', []):
                    volume_info = item.get('volumeInfo', {})
                    books.append({
                        'title': volume_info.get('title', 'No Title'),
                        'genre': ', '.join(volume_info.get('categories', ['Unknown Genre'])),
                        'author': ', '.join(volume_info.get('authors', ['Unknown Author'])),
                        'year': volume_info.get('publishedDate', 'N/A'),
                        'description': volume_info.get('description', 'No Description'),
                        'image': volume_info.get('imageLinks', {}).get('thumbnail', ''),
                    })

                    # Sort the books based on the sort_option
                if sort_option == 'title':
                    books.sort(key=lambda x: x['title'])
                elif sort_option == 'author':
                    books.sort(key=lambda x: x['author'])
                elif sort_option == 'genre':
                    books.sort(key=lambda x: x['genre'])
                elif sort_option == 'year':
                    books.sort(key=lambda x: x['year'])
                
                # Paginate the sorted books
                paginated_books = books[start_index:start_index + max_results]

                return JsonResponse({'books': paginated_books, 'page': page, 'sort': sort_option})
            else:
                return JsonResponse({'error': 'Error fetching data from Google Books API'}, status=500)
        return JsonResponse({'error': 'No search query provided'}, status=400)
    return JsonResponse({'error': 'Invalid request method'}, status=405)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def rate_book(request):
    user = request.user
    book_id = request.data.get('book_id')
    rating_value = request.data.get('rating')

    if not book_id or not rating_value:
        return Response({'error': 'Book ID and rating are required.'}, status=status.HTTP_400_BAD_REQUEST)

    if not (1 <= int(rating_value) <= 5):
        return Response({'error': 'Rating must be between 1 and 5.'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        book = Book.objects.get(id=book_id)
        rating, created = Rating.objects.update_or_create(
            user=user, book=book, defaults={'rating': rating_value}
        )
        return Response({'message': 'Rating submitted successfully.', 'rating': rating.rating})
    except Book.DoesNotExist:
        return Response({'error': 'Book not found.'}, status=status.HTTP_404_NOT_FOUND)

@api_view(['GET'])
def get_book_ratings(request, book_id):
    try:
        book = Book.objects.get(id=book_id)
        ratings = Rating.objects.filter(book=book)
        avg_rating = ratings.aggregate(models.Avg('rating'))['rating__avg']
        return Response({'average_rating': avg_rating, 'total_ratings': ratings.count()}, status=status.HTTP_200_OK)
    except Book.DoesNotExist:
        return Response({'error': 'Book not found.'}, status=status.HTTP_404_NOT_FOUND)