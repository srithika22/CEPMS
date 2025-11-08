const Notification = require('../models/Notification');

// Helper function to create notifications
const createNotification = async (data) => {
  try {
    const notification = await Notification.create(data);
    return notification;
  } catch (error) {
    console.error('Error creating notification:', error);
    return null;
  }
};

// Notify single user
const notifyUser = async (userId, type, title, message, eventId = null, actionUrl = null, priority = 'normal') => {
  return await createNotification({
    type,
    title,
    message,
    actionUrl,
    eventId,
    recipientId: userId,
    priority
  });
};

// Notify by role
const notifyByRole = async (role, type, title, message, eventId = null, actionUrl = null, priority = 'normal') => {
  return await createNotification({
    type,
    title,
    message,
    actionUrl,
    eventId,
    recipientRole: role,
    priority
  });
};

// Notify by department
const notifyByDepartment = async (departments, type, title, message, eventId = null, actionUrl = null, priority = 'normal') => {
  return await createNotification({
    type,
    title,
    message,
    actionUrl,
    eventId,
    recipientDepartments: Array.isArray(departments) ? departments : [departments],
    recipientRole: 'student',
    priority
  });
};

// Event-specific notifications
const notifyEventCreated = async (event) => {
  const eligibleDepartments = event.eligibility.departments;
  
  if (eligibleDepartments.length > 0) {
    return await notifyByDepartment(
      eligibleDepartments,
      'event_created',
      `New Event: ${event.title}`,
      `A new ${event.category} event has been created. Register now!`,
      event._id,
      `/events/${event._id}`
    );
  } else {
    return await notifyByRole(
      'student',
      'event_created',
      `New Event: ${event.title}`,
      `A new ${event.category} event has been created. Register now!`,
      event._id,
      `/events/${event._id}`
    );
  }
};

const notifyRegistrationConfirmed = async (userId, event) => {
  return await notifyUser(
    userId,
    'registration_confirmed',
    'Registration Confirmed',
    `You have successfully registered for "${event.title}"`,
    event._id,
    `/events/${event._id}`
  );
};

const notifySessionReminder = async (userId, event, session) => {
  return await notifyUser(
    userId,
    'session_reminder',
    `Session Reminder: ${event.title}`,
    `Session "${session.title}" is scheduled for ${new Date(session.date).toLocaleDateString()} at ${session.startTime}`,
    event._id,
    `/events/${event._id}`,
    'high'
  );
};

const notifyFeedbackRequest = async (userId, event) => {
  return await notifyUser(
    userId,
    'feedback_request',
    'Feedback Request',
    `Please provide your feedback for "${event.title}"`,
    event._id,
    `/events/${event._id}/feedback`,
    'high'
  );
};

const notifyCertificateReady = async (userId, event, certificateId) => {
  return await notifyUser(
    userId,
    'certificate_ready',
    'Certificate Ready',
    `Your certificate for "${event.title}" is ready for download`,
    event._id,
    `/certificates/${certificateId}`,
    'high'
  );
};

const notifyEventApproved = async (coordinatorId, event) => {
  return await notifyUser(
    coordinatorId,
    'event_approved',
    'Event Approved',
    `Your event "${event.title}" has been approved`,
    event._id,
    `/events/${event._id}`,
    'high'
  );
};

const notifyEventRejected = async (coordinatorId, event) => {
  return await notifyUser(
    coordinatorId,
    'event_rejected',
    'Event Rejected',
    `Your event "${event.title}" has been rejected`,
    event._id,
    `/events/${event._id}`,
    'urgent'
  );
};

const notifyScheduleChange = async (eventId, participants, event) => {
  // Notify all registered participants
  for (const userId of participants) {
    await notifyUser(
      userId,
      'schedule_change',
      'Schedule Update',
      `The schedule for "${event.title}" has been updated`,
      eventId,
      `/events/${eventId}`,
      'high'
    );
  }
};

module.exports = {
  createNotification,
  notifyUser,
  notifyByRole,
  notifyByDepartment,
  notifyEventCreated,
  notifyRegistrationConfirmed,
  notifySessionReminder,
  notifyFeedbackRequest,
  notifyCertificateReady,
  notifyEventApproved,
  notifyEventRejected,
  notifyScheduleChange
};
