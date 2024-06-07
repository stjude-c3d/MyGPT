from django.shortcuts import render
from ..models import Dataset

def home(request):
    datasets = Dataset.objects.all()

    return render(request, 'home.html', {'datasets': datasets})