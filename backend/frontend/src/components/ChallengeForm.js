import React, { useState, useContext, useEffect } from 'react';
import { ThemeContext } from '../ThemeContext';
import '../styles/ChallengeForm.css';

const ChallengeForm = ({ 
  challenge = null, 
  onSave, 
  onCancel,
  isEditing = false
}) => {
  const { theme } = useContext(ThemeContext);
  const today = new Date().toISOString().split('T')[0];
  const sixMonthsLater = new Date();
  sixMonthsLater.setMonth(sixMonthsLater.getMonth() + 6);
  const sixMonthsLaterFormatted = sixMonthsLater.toISOString().split('T')[0];

  const defaultChallenge = {
    id: `challenge-${Date.now()}`,
    name: '',
    description: '',
    target_books: 5,
    books_read: 0,
    start_date: today,
    end_date: sixMonthsLaterFormatted,
    days_remaining: 180,
    progress_percentage: 0
  };

  // Initialize with either provided challenge or default values
  const [formData, setFormData] = useState(challenge || defaultChallenge);
  const [errors, setErrors] = useState({});
  const [minStartDate, setMinStartDate] = useState(today);
  const [minEndDate, setMinEndDate] = useState(today);

  // Set initial minimum dates based on whether editing or creating
  useEffect(() => {
    if (isEditing && challenge) {
      // If editing, don't restrict start date to today
      // (allow keeping the original start date even if it's in the past)
      setMinStartDate('');
      
      // For end date, make sure it's at least today
      // (can't have a challenge end in the past)
      setMinEndDate(today);
    } else {
      // New challenge - both dates must be today or later
      setMinStartDate(today);
      setMinEndDate(today);
    }
  }, [isEditing, challenge, today]);

  // Calculate days remaining whenever start/end dates change
  useEffect(() => {
    const start = new Date(formData.start_date);
    const end = new Date(formData.end_date);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    setFormData(prev => ({
      ...prev, 
      days_remaining: diffDays
    }));
  }, [formData.start_date, formData.end_date]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    let parsedValue = value;
  
    if (name === 'target_books') {
      parsedValue = parseInt(value, 10) || 1;
    }
  
    setFormData({
      ...formData,
      [name]: parsedValue
    });
  
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: null
      });
    }
    
    // When start date changes, ensure end date is after it
    if (name === 'start_date') {
      // Set minimum end date to be the same as start date
      const newStartDate = new Date(value);
      const todayDate = new Date(today);
      
      // End date should be at least the later of start date or today
      if (newStartDate > todayDate) {
        setMinEndDate(value);
      } else {
        setMinEndDate(today);
      }
      
      // If end date is now before start date, update it
      const endDate = new Date(formData.end_date);
      if (endDate < newStartDate) {
        // Set end date to start date + 7 days
        const newEndDate = new Date(newStartDate);
        newEndDate.setDate(newEndDate.getDate() + 7);
        setFormData(prev => ({
          ...prev,
          end_date: newEndDate.toISOString().split('T')[0]
        }));
      }
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Challenge name is required';
    }
    
    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }
    
    if (formData.target_books < 1) {
      newErrors.target_books = 'Target must be at least 1 book';
    }
    
    const startDate = new Date(formData.start_date);
    const endDate = new Date(formData.end_date);
    const todayDate = new Date(today);
    
    // For new challenges, validate start date is not in the past
    if (!isEditing && startDate < todayDate) {
      newErrors.start_date = 'Start date cannot be in the past';
    }
    
    // For all challenges, validate end date is not in the past
    if (endDate < todayDate) {
      newErrors.end_date = 'End date cannot be in the past';
    }
    
    // Validate end date is after start date
    if (endDate <= startDate) {
      newErrors.end_date = 'End date must be after start date';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (validateForm()) {
      onSave(formData);
    }
  };

  return (
    <div className={`challenge-form-container ${theme === 'dark' ? 'dark-mode' : ''}`}>
      <h2 className="form-title">
        {isEditing ? 'Edit Challenge' : 'Create New Challenge'}
      </h2>
      
      <form onSubmit={handleSubmit} className="challenge-form" style={{ paddingBottom: '60px' }}>
        <div className="form-group">
          <label htmlFor="name">Challenge Name</label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="e.g., Summer Reading Challenge"
            className={errors.name ? 'input-error' : ''}
          />
          {errors.name && <div className="error-message">{errors.name}</div>}
        </div>
        
        <div className="form-group">
          <label htmlFor="description">Description</label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Describe your reading challenge"
            rows="3"
            className={errors.description ? 'input-error' : ''}
          />
          {errors.description && <div className="error-message">{errors.description}</div>}
        </div>
        
        <div className="form-group">
          <label htmlFor="target_books">Book Target</label>
          <input
            type="number"
            id="target_books"
            name="target_books"
            value={formData.target_books}
            onChange={handleChange}
            min="1"
            max="100"
            className={errors.target_books ? 'input-error' : ''}
          />
          {errors.target_books && <div className="error-message">{errors.target_books}</div>}
        </div>
        
        <div className="form-group">
          <label htmlFor="start_date">Start Date {!isEditing && <span className="date-info">(today or later)</span>}</label>
          <input
            type="date"
            id="start_date"
            name="start_date"
            value={formData.start_date}
            onChange={handleChange}
            min={minStartDate}
            className={errors.start_date ? 'input-error' : ''}
          />
          {errors.start_date && <div className="error-message">{errors.start_date}</div>}
          {!isEditing && <div className="help-text">New challenges must start today or in the future</div>}
        </div>
        
        <div className="form-group">
          <label htmlFor="end_date">End Date <span className="date-info">(must be after start date)</span></label>
          <input
            type="date"
            id="end_date"
            name="end_date"
            value={formData.end_date}
            onChange={handleChange}
            min={minEndDate}
            className={errors.end_date ? 'input-error' : ''}
          />
          {errors.end_date && <div className="error-message">{errors.end_date}</div>}
        </div>
        
        <div className="form-info">
          <p>Duration: {formData.days_remaining} days</p>
        </div>
        
        <div className="form-actions">
          <button 
            type="button" 
            onClick={onCancel}
            className={`cancel-button ${theme === 'dark' ? 'dark-button' : ''}`}
          >
            Cancel
          </button>
          <button 
            type="submit"
            className={`save-button ${theme === 'dark' ? 'dark-button' : ''}`}
          >
            {isEditing ? 'Update Challenge' : 'Create Challenge'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ChallengeForm;