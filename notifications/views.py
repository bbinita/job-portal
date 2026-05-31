from rest_framework.generics import ListAPIView, GenericAPIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import PermissionDenied
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404
from .serializers import NotificationSerializer
from .models import Notification

class NotificationView(ListAPIView):
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        if self.request.user.role != 'CANDIDATE':
            raise PermissionDenied("Only Candidate and see notifications.")
        return Notification.objects.filter(recipient=self.request.user.candidate_profile)

class MarkAsReadView(GenericAPIView):
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]

    def patch(self, request, pk):
        if self.request.user.role != 'CANDIDATE':
            raise PermissionDenied("Only Candidate and see notifications.")

        notification = get_object_or_404(Notification, id=pk)
        if notification.recipient != request.user.candidate_profile:
            raise PermissionDenied("You cannot modify this notification.")
        notification.is_read = True
        notification.save()

        return Response(
            {"message": "Notification mark as read"},
            status=status.HTTP_200_OK
        )
