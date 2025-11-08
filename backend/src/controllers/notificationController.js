const Notification = require('../models/Notification');
const ResponseHandler = require('../utils/responseHandler');

// @desc    Create notification
// @route   POST /api/notifications
// @access  Private (Admin/Coordinator)
exports.createNotification = async (req, res) => {
  try {
    const notification = await Notification.create(req.body);
    return ResponseHandler.created(res, notification, 'Notification created successfully');
  } catch (error) {
    console.error('Create notification error:', error);
    return ResponseHandler.serverError(res, error.message);
  }
};

// @desc    Get my notifications
// @route   GET /api/notifications
// @access  Private
exports.getMyNotifications = async (req, res) => {
  try {
    const { read, page = 1, limit = 20 } = req.query;

    const query = {
      $or: [
        { recipientId: req.user._id },
        { recipientRole: req.user.role },
        { recipientRole: 'all' }
      ]
    };

    if (read !== undefined) {
      query.read = read === 'true';
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const notifications = await Notification.find(query)
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const total = await Notification.countDocuments(query);
    const unreadCount = await Notification.countDocuments({
      ...query,
      read: false
    });

    return ResponseHandler.success(res, {
      notifications,
      unreadCount,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get my notifications error:', error);
    return ResponseHandler.serverError(res, error.message);
  }
};

// @desc    Mark notification as read
// @route   PATCH /api/notifications/:id/read
// @access  Private
exports.markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findByIdAndUpdate(
      req.params.id,
      {
        read: true,
        readAt: new Date()
      },
      { new: true }
    );

    if (!notification) {
      return ResponseHandler.notFound(res, 'Notification not found');
    }

    return ResponseHandler.success(res, notification, 'Notification marked as read');
  } catch (error) {
    console.error('Mark as read error:', error);
    return ResponseHandler.serverError(res, error.message);
  }
};

// @desc    Mark all notifications as read
// @route   PATCH /api/notifications/mark-all-read
// @access  Private
exports.markAllAsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      {
        $or: [
          { recipientId: req.user._id },
          { recipientRole: req.user.role },
          { recipientRole: 'all' }
        ],
        read: false
      },
      {
        read: true,
        readAt: new Date()
      }
    );

    return ResponseHandler.success(res, null, 'All notifications marked as read');
  } catch (error) {
    console.error('Mark all as read error:', error);
    return ResponseHandler.serverError(res, error.message);
  }
};

// @desc    Delete notification
// @route   DELETE /api/notifications/:id
// @access  Private
exports.deleteNotification = async (req, res) => {
  try {
    const notification = await Notification.findByIdAndDelete(req.params.id);

    if (!notification) {
      return ResponseHandler.notFound(res, 'Notification not found');
    }

    return ResponseHandler.success(res, null, 'Notification deleted successfully');
  } catch (error) {
    console.error('Delete notification error:', error);
    return ResponseHandler.serverError(res, error.message);
  }
};

// @desc    Get unread count
// @route   GET /api/notifications/unread-count
// @access  Private
exports.getUnreadCount = async (req, res) => {
  try {
    const count = await Notification.countDocuments({
      $or: [
        { recipientId: req.user._id },
        { recipientRole: req.user.role },
        { recipientRole: 'all' }
      ],
      read: false
    });

    return ResponseHandler.success(res, { count });
  } catch (error) {
    console.error('Get unread count error:', error);
    return ResponseHandler.serverError(res, error.message);
  }
};
