from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from .serializers import CandidateRegisterSerializer, CompanyRegisterSerializer, CustomTokenObtainPairSerializer, CandidateProfileSerializer, CompanyProfileSerializer
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
            refresh_token = request.data["refresh_token"]
            token = RefreshToken(refresh_token)
            token.blacklist()
            return Response({"detail": "Successfully logged out."}, status=status.HTTP_205_RESET_CONTENT)
        except Exception as e:
            return Response({"detail": "Invalid token or bad request."}, status=status.HTTP_400_BAD_REQUEST)

class ProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def get_profile_and_serializer_class(self, user):

        if user.role == "CANDIDATE":
            profile = get_object_or_404(
                CandidateProfile,
                user=user
            )
            serializer_class = CandidateProfileSerializer

        elif user.role == "COMPANY":
            profile = get_object_or_404(
                CompanyProfile,
                user=user
            )
            serializer_class = CompanyProfileSerializer

        else:
            return None, None

        return profile, serializer_class

    def get(self, request):
        profile, serializer_class = self.get_profile_and_serializer_class(
            request.user
        )

        if not profile:
            return Response(
                {"error": "Invalid user role"},
                status=status.HTTP_400_BAD_REQUEST
            )

        serializer = serializer_class(profile)

        return Response(serializer.data, status=status.HTTP_200_OK)

    def patch(self, request):
        profile, serializer_class = self.get_profile_and_serializer_class(
            request.user
        )

        if not profile:
            return Response(
                {"error": "Invalid user role"},
                status=status.HTTP_400_BAD_REQUEST
            )

        serializer = serializer_class(
            profile,
            data=request.data,
            partial=True
        )

        serializer.is_valid(raise_exception=True)
        serializer.save()

        return Response(serializer.data, status=status.HTTP_200_OK)