const Certificate = require('../models/Certificate');
const Registration = require('../models/Registration');
const Event = require('../models/Event');
const ResponseHandler = require('../utils/responseHandler');

// @desc    Generate certificate
// @route   POST /api/certificates/generate
// @access  Private (Coordinator/Admin)
exports.generateCertificate = async (req, res) => {
  try {
    const { eventId, userId } = req.body;

    const event = await Event.findById(eventId);
    if (!event) {
      return ResponseHandler.notFound(res, 'Event not found');
    }

    if (!event.certificate.enabled) {
      return ResponseHandler.badRequest(res, 'Certificates not enabled for this event');
    }

    // Check permission
    if (req.user.role !== 'admin' && event.coordinator.id.toString() !== req.user._id.toString()) {
      return ResponseHandler.forbidden(res, 'Not authorized');
    }

    const registration = await Registration.findOne({ eventId, userId })
      .populate('userId')
      .populate('eventId');

    if (!registration) {
      return ResponseHandler.notFound(res, 'Registration not found');
    }

    if (!registration.certificate.eligible) {
      return ResponseHandler.badRequest(
        res,
        `Participant not eligible. Required attendance: ${event.certificate.minAttendance}%, Current: ${registration.attendancePercentage.toFixed(2)}%`
      );
    }

    if (registration.certificate.issued) {
      return ResponseHandler.conflict(res, 'Certificate already issued');
    }

    // Calculate event duration and dates
    const startDate = new Date(event.startDate);
    const endDate = new Date(event.endDate);
    const durationDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;

    const formatDate = (date) => {
      return new Date(date).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
    };

    const eventDates = `${formatDate(startDate)} - ${formatDate(endDate)}`;
    const eventDuration = `${durationDays} day${durationDays > 1 ? 's' : ''}`;

    // Create certificate
    const certificate = await Certificate.create({
      eventId,
      userId,
      eventTitle: event.title,
      userName: registration.userName,
      rollNumber: registration.rollNumber,
      department: registration.department,
      eventDuration,
      eventDates,
      attendancePercentage: registration.attendancePercentage,
      templateUrl: event.certificate.templateUrl,
      certificateUrl: req.body.certificateUrl || '', // Generated certificate URL
      issuedBy: req.user._id
    });

    // Update registration
    registration.certificate.issued = true;
    registration.certificate.certificateId = certificate.certificateId;
    registration.certificate.url = certificate.certificateUrl;
    registration.certificate.issuedAt = new Date();
    await registration.save();

    // Update event stats
    event.stats.certificatesIssued = (event.stats.certificatesIssued || 0) + 1;
    await event.save();

    return ResponseHandler.created(res, certificate, 'Certificate generated successfully');
  } catch (error) {
    console.error('Generate certificate error:', error);
    return ResponseHandler.serverError(res, error.message);
  }
};

// @desc    Bulk generate certificates
// @route   POST /api/certificates/bulk-generate
// @access  Private (Coordinator/Admin)
exports.bulkGenerateCertificates = async (req, res) => {
  try {
    const { eventId } = req.body;

    const event = await Event.findById(eventId);
    if (!event) {
      return ResponseHandler.notFound(res, 'Event not found');
    }

    // Check permission
    if (req.user.role !== 'admin' && event.coordinator.id.toString() !== req.user._id.toString()) {
      return ResponseHandler.forbidden(res, 'Not authorized');
    }

    const eligibleRegistrations = await Registration.find({
      eventId,
      'certificate.eligible': true,
      'certificate.issued': false
    }).populate('userId');

    const certificates = [];

    for (const registration of eligibleRegistrations) {
      const startDate = new Date(event.startDate);
      const endDate = new Date(event.endDate);
      const durationDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;

      const formatDate = (date) => {
        return new Date(date).toLocaleDateString('en-GB', {
          day: '2-digit',
          month: 'short',
          year: 'numeric'
        });
      };

      const certificate = await Certificate.create({
        eventId,
        userId: registration.userId._id,
        eventTitle: event.title,
        userName: registration.userName,
        rollNumber: registration.rollNumber,
        department: registration.department,
        eventDuration: `${durationDays} day${durationDays > 1 ? 's' : ''}`,
        eventDates: `${formatDate(startDate)} - ${formatDate(endDate)}`,
        attendancePercentage: registration.attendancePercentage,
        templateUrl: event.certificate.templateUrl,
        certificateUrl: '', // To be updated after actual generation
        issuedBy: req.user._id
      });

      registration.certificate.issued = true;
      registration.certificate.certificateId = certificate.certificateId;
      registration.certificate.url = certificate.certificateUrl;
      registration.certificate.issuedAt = new Date();
      await registration.save();

      certificates.push(certificate);
    }

    // Update event stats
    event.stats.certificatesIssued = (event.stats.certificatesIssued || 0) + certificates.length;
    await event.save();

    return ResponseHandler.success(
      res,
      certificates,
      `${certificates.length} certificate(s) generated successfully`
    );
  } catch (error) {
    console.error('Bulk generate certificates error:', error);
    return ResponseHandler.serverError(res, error.message);
  }
};

// @desc    Get my certificates
// @route   GET /api/certificates/my-certificates
// @access  Private
exports.getMyCertificates = async (req, res) => {
  try {
    const certificates = await Certificate.find({ userId: req.user._id })
      .populate('eventId', 'title eventId')
      .sort({ issuedAt: -1 });

    return ResponseHandler.success(res, certificates);
  } catch (error) {
    console.error('Get my certificates error:', error);
    return ResponseHandler.serverError(res, error.message);
  }
};

// @desc    Get event certificates
// @route   GET /api/certificates/event/:eventId
// @access  Private (Coordinator/Admin)
exports.getEventCertificates = async (req, res) => {
  try {
    const { eventId } = req.params;

    const event = await Event.findById(eventId);
    if (!event) {
      return ResponseHandler.notFound(res, 'Event not found');
    }

    // Check permission
    if (req.user.role !== 'admin' && event.coordinator.id.toString() !== req.user._id.toString()) {
      return ResponseHandler.forbidden(res, 'Not authorized');
    }

    const certificates = await Certificate.find({ eventId })
      .populate('userId', 'firstName lastName email student')
      .sort({ issuedAt: -1 });

    return ResponseHandler.success(res, certificates);
  } catch (error) {
    console.error('Get event certificates error:', error);
    return ResponseHandler.serverError(res, error.message);
  }
};

// @desc    Get certificate by ID
// @route   GET /api/certificates/:id
// @access  Public (for verification)
exports.getCertificateById = async (req, res) => {
  try {
    const certificate = await Certificate.findById(req.params.id)
      .populate('eventId', 'title eventId category')
      .populate('userId', 'firstName lastName email');

    if (!certificate) {
      return ResponseHandler.notFound(res, 'Certificate not found');
    }

    return ResponseHandler.success(res, certificate);
  } catch (error) {
    console.error('Get certificate by ID error:', error);
    return ResponseHandler.serverError(res, error.message);
  }
};

// @desc    Verify certificate
// @route   GET /api/certificates/verify/:verificationCode
// @access  Public
exports.verifyCertificate = async (req, res) => {
  try {
    const { verificationCode } = req.params;

    const certificate = await Certificate.findOne({ verificationCode })
      .populate('eventId', 'title eventId category')
      .populate('userId', 'firstName lastName');

    if (!certificate) {
      return ResponseHandler.notFound(res, 'Certificate not found or invalid verification code');
    }

    return ResponseHandler.success(res, {
      valid: true,
      certificate: {
        certificateId: certificate.certificateId,
        userName: certificate.userName,
        eventTitle: certificate.eventTitle,
        eventDates: certificate.eventDates,
        issuedAt: certificate.issuedAt
      }
    });
  } catch (error) {
    console.error('Verify certificate error:', error);
    return ResponseHandler.serverError(res, error.message);
  }
};

// @desc    Track certificate download
// @route   POST /api/certificates/:id/download
// @access  Private
exports.trackDownload = async (req, res) => {
  try {
    const certificate = await Certificate.findById(req.params.id);

    if (!certificate) {
      return ResponseHandler.notFound(res, 'Certificate not found');
    }

    certificate.downloadCount += 1;
    certificate.lastDownloadedAt = new Date();
    await certificate.save();

    return ResponseHandler.success(res, null, 'Download tracked');
  } catch (error) {
    console.error('Track download error:', error);
    return ResponseHandler.serverError(res, error.message);
  }
};
