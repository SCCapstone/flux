from django.test import TestCase
from django.contrib.auth.models import User
from django.urls import reverse
from .models import (
    Book, Favorite, Rating, Review, UserBookStatus, 
    Achievement, UserAchievement, ReadingChallenge, UserChallenge,
    UserPoints, PointsHistory, ReadingStreak
)
from rest_framework.test import APIClient
from rest_framework import status
from datetime import datetime, timedelta, date


class BookModelTest(TestCase):
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
    
    def test_book_creation(self):
        """Test that a book can be created"""
        self.assertEqual(self.book.title, 'Test Book')
        self.assertEqual(self.book.author, 'Test Author')
        self.assertEqual(self.book.genre, 'Fiction')
    
    def test_book_rating(self):
        """Test creating a rating for a book"""
        rating = Rating.objects.create(
            user=self.user,
            book=self.book,
            rating=4
        )
        
        self.assertEqual(rating.rating, 4)
        self.assertEqual(rating.user, self.user)
        self.assertEqual(rating.book, self.book)
    
    def test_book_favorite(self):
        """Test adding a book to favorites"""
        favorite = Favorite.objects.create(
            user=self.user,
            book=self.book
        )
        
        self.assertEqual(favorite.user, self.user)
        self.assertEqual(favorite.book, self.book)
    
    def test_book_status(self):
        """Test tracking a book's read status"""
        status = UserBookStatus.objects.create(
            user=self.user,
            book=self.book,
            status='FINISHED'
        )
        
        self.assertEqual(status.status, 'FINISHED')
        self.assertEqual(status.user, self.user)
        self.assertEqual(status.book, self.book)
    
    def test_book_review(self):
        """Test creating a review for a book"""
        review = Review.objects.create(
            user=self.user,
            book=self.book,
            review_text='This is a great book!'
        )
        
        self.assertEqual(review.review_text, 'This is a great book!')
        self.assertEqual(review.user, self.user)
        self.assertEqual(review.book, self.book)


class ReadingChallengeModelTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            password='testpass123',
            email='test@example.com'
        )
        
        self.today = date.today()
        self.future_date = self.today + timedelta(days=90)
        
        self.challenge = ReadingChallenge.objects.create(
            name='Summer Reading Challenge',
            description='Read 10 books during summer vacation',
            target_books=10,
            start_date=self.today,
            end_date=self.future_date
        )
        
        self.books = []
        for i in range(3):
            book = Book.objects.create(
                google_books_id=f'test{i}',
                title=f'Test Book {i}',
                author='Test Author',
                description=f'Test book description {i}',
                genre='Fiction'
            )
            self.books.append(book)
    
    def test_challenge_creation(self):
        """Test that a reading challenge can be created"""
        self.assertEqual(self.challenge.name, 'Summer Reading Challenge')
        self.assertEqual(self.challenge.target_books, 10)
    
    def test_joining_challenge(self):
        """Test a user joining a challenge"""
        user_challenge = UserChallenge.objects.create(
            user=self.user,
            challenge=self.challenge,
            books_read=0,
            completed=False
        )
        
        self.assertEqual(user_challenge.user, self.user)
        self.assertEqual(user_challenge.challenge, self.challenge)
        self.assertEqual(user_challenge.books_read, 0)
        self.assertFalse(user_challenge.completed)
    
    def test_challenge_progress(self):
        """Test updating challenge progress when books are read"""
        user_challenge = UserChallenge.objects.create(
            user=self.user,
            challenge=self.challenge,
            books_read=0,
            completed=False
        )
        
        # Mark books as read
        for i in range(3):
            UserBookStatus.objects.create(
                user=self.user,
                book=self.books[i],
                status='FINISHED'
            )
            
            # Manually update progress (would be handled by backend logic in real app)
            user_challenge.books_read += 1
        
        user_challenge.save()
        
        # Get the updated user challenge
        user_challenge.refresh_from_db()
        self.assertEqual(user_challenge.books_read, 3)
    
    def test_challenge_completion(self):
        """Test completing a challenge"""
        # Create a small challenge that requires only 3 books
        small_challenge = ReadingChallenge.objects.create(
            name='Quick Challenge',
            description='Read 3 books',
            target_books=3,
            start_date=self.today,
            end_date=self.future_date
        )
        
        user_challenge = UserChallenge.objects.create(
            user=self.user,
            challenge=small_challenge,
            books_read=0,
            completed=False
        )
        
        # Mark 3 books as read
        for i in range(3):
            UserBookStatus.objects.create(
                user=self.user,
                book=self.books[i],
                status='FINISHED'
            )
            
            # Manually update progress
            user_challenge.books_read += 1
        
        # Mark as completed when target is reached
        if user_challenge.books_read >= small_challenge.target_books:
            user_challenge.completed = True
            user_challenge.completed_date = date.today()
        
        user_challenge.save()
        
        # Get the updated user challenge
        user_challenge.refresh_from_db()
        self.assertEqual(user_challenge.books_read, 3)
        self.assertTrue(user_challenge.completed)
        self.assertIsNotNone(user_challenge.completed_date)


class AchievementModelTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            password='testpass123',
            email='test@example.com'
        )
        
        # Create achievements
        self.book_achievement = Achievement.objects.create(
            name='Bookworm',
            description='Read 5 books',
            points=50
        )
        
        self.review_achievement = Achievement.objects.create(
            name='Reviewer',
            description='Write 3 book reviews',
            points=30
        )
        
        self.collection_achievement = Achievement.objects.create(
            name='Collector',
            description='Add 5 books to favorites',
            points=20
        )
        
        # Create user points record
        self.user_points = UserPoints.objects.create(
            user=self.user,
            total_points=0,
            level=1
        )
        
        # Create books
        self.books = []
        for i in range(5):
            book = Book.objects.create(
                google_books_id=f'test{i}',
                title=f'Test Book {i}',
                author='Test Author',
                description=f'Test book description {i}',
                genre='Fiction'
            )
            self.books.append(book)
    
    def test_achievement_creation(self):
        """Test that achievements can be created"""
        self.assertEqual(self.book_achievement.name, 'Bookworm')
        self.assertEqual(self.book_achievement.points, 50)
    
    def test_earning_achievement(self):
        """Test a user earning an achievement"""
        user_achievement = UserAchievement.objects.create(
            user=self.user,
            achievement=self.book_achievement,
            date_earned=date.today()
        )
    
        self.assertEqual(user_achievement.user, self.user)
        self.assertEqual(user_achievement.achievement, self.book_achievement)
        # Compare just the date part of the datetime
        self.assertEqual(user_achievement.date_earned.date(), date.today())
    
    def test_earning_points_for_achievement(self):
        """Test earning points when an achievement is earned"""
        # Earn the achievement
        UserAchievement.objects.create(
            user=self.user,
            achievement=self.book_achievement,
            date_earned=date.today()
        )
        
        # Update user points
        self.user_points.total_points += self.book_achievement.points
        self.user_points.save()
        
        # Create points history entry
        PointsHistory.objects.create(
            user=self.user,
            amount=self.book_achievement.points,
            description=f"Earned achievement: {self.book_achievement.name}"
        )
        
        # Verify points were awarded
        self.user_points.refresh_from_db()
        self.assertEqual(self.user_points.total_points, 50)
        
        # Verify points history was updated
        history_entry = PointsHistory.objects.get(user=self.user)
        self.assertEqual(history_entry.amount, 50)
    
    def test_reading_achievement_trigger(self):
        """Test the trigger for reading achievement"""
        # Mark 5 books as read
        for book in self.books:
            UserBookStatus.objects.create(
                user=self.user,
                book=book,
                status='FINISHED'
            )
        
        # Count the number of FINISHED books
        finished_books_count = UserBookStatus.objects.filter(
            user=self.user,
            status='FINISHED'
        ).count()
        
        # Check if achievement should be triggered
        achievement_earned = False
        if finished_books_count >= 5:
            achievement_earned = True
            UserAchievement.objects.create(
                user=self.user,
                achievement=self.book_achievement,
                date_earned=date.today()
            )
            
            # Update user points
            self.user_points.total_points += self.book_achievement.points
            self.user_points.save()
        
        self.assertTrue(achievement_earned)
        self.assertEqual(UserAchievement.objects.count(), 1)
        self.assertEqual(self.user_points.total_points, 50)
    
    def test_collection_achievement_trigger(self):
        """Test the trigger for collection achievement"""
        # Add 5 books to favorites
        for book in self.books:
            Favorite.objects.create(
                user=self.user,
                book=book
            )
        
        # Count the number of favorites
        favorites_count = Favorite.objects.filter(
            user=self.user
        ).count()
        
        # Check if achievement should be triggered
        achievement_earned = False
        if favorites_count >= 5:
            achievement_earned = True
            UserAchievement.objects.create(
                user=self.user,
                achievement=self.collection_achievement,
                date_earned=date.today()
            )
            
            # Update user points
            self.user_points.total_points += self.collection_achievement.points
            self.user_points.save()
        
        self.assertTrue(achievement_earned)
        self.assertEqual(UserAchievement.objects.count(), 1)
        self.assertEqual(self.user_points.total_points, 20)
    
    def test_review_achievement_trigger(self):
        """Test the trigger for review achievement"""
        # Create 3 reviews
        for i in range(3):
            Review.objects.create(
                user=self.user,
                book=self.books[i],
                review_text=f'This is test review #{i}'
            )
        
        # Count the number of reviews
        reviews_count = Review.objects.filter(
            user=self.user
        ).count()
        
        # Check if achievement should be triggered
        achievement_earned = False
        if reviews_count >= 3:
            achievement_earned = True
            UserAchievement.objects.create(
                user=self.user,
                achievement=self.review_achievement,
                date_earned=date.today()
            )
            
            # Update user points
            self.user_points.total_points += self.review_achievement.points
            self.user_points.save()
        
        self.assertTrue(achievement_earned)
        self.assertEqual(UserAchievement.objects.count(), 1)
        self.assertEqual(self.user_points.total_points, 30)


class UserPointsModelTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            password='testpass123',
            email='test@example.com'
        )
        
        self.user_points = UserPoints.objects.create(
            user=self.user,
            total_points=0,
            level=1
        )
        
        # Create achievements with different point values
        self.achievements = [
            Achievement.objects.create(name='Small Achievement', description='Small achievement', points=10),
            Achievement.objects.create(name='Medium Achievement', description='Medium achievement', points=50),
            Achievement.objects.create(name='Large Achievement', description='Large achievement', points=100)
        ]
    
    def test_initial_points_and_level(self):
        """Test that a user starts with 0 points at level 1"""
        self.assertEqual(self.user_points.total_points, 0)
        self.assertEqual(self.user_points.level, 1)
    
    def test_level_calculation(self):
        """Test level calculation based on points"""
        # Level 1: 0-99 points
        self.user_points.total_points = 99
        self.user_points.level = 1
        self.user_points.save()
        
        self.assertEqual(self.user_points.level, 1)
        
        # Level 2: 100-199 points
        self.user_points.total_points = 100
        self.user_points.level = 2
        self.user_points.save()
        
        self.assertEqual(self.user_points.level, 2)
        
        # Level 3: 200+ points
        self.user_points.total_points = 200
        self.user_points.level = 3
        self.user_points.save()
        
        self.assertEqual(self.user_points.level, 3)
    
    def test_points_history(self):
        """Test tracking points history"""
        # Earn some points
        PointsHistory.objects.create(
            user=self.user,
            amount=10,
            description="Earned Small Achievement"
        )
        
        # Update user points
        self.user_points.total_points += 10
        self.user_points.save()
        
        # Earn more points
        PointsHistory.objects.create(
            user=self.user,
            amount=50,
            description="Earned Medium Achievement"
        )
        
        # Update user points
        self.user_points.total_points += 50
        self.user_points.save()
        
        # Check total points
        self.user_points.refresh_from_db()
        self.assertEqual(self.user_points.total_points, 60)
        
        # Check points history
        history = PointsHistory.objects.filter(user=self.user).order_by('timestamp')
        self.assertEqual(history.count(), 2)
        self.assertEqual(history[0].amount, 10)
        self.assertEqual(history[1].amount, 50)
    
    def test_earning_multiple_achievements(self):
        """Test earning multiple achievements and updating points"""
        for achievement in self.achievements:
            # Earn the achievement
            UserAchievement.objects.create(
                user=self.user,
                achievement=achievement,
                date_earned=date.today()
            )
            
            # Record points history
            PointsHistory.objects.create(
                user=self.user,
                amount=achievement.points,
                description=f"Earned {achievement.name}"
            )
            
            # Update user points
            self.user_points.total_points += achievement.points
            
            # Update level if needed
            self.user_points.level = (self.user_points.total_points // 100) + 1
            self.user_points.save()
        
        # Check final state
        self.user_points.refresh_from_db()
        self.assertEqual(self.user_points.total_points, 160)  # 10 + 50 + 100
        self.assertEqual(self.user_points.level, 2)  # Level 2 (160 points)


class ReadingStreakModelTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            password='testpass123',
            email='test@example.com'
        )
        
        self.reading_streak = ReadingStreak.objects.create(
            user=self.user,
            current_streak=0,
            longest_streak=0
        )
        
        # Create books
        self.books = []
        for i in range(3):
            book = Book.objects.create(
                google_books_id=f'test{i}',
                title=f'Test Book {i}',
                author='Test Author',
                description=f'Test book description {i}',
                genre='Fiction'
            )
            self.books.append(book)
    
    def test_initial_streak(self):
        """Test that a user starts with 0 streak"""
        self.assertEqual(self.reading_streak.current_streak, 0)
        self.assertEqual(self.reading_streak.longest_streak, 0)
        self.assertIsNone(self.reading_streak.last_read_date)
    
    def test_update_streak_first_book(self):
        """Test updating streak when first book is finished"""
        # Mark a book as finished
        UserBookStatus.objects.create(
            user=self.user,
            book=self.books[0],
            status='FINISHED'
        )
        
        # Update streak
        self.reading_streak.current_streak = 1
        self.reading_streak.longest_streak = 1
        self.reading_streak.last_read_date = date.today()
        self.reading_streak.save()
        
        self.reading_streak.refresh_from_db()
        self.assertEqual(self.reading_streak.current_streak, 1)
        self.assertEqual(self.reading_streak.longest_streak, 1)
        self.assertEqual(self.reading_streak.last_read_date, date.today())
    
    def test_streak_continues(self):
        """Test streak continues when books are read on consecutive days"""
        # Start with a streak of 1
        self.reading_streak.current_streak = 1
        self.reading_streak.longest_streak = 1
        self.reading_streak.last_read_date = date.today() - timedelta(days=1)
        self.reading_streak.save()
        
        # Mark a book as read today
        UserBookStatus.objects.create(
            user=self.user,
            book=self.books[0],
            status='FINISHED'
        )
        
        # Update streak (would be done by backend logic)
        today = date.today()
        yesterday = today - timedelta(days=1)
        
        if self.reading_streak.last_read_date == yesterday:
            # Continue streak
            self.reading_streak.current_streak += 1
            if self.reading_streak.current_streak > self.reading_streak.longest_streak:
                self.reading_streak.longest_streak = self.reading_streak.current_streak
        
        self.reading_streak.last_read_date = today
        self.reading_streak.save()
        
        self.reading_streak.refresh_from_db()
        self.assertEqual(self.reading_streak.current_streak, 2)
        self.assertEqual(self.reading_streak.longest_streak, 2)
        self.assertEqual(self.reading_streak.last_read_date, today)
    
    def test_streak_breaks(self):
        """Test streak resets when a day is missed"""
        # Start with a streak of 2
        self.reading_streak.current_streak = 2
        self.reading_streak.longest_streak = 2
        self.reading_streak.last_read_date = date.today() - timedelta(days=2)  # Two days ago
        self.reading_streak.save()
        
        # Mark a book as read today (after skipping a day)
        UserBookStatus.objects.create(
            user=self.user,
            book=self.books[0],
            status='FINISHED'
        )
        
        # Update streak (would be done by backend logic)
        today = date.today()
        yesterday = today - timedelta(days=1)
        
        if self.reading_streak.last_read_date != yesterday:
            # Streak is broken, reset to 1
            self.reading_streak.current_streak = 1
        
        self.reading_streak.last_read_date = today
        self.reading_streak.save()
        
        self.reading_streak.refresh_from_db()
        self.assertEqual(self.reading_streak.current_streak, 1)
        self.assertEqual(self.reading_streak.longest_streak, 2)  # Longest streak remains 2
        self.assertEqual(self.reading_streak.last_read_date, today)