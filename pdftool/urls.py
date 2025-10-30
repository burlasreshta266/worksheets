from django.urls import path
from . import views

urlpatterns = [
    path('', views.index, name='index'),
    path('create_pdf/', views.create_pdf, name='create_pdf'),
    path('download_pdf/', views.download_pdf, name='download_pdf'),
    path('preview/', views.preview, name='preview'),
    path('view_pdf/', views.view_pdf, name='view_pdf'),
    path('edit_pdf/', views.edit_pdf, name='edit_pdf'),
]