from django.urls import path
from .views import ApplyJobView, JobApplicationsView, MyApplicationView, UpdateApplicationStatusView

urlpatterns = [
    path('jobs/<int:pk>/apply/', ApplyJobView.as_view(), name='apply-job'),
    path('jobs/<int:pk>/applications/', JobApplicationsView.as_view(), name='job-applications'),
    path('applications/', MyApplicationView.as_view(), name='my-application'),
    path('applications/<int:pk>/status/', UpdateApplicationStatusView.as_view(), name='update-application-status'),
]