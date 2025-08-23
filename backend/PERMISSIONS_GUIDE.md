# PTF Backend Permissions Guide

This document outlines the authentication and authorization structure for the Paul's Tropical Fitness backend system.

## User Roles

### 1. Superusers
- **Full System Access**: Complete CRUD operations on all resources
- **User Management**: Can create, modify, and deactivate user accounts
- **Role Assignment**: Can promote/demote staff members
- **System Configuration**: Access to sensitive system settings
- **All Staff Permissions**: Includes everything staff can do

### 2. Staff Members
- **Operational Access**: Day-to-day gym operations
- **Member Management**: View and create members (update/delete requires superuser)
- **Attendance Tracking**: Full check-in/check-out capabilities
- **Membership Management**: View and create memberships (update/delete requires superuser)
- **Payment Recording**: Record manual payments and view payment history
- **Dashboard Access**: View statistics and notifications
- **Booking Management**: View and create bookings (modify/delete requires superuser)

### 3. Regular Users (No Access)
- The system is designed for staff/admin use only
- Regular user accounts exist but have no permissions to access the gym management system

## Permission Classes

### `IsSuperUser`
- Only allows superusers
- Used for: User registration, user role management, sensitive system operations

### `IsStaffOrSuperUser`
- Allows both staff and superusers
- Used for: General operational endpoints

### `CustomModelPermissions`
- **Staff**: GET (read) and POST (create) operations
- **Superusers**: Full CRUD (Create, Read, Update, Delete) operations
- Used for: Most model viewsets (members, memberships, bookings)

### `IsStaffReadOnlyOrSuperUser`
- **Staff**: Read-only access (GET, HEAD, OPTIONS)
- **Superusers**: Full access
- Available for sensitive data that staff should see but not modify

### `IsSuperUserOrStaffCreate`
- **Staff**: Create and read access (GET, POST)
- **Superusers**: Full access
- Available for operations where staff can create but not modify

## Endpoint Permissions Summary

### Authentication (`/accounts/`)
- **Registration**: `IsSuperUser` (only superusers can create accounts)
- **Login**: `AllowAny`
- **User Info/Profile**: `IsAuthenticated`
- **User Management**: `IsSuperUser` (list/modify user roles)

### Members (`/members/`)
- **ViewSet**: `CustomModelPermissions`
  - Staff: View and create members
  - Superusers: Full CRUD operations

### Attendance (`/attendance/`)
- **All Views**: `IsStaffOrSuperUser`
  - Check-in, check-out, status, today's attendance

### Memberships (`/memberships/`)
- **ViewSet**: `CustomModelPermissions`
  - Staff: View and create memberships
  - Superusers: Full CRUD operations

### Payments (`/payments/`)
- **All Views**: `IsStaffOrSuperUser`
  - Record payments, check status, view history

### Dashboard (`/dashboard/`)
- **All Views**: `IsStaffOrSuperUser`
  - Statistics and notifications

### Bookings (`/bookings/`)
- **ViewSet**: `CustomModelPermissions`
  - Staff: View and create bookings
  - Superusers: Full CRUD operations

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

### Promote Staff to Superuser (via API)
```http
PUT /accounts/management/users/{user_id}/
Authorization: Bearer {superuser_jwt_token}
Content-Type: application/json

{
    "is_superuser": true,
    "is_staff": true
}
```

### Create New Staff Member
```http
POST /accounts/auth/register/
Authorization: Bearer {superuser_jwt_token}
Content-Type: application/json

{
    "email": "staff@ptf.com",
    "username": "staffmember",
    "password": "secure_password",
    "first_name": "John",
    "last_name": "Doe"
}
```

Then promote to staff:
```http
PUT /accounts/management/users/{user_id}/
Authorization: Bearer {superuser_jwt_token}
Content-Type: application/json

{
    "is_staff": true
}
```

## Security Best Practices

1. **Limited Superusers**: Keep the number of superusers minimal
2. **Regular Audits**: Review user permissions periodically
3. **Staff Training**: Ensure staff understand their access limitations
4. **Token Security**: Protect JWT tokens, implement proper logout
5. **Activity Logging**: Monitor sensitive operations (user management, deletions)

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