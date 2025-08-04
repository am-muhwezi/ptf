#!/usr/bin/env python
"""
Script to create a superuser for the PTF application.
This should be run from the backend directory.
"""

import os
import sys
import django
from django.conf import settings

# Add the project directory to the Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ptf.settings')
django.setup()

from django.contrib.auth import get_user_model

User = get_user_model()

def create_superuser():
    """Create a superuser if one doesn't exist"""
    
    # Default superuser credentials
    email = input("Enter superuser email (default: admin@ptf.com): ").strip() or "admin@ptf.com"
    username = input("Enter username (default: admin): ").strip() or "admin"
    first_name = input("Enter first name (default: Admin): ").strip() or "Admin"
    last_name = input("Enter last name (default: User): ").strip() or "User"
    
    # Check if user already exists
    if User.objects.filter(email=email).exists():
        print(f"User with email {email} already exists!")
        return
    
    if User.objects.filter(username=username).exists():
        print(f"User with username {username} already exists!")
        return
    
    # Get password
    import getpass
    password = getpass.getpass("Enter password: ")
    confirm_password = getpass.getpass("Confirm password: ")
    
    if password != confirm_password:
        print("Passwords don't match!")
        return
    
    if len(password) < 6:
        print("Password must be at least 6 characters long!")
        return
    
    try:
        # Create superuser
        user = User.objects.create_superuser(
            email=email,
            username=username,
            password=password,
            first_name=first_name,
            last_name=last_name
        )
        
        print(f"\nSuperuser created successfully!")
        print(f"Email: {user.email}")
        print(f"Username: {user.username}")
        print(f"Name: {user.first_name} {user.last_name}")
        print(f"Is Staff: {user.is_staff}")
        print(f"Is Superuser: {user.is_superuser}")
        
    except Exception as e:
        print(f"Error creating superuser: {e}")

if __name__ == "__main__":
    create_superuser()