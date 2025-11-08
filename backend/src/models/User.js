const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  // Authentication
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: 6,
    select: false
  },
  role: {
    type: String,
    required: true,
    enum: ['admin', 'faculty', 'student', 'trainer'],
    default: 'student'
  },

  // Basic Info
  firstName: {
    type: String,
    required: false,
    trim: true,
    default: ''
  },
  lastName: {
    type: String,
    required: false,
    trim: true,
    default: ''
  },
  phone: {
    type: String,
    trim: true
  },
  profilePicture: {
    type: String,
    default: null
  },

  // STUDENT DATA
  student: {
    rollNumber: {
      type: String,
      sparse: true,
      unique: true
    },
    department: String,
    program: String,
    year: Number,
    semester: Number,
    section: String,
    batch: String
  },

  // FACULTY DATA
  faculty: {
    employeeId: String,
    department: String,
    designation: String,
    canCoordinate: {
      type: Boolean,
      default: false
    }
  },

  // TRAINER DATA
  trainer: {
    organization: String,
    expertise: [String],
    experience: Number,
    bio: String
  },

  // Common fields
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: Date,
  
  // Analytics & Performance tracking
  analytics: {
    totalEventsRegistered: {
      type: Number,
      default: 0
    },
    totalEventsAttended: {
      type: Number,
      default: 0
    },
    avgAttendanceRate: {
      type: Number,
      default: 0
    },
    certificatesEarned: {
      type: Number,
      default: 0
    },
    lastActivityAt: Date,
    profileCompleteness: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    }
  },

  // Search optimization
  searchIndex: {
    type: String,
    index: 'text'
  },

  // Department classification for faster filtering
  primaryDepartment: {
    type: String,
    index: true
  }
}, {
  timestamps: true
});

// Comprehensive indexing for advanced filtering and analytics
userSchema.index({ role: 1 });
userSchema.index({ 'student.department': 1 });
userSchema.index({ 'faculty.department': 1 });
userSchema.index({ primaryDepartment: 1 });
userSchema.index({ isActive: 1 });
userSchema.index({ lastLogin: -1 });
userSchema.index({ createdAt: -1 });

// Compound indexes for advanced filtering
userSchema.index({ role: 1, 'student.department': 1, 'student.year': 1 });
userSchema.index({ role: 1, 'student.department': 1, 'student.section': 1 });
userSchema.index({ role: 1, isActive: 1, lastLogin: -1 });
userSchema.index({ 'analytics.avgAttendanceRate': -1 });
userSchema.index({ 'analytics.totalEventsRegistered': -1 });

// Text search index
userSchema.index({
  firstName: 'text',
  lastName: 'text',
  email: 'text',
  'student.rollNumber': 'text'
}, {
  weights: {
    firstName: 10,
    lastName: 10,
    email: 5,
    'student.rollNumber': 15
  },
  name: 'user_text_index'
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Get full name
userSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Pre-save middleware to update search index and analytics
userSchema.pre('save', function(next) {
  // Update search index
  this.searchIndex = `${this.firstName} ${this.lastName} ${this.email} ${this.student?.rollNumber || ''}`.toLowerCase();
  
  // Update primary department
  this.primaryDepartment = this.student?.department || this.faculty?.department || this.trainer?.organization || 'Unknown';
  
  // Update profile completeness
  let completeness = 0;
  if (this.firstName) completeness += 20;
  if (this.lastName) completeness += 20;
  if (this.email) completeness += 20;
  if (this.phone) completeness += 10;
  if (this.role === 'student' && this.student?.rollNumber) completeness += 15;
  if (this.role === 'student' && this.student?.department) completeness += 15;
  if (this.role === 'faculty' && this.faculty?.department) completeness += 15;
  if (this.role === 'faculty' && this.faculty?.designation) completeness += 15;
  if (this.role === 'trainer' && this.trainer?.organization) completeness += 15;
  if (this.role === 'trainer' && this.trainer?.expertise?.length > 0) completeness += 15;
  
  this.analytics.profileCompleteness = Math.min(completeness, 100);
  
  next();
});

module.exports = mongoose.model('User', userSchema);
