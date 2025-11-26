import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { getCourse } from '../../api/courseService';
import './TaskItem.css';

const TaskItem = ({ task, showCourse = false }) => {
  const [courseName, setCourseName] = useState('');

  useEffect(() => {
    if (showCourse && task.courseId) {
      getCourse(task.courseId).then((result) => {
        if (result.success) {
          setCourseName(result.data.name);
        }
      });
    }
  }, [task.courseId, showCourse]);

  const getPriorityClass = (priority) => {
    return `badge badge-${priority}`;
  };

  const formatDate = (date) => {
    if (!date) return null;
    const dateObj = date.toDate ? date.toDate() : new Date(date);
    return format(dateObj, 'MMM dd, yyyy');
  };

  const isOverdue = (dueDate) => {
    if (!dueDate) return false;
    const dateObj = dueDate.toDate ? dueDate.toDate() : new Date(dueDate);
    return dateObj < new Date() && dateObj.setHours(0, 0, 0, 0) !== new Date().setHours(0, 0, 0, 0);
  };

  return (
    <div className={`task-item ${task.status === 'completed' ? 'completed' : ''}`}>
      <div className="task-item-content">
        <div className="task-header">
          <h4 className="task-title">{task.title}</h4>
          <span className={getPriorityClass(task.priority)}>
            {task.priority}
          </span>
        </div>
        {task.description && (
          <p className="task-description">{task.description}</p>
        )}
        <div className="task-meta">
          {showCourse && courseName && (
            <span className="task-course">{courseName}</span>
          )}
          {task.dueDate && (
            <span className={`task-due-date ${isOverdue(task.dueDate) && task.status !== 'completed' ? 'overdue' : ''}`}>
              Due: {formatDate(task.dueDate)}
            </span>
          )}
          {task.assignedTo && (
            <span className="task-assigned">Assigned</span>
          )}
        </div>
      </div>
      <div className="task-status">
        <span className={`badge badge-${task.status === 'completed' ? 'completed' : 'pending'}`}>
          {task.status}
        </span>
      </div>
    </div>
  );
};

export default TaskItem;

