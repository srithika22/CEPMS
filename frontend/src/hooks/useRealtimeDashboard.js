import { useEffect, useState } from 'react';
import { useSocket } from '../context/SocketContext';

export const useRealtimeDashboard = (initialData, fetchFunction) => {
  const [data, setData] = useState(initialData);
  const { socket } = useSocket();

  useEffect(() => {
    if (!socket) return;

    const handleNewEvent = (eventData) => {
      console.log('Real-time: New event received', eventData);
      // Refresh data when new event is created
      if (fetchFunction) {
        fetchFunction();
      }
    };

    const handleEventUpdated = (eventData) => {
      console.log('Real-time: Event updated', eventData);
      // Refresh data when event is updated
      if (fetchFunction) {
        fetchFunction();
      }
    };

    const handleEventDeleted = (eventData) => {
      console.log('Real-time: Event deleted', eventData);
      // Refresh data when event is deleted
      if (fetchFunction) {
        fetchFunction();
      }
    };

    const handleNewRegistration = (registrationData) => {
      console.log('Real-time: New registration received', registrationData);
      // Refresh data when new registration is made
      if (fetchFunction) {
        fetchFunction();
      }
    };

    // Listen for real-time events
    socket.on('new-event', handleNewEvent);
    socket.on('event-updated', handleEventUpdated);
    socket.on('event-deleted', handleEventDeleted);
    socket.on('new-registration', handleNewRegistration);

    // Cleanup
    return () => {
      socket.off('new-event', handleNewEvent);
      socket.off('event-updated', handleEventUpdated);
      socket.off('event-deleted', handleEventDeleted);
      socket.off('new-registration', handleNewRegistration);
    };
  }, [socket, fetchFunction]);

  return data;
};

export default useRealtimeDashboard;