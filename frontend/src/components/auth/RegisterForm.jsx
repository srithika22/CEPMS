import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';

const RegisterForm = ({ onSuccess, onToggleForm }) => {
  const [formData, setFormData] = useState({
    // Basic Information
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    role: 'student',
    
    // Student-specific data
    student: {
      rollNumber: '',
      department: '',
      program: 'B.Tech',
      year: 1,
      semester: 1,
      section: 'A',
      batch: new Date().getFullYear().toString()
    },
    
    // Faculty-specific data
    faculty: {
      employeeId: '',
      department: '',
      designation: '',
      canCoordinate: false
    },
    
    // Trainer-specific data
    trainer: {
      organization: '',
      expertise: [],
      experience: 0,
      bio: ''
    }
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [newExpertise, setNewExpertise] = useState('');
  const { register } = useAuth();

  const departments = [
    'Computer Science Engineering', 'Information Technology', 'Electronics and Communication Engineering',
    'Electrical and Electronics Engineering', 'Mechanical Engineering', 'Civil Engineering',
    'Chemical Engineering', 'Biotechnology', 'Mathematics', 'Physics', 'Chemistry', 'MBA', 'Others'
  ];

  const programs = ['B.Tech', 'M.Tech', 'MCA', 'MBA', 'PhD'];
  const designations = ['Assistant Professor', 'Associate Professor', 'Professor', 'HOD', 'Principal'];

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name.includes('.')) {
      // Handle nested object properties (e.g., 'student.rollNumber')
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: type === 'checkbox' ? checked : value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const addExpertise = () => {
    if (newExpertise.trim() && !formData.trainer.expertise.includes(newExpertise.trim())) {
      setFormData(prev => ({
        ...prev,
        trainer: {
          ...prev.trainer,
          expertise: [...prev.trainer.expertise, newExpertise.trim()]
        }
      }));
      setNewExpertise('');
    }
  };

  const removeExpertise = (expertiseToRemove) => {
    setFormData(prev => ({
      ...prev,
      trainer: {
        ...prev.trainer,
        expertise: prev.trainer.expertise.filter(exp => exp !== expertiseToRemove)
      }
    }));
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    }
    
    // Role-specific validations
    if (formData.role === 'student') {
      if (!formData.student.rollNumber.trim()) {
        newErrors['student.rollNumber'] = 'Roll number is required';
      }
      if (!formData.student.department) {
        newErrors['student.department'] = 'Department is required';
      }
    } else if (formData.role === 'faculty') {
      if (!formData.faculty.employeeId.trim()) {
        newErrors['faculty.employeeId'] = 'Employee ID is required';
      }
      if (!formData.faculty.department) {
        newErrors['faculty.department'] = 'Department is required';
      }
      if (!formData.faculty.designation) {
        newErrors['faculty.designation'] = 'Designation is required';
      }
    } else if (formData.role === 'trainer') {
      if (!formData.trainer.organization.trim()) {
        newErrors['trainer.organization'] = 'Organization is required';
      }
    }
    
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const formErrors = validateForm();
    if (Object.keys(formErrors).length > 0) {
      setErrors(formErrors);
      return;
    }

    setLoading(true);
    setErrors({});

    // Prepare data according to backend expectations
    const submitData = {
      name: formData.name,
      email: formData.email,
      password: formData.password,
      phone: formData.phone,
      role: formData.role
    };

    // Add role-specific data
    if (formData.role === 'student') {
      submitData.student = formData.student;
    } else if (formData.role === 'faculty') {
      submitData.faculty = formData.faculty;
    } else if (formData.role === 'trainer') {
      submitData.trainer = formData.trainer;
    }

    const result = await register(submitData);
    
    if (result.success) {
      if (onSuccess) onSuccess();
    } else {
      setErrors({ submit: result.message });
    }
    
    setLoading(false);
  };

  return (
    <div className="auth-form">
      <div className="auth-header">
        <h2>Create Account</h2>
        <p>Join the CEPMS community</p>
      </div>

      <form onSubmit={handleSubmit} className="form">
        {errors.submit && (
          <div className="error-message">
            {errors.submit}
          </div>
        )}

        {/* Basic Information */}
        <div className="form-section">
          <h3>Basic Information</h3>
          
          <div className="form-group">
            <label htmlFor="name">Full Name</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className={errors.name ? 'error' : ''}
              placeholder="Enter your full name"
              disabled={loading}
            />
            {errors.name && <span className="field-error">{errors.name}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className={errors.email ? 'error' : ''}
              placeholder="Enter your email"
              disabled={loading}
            />
            {errors.email && <span className="field-error">{errors.email}</span>}
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className={errors.password ? 'error' : ''}
                placeholder="Create password"
                disabled={loading}
              />
              {errors.password && <span className="field-error">{errors.password}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm Password</label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                className={errors.confirmPassword ? 'error' : ''}
                placeholder="Confirm password"
                disabled={loading}
              />
              {errors.confirmPassword && <span className="field-error">{errors.confirmPassword}</span>}
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="phone">Phone Number</label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className={errors.phone ? 'error' : ''}
              placeholder="Enter your phone number"
              disabled={loading}
            />
            {errors.phone && <span className="field-error">{errors.phone}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="role">Role</label>
            <select
              id="role"
              name="role"
              value={formData.role}
              onChange={handleChange}
              disabled={loading}
            >
              <option value="student">Student</option>
              <option value="faculty">Faculty</option>
              <option value="trainer">Trainer</option>
            </select>
          </div>
        </div>

        {/* Role-specific fields */}
        {formData.role === 'student' && (
          <div className="form-section">
            <h3>Student Information</h3>
            
            <div className="form-group">
              <label htmlFor="student.rollNumber">Roll Number</label>
              <input
                type="text"
                id="student.rollNumber"
                name="student.rollNumber"
                value={formData.student.rollNumber}
                onChange={handleChange}
                className={errors['student.rollNumber'] ? 'error' : ''}
                placeholder="Enter your roll number"
                disabled={loading}
              />
              {errors['student.rollNumber'] && <span className="field-error">{errors['student.rollNumber']}</span>}
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="student.department">Department</label>
                <select
                  id="student.department"
                  name="student.department"
                  value={formData.student.department}
                  onChange={handleChange}
                  className={errors['student.department'] ? 'error' : ''}
                  disabled={loading}
                >
                  <option value="">Select Department</option>
                  {departments.map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
                {errors['student.department'] && <span className="field-error">{errors['student.department']}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="student.program">Program</label>
                <select
                  id="student.program"
                  name="student.program"
                  value={formData.student.program}
                  onChange={handleChange}
                  disabled={loading}
                >
                  {programs.map(program => (
                    <option key={program} value={program}>{program}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="student.year">Year</label>
                <select
                  id="student.year"
                  name="student.year"
                  value={formData.student.year}
                  onChange={handleChange}
                  disabled={loading}
                >
                  <option value={1}>1st Year</option>
                  <option value={2}>2nd Year</option>
                  <option value={3}>3rd Year</option>
                  <option value={4}>4th Year</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="student.semester">Semester</label>
                <select
                  id="student.semester"
                  name="student.semester"
                  value={formData.student.semester}
                  onChange={handleChange}
                  disabled={loading}
                >
                  {[1,2,3,4,5,6,7,8].map(sem => (
                    <option key={sem} value={sem}>{sem}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="student.section">Section</label>
                <input
                  type="text"
                  id="student.section"
                  name="student.section"
                  value={formData.student.section}
                  onChange={handleChange}
                  placeholder="A, B, C..."
                  maxLength="1"
                  disabled={loading}
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="student.batch">Batch Year</label>
              <input
                type="text"
                id="student.batch"
                name="student.batch"
                value={formData.student.batch}
                onChange={handleChange}
                placeholder="2024"
                disabled={loading}
              />
            </div>
          </div>
        )}

        {formData.role === 'faculty' && (
          <div className="form-section">
            <h3>Faculty Information</h3>
            
            <div className="form-group">
              <label htmlFor="faculty.employeeId">Employee ID</label>
              <input
                type="text"
                id="faculty.employeeId"
                name="faculty.employeeId"
                value={formData.faculty.employeeId}
                onChange={handleChange}
                className={errors['faculty.employeeId'] ? 'error' : ''}
                placeholder="Enter your employee ID"
                disabled={loading}
              />
              {errors['faculty.employeeId'] && <span className="field-error">{errors['faculty.employeeId']}</span>}
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="faculty.department">Department</label>
                <select
                  id="faculty.department"
                  name="faculty.department"
                  value={formData.faculty.department}
                  onChange={handleChange}
                  className={errors['faculty.department'] ? 'error' : ''}
                  disabled={loading}
                >
                  <option value="">Select Department</option>
                  {departments.map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
                {errors['faculty.department'] && <span className="field-error">{errors['faculty.department']}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="faculty.designation">Designation</label>
                <select
                  id="faculty.designation"
                  name="faculty.designation"
                  value={formData.faculty.designation}
                  onChange={handleChange}
                  className={errors['faculty.designation'] ? 'error' : ''}
                  disabled={loading}
                >
                  <option value="">Select Designation</option>
                  {designations.map(designation => (
                    <option key={designation} value={designation}>{designation}</option>
                  ))}
                </select>
                {errors['faculty.designation'] && <span className="field-error">{errors['faculty.designation']}</span>}
              </div>
            </div>

            <div className="form-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="faculty.canCoordinate"
                  checked={formData.faculty.canCoordinate}
                  onChange={handleChange}
                  disabled={loading}
                />
                Can coordinate events
              </label>
            </div>
          </div>
        )}

        {formData.role === 'trainer' && (
          <div className="form-section">
            <h3>Trainer Information</h3>
            
            <div className="form-group">
              <label htmlFor="trainer.organization">Organization</label>
              <input
                type="text"
                id="trainer.organization"
                name="trainer.organization"
                value={formData.trainer.organization}
                onChange={handleChange}
                className={errors['trainer.organization'] ? 'error' : ''}
                placeholder="Company/Organization name"
                disabled={loading}
              />
              {errors['trainer.organization'] && <span className="field-error">{errors['trainer.organization']}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="trainer.experience">Years of Experience</label>
              <input
                type="number"
                id="trainer.experience"
                name="trainer.experience"
                value={formData.trainer.experience}
                onChange={handleChange}
                placeholder="Years of experience"
                min="0"
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label>Areas of Expertise</label>
              <div className="expertise-input">
                <div className="expertise-add">
                  <input
                    type="text"
                    value={newExpertise}
                    onChange={(e) => setNewExpertise(e.target.value)}
                    placeholder="Add expertise area"
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addExpertise())}
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={addExpertise}
                    className="btn-outline small"
                    disabled={loading}
                  >
                    Add
                  </button>
                </div>
                <div className="expertise-tags">
                  {formData.trainer.expertise.map((expertise, index) => (
                    <span key={index} className="expertise-tag">
                      {expertise}
                      <button
                        type="button"
                        onClick={() => removeExpertise(expertise)}
                        className="remove-tag"
                        disabled={loading}
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="trainer.bio">Bio</label>
              <textarea
                id="trainer.bio"
                name="trainer.bio"
                value={formData.trainer.bio}
                onChange={handleChange}
                placeholder="Brief description about yourself and your expertise"
                rows="4"
                disabled={loading}
              />
            </div>
          </div>
        )}

        <button 
          type="submit" 
          className="btn-primary"
          disabled={loading}
        >
          {loading ? 'Creating Account...' : 'Create Account'}
        </button>
      </form>

      <div className="auth-footer">
        <p>
          Already have an account?{' '}
          <button 
            type="button" 
            className="link-button"
            onClick={onToggleForm}
          >
            Sign In
          </button>
        </p>
      </div>
    </div>
  );
};

export default RegisterForm;