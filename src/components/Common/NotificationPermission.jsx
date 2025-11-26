import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { requestNotificationPermission, saveFCMToken, setupMessageListener, getFCMToken } from '../../api/notificationService';
import './NotificationPermission.css';

const NotificationPermission = () => {
  const { currentUser } = useAuth();
  const [permission, setPermission] = useState('default');
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(false);

  const checkNotificationStatus = useCallback(async () => {
    if (!currentUser) {
      setEnabled(false);
      return;
    }

    if ('Notification' in window) {
      const currentPermission = Notification.permission;
      setPermission(currentPermission);

      if (currentPermission === 'granted') {
        try {
          const result = await getFCMToken(currentUser.uid);
          if (result.success && result.token) {
            setEnabled(true);
          } else {
            setEnabled(false);
          }
        } catch (error) {
          console.warn('Error checking notification status:', error);
          setEnabled(false);
        }
      } else {
        setEnabled(false);
      }
    } else {
      setEnabled(false);
    }
  }, [currentUser]);

  useEffect(() => {
    checkNotificationStatus();

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkNotificationStatus();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', checkNotificationStatus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', checkNotificationStatus);
    };
  }, [currentUser, checkNotificationStatus]);

  useEffect(() => {
    if (permission === 'granted' && currentUser && enabled) {
      const unsubscribe = setupMessageListener((payload) => {
        if (Notification.permission === 'granted') {
          new Notification(payload.notification?.title || 'New Notification', {
            body: payload.notification?.body,
            icon: '/icon-192x192.png'
          });
        }
      });

      return () => {
        if (unsubscribe) unsubscribe();
      };
    }
  }, [permission, currentUser, enabled]);

  const handleToggle = async () => {
    if (permission === 'denied') {
      const message = `Notifications are blocked in your browser.\n\nTo enable:\n\n` +
        `Chrome/Edge:\n` +
        `1. Click the lock icon in the address bar\n` +
        `2. Find "Notifications" and change to "Allow"\n\n` +
        `Firefox:\n` +
        `1. Click the shield icon in the address bar\n` +
        `2. Click "Permissions" → "Notifications" → "Allow"\n\n` +
        `Safari:\n` +
        `1. Safari → Settings → Websites → Notifications\n` +
        `2. Find this site and set to "Allow"`;
      alert(message);
      return;
    }

    if (loading) return;

    setLoading(true);
    const newEnabledState = !enabled;
    setEnabled(newEnabledState);

    if (newEnabledState) {
      const result = await requestNotificationPermission();
      if (result.success && result.token && currentUser) {
        try {
          await saveFCMToken(currentUser.uid, result.token);
          setPermission('granted');
          setEnabled(true);
        } catch (error) {
          console.error('Error saving FCM token:', error);
          setEnabled(false);
        }
      } else {
        setEnabled(false);
        const errorMsg = result.error || 'Unknown error';
        if (errorMsg.includes('VAPID') || errorMsg.includes('applicationServerKey')) {
          alert('VAPID key not configured!\n\n' +
            'To enable push notifications:\n' +
            '1. Go to Firebase Console → Project Settings → Cloud Messaging\n' +
            '2. Generate Web Push certificate (VAPID key)\n' +
            '3. Copy the key and add it to .env file as VITE_VAPID_KEY\n' +
            '4. Restart your dev server');
        } else {
          alert('Failed to enable notifications: ' + errorMsg);
        }
      }
    } else {
      if (currentUser) {
        try {
          await saveFCMToken(currentUser.uid, null);
          setEnabled(false);
        } catch (error) {
          console.error('Error disabling notifications:', error);
        }
      }
    }

    setLoading(false);
    setTimeout(() => {
      checkNotificationStatus();
    }, 500);
  };

  const showBlockedInstructions = () => {
    const message = `Notifications are blocked in your browser.\n\nTo enable:\n\n` +
      `Chrome/Edge:\n` +
      `1. Click the lock icon in the address bar\n` +
      `2. Find "Notifications" and change to "Allow"\n\n` +
      `Firefox:\n` +
      `1. Click the shield icon in the address bar\n` +
      `2. Click "Permissions" → "Notifications" → "Allow"\n\n` +
      `Safari:\n` +
      `1. Safari → Settings → Websites → Notifications\n` +
      `2. Find this site and set to "Allow"`;
    alert(message);
  };

  if (permission === 'denied') {
    return (
      <div className="notification-toggle-container">
        <span className="notification-label">Notifications</span>
        <div className="notification-blocked-info">
          <button 
            className="notification-toggle disabled" 
            disabled
            title="Notifications blocked. Click warning icon for instructions."
          >
            <span className="toggle-slider"></span>
          </button>
          <button 
            className="blocked-tooltip" 
            onClick={showBlockedInstructions}
            title="Click to see how to enable notifications"
          >
            ⚠️
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="notification-toggle-container">
      <span className="notification-label">Notifications</span>
      <button
        className={`notification-toggle ${enabled ? 'on' : 'off'}`}
        onClick={handleToggle}
        disabled={loading}
        title={enabled ? 'Click to disable notifications' : 'Click to enable notifications'}
      >
        <span className="toggle-slider"></span>
      </button>
    </div>
  );
};

export default NotificationPermission;

