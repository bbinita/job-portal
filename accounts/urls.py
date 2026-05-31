from django.urls import path
from .views import CompanyRegisterView, CandidateRegisterView, CustomTokenObtainPairView, LogoutView, ProfileView
from rest_framework_simplejwt.views import TokenRefreshView

urlpatterns = [
    path('accounts/register/candidate/', CandidateRegisterView.as_view(), name='candidate-register'),
    path('accounts/register/company/', CompanyRegisterView.as_view(), name='company-register'),
    path('accounts/login/', CustomTokenObtainPairView.as_view(), name='login'),
    path('accounts/token/refresh/', TokenRefreshView.as_view(), name='token-refresh'),
    path('accounts/logout/', LogoutView.as_view(), name='logout-view'),
    path('accounts/profile/', ProfileView.as_view(), name='profile-view'),
]