import React from "react";
import "./StatusOverlay.css";

interface StatusOverlayProps {
  isRecording: boolean;
  isProcessing: boolean;
}

const StatusOverlay: React.FC<StatusOverlayProps> = ({ isRecording, isProcessing }) => {
  if (!isRecording && !isProcessing) {
    return null;
  }

  return (
    <div className="status-overlay">
      <div className="status-content">
        {isRecording && (
          <div className="status-recording">
            <div className="recording-indicator"></div>
            <span>🎤 Recording...</span>
          </div>
        )}
        {isProcessing && (
          <div className="status-processing">
            <div className="processing-spinner"></div>
            <span>⚡ Processing...</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default StatusOverlay;