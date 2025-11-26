import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { addCourseMember } from '../../api/courseService';
import './CourseCard.css';

const CourseCard = ({ course }) => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const isMember = course.isMember || course.members?.includes(currentUser?.uid);

  const handleCardClick = (e) => {
    if (e.target.closest('.join-course-btn')) {
      return;
    }
    navigate(`/course/${course.id}`);
  };

  const handleJoin = async (e) => {
    e.stopPropagation();
    if (!currentUser || isMember) return;
    await addCourseMember(course.id, currentUser.uid);
  };

  return (
    <div className="course-card" onClick={handleCardClick}>
      <div className="course-card-header">
        <h3>{course.name}</h3>
        <span className="course-members-count">
          {course.members?.length || 0} member{course.members?.length !== 1 ? 's' : ''}
        </span>
      </div>
      {course.description && (
        <p className="course-description">{course.description}</p>
      )}
      <div className="course-card-footer">
        {isMember ? (
          <span className="course-link">View Course →</span>
        ) : (
          <button 
            className="join-course-btn btn btn-primary btn-sm"
            onClick={handleJoin}
          >
            Join Course
          </button>
        )}
      </div>
    </div>
  );
};

export default CourseCard;

