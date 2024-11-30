from django.db import models
from django.contrib.auth.models import User

class Book(models.Model):
    title = models.CharField(max_length=150)
    authorName = models.CharField(max_length=150)
    description = models.TextField()
    isbn10 = models.CharField(max_length=10)
    isbn13 = models.CharField(max_length=13)
    genre = models.CharField(max_length=100)
    coverIMG = models.URLField(max_length=200)
    publishedDate = models.DateField()

    def __str__(self):
        return self.title

class Profile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    bio = models.TextField(max_length=500, blank=True)
    profile_image = models.ImageField(upload_to='profile_images/', default='profile_images/default.png')
    
    def __str__(self):
        return f"{self.user.username}'s profile"