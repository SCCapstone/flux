import os
from django.shortcuts import render, redirect
from django.contrib.auth.models import User
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import login_required
from django.http import HttpResponse, JsonResponse
from django.views.decorators.csrf import csrf_exempt
import requests
from django.conf import settings


GOOGLE_BOOKS_API_KEY = settings.GOOGLE_BOOKS_API_KEY


def register(request):
    if request.method == 'POST':
        username = request.POST.get('username')
        password = request.POST.get('password')
        user = User.objects.create_user(username=username, password=password)
        return redirect('login')  
    return render(request, 'register.html')

def login_user(request):
    if request.method == 'POST':
        username = request.POST.get('username')
        password = request.POST.get('password')
        user = authenticate(request, username=username, password=password)
        if user is not None:
            login(request, user)
            return redirect('home')  
        else:
            return HttpResponse("Invalid credentials")
    return render(request, 'login.html')

@login_required(login_url='login')  
def home(request):
    return render(request, 'home.html')

def logout_user(request):
    logout(request)
    return redirect('login')  

@csrf_exempt
def search_books(request):
    if request.method == 'GET':
        print(f"API Key: {GOOGLE_BOOKS_API_KEY}")
        query = request.GET.get('q', '')
        page = int(request.GET.get('page', 1))  # Default to page 1
        sort_option = request.GET.get('sort', 'title')  # Default to sorting by title
        max_results = 10  # Number of results per page
        start_index = (page - 1) * max_results  # Calculate start index

        if query:
            url = f"https://www.googleapis.com/books/v1/volumes?q={query}&key={GOOGLE_BOOKS_API_KEY}&maxResults=40"
            response = requests.get(url)
            if response.status_code == 200:
                data = response.json()
                books = []
                for item in data.get('items', []):
                    volume_info = item.get('volumeInfo', {})
                    books.append({
                        'title': volume_info.get('title', 'No Title'),
                        'genre': ', '.join(volume_info.get('categories', ['Unknown Genre'])),
                        'author': ', '.join(volume_info.get('authors', ['Unknown Author'])),
                        'year': volume_info.get('publishedDate', 'N/A'),
                        'description': volume_info.get('description', 'No Description'),
                        'image': volume_info.get('imageLinks', {}).get('thumbnail', ''),
                    })

                    # Sort the books based on the sort_option
                if sort_option == 'title':
                    books.sort(key=lambda x: x['title'])
                elif sort_option == 'author':
                    books.sort(key=lambda x: x['author'])
                elif sort_option == 'genre':
                    books.sort(key=lambda x: x['genre'])
                elif sort_option == 'year':
                    books.sort(key=lambda x: x['year'])
                
                # Paginate the sorted books
                paginated_books = books[start_index:start_index + max_results]

                return JsonResponse({'books': paginated_books, 'page': page, 'sort': sort_option})
            else:
                return JsonResponse({'error': 'Error fetching data from Google Books API'}, status=500)
        return JsonResponse({'error': 'No search query provided'}, status=400)
    return JsonResponse({'error': 'Invalid request method'}, status=405)
