from django.test import TestCase, Client
from django.contrib.auth.models import User
from django.urls import reverse
from .models import Book, Rating, Review
from rest_framework.test import APIClient
from rest_framework import status

class BookSystemTest(TestCase):
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
        
    def test_book_creation_and_rating(self):
        self.client.force_authenticate(user=self.user)
        
        self.assertEqual(self.book.title, 'Test Book')
        self.assertEqual(self.book.author, 'Test Author')
        
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

class BookSearchBehaviorTest(TestCase):
    def setUp(self):
        self.client = Client()
    
    def test_book_search_behavior(self):
        search_query = 'python programming'
        response = self.client.get(
            reverse('search_books'),
            {'q': search_query, 'page': 1, 'filterType': 'title'}
        )
        
        self.assertEqual(response.status_code, 200)
        response_data = response.json()
        
        self.assertIn('books', response_data)
        self.assertIn('page', response_data)
        
        if response_data['books']:
            first_book = response_data['books'][0]
            required_fields = ['id', 'title', 'author', 'description', 'image']
            for field in required_fields:
                self.assertIn(field, first_book)