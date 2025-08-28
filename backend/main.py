#!/usr/bin/env python3
"""
OpenWispr Backend - Voice to Text Transcription Service
Main entry point for the Python backend that handles audio recording and transcription.
"""

import sys
import json
import logging
from typing import Optional, Dict, Any
from utils.audio_processor import AudioProcessor

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class OpenWisprBackend:
    """Main backend service for OpenWispr application."""
    
    def __init__(self):
        self.audio_processor = AudioProcessor()
        self.is_recording = False
        
    def start_recording(self) -> Dict[str, Any]:
        """Start audio recording."""
        try:
            if self.is_recording:
                return {"success": False, "error": "Already recording"}
            
            success = self.audio_processor.start_recording()
            if success:
                self.is_recording = True
                return {"success": True, "message": "Recording started"}
            else:
                return {"success": False, "error": "Failed to start recording"}
        except Exception as e:
            logger.error(f"Error starting recording: {e}")
            return {"success": False, "error": str(e)}
    
    def stop_recording_and_transcribe(self, model_size: str = "base") -> Dict[str, Any]:
        """Stop recording and transcribe the audio."""
        try:
            if not self.is_recording:
                return {"success": False, "error": "Not currently recording"}
            
            # Stop recording and get audio data
            audio_data = self.audio_processor.stop_recording()
            self.is_recording = False
            
            if audio_data is None:
                return {"success": False, "error": "No audio data captured"}
            
            # Transcribe the audio
            transcription = self.audio_processor.transcribe_audio(audio_data, model_size)
            
            if transcription:
                return {
                    "success": True, 
                    "transcription": transcription,
                    "message": "Transcription completed"
                }
            else:
                return {"success": False, "error": "Transcription failed"}
                
        except Exception as e:
            logger.error(f"Error in transcription: {e}")
            self.is_recording = False
            return {"success": False, "error": str(e)}
    
    def get_available_models(self) -> Dict[str, Any]:
        """Get list of available Whisper models."""
        return {
            "success": True,
            "models": ["tiny", "base", "small", "medium", "large"]
        }
    
    def check_microphone(self) -> Dict[str, Any]:
        """Check if microphone is available and working."""
        try:
            available = self.audio_processor.check_microphone()
            return {"success": True, "microphone_available": available}
        except Exception as e:
            logger.error(f"Error checking microphone: {e}")
            return {"success": False, "error": str(e)}


def handle_command(command: str, params: Dict[str, Any] = None) -> Dict[str, Any]:
    """Handle incoming commands from the frontend."""
    backend = OpenWisprBackend()
    
    if command == "start_recording":
        return backend.start_recording()
    
    elif command == "stop_and_transcribe":
        model_size = params.get("model_size", "base") if params else "base"
        return backend.stop_recording_and_transcribe(model_size)
    
    elif command == "get_models":
        return backend.get_available_models()
    
    elif command == "check_microphone":
        return backend.check_microphone()
    
    else:
        return {"success": False, "error": f"Unknown command: {command}"}


def main():
    """Main entry point - handles JSON-based communication with frontend."""
    try:
        # Read command from stdin (for Tauri communication)
        if len(sys.argv) > 1:
            # Command line arguments mode
            command = sys.argv[1]
            params = json.loads(sys.argv[2]) if len(sys.argv) > 2 else {}
        else:
            # Stdin mode (for Tauri IPC)
            input_data = sys.stdin.read().strip()
            if input_data:
                data = json.loads(input_data)
                command = data.get("command")
                params = data.get("params", {})
            else:
                command = "check_microphone"  # Default command
                params = {}
        
        result = handle_command(command, params)
        print(json.dumps(result))
        
    except json.JSONDecodeError as e:
        error_result = {"success": False, "error": f"Invalid JSON: {e}"}
        print(json.dumps(error_result))
    except Exception as e:
        error_result = {"success": False, "error": f"Backend error: {e}"}
        print(json.dumps(error_result))
        logger.error(f"Unexpected error: {e}")


if __name__ == "__main__":
    main()