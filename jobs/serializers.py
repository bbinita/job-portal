from rest_framework import serializers
from .models import Job

class JobSerializer(serializers.ModelSerializer):
    company_name = serializers.CharField(
        source='company.company_name',
        read_only=True
    )
    class Meta:
        model = Job
        fields = [
            'id',
            'company',
            'company_name',
            'title',
            'description',
            'location',
            'salary',
            'deadline',
            'is_active',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'company', 'created_at', 'updated_at']