from django.urls import path
from . import views
from rest_framework_simplejwt.views import TokenRefreshView
from .views import rate_book, get_book_ratings

urlpatterns = [
    path('register/', views.register_user, name='register'),
    path('login/', views.login_user, name='login'),
    path('logout/', views.logout_user, name='logout'),
    path('search/', views.search_books, name='search_books'),
    path('profile/', views.profile_view, name='profile'),
    path('profile/update/', views.update_profile, name='update_profile'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('rate-book/', rate_book, name='rate_book'),
    path('reviews/', views.create_book_review, name='create_book_review'),
    path('reviews/<int:rev_id>/', views.update_review, name='update_review'),
    path('reviews/<int:rev_id>/delete/', views.delete_review, name='delete_review'),
    path('book/<int:book_id>/ratings/', get_book_ratings, name='get_book_ratings'),
    path('books/create-or-get/', views.create_or_get_book, name='create_or_get_book'),
    path('favorites/', views.get_favorites, name='get_favorites'),
    path('favorites/add/', views.add_favorite, name='add_favorite'),
    path('favorites/remove/', views.remove_favorite, name='remove_favorite'),
]