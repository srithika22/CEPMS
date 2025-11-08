import React, { useState, useEffect } from 'react';
import { useSocket } from '../../context/SocketContext';

const NotificationCenter = () => {
  const { notifications, removeNotification, clearNotifications } = useSocket();
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    setUnreadCount(notifications.length);
  }, [notifications]);

  const handleNotificationClick = (notification) => {
    removeNotification(notification.id);
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'event-created':
        return '📅';
      case 'event-updated':
        return '✏️';
      case 'event-deleted':
        return '❌';
      case 'registration-created':
        return '👤';
      default:
        return '🔔';
    }
  };

  const getNotificationColor = (type) => {
    switch (type) {
      case 'event-created':
        return 'success';
      case 'event-updated':
        return 'warning';
      case 'event-deleted':
        return 'error';
      case 'registration-created':
        return 'info';
      default:
        return 'default';
    }
  };

  return (
    <div className="notification-center">
      <button 
        className={`notification-button ${unreadCount > 0 ? 'has-notifications' : ''}`}
        onClick={() => setShowNotifications(!showNotifications)}
      >
        🔔
        {unreadCount > 0 && (
          <span className="notification-badge">{unreadCount}</span>
        )}
      </button>

      {showNotifications && (
        <div className="notification-dropdown">
          <div className="notification-header">
            <h3>Notifications</h3>
            {notifications.length > 0 && (
              <button 
                className="clear-all-button"
                onClick={clearNotifications}
              >
                Clear All
              </button>
            )}
          </div>

          <div className="notification-list">
            {notifications.length === 0 ? (
              <div className="no-notifications">
                <p>No new notifications</p>
              </div>
            ) : (
              notifications.map(notification => (
                <div 
                  key={notification.id}
                  className={`notification-item ${getNotificationColor(notification.type)}`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="notification-icon">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="notification-content">
                    <h4>{notification.title}</h4>
                    <p>{notification.message}</p>
                    <span className="notification-time">
                      {notification.timestamp.toLocaleTimeString()}
                    </span>
                  </div>
                  <button 
                    className="notification-close"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeNotification(notification.id);
                    }}
                  >
                    ×
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationCenter;