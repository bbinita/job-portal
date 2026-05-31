from django.db import models
from accounts.models import CompanyProfile

location_choices = [
        ('REMOTE', 'remote'),
        ('ON-SITE', 'on-site'),
        ('HYBRID', 'hybrid')
    ]

class Job(models.Model):

    title = models.CharField(max_length=300)
    description = models.TextField()
    company = models.ForeignKey(
        CompanyProfile,
        on_delete=models.CASCADE,
        related_name='jobs'
    )
    deadline = models.DateTimeField()
    location = models.CharField(
        max_length=10,
        choices=location_choices,
        default='HYBRID'
    )
    salary = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        blank=True,
        null=True
    )
    created_at = models.DateTimeField(auto_now_add=True)
    is_active = models.BooleanField(default=True)
    updated_at = models.DateTimeField(auto_now=True)
