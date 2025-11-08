import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import '../../styles/dashboard.css';

const ComprehensiveEventForm = ({ event = null, onSubmit, onSuccess, onCancel }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [trainers, setTrainers] = useState([]);
  
  const [formData, setFormData] = useState({
    // Basic Details
    title: event?.title || '',
    description: event?.description || '',
    category: event?.category || 'Workshop',
    type: event?.type || 'academic',
    
    // Schedule
    startDate: event?.startDate ? new Date(event.startDate).toISOString().split('T')[0] : '',
    endDate: event?.endDate ? new Date(event.endDate).toISOString().split('T')[0] : '',
    
    // Registration
    registration: {
      required: event?.registration?.required ?? true,
      startDate: event?.registration?.startDate ? new Date(event.registration.startDate).toISOString().split('T')[0] : '',
      endDate: event?.registration?.endDate ? new Date(event.registration.endDate).toISOString().split('T')[0] : '',
      maxParticipants: event?.registration?.maxParticipants || 100,
      isOpen: event?.registration?.isOpen ?? false
    },
    
    // Target Audience
    eligibility: {
      departments: event?.eligibility?.departments || [],
      programs: event?.eligibility?.programs || [],
      years: event?.eligibility?.years || [],
      sections: event?.eligibility?.sections || []
    },
    
    // Venue
    venue: {
      name: event?.venue?.name || '',
      type: event?.venue?.type || 'seminar_hall',
      isOnline: event?.venue?.isOnline || false,
      meetingLink: event?.venue?.meetingLink || ''
    },
    
    // Trainers
    trainers: event?.trainers || [],
    
    // Files & Media
    files: {
      banner: event?.files?.banner || '',
      brochure: event?.files?.brochure || '',
      circular: event?.files?.circular || ''
    },
    
    // Certificate Settings
    certificate: {
      enabled: event?.certificate?.enabled || false,
      minAttendance: event?.certificate?.minAttendance || 80,
      templateUrl: event?.certificate?.templateUrl || ''
    },
    
    // Feedback Settings
    feedback: {
      enabled: event?.feedback?.enabled || false,
      questions: event?.feedback?.questions || [
        { id: 'q1', text: 'Rate the overall quality of the event', type: 'rating', required: true },
        { id: 'q2', text: 'Would you recommend this event to others?', type: 'rating', required: true },
        { id: 'q3', text: 'Additional comments and suggestions', type: 'text', required: false }
      ]
    }
  });

  const categories = ['CRT', 'FDP', 'Workshop', 'Cultural', 'Sports', 'Seminar', 'Conference', 'Other'];
  const types = ['academic', 'training', 'cultural', 'sports', 'technical'];
  const departments = ['CSE', 'IT', 'ECE', 'EEE', 'MECH', 'CIVIL', 'CHEM', 'BT', 'MATH', 'PHY', 'MBA', 'Others'];
  const programs = ['B.Tech', 'M.Tech', 'MCA', 'MBA', 'PhD'];
  const venueTypes = ['seminar_hall', 'lab', 'auditorium', 'classroom', 'ground', 'online'];
  const years = [1, 2, 3, 4];
  const sections = ['A', 'B', 'C', 'D'];

  // Fetch available trainers
  useEffect(() => {
    const fetchTrainers = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:5000/api/users/trainers', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          setTrainers(data.data || data);
        }
      } catch (error) {
        console.error('Error fetching trainers:', error);
      }
    };
    
    fetchTrainers();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: type === 'checkbox' ? checked : (type === 'number' ? parseInt(value) || 0 : value)
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

  const handleArrayChange = (parent, field, value, checked) => {
    setFormData(prev => {
      const currentArray = prev[parent][field];
      let newArray;
      
      if (checked) {
        newArray = [...currentArray, value];
      } else {
        newArray = currentArray.filter(item => item !== value);
      }
      
      return {
        ...prev,
        [parent]: {
          ...prev[parent],
          [field]: newArray
        }
      };
    });
  };

  const handleTrainerToggle = (trainer, checked) => {
    setFormData(prev => {
      let newTrainers;
      if (checked) {
        newTrainers = [...prev.trainers, {
          id: trainer._id,
          name: `${trainer.firstName} ${trainer.lastName}`,
          email: trainer.email,
          organization: trainer.trainer?.organization || ''
        }];
      } else {
        newTrainers = prev.trainers.filter(t => t.id !== trainer._id);
      }
      
      return {
        ...prev,
        trainers: newTrainers
      };
    });
  };

  const validateForm = () => {
    const newErrors = {};
    
    // Basic validation
    if (!formData.title.trim()) {
      newErrors.title = 'Event title is required';
    }
    
    if (!formData.description.trim()) {
      newErrors.description = 'Event description is required';
    }
    
    if (!formData.startDate) {
      newErrors.startDate = 'Start date is required';
    }
    
    if (!formData.endDate) {
      newErrors.endDate = 'End date is required';
    }
    
    if (formData.startDate && formData.endDate && new Date(formData.startDate) > new Date(formData.endDate)) {
      newErrors.endDate = 'End date must be after start date';
    }
    
    if (formData.registration.required) {
      if (!formData.registration.startDate) {
        newErrors['registration.startDate'] = 'Registration start date is required';
      }
      
      if (!formData.registration.endDate) {
        newErrors['registration.endDate'] = 'Registration end date is required';
      }
      
      if (formData.registration.maxParticipants <= 0) {
        newErrors['registration.maxParticipants'] = 'Maximum participants must be greater than 0';
      }
    }
    
    if (!formData.venue.name.trim()) {
      newErrors['venue.name'] = 'Venue name is required';
    }
    
    if (formData.venue.isOnline && !formData.venue.meetingLink.trim()) {
      newErrors['venue.meetingLink'] = 'Meeting link is required for online events';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    
    try {
      // If onSubmit prop is provided, use it instead of built-in API call
      if (onSubmit) {
        await onSubmit(formData);
        if (onSuccess) onSuccess();
        return;
      }
      
      // Fallback to built-in API call if no onSubmit prop
      const token = localStorage.getItem('token');
      const url = event 
        ? `http://localhost:5000/api/events/${event._id}`
        : 'http://localhost:5000/api/events';
      
      const method = event ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });
      
      const data = await response.json();
      
      if (data.success) {
        if (onSuccess) {
          onSuccess(data.data);
        }
      } else {
        setErrors({ submit: data.message || 'Failed to save event' });
      }
    } catch (error) {
      setErrors({ submit: 'Network error. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="form-modal">
      <div className="form-container">
        <div className="form-header">
          <h2 className="form-title">
            {event ? 'Edit Event' : 'Create New Event'}
          </h2>
          <button
            onClick={onCancel}
            className="form-close"
          >
            ×
          </button>
        </div>

        <form id="eventForm" onSubmit={handleSubmit} className="form-body">
          {/* Basic Information */}
          <div className="form-section">
            <h3>Basic Information</h3>
            
            <div className="form-grid">
              <div className="form-field">
                <label className="form-label">
                  Event Title *
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  className={`form-input ${errors.title ? 'error' : ''}`}
                  placeholder="AI & Machine Learning Workshop"
                />
                {errors.title && <p className="form-error">{errors.title}</p>}
              </div>

              <div className="form-field">
                <label className="form-label">
                  Category *
                </label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className="form-select"
                >
                  {categories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>

              <div className="form-field">
                <label className="form-label">
                  Type *
                </label>
                <select
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                  className="form-select"
                >
                  {types.map(type => (
                    <option key={type} value={type}>{type.charAt(0).toUpperCase() + type.slice(1)}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-field">
              <label className="form-label">
                Description *
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows="4"
                className={`form-textarea ${errors.description ? 'error' : ''}`}
                placeholder="Detailed description of the event..."
              />
              {errors.description && <p className="form-error">{errors.description}</p>}
            </div>
          </div>

          {/* Schedule */}
          <div className="form-section">
            <h3>Schedule</h3>
            
            <div className="form-grid">
              <div className="form-field">
                <label className="form-label">
                  Start Date *
                </label>
                <input
                  type="date"
                  name="startDate"
                  value={formData.startDate}
                  onChange={handleChange}
                  className={`form-input ${errors.startDate ? 'error' : ''}`}
                />
                {errors.startDate && <p className="form-error">{errors.startDate}</p>}
              </div>

              <div className="form-field">
                <label className="form-label">
                  End Date *
                </label>
                <input
                  type="date"
                  name="endDate"
                  value={formData.endDate}
                  onChange={handleChange}
                  className={`form-input ${errors.endDate ? 'error' : ''}`}
                />
                {errors.endDate && <p className="form-error">{errors.endDate}</p>}
              </div>
            </div>
          </div>

          {/* Registration Settings */}
          <div className="form-section">
            <h3>Registration Settings</h3>
            
            <div className="form-checkbox">
              <input
                type="checkbox"
                name="registration.required"
                checked={formData.registration.required}
                onChange={handleChange}
              />
              <label className="form-label">
                Registration required for this event
              </label>
            </div>

            {formData.registration.required && (
              <div className="form-grid">
                <div className="form-field">
                  <label className="form-label">
                    Registration Start *
                  </label>
                  <input
                    type="date"
                    name="registration.startDate"
                    value={formData.registration.startDate}
                    onChange={handleChange}
                    className={`form-input ${errors['registration.startDate'] ? 'error' : ''}`}
                  />
                  {errors['registration.startDate'] && (
                    <p className="form-error">{errors['registration.startDate']}</p>
                  )}
                </div>

                <div className="form-field">
                  <label className="form-label">
                    Registration End *
                  </label>
                  <input
                    type="date"
                    name="registration.endDate"
                    value={formData.registration.endDate}
                    onChange={handleChange}
                    className={`form-input ${errors['registration.endDate'] ? 'error' : ''}`}
                  />
                  {errors['registration.endDate'] && (
                    <p className="form-error">{errors['registration.endDate']}</p>
                  )}
                </div>

                <div className="form-field">
                  <label className="form-label">
                    Max Participants *
                  </label>
                  <input
                    type="number"
                    name="registration.maxParticipants"
                    value={formData.registration.maxParticipants}
                    onChange={handleChange}
                    className={`form-input ${errors['registration.maxParticipants'] ? 'error' : ''}`}
                    min="1"
                  />
                  {errors['registration.maxParticipants'] && (
                    <p className="text-red-500 text-sm mt-1">{errors['registration.maxParticipants']}</p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Eligibility Criteria */}
          <div className="form-section">
            <h3>Eligibility Criteria</h3>
            
            <div className="form-grid">
              <div className="form-field">
                <label className="form-label">
                  Departments
                </label>
                <div className="form-checkbox-group">
                  {departments.map(dept => (
                    <label key={dept} className="form-checkbox">
                      <input
                        type="checkbox"
                        checked={formData.eligibility.departments.includes(dept)}
                        onChange={(e) => handleArrayChange('eligibility', 'departments', dept, e.target.checked)}
                      />
                      <span>{dept}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="form-field">
                <label className="form-label">
                  Programs
                </label>
                <div className="form-checkbox-group">
                  {programs.map(program => (
                    <label key={program} className="form-checkbox">
                      <input
                        type="checkbox"
                        checked={formData.eligibility.programs.includes(program)}
                        onChange={(e) => handleArrayChange('eligibility', 'programs', program, e.target.checked)}
                      />
                      <span>{program}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Years
                </label>
                <div className="flex gap-4">
                  {years.map(year => (
                    <label key={year} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.eligibility.years.includes(year)}
                        onChange={(e) => handleArrayChange('eligibility', 'years', year, e.target.checked)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <span className="ml-2 text-sm text-gray-700">Year {year}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sections
                </label>
                <div className="flex gap-4">
                  {sections.map(section => (
                    <label key={section} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.eligibility.sections.includes(section)}
                        onChange={(e) => handleArrayChange('eligibility', 'sections', section, e.target.checked)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <span className="ml-2 text-sm text-gray-700">Section {section}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Venue Information */}
          <div className="form-section">
            <h3>Venue Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Venue Name *
                </label>
                <input
                  type="text"
                  name="venue.name"
                  value={formData.venue.name}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors['venue.name'] ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Seminar Hall 1"
                />
                {errors['venue.name'] && <p className="text-red-500 text-sm mt-1">{errors['venue.name']}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Venue Type
                </label>
                <select
                  name="venue.type"
                  value={formData.venue.type}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {venueTypes.map(type => (
                    <option key={type} value={type}>
                      {type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                name="venue.isOnline"
                checked={formData.venue.isOnline}
                onChange={handleChange}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label className="ml-2 block text-sm text-gray-700">
                Online event
              </label>
            </div>

            {formData.venue.isOnline && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Meeting Link *
                </label>
                <input
                  type="url"
                  name="venue.meetingLink"
                  value={formData.venue.meetingLink}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors['venue.meetingLink'] ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="https://meet.google.com/xxx-xxxx-xxx"
                />
                {errors['venue.meetingLink'] && (
                  <p className="text-red-500 text-sm mt-1">{errors['venue.meetingLink']}</p>
                )}
              </div>
            )}
          </div>

          {/* Trainers */}
          <div className="form-section">
            <h3>Trainers</h3>
            
            {trainers.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-40 overflow-y-auto">
                {trainers.map(trainer => (
                  <label key={trainer._id} className="flex items-center p-3 border rounded-lg hover:bg-gray-50">
                    <input
                      type="checkbox"
                      checked={formData.trainers.some(t => t.id === trainer._id)}
                      onChange={(e) => handleTrainerToggle(trainer, e.target.checked)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-900">
                        {trainer.firstName} {trainer.lastName}
                      </p>
                      <p className="text-sm text-gray-500">{trainer.email}</p>
                      {trainer.trainer?.organization && (
                        <p className="text-xs text-gray-400">{trainer.trainer.organization}</p>
                      )}
                    </div>
                  </label>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">No trainers available. Trainers can be assigned later.</p>
            )}
          </div>

          {/* Certificate Settings */}
          <div className="form-section">
            <h3>Certificate Settings</h3>
            
            <div className="flex items-center">
              <input
                type="checkbox"
                name="certificate.enabled"
                checked={formData.certificate.enabled}
                onChange={handleChange}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label className="ml-2 block text-sm text-gray-700">
                Enable certificate generation
              </label>
            </div>

            {formData.certificate.enabled && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Minimum Attendance (%)
                  </label>
                  <input
                    type="number"
                    name="certificate.minAttendance"
                    value={formData.certificate.minAttendance}
                    onChange={handleChange}
                    min="0"
                    max="100"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Template URL
                  </label>
                  <input
                    type="url"
                    name="certificate.templateUrl"
                    value={formData.certificate.templateUrl}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="https://example.com/certificate-template.pdf"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Feedback Settings */}
          <div className="form-section">
            <h3>Feedback Settings</h3>
            
            <div className="flex items-center">
              <input
                type="checkbox"
                name="feedback.enabled"
                checked={formData.feedback.enabled}
                onChange={handleChange}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label className="ml-2 block text-sm text-gray-700">
                Enable feedback collection
              </label>
            </div>

            {formData.feedback.enabled && (
              <div className="space-y-4">
                <p className="text-sm text-gray-600">
                  Default feedback questions are included. You can customize them after creating the event.
                </p>
                <div className="bg-gray-50 p-4 rounded-lg">
                  {formData.feedback.questions.map((question, index) => (
                    <div key={question.id} className="mb-2">
                      <p className="text-sm font-medium text-gray-700">
                        {index + 1}. {question.text}
                      </p>
                      <p className="text-xs text-gray-500">
                        Type: {question.type} | Required: {question.required ? 'Yes' : 'No'}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Error Display */}
          {errors.submit && (
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '1rem' }}>
              <p style={{ color: '#dc2626', fontSize: '0.875rem', margin: 0 }}>{errors.submit}</p>
            </div>
          )}
        </form>
      </div>

      {/* Form Footer with Action Buttons */}
      <div className="form-footer">
        <button
          type="button"
          onClick={onCancel}
          className="btn-secondary"
        >
          Cancel
        </button>
        <button
          type="submit"
          form="eventForm"
          disabled={loading}
          className="btn-primary"
        >
          {loading ? 'Saving...' : (event ? 'Update Event' : 'Create Event')}
        </button>
      </div>
    </div>
  );
};

export default ComprehensiveEventForm;