# 💪 PTF 

A scalable, multi-role fitness and wellness platform built with Django and FastAPI.  
Supports:
- **Trainers & Superadmins** (Web App)
- **Clients & Caregivers** (Mobile App)

> 🚀 Backend: Django + DRF (for Authentication only) + FastAPI (for APIs)  
> 🧠 Auth: JWT (using SimpleJWT)  
> 💾 Database: PostgreSQL  
> 🖥️ Frontend: React.js (Web), React Native (Mobile)

---

## 🗂️ Project Structure

efitness-platform/
├── auth_service/ # Django DRF for authentication
│ ├── users/ # Custom User model & views
│ └── ...
├── api_service/ # FastAPI for core functionality
│ ├── routers/ # API endpoints
│ ├── models/ # SQLAlchemy models
│ ├── schemas/ # Pydantic schemas
│ └── main.py # FastAPI app
├── mobile_app/ # React Native mobile app
├── web_app/ # React.js trainer/admin dashboard
├── docker-compose.yml
└── README.md


---

## ⚙️ Features

### 🧑‍🏫 Trainer
- Create & manage training plans
- Assign plans to clients
- Track client progress

### 🧍 Client
- View and follow assigned plans
- Track progress
- Communicate with caregivers

### 👩‍⚕️ Caregiver
- Monitor client activity
- Assist with plan adherence

### 🛡️ Superadmin
- Manage users and permissions
- View usage reports

---

## 🏗️ Backend Architecture

Frontend (React/React Native)
│
▼
[Django DRF - Auth Only] <───> [JWT]
│
▼
[FastAPI - Core APIs]
│
▼
[PostgreSQL Database]


---

## 🔐 Authentication (DRF)

- Endpoint: `/api/token/`
- Token-based auth using **JWT (SimpleJWT)**
- DRF handles login, registration, and role-based user model

### Example

```http
POST /api/token/
{
  "username": "trainer1",
  "password": "securepassword"
}
Response:
{
  "access": "jwt-access-token",
  "refresh": "jwt-refresh-token"
}
