#!/usr/bin/env python3
"""
OpenWispr Backend Server
Handles audio recording, transcription, and communication with Electron frontend
"""

import os
import sys
import json
import logging
import threading
import time
from flask import Flask, request, jsonify
from flask_cors import CORS
from utils.audio_processor import AudioProcessor
from pynput import keyboard
import subprocess
import platform

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class OpenWisprBackend:
    def __init__(self):
        self.app = Flask(__name__)
        CORS(self.app)
        
        # Initialize audio processor
        self.audio_processor = AudioProcessor(model_size="base")
        
        # Configuration
        self.config = {
            "hotkey": "ctrl+space",
            "model_size": "base",
            "language": None,  # Auto-detect
            "min_recording_time": 0.5,
            "auto_language_detection": True
        }
        
        # State management
        self.is_listening = False
        self.is_processing = False
        self.hotkey_listener = None
        
        # Load configuration
        self.load_config()
        
        # Setup routes
        self.setup_routes()
        
        # Setup hotkey listener
        self.setup_hotkey_listener()
    
    def load_config(self):
        """Load configuration from file"""
        config_path = os.path.join(os.path.dirname(__file__), "config.json")
        try:
            if os.path.exists(config_path):
                with open(config_path, 'r') as f:
                    saved_config = json.load(f)
                    self.config.update(saved_config)
                logger.info("Configuration loaded from file")
        except Exception as e:
            logger.warning(f"Failed to load config: {e}")
    
    def save_config(self):
        """Save configuration to file"""
        config_path = os.path.join(os.path.dirname(__file__), "config.json")
        try:
            with open(config_path, 'w') as f:
                json.dump(self.config, f, indent=2)
            logger.info("Configuration saved to file")
        except Exception as e:
            logger.error(f"Failed to save config: {e}")
    
    def setup_routes(self):
        """Setup Flask API routes"""
        
        @self.app.route('/health', methods=['GET'])
        def health_check():
            return jsonify({"status": "healthy", "model": self.config["model_size"]})
        
        @self.app.route('/config', methods=['GET'])
        def get_config():
            return jsonify(self.config)
        
        @self.app.route('/config', methods=['POST'])
        def update_config():
            try:
                new_config = request.json
                
                # Update model if changed
                if "model_size" in new_config and new_config["model_size"] != self.config["model_size"]:
                    self.audio_processor.change_model(new_config["model_size"])
                
                self.config.update(new_config)
                self.save_config()
                
                # Restart hotkey listener if hotkey changed
                if "hotkey" in new_config:
                    self.setup_hotkey_listener()
                
                return jsonify({"status": "success", "config": self.config})
            except Exception as e:
                logger.error(f"Failed to update config: {e}")
                return jsonify({"status": "error", "message": str(e)}), 400
        
        @self.app.route('/start-recording', methods=['POST'])
        def start_recording():
            try:
                if self.is_listening:
                    return jsonify({"status": "error", "message": "Already recording"}), 400
                
                self.is_listening = True
                self.audio_processor.start_recording()
                logger.info("Recording started via API")
                
                return jsonify({"status": "recording"})
            except Exception as e:
                logger.error(f"Failed to start recording: {e}")
                self.is_listening = False
                return jsonify({"status": "error", "message": str(e)}), 500
        
        @self.app.route('/stop-recording', methods=['POST'])
        def stop_recording():
            try:
                if not self.is_listening:
                    return jsonify({"status": "error", "message": "Not recording"}), 400
                
                self.is_listening = False
                self.is_processing = True
                
                # Stop recording and get audio data
                audio_data = self.audio_processor.stop_recording()
                
                if audio_data is not None:
                    # Transcribe in background thread
                    def transcribe_and_inject():
                        try:
                            language = self.config["language"] if not self.config["auto_language_detection"] else None
                            text = self.audio_processor.transcribe_audio(audio_data, language)
                            
                            if text:
                                self.inject_text(text)
                                logger.info(f"Text injected: '{text}'")
                            
                        except Exception as e:
                            logger.error(f"Transcription/injection failed: {e}")
                        finally:
                            self.is_processing = False
                    
                    threading.Thread(target=transcribe_and_inject, daemon=True).start()
                    return jsonify({"status": "processing"})
                else:
                    self.is_processing = False
                    return jsonify({"status": "error", "message": "No audio recorded"})
                
            except Exception as e:
                logger.error(f"Failed to stop recording: {e}")
                self.is_listening = False
                self.is_processing = False
                return jsonify({"status": "error", "message": str(e)}), 500
        
        @self.app.route('/status', methods=['GET'])
        def get_status():
            status = "ready"
            if self.is_listening:
                status = "listening"
            elif self.is_processing:
                status = "processing"
            
            return jsonify({
                "status": status,
                "is_listening": self.is_listening,
                "is_processing": self.is_processing
            })
        
        @self.app.route('/devices', methods=['GET'])
        def get_audio_devices():
            try:
                devices = self.audio_processor.get_available_devices()
                return jsonify({"devices": devices})
            except Exception as e:
                logger.error(f"Failed to get audio devices: {e}")
                return jsonify({"status": "error", "message": str(e)}), 500
    
    def inject_text(self, text):
        """Inject text into the currently focused application"""
        try:
            system = platform.system().lower()
            
            if system == "windows":
                self._inject_text_windows(text)
            elif system == "darwin":  # macOS
                self._inject_text_macos(text)
            elif system == "linux":
                self._inject_text_linux(text)
            else:
                logger.warning(f"Text injection not supported on {system}")
                
        except Exception as e:
            logger.error(f"Text injection failed: {e}")
    
    def _inject_text_windows(self, text):
        """Inject text on Windows using clipboard"""
        try:
            import pyperclip
            pyperclip.copy(text)
            
            # Use pynput to simulate Ctrl+V
            from pynput.keyboard import Key, Controller
            keyboard_controller = Controller()
            
            keyboard_controller.press(Key.ctrl)
            keyboard_controller.press('v')
            keyboard_controller.release('v')
            keyboard_controller.release(Key.ctrl)
            
        except ImportError:
            # Fallback to basic typing simulation
            logger.warning("pyperclip not available, using basic text injection")
            self._inject_text_basic(text)
    
    def _inject_text_macos(self, text):
        """Inject text on macOS using AppleScript"""
        try:
            import subprocess
            script = f'tell application "System Events" to keystroke "{text}"'
            subprocess.run(['osascript', '-e', script], check=True)
        except Exception as e:
            logger.error(f"macOS text injection failed: {e}")
            self._inject_text_basic(text)
    
    def _inject_text_linux(self, text):
        """Inject text on Linux using xdotool"""
        try:
            subprocess.run(['xdotool', 'type', text], check=True)
        except FileNotFoundError:
            logger.warning("xdotool not found, trying alternative methods")
            self._inject_text_basic(text)
        except Exception as e:
            logger.error(f"Linux text injection failed: {e}")
            self._inject_text_basic(text)
    
    def _inject_text_basic(self, text):
        """Basic text injection using pynput as fallback"""
        try:
            from pynput.keyboard import Controller
            keyboard_controller = Controller()
            keyboard_controller.type(text)
        except Exception as e:
            logger.error(f"Basic text injection failed: {e}")
    
    def setup_hotkey_listener(self):
        """Setup global hotkey listener"""
        try:
            # Stop existing listener
            if self.hotkey_listener:
                self.hotkey_listener.stop()
            
            # Parse hotkey string
            hotkey_combo = self.config["hotkey"].replace("+", "+")
            
            def on_hotkey_press():
                if not self.is_listening and not self.is_processing:
                    logger.info("Hotkey pressed - starting recording")
                    try:
                        self.is_listening = True
                        self.audio_processor.start_recording()
                    except Exception as e:
                        logger.error(f"Failed to start recording on hotkey: {e}")
                        self.is_listening = False
            
            def on_hotkey_release():
                if self.is_listening:
                    logger.info("Hotkey released - stopping recording")
                    try:
                        self.is_listening = False
                        self.is_processing = True
                        
                        # Stop recording and process
                        audio_data = self.audio_processor.stop_recording()
                        
                        if audio_data is not None:
                            def process_audio():
                                try:
                                    language = self.config["language"] if not self.config["auto_language_detection"] else None
                                    text = self.audio_processor.transcribe_audio(audio_data, language)
                                    
                                    if text:
                                        self.inject_text(text)
                                        logger.info(f"Hotkey transcription complete: '{text}'")
                                    
                                except Exception as e:
                                    logger.error(f"Hotkey transcription failed: {e}")
                                finally:
                                    self.is_processing = False
                            
                            threading.Thread(target=process_audio, daemon=True).start()
                        else:
                            self.is_processing = False
                            
                    except Exception as e:
                        logger.error(f"Failed to process hotkey release: {e}")
                        self.is_listening = False
                        self.is_processing = False
            
            # Create hotkey listener
            # Note: This is a simplified implementation
            # A full implementation would need more sophisticated hotkey parsing
            with keyboard.GlobalHotKeys({
                hotkey_combo: on_hotkey_press,
            }):
                logger.info(f"Hotkey listener setup for: {hotkey_combo}")
                
        except Exception as e:
            logger.error(f"Failed to setup hotkey listener: {e}")
    
    def run(self, host='127.0.0.1', port=5000, debug=False):
        """Run the Flask server"""
        logger.info(f"Starting OpenWispr backend server on {host}:{port}")
        self.app.run(host=host, port=port, debug=debug, threaded=True)

def main():
    """Main entry point"""
    backend = OpenWisprBackend()
    
    try:
        backend.run(debug=False)
    except KeyboardInterrupt:
        logger.info("Shutting down OpenWispr backend")
    except Exception as e:
        logger.error(f"Backend error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()