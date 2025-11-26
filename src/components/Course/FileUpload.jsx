import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { uploadFile } from '../../api/storageService';
import './FileUpload.css';

const FileUpload = ({ taskId, onUploadComplete }) => {
  const { currentUser } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setError('File size must be less than 10MB');
      return;
    }

    if (taskId === 'new') {
      setError('Please create the task first, then add attachments');
      return;
    }

    setUploading(true);
    setError('');

    const result = await uploadFile(file, taskId, currentUser.uid);
    
    if (result.success) {
      if (onUploadComplete) {
        onUploadComplete({
          url: result.url,
          name: result.name,
          size: result.size,
          type: result.type,
          uploadedBy: currentUser.uid,
          uploadedAt: new Date()
        });
      }
      e.target.value = '';
    } else {
      setError(result.error || 'Failed to upload file');
    }

    setUploading(false);
  };

  return (
    <div className="file-upload">
      <label className="file-upload-label">
        <input
          type="file"
          onChange={handleFileSelect}
          disabled={uploading}
          className="file-upload-input"
        />
        <span className="file-upload-button">
          {uploading ? 'Uploading...' : 'Attach File'}
        </span>
      </label>
      {error && <div className="file-upload-error">{error}</div>}
    </div>
  );
};

export default FileUpload;

