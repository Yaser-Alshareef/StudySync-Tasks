import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { createTask } from '../../api/taskService';
import { getUserProfile } from '../../api/authService';
import { notifyTaskCreated } from '../../api/notificationService';
import { getCourse } from '../../api/courseService';
import FileUpload from './FileUpload';
import './CreateTaskModal.css';

const CreateTaskModal = ({ onClose, courseId, courseMembers }) => {
  const { currentUser } = useAuth();
  const { showToast } = useToast();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    dueDate: '',
    priority: 'medium',
    assignedTo: '',
    attachments: []
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [memberProfiles, setMemberProfiles] = useState({});

  useEffect(() => {
    const loadMemberProfiles = async () => {
      const profiles = {};
      for (const memberId of courseMembers) {
        const result = await getUserProfile(memberId);
        if (result.success) {
          profiles[memberId] = result.data;
        }
      }
      setMemberProfiles(profiles);
    };
    loadMemberProfiles();
  }, [courseMembers]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.title.trim()) {
      setError('Task title is required');
      return;
    }

    setLoading(true);

    try {
      const result = await createTask(
        formData,
        courseId,
        courseMembers,
        currentUser.uid
      );

      if (result.success) {
        showToast('Task created successfully!', 'success');
        
        if (formData.assignedTo && formData.assignedTo !== currentUser.uid) {
          const courseResult = await getCourse(courseId);
          const courseName = courseResult.success ? courseResult.data.name : 'Course';
          await notifyTaskCreated(result.data, formData.assignedTo, currentUser.uid, courseName);
        }
        
        setFormData({
          title: '',
          description: '',
          dueDate: '',
          priority: 'medium',
          assignedTo: '',
          attachments: []
        });
        setError('');
        setSuccess(true);
        setTimeout(() => {
          setSuccess(false);
          onClose();
        }, 1500);
      } else {
        setError(result.error || 'Failed to create task');
        setLoading(false);
      }
    } catch (err) {
      setError(err.message || 'An unexpected error occurred. Please try again.');
    }

    setLoading(false);
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget && !loading) {
      onClose();
    }
  };

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Create New Task</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">Task created successfully! </div>}

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label htmlFor="title">Task Title *</label>
            <input
              type="text"
              id="title"
              name="title"
              className="input"
              value={formData.title}
              onChange={handleChange}
              required
              placeholder="Enter task title"
            />
          </div>

          <div className="form-group">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              name="description"
              className="input"
              value={formData.description}
              onChange={handleChange}
              rows="4"
              placeholder="Optional task description"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="dueDate">Due Date</label>
              <input
                type="date"
                id="dueDate"
                name="dueDate"
                className="input"
                value={formData.dueDate}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label htmlFor="priority">Priority</label>
              <select
                id="priority"
                name="priority"
                className="input"
                value={formData.priority}
                onChange={handleChange}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="assignedTo">Assign To</label>
            <select
              id="assignedTo"
              name="assignedTo"
              className="input"
              value={formData.assignedTo}
              onChange={handleChange}
            >
              <option value="">Unassigned</option>
              {courseMembers.map((memberId) => (
                <option key={memberId} value={memberId}>
                  {memberId === currentUser?.uid
                    ? 'Me'
                    : memberProfiles[memberId]?.displayName || memberProfiles[memberId]?.email || memberId}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Attachments</label>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
              You can add attachments after creating the task.
            </p>
          </div>

          <div className="modal-actions">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-outline"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? 'Creating...' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateTaskModal;

