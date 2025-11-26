import { messaging } from '../config/firebase';
import { getToken, onMessage } from 'firebase/messaging';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

const registerServiceWorker = async () => {
  if (!('serviceWorker' in navigator)) {
    return { success: false, error: 'Service Workers are not supported in this browser' };
  }

  try {
    let registration = await navigator.serviceWorker.getRegistration('/');
    
    if (!registration) {
      registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
        scope: '/'
      });
    }

    if (registration.active) {
      return { success: true, registration };
    } else if (registration.installing) {
      await new Promise((resolve) => {
        registration.installing.addEventListener('statechange', () => {
          if (registration.installing.state === 'activated') {
            resolve();
          }
        });
      });
      return { success: true, registration };
    } else if (registration.waiting) {
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      return { success: true, registration };
    }

    return { success: true, registration };
  } catch (error) {
    console.error('Service Worker registration failed:', error);
    return { success: false, error: error.message };
  }
};

export const requestNotificationPermission = async () => {
  if (!messaging) {
    return { success: false, error: 'Messaging not available' };
  }

  const vapidKey = import.meta.env.VITE_VAPID_KEY?.trim();

  if (!vapidKey || vapidKey === 'your_vapid_key_here') {
    return { 
      success: false, 
      error: 'VAPID key not configured. Please add your VAPID key to the .env file.' 
    };
  }

  try {
    const swRegistration = await registerServiceWorker();
    if (!swRegistration.success) {
      return { success: false, error: `Service Worker registration failed: ${swRegistration.error}` };
    }

    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      return { success: false, error: 'Notification permission denied' };
    }

    const token = await getToken(messaging, { 
      vapidKey,
      serviceWorkerRegistration: swRegistration.registration
    });
    
    if (!token) {
      return { 
        success: false, 
        error: 'No registration token available. Check your VAPID key configuration.' 
      };
    }

    return { success: true, token };
  } catch (error) {
    if (error.message?.includes('applicationServerKey') || error.message?.includes('vapid')) {
      return { 
        success: false, 
        error: 'Invalid VAPID key. Please check your .env file and ensure the VAPID key is correct.' 
      };
    }
    if (error.message?.includes('Service Worker') || error.message?.includes('service worker')) {
      return { 
        success: false, 
        error: 'Service Worker error. Please refresh the page and try again.' 
      };
    }
    return { success: false, error: error.message || 'Failed to request notification permission' };
  }
};

export const saveFCMToken = async (userId, token) => {
  try {
    await updateDoc(doc(db, 'users', userId), {
      fcmToken: token,
      fcmTokenUpdatedAt: new Date()
    });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const getFCMToken = async (userId) => {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (!userDoc.exists()) {
      return { success: false, error: 'User not found' };
    }
    return { success: true, token: userDoc.data().fcmToken };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const setupMessageListener = (callback) => {
  if (!messaging || !callback) {
    return null;
  }
  return onMessage(messaging, callback);
};

const showBrowserNotification = (title, body, tag) => {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return;
  }

  if (Notification.permission !== 'granted') {
    return;
  }

  try {
    const notification = new Notification(title, {
      body,
      icon: '/icon-192x192.png',
      badge: '/badge-72x72.png',
      tag: tag || `notification-${Date.now()}`,
      requireInteraction: false,
      silent: false
    });

    notification.onclick = () => {
      window.focus();
      notification.close();
    };

    setTimeout(() => {
      try {
        notification.close();
      } catch (e) {
      }
    }, 5000);
  } catch (error) {
    console.warn('Failed to show browser notification:', error);
  }
};

const showInAppNotification = (message, type = 'info') => {
  if (typeof window === 'undefined') {
    return;
  }

  if (!message || !message.trim()) {
    return;
  }

  try {
    const event = new CustomEvent('showToast', {
      detail: { message: message.trim(), type: type || 'info' },
      bubbles: true,
      cancelable: true
    });
    window.dispatchEvent(event);
  } catch (error) {
    console.warn('Failed to show in-app notification:', error);
  }
};

const showNotification = (title, body, tag) => {
  showInAppNotification(body, 'info');
  showBrowserNotification(title, body, tag);
};

export const notifyTaskCreated = async (task, assignedUserId, creatorUserId, courseName) => {
  if (!assignedUserId || !creatorUserId || assignedUserId === creatorUserId) {
    return;
  }

  try {
    const { getUserProfile } = await import('./authService');
    const creatorResult = await getUserProfile(creatorUserId);
    const creatorName = creatorResult.success 
      ? (creatorResult.data?.displayName || creatorResult.data?.email || 'Someone')
      : 'Someone';

    const taskTitle = task.title || 'New Task';
    const message = `${creatorName} assigned you "${taskTitle}" in ${courseName}`;
    showInAppNotification(message, 'info');
    
    if ('Notification' in window && Notification.permission === 'granted') {
      showBrowserNotification('New Task Assigned', message, `task-${task.id || Date.now()}`);
    }
  } catch (error) {
    console.warn('Failed to send notification:', error);
  }
};

export const notifyTaskUpdated = async (task, assignedUserId, updaterUserId, courseName) => {
  if (!assignedUserId || !updaterUserId || assignedUserId === updaterUserId) {
    return;
  }

  try {
    const { getUserProfile } = await import('./authService');
    const updaterResult = await getUserProfile(updaterUserId);
    const updaterName = updaterResult.success 
      ? (updaterResult.data?.displayName || updaterResult.data?.email || 'Someone')
      : 'Someone';

    const taskTitle = task.title || 'Task';
    const message = `${updaterName} updated "${taskTitle}" in ${courseName}`;
    showInAppNotification(message, 'info');
    
    if ('Notification' in window && Notification.permission === 'granted') {
      showBrowserNotification('Task Updated', message, `task-updated-${task.id || Date.now()}`);
    }
  } catch (error) {
    console.warn('Failed to send notification:', error);
  }
};

export const notifyTaskDeleted = async (taskTitle, courseName, deleterUserId) => {
  try {
    const { getUserProfile } = await import('./authService');
    const deleterResult = await getUserProfile(deleterUserId);
    const deleterName = deleterResult.success 
      ? (deleterResult.data?.displayName || deleterResult.data?.email || 'Someone')
      : 'Someone';

    const message = `${deleterName} deleted "${taskTitle}" from ${courseName}`;
    showInAppNotification(message, 'warning');
    
    if ('Notification' in window && Notification.permission === 'granted') {
      showBrowserNotification('Task Deleted', message, `task-deleted-${Date.now()}`);
    }
  } catch (error) {
    console.warn('Failed to send notification:', error);
  }
};

export const checkForNewTaskAssignments = async (previousTasks, currentTasks, currentUserId, courses = []) => {
  if (!currentUserId || typeof window === 'undefined') {
    return;
  }

  if (!previousTasks || previousTasks.length === 0) {
    return;
  }

  const hasNotificationPermission = 'Notification' in window && Notification.permission === 'granted';

  for (const currentTask of currentTasks) {
    if (!currentTask.assignedTo || currentTask.assignedTo !== currentUserId) {
      continue;
    }

    const previousTask = previousTasks.find(t => t.id === currentTask.id);
    
    if (!previousTask || previousTask.assignedTo !== currentUserId) {
      const taskTitle = currentTask.title || 'New Task';
      const course = courses.find(c => c.id === currentTask.courseId);
      const courseName = course?.name || 'a course';

      const message = `You've been assigned "${taskTitle}" in ${courseName}`;
      showInAppNotification(message, 'info');
      
      if (hasNotificationPermission) {
        showBrowserNotification('Task Assigned to You', message, `task-assigned-${currentTask.id}`);
      }
    }
  }
};

export const checkUpcomingDeadlines = (tasks, currentUserId) => {
  if (!currentUserId || typeof window === 'undefined') {
    return;
  }

  const hasNotificationPermission = 'Notification' in window && Notification.permission === 'granted';

  const now = new Date();
  const oneDayFromNow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);

  tasks.forEach(task => {
    if (!task.dueDate || task.status === 'completed' || task.assignedTo !== currentUserId) {
      return;
    }

    let dueDate;
    try {
      dueDate = task.dueDate.toDate ? task.dueDate.toDate() : new Date(task.dueDate);
    } catch (e) {
      return;
    }

    const timeUntilDue = dueDate.getTime() - now.getTime();
    const hoursUntilDue = timeUntilDue / (1000 * 60 * 60);

    if (hoursUntilDue > 0 && hoursUntilDue <= 24) {
      const taskTitle = task.title || 'Task';
      const hours = Math.floor(hoursUntilDue);
      const minutes = Math.floor((hoursUntilDue - hours) * 60);

      let message;
      if (hoursUntilDue <= 1) {
        message = `"${taskTitle}" is due in ${minutes} minute${minutes !== 1 ? 's' : ''}!`;
      } else if (hoursUntilDue <= 24) {
        message = `"${taskTitle}" is due in ${hours} hour${hours !== 1 ? 's' : ''}!`;
      } else {
        return;
      }

      const notificationTag = `deadline-${task.id}-${Math.floor(hoursUntilDue)}`;
      const lastNotified = localStorage.getItem(notificationTag);
      const lastNotifiedTime = lastNotified ? parseInt(lastNotified) : 0;
      const timeSinceLastNotification = now.getTime() - lastNotifiedTime;

      if (timeSinceLastNotification > 60 * 60 * 1000) {
        showInAppNotification(message, 'warning');
        
        if (hasNotificationPermission) {
          showBrowserNotification('Upcoming Deadline', message, notificationTag);
        }
        
        localStorage.setItem(notificationTag, now.getTime().toString());
      }
    }
  });
};
