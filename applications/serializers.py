from rest_framework import serializers
from .models import Application
from .transitions import validate_status_transition

class ApplicationSerializer(serializers.ModelSerializer):
    candidate_name = serializers.CharField(
        source = 'candidate.user.username',
        read_only=True
    )
    class Meta:
        model = Application
        fields = [ 'id', 'candidate', 'candidate_name', 'job', 'resume', 'cover_letter', 'status', 'applied_at', 'updated_at']
        read_only_fields = ['id', 'candidate', 'applied_at', 'updated_at']


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