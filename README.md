# 🏋️ Paul's Tropical Fitness - Production Deployment

> **Live Application**: A comprehensive gym management platform serving Paul's Tropical Fitness members, trainers, and administrators.

## 🚀 Production Environment

This application is configured for deployment on **Digital Ocean App Platform** with the following architecture:

- **Backend**: Django REST Framework with PostgreSQL
- **Frontend**: React with Vite build system  
- **Authentication**: JWT-based security with role-based permissions
- **Hosting**: Digital Ocean App Platform with auto-scaling capabilities

## 🌟 Key Features

### 👥 Member Management
- Member registration and profile management
- Fitness level tracking and goal setting
- Membership renewal and payment tracking
- Check-in/check-out system

### 📊 Attendance & Bookings
- Real-time attendance monitoring
- Training session bookings
- Class scheduling and capacity management

### 💰 Membership Plans
- Indoor and outdoor membership options
- Automated renewal notifications
- Payment due tracking and reminders

### 🔐 Role-Based Access
- **Members**: Profile management, bookings, attendance
- **Staff**: Member management, check-ins, basic reporting
- **Administrators**: Full system access, analytics, user management

### 📈 Dashboard & Analytics
- Real-time membership statistics
- Revenue tracking and reporting
- Member engagement metrics

## 🛠️ Technology Stack

### Backend
- **Framework**: Django 5.2.3 with Django REST Framework 3.16.0
- **Database**: PostgreSQL (production) / SQLite3 (development)
- **Authentication**: SimpleJWT with token blacklisting
- **API Documentation**: drf-yasg (Swagger/OpenAPI)
- **WSGI Server**: Gunicorn for production deployment

### Frontend
- **Framework**: React 18.2.0 with React Router DOM 6.22.3
- **Build Tool**: Vite 6.3.5 for optimized production builds
- **Styling**: Tailwind CSS 3.4.17 with responsive design
- **HTTP Client**: Axios 1.10.0 with request/response interceptors
- **State Management**: React Context API with local storage persistence

### Development Tools
- **Code Formatting**: Prettier for consistent code style
- **CSS Processing**: PostCSS with Autoprefixer
- **Development Server**: Hot-reload enabled development environment

## 🔧 Environment Configuration

### Required Environment Variables

```bash
# Django Backend
DJANGO_SECRET_KEY=your-production-secret-key
DEBUG=False
DJANGO_ALLOWED_HOSTS=your-domain.com,www.your-domain.com
DATABASE_URL=postgresql://user:password@host:port/database

# CORS Configuration
CORS_ALLOW_ALL_ORIGINS=False
CORS_ALLOWED_ORIGINS=https://your-frontend-domain.com

# SSL/Security (Auto-configured for production)
SECURE_SSL_REDIRECT=True
SECURE_PROXY_SSL_HEADER=HTTP_X_FORWARDED_PROTO,https
```

## 💻 Development Setup

### Prerequisites
- Python 3.11+
- Node.js 18+
- Git

### Local Development

#### 1. Clone Repository
```bash
git clone https://github.com/am-muhwezi/ptf.git
cd ptf
```

#### 2. Backend Setup
```bash
cd backend

# Create virtual environment
python3 -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Set up environment variables
cp .env.example .env
# Edit .env file with your settings

# Run migrations
python manage.py migrate

# Create superuser (optional)
python manage.py createsuperuser

# Start development server
python manage.py runserver
```

#### 3. Frontend Setup
```bash
# In new terminal, navigate to frontend
cd frontend

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env file with your API URL

# Start development server
npm run dev
```

#### Development URLs
- **Backend API**: http://localhost:8000/
- **Frontend App**: http://localhost:5173/
- **Admin Panel**: http://localhost:8000/admin/
- **API Docs**: http://localhost:8000/swagger/

#### Quick Start Script
```bash
# Terminal 1 - Backend
cd backend && source .venv/bin/activate && python manage.py runserver

# Terminal 2 - Frontend
cd frontend && npm run dev
```

## 🚀 Deployment Instructions

### Backend Deployment (Digital Ocean)

1. **Database Setup**: Configure PostgreSQL database in Digital Ocean
2. **Environment Variables**: Set all required environment variables in App Platform
3. **Build Configuration**: The Procfile is configured for Gunicorn deployment
4. **Static Files**: Static files are collected automatically during build
5. **Migrations**: Database migrations run automatically on deployment

### Frontend Deployment

1. **Build Process**: `npm run build` creates optimized production bundle
2. **Static Hosting**: Built files served from `/dist` directory
3. **Routing**: Single Page Application with client-side routing configured
4. **CDN Ready**: All assets are optimized and ready for CDN distribution

## 📁 Project Structure

```
ptf/
├── backend/                 # Django REST API
│   ├── accounts/           # User authentication & authorization
│   ├── members/            # Member profile management
│   ├── memberships/        # Membership plans & payments
│   ├── bookings/           # Training session bookings
│   ├── attendance/         # Check-in/out tracking
│   ├── dashboard/          # Analytics & reporting
│   ├── ptf/               # Django project configuration
│   ├── requirements.txt    # Python dependencies
│   └── Procfile           # Deployment configuration
├── frontend/               # React web application
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── pages/         # Application pages/views
│   │   ├── services/      # API service layer
│   │   ├── contexts/      # React Context providers
│   │   └── utils/         # Utility functions
│   ├── dist/              # Production build output
│   └── package.json       # Node.js dependencies
└── README.md              # This file
```

## 🔒 Security Features

- **JWT Authentication**: Secure token-based authentication with refresh capability
- **CORS Protection**: Configured for production domain restrictions
- **CSRF Protection**: Django CSRF middleware enabled
- **HTTPS Enforcement**: SSL redirect and security headers configured
- **Input Validation**: Comprehensive data validation on all endpoints
- **Rate Limiting**: Protection against abuse and DoS attacks

## 📊 Performance Optimizations

- **Database**: Connection pooling with health checks enabled
- **Frontend**: Code splitting and lazy loading implemented
- **Static Assets**: Optimized builds with compression
- **Caching**: Strategic caching for improved response times
- **Bundle Size**: Minimal dependencies and tree-shaking enabled

## 🔄 CI/CD Pipeline

The application uses Git-based deployment with automatic builds:

1. **Code Push**: Changes pushed to production branch
2. **Automatic Build**: Digital Ocean App Platform detects changes
3. **Dependency Installation**: Backend and frontend dependencies installed
4. **Database Migration**: Django migrations applied automatically  
5. **Asset Building**: Frontend assets compiled and optimized
6. **Deployment**: Application deployed with zero-downtime updates

## 📱 API Documentation

- **Swagger UI**: Available at `/swagger/` for interactive API exploration
- **ReDoc**: Available at `/redoc/` for comprehensive API documentation
- **Authentication**: Bearer token required for protected endpoints

## 📞 Support & Maintenance

For technical support or deployment issues:
- Repository: `am-muhwezi/ptf`
- Contact: `admin@paulstropicalfitness.fit`

## 🔗 Quick Links

- **Admin Panel**: `/admin/` (Staff and superuser access)
- **API Documentation**: `/swagger/` or `/redoc/`
- **Member Portal**: Main application interface
- **Health Check**: Built-in health monitoring endpoints

---

**Built with ❤️ for Paul's Tropical Fitness community**

*This application is optimized for production use with enterprise-grade security, performance, and scalability features.*