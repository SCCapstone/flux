from django.urls import path
from . import views
from rest_framework_simplejwt.views import TokenRefreshView

urlpatterns = [
    path('register/', views.register_user, name='register'),
    path('login/', views.login_user, name='login'),
    path('logout/', views.logout_user, name='logout'),
    path('search/', views.search_books, name='search_books'),
    path('profile/', views.profile_view, name='profile'),
    path('profile/update/', views.update_profile, name='update_profile'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('rate-book/', views.rate_book, name='rate_book'),
    path('books/<str:google_books_id>/reviews/', views.get_book_reviews, name='get_book_reviews'),
    path('reviews/', views.create_book_review, name='create_book_review'),
    path('reviews/<int:review_id>/', views.update_review, name='update_review'),
    path('reviews/<int:review_id>/delete/', views.delete_review, name='delete_review'),
    path('books/<str:google_books_id>/ratings/', views.get_book_ratings, name='get_book_ratings'),
    path('books/create-or-get/', views.create_or_get_book, name='create_or_get_book'),
    path('favorites/', views.get_favorites, name='get_favorites'),
    path('favorites/add/', views.add_favorite, name='add_favorite'),
    path('favorites/remove/', views.remove_favorite, name='remove_favorite'),
    path('verify-token/', views.verify_token, name='verify_token'),
    path('bestsellers/', views.get_bestsellers, name='get_bestsellers'),
    path('books/<str:google_books_id>/status/', views.get_book_status, name='get_book_status'),
    path('books/<str:google_books_id>/update-status/', views.update_book_status, name='update_book_status'),
    path('books/status/', views.get_user_book_statuses, name='get_user_book_statuses'),
    
    # User following system routes
    path('users/follow/', views.follow_user, name='follow_user'),
    path('users/unfollow/', views.unfollow_user, name='unfollow_user'),
    path('users/<str:username>/followers/', views.get_followers, name='get_followers'),
    path('users/<str:username>/following/', views.get_following, name='get_following'),
    path('users/<str:username>/check-follow/', views.check_follow_status, name='check_follow_status'),
    path('users/<str:username>/profile/', views.get_user_profile, name='get_user_profile'),
    path('users/search/', views.search_users, name='search_users'),
]