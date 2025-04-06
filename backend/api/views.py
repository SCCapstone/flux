from django.conf import settings
from django.contrib.auth.models import User
from django.contrib.auth import authenticate, login, logout
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.core.files.storage import default_storage
from django.db import models
import json
from django.db.models import Q

import requests
import base64
import os
import time
from django.utils import timezone

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError

from .models import (
    Profile, Rating, Book, Favorite, Review, UserBookStatus, UserFollow,
    Readlist, ReadlistBook, Achievement, UserAchievement, ReadingChallenge,
    UserChallenge, UserPoints, PointsHistory, ReadingStreak
)
from .serializers import ReadlistSerializer

GOOGLE_BOOKS_API_KEY = 'AIzaSyAOo9-IH2Ox7xDLtPt58X-I7J6_174tA5s'

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
                        'google_books_id': item.get('id'),
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
    book_id = request.data.get('google_books_id')
    rating_value = request.data.get('rating')

    if not book_id or not rating_value:
        return Response({'error': 'Book ID and rating are required.'}, status=status.HTTP_400_BAD_REQUEST)

    if not (1 <= int(rating_value) <= 5):
        return Response({'error': 'Rating must be between 1 and 5.'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        book = Book.objects.get(google_books_id=book_id)
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
        reviews = Review.objects.filter(book=book, parent=None)
        reviews_data = []

        def get_review_data(review):
            review_data = {
                'id': review.id,
                'user': {
                    'id': review.user.id,
                    'username': review.user.username
                },
                'review_text': review.review_text,
                'added_date': review.added_date,
                'updated_at': review.updated_at,
                'replies': []
            }
            
            replies = review.replies.all()
            for reply in replies:
                review_data['replies'].append(get_review_data(reply))

            return review_data
        
        for review in reviews:
            reviews_data.append(get_review_data(review))
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
            'updated_at': review.updated_at,
            'parent': None
        }, status=status.HTTP_201_CREATED)
        
    except Book.DoesNotExist:
        return Response(
            {'error': 'Book not found.'}, 
            status=status.HTTP_404_NOT_FOUND
        )

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_reply(request, review_id):
    """
    Handles creating a reply to an existing review.
    """
    try:
        review_text = request.data.get('review_text')

        if not review_text:
            return Response({'error': 'Reply text is required.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            parent_review = Review.objects.get(id=review_id)
        except Review.DoesNotExist:
            return Response({'error': 'Parent review not found.'}, status=status.HTTP_404_NOT_FOUND)

        reply = Review.objects.create(
            user=request.user,
            book=parent_review.book,  # Same book as the parent review
            review_text=review_text,
            parent=parent_review
        )

        return Response({
            'id': reply.id,
            'user': {
                'id': reply.user.id,
                'username': reply.user.username
            },
            'review_text': reply.review_text,
            'added_date': reply.added_date,
            'updated_at': reply.updated_at,
            'parent': review_id
        }, status=status.HTTP_201_CREATED)

    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

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
        review.replies.all().delete()
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
    """Add a book to the 'Favorites' readlist and award points + achievements inline"""
    book_data = request.data
    user = request.user

    # Ensure the book exists or create it
    book, created = Book.objects.get_or_create(
        google_books_id=book_data['google_books_id'],
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
            # Award 2 base points for adding a favorite
            award_points(user, 2, "Added a book to favorites")

            # Get current favorite count
            favorites_count = favorites_readlist.books.count()
            achievement_messages = []

            # Check each threshold
            if favorites_count >= 5:
                achievement, _ = Achievement.objects.get_or_create(
                    name="Collector",
                    defaults={
                        "description": "Added 5 books to favorites",
                        "points": 10
                    }
                )
                user_achievement, created = UserAchievement.objects.get_or_create(user=user, achievement=achievement)
                if created:
                    award_points(user, achievement.points, f"Earned achievement: {achievement.name}")
                    achievement_messages.append("🏆 Collector: Added 5 books to favorites!")

            if favorites_count >= 25:
                achievement, _ = Achievement.objects.get_or_create(
                    name="Enthusiast",
                    defaults={
                        "description": "Added 25 books to favorites",
                        "points": 25
                    }
                )
                user_achievement, created = UserAchievement.objects.get_or_create(user=user, achievement=achievement)
                if created:
                    award_points(user, achievement.points, f"Earned achievement: {achievement.name}")
                    achievement_messages.append("🏆 Enthusiast: Added 25 books to favorites!")

            if favorites_count >= 50:
                achievement, _ = Achievement.objects.get_or_create(
                    name="Book Lover",
                    defaults={
                        "description": "Added 50 books to favorites",
                        "points": 50
                    }
                )
                user_achievement, created = UserAchievement.objects.get_or_create(user=user, achievement=achievement)
                if created:
                    award_points(user, achievement.points, f"Earned achievement: {achievement.name}")
                    achievement_messages.append("🏆 Book Lover: Added 50 books to favorites!")

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
    book_id = request.data.get('google_books_id')
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
                # First try using primary_isbn13 or primary_isbn10 for a precise match
                isbn = book.get('primary_isbn13') or book.get('primary_isbn10')
                google_book_info = {}
                
                if isbn:
                    google_url = f"https://www.googleapis.com/books/v1/volumes?q=isbn:{isbn}&key={GOOGLE_BOOKS_API_KEY}"
                    google_response = requests.get(google_url)
                    google_data = google_response.json()
                    
                    if google_response.status_code == 200 and google_data.get('items'):
                        volume_info = google_data['items'][0]['volumeInfo']
                        google_book_info = {
                            'google_books_id': google_data['items'][0]['id'],
                            'description': volume_info.get('description', ''),
                            'categories': volume_info.get('categories', []),
                            'image': volume_info.get('imageLinks', {}).get('thumbnail', '')
                        }
                
                # Fallback to title+author search only if ISBN search failed or no ISBN
                if not google_book_info:
                    google_query = f"{book['title']} {book['author']}"
                    google_url = f"https://www.googleapis.com/books/v1/volumes?q={google_query}&key={GOOGLE_BOOKS_API_KEY}"
                    google_response = requests.get(google_url)
                    google_data = google_response.json()
                    
                    if google_response.status_code == 200 and google_data.get('items'):
                        volume_info = google_data['items'][0]['volumeInfo']
                        google_book_info = {
                            'google_books_id': google_data['items'][0]['id'],
                            'description': volume_info.get('description', ''),
                            'categories': volume_info.get('categories', []),
                            'image': volume_info.get('imageLinks', {}).get('thumbnail', '')
                        }

                # Use NYT image if Google Books doesn't have one or has an invalid one
                book_image = book['book_image']
                if google_book_info.get('image'):
                    # Validate Google image URL before using it
                    google_image = google_book_info['image']
                    if google_image and len(google_image) > 10:  # Basic validation
                        book_image = google_image

                # Ensure all image URLs use https
                if book_image and book_image.startswith('http:'):
                    book_image = book_image.replace('http:', 'https:')

                books.append({
                    'rank': book['rank'],
                    'title': book['title'],
                    'author': book['author'],
                    'description': google_book_info.get('description', book['description']),
                    'google_books_id': google_book_info.get('google_books_id', ''),
                    'genre': ', '.join(google_book_info.get('categories', [])),
                    'image': book_image,
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

# User Following System Views

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def follow_user(request):
    """Follow a user"""
    username = request.data.get('username')
    
    if not username:
        return Response({'error': 'Username is required'}, status=status.HTTP_400_BAD_REQUEST)
        
    if username == request.user.username:
        return Response({'error': 'You cannot follow yourself'}, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        # Print debug information
        print(f"User {request.user.username} is trying to follow {username}")
        
        user_to_follow = User.objects.get(username=username)
        print(f"Found user to follow: {user_to_follow.username} (ID: {user_to_follow.id})")
        
        # Check if already following
        existing_follow = UserFollow.objects.filter(
            follower=request.user,
            followed=user_to_follow
        ).exists()
        
        if existing_follow:
            print(f"User {request.user.username} is already following {username}")
            return Response({
                'message': f'Already following {username}',
                'is_following': True
            })
            
        # Create the follow relationship
        follow = UserFollow.objects.create(
            follower=request.user,
            followed=user_to_follow
        )
        print(f"Created follow relationship: {follow.id}")
            
        return Response({
            'message': f'Now following {username}',
            'is_following': True
        })
    except User.DoesNotExist:
        print(f"User not found: {username}")
        return Response({'error': f"User '{username}' not found"}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        print(f"Error following user: {str(e)}")
        return Response({'error': f"Error following user: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def unfollow_user(request):
    """Unfollow a user"""
    username = request.data.get('username')
    
    if not username:
        return Response({'error': 'Username is required'}, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        # Print debug information
        print(f"User {request.user.username} is trying to unfollow {username}")
        
        user_to_unfollow = User.objects.get(username=username)
        print(f"Found user to unfollow: {user_to_unfollow.username} (ID: {user_to_unfollow.id})")
        
        # Find and delete the follow relationship
        follow = UserFollow.objects.filter(
            follower=request.user,
            followed=user_to_unfollow
        )
        
        if follow.exists():
            follow_count = follow.count()
            follow.delete()
            print(f"Deleted {follow_count} follow relationship(s)")
            return Response({
                'message': f'Unfollowed {username}',
                'is_following': False
            })
        else:
            print(f"User {request.user.username} was not following {username}")
            return Response({
                'message': f'You were not following {username}',
                'is_following': False
            })
    except User.DoesNotExist:
        print(f"User not found: {username}")
        return Response({'error': f"User '{username}' not found"}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        print(f"Error unfollowing user: {str(e)}")
        return Response({'error': f"Error unfollowing user: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def check_follow_status(request, username):
    """Check if the authenticated user is following the specified user"""
    try:
        # Print debug information
        print(f"Checking if {request.user.username} is following {username}")
        
        user_to_check = User.objects.get(username=username)
        is_following = UserFollow.objects.filter(
            follower=request.user,
            followed=user_to_check
        ).exists()
        
        print(f"Follow status: {is_following}")
        
        return Response({'is_following': is_following})
    except User.DoesNotExist:
        print(f"User not found: {username}")
        return Response({'error': f"User '{username}' not found"}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        print(f"Error checking follow status: {str(e)}")
        return Response({'error': f"Error checking follow status: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
def get_followers(request, username):
    """Get a list of users who follow the specified user"""
    try:
        user = User.objects.get(username=username)
        followers = UserFollow.objects.filter(followed=user).select_related('follower')
        
        followers_data = []
        for follow in followers:
            try:
                profile = Profile.objects.get(user=follow.follower)
                profile_image = request.build_absolute_uri(profile.profile_image.url) if profile.profile_image else None
            except Profile.DoesNotExist:
                profile_image = None
                
            followers_data.append({
                'username': follow.follower.username,
                'profile_image': profile_image,
                'follow_date': follow.created_at
            })
            
        return Response(followers_data)
    except User.DoesNotExist:
        return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)

@api_view(['GET'])
def get_following(request, username):
    """Get a list of users that the specified user follows"""
    try:
        user = User.objects.get(username=username)
        following = UserFollow.objects.filter(follower=user).select_related('followed')
        
        following_data = []
        for follow in following:
            try:
                profile = Profile.objects.get(user=follow.followed)
                profile_image = request.build_absolute_uri(profile.profile_image.url) if profile.profile_image else None
            except Profile.DoesNotExist:
                profile_image = None
                
            following_data.append({
                'username': follow.followed.username,
                'profile_image': profile_image,
                'follow_date': follow.created_at
            })
            
        return Response(following_data)
    except User.DoesNotExist:
        return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)

@api_view(['GET'])
def get_user_profile(request, username):
    """Get a user's profile with additional follow statistics"""
    try:
        # Print debug information
        print(f"Fetching profile for username: {username}")
        
        # Get the user
        user = User.objects.get(username=username)
        print(f"User found: {user.username} (ID: {user.id})")
        
        # Get or create profile
        try:
            profile = Profile.objects.get(user=user)
        except Profile.DoesNotExist:
            profile = Profile.objects.create(user=user)
            print(f"Created new profile for user {username}")
        
        # Count followers and following
        followers_count = UserFollow.objects.filter(followed=user).count()
        following_count = UserFollow.objects.filter(follower=user).count()
        print(f"Followers: {followers_count}, Following: {following_count}")
        
        # Get recent reviews by the user
        recent_reviews = Review.objects.filter(user=user).order_by('-added_date')[:5]
        reviews_data = []
        
        for review in recent_reviews:
            reviews_data.append({
                'id': review.id,
                'book': {
                    'id': review.book.id,
                    'google_books_id': review.book.google_books_id,
                    'title': review.book.title,
                    'author': review.book.author,
                    'image': review.book.image
                },
                'review_text': review.review_text,
                'added_date': review.added_date
            })
        
        # Check if logged-in user is following this profile
        is_following = False
        if request.user.is_authenticated:
            is_following = UserFollow.objects.filter(
                follower=request.user,
                followed=user
            ).exists()
        
        # Prepare response data
        response_data = {
            'username': user.username,
            'email': user.email,  # Add email to the response
            'bio': profile.bio,
            'profile_image': request.build_absolute_uri(profile.profile_image.url) if profile.profile_image else None,
            'followers_count': followers_count,
            'following_count': following_count,
            'is_following': is_following,
            'recent_reviews': reviews_data
        }
        
        print(f"Successfully prepared profile data for {username}")
        return Response(response_data)
        
    except User.DoesNotExist:
        print(f"User not found: {username}")
        return Response({'error': f"User '{username}' not found"}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        print(f"Error fetching profile: {str(e)}")
        return Response({'error': f"Error fetching profile: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
def search_users(request):
    """Search for users by username"""
    query = request.GET.get('q', '')
    
    if not query:
        return Response([])
    
    users = User.objects.filter(username__icontains=query)[:20]  # Limit to 20 results
    
    results = []
    for user in users:
        try:
            profile = Profile.objects.get(user=user)
            profile_image = request.build_absolute_uri(profile.profile_image.url) if profile.profile_image else None
            bio = profile.bio
        except Profile.DoesNotExist:
            profile_image = None
            bio = ''
            
        results.append({
            'username': user.username,
            'profile_image': profile_image,
            'bio': bio
        })
        
    return Response(results)

# Readlist views
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

# Gamification views
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

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def initialize_sample_challenges(request):
    """Initialize sample reading challenges for the system"""
    
    # Sample challenge data
    sample_challenges = [
        {
            'name': 'Summer Reading Challenge',
            'description': 'Read 10 books during summer vacation',
            'target_books': 10,
            'start_date': '2025-06-01',
            'end_date': '2025-08-31',
        },
        {
            'name': 'Genre Explorer',
            'description': 'Read books from 5 different genres',
            'target_books': 5,
            'start_date': '2025-03-01',
            'end_date': '2025-04-30',
        },
        {
            'name': 'Classics Marathon',
            'description': 'Read 3 classic literature books',
            'target_books': 3,
            'start_date': '2025-02-01',
            'end_date': '2025-05-01',
        }
    ]
    
    created_challenges = []
    
    for challenge_data in sample_challenges:
        # Check if this challenge already exists
        existing = ReadingChallenge.objects.filter(name=challenge_data['name']).first()
        if existing:
            created_challenges.append({
                'id': existing.id,
                'name': existing.name,
                'description': existing.description,
                'already_existed': True
            })
            continue
            
        # Create the challenge
        challenge = ReadingChallenge.objects.create(
            name=challenge_data['name'],
            description=challenge_data['description'],
            target_books=challenge_data['target_books'],
            start_date=challenge_data['start_date'],
            end_date=challenge_data['end_date']
        )
        
        created_challenges.append({
            'id': challenge.id,
            'name': challenge.name,
            'description': challenge.description,
            'already_existed': False
        })
    
    return Response({
        'message': f'Successfully initialized {len(created_challenges)} sample challenges',
        'challenges': created_challenges
    }, status=status.HTTP_201_CREATED)

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
            # Try to get the achievement or create it if it doesn’t exist
            achievement, created = Achievement.objects.get_or_create(
                name=name,
                defaults={
                    'description': description,
                    'points': points
                }
            )
            
            # Award the achievement if the user doesn’t have it yet
            user_achievement, achievement_created = UserAchievement.objects.get_or_create(
                user=user,
                achievement=achievement
            )
            
            # If this is a new achievement for the user, award points
            if achievement_created:
                award_points(user, achievement.points, f"Earned achievement: {achievement.name}")

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

    # Track if added to favorites
    added_to_favorites = False
    user = request.user

    # Handle ReadlistBook relationships
    for readlist in Readlist.objects.filter(user=request.user):
        if readlist.id in readlist_ids:
            obj, created = ReadlistBook.objects.get_or_create(readlist=readlist, book=book)
            if created and readlist.is_favorites:
                added_to_favorites = True
        else:
            ReadlistBook.objects.filter(readlist=readlist, book=book).delete()

    # Gamification logic if added to favorites
    gamification_data = {}
    if added_to_favorites:
        award_points(user, 2, "Added a book to favorites")

        favorites_readlist = Readlist.objects.get(user=user, is_favorites=True)
        favorites_count = favorites_readlist.books.count()
        achievement_messages = []

        if favorites_count == 5:
            achievement_messages.append("🏆 Collector: Added 5 books to favorites!")
        elif favorites_count == 25:
            achievement_messages.append("🏆 Enthusiast: Added 25 books to favorites!")
        elif favorites_count == 50:
            achievement_messages.append("🏆 Book Lover: Added 50 books to favorites!")

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
        "message": "Book readlist associations updated",
        "gamification": gamification_data
    }, status=status.HTTP_200_OK)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_readlist_books(request, readlist_id):
    """Retrieve books from a specific readlist"""
    try:
        readlist = Readlist.objects.filter(
            Q(user=request.user) | Q(shared_with=request.user),
            id=readlist_id
        ).first()

        if not readlist:
            return Response({"error": "Readlist not found or access denied"}, status=status.HTTP_404_NOT_FOUND)

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

        return Response({"name": readlist.name,"owner": readlist.user.username, "books": book_data}, status=status.HTTP_200_OK)

    except Readlist.DoesNotExist:
        return Response({"error": "Readlist not found"}, status=status.HTTP_404_NOT_FOUND)
    
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_shared_readlists(request):
    """Retrieve all readlists shared with the current user."""
    user = request.user
    shared_readlists = Readlist.objects.filter(shared_with=user)

    readlist_data = [
        {
            "id": readlist.id,
            "name": readlist.name,
            "owner": readlist.user.username,
            "books": [
                {
                    "id": book.id,
                    "google_books_id": book.google_books_id,
                    "title": book.title,
                    "author": book.author,
                    "genre": book.genre,
                    "year": book.year,
                    "image": book.image,
                }
                for book in readlist.books.all()
            ],
        }
        for readlist in shared_readlists
    ]

    return Response(readlist_data, status=status.HTTP_200_OK)

    
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def share_readlist(request):
    """Share a readlist with another user."""
    user = request.user
    readlist_id = request.data.get('readlist_id')
    target_username = request.data.get('target_username')  # Who to share with

    if not readlist_id or not target_username:
        return Response({'error': 'Readlist ID and target username are required'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        readlist = Readlist.objects.get(id=readlist_id, user=user)
        target_user = User.objects.get(username=target_username)

        # Prevent duplicate sharing
        if readlist.shared_with.filter(id=target_user.id).exists():
            return Response({'message': 'Readlist already shared with this user.'}, status=status.HTTP_200_OK)

        # Add the user to shared_with
        readlist.shared_with.add(target_user)
        readlist.save()

        return Response({'message': f'Readlist "{readlist.name}" shared with {target_username}.'}, status=status.HTTP_200_OK)

    except Readlist.DoesNotExist:
        return Response({'error': 'Readlist not found or you do not have permission to share it.'}, status=status.HTTP_404_NOT_FOUND)
    except User.DoesNotExist:
        return Response({'error': 'Target user not found.'}, status=status.HTTP_404_NOT_FOUND)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def unshare_readlist(request):
    """Unshare a readlist from a specific user."""
    user = request.user
    readlist_id = request.data.get('readlist_id')
    target_username = request.data.get('target_username')  # Remove this user

    if not readlist_id or not target_username:
        return Response({'error': 'Readlist ID and target username are required'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        readlist = Readlist.objects.get(id=readlist_id, user=user)
        target_user = User.objects.get(username=target_username)

        if not readlist.shared_with.filter(id=target_user.id).exists():
            return Response({'error': 'This user does not have access to the readlist.'}, status=status.HTTP_400_BAD_REQUEST)

        # Remove the user
        readlist.shared_with.remove(target_user)
        readlist.save()

        return Response({'message': f'Readlist "{readlist.name}" is no longer shared with {target_username}.'}, status=status.HTTP_200_OK)

    except Readlist.DoesNotExist:
        return Response({'error': 'Readlist not found or you do not have permission to unshare it.'}, status=status.HTTP_404_NOT_FOUND)
    except User.DoesNotExist:
        return Response({'error': 'Target user not found.'}, status=status.HTTP_404_NOT_FOUND)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def rename_readlist(request):
    readlist_id = request.data.get('readlist_id')
    new_name = request.data.get('new_name', '').strip()

    if not readlist_id or not new_name:
        return Response({'error': 'Readlist ID and new name required'}, status=400)

    try:
        readlist = Readlist.objects.get(id=readlist_id, user=request.user)
        readlist.name = new_name
        readlist.save()
        return Response({'message': 'Readlist renamed', 'name': readlist.name})
    except Readlist.DoesNotExist:
        return Response({'error': 'Readlist not found'}, status=404)

@api_view(['GET', 'DELETE'])
@permission_classes([IsAuthenticated])
def readlist_detail(request, readlist_id):
    user = request.user

    try:
        readlist = Readlist.objects.filter(
            Q(user=user) | Q(shared_with=user),
            id=readlist_id
        ).first()

        if not readlist:
            return Response({"error": "Readlist not found or access denied"}, status=404)

        if request.method == 'GET':
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
            return Response({"name": readlist.name, "owner": readlist.user.username, "books": book_data})

        elif request.method == 'DELETE':
            if readlist.is_favorites:
                return Response({"error": "Favorites readlist cannot be deleted."}, status=403)

            readlist.delete()
            return Response({"message": "Readlist deleted"}, status=204)

    except Exception as e:
        return Response({"error": str(e)}, status=500)

