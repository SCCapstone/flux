from django.conf import settings
from django.contrib.auth.models import User
from django.contrib.auth import authenticate, login, logout
from django.http import JsonResponse
<<<<<<< Updated upstream
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
from .models import Rating, Book, Favorite
=======
from django.views.decorators.csrf import csrf_exempt
from django.core.files.storage import default_storage
from django.db import models

import requests
>>>>>>> Stashed changes
import base64
import os
import time

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken

from .models import Profile, Rating, Book, Favorite, Review

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
    Profile.objects.create(user=user)
    
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
        profile_images_path = os.path.join(settings.MEDIA_ROOT, 'profile_images')
        os.makedirs(profile_images_path, exist_ok=True)

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
        
        if 'bio' in data:
            profile.bio = data['bio']
            
        if 'profile_image' in data and data['profile_image']:
            if profile.profile_image:
                old_image_path = os.path.join(settings.MEDIA_ROOT, str(profile.profile_image))
                if os.path.exists(old_image_path):
                    os.remove(old_image_path)
            
            format, imgstr = data['profile_image'].split(';base64,')
            ext = format.split('/')[-1]
            filename = f"profile_image_{user.username}_{int(time.time())}.{ext}"
            
            file_path = os.path.join(profile_images_path, filename)
            image_data = base64.b64decode(imgstr)
            with open(file_path, 'wb') as f:
                f.write(image_data)
                
            profile.profile_image = f'profile_images/{filename}'
        
        user.save()
        profile.save()
        
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
        page = int(request.GET.get('page', 1))
        filter_type = request.GET.get('filterType', 'title')
        max_results = 10
        start_index = (page - 1) * max_results

        if query:
            if filter_type == 'author':
                formatted_query = f'inauthor:"{query}"'
            elif filter_type == 'title':
                formatted_query = f'intitle:"{query}"'
            elif filter_type == 'genre':
                formatted_query = f'subject:"{query}"'
            else:
                formatted_query = query

            url = f"https://www.googleapis.com/books/v1/volumes?q={formatted_query}&key={GOOGLE_BOOKS_API_KEY}&maxResults=40"
            
            response = requests.get(url)
            if response.status_code == 200:
                data = response.json()
                books = []
                for item in data.get('items', []):
                    volume_info = item.get('volumeInfo', {})
                    books.append({
                        'id': item.get('id'),
                        'title': volume_info.get('title', 'No Title'),
                        'genre': ', '.join(volume_info.get('categories', ['Unknown Genre'])),
                        'author': ', '.join(volume_info.get('authors', ['Unknown Author'])),
                        'year': volume_info.get('publishedDate', 'N/A')[:4] if volume_info.get('publishedDate') else 'N/A',
                        'description': volume_info.get('description', 'No Description'),
                        'image': volume_info.get('imageLinks', {}).get('thumbnail', ''),
                    })

                paginated_books = books[start_index:start_index + max_results]
                return JsonResponse({'books': paginated_books, 'page': page})
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
def get_book_ratings(request, google_books_id):
    try:
        book = Book.objects.get(google_books_id=google_books_id)
        ratings = Rating.objects.filter(book=book)
        avg_rating = ratings.aggregate(models.Avg('rating'))['rating__avg']
        return Response({
            'average_rating': round(avg_rating, 1) if avg_rating else 0,
            'total_ratings': ratings.count()
        })
    except Book.DoesNotExist:
        return Response({
            'average_rating': 0,
            'total_ratings': 0
        })

<<<<<<< Updated upstream
=======
@api_view(['GET'])
def get_book_reviews(request, google_books_id):
    try:
        book = Book.objects.get(google_books_id=google_books_id)
        reviews = Review.objects.filter(book=book)
        reviews_data = []
        
        for review in reviews:
            reviews_data.append({
                'id': review.id,
                'user': {
                    'id': review.user.id,
                    'username': review.user.username
                },
                'review_text': review.review_text,
                'added_date': review.added_date,
                'updated_at': review.updated_at
            })
        return Response(reviews_data)
    except Book.DoesNotExist:
        return Response([])

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_book_review(request):
    try:
        book_id = request.data.get('book')
        review_text = request.data.get('review_text')
        
        if not book_id or not review_text:
            return Response(
                {'error': 'Book ID and review text are required.'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        book = Book.objects.get(id=book_id)
        review = Review.objects.create(
            user=request.user,
            book=book,
            review_text=review_text
        )
        
        return Response({
            'id': review.id,
            'user': {
                'id': review.user.id,
                'username': review.user.username
            },
            'review_text': review.review_text,
            'added_date': review.added_date,
            'updated_at': review.updated_at
        }, status=status.HTTP_201_CREATED)
        
    except Book.DoesNotExist:
        return Response(
            {'error': 'Book not found.'}, 
            status=status.HTTP_404_NOT_FOUND
        )

@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def update_review(request, review_id):
    try:
        review = Review.objects.get(id=review_id, user=request.user)
        review_text = request.data.get('review_text')
        
        if not review_text:
            return Response(
                {'error': 'Review text is required.'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        review.review_text = review_text
        review.save()
        
        return Response({
            'id': review.id,
            'user': {
                'id': review.user.id,
                'username': review.user.username
            },
            'review_text': review.review_text,
            'added_date': review.added_date,
            'updated_at': review.updated_at
        })
        
    except Review.DoesNotExist:
        return Response(
            {'error': 'Review not found.'}, 
            status=status.HTTP_404_NOT_FOUND
        )

@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_review(request, review_id):
    try:
        review = Review.objects.get(id=review_id, user=request.user)
        review.delete()
        return Response(
            {'message': 'Review deleted successfully.'}, 
            status=status.HTTP_204_NO_CONTENT
        )
    except Review.DoesNotExist:
        return Response(
            {'error': 'Review not found.'}, 
            status=status.HTTP_404_NOT_FOUND
        )

>>>>>>> Stashed changes
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_or_get_book(request):
    google_books_id = request.data.get('google_books_id')
    if not google_books_id:
        return Response({'error': 'Google Books ID is required'}, status=status.HTTP_400_BAD_REQUEST)
        
    try:
        book, created = Book.objects.get_or_create(
            google_books_id=google_books_id,
            defaults={
                'title': request.data.get('title', ''),
                'author': request.data.get('author', ''),
                'description': request.data.get('description', ''),
                'genre': request.data.get('genre', ''),
                'image': request.data.get('image', ''),
                'year': request.data.get('year', '')
            }
        )
        return Response({
            'id': book.id,
            'google_books_id': book.google_books_id,
            'title': book.title,
            'author': book.author
        })
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_favorites(request):
    favorites = Favorite.objects.filter(user=request.user).select_related('book')
    books = [
        {
            'id': fav.book.id,
            'google_books_id': fav.book.google_books_id,
            'title': fav.book.title,
            'author': fav.book.author,
            'description': fav.book.description,
            'genre': fav.book.genre,
            'image': fav.book.image,
            'year': fav.book.year
        }
        for fav in favorites
    ]
    return Response(books)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def add_favorite(request):
    book_data = request.data
    book, created = Book.objects.get_or_create(
        google_books_id=book_data['id'],
        defaults={
            'title': book_data.get('title', ''),
            'author': book_data.get('author', ''),
            'description': book_data.get('description', ''),
            'genre': book_data.get('genre', ''),
            'image': book_data.get('image', ''),
            'year': book_data.get('year', '')
        }
    )
    favorite, created = Favorite.objects.get_or_create(user=request.user, book=book)
    return Response({'message': 'Book added to favorites'})

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def remove_favorite(request):
    book_id = request.data.get('book_id')
    try:
        favorite = Favorite.objects.get(
            user=request.user,
            book__google_books_id=book_id
        )
        favorite.delete()
        return Response({'message': 'Book removed from favorites'})
    except Favorite.DoesNotExist:
        return Response({'error': 'Favorite not found'}, status=404)