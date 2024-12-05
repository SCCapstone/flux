from rest_framework import serializers
from .models import Review

class ReviewSerializer(serializers.ModelSerializer):
    class Meta:
        model = Review
        fields = ['rev_id', 'user', 'book', 'added_date', 'review_text', 'updated_at']
        read_only_fields = ['rev_id', 'book', 'user', 'created_at']
