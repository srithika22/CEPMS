const User = require('../models/User');
const { generateToken } = require('../utils/jwtUtils');
const ResponseHandler = require('../utils/responseHandler');

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res) => {
  try {
    const { email, password, firstName, lastName, role, ...roleData } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return ResponseHandler.conflict(res, 'User already exists with this email');
    }

    // Create user object
    const userData = {
      email,
      password,
      firstName,
      lastName,
      role: role || 'student',
      phone: req.body.phone,
      profilePicture: req.body.profilePicture
    };

    // Add role-specific data
    if (role === 'student' && roleData.student) {
      userData.student = roleData.student;
    } else if (role === 'faculty' && roleData.faculty) {
      userData.faculty = roleData.faculty;
    } else if (role === 'trainer' && roleData.trainer) {
      userData.trainer = roleData.trainer;
    }

    const user = await User.create(userData);

    // Generate token
    const token = generateToken(user._id);

    // Remove password from response
    const userResponse = user.toObject();
    delete userResponse.password;

    // Set token in HTTP-only cookie
    const cookieOptions = {
      expires: new Date(Date.now() + (process.env.JWT_COOKIE_EXPIRE || 30) * 24 * 60 * 60 * 1000), // 30 days default
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // Only send over HTTPS in production
      sameSite: 'lax' // CSRF protection
    };

    res.cookie('token', token, cookieOptions);

    return ResponseHandler.created(res, {
      user: userResponse,
      token // Also send in response body for Postman/testing
    }, 'User registered successfully');

  } catch (error) {
    console.error('Register error:', error);
    
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return ResponseHandler.conflict(res, `${field} already exists`);
    }
    
    return ResponseHandler.serverError(res, error.message);
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate
    if (!email || !password) {
      return ResponseHandler.badRequest(res, 'Please provide email and password');
    }

    // Find user with password
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return ResponseHandler.unauthorized(res, 'Invalid credentials');
    }

    // Check if user is active
    if (!user.isActive) {
      return ResponseHandler.forbidden(res, 'Account is inactive. Please contact admin');
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
      return ResponseHandler.unauthorized(res, 'Invalid credentials');
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate token
    const token = generateToken(user._id);

    // Remove password from response
    const userResponse = user.toObject();
    delete userResponse.password;

    // Set token in HTTP-only cookie
    const cookieOptions = {
      expires: new Date(Date.now() + (process.env.JWT_COOKIE_EXPIRE || 30) * 24 * 60 * 60 * 1000), // 30 days default
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // Only send over HTTPS in production
      sameSite: 'lax' // CSRF protection
    };

    res.cookie('token', token, cookieOptions);

    return ResponseHandler.success(res, {
      user: userResponse,
      token // Also send in response body for Postman/testing
    }, 'Login successful');

  } catch (error) {
    console.error('Login error:', error);
    return ResponseHandler.serverError(res, error.message);
  }
};

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    
    if (!user) {
      return ResponseHandler.notFound(res, 'User not found');
    }

    return ResponseHandler.success(res, user, 'User fetched successfully');
  } catch (error) {
    console.error('Get me error:', error);
    return ResponseHandler.serverError(res, error.message);
  }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
exports.updateProfile = async (req, res) => {
  try {
    const fieldsToUpdate = {
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      phone: req.body.phone,
      profilePicture: req.body.profilePicture
    };

    // Remove undefined fields
    Object.keys(fieldsToUpdate).forEach(key => 
      fieldsToUpdate[key] === undefined && delete fieldsToUpdate[key]
    );

    // Update role-specific data
    if (req.user.role === 'student' && req.body.student) {
      fieldsToUpdate.student = { ...req.user.student, ...req.body.student };
    } else if (req.user.role === 'faculty' && req.body.faculty) {
      fieldsToUpdate.faculty = { ...req.user.faculty, ...req.body.faculty };
    } else if (req.user.role === 'trainer' && req.body.trainer) {
      fieldsToUpdate.trainer = { ...req.user.trainer, ...req.body.trainer };
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      fieldsToUpdate,
      { new: true, runValidators: true }
    ).select('-password');

    return ResponseHandler.success(res, user, 'Profile updated successfully');
  } catch (error) {
    console.error('Update profile error:', error);
    return ResponseHandler.serverError(res, error.message);
  }
};

// @desc    Change password
// @route   PUT /api/auth/change-password
// @access  Private
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return ResponseHandler.badRequest(res, 'Please provide current and new password');
    }

    if (newPassword.length < 6) {
      return ResponseHandler.badRequest(res, 'Password must be at least 6 characters');
    }

    const user = await User.findById(req.user._id).select('+password');

    // Verify current password
    const isPasswordValid = await user.comparePassword(currentPassword);
    if (!isPasswordValid) {
      return ResponseHandler.unauthorized(res, 'Current password is incorrect');
    }

    // Update password
    user.password = newPassword;
    await user.save();

    return ResponseHandler.success(res, null, 'Password changed successfully');
  } catch (error) {
    console.error('Change password error:', error);
    return ResponseHandler.serverError(res, error.message);
  }
};
