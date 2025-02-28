from django.conf import settings
from django.contrib.auth.models import User
from django.contrib.auth import authenticate, login, logout
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.core.files.storage import default_storage
from django.db import models
import json

import requests
import base64
import os
import time

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError

from .models import Profile, Rating, Book, Favorite, Review, UserBookStatus, Readlist, ReadlistBook
from .serializers import ReadlistSerializer
from .models import (
    Profile, Rating, Book, Favorite, Review, UserBookStatus,
    Achievement, UserAchievement, ReadingChallenge,
    UserChallenge, UserPoints, PointsHistory, ReadingStreak
)

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

    Readlist.objects.create(user=user, name="Favorites", is_favorites=True)
    
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
    """Retrieve books from the 'Favorites' readlist"""
    try:
        favorites_readlist = Readlist.objects.get(user=request.user, is_favorites=True)
        books = favorites_readlist.books.all()  # Fetch books linked to the readlist

        book_data = [
            {
                "id": book.id,
                "google_books_id": book.google_books_id,
                "title": book.title,
                "author": book.author,
                "genre": book.genre,
                "year": book.year,
                "image": book.image,
            }
            for book in books
        ]

        return Response(book_data, status=status.HTTP_200_OK)

    except Readlist.DoesNotExist:
        return Response({"error": "Favorites readlist not found"}, status=status.HTTP_404_NOT_FOUND)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def add_favorite(request):
    """Add a book to the 'Favorites' readlist and award points"""
    book_data = request.data
    user = request.user

    # Ensure the book exists or create it
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

    try:
        favorites_readlist = Readlist.objects.get(user=user, is_favorites=True)
        _, added = ReadlistBook.objects.get_or_create(readlist=favorites_readlist, book=book)

        if added:
            # Award points for adding a book to favorites
            award_points(user, 2, "Added a book to favorites")
            
            # Check for collection achievements
            favorites_count = favorites_readlist.books.count()
            achievement_messages = []

            if favorites_count == 5:
                achievement_messages.append("🏆 Collector: Added 5 books to favorites!")
            elif favorites_count == 25:
                achievement_messages.append("🏆 Enthusiast: Added 25 books to favorites!")
            elif favorites_count == 50:
                achievement_messages.append("🏆 Book Lover: Added 50 books to favorites!")

            # Prepare gamification response
            gamification_data = {
                "notification": {
                    "show": True,
                    "message": "Book added to favorites!",
                    "points": 2,
                    "type": "success"
                },
                "achievements": achievement_messages
            }

            return Response({
                'message': 'Book added to favorites',
                'gamification': gamification_data
            }, status=status.HTTP_200_OK)

        return Response({'message': 'Book already in favorites'}, status=status.HTTP_200_OK)

    except Readlist.DoesNotExist:
        return Response({'error': 'Favorites readlist not found'}, status=status.HTTP_404_NOT_FOUND)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def remove_favorite(request):
    """Remove a book from the 'Favorites' readlist"""
    book_id = request.data.get('book_id')
    user = request.user

    try:
        book = Book.objects.get(google_books_id=book_id)
        favorites_readlist = Readlist.objects.get(user=user, is_favorites=True)
        readlist_book = ReadlistBook.objects.filter(readlist=favorites_readlist, book=book)

        if readlist_book.exists():
            readlist_book.delete()

            gamification_data = {
                "notification": {
                    "show": True,
                    "message": "Book removed from favorites.",
                    "points": 0,  # No points for removing
                    "type": "info"
                }
            }

            return Response({
                'message': 'Book removed from favorites',
                'gamification': gamification_data
            }, status=status.HTTP_200_OK)

        return Response({'error': 'Book not found in favorites'}, status=status.HTTP_404_NOT_FOUND)

    except (Book.DoesNotExist, Readlist.DoesNotExist):
        return Response({'error': 'Favorites readlist or book not found'}, status=status.HTTP_404_NOT_FOUND)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def verify_token(request):
    try:
        jwt_auth = JWTAuthentication()
        header = jwt_auth.get_header(request)
        if header is None:
            return Response({'error': 'No authorization header found.'}, status=status.HTTP_401_UNAUTHORIZED)
        
        raw_token = jwt_auth.get_raw_token(header)
        if raw_token is None:
            return Response({'error': 'No token found in the authorization header.'}, status=status.HTTP_401_UNAUTHORIZED)
        
        validated_token = jwt_auth.get_validated_token(raw_token)
        user = jwt_auth.get_user(validated_token)
        
        return Response({'message': 'Token is valid.'}, status=status.HTTP_200_OK)
    
    except (InvalidToken, TokenError) as e:
        return Response({'error': 'Invalid token.'}, status=status.HTTP_401_UNAUTHORIZED)

@api_view(['GET'])
def get_bestsellers(request):
    try:
        params = {
            'api-key': settings.NYT_API_KEY
        }
        
        response = requests.get(settings.NYT_BESTSELLERS_URL, params=params)
        
        if response.status_code == 200:
            data = response.json()
            books = []
            
            for book in data['results']['books']:
                # Get additional details from Google Books API for each book
                google_query = f"{book['title']} {book['author']}"
                google_url = f"https://www.googleapis.com/books/v1/volumes?q={google_query}&key={GOOGLE_BOOKS_API_KEY}"
                google_response = requests.get(google_url)
                google_data = google_response.json()
                
                google_book_info = {}
                if google_response.status_code == 200 and google_data.get('items'):
                    volume_info = google_data['items'][0]['volumeInfo']
                    google_book_info = {
                        'google_books_id': google_data['items'][0]['id'],
                        'description': volume_info.get('description', ''),
                        'categories': volume_info.get('categories', []),
                        'image': volume_info.get('imageLinks', {}).get('thumbnail', '')
                    }

                books.append({
                    'rank': book['rank'],
                    'title': book['title'],
                    'author': book['author'],
                    'description': google_book_info.get('description', book['description']),
                    'google_books_id': google_book_info.get('google_books_id', ''),
                    'genre': ', '.join(google_book_info.get('categories', [])),
                    'image': google_book_info.get('image', book['book_image']),
                    'amazon_link': book['amazon_product_url'],
                    'weeks_on_list': book['weeks_on_list']
                })
            
            return Response({
                'status': 'success',
                'books': books,
                'list_update_date': data['results']['updated']
            })
        else:
            return Response({
                'status': 'error',
                'message': 'Failed to fetch bestsellers'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            
    except Exception as e:
        return Response({
            'status': 'error',
            'message': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_book_status(request, google_books_id):
    user = request.user
    try:
        book = Book.objects.get(google_books_id=google_books_id)
        user_book_status = UserBookStatus.objects.get(user=user, book=book)
        return Response({
            'status': user_book_status.status,
        }, status=status.HTTP_200_OK)
    except Book.DoesNotExist:
        return Response({"error": "Book not found"}, status=status.HTTP_404_NOT_FOUND)
    except UserBookStatus.DoesNotExist:
        return Response({"status": "NOT_ADDED"}, status=status.HTTP_200_OK)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def update_book_status(request, google_books_id):
    user = request.user
    new_status = request.data.get('status')
    if new_status not in dict(UserBookStatus.STATUS_CHOICES).keys():
        return Response({"error": "Invalid status"}, status=status.HTTP_400_BAD_REQUEST)

    # Get book data from api to create book object for later
    url = f"https://www.googleapis.com/books/v1/volumes/{google_books_id}?key={GOOGLE_BOOKS_API_KEY}"
    response = requests.get(url)
    if response.status_code != 200:
        return Response(
            {"error": "Book not found in Google Books API"},
            status=status.HTTP_404_NOT_FOUND
        )

    book_data = response.json()
    volume_info = book_data.get('volumeInfo', {})
    if not volume_info:
        return Response(
            {"error": "No book data found in Google Books API response"},
            status=status.HTTP_404_NOT_FOUND
        )

    title = volume_info.get('title', 'No Title')
    authors = volume_info.get('authors', ['Unknown Author'])
    description = volume_info.get('description', 'No Description')
    categories = volume_info.get('categories', ['Unknown Genre'])
    image_links = volume_info.get('imageLinks', {})
    published_date = volume_info.get('publishedDate', '')

    book, created = Book.objects.update_or_create(
        google_books_id=google_books_id,
        defaults={
            'title': title,
            'author': ', '.join(authors),
            'description': description,
            'genre': ', '.join(categories),
            'image': image_links.get('thumbnail', ''),
            'year': published_date[:4] if published_date else 'N/A'
        }
    )

    user_book_status, created = UserBookStatus.objects.get_or_create(
        user=user,
        book=book,
        defaults={'status': new_status}
    )

    if not created:
        user_book_status.status = new_status
        user_book_status.save()

    return Response({
        'status': user_book_status.status,
    }, status=status.HTTP_200_OK)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_user_book_statuses(request):
    user = request.user
    user_book_statuses = UserBookStatus.objects.filter(user=user).select_related('book')
    data = [
        {
            'book_id': status.book.google_books_id,
            'title': status.book.title,
            'status': status.status,
        }
        for status in user_book_statuses
    ]
    return Response(data, status=status.HTTP_200_OK)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_readlists(request):
    user = request.user

    # Ensure "Favorites" always exists for the user
    favorites, created = Readlist.objects.get_or_create(user=user, name="Favorites", is_favorites=True)

    # Fetch all readlists, ensuring "Favorites" is included
    readlists = Readlist.objects.filter(user=user).order_by("is_favorites")  # Ensures "Favorites" appears first
    serializer = ReadlistSerializer(readlists, many=True)
    return Response(serializer.data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_readlist(request):
    name = request.data.get("name")
    if not name:
        return Response({"error": "Readlist name is required"}, status=status.HTTP_400_BAD_REQUEST)

    readlist, created = Readlist.objects.get_or_create(user=request.user, name=name, defaults={"is_favorites": False})
    return Response(ReadlistSerializer(readlist).data, status=status.HTTP_201_CREATED)

@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_readlist(request, readlist_id):
    try:
        readlist = Readlist.objects.get(id=readlist_id, user=request.user)

        if readlist.is_favorites:
            return Response({"error": "Favorites readlist cannot be deleted."}, status=status.HTTP_403_FORBIDDEN)

        readlist.delete()
        return Response({"message": "Readlist deleted"}, status=status.HTTP_204_NO_CONTENT)

    except Readlist.DoesNotExist:
        return Response({"error": "Readlist not found"}, status=status.HTTP_404_NOT_FOUND)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def update_readlist_books(request):
    book_id = request.data.get("book_id")
    readlist_ids = request.data.get("readlist_ids", [])

    if not book_id:
        return Response({"error": "Book ID is required"}, status=status.HTTP_400_BAD_REQUEST)

    # Fetch or create book and update fields unconditionally
    book, created = Book.objects.get_or_create(google_books_id=book_id)

    # Force update all book fields
    updated_fields = {
        "title": request.data.get("title", "").strip(),
        "author": request.data.get("author", "").strip(),
        "description": request.data.get("description", "").strip(),
        "genre": request.data.get("genre", "").strip(),
        "image": request.data.get("image", "").strip(),
        "year": request.data.get("year", "").strip(),
    }

    # Only update non-empty fields
    for field, value in updated_fields.items():
        if value:
            setattr(book, field, value)

    book.save()  

    # Handle ReadlistBook relationships
    for readlist in Readlist.objects.filter(user=request.user):
        if readlist.id in readlist_ids:
            ReadlistBook.objects.get_or_create(readlist=readlist, book=book)
        else:
            ReadlistBook.objects.filter(readlist=readlist, book=book).delete()

    return Response({"message": "Book readlist associations updated"})

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_readlist_books(request, readlist_id):
    """Retrieve books from a specific readlist"""
    try:
        readlist = Readlist.objects.get(id=readlist_id, user=request.user)
        books = readlist.books.all()  

        book_data = [
            {
                "id": book.id,
                "google_books_id": book.google_books_id,
                "title": book.title,
                "author": book.author,
                "genre": book.genre,
                "year": book.year,
                "image": book.image,
            }
            for book in books
        ]

        return Response({"name": readlist.name, "books": book_data}, status=status.HTTP_200_OK)

    except Readlist.DoesNotExist:
        return Response({"error": "Readlist not found"}, status=status.HTTP_404_NOT_FOUND)


@api_view(['GET'])
def get_achievements(request):
    """Get all available achievements in the system"""
    achievements = Achievement.objects.all()
    achievement_data = [{
        'id': achievement.id,
        'name': achievement.name,
        'description': achievement.description,
        'points': achievement.points,
        'badge_image': request.build_absolute_uri(achievement.badge_image.url) if achievement.badge_image else None
    } for achievement in achievements]
    
    return Response(achievement_data)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_user_achievements(request):
    """Get all achievements earned by the current user"""
    user = request.user
    user_achievements = UserAchievement.objects.filter(user=user).select_related('achievement')
    
    achievement_data = [{
        'id': user_achievement.achievement.id,
        'name': user_achievement.achievement.name,
        'description': user_achievement.achievement.description,
        'points': user_achievement.achievement.points,
        'badge_image': request.build_absolute_uri(user_achievement.achievement.badge_image.url) 
                        if user_achievement.achievement.badge_image else None,
        'date_earned': user_achievement.date_earned
    } for user_achievement in user_achievements]
    
    return Response(achievement_data)

# Points related views
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_user_points(request):
    """Get the current user's points and level"""
    user = request.user
    user_points, created = UserPoints.objects.get_or_create(
        user=user,
        defaults={'total_points': 0, 'level': 1}
    )
    
    # Get user statistics for the profile
    books_read = UserBookStatus.objects.filter(user=user, status='FINISHED').count()
    reviews_written = Review.objects.filter(user=user).count()
    
    response_data = {
        'total_points': user_points.total_points,
        'level': user_points.level,
        'books_read': books_read,
        'reviews_written': reviews_written
    }
    
    return Response(response_data)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_points_history(request):
    """Get the history of points earned by the current user"""
    user = request.user
    history = PointsHistory.objects.filter(user=user).order_by('-timestamp')
    
    history_data = [{
        'amount': entry.amount,
        'description': entry.description,
        'timestamp': entry.timestamp
    } for entry in history]
    
    return Response(history_data)

# Helper function to award points to a user
def award_points(user, amount, description):
    """Award points to a user and update their level"""
    user_points, created = UserPoints.objects.get_or_create(
        user=user,
        defaults={'total_points': 0, 'level': 1}
    )
    
    # Add points
    user_points.total_points += amount
    
    # Update level (1 level per 100 points)
    new_level = (user_points.total_points // 100) + 1
    if new_level > user_points.level:
        user_points.level = new_level
    
    user_points.save()
    
    # Record in history
    PointsHistory.objects.create(
        user=user,
        amount=amount,
        description=description
    )
    
    return user_points

# Challenge related views
@api_view(['GET'])
def get_challenges(request):
    """Get all active reading challenges"""
    today = timezone.now().date()
    challenges = ReadingChallenge.objects.filter(end_date__gte=today)
    
    challenge_data = [{
        'id': challenge.id,
        'name': challenge.name,
        'description': challenge.description,
        'target_books': challenge.target_books,
        'start_date': challenge.start_date,
        'end_date': challenge.end_date,
        'days_remaining': (challenge.end_date - today).days
    } for challenge in challenges]
    
    return Response(challenge_data)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def join_challenge(request):
    """Join a reading challenge"""
    user = request.user
    challenge_id = request.data.get('challenge_id')
    
    if not challenge_id:
        return Response({'error': 'Challenge ID is required'}, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        challenge = ReadingChallenge.objects.get(id=challenge_id)
        
        # Check if the challenge is still active
        if challenge.end_date < timezone.now().date():
            return Response({'error': 'This challenge has ended'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Check if user is already enrolled
        if UserChallenge.objects.filter(user=user, challenge=challenge).exists():
            return Response({'error': 'You are already enrolled in this challenge'}, 
                            status=status.HTTP_400_BAD_REQUEST)
        
        # Enroll user
        user_challenge = UserChallenge.objects.create(
            user=user,
            challenge=challenge,
            books_read=0,
            completed=False
        )
        
        return Response({
            'message': f'Successfully joined the "{challenge.name}" challenge',
            'challenge': {
                'id': challenge.id,
                'name': challenge.name,
                'target_books': challenge.target_books,
                'books_read': 0,
                'progress_percentage': 0
            }
        })
        
    except ReadingChallenge.DoesNotExist:
        return Response({'error': 'Challenge not found'}, status=status.HTTP_404_NOT_FOUND)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_user_challenges(request):
    """Get all challenges the current user is participating in"""
    user = request.user
    user_challenges = UserChallenge.objects.filter(user=user).select_related('challenge')
    
    today = timezone.now().date()
    challenge_data = []
    
    for user_challenge in user_challenges:
        challenge = user_challenge.challenge
        progress_percentage = (user_challenge.books_read / challenge.target_books) * 100 if challenge.target_books > 0 else 0
        
        challenge_data.append({
            'id': challenge.id,
            'name': challenge.name,
            'description': challenge.description,
            'target_books': challenge.target_books,
            'books_read': user_challenge.books_read,
            'progress_percentage': round(progress_percentage, 2),
            'start_date': challenge.start_date,
            'end_date': challenge.end_date,
            'days_remaining': max(0, (challenge.end_date - today).days),
            'completed': user_challenge.completed,
            'completed_date': user_challenge.completed_date
        })
    
    return Response(challenge_data)

# Reading streak related views
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_reading_streak(request):
    """Get the current user's reading streak"""
    user = request.user
    streak, created = ReadingStreak.objects.get_or_create(
        user=user,
        defaults={'current_streak': 0, 'longest_streak': 0}
    )
    
    # Check if streak is still active (last read within the past day)
    if streak.last_read_date:
        days_since_last_read = (timezone.now().date() - streak.last_read_date).days
        is_active = days_since_last_read <= 1
    else:
        is_active = False
    
    return Response({
        'current_streak': streak.current_streak,
        'longest_streak': streak.longest_streak,
        'last_read_date': streak.last_read_date,
        'is_active': is_active
    })

# Leaderboard view
@api_view(['GET'])
def get_leaderboard(request):
    """Get the top users sorted by points"""
    top_users = UserPoints.objects.select_related('user').order_by('-total_points')[:10]
    
    leaderboard_data = [{
        'username': entry.user.username,
        'level': entry.level,
        'total_points': entry.total_points,
        # Count achievements
        'achievements': UserAchievement.objects.filter(user=entry.user).count()
    } for entry in top_users]
    
    return Response(leaderboard_data)

# Process achievement for finishing a book
def process_finished_book_achievements(user):
    """Check and award achievements related to finishing books"""
    # Count finished books
    finished_books_count = UserBookStatus.objects.filter(user=user, status='FINISHED').count()
    
    # Define achievement thresholds
    achievement_thresholds = [
        (1, "First Book", "Finished reading your first book", 10),
        (5, "Bookworm", "Finished reading 5 books", 20),
        (10, "Book Enthusiast", "Finished reading 10 books", 30),
        (25, "Bibliophile", "Finished reading 25 books", 50),
        (50, "Book Master", "Finished reading 50 books", 100),
        (100, "Literary Legend", "Finished reading 100 books", 200)
    ]
    
    # Check each threshold and award achievements
    for count, name, description, points in achievement_thresholds:
        if finished_books_count >= count:
            # Try to get the achievement or create it if it doesn't exist
            achievement, created = Achievement.objects.get_or_create(
                name=name,
                defaults={
                    'description': description,
                    'points': points
                }
            )
            
            # Award the achievement if the user doesn't have it yet
            user_achievement, achievement_created = UserAchievement.objects.get_or_create(
                user=user,
                achievement=achievement
            )
            
            # If this is a new achievement for the user, award points
            if achievement_created:
                award_points(user, achievement.points, f"Earned achievement: {achievement.name}")

# EXTENDING EXISTING VIEW FUNCTIONS

# Extend update_book_status to integrate with gamification
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def update_book_status_with_gamification(request, google_books_id):
    """Update a book's status with gamification elements"""
    # Keep the original function logic
    response = update_book_status(request, google_books_id)
    
    # If the update was successful and the new status is 'FINISHED'
    if response.status_code == status.HTTP_200_OK and request.data.get('status') == 'FINISHED':
        user = request.user
        
        # Update reading streak
        streak, created = ReadingStreak.objects.get_or_create(
            user=user,
            defaults={'current_streak': 0, 'longest_streak': 0}
        )
        
        today = timezone.now().date()
        
        # If this is the first book or it's been more than a day since the last book
        if streak.last_read_date is None or (today - streak.last_read_date).days > 1:
            streak.current_streak = 1
        # If the user finished a book today or yesterday, increment the streak
        elif (today - streak.last_read_date).days <= 1 and streak.last_read_date != today:
            streak.current_streak += 1
        
        # Update longest streak if current is higher
        if streak.current_streak > streak.longest_streak:
            streak.longest_streak = streak.current_streak
        
        streak.last_read_date = today
        streak.save()
        
        # Award points for finishing the book
        book = Book.objects.get(google_books_id=google_books_id)
        award_points(user, 10, f"Finished reading: {book.title}")
        
        # Process achievements
        process_finished_book_achievements(user)
        
        # Update challenges progress
        active_challenges = UserChallenge.objects.filter(
            user=user,
            completed=False,
            challenge__start_date__lte=today,
            challenge__end_date__gte=today
        )
        
        for user_challenge in active_challenges:
            user_challenge.books_read += 1
            
            # Check if challenge is completed
            if user_challenge.books_read >= user_challenge.challenge.target_books:
                user_challenge.completed = True
                user_challenge.completed_date = today
                
                # Award points for completing the challenge
                award_points(
                    user, 
                    user_challenge.challenge.target_books * 5, 
                    f"Completed challenge: {user_challenge.challenge.name}"
                )
                
                # Create a challenge completion achievement
                achievement, created = Achievement.objects.get_or_create(
                    name=f"Challenge: {user_challenge.challenge.name}",
                    defaults={
                        'description': f"Completed the {user_challenge.challenge.name} challenge",
                        'points': user_challenge.challenge.target_books * 5
                    }
                )
                
                UserAchievement.objects.get_or_create(user=user, achievement=achievement)
            
            user_challenge.save()
        
        # Add gamification data to the response
        updated_response_data = response.data.copy()
        updated_response_data.update({
            'gamification': {
                'points_earned': 10,
                'current_streak': streak.current_streak,
                'challenges_updated': active_challenges.count()
            }
        })
        
        return Response(updated_response_data, status=response.status_code)
    
    return response

# Extend create_book_review to award points for reviews
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_book_review_with_gamification(request):
    """Create a book review and award points"""
    # Keep the original function logic
    response = create_book_review(request)
    
    # If the review was created successfully
    if response.status_code == status.HTTP_201_CREATED:
        user = request.user
        
        # Award points for writing a review
        award_points(user, 5, "Wrote a book review")
        
        # Check for review count achievements
        review_count = Review.objects.filter(user=user).count()
        
        # Define achievement thresholds for reviews
        review_achievements = [
            (1, "First Review", "Wrote your first book review", 5),
            (5, "Reviewer", "Wrote 5 book reviews", 15),
            (10, "Critic", "Wrote 10 book reviews", 25),
            (25, "Expert Reviewer", "Wrote 25 book reviews", 50),
            (50, "Professional Critic", "Wrote 50 book reviews", 100)
        ]
        
        # Check each threshold and award achievements
        for count, name, description, points in review_achievements:
            if review_count >= count:
                # Try to get the achievement or create it if it doesn't exist
                achievement, created = Achievement.objects.get_or_create(
                    name=name,
                    defaults={
                        'description': description,
                        'points': points
                    }
                )
                
                # Award the achievement if the user doesn't have it yet
                user_achievement, achievement_created = UserAchievement.objects.get_or_create(
                    user=user,
                    achievement=achievement
                )
                
                # If this is a new achievement for the user, award points
                if achievement_created:
                    award_points(user, achievement.points, f"Earned achievement: {achievement.name}")
        
        # Add gamification data to the response
        updated_response_data = response.data.copy()
        updated_response_data.update({
            'gamification': {
                'points_earned': 5,
                'total_reviews': review_count
            }
        })
        
        return Response(updated_response_data, status=response.status_code)
    
    return response

# Extend add_favorite to award points for adding favorites
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def add_favorite_with_gamification(request):
    """Add a book to favorites and award points"""
    # Keep the original function logic
    response = add_favorite(request)
    
    # If the favorite was added successfully
    if response.status_code == status.HTTP_200_OK:
        user = request.user
        
        # Award points for adding a favorite
        award_points(user, 2, "Added a book to favorites")
        
        # Check for favorites count achievements
        favorites_count = Favorite.objects.filter(user=user).count()
        
        # Define achievement thresholds for favorites
        favorite_achievements = [
            (5, "Collector", "Added 5 books to favorites", 10),
            (25, "Enthusiast", "Added 25 books to favorites", 25),
            (50, "Book Lover", "Added 50 books to favorites", 50)
        ]
        
        # Check each threshold and award achievements
        for count, name, description, points in favorite_achievements:
            if favorites_count >= count:
                # Try to get the achievement or create it if it doesn't exist
                achievement, created = Achievement.objects.get_or_create(
                    name=name,
                    defaults={
                        'description': description,
                        'points': points
                    }
                )
                
                # Award the achievement if the user doesn't have it yet
                user_achievement, achievement_created = UserAchievement.objects.get_or_create(
                    user=user,
                    achievement=achievement
                )
                
                # If this is a new achievement for the user, award points
                if achievement_created:
                    award_points(user, achievement.points, f"Earned achievement: {achievement.name}")
        
        # Add gamification data to the response
        updated_response_data = response.data.copy()
        updated_response_data.update({
            'gamification': {
                'points_earned': 2,
                'total_favorites': favorites_count
            }
        })
        
        return Response(updated_response_data, status=response.status_code)
    
    return response

# Initialize challenges (admin function)
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_challenge(request):
    """Create a new reading challenge (admin only)"""
    user = request.user
    
    # Check if user is admin
    if not user.is_staff:
        return Response({'error': 'Only administrators can create challenges'}, 
                       status=status.HTTP_403_FORBIDDEN)
    
    name = request.data.get('name')
    description = request.data.get('description')
    target_books = request.data.get('target_books')
    start_date = request.data.get('start_date')
    end_date = request.data.get('end_date')
    
    # Validate required fields
    if not all([name, description, target_books, start_date, end_date]):
        return Response({'error': 'All fields are required'}, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        # Create the challenge
        challenge = ReadingChallenge.objects.create(
            name=name,
            description=description,
            target_books=target_books,
            start_date=start_date,
            end_date=end_date
        )
        
        return Response({
            'id': challenge.id,
            'name': challenge.name,
            'description': challenge.description,
            'target_books': challenge.target_books,
            'start_date': challenge.start_date,
            'end_date': challenge.end_date
        }, status=status.HTTP_201_CREATED)
        
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
