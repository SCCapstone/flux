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
    
    # Favorites
    path('favorites/', views.get_favorites, name='get_favorites'),
    path('favorites/add/', views.add_favorite, name='add_favorite'),
    path('favorites/remove/', views.remove_favorite, name='remove_favorite'),
    
    # Token Verification
    path('verify-token/', views.verify_token, name='verify_token'),
    
    # Bestsellers
    path('bestsellers/', views.get_bestsellers, name='get_bestsellers'),

    # Book Status
    path('books/<str:google_books_id>/status/', views.get_book_status, name='get_book_status'),
    path('books/<str:google_books_id>/update-status/', views.update_book_status, name='update_book_status'),
    path('books/status/', views.get_user_book_statuses, name='get_user_book_statuses'),
    
    # Readlists
    path("readlists/", views.get_readlists, name="get_readlists"),
    path("readlists/create/", views.create_readlist, name="create_readlist"),
    path("readlists/<int:readlist_id>/", views.get_readlist_books, name="get_readlist_books"),  
    path("readlists/delete/<int:readlist_id>/", views.delete_readlist, name="delete_readlist"),
    path("readlists/update/", views.update_readlist_books, name="update_readlist_books"),

    path('achievements/', views.get_achievements, name='get_achievements'),
    path('user/achievements/', views.get_user_achievements, name='get_user_achievements'),
    path('user/points/', views.get_user_points, name='get_user_points'),
    path('user/points/history/', views.get_points_history, name='get_points_history'),
    path('challenges/', views.get_challenges, name='get_challenges'),
    path('challenges/join/', views.join_challenge, name='join_challenge'),
    path('user/challenges/', views.get_user_challenges, name='get_user_challenges'),
    path('user/streak/', views.get_reading_streak, name='get_reading_streak'),
    path('leaderboard/', views.get_leaderboard, name='get_leaderboard'),
]
