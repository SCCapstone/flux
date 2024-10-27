import requests
from django.shortcuts import render
from django.http import JsonResponse

# Create your views here.
def home(request):
    return render(request, 'home.html')    

def external_api_view(request):
    try:
        response = requests.get("https://jsonplaceholder.typicode.com/todos/1")
        response.raise_for_status()  # Raises an error for non-200 status codes
        data = response.json()
        return JsonResponse(data)
    except requests.exceptions.RequestException as e:
        return JsonResponse({'error': str(e)}, status=500)