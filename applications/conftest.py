import pytest
from accounts.models import CustomUser, CandidateProfile, CompanyProfile
from jobs.models import Job
from applications.models import Application
from django.utils import timezone

@pytest.fixture
def application(db):
    user = CustomUser.objects.create_user(
        username='testcandidate',
        email='test@example.com',
        password='testpass',
        role='CANDIDATE'
    )
    candidate = CandidateProfile.objects.create(
        user=user,
        bio='Test bio',
        address='Test address',
        skill='Python'
    )

    company_user = CustomUser.objects.create_user(
        username='testcompany',
        email='company@example.com',
        password='testpass',
        role='COMPANY'
    )
    company = CompanyProfile.objects.create(
        user=company_user,
        name='Test Company',
        website='https://test.com',
        description='Test description',
        address='Test address'
    )

    job = Job.objects.create(
        title='Software Engineer',
        company=company,
        is_active=True,
        deadline=timezone.now() + timezone.timedelta(days=30)
    )

    return Application.objects.create(
        candidate=candidate,
        job=job,
        status='SUBMITTED'
    )