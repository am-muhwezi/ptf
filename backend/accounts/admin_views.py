from rest_framework import status, viewsets, permissions
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.permissions import BasePermission
from django.contrib.auth import get_user_model
from django.db.models import Q
from .serializers import AdminUserSerializer
import logging

logger = logging.getLogger(__name__)
User = get_user_model()


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


class AdminManagementViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing admin users. Only accessible by superusers.
    """
    queryset = User.objects.filter(Q(is_staff=True) | Q(is_superuser=True)).order_by('-date_joined')
    serializer_class = AdminUserSerializer
    permission_classes = [IsSuperAdminPermission]

    def list(self, request, *args, **kwargs):
        """
        List all admin users with their details and permissions.
        """
        try:
            admins = self.get_queryset()
            serializer = self.get_serializer(admins, many=True)
            
            admin_data = []
            for admin in serializer.data:
                user = User.objects.get(id=admin['id'])
                admin_info = {
                    **admin,
                    'permissions': {
                        'is_superuser': user.is_superuser,
                        'is_staff': user.is_staff,
                        'is_active': user.is_active,
                    },
                    'role': 'Super Admin' if user.is_superuser else 'Admin',
                    'last_login': user.last_login,
                }
                admin_data.append(admin_info)
            
            return Response({
                'message': 'Admin users retrieved successfully',
                'admins': admin_data,
                'total_admins': len(admin_data)
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            logger.error(f"Error retrieving admin users: {e}")
            return Response({
                'error': 'Failed to retrieve admin users',
                'message': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def create(self, request, *args, **kwargs):
        """
        Create a new admin user. Only superusers can create other admins.
        """
        try:
            serializer = self.get_serializer(data=request.data)
            if serializer.is_valid():
                # Create the user with admin privileges
                user_data = serializer.validated_data
                user_data['is_staff'] = request.data.get('is_staff', True)
                user_data['is_superuser'] = request.data.get('is_superuser', False)
                
                user = User.objects.create_user(**user_data)
                
                return Response({
                    'message': f'Admin user {user.first_name} {user.last_name} created successfully',
                    'admin': AdminUserSerializer(user).data
                }, status=status.HTTP_201_CREATED)
            else:
                return Response({
                    'error': 'Validation failed',
                    'details': serializer.errors
                }, status=status.HTTP_400_BAD_REQUEST)
                
        except Exception as e:
            logger.error(f"Error creating admin user: {e}")
            return Response({
                'error': 'Failed to create admin user',
                'message': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=True, methods=['patch'])
    def update_permissions(self, request, pk=None):
        """
        Update admin permissions for a specific user.
        """
        try:
            user = self.get_object()
            
            # Prevent non-superusers from modifying superuser permissions
            if not request.user.is_superuser:
                return Response({
                    'error': 'Permission denied',
                    'message': 'Only superusers can modify admin permissions'
                }, status=status.HTTP_403_FORBIDDEN)
            
            # Prevent users from removing their own superuser status
            if user.id == request.user.id and 'is_superuser' in request.data:
                if not request.data['is_superuser']:
                    return Response({
                        'error': 'Cannot remove own superuser status',
                        'message': 'You cannot remove your own superuser privileges'
                    }, status=status.HTTP_400_BAD_REQUEST)
            
            # Update permissions
            user.is_staff = request.data.get('is_staff', user.is_staff)
            user.is_superuser = request.data.get('is_superuser', user.is_superuser)
            user.is_active = request.data.get('is_active', user.is_active)
            user.save()
            
            return Response({
                'message': f'Permissions updated for {user.first_name} {user.last_name}',
                'admin': AdminUserSerializer(user).data
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            logger.error(f"Error updating admin permissions: {e}")
            return Response({
                'error': 'Failed to update permissions',
                'message': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=True, methods=['post'])
    def reset_password(self, request, pk=None):
        """
        Reset password for an admin user.
        """
        try:
            user = self.get_object()
            new_password = request.data.get('new_password')
            
            if not new_password:
                return Response({
                    'error': 'Password required',
                    'message': 'Please provide a new password'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            if len(new_password) < 6:
                return Response({
                    'error': 'Password too short',
                    'message': 'Password must be at least 6 characters long'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            user.set_password(new_password)
            user.save()
            
            return Response({
                'message': f'Password reset successfully for {user.first_name} {user.last_name}',
                'admin': AdminUserSerializer(user).data
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            logger.error(f"Error resetting password: {e}")
            return Response({
                'error': 'Failed to reset password',
                'message': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def destroy(self, request, *args, **kwargs):
        """
        Delete an admin user. Prevent deletion of own account.
        """
        try:
            user = self.get_object()
            
            # Prevent users from deleting their own account
            if user.id == request.user.id:
                return Response({
                    'error': 'Cannot delete own account',
                    'message': 'You cannot delete your own admin account'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            user_name = f"{user.first_name} {user.last_name}"
            user.delete()
            
            return Response({
                'message': f'Admin user {user_name} deleted successfully'
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            logger.error(f"Error deleting admin user: {e}")
            return Response({
                'error': 'Failed to delete admin user',
                'message': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)