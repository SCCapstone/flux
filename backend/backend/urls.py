from django.contrib import admin
from django.urls import path
from . import views  # Import views from the same backend folder

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/register/', views.register_user, name='register'),
    path('api/login/', views.login_user, name='login'),
    path('api/logout/', views.logout_user, name='logout'),
    path('api/search/', views.search_books, name='search_books'),
]
