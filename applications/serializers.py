from rest_framework import serializers
from .models import Application
from .transitions import validate_status_transition

class ApplicationSerializer(serializers.ModelSerializer):
    candidate_name = serializers.CharField(
        source='candidate.user.username',
        read_only=True
    )
    job_title = serializers.CharField(
        source='job.title',
        read_only=True
    )

    class Meta:
        model = Application
        fields = ['id', 'candidate', 'candidate_name', 'job', 'job_title', 
                  'resume', 'cover_letter', 'status', 'applied_at', 'updated_at']
        read_only_fields = ['id', 'candidate','job', 'applied_at', 'updated_at']
        extra_kwargs = {
        'resume': {'required': False, 'allow_null': True},
        'cover_letter': {'required': False, 'allow_blank': True},
    }

    def validate(self, attrs):
        request = self.context.get('request')
        job = attrs.get('job')
        if request and job:
            candidate = getattr(request.user, 'candidate_profile', None)
            if candidate and Application.objects.filter(candidate=candidate, job=job).exists():
                raise serializers.ValidationError("You have already applied for this job.")
        return attrs

    extra_kwargs = {
        'resume': {'required': False, 'allow_null': True},
        'cover_letter': {'required': False, 'allow_blank': True},
    }

class ApplicationStatusUpdateSerializer(serializers.ModelSerializer):

    class Meta:
        model = Application
        fields = ['status']

    def validate(self, data):
        if 'status' not in data:
            raise serializers.ValidationError("'status' field is required.")

        validate_status_transition(
            current_status=self.instance.status,
            new_status=data['status']
        )

        return data