from django.db import models
from django.contrib.auth.models import User

class Book(models.Model):
    google_books_id = models.CharField(max_length=100, unique=True)
    title = models.CharField(max_length=150)
    author = models.CharField(max_length=150)
    description = models.TextField(blank=True, null=True)
    isbn10 = models.CharField(max_length=10, blank=True, null=True)
    isbn13 = models.CharField(max_length=13, blank=True, null=True)
    genre = models.CharField(max_length=100, blank=True, null=True)
    image = models.URLField(max_length=200, blank=True, null=True)
    year = models.CharField(max_length=4, blank=True, null=True)

    def __str__(self):
        return self.title

class Profile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    bio = models.TextField(max_length=500, blank=True)
    profile_image = models.ImageField(upload_to='profile_images/', default='profile_images/default.png')
    
    def __str__(self):
        return f"{self.user.username}'s profile"
    
class Rating(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    book = models.ForeignKey(Book, on_delete=models.CASCADE)
    rating = models.PositiveSmallIntegerField()

    class Meta:
        unique_together = ('user', 'book')

    def __str__(self):
        return f"{self.user.username} rated {self.book.title} as {self.rating}"

class Favorite(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='favorites')
    book = models.ForeignKey(Book, on_delete=models.CASCADE)
    added_date = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'book')

    def __str__(self):
        return f"{self.user.username}'s favorite: {self.book.title}"

class Review(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    book = models.ForeignKey(Book, on_delete=models.CASCADE)
    added_date = models.DateTimeField(auto_now_add=True)
    review_text = models.TextField()
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.book.title} review by {self.user.username}"

class UserBookStatus(models.Model):
    STATUS_CHOICES = [
        ('WILL_READ', 'Will Read'),
        ('READING', 'Reading'),
        ('FINISHED', 'Finished'),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='book_statuses')
    book = models.ForeignKey(Book, on_delete=models.CASCADE)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES)

    class Meta:
        unique_together = ('user', 'book')

    def __str__(self):
        return f"{self.user.username}'s {self.book.title} is {self.status}"

class Readlist(models.Model):
    name = models.CharField(max_length=255)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="readlists")
    is_favorites = models.BooleanField(default=False) 
    books = models.ManyToManyField(Book, through="ReadlistBook", related_name="readlists")  
    
    def __str__(self):
        return f"{self.name} ({self.user.username})"

class ReadlistBook(models.Model):
    readlist = models.ForeignKey(Readlist, on_delete=models.CASCADE, related_name="readlist_books") 
    book = models.ForeignKey(Book, on_delete=models.CASCADE)

    class Meta:
        unique_together = ('readlist', 'book')

    def __str__(self):
        return f"{self.book.title} in {self.readlist.name}"  
