import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { useAuth } from '../../contexts/AuthContext';
import { subscribeToTaskComments, deleteComment } from '../../api/commentService';
import { getUserProfile } from '../../api/authService';
import CommentForm from './CommentForm';
import './CommentList.css';

const CommentList = ({ taskId }) => {
  const { currentUser } = useAuth();
  const [comments, setComments] = useState([]);
  const [userProfiles, setUserProfiles] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!taskId) return;

    const unsubscribe = subscribeToTaskComments(taskId, (commentsData) => {
      setComments(commentsData);
      setLoading(false);

      const userIds = [...new Set(commentsData.map(c => c.createdBy))];
      userIds.forEach(userId => {
        if (!userProfiles[userId]) {
          getUserProfile(userId).then((result) => {
            if (result.success) {
              setUserProfiles(prev => ({
                ...prev,
                [userId]: result.data
              }));
            }
          });
        }
      });
    });

    return unsubscribe;
  }, [taskId]);

  const handleDelete = async (commentId) => {
    if (window.confirm('Are you sure you want to delete this comment?')) {
      await deleteComment(taskId, commentId);
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return format(date, 'MMM dd, yyyy HH:mm');
    } catch (e) {
      return '';
    }
  };

  if (loading) {
    return <div className="comment-list-loading">Loading comments...</div>;
  }

  return (
    <div className="comment-list">
      <h4 className="comment-list-title">Comments ({comments.length})</h4>
      
      <CommentForm taskId={taskId} />

      <div className="comments-container">
        {comments.length === 0 ? (
          <p className="no-comments">No comments yet. Be the first to comment!</p>
        ) : (
          comments.map((comment) => {
            const user = userProfiles[comment.createdBy];
            const isOwner = comment.createdBy === currentUser?.uid;

            return (
              <div key={comment.id} className="comment-item">
                <div className="comment-header">
                  <div className="comment-author">
                    <span className="comment-author-name">
                      {user?.displayName || user?.email || 'Unknown User'}
                    </span>
                    <span className="comment-date">
                      {formatDate(comment.createdAt)}
                    </span>
                  </div>
                  {isOwner && (
                    <button
                      className="comment-delete-btn"
                      onClick={() => handleDelete(comment.id)}
                      title="Delete comment"
                    >
                      ×
                    </button>
                  )}
                </div>
                <p className="comment-text">{comment.text}</p>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default CommentList;

