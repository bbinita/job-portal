from django.db import models
from accounts.models import CandidateProfile
from applications.models import Application

class Notification(models.Model):
    recipient = models.ForeignKey(
        CandidateProfile,
        on_delete=models.CASCADE,
        related_name='notifications'
    )
    application = models.ForeignKey(
        Application,
        on_delete=models.CASCADE,
        related_name='notifications'
    )
    message = models.TextField()
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Notification for {self.recipient.user.username}"