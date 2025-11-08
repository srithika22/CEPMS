# CEPMS API Endpoints - Postman Testing Guide

All endpoints are prefixed with `/api`. Base URL: `http://localhost:5000`

## Authentication

### Register User
- **POST** `/api/auth/register`
- **Access**: Public
- **Body**:
```json
{
  "email": "user@example.com",
  "password": "password123",
  "firstName": "John",
  "lastName": "Doe",
  "role": "student",
  "phone": "1234567890",
  "student": {
    "rollNumber": "R001",
    "department": "CSE",
    "program": "B.Tech",
    "year": 2,
    "semester": 3,
    "section": "A",
    "batch": "2022"
  }
}
```

### Login
- **POST** `/api/auth/login`
- **Access**: Public
- **Body**:
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

### Get Current User
- **GET** `/api/auth/me`
- **Access**: Private (Bearer Token required)

### Update Profile
- **PUT** `/api/auth/profile`
- **Access**: Private
- **Body**: Update fields (firstName, lastName, phone, etc.)

### Change Password
- **PUT** `/api/auth/change-password`
- **Access**: Private
- **Body**:
```json
{
  "currentPassword": "oldpass",
  "newPassword": "newpass123"
}
```

### Logout
- **POST** `/api/auth/logout`
- **Access**: Private

---

## Events

### Get All Events
- **GET** `/api/events`
- **Access**: Public
- **Query Params**: `status`, `category`, `type`, `department`, `search`, `startDate`, `endDate`, `page`, `limit`, `sortBy`, `order`

### Get Event by ID
- **GET** `/api/events/:id`
- **Access**: Public

### Get My Registered Events
- **GET** `/api/events/registered`
- **Access**: Private

### Get My Events (Created)
- **GET** `/api/events/my-events`
- **Access**: Private

### Create Event
- **POST** `/api/events`
- **Access**: Private (Coordinator/Admin)
- **Body**:
```json
{
  "title": "Web Development Workshop",
  "description": "Learn modern web development",
  "category": "Workshop",
  "type": "technical",
  "startDate": "2024-01-15T09:00:00Z",
  "endDate": "2024-01-17T17:00:00Z",
  "registration": {
    "required": true,
    "startDate": "2024-01-01T00:00:00Z",
    "endDate": "2024-01-10T23:59:59Z",
    "maxParticipants": 50,
    "isOpen": true
  },
  "eligibility": {
    "departments": ["CSE", "IT"],
    "programs": ["B.Tech"],
    "years": [2, 3],
    "sections": ["A", "B"]
  },
  "venue": {
    "name": "Seminar Hall 1",
    "type": "seminar_hall",
    "isOnline": false
  },
  "certificate": {
    "enabled": true,
    "minAttendance": 80,
    "templateUrl": "https://example.com/template.pdf"
  },
  "feedback": {
    "enabled": true,
    "questions": [
      {
        "id": "q1",
        "text": "Rate the event",
        "type": "rating",
        "required": true
      }
    ]
  }
}
```

### Update Event
- **PUT** `/api/events/:id`
- **Access**: Private (Coordinator/Admin)

### Delete Event
- **DELETE** `/api/events/:id`
- **Access**: Private (Coordinator/Admin)

### Approve Event
- **PATCH** `/api/events/:id/approve`
- **Access**: Private (Admin)

### Reject Event
- **PATCH** `/api/events/:id/reject`
- **Access**: Private (Admin)

### Update Event Status
- **PATCH** `/api/events/:id/status`
- **Access**: Private (Coordinator/Admin)
- **Body**: `{ "status": "ongoing" }`

### Toggle Registration
- **PATCH** `/api/events/:id/toggle-registration`
- **Access**: Private (Coordinator/Admin)

### Get Event Statistics
- **GET** `/api/events/:id/stats`
- **Access**: Private (Coordinator/Admin)

---

## Registrations

### Register for Event
- **POST** `/api/registrations`
- **Access**: Private
- **Body**:
```json
{
  "eventId": "event_id_here"
}
```

### Get My Registrations
- **GET** `/api/registrations/my-registrations`
- **Access**: Private
- **Query Params**: `status`

### Get Registration by ID
- **GET** `/api/registrations/:id`
- **Access**: Private

### Cancel Registration
- **DELETE** `/api/registrations/:id`
- **Access**: Private

### Get Event Registrations
- **GET** `/api/registrations/event/:eventId`
- **Access**: Private (Coordinator/Admin)
- **Query Params**: `status`, `search`, `page`, `limit`

### Export Registrations
- **GET** `/api/registrations/event/:eventId/export`
- **Access**: Private (Coordinator/Admin)

---

## Sessions

### Get Event Sessions
- **GET** `/api/sessions/event/:eventId`
- **Access**: Public

### Get Session by ID
- **GET** `/api/sessions/:id`
- **Access**: Public

### Create Session
- **POST** `/api/sessions`
- **Access**: Private (Coordinator/Admin)
- **Body**:
```json
{
  "eventId": "event_id",
  "number": 1,
  "title": "Introduction to React",
  "description": "Learn React basics",
  "date": "2024-01-15",
  "startTime": "09:00",
  "endTime": "12:00",
  "duration": 180,
  "trainer": {
    "id": "trainer_id",
    "name": "Trainer Name",
    "email": "trainer@example.com"
  },
  "venue": {
    "name": "Lab 1",
    "isOnline": false
  }
}
```

### Update Session
- **PUT** `/api/sessions/:id`
- **Access**: Private (Coordinator/Admin)

### Delete Session
- **DELETE** `/api/sessions/:id`
- **Access**: Private (Coordinator/Admin)

### Add Session Material
- **POST** `/api/sessions/:id/materials`
- **Access**: Private (Coordinator/Admin)
- **Body**:
```json
{
  "name": "React Slides",
  "url": "https://example.com/slides.pdf",
  "type": "pdf"
}
```

### Update Session Status
- **PATCH** `/api/sessions/:id/status`
- **Access**: Private (Coordinator/Admin)
- **Body**: `{ "status": "completed" }`

---

## Attendance

### Get My Attendance
- **GET** `/api/attendance/my-attendance`
- **Access**: Private

### Get User Event Attendance
- **GET** `/api/attendance/user/:userId/event/:eventId`
- **Access**: Private

### Mark Attendance
- **POST** `/api/attendance/mark`
- **Access**: Private (Coordinator/Admin)
- **Body**:
```json
{
  "sessionId": "session_id",
  "attendanceRecords": [
    {
      "userId": "user_id",
      "present": true,
      "remarks": "On time"
    }
  ]
}
```

### Get Session Attendance
- **GET** `/api/attendance/session/:sessionId`
- **Access**: Private (Coordinator/Admin)

### Export Event Attendance
- **GET** `/api/attendance/event/:eventId/export`
- **Access**: Private (Coordinator/Admin)

---

## Feedback

### Submit Feedback
- **POST** `/api/feedback`
- **Access**: Private
- **Body**:
```json
{
  "eventId": "event_id",
  "trainerId": "trainer_id",
  "responses": [
    {
      "questionId": "q1",
      "question": "Rate the event",
      "type": "rating",
      "answer": 5
    }
  ],
  "overallRating": 5,
  "comments": "Great event!"
}
```

### Get My Feedback
- **GET** `/api/feedback/my-feedback`
- **Access**: Private

### Check Feedback Status
- **GET** `/api/feedback/check/:eventId`
- **Access**: Private

### Get Event Feedback
- **GET** `/api/feedback/event/:eventId`
- **Access**: Private (Coordinator/Admin)

### Get Trainer Feedback
- **GET** `/api/feedback/trainer/:trainerId`
- **Access**: Private

---

## Certificates

### Verify Certificate (Public)
- **GET** `/api/certificates/verify/:verificationCode`
- **Access**: Public

### Get Certificate by ID
- **GET** `/api/certificates/:id`
- **Access**: Public

### Get My Certificates
- **GET** `/api/certificates/user/my-certificates`
- **Access**: Private

### Generate Certificate
- **POST** `/api/certificates/generate`
- **Access**: Private (Coordinator/Admin)
- **Body**:
```json
{
  "eventId": "event_id",
  "userId": "user_id",
  "certificateUrl": "https://example.com/cert.pdf"
}
```

### Bulk Generate Certificates
- **POST** `/api/certificates/bulk-generate`
- **Access**: Private (Coordinator/Admin)
- **Body**:
```json
{
  "eventId": "event_id"
}
```

### Get Event Certificates
- **GET** `/api/certificates/event/:eventId`
- **Access**: Private (Coordinator/Admin)

### Track Download
- **POST** `/api/certificates/:id/download`
- **Access**: Private

---

## Users

### Get My Profile
- **GET** `/api/users/profile`
- **Access**: Private

### Update My Profile
- **PUT** `/api/users/profile`
- **Access**: Private

### Get All Users (Admin)
- **GET** `/api/users`
- **Access**: Private (Admin)
- **Query Params**: `role`, `department`, `isActive`, `search`, `page`, `limit`

### Create User (Admin)
- **POST** `/api/users`
- **Access**: Private (Admin)

### Get User by ID (Admin)
- **GET** `/api/users/:id`
- **Access**: Private (Admin)

### Update User (Admin)
- **PUT** `/api/users/:id`
- **Access**: Private (Admin)

### Delete User (Admin)
- **DELETE** `/api/users/:id`
- **Access**: Private (Admin)

### Toggle User Status (Admin)
- **PATCH** `/api/users/:id/toggle-status`
- **Access**: Private (Admin)

### Get Students by Department
- **GET** `/api/users/students/department/:department`
- **Access**: Private
- **Query Params**: `year`, `section`, `program`

### Get Faculty
- **GET** `/api/users/faculty`
- **Access**: Private
- **Query Params**: `department`, `canCoordinate`

### Get Trainers
- **GET** `/api/users/trainers`
- **Access**: Private

---

## Notifications

### Get My Notifications
- **GET** `/api/notifications`
- **Access**: Private
- **Query Params**: `read`, `page`, `limit`

### Get Unread Count
- **GET** `/api/notifications/unread-count`
- **Access**: Private

### Mark as Read
- **PATCH** `/api/notifications/:id/read`
- **Access**: Private

### Mark All as Read
- **PATCH** `/api/notifications/mark-all-read`
- **Access**: Private

### Delete Notification
- **DELETE** `/api/notifications/:id`
- **Access**: Private

### Create Notification (Admin/Coordinator)
- **POST** `/api/notifications`
- **Access**: Private (Admin/Faculty)
- **Body**:
```json
{
  "type": "event_created",
  "title": "New Event",
  "message": "A new event has been created",
  "actionUrl": "/events/123",
  "eventId": "event_id",
  "recipientId": "user_id",
  "recipientRole": "student",
  "priority": "normal"
}
```

---

## Dashboard

### Admin Dashboard
- **GET** `/api/dashboard/admin`
- **Access**: Private (Admin)

### Coordinator Dashboard
- **GET** `/api/dashboard/coordinator`
- **Access**: Private (Faculty/Admin)

### Student Dashboard
- **GET** `/api/dashboard/student`
- **Access**: Private (Student)

### Trainer Dashboard
- **GET** `/api/dashboard/trainer`
- **Access**: Private (Trainer)

---

## Testing Notes

1. **Authentication**: Use Bearer token in Authorization header:
   ```
   Authorization: Bearer <token_from_login_response>
   ```

2. **Role Requirements**:
   - Admin: Full access
   - Faculty: Can coordinate events (if `canCoordinate: true`)
   - Student: Can register and view own data
   - Trainer: Can view assigned events and feedback

3. **Test Flow**:
   - Register/Login → Get token
   - Create event (as coordinator/admin)
   - Approve event (as admin)
   - Register for event (as student)
   - Create sessions (as coordinator)
   - Mark attendance (as coordinator)
   - Submit feedback (as student)
   - Generate certificates (as coordinator)

4. **Health Check**: `GET /health` - No auth required

---

## Response Format

All responses follow this format:
```json
{
  "success": true,
  "data": { ... },
  "message": "Success message"
}
```

Error responses:
```json
{
  "success": false,
  "message": "Error message"
}
```


