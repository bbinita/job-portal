from django.db import models
from jobs.models import Job
from accounts.models import CandidateProfile

class Application(models.Model):
    class Meta:
        constraints = [
            models.UniqueConstraint(fields=['candidate', 'job'], name='unique_application')
        ]
    class Status(models.TextChoices):
        SUBMITTED = 'SUBMITTED', 'Submitted'
        UNDER_REVIEW = 'UNDER_REVIEW', 'Under Review'
        SHORTLISTED = 'SHORTLISTED', 'Shortlisted'
        REJECTED = 'REJECTED', 'Rejected'

    VALID_TRANSITIONS = {
        'SUBMITTED': ['UNDER_REVIEW'],
        'UNDER_REVIEW': ['SHORTLISTED', 'REJECTED'],
        'SHORTLISTED': [],
        'REJECTED': [],
    }
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.SUBMITTED,
        db_index=True,
    )

    candidate = models.ForeignKey(
        CandidateProfile,
        on_delete=models.CASCADE,
        related_name='applications'
    )

    cover_letter = models.TextField(blank=True)
    job = models.ForeignKey(
        Job,
        on_delete=models.CASCADE,
        related_name='applications'
    )
    resume = models.FileField(upload_to='resumes/')
    applied_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True, db_index=True,)

    def transition_to(self, new_status):
        allowed = self.VALID_TRANSITIONS.get(self.status, [])

        if new_status not in allowed:
            raise ValueError(
                f"Cannot move from {self.status} to {new_status}. "
                f"Allowed: {allowed}"
            )
        self.status = new_status
        self.save()
