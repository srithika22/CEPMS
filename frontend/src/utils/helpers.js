/**
 * Format date to readable string
 */
export const formatDate = (date) => {
  if (!date) return '';
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

/**
 * Format date with time
 */
export const formatDateTime = (date) => {
  if (!date) return '';
  return new Date(date).toLocaleString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

/**
 * Format time string (e.g., "09:00 AM")
 */
export const formatTime = (timeString) => {
  if (!timeString) return '';
  return timeString;
};

/**
 * Get user's full name
 */
export const getFullName = (user) => {
  if (!user) return '';
  return `${user.firstName || ''} ${user.lastName || ''}`.trim();
};

/**
 * Get user's role display name
 */
export const getRoleDisplayName = (role) => {
  const roles = {
    admin: 'Administrator',
    faculty: 'Faculty',
    student: 'Student',
    trainer: 'Trainer'
  };
  return roles[role] || role;
};

/**
 * Get event status color
 */
export const getStatusColor = (status) => {
  const colors = {
    draft: 'gray',
    pending: 'yellow',
    approved: 'green',
    rejected: 'red',
    ongoing: 'blue',
    completed: 'green',
    cancelled: 'red'
  };
  return colors[status] || 'gray';
};

/**
 * Check if user is eligible for event
 */
export const checkEligibility = (user, event) => {
  if (!user || !event) return false;

  const eligibility = event.eligibility || {};

  // Check departments
  if (eligibility.departments && eligibility.departments.length > 0) {
    const userDept = user.student?.department || user.faculty?.department;
    if (!eligibility.departments.includes(userDept)) {
      return false;
    }
  }

  // Check programs
  if (eligibility.programs && eligibility.programs.length > 0) {
    if (!eligibility.programs.includes(user.student?.program)) {
      return false;
    }
  }

  // Check years
  if (eligibility.years && eligibility.years.length > 0) {
    if (!eligibility.years.includes(user.student?.year)) {
      return false;
    }
  }

  // Check sections
  if (eligibility.sections && eligibility.sections.length > 0) {
    if (!eligibility.sections.includes(user.student?.section)) {
      return false;
    }
  }

  return true;
};

/**
 * Calculate attendance percentage
 */
export const calculateAttendancePercentage = (attended, total) => {
  if (total === 0) return 0;
  return Math.round((attended / total) * 100);
};

