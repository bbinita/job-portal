from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from .serializers import CandidateRegisterSerializer, CompanyRegisterSerializer, CustomTokenObtainPairSerializer, CandidateProfileSerializer, CompanyProfileSerializer, UserProfileSerializer
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView
from .models import CandidateProfile, CompanyProfile
from django.shortcuts import get_object_or_404


def get_tokens_for_user(user):
    refresh = RefreshToken.for_user(user)
    return{
        "refresh": str(refresh),
        "access": str(refresh.access_token)
    }


class CandidateRegisterView(APIView):

    permission_classes = [AllowAny]

    def post(self, request):
        serializer = CandidateRegisterSerializer(data=request.data)

        if serializer.is_valid():
            user = serializer.save()
            tokens  = get_tokens_for_user(user)
            return Response(
                {
                    'message' : 'Candidate registered sucessfully',
                    'tokens': tokens,
                },status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class CompanyRegisterView(APIView):

    permission_classes = [AllowAny]

    def post(self, request):
        serializer = CompanyRegisterSerializer(data=request.data)

        if serializer.is_valid():
            user = serializer.save()
            tokens  = get_tokens_for_user(user)
            return Response(
                {
                    'message' : 'Company registered sucessfully',
                    'tokens': tokens,
                },status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer
    permission_classes = [AllowAny]


class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            token = RefreshToken(request.data.get("refresh"))
            token.blacklist()
            return Response({"detail": "Logged out"}, status=205)
        except Exception:
            return Response({"detail": "Invalid token"}, status=400)

class ProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        serializer = UserProfileSerializer(request.user)
        return Response(serializer.data)

    def patch(self, request):
        user = request.user
        data = request.data

        # Update nested profile based on role
        if user.role == 'CANDIDATE':
            profile = user.candidate_profile
            profile_serializer = CandidateProfileSerializer(
                profile, data=data, partial=True
            )
            if profile_serializer.is_valid(raise_exception=True):
                profile_serializer.save()

        elif user.role == 'COMPANY':
            profile = user.company_profile
            profile_serializer = CompanyProfileSerializer(
                profile, data=data, partial=True
            )
            if profile_serializer.is_valid(raise_exception=True):
                profile_serializer.save()

        # Return full updated profile
        return Response(UserProfileSerializer(user).data)