# CEPMS - College Event & Program Management System

A comprehensive system for managing college events, programs, registrations, attendance, and certificates.

## Project Structure

```
cepms/
├── backend/          # Node.js + Express + MongoDB API
└── frontend/         # React + Vite frontend
```

## Features

- ✅ User Management (Admin, Faculty, Student, Trainer)
- ✅ Event Management with Approval Workflow
- ✅ Multi-day Session Management
- ✅ Registration System
- ✅ Attendance Tracking
- ✅ Feedback Collection
- ✅ Certificate Generation
- ✅ Notification System
- ✅ Settings Management

## Tech Stack

### Backend
- Node.js + Express
- MongoDB + Mongoose
- JWT Authentication
- AWS S3 (for file uploads)
- Nodemailer (for emails)

### Frontend
- React 18
- React Router
- Axios
- React Query
- Vite

## Quick Start

### Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file:
```env
NODE_ENV=development
PORT=5000
FRONTEND_URL=http://localhost:3000
MONGODB_URI=mongodb://localhost:27017/cepms
JWT_SECRET=your-secret-key
JWT_EXPIRE=30d
```

4. Start server:
```bash
npm run dev
```

### Frontend Setup

1. Navigate to frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start development server:
```bash
npm run dev
```

## Database Schema

The system uses 9 MongoDB collections:

1. **users** - All user types (admin, faculty, student, trainer)
2. **events** - Event information with embedded settings
3. **sessions** - Multi-day event sessions
4. **registrations** - User event registrations with attendance summary
5. **attendance** - Session-wise attendance records
6. **feedback** - Event/trainer feedback
7. **notifications** - User notifications
8. **certificates** - Generated certificates
9. **settings** - System configurations

## API Development

APIs will be built one by one and tested in Postman. The route structure is ready:

- `/api/auth` - Authentication routes
- `/api/users` - User management
- `/api/events` - Event management
- `/api/sessions` - Session management
- `/api/registrations` - Registration management
- `/api/attendance` - Attendance tracking
- `/api/feedback` - Feedback submission
- `/api/notifications` - Notifications
- `/api/certificates` - Certificate management
- `/api/settings` - System settings

## Next Steps

1. Set up MongoDB database
2. Configure environment variables
3. Start building APIs one by one
4. Test each API in Postman
5. Connect frontend to APIs

## License

ISC

