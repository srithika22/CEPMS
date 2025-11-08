import React from 'react';
import { useSocket } from '../../context/SocketContext';

const ConnectionStatus = () => {
  const { isConnected } = useSocket();

  return (
    <div className={`connection-status ${isConnected ? 'connected' : 'disconnected'}`}>
      <div className="status-indicator">
        <div className={`status-dot ${isConnected ? 'online' : 'offline'}`}></div>
        <span className="status-text">
          {isConnected ? 'Live' : 'Offline'}
        </span>
      </div>
    </div>
  );
};

export default ConnectionStatus;