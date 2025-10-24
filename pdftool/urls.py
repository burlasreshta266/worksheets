from django.urls import path
from . import views

urlpatterns = [
    path('', views.index, name='index'),
    path('create_pdf/', views.create_pdf, name='create_pdf'),
]