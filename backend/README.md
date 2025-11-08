# CEPMS Backend

College Event & Program Management System - Backend API

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create `.env` file (copy from `.env.example`):
```bash
cp .env.example .env
```

3. Update `.env` with your configuration:
   - MongoDB connection string
   - JWT secret
   - AWS S3 credentials (optional)
   - SMTP credentials (optional)

4. Start development server:
```bash
npm run dev
```

5. Start production server:
```bash
npm start
```

## Project Structure

```
src/
├── config/          # Configuration files
│   └── database.js  # MongoDB connection
├── models/          # Mongoose schemas
├── controllers/     # Business logic
├── routes/          # API routes
├── middleware/      # Express middleware
│   ├── auth.js      # JWT authentication
│   ├── roleCheck.js # Role-based access
│   └── errorHandler.js # Error handling
├── utils/           # Utility functions
│   ├── generateId.js
│   ├── emailService.js
│   └── fileUpload.js
└── server.js        # Entry point
```

## API Routes

Routes will be added as we build APIs one by one. Currently, all routes are scaffolded and ready for implementation.

## Database Collections

1. users - All user types
2. events - Event information
3. sessions - Multi-day event sessions
4. registrations - User event registrations
5. attendance - Session attendance records
6. feedback - Event feedback
7. notifications - User notifications
8. certificates - Generated certificates
9. settings - System configurations

