from rest_framework import serializers
from .models import Readlist, ReadlistBook, Book

class BookSerializer(serializers.ModelSerializer):
    class Meta:
        model = Book
        fields = "__all__"

class ReadlistSerializer(serializers.ModelSerializer):
    books = BookSerializer(many=True, read_only=True, source="books.all")

    class Meta:
        model = Readlist
        fields = ["id", "name", "books"]
