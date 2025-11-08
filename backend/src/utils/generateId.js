const crypto = require('crypto');

/**
 * Generate unique Event ID
 * Format: EVT-YYYY-XXX
 */
const generateEventId = async (EventModel) => {
  const year = new Date().getFullYear();
  const count = await EventModel.countDocuments();
  return `EVT-${year}-${String(count + 1).padStart(3, '0')}`;
};

/**
 * Generate unique Session ID
 * Format: SES-EVT-YYYY-XXX-XX
 */
const generateSessionId = async (SessionModel, eventId) => {
  const event = await require('../models/Event').findById(eventId);
  if (!event) {
    throw new Error('Event not found');
  }
  
  const sessionCount = await SessionModel.countDocuments({ eventId });
  return `SES-${event.eventId}-${String(sessionCount + 1).padStart(2, '0')}`;
};

/**
 * Generate unique Certificate ID
 * Format: CERT-YYYY-XXXXXX
 */
const generateCertificateId = async (CertificateModel) => {
  const year = new Date().getFullYear();
  const count = await CertificateModel.countDocuments();
  return `CERT-${year}-${String(count + 1).padStart(6, '0')}`;
};

/**
 * Generate verification code for certificates
 */
const generateVerificationCode = () => {
  return crypto.randomBytes(16).toString('hex').toUpperCase();
};

/**
 * Generate random password
 */
const generateRandomPassword = (length = 12) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  let password = '';
  for (let i = 0; i < length; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
};

module.exports = {
  generateEventId,
  generateSessionId,
  generateCertificateId,
  generateVerificationCode,
  generateRandomPassword
};

