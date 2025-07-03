# 📚 AI-HealthCare API Documentation

This document provides detailed information about the API endpoints available in the AI-HealthCare platform.

## 🔐 Authentication

### Register a New User

```
POST /api/auth/register
```

Register a new user account.

#### Request Body

```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securePassword123!",
  "role": "patient" // Optional, defaults to "patient"
}
```

#### Response

```json
{
  "success": true,
  "message": "User registered successfully",
  "user": {
    "id": "user_id",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "patient"
  }
}
```

### Sign In

Authentication is handled via NextAuth.js.

```
POST /api/auth/signin
```

#### Request Body

```json
{
  "email": "john@example.com",
  "password": "securePassword123!"
}
```

#### Response

Returns a session cookie and redirects to the dashboard.

## 🩺 Symptom Checker

### Analyze Symptoms

```
POST /api/symptom-check
```

Analyze symptoms using AI and provide recommendations.

#### Request Body

```json
{
  "symptoms": ["fever", "cough", "headache"]
}
```

#### Response

```json
{
  "analysis": {
    "possibleConditions": ["Common Cold", "Flu", "COVID-19"],
    "severity": "moderate",
    "recommendations": ["Rest", "Fluids", "Monitor temperature"],
    "urgency": "non-urgent"
  },
  "message": "Symptoms analyzed successfully"
}
```

## 📹 Consultations

### Create Consultation

```
POST /api/consultations
```

Schedule a new consultation with a healthcare provider.

#### Request Body

```json
{
  "patientId": "patient_user_id", // Optional if patient is making the request
  "providerId": "provider_user_id",
  "scheduledDate": "2023-10-15T10:00:00Z",
  "symptoms": ["fever", "cough"],
  "notes": "Follow-up for previous consultation"
}
```

#### Response

```json
{
  "id": "consultation_id",
  "patientId": "patient_user_id",
  "providerId": "provider_user_id",
  "scheduledDate": "2023-10-15T10:00:00Z",
  "status": "scheduled",
  "symptoms": ["fever", "cough"],
  "notes": "Follow-up for previous consultation",
  "createdAt": "2023-10-10T15:30:00Z"
}
```

### Get Consultation Details

```
GET /api/consultations/{id}
```

Get details of a specific consultation.

#### Response

```json
{
  "id": "consultation_id",
  "patient": {
    "id": "patient_user_id",
    "name": "John Doe"
  },
  "provider": {
    "id": "provider_user_id",
    "name": "Dr. Jane Smith"
  },
  "scheduledDate": "2023-10-15T10:00:00Z",
  "status": "scheduled",
  "symptoms": ["fever", "cough"],
  "notes": "Follow-up for previous consultation",
  "createdAt": "2023-10-10T15:30:00Z"
}
```

### Update Consultation

```
PUT /api/consultations/{id}
```

Update an existing consultation.

#### Request Body

```json
{
  "status": "completed",
  "notes": "Patient responded well to treatment. Follow-up in 2 weeks."
}
```

#### Response

```json
{
  "id": "consultation_id",
  "status": "completed",
  "notes": "Patient responded well to treatment. Follow-up in 2 weeks.",
  "updatedAt": "2023-10-15T11:00:00Z"
}
```

## 📱 SMS Support

### Send SMS

```
POST /api/sms
```

Send an SMS message to a patient or provider.

#### Request Body

```json
{
  "to": "+1234567890",
  "message": "Reminder: Your appointment is scheduled for tomorrow at 10:00 AM."
}
```

#### Response

```json
{
  "success": true,
  "messageId": "SM123456789"
}
```

## 📊 Provider Dashboard

### Get Provider Dashboard Data

```
GET /api/provider/dashboard
```

Get statistics and data for the provider dashboard.

#### Response

```json
{
  "upcomingConsultations": [
    {
      "id": "consultation_id",
      "patientName": "John Doe",
      "scheduledDate": "2023-10-15T10:00:00Z",
      "symptoms": ["fever", "cough"]
    }
  ],
  "stats": {
    "totalConsultations": 45,
    "pendingConsultations": 5,
    "completedConsultations": 40,
    "averageRating": 4.8
  },
  "recentPatients": [
    {
      "id": "patient_id",
      "name": "Jane Smith",
      "lastConsultation": "2023-10-10T14:00:00Z"
    }
  ]
}
```

## 👨‍💼 Admin Dashboard

### Get Admin Dashboard Data

```
GET /api/admin/dashboard
```

Get statistics and data for the admin dashboard.

#### Response

```json
{
  "stats": {
    "totalUsers": 1250,
    "totalPatients": 1200,
    "totalProviders": 45,
    "totalConsultations": 3450,
    "activeConsultations": 120
  },
  "userGrowth": [
    { "month": "Jan", "count": 50 },
    { "month": "Feb", "count": 75 }
  ],
  "consultationsByType": [
    { "type": "Follow-up", "count": 1200 },
    { "type": "Initial", "count": 2250 }
  ],
  "systemStatus": {
    "apiStatus": "healthy",
    "databaseStatus": "healthy",
    "aiServiceStatus": "healthy"
  }
}
```

## 🔄 Real-time Services (Socket.IO)

### Socket Health Check

```
GET /api/socket
```

Simple health check endpoint for the Socket.IO server.

#### Response

```json
{
  "status": "ok",
  "message": "Socket server is running"
}
```

### Socket Events

The socket server handles the following events:

- `join-room`: Join a consultation room
- `leave-room`: Leave a consultation room
- `call-user`: Initiate a call to another user
- `answer-call`: Accept an incoming call
- `ice-candidate`: Exchange ICE candidates for WebRTC
- `end-call`: End the current call
- `message`: Send a chat message in a consultation room

## 🛠️ Error Handling

All API endpoints follow a consistent error response format:

```json
{
  "error": "Error message describing what went wrong",
  "status": 400 // HTTP status code
}
```

Common error status codes:

- `400`: Bad Request - Invalid input data
- `401`: Unauthorized - Authentication required
- `403`: Forbidden - Not allowed to access this resource
- `404`: Not Found - Resource doesn't exist
- `500`: Internal Server Error - Something went wrong on the server
