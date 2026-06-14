from rest_framework.generics import GenericAPIView, ListAPIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import PermissionDenied
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404
from jobs.models import Job
from .models import Application
from .serializers import ApplicationSerializer, ApplicationStatusUpdateSerializer
from notifications.tasks import send_status_notification
from django.db import IntegrityError

class ApplyJobView(GenericAPIView):
    serializer_class = ApplicationSerializer
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        if request.user.role != 'CANDIDATE':
            raise PermissionDenied("Only candidates can apply.")

        job = get_object_or_404(Job, pk=pk)

        if not job.is_active:
            return Response(
                {"detail": "Job is not active"},
                status=status.HTTP_400_BAD_REQUEST
            )

        candidate = request.user.candidate_profile

        serializer = ApplicationSerializer(
            data=request.data,
            context={'request': request}
        )
        serializer.is_valid(raise_exception=True)

        try:
            serializer.save(candidate=candidate, job=job)
        except IntegrityError:
            return Response(
                {"detail": "You have already applied for this job."},
                status=status.HTTP_400_BAD_REQUEST
            )

        return Response(serializer.data, status=status.HTTP_201_CREATED)

class JobApplicationsView(ListAPIView):
    serializer_class = ApplicationSerializer
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        if self.request.user.role != "COMPANY":
            raise PermissionDenied("Only companies can view applications.")

        job = get_object_or_404(Job, pk=pk)

        if job.company != request.user.company_profile:
            raise PermissionDenied("The requested job doesn't belongs to you.")

        applications = Application.objects.select_related(
            'candidate',
            'candidate__user'
        ).filter(job=job)
        serializer = ApplicationSerializer(applications, many=True)
        return Response(serializer.data)


class MyApplicationView(ListAPIView):
    serializer_class = ApplicationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        if self.request.user.role != 'CANDIDATE':
            raise PermissionDenied("Only candidates can view their applications.")
        qs = Application.objects.select_related(
            'job', 'job__company'
        ).filter(candidate=self.request.user.candidate_profile)
        
        status_filter = self.request.query_params.get('status')
        if status_filter:
            qs = qs.filter(status=status_filter)
        return qs

class UpdateApplicationStatusView(GenericAPIView):
    serializer_class = ApplicationStatusUpdateSerializer  
    permission_classes = [IsAuthenticated]

    def patch(self, request, pk):
        if self.request.user.role != 'COMPANY':
            raise PermissionDenied("Only companies can update status.")

        application = get_object_or_404(Application, pk=pk)

        if application.job.company != request.user.company_profile:
            raise PermissionDenied("You can only update your own job applications.")

        serializer = ApplicationStatusUpdateSerializer(
            instance=application,
            data=request.data,
            partial=True
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        application.refresh_from_db()
        send_status_notification(application.id, application.status)

        return Response(
            {
                "detail": f"Status updated to '{application.status}'.",
                "application_id": application.id
            },
            status=status.HTTP_200_OK
        )