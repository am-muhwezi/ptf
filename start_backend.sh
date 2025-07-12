#!/bin/bash

# Navigate to backend directory
cd backend

# Create virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    echo "Creating Python virtual environment..."
    python3 -m venv venv
fi

# Install dependencies using the virtual environment's pip
echo "Installing Python dependencies..."
venv/bin/pip install -r requirements.txt

# Run Django migrations
echo "Running Django migrations..."
venv/bin/python manage.py migrate

# Start Django development server
echo "Starting Django development server on port 5000..."
venv/bin/python manage.py runserver 0.0.0.0:5000