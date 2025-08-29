import React, { useState, useEffect } from 'react';
import { Box, Typography } from '@mui/material';
import { Mic, VolumeUp, CheckCircle } from '@mui/icons-material';

type OverlayStatus = 'ready' | 'listening' | 'processing';

const OverlayView: React.FC = () => {
  const [status, setStatus] = useState<OverlayStatus>('ready');

  useEffect(() => {
    // Listen for status updates from main process
    window.electronAPI.onStatusUpdate((newStatus: string) => {
      setStatus(newStatus as OverlayStatus);
    });

    // Cleanup listeners on unmount
    return () => {
      window.electronAPI.removeAllListeners('status-update');
    };
  }, []);

  const getStatusConfig = () => {
    switch (status) {
      case 'listening':
        return {
          icon: <Mic sx={{ fontSize: 16 }} />,
          text: 'Listening...',
          className: 'listening',
          color: '#dc004e'
        };
      case 'processing':
        return {
          icon: <VolumeUp sx={{ fontSize: 16 }} />,
          text: 'Processing...',
          className: 'processing',
          color: '#1976d2'
        };
      default:
        return {
          icon: <CheckCircle sx={{ fontSize: 16 }} />,
          text: 'Ready',
          className: 'ready',
          color: '#4caf50'
        };
    }
  };

  const statusConfig = getStatusConfig();

  return (
    <div className="overlay-container">
      <div className={`overlay-status ${statusConfig.className}`}>
        <div className={`status-indicator ${status === 'listening' ? 'pulse' : ''}`} />
        {statusConfig.icon}
        <Typography variant="body2" component="span">
          {statusConfig.text}
        </Typography>
      </div>
    </div>
  );
};

export default OverlayView;