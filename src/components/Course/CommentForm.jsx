import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { createComment } from '../../api/commentService';
import './CommentForm.css';

const CommentForm = ({ taskId }) => {
  const { currentUser } = useAuth();
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!text.trim()) {
      setError('Comment cannot be empty');
      return;
    }

    if (!currentUser) {
      setError('You must be logged in to comment');
      return;
    }

    setLoading(true);
    const result = await createComment(taskId, text.trim(), currentUser.uid);
    
    if (result.success) {
      setText('');
    } else {
      setError(result.error || 'Failed to post comment');
    }
    
    setLoading(false);
  };

  return (
    <form className="comment-form" onSubmit={handleSubmit}>
      {error && <div className="comment-error">{error}</div>}
      <div className="comment-input-wrapper">
        <textarea
          className="comment-input"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Write a comment..."
          rows="3"
          disabled={loading}
        />
        <button
          type="submit"
          className="btn btn-primary btn-sm comment-submit"
          disabled={loading || !text.trim()}
        >
          {loading ? 'Posting...' : 'Post Comment'}
        </button>
      </div>
    </form>
  );
};

export default CommentForm;

