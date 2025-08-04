from rest_framework.permissions import BasePermission
from rest_framework.response import Response
from rest_framework import status
from functools import wraps
from django.http import JsonResponse


class IsSuperAdminPermission(BasePermission):
    """
    Custom permission to only allow superadmin users.
    """
    def has_permission(self, request, view):
        return (
            request.user and 
            request.user.is_authenticated and 
            request.user.is_superuser
        )

    def has_object_permission(self, request, view, obj):
        return (
            request.user and 
            request.user.is_authenticated and 
            request.user.is_superuser
        )


class IsAdminPermission(BasePermission):
    """
    Custom permission to allow staff and superuser access.
    """
    def has_permission(self, request, view):
        return (
            request.user and 
            request.user.is_authenticated and 
            (request.user.is_staff or request.user.is_superuser)
        )

    def has_object_permission(self, request, view, obj):
        return (
            request.user and 
            request.user.is_authenticated and 
            (request.user.is_staff or request.user.is_superuser)
        )


class IsOwnerOrAdminPermission(BasePermission):
    """
    Permission to allow owners of an object or admin users to access it.
    """
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated

    def has_object_permission(self, request, view, obj):
        # Check if user is admin
        if request.user.is_staff or request.user.is_superuser:
            return True
        
        # Check if user owns the object
        if hasattr(obj, 'user'):
            return obj.user == request.user
        elif hasattr(obj, 'owner'):
            return obj.owner == request.user
        
        return False


# Decorators for function-based views
def superadmin_required(view_func):
    """
    Decorator for function-based views that requires superadmin access.
    """
    @wraps(view_func)
    def wrapper(request, *args, **kwargs):
        if not request.user.is_authenticated:
            return JsonResponse({
                'error': 'Authentication required',
                'message': 'Please log in to access this resource'
            }, status=401)
        
        if not request.user.is_superuser:
            return JsonResponse({
                'error': 'Permission denied',
                'message': 'Superadmin access required'
            }, status=403)
        
        return view_func(request, *args, **kwargs)
    return wrapper


def admin_required(view_func):
    """
    Decorator for function-based views that requires admin access.
    """
    @wraps(view_func)
    def wrapper(request, *args, **kwargs):
        if not request.user.is_authenticated:
            return JsonResponse({
                'error': 'Authentication required',
                'message': 'Please log in to access this resource'
            }, status=401)
        
        if not (request.user.is_staff or request.user.is_superuser):
            return JsonResponse({
                'error': 'Permission denied',
                'message': 'Admin access required'
            }, status=403)
        
        return view_func(request, *args, **kwargs)
    return wrapper


def staff_required(view_func):
    """
    Decorator for function-based views that requires staff access.
    """
    @wraps(view_func)
    def wrapper(request, *args, **kwargs):
        if not request.user.is_authenticated:
            return JsonResponse({
                'error': 'Authentication required',
                'message': 'Please log in to access this resource'
            }, status=401)
        
        if not request.user.is_staff:
            return JsonResponse({
                'error': 'Permission denied',
                'message': 'Staff access required'
            }, status=403)
        
        return view_func(request, *args, **kwargs)
    return wrapper


# Mixins for class-based views
class SuperAdminRequiredMixin:
    """
    Mixin for class-based views that requires superadmin access.
    """
    def dispatch(self, request, *args, **kwargs):
        if not request.user.is_authenticated:
            return JsonResponse({
                'error': 'Authentication required',
                'message': 'Please log in to access this resource'
            }, status=401)
        
        if not request.user.is_superuser:
            return JsonResponse({
                'error': 'Permission denied',
                'message': 'Superadmin access required'
            }, status=403)
        
        return super().dispatch(request, *args, **kwargs)


class AdminRequiredMixin:
    """
    Mixin for class-based views that requires admin access.
    """
    def dispatch(self, request, *args, **kwargs):
        if not request.user.is_authenticated:
            return JsonResponse({
                'error': 'Authentication required',
                'message': 'Please log in to access this resource'
            }, status=401)
        
        if not (request.user.is_staff or request.user.is_superuser):
            return JsonResponse({
                'error': 'Permission denied',
                'message': 'Admin access required'
            }, status=403)
        
        return super().dispatch(request, *args, **kwargs)


class StaffRequiredMixin:
    """
    Mixin for class-based views that requires staff access.
    """
    def dispatch(self, request, *args, **kwargs):
        if not request.user.is_authenticated:
            return JsonResponse({
                'error': 'Authentication required',
                'message': 'Please log in to access this resource'
            }, status=401)
        
        if not request.user.is_staff:
            return JsonResponse({
                'error': 'Permission denied',
                'message': 'Staff access required'
            }, status=403)
        
        return super().dispatch(request, *args, **kwargs)