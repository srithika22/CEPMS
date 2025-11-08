const nodemailer = require('nodemailer');

// Create transporter
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT || 587,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });
};

/**
 * Send email
 */
const sendEmail = async (options) => {
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: `${process.env.APP_NAME || 'CEPMS'} <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
      to: options.email,
      subject: options.subject,
      text: options.text,
      html: options.html
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Email send error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Send welcome email
 */
const sendWelcomeEmail = async (user, password) => {
  const subject = 'Welcome to CEPMS';
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Welcome to College Event & Program Management System</h2>
      <p>Hello ${user.firstName},</p>
      <p>Your account has been created successfully.</p>
      <p><strong>Email:</strong> ${user.email}</p>
      ${password ? `<p><strong>Temporary Password:</strong> ${password}</p>
      <p>Please change your password after first login.</p>` : ''}
      <p>Login at: <a href="${process.env.FRONTEND_URL}">${process.env.FRONTEND_URL}</a></p>
    </div>
  `;

  return await sendEmail({
    email: user.email,
    subject,
    html,
    text: `Welcome to CEPMS. Your email: ${user.email}${password ? `, Password: ${password}` : ''}`
  });
};

/**
 * Send event registration confirmation
 */
const sendRegistrationConfirmation = async (user, event) => {
  const subject = `Registration Confirmed - ${event.title}`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Registration Confirmed</h2>
      <p>Hello ${user.firstName},</p>
      <p>Your registration for <strong>${event.title}</strong> has been confirmed.</p>
      <p><strong>Event Details:</strong></p>
      <ul>
        <li>Date: ${new Date(event.startDate).toLocaleDateString()}</li>
        <li>Venue: ${event.venue?.name || 'TBA'}</li>
      </ul>
      <p>View event details: <a href="${process.env.FRONTEND_URL}/events/${event._id}">Click here</a></p>
    </div>
  `;

  return await sendEmail({
    email: user.email,
    subject,
    html
  });
};

/**
 * Send session reminder
 */
const sendSessionReminder = async (user, session, event) => {
  const subject = `Reminder: ${session.title} - ${event.title}`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Session Reminder</h2>
      <p>Hello ${user.firstName},</p>
      <p>This is a reminder for the upcoming session:</p>
      <p><strong>${session.title}</strong></p>
      <p><strong>Event:</strong> ${event.title}</p>
      <p><strong>Date:</strong> ${new Date(session.date).toLocaleDateString()}</p>
      <p><strong>Time:</strong> ${session.startTime} - ${session.endTime}</p>
      <p><strong>Venue:</strong> ${session.venue?.name || 'TBA'}</p>
    </div>
  `;

  return await sendEmail({
    email: user.email,
    subject,
    html
  });
};

/**
 * Send certificate ready notification
 */
const sendCertificateReady = async (user, certificate, event) => {
  const subject = `Certificate Ready - ${event.title}`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Your Certificate is Ready!</h2>
      <p>Hello ${user.firstName},</p>
      <p>Congratulations! Your certificate for <strong>${event.title}</strong> is ready.</p>
      <p>Download your certificate: <a href="${process.env.FRONTEND_URL}/certificates/${certificate._id}">Click here</a></p>
      <p><strong>Verification Code:</strong> ${certificate.verificationCode}</p>
    </div>
  `;

  return await sendEmail({
    email: user.email,
    subject,
    html
  });
};

module.exports = {
  sendEmail,
  sendWelcomeEmail,
  sendRegistrationConfirmation,
  sendSessionReminder,
  sendCertificateReady
};

