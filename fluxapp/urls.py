# fluxapp/urls.py
from django.urls import path
from . import views

urlpatterns = [
    path('', views.home, name='home'),
    path('external-api/', views.external_api_view, name='external_api'),
]
