const User = require('../models/User');
const ResponseHandler = require('../utils/responseHandler');

// @desc    Get all users
// @route   GET /api/users
// @access  Private/Admin
exports.getAllUsers = async (req, res) => {
  try {
    const { role, department, isActive, search, page = 1, limit = 10 } = req.query;

    const query = {};

    if (role) query.role = role;
    if (department) query['student.department'] = department;
    if (isActive !== undefined) query.isActive = isActive === 'true';
    
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { 'student.rollNumber': { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const users = await User.find(query)
      .select('-password')
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const total = await User.countDocuments(query);

    return ResponseHandler.success(res, {
      users,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get all users error:', error);
    return ResponseHandler.serverError(res, error.message);
  }
};

// @desc    Get current user profile
// @route   GET /api/users/profile
// @access  Private
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');

    if (!user) {
      return ResponseHandler.notFound(res, 'User not found');
    }

    return ResponseHandler.success(res, user);
  } catch (error) {
    console.error('Get profile error:', error);
    return ResponseHandler.serverError(res, error.message);
  }
};

// @desc    Update current user profile
// @route   PUT /api/users/profile
// @access  Private
exports.updateProfile = async (req, res) => {
  try {
    const { password, email, ...updateData } = req.body;

    // Don't allow email or password change through profile update
    // Use change-password endpoint for password
    
    const user = await User.findByIdAndUpdate(
      req.user._id,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return ResponseHandler.notFound(res, 'User not found');
    }

    return ResponseHandler.success(res, user, 'Profile updated successfully');
  } catch (error) {
    console.error('Update profile error:', error);
    return ResponseHandler.serverError(res, error.message);
  }
};

// @desc    Get user by ID
// @route   GET /api/users/:id
// @access  Private
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');

    if (!user) {
      return ResponseHandler.notFound(res, 'User not found');
    }

    return ResponseHandler.success(res, user);
  } catch (error) {
    console.error('Get user by ID error:', error);
    return ResponseHandler.serverError(res, error.message);
  }
};

// @desc    Create user (Admin only)
// @route   POST /api/users
// @access  Private/Admin
exports.createUser = async (req, res) => {
  try {
    const { email, password, firstName, lastName, role, ...roleData } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return ResponseHandler.conflict(res, 'User already exists with this email');
    }

    const userData = {
      email,
      password,
      firstName,
      lastName,
      role,
      phone: req.body.phone,
      profilePicture: req.body.profilePicture
    };

    if (role === 'student' && roleData.student) {
      userData.student = roleData.student;
    } else if (role === 'faculty' && roleData.faculty) {
      userData.faculty = roleData.faculty;
    } else if (role === 'trainer' && roleData.trainer) {
      userData.trainer = roleData.trainer;
    }

    const user = await User.create(userData);

    const userResponse = user.toObject();
    delete userResponse.password;

    return ResponseHandler.created(res, userResponse, 'User created successfully');
  } catch (error) {
    console.error('Create user error:', error);
    
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return ResponseHandler.conflict(res, `${field} already exists`);
    }
    
    return ResponseHandler.serverError(res, error.message);
  }
};

// @desc    Update user
// @route   PUT /api/users/:id
// @access  Private/Admin
exports.updateUser = async (req, res) => {
  try {
    const { password, email, ...updateData } = req.body;

    const user = await User.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return ResponseHandler.notFound(res, 'User not found');
    }

    return ResponseHandler.success(res, user, 'User updated successfully');
  } catch (error) {
    console.error('Update user error:', error);
    return ResponseHandler.serverError(res, error.message);
  }
};

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private/Admin
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);

    if (!user) {
      return ResponseHandler.notFound(res, 'User not found');
    }

    return ResponseHandler.success(res, null, 'User deleted successfully');
  } catch (error) {
    console.error('Delete user error:', error);
    return ResponseHandler.serverError(res, error.message);
  }
};

// @desc    Toggle user active status
// @route   PATCH /api/users/:id/toggle-status
// @access  Private/Admin
exports.toggleUserStatus = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return ResponseHandler.notFound(res, 'User not found');
    }

    user.isActive = !user.isActive;
    await user.save();

    return ResponseHandler.success(
      res,
      { isActive: user.isActive },
      `User ${user.isActive ? 'activated' : 'deactivated'} successfully`
    );
  } catch (error) {
    console.error('Toggle user status error:', error);
    return ResponseHandler.serverError(res, error.message);
  }
};

// @desc    Get students by department
// @route   GET /api/users/students/department/:department
// @access  Private
exports.getStudentsByDepartment = async (req, res) => {
  try {
    const { department } = req.params;
    const { year, section, program } = req.query;

    const query = {
      role: 'student',
      'student.department': department
    };

    if (year) query['student.year'] = parseInt(year);
    if (section) query['student.section'] = section;
    if (program) query['student.program'] = program;

    const students = await User.find(query)
      .select('-password')
      .sort({ 'student.rollNumber': 1 });

    return ResponseHandler.success(res, students);
  } catch (error) {
    console.error('Get students by department error:', error);
    return ResponseHandler.serverError(res, error.message);
  }
};

// @desc    Get faculty members
// @route   GET /api/users/faculty
// @access  Private
exports.getFaculty = async (req, res) => {
  try {
    const { department, canCoordinate } = req.query;

    const query = { role: 'faculty' };

    if (department) query['faculty.department'] = department;
    if (canCoordinate) query['faculty.canCoordinate'] = canCoordinate === 'true';

    const faculty = await User.find(query)
      .select('-password')
      .sort({ firstName: 1 });

    return ResponseHandler.success(res, faculty);
  } catch (error) {
    console.error('Get faculty error:', error);
    return ResponseHandler.serverError(res, error.message);
  }
};

// @desc    Get trainers
// @route   GET /api/users/trainers
// @access  Private
exports.getTrainers = async (req, res) => {
  try {
    const trainers = await User.find({ role: 'trainer' })
      .select('-password')
      .sort({ firstName: 1 });

    return ResponseHandler.success(res, trainers);
  } catch (error) {
    console.error('Get trainers error:', error);
    return ResponseHandler.serverError(res, error.message);
  }
};

// @desc    Advanced student filtering
// @route   GET /api/users/students/advanced-filter
// @access  Private
exports.getStudentsAdvancedFilter = async (req, res) => {
  try {
    const { 
      departments, 
      years, 
      sections, 
      programs,
      search,
      isActive,
      hasEvents,
      page = 1,
      limit = 20
    } = req.query;

    let query = { role: 'student' };

    // Multi-value filters
    if (departments) {
      const deptArray = departments.split(',');
      query['student.department'] = { $in: deptArray };
    }

    if (years) {
      const yearArray = years.split(',').map(y => parseInt(y));
      query['student.year'] = { $in: yearArray };
    }

    if (sections) {
      const sectionArray = sections.split(',');
      query['student.section'] = { $in: sectionArray };
    }

    if (programs) {
      const programArray = programs.split(',');
      query['student.program'] = { $in: programArray };
    }

    if (isActive !== undefined) query.isActive = isActive === 'true';

    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { 'student.rollNumber': { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    let students = await User.find(query)
      .select('-password')
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ 'student.rollNumber': 1 });

    // If hasEvents filter is requested, filter by registration status
    if (hasEvents !== undefined) {
      const Registration = require('../models/Registration');
      const studentIds = students.map(s => s._id);
      
      const registeredStudents = await Registration.distinct('userId', {
        userId: { $in: studentIds }
      });

      if (hasEvents === 'true') {
        students = students.filter(s => registeredStudents.includes(s._id.toString()));
      } else {
        students = students.filter(s => !registeredStudents.includes(s._id.toString()));
      }
    }

    const total = await User.countDocuments(query);

    return ResponseHandler.success(res, {
      students,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        limit: parseInt(limit)
      },
      filters: {
        departments: departments?.split(','),
        years: years?.split(',').map(y => parseInt(y)),
        sections: sections?.split(','),
        programs: programs?.split(','),
        search,
        isActive,
        hasEvents
      }
    });
  } catch (error) {
    console.error('Get students advanced filter error:', error);
    return ResponseHandler.serverError(res, error.message);
  }
};

// @desc    Get event participants (all registered users)
// @route   GET /api/users/event/:eventId/participants
// @access  Private
exports.getEventParticipants = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { 
      status, 
      department, 
      year, 
      section,
      attendanceMin,
      attendanceMax,
      search,
      page = 1,
      limit = 20
    } = req.query;

    const Registration = require('../models/Registration');

    let regQuery = { eventId };
    if (status) regQuery.status = status;
    if (department) regQuery.department = department;
    if (year) regQuery.year = parseInt(year);
    if (section) regQuery.section = section;
    if (attendanceMin) regQuery.attendancePercentage = { $gte: parseFloat(attendanceMin) };
    if (attendanceMax) {
      regQuery.attendancePercentage = regQuery.attendancePercentage 
        ? { ...regQuery.attendancePercentage, $lte: parseFloat(attendanceMax) }
        : { $lte: parseFloat(attendanceMax) };
    }

    if (search) {
      regQuery.$or = [
        { userName: { $regex: search, $options: 'i' } },
        { rollNumber: { $regex: search, $options: 'i' } },
        { userEmail: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const registrations = await Registration.find(regQuery)
      .populate('userId', '-password')
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ registeredAt: -1 });

    const total = await Registration.countDocuments(regQuery);

    return ResponseHandler.success(res, {
      participants: registrations,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Get event participants error:', error);
    return ResponseHandler.serverError(res, error.message);
  }
};

// @desc    Bulk export users
// @route   GET /api/users/bulk-export
// @access  Private/Admin
exports.bulkExportUsers = async (req, res) => {
  try {
    const { 
      role, 
      department, 
      year, 
      section, 
      isActive,
      format = 'json'
    } = req.query;

    let query = {};
    if (role) query.role = role;
    if (department) query['student.department'] = department;
    if (year) query['student.year'] = parseInt(year);
    if (section) query['student.section'] = section;
    if (isActive !== undefined) query.isActive = isActive === 'true';

    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 });

    if (format === 'csv') {
      // Transform to CSV format
      const csvData = users.map(user => ({
        'First Name': user.firstName,
        'Last Name': user.lastName,
        'Email': user.email,
        'Role': user.role,
        'Phone': user.phone || '',
        'Department': user.student?.department || user.faculty?.department || '',
        'Roll Number': user.student?.rollNumber || '',
        'Year': user.student?.year || '',
        'Section': user.student?.section || '',
        'Program': user.student?.program || '',
        'Is Active': user.isActive ? 'Yes' : 'No',
        'Created At': user.createdAt.toISOString().split('T')[0]
      }));

      return ResponseHandler.success(res, csvData, 'Users exported successfully');
    }

    return ResponseHandler.success(res, users, 'Users exported successfully');
  } catch (error) {
    console.error('Bulk export users error:', error);
    return ResponseHandler.serverError(res, error.message);
  }
};

// @desc    Bulk update users
// @route   POST /api/users/bulk-update
// @access  Private/Admin
exports.bulkUpdateUsers = async (req, res) => {
  try {
    const { userIds, updateData, action } = req.body;

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return ResponseHandler.badRequest(res, 'User IDs array is required');
    }

    let result;

    switch (action) {
      case 'activate':
        result = await User.updateMany(
          { _id: { $in: userIds } },
          { isActive: true }
        );
        break;

      case 'deactivate':
        result = await User.updateMany(
          { _id: { $in: userIds } },
          { isActive: false }
        );
        break;

      case 'update':
        if (!updateData) {
          return ResponseHandler.badRequest(res, 'Update data is required');
        }
        
        // Remove sensitive fields that shouldn't be bulk updated
        const { password, email, role, ...safeUpdateData } = updateData;
        
        result = await User.updateMany(
          { _id: { $in: userIds } },
          safeUpdateData
        );
        break;

      case 'delete':
        result = await User.deleteMany({ _id: { $in: userIds } });
        break;

      default:
        return ResponseHandler.badRequest(res, 'Invalid action');
    }

    return ResponseHandler.success(res, {
      modifiedCount: result.modifiedCount || result.deletedCount,
      action
    }, `Bulk ${action} completed successfully`);
  } catch (error) {
    console.error('Bulk update users error:', error);
    return ResponseHandler.serverError(res, error.message);
  }
};
