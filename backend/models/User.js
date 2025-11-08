import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  // Basic Information
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true,
    maxlength: [50, 'First name cannot exceed 50 characters']
  },
  lastName: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true,
    maxlength: [50, 'Last name cannot exceed 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    validate: {
      validator: function(email) {
        return /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(email);
      },
      message: 'Please enter a valid email address'
    }
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false // Don't include password in queries by default
  },
  
  // Role-based Access Control
  role: {
    type: String,
    enum: ['admin', 'faculty', 'student', 'trainer'],
    required: [true, 'User role is required'],
    default: 'student'
  },
  
  // Academic Information (for students and faculty)
  studentId: {
    type: String,
    sparse: true, // Allow null values but ensure uniqueness when present
    unique: true,
    validate: {
      validator: function(value) {
        return this.role === 'student' ? !!value : true;
      },
      message: 'Student ID is required for student role'
    }
  },
  employeeId: {
    type: String,
    sparse: true,
    unique: true,
    validate: {
      validator: function(value) {
        return ['faculty', 'trainer', 'admin'].includes(this.role) ? !!value : true;
      },
      message: 'Employee ID is required for staff roles'
    }
  },
  
  // Department and Academic Details
  department: {
    type: String,
    required: [true, 'Department is required'],
    trim: true
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    trim: true
  },
  year: {
    type: Number,
    min: 1,
    max: 4,
    required: function() {
      return this.role === 'student';
    }
  },
  section: {
    type: String,
    maxlength: 1,
    uppercase: true,
    required: function() {
      return this.role === 'student';
    }
  },
  
  // Faculty/Trainer specific fields
  specialization: {
    type: String,
    trim: true,
    required: function() {
      return this.role === 'faculty';
    }
  },
  experience: {
    type: Number,
    min: 0,
    required: function() {
      return this.role === 'trainer';
    }
  },
  
  // Contact Information
  phoneNumber: {
    type: String,
    validate: {
      validator: function(phone) {
        return /^\+?[\d\s-()]{10,15}$/.test(phone);
      },
      message: 'Please enter a valid phone number'
    }
  },
  
  // Profile Information
  profilePicture: {
    type: String,
    default: null
  },
  dateOfBirth: {
    type: Date,
    validate: {
      validator: function(date) {
        return date < new Date();
      },
      message: 'Date of birth must be in the past'
    }
  },
  
  // Account Status
  isActive: {
    type: Boolean,
    default: true
  },
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  emailVerificationToken: {
    type: String,
    select: false
  },
  emailVerificationExpires: {
    type: Date,
    select: false
  },
  
  // Password Reset
  passwordResetToken: {
    type: String,
    select: false
  },
  passwordResetExpires: {
    type: Date,
    select: false
  },
  
  // Login Tracking
  lastLogin: {
    type: Date,
    default: null
  },
  loginCount: {
    type: Number,
    default: 0
  },
  
  // Preferences
  notifications: {
    email: {
      type: Boolean,
      default: true
    },
    sms: {
      type: Boolean,
      default: false
    },
    push: {
      type: Boolean,
      default: true
    }
  },
  
  // Trainer-specific fields
  expertise: [{
    type: String,
    required: function() {
      return this.role === 'trainer';
    }
  }],
  bio: {
    type: String,
    maxlength: [500, 'Bio cannot exceed 500 characters'],
    required: function() {
      return this.role === 'trainer';
    }
  },
  linkedIn: {
    type: String,
    validate: {
      validator: function(url) {
        return !url || /^https?:\/\/(www\.)?linkedin\.com\//.test(url);
      },
      message: 'Please enter a valid LinkedIn URL'
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for display name
userSchema.virtual('displayName').get(function() {
  return this.name;
});

// Index for performance (only for fields that don't already have unique: true)
userSchema.index({ role: 1 });
userSchema.index({ department: 1 });

// Pre-save middleware to hash password
userSchema.pre('save', async function(next) {
  // Only hash the password if it has been modified or is new
  if (!this.isModified('password')) return next();
  
  try {
    // Hash password with cost of 12
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Pre-save hook to hash password and set name from firstName and lastName
userSchema.pre('save', async function(next) {
  // Set name from firstName and lastName
  if (this.isModified('firstName') || this.isModified('lastName')) {
    this.name = `${this.firstName} ${this.lastName}`;
  }
  
  // Hash password if it's new or modified
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to check password
userSchema.methods.comparePassword = async function(candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw new Error('Password comparison failed');
  }
};

// Method to generate password reset token
userSchema.methods.createPasswordResetToken = function() {
  const resetToken = crypto.randomBytes(32).toString('hex');
  
  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
  
  // Token expires in 10 minutes
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;
  
  return resetToken;
};

// Method to update login info
userSchema.methods.updateLoginInfo = function() {
  this.lastLogin = new Date();
  this.loginCount += 1;
  return this.save({ validateBeforeSave: false });
};

// Static method to find users by role
userSchema.statics.findByRole = function(role) {
  return this.find({ role, isActive: true });
};

// Static method to find users by department
userSchema.statics.findByDepartment = function(department) {
  return this.find({ department, isActive: true });
};

const User = mongoose.model('User', userSchema);

export default User;