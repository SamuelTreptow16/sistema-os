from django.contrib import admin
from django.urls import path,include
from django.views.generic import TemplateView
from ordens.views import OrdemServicoViewSet
from rest_framework import routers

router = routers.DefaultRouter()
router.register('ordens', OrdemServicoViewSet, basename='ordens')
urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/<version>/', include(router.urls)),
    path('', TemplateView.as_view(template_name='index.html')),
]
