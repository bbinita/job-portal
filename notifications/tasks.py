from celery import shared_task

@shared_task
def send_status_notification(application_id, new_status):
    from applications.models import Application
    from notifications.models import Notification

    application = Application.objects.select_related(
        'candidate__user', 'job'
    ).get(id=application_id)

    Notification.objects.create(
        recipient=application.candidate,
        application=application,
        message=f"Your application for '{application.job.title}' has been updated to {new_status}."
    )