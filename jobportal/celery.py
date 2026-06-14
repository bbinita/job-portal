from celery import Celery
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'jobportal.settings')

app = Celery('jobportal')
app.config_from_object('django.conf:settings', namespace='CELERY')
app.autodiscover_tasks([
    'notifications',
])