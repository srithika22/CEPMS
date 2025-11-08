const Registration = require('../models/Registration');
const Event = require('../models/Event');
const User = require('../models/User');
const ResponseHandler = require('../utils/responseHandler');
const { getIo } = require('../utils/socket');

// @desc    Register for event
// @route   POST /api/registrations
// @access  Private
exports.registerForEvent = async (req, res) => {
  try {
    const { eventId } = req.body;

    const event = await Event.findById(eventId);

    if (!event) {
      return ResponseHandler.notFound(res, 'Event not found');
    }

    // Check if registration is required
    if (!event.registration.required) {
      return ResponseHandler.badRequest(res, 'Registration not required for this event');
    }

    // Check if registration is open
    if (!event.registration.isOpen) {
      return ResponseHandler.badRequest(res, 'Registration is closed for this event');
    }

    // Check registration dates
    const now = new Date();
    if (event.registration.startDate && now < new Date(event.registration.startDate)) {
      return ResponseHandler.badRequest(res, 'Registration has not started yet');
    }
    if (event.registration.endDate && now > new Date(event.registration.endDate)) {
      return ResponseHandler.badRequest(res, 'Registration deadline has passed');
    }

    // Check if already registered
    const existingRegistration = await Registration.findOne({
      eventId,
      userId: req.user._id
    });

    if (existingRegistration) {
      return ResponseHandler.conflict(res, 'Already registered for this event');
    }

    // Check eligibility
    const user = req.user;
    const eligibility = event.eligibility;

    if (user.role === 'student') {
      if (eligibility.departments.length > 0 && !eligibility.departments.includes(user.student.department)) {
        return ResponseHandler.forbidden(res, 'Not eligible: Department restriction');
      }
      if (eligibility.programs.length > 0 && !eligibility.programs.includes(user.student.program)) {
        return ResponseHandler.forbidden(res, 'Not eligible: Program restriction');
      }
      if (eligibility.years.length > 0 && !eligibility.years.includes(user.student.year)) {
        return ResponseHandler.forbidden(res, 'Not eligible: Year restriction');
      }
      if (eligibility.sections.length > 0 && !eligibility.sections.includes(user.student.section)) {
        return ResponseHandler.forbidden(res, 'Not eligible: Section restriction');
      }
    }

    // Check capacity
    let status = 'confirmed';
    if (event.registration.maxParticipants) {
      const currentCount = await Registration.countDocuments({
        eventId,
        status: 'confirmed'
      });

      if (currentCount >= event.registration.maxParticipants) {
        status = 'waitlisted';
      }
    }

    // Create registration
    const registration = await Registration.create({
      eventId,
      userId: req.user._id,
      eventTitle: event.title,
      userName: `${user.firstName} ${user.lastName}`,
      userEmail: user.email,
      userRole: user.role,
      rollNumber: user.student?.rollNumber,
      department: user.student?.department || user.faculty?.department,
      status
    });

    // Update event registration count
    event.registration.currentCount = await Registration.countDocuments({
      eventId,
      status: 'confirmed'
    });
    await event.save();

    // Emit Socket.io event for real-time updates
    try {
      const io = getIo();
      const registrationEvent = {
        type: 'new-registration',
        registration: {
          _id: registration._id,
          eventId: registration.eventId,
          eventTitle: registration.eventTitle,
          userName: registration.userName,
          userEmail: registration.userEmail,
          userRole: registration.userRole,
          department: registration.department,
          status: registration.status,
          registeredAt: registration.createdAt
        },
        event: {
          _id: event._id,
          title: event.title,
          registrationCount: event.registration.currentCount,
          maxParticipants: event.registration.maxParticipants
        },
        timestamp: new Date().toISOString()
      };

      io.emit('new-registration', registrationEvent);
      console.log('Socket.io: New registration event emitted:', registrationEvent.type);
    } catch (socketError) {
      console.error('Socket.io emission error:', socketError);
      // Don't fail the request if socket emission fails
    }

    return ResponseHandler.created(res, registration, `Registration ${status} for event`);
  } catch (error) {
    console.error('Register for event error:', error);
    return ResponseHandler.serverError(res, error.message);
  }
};

// @desc    Get my registrations
// @route   GET /api/registrations/my-registrations
// @access  Private
exports.getMyRegistrations = async (req, res) => {
  try {
    const { status } = req.query;

    const query = { userId: req.user._id };
    if (status) query.status = status;

    const registrations = await Registration.find(query)
      .populate('eventId')
      .sort({ createdAt: -1 });

    return ResponseHandler.success(res, registrations);
  } catch (error) {
    console.error('Get my registrations error:', error);
    return ResponseHandler.serverError(res, error.message);
  }
};

// @desc    Get event registrations
// @route   GET /api/registrations/event/:eventId
// @access  Private (Coordinator/Admin)
exports.getEventRegistrations = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { status, search, page = 1, limit = 50 } = req.query;

    const event = await Event.findById(eventId);
    if (!event) {
      return ResponseHandler.notFound(res, 'Event not found');
    }

    // Authorization is handled by middleware (checkCoordinatorOrEventTrainer)

    const query = { eventId };
    if (status) query.status = status;

    if (search) {
      query.$or = [
        { userName: { $regex: search, $options: 'i' } },
        { userEmail: { $regex: search, $options: 'i' } },
        { rollNumber: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const registrations = await Registration.find(query)
      .populate('userId', 'firstName lastName email phone student faculty')
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ registeredAt: -1 });

    const total = await Registration.countDocuments(query);

    return ResponseHandler.success(res, {
      registrations,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get event registrations error:', error);
    return ResponseHandler.serverError(res, error.message);
  }
};

// @desc    Cancel registration
// @route   DELETE /api/registrations/:id
// @access  Private
exports.cancelRegistration = async (req, res) => {
  try {
    const registration = await Registration.findById(req.params.id);

    if (!registration) {
      return ResponseHandler.notFound(res, 'Registration not found');
    }

    // Check if user owns this registration
    if (registration.userId.toString() !== req.user._id.toString()) {
      return ResponseHandler.forbidden(res, 'Not authorized to cancel this registration');
    }

    registration.status = 'cancelled';
    await registration.save();

    // Update event registration count
    const event = await Event.findById(registration.eventId);
    if (event) {
      event.registration.currentCount = await Registration.countDocuments({
        eventId: registration.eventId,
        status: 'confirmed'
      });
      await event.save();

      // Promote waitlisted participant if any
      const waitlisted = await Registration.findOne({
        eventId: registration.eventId,
        status: 'waitlisted'
      }).sort({ registeredAt: 1 });

      if (waitlisted) {
        waitlisted.status = 'confirmed';
        await waitlisted.save();
        event.registration.currentCount += 1;
        await event.save();
      }

      // Emit Socket.io event for registration cancellation
      try {
        const io = getIo();
        const cancellationEvent = {
          type: 'registration-cancelled',
          registration: {
            _id: registration._id,
            eventId: registration.eventId,
            eventTitle: registration.eventTitle,
            userName: registration.userName,
            userEmail: registration.userEmail,
            userRole: registration.userRole,
            department: registration.department
          },
          event: {
            _id: event._id,
            title: event.title,
            registrationCount: event.registration.currentCount,
            maxParticipants: event.registration.maxParticipants
          },
          promotedUser: waitlisted ? {
            _id: waitlisted._id,
            userName: waitlisted.userName,
            userEmail: waitlisted.userEmail
          } : null,
          timestamp: new Date().toISOString()
        };

        io.emit('registration-cancelled', cancellationEvent);
        console.log('Socket.io: Registration cancelled event emitted:', cancellationEvent.type);

        if (waitlisted) {
          const promotionEvent = {
            type: 'registration-promoted',
            registration: waitlisted,
            event: {
              _id: event._id,
              title: event.title,
              registrationCount: event.registration.currentCount
            },
            timestamp: new Date().toISOString()
          };

          io.emit('registration-promoted', promotionEvent);
          console.log('Socket.io: Registration promoted event emitted:', promotionEvent.type);
        }
      } catch (socketError) {
        console.error('Socket.io emission error:', socketError);
        // Don't fail the request if socket emission fails
      }
    }

    return ResponseHandler.success(res, null, 'Registration cancelled successfully');
  } catch (error) {
    console.error('Cancel registration error:', error);
    return ResponseHandler.serverError(res, error.message);
  }
};

// @desc    Get registration by ID
// @route   GET /api/registrations/:id
// @access  Private
exports.getRegistrationById = async (req, res) => {
  try {
    const registration = await Registration.findById(req.params.id)
      .populate('eventId')
      .populate('userId', 'firstName lastName email phone student faculty');

    if (!registration) {
      return ResponseHandler.notFound(res, 'Registration not found');
    }

    // Check permission
    if (registration.userId._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      const event = await Event.findById(registration.eventId);
      if (!event || event.coordinator.id.toString() !== req.user._id.toString()) {
        return ResponseHandler.forbidden(res, 'Not authorized to view this registration');
      }
    }

    return ResponseHandler.success(res, registration);
  } catch (error) {
    console.error('Get registration by ID error:', error);
    return ResponseHandler.serverError(res, error.message);
  }
};

// @desc    Export registrations (CSV data)
// @route   GET /api/registrations/event/:eventId/export
// @access  Private (Coordinator/Admin)
exports.exportRegistrations = async (req, res) => {
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

    const registrations = await Registration.find({ eventId })
      .populate('userId')
      .sort({ registeredAt: 1 });

    const exportData = registrations.map(reg => ({
      name: reg.userName,
      email: reg.userEmail,
      rollNumber: reg.rollNumber || 'N/A',
      department: reg.department || 'N/A',
      status: reg.status,
      registeredAt: reg.registeredAt,
      attendancePercentage: reg.attendancePercentage || 0,
      certificateIssued: reg.certificate.issued ? 'Yes' : 'No'
    }));

    return ResponseHandler.success(res, exportData);
  } catch (error) {
    console.error('Export registrations error:', error);
    return ResponseHandler.serverError(res, error.message);
  }
};
