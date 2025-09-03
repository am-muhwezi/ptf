# PTF Backend Permissions Guide

This document outlines the authentication and authorization structure for the Paul's Tropical Fitness backend system.

## User Roles

### 1. Super Admins (Superusers)
- **Full System Access**: Complete CRUD operations on all resources
- **User Management**: Can create, modify, and deactivate user accounts
- **Role Assignment**: Can promote/demote admin members
- **System Configuration**: Access to sensitive system settings
- **All Admin Permissions**: Includes everything admins can do

### 2. Admins (Staff)
- **Full Operational Access**: Complete day-to-day gym operations
- **Member Management**: Full CRUD operations - can delete, update, and create members
- **Attendance Tracking**: Full check-in/check-out capabilities
- **Membership Management**: Full CRUD operations on memberships
- **Payment Management**: Can record manual payments, initiate payments, and view payment history
- **Dashboard Access**: View statistics and notifications
- **Booking Management**: Full CRUD operations on bookings

### 3. User Registration Default
- **All new registrations are automatically Admin (is_staff=True)**
- No regular users exist in the system - everyone who signs up gets operational access
- This ensures all members can use the gym management system immediately

## Permission Classes

### `IsSuperAdmin`
- Only allows super admins (superusers)
- Used for: User registration, user role management, sensitive system operations

### `IsAdmin`
- Allows both admins (staff) and super admins (superusers)
- Used for: General operational endpoints

### `AdminPermissions`
- **Admins**: Full CRUD (Create, Read, Update, Delete) operations
- **Super Admins**: Full CRUD (Create, Read, Update, Delete) operations
- Used for: All model viewsets (members, memberships, bookings, payments)

## Endpoint Permissions Summary

### Authentication (`/accounts/`)
- **Registration**: `IsSuperAdmin` (only super admins can create accounts)
- **Login**: `AllowAny`
- **User Info/Profile**: `IsAuthenticated`
- **User Management**: `IsSuperAdmin` (list/modify user roles)

### Members (`/members/`)
- **ViewSet**: `AdminPermissions`
  - Admins: Full CRUD operations including member deletion and updates
  - Super Admins: Full CRUD operations

### Attendance (`/attendance/`)
- **All Views**: `IsAdmin`
  - Check-in, check-out, status, today's attendance

### Memberships (`/memberships/`)
- **ViewSet**: `AdminPermissions`
  - Admins: Full CRUD operations
  - Super Admins: Full CRUD operations

### Payments (`/payments/`)
- **All Views**: `IsAdmin`
  - Record payments, initiate payments, check status, view history
  - Both admins and super admins can initiate payments

### Dashboard (`/dashboard/`)
- **All Views**: `IsAdmin`
  - Statistics and notifications

### Bookings (`/bookings/`)
- **ViewSet**: `AdminPermissions`
  - Admins: Full CRUD operations
  - Super Admins: Full CRUD operations

## Authentication Flow

1. **Login**: User provides email/password
2. **JWT Tokens**: System returns access/refresh tokens with user role information
3. **Authorization**: Each request includes JWT token in Authorization header
4. **Permission Check**: Endpoint validates user role against required permissions
5. **Access Granted/Denied**: Based on user role and endpoint requirements

## Creating Your First Superuser

```bash
cd backend
python manage.py createsuperuser
```

## Managing User Roles

### Promote Admin to Super Admin (via API)
```http
PUT /accounts/management/users/{user_id}/
Authorization: Bearer {super_admin_jwt_token}
Content-Type: application/json

{
    "is_superuser": true,
    "is_staff": true
}
```

### Create New Admin Member
```http
POST /auth/register/
Content-Type: application/json

{
    "email": "admin@ptf.com",
    "username": "adminmember", 
    "password": "secure_password",
    "confirm_password": "secure_password",
    "first_name": "John",
    "last_name": "Doe"
}
```

**Note**: All new registrations automatically get Admin (is_staff=True) privileges. No additional promotion needed.

## Security Best Practices

1. **Limited Super Admins**: Keep the number of super admins minimal
2. **Regular Audits**: Review user permissions periodically
3. **Admin Training**: Ensure admins understand their access scope
4. **Token Security**: Protect JWT tokens, implement proper logout
5. **Activity Logging**: Monitor sensitive operations (user management, member deletions)

## Implementation Details

### Permission Class Location
All custom permission classes are defined in `/backend/ptf/permissions.py`

### Authentication Classes
- `JWTAuthentication`: Primary authentication method
- `SessionAuthentication`: Fallback for admin interface

### Token Configuration
- Access Token Lifetime: 60 minutes
- Refresh Token Lifetime: 7 days
- Auto-rotation enabled with blacklisting

## Troubleshooting

### Common Issues

1. **Permission Denied**: Check user role and endpoint requirements
2. **Token Expired**: Use refresh token to get new access token
3. **Unauthorized**: Ensure JWT token is included in request headers

### Error Responses
```json
{
    "detail": "You do not have permission to perform this action."
}
```

### Debug Tips
- Check user roles: `GET /accounts/auth/user-info/`
- Verify token: Decode JWT at jwt.io
- Review logs for authentication failures

## Future Enhancements

1. **Role-Based Permissions**: More granular permission system
2. **Department-Specific Access**: Limit access by gym department
3. **Audit Logging**: Comprehensive activity tracking
4. **Session Management**: Advanced session control
5. **Two-Factor Authentication**: Additional security layer