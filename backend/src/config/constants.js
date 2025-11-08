// User Roles
const USER_ROLES = {
  ADMIN: 'admin',
  FACULTY: 'faculty',
  STUDENT: 'student',
  TRAINER: 'trainer'
};

// Event Categories
const EVENT_CATEGORIES = {
  CRT: 'CRT',
  FDP: 'FDP',
  WORKSHOP: 'Workshop',
  CULTURAL: 'Cultural',
  SPORTS: 'Sports',
  SEMINAR: 'Seminar',
  CONFERENCE: 'Conference',
  OTHER: 'Other'
};

// Event Types
const EVENT_TYPES = {
  ACADEMIC: 'academic',
  TRAINING: 'training',
  CULTURAL: 'cultural',
  SPORTS: 'sports',
  TECHNICAL: 'technical'
};

// Event Status
const EVENT_STATUS = {
  DRAFT: 'draft',
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  ONGOING: 'ongoing',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled'
};

// Registration Status
const REGISTRATION_STATUS = {
  CONFIRMED: 'confirmed',
  WAITLISTED: 'waitlisted',
  CANCELLED: 'cancelled'
};

// Session Status
const SESSION_STATUS = {
  SCHEDULED: 'scheduled',
  ONGOING: 'ongoing',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled'
};

// Notification Types
const NOTIFICATION_TYPES = {
  EVENT_CREATED: 'event_created',
  REGISTRATION_CONFIRMED: 'registration_confirmed',
  SESSION_REMINDER: 'session_reminder',
  FEEDBACK_REQUEST: 'feedback_request',
  CERTIFICATE_READY: 'certificate_ready',
  SCHEDULE_CHANGE: 'schedule_change',
  EVENT_APPROVED: 'event_approved',
  EVENT_REJECTED: 'event_rejected',
  EVENT_CANCELLED: 'event_cancelled'
};

// Notification Priorities
const NOTIFICATION_PRIORITIES = {
  NORMAL: 'normal',
  HIGH: 'high',
  URGENT: 'urgent'
};

// Departments
const DEPARTMENTS = [
  'CSE',
  'ECE',
  'EEE',
  'MECH',
  'CIVIL',
  'IT',
  'AIDS',
  'CSBS'
];

// Programs
const PROGRAMS = [
  'B.Tech',
  'M.Tech',
  'MBA',
  'MCA'
];

// Venue Types
const VENUE_TYPES = {
  SEMINAR_HALL: 'seminar_hall',
  LAB: 'lab',
  AUDITORIUM: 'auditorium',
  CLASSROOM: 'classroom',
  GROUND: 'ground',
  ONLINE: 'online'
};

// File Types
const FILE_TYPES = {
  PDF: 'pdf',
  PPT: 'ppt',
  VIDEO: 'video',
  DOC: 'doc',
  OTHER: 'other'
};

// Feedback Question Types
const FEEDBACK_QUESTION_TYPES = {
  RATING: 'rating',
  TEXT: 'text',
  MCQ: 'mcq'
};

module.exports = {
  USER_ROLES,
  EVENT_CATEGORIES,
  EVENT_TYPES,
  EVENT_STATUS,
  REGISTRATION_STATUS,
  SESSION_STATUS,
  NOTIFICATION_TYPES,
  NOTIFICATION_PRIORITIES,
  DEPARTMENTS,
  PROGRAMS,
  VENUE_TYPES,
  FILE_TYPES,
  FEEDBACK_QUESTION_TYPES
};
