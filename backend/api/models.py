from django.db import models

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
