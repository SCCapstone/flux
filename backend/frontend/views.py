from django.shortcuts import render, redirect
from django.contrib.auth.models import User
from django.contrib.auth import authenticate, login
from django.http import HttpResponse
from django.views.decorators.csrf import csrf_exempt

def home(request):
    return HttpResponse("Welcome to the Home Page!")

def register(request):
    if request.method == 'POST':
        username = request.POST.get('username')
        password = request.POST.get('password')
        if User.objects.filter(username=username).exists():
            return HttpResponse("Username already exists")
        User.objects.create_user(username=username, password=password)
        return redirect('login')
    return render(request, 'register.html')

def login_user(request):
    if request.method == 'POST':
        username = request.POST.get('username')
        password = request.POST.get('password')
        user = authenticate(request, username=username, password=password)
        if user is not None:
            login(request, user)
            return HttpResponse("Logged in successfully")
        return HttpResponse("Invalid credentials")
    return render(request, 'login.html')
