from rest_framework import serializers
from .models import CustomUser, CandidateProfile, CompanyProfile
from django.db import transaction
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

class CandidateRegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    password2 = serializers.CharField(write_only=True)

    bio = serializers.CharField()
    address = serializers.CharField()
    skill = serializers.CharField()
    experience = serializers.CharField()
    resume = serializers.FileField(required=False, allow_null=True)

    class Meta:
        model = CustomUser
        fields = [
            'username', 'email', 'phone_no',
            'password', 'password2',
            'bio', 'address', 'skill', 'experience', 'resume',
            ]

    def validate(self, attrs):
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError("Password do not match")
        return attrs


    def create(self, validated_data):
        with transaction.atomic():
            password = validated_data.pop('password')
            validated_data.pop('password2')

            bio = validated_data.pop('bio')
            address = validated_data.pop('address')
            skill = validated_data.pop('skill')
            experience = validated_data.pop('experience')
            resume = validated_data.pop('resume', None)

            user = CustomUser.objects.create_user(
                username=validated_data['username'],
                email=validated_data['email'],
                phone_no=validated_data.get('phone_no', ''),
                role='CANDIDATE',
                password=password
                )

            CandidateProfile.objects.create(
                user=user,
                bio=bio,
                address=address,
                skill=skill,
                experience=experience,
                resume=resume
            )

            return user

class CompanyRegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    password2 = serializers.CharField(write_only=True)

    name = serializers.CharField()
    website = serializers.URLField()
    description = serializers.CharField()
    address = serializers.CharField()

    class Meta:
        model = CustomUser
        fields = [
            'username', 'email', 'phone_no',
            'password', 'password2',
            'name', 'address', 'website', 'description'
        ]

    def validate(self, attrs):
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError("Password do not match")
        return attrs

    def create(self, validated_data):
        with transaction.atomic():
            password = validated_data.pop('password')
            validated_data.pop('password2')

            name = validated_data.pop('name')
            address = validated_data.pop('address')
            website = validated_data.pop('website')
            description = validated_data.pop('description')

            user = CustomUser.objects.create_user(
                username=validated_data['username'],
                email=validated_data.get('email', ''),
                phone_no=validated_data.get('phone_no', ''),
                role='COMPANY',
                password=password
            )
            CompanyProfile.objects.create(
                user=user,
                name=name,
                address=address,
                website=website,
                description=description
            )

            return user


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)

        token['username'] = user.username
        token['email'] = user.email
        token['role'] = user.role

        return token

class CandidateProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = CandidateProfile
        fields = ['bio', 'resume', 'address', 'skill', 'experience']

class CompanyProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = CompanyProfile
        fields = ['name', 'website', 'address', 'description']

class UserProfileSerializer(serializers.ModelSerializer):
    candidate_profile = CandidateProfileSerializer(read_only=True)
    company_profile = CompanyProfileSerializer(read_only=True)

    class Meta:
        model = CustomUser
        fields = ['id', 'username', 'email', 'phone_no', 'role',
                  'candidate_profile', 'company_profile']



