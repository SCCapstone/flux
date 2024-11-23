from django.urls import path
from . import views
from .views import logout_user

urlpatterns = [
    path('register/', views.register, name='register'),
    path('login/', views.login_user, name='login'),
    path('home/', views.home, name='home'),  
    path('logout', logout_user, name='logout'),

]