from rest_framework import serializers
from .models import Readlist, ReadlistBook, Book

class BookSerializer(serializers.ModelSerializer):
    class Meta:
        model = Book
        fields = "__all__"

class ReadlistSerializer(serializers.ModelSerializer):
    books = serializers.SerializerMethodField()

    class Meta:
        model = Readlist
        fields = ["id", "name", "books"]

    def get_books(self, obj):
        """Retrieve books from the ReadlistBook relationship."""
        readlist_books = ReadlistBook.objects.filter(readlist=obj)
        books = [rb.book for rb in readlist_books]
        return BookSerializer(books, many=True).data  # Serialize book data properly
