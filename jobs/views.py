from rest_framework.viewsets import ModelViewSet
from .models import Job
from .serializers import JobSerializer
from rest_framework.permissions import IsAuthenticated, IsAuthenticatedOrReadOnly
from rest_framework.exceptions import PermissionDenied
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter

class JobViewSet(ModelViewSet):
    serializer_class = JobSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['location', 'is_active']
    search_fields = ['title', 'description']
    ordering_fields = ['salary', 'created_at']

    def get_queryset(self):
        user = self.request.user
        if user.is_authenticated and user.role == "COMPANY":
            return Job.objects.filter(company=user.company_profile)
        return Job.objects.filter(is_active=True)

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            permission_classes = [IsAuthenticatedOrReadOnly]
        else:
            permission_classes = [IsAuthenticated]
        return [permission() for permission in permission_classes]

    def perform_create(self, serializer):
        if self.request.user.role != 'COMPANY':
            raise PermissionDenied("Only companies can post jobs.")
        serializer.save(company=self.request.user.company_profile)

    def perform_update(self, serializer):
        if serializer.instance.company != self.request.user.company_profile:
            raise PermissionDenied("You can only edit your own jobs.")
        serializer.save()

    def perform_destroy(self, instance):
        if instance.company != self.request.user.company_profile:
            raise PermissionDenied("You can only delete your own jobs.")
        instance.delete()


