from rest_framework.permissions import BasePermission

class IsCompany(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'COMPANY'

class IsCandidate(BasePermission):
    def has_permission(self, request, view):

        return request.user.is_authenticated and request.user.role == 'CANDIDATE'