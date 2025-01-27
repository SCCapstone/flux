from django.test import TestCase, Client
from django.contrib.auth.models import User
from django.urls import reverse
from .models import Book, Favorite, Rating
from rest_framework.test import APIClient
from rest_framework import status

class BookSearchTest(TestCase):
    def setUp(self):
        self.client = Client()
    
    def test_book_search(self):
        response = self.client.get(
            reverse('search_books'),
            {'q': 'python programming', 'page': 1, 'filterType': 'title'}
        )
        
        self.assertEqual(response.status_code, 200)
        data = response.json()
        
        self.assertIn('books', data)
        self.assertIn('page', data)
        
        if data['books']:
            first_book = data['books'][0]
            expected_fields = ['id', 'title', 'author', 'description', 'image', 'genre', 'year']
            for field in expected_fields:
                self.assertIn(field, first_book)

class UserAuthTest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.register_data = {
            'username': 'testuser',
            'password': 'testpass123',
            'email': 'test@example.com'
        }
    
    def test_user_registration_and_login(self):
        response = self.client.post(reverse('register'), self.register_data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('token', response.data)
        self.assertIn('user', response.data)
        
        login_data = {
            'username': 'testuser',
            'password': 'testpass123'
        }
        response = self.client.post(reverse('login'), login_data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('token', response.data)
        self.assertIn('user', response.data)

class BookRatingTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            password='testpass123',
            email='test@example.com'
        )
        
        self.book = Book.objects.create(
            google_books_id='test123',
            title='Test Book',
            author='Test Author',
            description='A test book description',
            genre='Fiction'
        )
        
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)
        
    def test_book_rating(self):
        rating_data = {
            'book_id': self.book.id,
            'rating': 4
        }
        
        response = self.client.post(reverse('rate_book'), rating_data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        book_rating = Rating.objects.get(book=self.book, user=self.user)
        self.assertEqual(book_rating.rating, 4)
        
        response = self.client.get(
            reverse('get_book_ratings', kwargs={'google_books_id': self.book.google_books_id})
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['average_rating'], 4.0)
        self.assertEqual(response.data['total_ratings'], 1)