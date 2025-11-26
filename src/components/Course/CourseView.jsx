import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { getCourse } from '../../api/courseService';
import { subscribeToCourseTasks } from '../../api/taskService';
import { checkForNewTaskAssignments, checkUpcomingDeadlines } from '../../api/notificationService';
import TaskList from './TaskList';
import CreateTaskModal from './CreateTaskModal';
import LoadingSpinner from '../Common/LoadingSpinner';
import './CourseView.css';

const CourseView = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [course, setCourse] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('dueDate');

  useEffect(() => {
    const loadCourse = async () => {
      const result = await getCourse(courseId);
      if (result.success) {
        setCourse(result.data);
        setLoading(false);
      } else {
        navigate('/dashboard');
      }
    };

    loadCourse();
  }, [courseId, navigate]);

  const previousTasksRef = useRef([]);

  useEffect(() => {
    if (!courseId) return;

    const unsubscribe = subscribeToCourseTasks(courseId, (tasksData) => {
      if (currentUser && course) {
        checkForNewTaskAssignments(previousTasksRef.current, tasksData, currentUser.uid, [course]);
        checkUpcomingDeadlines(tasksData, currentUser.uid);
      }
      previousTasksRef.current = tasksData;
      setTasks(tasksData);
    });

    return unsubscribe;
  }, [courseId, currentUser, course]);

  const filteredTasks = tasks.filter((task) => {
    if (filter === 'all') return true;
    if (filter === 'assigned') return task.assignedTo === currentUser?.uid;
    if (filter === 'pending') return task.status === 'pending';
    if (filter === 'completed') return task.status === 'completed';
    return true;
  });

  const sortedTasks = [...filteredTasks].sort((a, b) => {
    if (sortBy === 'dueDate') {
      if (!a.dueDate && !b.dueDate) return 0;
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      return new Date(a.dueDate) - new Date(b.dueDate);
    }
    if (sortBy === 'priority') {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    }
    if (sortBy === 'created') {
      return new Date(b.createdAt?.toDate?.() || b.createdAt) - 
             new Date(a.createdAt?.toDate?.() || a.createdAt);
    }
    return 0;
  });

  if (loading) {
    return <LoadingSpinner fullScreen />;
  }

  if (!course) {
    return null;
  }

  const pendingCount = tasks.filter(t => t.status === 'pending').length;
  const completedCount = tasks.filter(t => t.status === 'completed').length;

  return (
    <div className="course-view">
      <header className="course-header">
        <div className="container">
          <button onClick={() => navigate('/dashboard')} className="btn btn-back btn-sm">
            ← Back to Dashboard
          </button>
          <div className="course-header-content">
            <div>
              <h1>{course.name}</h1>
              {course.description && <p className="course-description">{course.description}</p>}
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="btn btn-primary"
            >
              + New Task
            </button>
          </div>
        </div>
      </header>

      <main className="course-main">
        <div className="container">
          <div className="course-stats">
            <div className="stat-item">
              <span className="stat-value">{tasks.length}</span>
              <span className="stat-label">Total Tasks</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">{pendingCount}</span>
              <span className="stat-label">Pending</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">{completedCount}</span>
              <span className="stat-label">Completed</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">{course.members?.length || 0}</span>
              <span className="stat-label">Members</span>
            </div>
          </div>

          <div className="course-controls">
            <select
              className="input"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              style={{ width: 'auto' }}
            >
              <option value="all">All Tasks</option>
              <option value="assigned">Assigned to Me</option>
              <option value="pending">Pending</option>
              <option value="completed">Completed</option>
            </select>
            <select
              className="input"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              style={{ width: 'auto' }}
            >
              <option value="dueDate">Sort by Due Date</option>
              <option value="priority">Sort by Priority</option>
              <option value="created">Sort by Created</option>
            </select>
          </div>

          <TaskList tasks={sortedTasks} course={course} />
        </div>
      </main>

      {showCreateModal && (
        <CreateTaskModal
          onClose={() => setShowCreateModal(false)}
          courseId={courseId}
          courseMembers={course.members || []}
        />
      )}
    </div>
  );
};

export default CourseView;

