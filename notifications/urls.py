from django.urls import path
from .views import NotificationView, MarkAsReadView

urlpatterns = [
    path('notifications/', NotificationView.as_view(), name='notification-view'),
    path('notifications/<int:pk>/read/', MarkAsReadView.as_view(), name='mark-as-read'),
]