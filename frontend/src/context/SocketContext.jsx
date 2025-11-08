import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext();

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const { user, isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated && user) {
      // Initialize socket connection with better error handling
      const socketUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';
      const newSocket = io(socketUrl, {
        transports: ['websocket', 'polling'],
        timeout: 20000,
        retries: 3,
        retryDelay: 1000,
        forceNew: true,
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000
      });

      newSocket.on('connect', () => {
        console.log('🔌 Connected to server');
        setIsConnected(true);
        
        // Join user-specific rooms
        newSocket.emit('join', {
          email: user.email,
          role: user.role,
          department: user.department
        });
      });

      newSocket.on('connect_error', (error) => {
        console.log('🔌 Connection error:', error.message);
        setIsConnected(false);
      });

      newSocket.on('disconnect', (reason) => {
        console.log('🔌 Disconnected from server:', reason);
        setIsConnected(false);
      });

      newSocket.on('reconnect', (attemptNumber) => {
        console.log('🔌 Reconnected to server after', attemptNumber, 'attempts');
        setIsConnected(true);
      });

      newSocket.on('reconnect_error', (error) => {
        console.log('🔌 Reconnection failed:', error.message);
      });

      // Event listeners for real-time updates
      newSocket.on('new-event', (eventData) => {
        console.log('📅 New event created:', eventData);
        addNotification({
          id: Date.now(),
          type: 'event-created',
          title: 'New Event Available',
          message: `${eventData.title} has been scheduled for ${new Date(eventData.date).toLocaleDateString()}`,
          timestamp: new Date(),
          data: eventData
        });
      });

      newSocket.on('event-updated', (eventData) => {
        console.log('📅 Event updated:', eventData);
        addNotification({
          id: Date.now(),
          type: 'event-updated',
          title: 'Event Updated',
          message: `${eventData.title} has been updated`,
          timestamp: new Date(),
          data: eventData
        });
      });

      newSocket.on('event-deleted', (eventData) => {
        console.log('📅 Event deleted:', eventData);
        addNotification({
          id: Date.now(),
          type: 'event-deleted',
          title: 'Event Cancelled',
          message: `${eventData.title} has been cancelled`,
          timestamp: new Date(),
          data: eventData
        });
      });

      newSocket.on('new-registration', (registrationData) => {
        console.log('👤 New registration:', registrationData);
        if (user.role === 'admin' || user.role === 'trainer') {
          addNotification({
            id: Date.now(),
            type: 'registration-created',
            title: 'New Registration',
            message: `A student has registered for an event`,
            timestamp: new Date(),
            data: registrationData
          });
        }
      });

      setSocket(newSocket);

      return () => {
        newSocket.close();
      };
    }
  }, [isAuthenticated, user]);

  const addNotification = (notification) => {
    setNotifications(prev => [notification, ...prev].slice(0, 50)); // Keep only 50 recent notifications
  };

  const removeNotification = (notificationId) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  const emitEventCreated = (eventData) => {
    if (socket) {
      socket.emit('event-created', eventData);
    }
  };

  const emitEventUpdated = (eventData) => {
    if (socket) {
      socket.emit('event-updated', eventData);
    }
  };

  const emitEventDeleted = (eventData) => {
    if (socket) {
      socket.emit('event-deleted', eventData);
    }
  };

  const emitRegistrationCreated = (registrationData) => {
    if (socket) {
      socket.emit('registration-created', registrationData);
    }
  };

  const value = {
    socket,
    isConnected,
    notifications,
    addNotification,
    removeNotification,
    clearNotifications,
    emitEventCreated,
    emitEventUpdated,
    emitEventDeleted,
    emitRegistrationCreated
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};

export default SocketContext;