import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { useAuth } from '../../contexts/AuthContext';
import { toggleTaskStatus, deleteTask, updateTask } from '../../api/taskService';
import { getUserProfile } from '../../api/authService';
import { notifyTaskCreated, notifyTaskUpdated, notifyTaskDeleted } from '../../api/notificationService';
import CommentList from './CommentList';
import AttachmentList from './AttachmentList';
import FileUpload from './FileUpload';
import './TaskCard.css';

const TaskCard = ({ task, course, dragListeners }) => {
  const { currentUser } = useAuth();
  const [assignedUser, setAssignedUser] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  const getDateValue = (date) => {
    if (!date) return '';
    const dateObj = date.toDate ? date.toDate() : new Date(date);
    return format(dateObj, 'yyyy-MM-dd');
  };

  const [editData, setEditData] = useState({
    title: task.title,
    description: task.description || '',
    dueDate: getDateValue(task.dueDate),
    priority: task.priority,
    assignedTo: task.assignedTo || ''
  });

  useEffect(() => {
    if (task.assignedTo) {
      getUserProfile(task.assignedTo).then((result) => {
        if (result.success) {
          setAssignedUser(result.data);
        }
      });
    }
  }, [task.assignedTo]);

  const handleToggleStatus = async () => {
    await toggleTaskStatus(task.id, task.status !== 'completed');
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      try {
        const taskTitle = task.title;
        const courseName = course?.name || 'Course';
        const result = await deleteTask(task.id);
        if (result.success) {
          await notifyTaskDeleted(taskTitle, courseName, currentUser?.uid);
        } else {
          alert('Failed to delete task: ' + (result.error || 'Unknown error'));
        }
      } catch (error) {
        alert('Error deleting task: ' + error.message);
      }
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSave = async () => {
    if (!editData.title.trim()) {
      alert('Task title is required');
      return;
    }

    try {
      const updates = {
        title: editData.title.trim(),
        description: editData.description.trim(),
        priority: editData.priority,
        assignedTo: editData.assignedTo || null,
        dueDate: editData.dueDate ? new Date(editData.dueDate) : null
      };
      
      const wasAssigned = task.assignedTo;
      const isNewlyAssigned = updates.assignedTo && updates.assignedTo !== wasAssigned;
      const isAssignedToSomeone = updates.assignedTo && updates.assignedTo !== currentUser?.uid;
      
      const result = await updateTask(task.id, updates);
      if (result.success) {
        const courseName = course?.name || 'Course';
        if (isNewlyAssigned && isAssignedToSomeone) {
          await notifyTaskCreated({ ...task, ...updates }, updates.assignedTo, currentUser?.uid, courseName);
        } else if (updates.assignedTo && updates.assignedTo !== currentUser?.uid) {
          await notifyTaskUpdated({ ...task, ...updates }, updates.assignedTo, currentUser?.uid, courseName);
        }
        setIsEditing(false);
      } else {
        alert('Failed to update task: ' + (result.error || 'Unknown error'));
      }
    } catch (error) {
      alert('Error updating task: ' + error.message);
    }
  };

  const handleCancel = () => {
    setEditData({
      title: task.title,
      description: task.description || '',
      dueDate: getDateValue(task.dueDate),
      priority: task.priority,
      assignedTo: task.assignedTo || ''
    });
    setIsEditing(false);
  };

  const formatDate = (date) => {
    if (!date) return null;
    const dateObj = date.toDate ? date.toDate() : new Date(date);
    return format(dateObj, 'MMM dd, yyyy');
  };

  const isOverdue = (dueDate) => {
    if (!dueDate || task.status === 'completed') return false;
    const dateObj = dueDate.toDate ? dueDate.toDate() : new Date(dueDate);
    return dateObj < new Date() && dateObj.setHours(0, 0, 0, 0) !== new Date().setHours(0, 0, 0, 0);
  };

  if (isEditing) {
    return (
      <div className="task-card editing">
        <div className="task-card-header">
          <input
            type="text"
            className="input"
            value={editData.title}
            onChange={(e) => setEditData({ ...editData, title: e.target.value })}
            placeholder="Task title"
          />
        </div>
        <textarea
          className="input"
          value={editData.description}
          onChange={(e) => setEditData({ ...editData, description: e.target.value })}
          placeholder="Task description"
          rows="3"
        />
        <div className="task-edit-fields">
          <div className="form-group">
            <label>Due Date</label>
            <input
              type="date"
              className="input"
              value={editData.dueDate}
              onChange={(e) => setEditData({ ...editData, dueDate: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label>Priority</label>
            <select
              className="input"
              value={editData.priority}
              onChange={(e) => setEditData({ ...editData, priority: e.target.value })}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
          <div className="form-group">
            <label>Assign To</label>
            <select
              className="input"
              value={editData.assignedTo}
              onChange={(e) => setEditData({ ...editData, assignedTo: e.target.value })}
            >
              <option value="">Unassigned</option>
              {course.members?.map((memberId) => (
                <option key={memberId} value={memberId}>
                  {memberId === currentUser?.uid ? 'Me' : memberId}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="task-actions">
          <button onClick={handleSave} className="btn btn-primary btn-sm">
            Save
          </button>
          <button onClick={handleCancel} className="btn btn-outline btn-sm">
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div 
      className={`task-card ${task.status === 'completed' ? 'completed' : ''}`}
    >
      <div className="task-card-header">
        <div className="task-title-section">
          <input
            type="checkbox"
            checked={task.status === 'completed'}
            onChange={(e) => {
              e.stopPropagation();
              handleToggleStatus(e);
            }}
            className="task-checkbox"
            onClick={(e) => e.stopPropagation()}
          />
          <h3 
            className="task-title"
            {...(dragListeners || {})}
            style={{ cursor: dragListeners ? 'grab' : 'default', flex: 1 }}
          >
            {task.title}
          </h3>
        </div>
        {dragListeners && (
          <span className="drag-hint" {...dragListeners} title="Drag to reorder">
            <span className="drag-handle">⋮⋮</span>
            <span className="drag-text">Drag</span>
          </span>
        )}
        <span className={`badge badge-${task.priority}`}>
          {task.priority}
        </span>
      </div>

      {task.description && (
        <p className="task-description">{task.description}</p>
      )}

      <div className="task-meta">
        {task.dueDate && (
          <span className={`task-due-date ${isOverdue(task.dueDate) ? 'overdue' : ''}`}>
            📅 {formatDate(task.dueDate)}
          </span>
        )}
        {assignedUser && (
          <span className="task-assigned">
            👤 {assignedUser.displayName || assignedUser.email}
          </span>
        )}
        {task.assignedTo === currentUser?.uid && !assignedUser && (
          <span className="task-assigned">👤 Me</span>
        )}
      </div>

      <div className="task-actions" onClick={(e) => e.stopPropagation()}>
        <button 
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            handleEdit();
          }} 
          className="btn btn-outline btn-sm"
        >
          Edit
        </button>
        <button 
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            handleDelete();
          }} 
          className="btn btn-danger btn-sm"
        >
          Delete
        </button>
      </div>

      <AttachmentList task={task} />
      
      <div className="task-attachment-upload">
        <FileUpload
          taskId={task.id}
          onUploadComplete={async (attachment) => {
            const currentAttachments = task.attachments || [];
            await updateTask(task.id, {
              attachments: [...currentAttachments, attachment]
            });
          }}
        />
      </div>

      <CommentList taskId={task.id} />
    </div>
  );
};

export default TaskCard;

