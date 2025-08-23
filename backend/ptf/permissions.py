"""
Custom permission classes for PTF application.

This module defines permission classes that control access to different
parts of the application based on user roles:
- Superusers: Full access to everything
- Staff: Limited access to core operations
- Regular users: No access (system is for staff/admins only)
"""

from rest_framework.permissions import BasePermission


class IsSuperUser(BasePermission):
    """
    Permission class that only allows superusers.
    Used for sensitive operations like user management, system settings.
    """
    
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.is_superuser)


class IsStaffOrSuperUser(BasePermission):
    """
    Permission class that allows staff members and superusers.
    Used for general operational tasks like member management, attendance, etc.
    """
    
    def has_permission(self, request, view):
        return bool(
            request.user and 
            request.user.is_authenticated and 
            (request.user.is_staff or request.user.is_superuser)
        )


class IsStaffReadOnlyOrSuperUser(BasePermission):
    """
    Permission class that allows:
    - Staff: Read-only access (GET, HEAD, OPTIONS)
    - Superusers: Full access (all methods)
    
    Used for sensitive data that staff can view but not modify.
    """
    
    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated):
            return False
            
        # Superusers have full access
        if request.user.is_superuser:
            return True
            
        # Staff have read-only access
        if request.user.is_staff:
            return request.method in ['GET', 'HEAD', 'OPTIONS']
            
        return False


class IsSuperUserOrStaffCreate(BasePermission):
    """
    Permission class that allows:
    - Staff: Create and read access (GET, POST, HEAD, OPTIONS)
    - Superusers: Full access (all methods)
    
    Used for operations where staff can create new records but not modify/delete existing ones.
    """
    
    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated):
            return False
            
        # Superusers have full access
        if request.user.is_superuser:
            return True
            
        # Staff can create and read
        if request.user.is_staff:
            return request.method in ['GET', 'POST', 'HEAD', 'OPTIONS']
            
        return False


class CustomModelPermissions(BasePermission):
    """
    Custom permission class that maps HTTP methods to different permission levels:
    
    - GET, HEAD, OPTIONS: Staff and Superuser
    - POST: Staff and Superuser  
    - PUT, PATCH: Superuser only
    - DELETE: Superuser only
    
    This provides a balanced approach where staff can view and create,
    but only superusers can update or delete.
    """
    
    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated):
            return False
            
        # Superusers have full access
        if request.user.is_superuser:
            return True
            
        # Staff permissions based on method
        if request.user.is_staff:
            if request.method in ['GET', 'HEAD', 'OPTIONS', 'POST']:
                return True
                
        return False


# Mapping of permission levels for easy reference
PERMISSION_CLASSES = {
    'superuser_only': [IsSuperUser],
    'staff_and_superuser': [IsStaffOrSuperUser],
    'staff_readonly_superuser_full': [IsStaffReadOnlyOrSuperUser],
    'staff_create_superuser_full': [IsSuperUserOrStaffCreate],
    'custom_model_permissions': [CustomModelPermissions],
}


def get_permission_classes(level='staff_and_superuser'):
    """
    Helper function to get permission classes by level name.
    
    Args:
        level (str): Permission level key from PERMISSION_CLASSES
        
    Returns:
        list: List of permission classes
    """
    return PERMISSION_CLASSES.get(level, [IsStaffOrSuperUser])