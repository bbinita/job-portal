from django.db import models
from django.contrib.auth.models import AbstractUser
from rest_framework.exceptions import ValidationError


class CustomUser(AbstractUser):
    phone_no = models.CharField(max_length=30)

    ROLE_CHOICES = [
        ('COMPANY', 'company'),
        ('CANDIDATE', 'candidate')
    ]
    role = models.CharField(
        max_length = 10,
        choices=ROLE_CHOICES,
        default = 'CANDIDATE'
    )

    def save(self, *args, **kwargs):
        if self.pk:
            old_role = CustomUser.objects.values_list('role', flat=True).get(pk=self.pk)
            if old_role != self.role:
                raise ValueError("Role is immutable")

        super().save(*args, **kwargs)

class CompanyProfile(models.Model):
    user = models.OneToOneField(
        CustomUser,
        on_delete=models.CASCADE,
        related_name='company_profile'
    )
    name = models.CharField(max_length=60)
    website = models.URLField()
    description = models.TextField()
    address = models.CharField(max_length=50)

    def clean(self):
        if self.user.role != 'COMPANY':
            raise ValidationError("Invalid role for CompanyProfile")

    def __str__(self):
        return self.name


class CandidateProfile(models.Model):
    user = models.OneToOneField(
        CustomUser,
        on_delete=models.CASCADE,
        related_name='candidate_profile'
    )
    bio = models.TextField()

    address = models.CharField(max_length=100)
    resume = models.FileField(upload_to="resumes/", blank=True, null=True)
    skill = models.TextField()
    experience = models.TextField(blank=True)

    def clean(self):
        if self.user.role != 'CANDIDATE':
            raise ValidationError("Invalid role for CandidateProfile")

    def __str__(self):
        return self.user.username