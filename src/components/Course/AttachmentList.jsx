import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { deleteFile } from '../../api/storageService';
import { updateTask } from '../../api/taskService';
import { format } from 'date-fns';
import './AttachmentList.css';

const AttachmentList = ({ task, onUpdate }) => {
  const { currentUser } = useAuth();
  const attachments = task.attachments || [];

  const handleDelete = async (attachment) => {
    if (!window.confirm('Are you sure you want to delete this file?')) return;

    const result = await deleteFile(attachment.url);
    if (result.success) {
      const updatedAttachments = attachments.filter(a => a.url !== attachment.url);
      await updateTask(task.id, { attachments: updatedAttachments });
      if (onUpdate) onUpdate();
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const formatDate = (date) => {
    if (!date) return '';
    try {
      const dateObj = date instanceof Date ? date : (date.toDate ? date.toDate() : new Date(date));
      return format(dateObj, 'MMM dd, yyyy');
    } catch (e) {
      return '';
    }
  };

  if (attachments.length === 0) {
    return null;
  }

  return (
    <div className="attachment-list">
      <h5 className="attachment-list-title">Attachments ({attachments.length})</h5>
      <div className="attachments-grid">
        {attachments.map((attachment, index) => {
          const canDelete = attachment.uploadedBy === currentUser?.uid || task.createdBy === currentUser?.uid;
          
          return (
            <div key={index} className="attachment-item">
              <a
                href={attachment.url}
                target="_blank"
                rel="noopener noreferrer"
                className="attachment-link"
              >
                <span className="attachment-icon">📎</span>
                <div className="attachment-info">
                  <span className="attachment-name">{attachment.name}</span>
                  <span className="attachment-meta">
                    {formatFileSize(attachment.size)} • {formatDate(attachment.uploadedAt)}
                  </span>
                </div>
              </a>
              {canDelete && (
                <button
                  className="attachment-delete"
                  onClick={() => handleDelete(attachment)}
                  title="Delete attachment"
                >
                  ×
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AttachmentList;

