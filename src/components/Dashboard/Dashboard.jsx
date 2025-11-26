import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { logoutUser } from '../../api/authService';
import { subscribeToUserCourses, createCourse } from '../../api/courseService';
import { subscribeToUserTasks } from '../../api/taskService';
import { checkForNewTaskAssignments, checkUpcomingDeadlines } from '../../api/notificationService';
import { useToast } from '../../contexts/ToastContext';
import CourseCard from './CourseCard';
import TaskItem from './TaskItem';
import CreateCourseModal from './CreateCourseModal';
import TaskStats from './TaskStats';
import LoadingSpinner from '../Common/LoadingSpinner';
import NotificationPermission from '../Common/NotificationPermission';
import './Dashboard.css';

const Dashboard = () => {
  const { currentUser, userProfile } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('dueDate');

  const previousTasksRef = useRef([]);

  useEffect(() => {
    if (!currentUser) return;

    const unsubscribeCourses = subscribeToUserCourses(currentUser.uid, (coursesData) => {
      setCourses(coursesData);
      setLoading(false);
    });

    const unsubscribeTasks = subscribeToUserTasks(currentUser.uid, (tasksData) => {
      checkForNewTaskAssignments(previousTasksRef.current, tasksData, currentUser.uid, courses);
      checkUpcomingDeadlines(tasksData, currentUser.uid);
      previousTasksRef.current = tasksData;
      setTasks(tasksData);
    });

    return () => {
      unsubscribeCourses();
      unsubscribeTasks();
    };
  }, [currentUser]);

  const handleLogout = async () => {
    await logoutUser();
    navigate('/login');
  };

  const handleCreateCourse = async (courseData) => {
    try {
      const result = await createCourse(
        courseData.name,
        courseData.description,
        currentUser.uid
      );
      if (result.success) {
        setShowCreateModal(false);
      } else {
        alert('Failed to create course: ' + (result.error || 'Unknown error'));
      }
    } catch (error) {
      alert('Error creating course: ' + error.message);
    }
  };

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

  const completedCount = tasks.filter(t => t.status === 'completed').length;
  const pendingCount = tasks.filter(t => t.status === 'pending').length;

  if (loading) {
    return <LoadingSpinner fullScreen />;
  }

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div className="container">
          <div className="header-content">
            <div>
              <h1>StudySync Tasks</h1>
              <p className="welcome-text">
                Welcome back, {userProfile?.displayName || currentUser?.email}!
              </p>
            </div>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <NotificationPermission />
              <button onClick={handleLogout} className="btn btn-logout">
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="dashboard-main">
        <div className="container">
          <div className="stats-grid">
            <div className="stat-card">
              <h3>{courses.length}</h3>
              <p>Courses</p>
            </div>
            <div className="stat-card">
              <h3>{tasks.length}</h3>
              <p>Total Tasks</p>
            </div>
            <div className="stat-card">
              <h3>{pendingCount}</h3>
              <p>Pending</p>
            </div>
            <div className="stat-card">
              <h3>{completedCount}</h3>
              <p>Completed</p>
            </div>
          </div>

          {tasks.length > 0 && (
            <TaskStats tasks={tasks} courses={courses} />
          )}

          <section className="dashboard-section">
            <div className="section-header">
              <h2>All Courses</h2>
              <button
                onClick={() => setShowCreateModal(true)}
                className="btn btn-primary"
              >
                + New Course
              </button>
            </div>
            <div className="courses-grid">
              {courses.length === 0 ? (
                <div className="empty-state">
                  <p>No courses yet. Create your first course to get started!</p>
                </div>
              ) : (
                courses.map((course) => (
                  <CourseCard 
                    key={course.id} 
                    course={course}
                  />
                ))
              )}
            </div>
          </section>

          <section className="dashboard-section">
            <div className="section-header">
              <h2>All Tasks</h2>
              <div className="filter-controls">
                <select
                  className="input"
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  style={{ width: 'auto', marginRight: '0.5rem' }}
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
            </div>
            <div className="tasks-list">
              {sortedTasks.length === 0 ? (
                <div className="empty-state">
                  <p>No tasks found. Create tasks in your courses!</p>
                </div>
              ) : (
                sortedTasks.map((task) => (
                  <TaskItem key={task.id} task={task} showCourse={true} />
                ))
              )}
            </div>
          </section>
        </div>
      </main>

      {showCreateModal && (
        <CreateCourseModal
          onClose={() => setShowCreateModal(false)}
          onCreate={handleCreateCourse}
        />
      )}
    </div>
  );
};

export default Dashboard;

