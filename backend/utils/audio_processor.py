"""
Audio processing utilities for OpenWispr.
Handles audio recording, processing, and transcription using faster_whisper.
"""

import io
import wave
import threading
import logging
from typing import Optional, List
import numpy as np

try:
    import sounddevice as sd
    SOUNDDEVICE_AVAILABLE = True
except ImportError:
    SOUNDDEVICE_AVAILABLE = False
    
try:
    import pyaudio
    PYAUDIO_AVAILABLE = True
except ImportError:
    PYAUDIO_AVAILABLE = False

try:
    from faster_whisper import WhisperModel
    FASTER_WHISPER_AVAILABLE = True
except ImportError:
    FASTER_WHISPER_AVAILABLE = False

logger = logging.getLogger(__name__)


class AudioProcessor:
    """Handles audio recording and transcription."""
    
    def __init__(self):
        self.sample_rate = 16000  # Whisper expects 16kHz
        self.channels = 1  # Mono
        self.chunk_size = 1024
        self.audio_data = []
        self.is_recording = False
        self.recording_thread = None
        self.whisper_model = None
        self.current_model_size = None
        
        # Log available packages for debugging
        logger.info(f"sounddevice available: {SOUNDDEVICE_AVAILABLE}")
        logger.info(f"pyaudio available: {PYAUDIO_AVAILABLE}")
        logger.info(f"faster_whisper available: {FASTER_WHISPER_AVAILABLE}")
        
        # Choose audio backend
        if SOUNDDEVICE_AVAILABLE:
            self.audio_backend = "sounddevice"
            logger.info("Using sounddevice for audio recording")
        elif PYAUDIO_AVAILABLE:
            try:
                self.pyaudio_instance = pyaudio.PyAudio()
                self.audio_backend = "pyaudio"
                logger.info("Using pyaudio for audio recording")
            except Exception as e:
                logger.error(f"Failed to initialize pyaudio: {e}")
                self.audio_backend = None
        else:
            logger.error("No audio backend available. Please install sounddevice or pyaudio.")
            self.audio_backend = None
    
    def check_microphone(self) -> bool:
        """Check if microphone is available."""
        logger.info("Starting microphone check...")
        
        if self.audio_backend is None:
            logger.error("No audio backend available")
            return False
            
        try:
            if self.audio_backend == "sounddevice":
                logger.info("Testing microphone with sounddevice...")
                # Test recording a short sample
                test_duration = 0.1  # 100ms
                test_data = sd.rec(
                    int(test_duration * self.sample_rate),
                    samplerate=self.sample_rate,
                    channels=self.channels,
                    dtype=np.float32
                )
                sd.wait()
                result = len(test_data) > 0
                logger.info(f"Sounddevice microphone test result: {result}")
                return result
            
            elif self.audio_backend == "pyaudio":
                logger.info("Testing microphone with pyaudio...")
                # Check for available input devices
                info = self.pyaudio_instance.get_host_api_info_by_index(0)
                device_count = info.get('deviceCount', 0)
                logger.info(f"PyAudio found {device_count} devices")
                
                # Try to find an input device
                input_devices = 0
                for i in range(device_count):
                    try:
                        device_info = self.pyaudio_instance.get_device_info_by_index(i)
                        if device_info.get('maxInputChannels', 0) > 0:
                            input_devices += 1
                            logger.info(f"Found input device: {device_info.get('name', 'Unknown')}")
                    except Exception as e:
                        logger.warning(f"Error checking device {i}: {e}")
                
                result = input_devices > 0
                logger.info(f"PyAudio microphone test result: {result} ({input_devices} input devices)")
                return result
            
            logger.error(f"Unknown audio backend: {self.audio_backend}")
            return False
            
        except Exception as e:
            logger.error(f"Error checking microphone: {e}")
            import traceback
            logger.error(f"Full traceback: {traceback.format_exc()}")
            return False
    
    def start_recording(self) -> bool:
        """Start audio recording in a separate thread."""
        if self.is_recording:
            logger.warning("Already recording")
            return False
        
        if not self.audio_backend:
            logger.error("No audio backend available")
            return False
        
        self.audio_data = []
        self.is_recording = True
        
        if self.audio_backend == "sounddevice":
            self.recording_thread = threading.Thread(target=self._record_sounddevice)
        elif self.audio_backend == "pyaudio":
            self.recording_thread = threading.Thread(target=self._record_pyaudio)
        
        self.recording_thread.start()
        logger.info("Started audio recording")
        return True
    
    def stop_recording(self) -> Optional[np.ndarray]:
        """Stop recording and return the audio data."""
        if not self.is_recording:
            logger.warning("Not currently recording")
            return None
        
        self.is_recording = False
        
        if self.recording_thread:
            self.recording_thread.join(timeout=2.0)
        
        if self.audio_data:
            # Convert list of chunks to numpy array
            audio_array = np.concatenate(self.audio_data)
            logger.info(f"Stopped recording. Captured {len(audio_array)} samples")
            return audio_array
        
        logger.warning("No audio data captured")
        return None
    
    def _record_sounddevice(self):
        """Record audio using sounddevice."""
        try:
            while self.is_recording:
                # Record in small chunks
                chunk = sd.rec(
                    self.chunk_size,
                    samplerate=self.sample_rate,
                    channels=self.channels,
                    dtype=np.float32
                )
                sd.wait()
                
                if self.is_recording:  # Check again in case stopped during recording
                    self.audio_data.append(chunk.flatten())
                    
        except Exception as e:
            logger.error(f"Error in sounddevice recording: {e}")
            self.is_recording = False
    
    def _record_pyaudio(self):
        """Record audio using pyaudio."""
        try:
            stream = self.pyaudio_instance.open(
                format=pyaudio.paFloat32,
                channels=self.channels,
                rate=self.sample_rate,
                input=True,
                frames_per_buffer=self.chunk_size
            )
            
            while self.is_recording:
                data = stream.read(self.chunk_size, exception_on_overflow=False)
                if self.is_recording:
                    # Convert bytes to numpy array
                    audio_chunk = np.frombuffer(data, dtype=np.float32)
                    self.audio_data.append(audio_chunk)
            
            stream.stop_stream()
            stream.close()
            
        except Exception as e:
            logger.error(f"Error in pyaudio recording: {e}")
            self.is_recording = False
    
    def _load_whisper_model(self, model_size: str = "base") -> bool:
        """Load the Whisper model if not already loaded."""
        if not FASTER_WHISPER_AVAILABLE:
            logger.error("faster_whisper not available")
            return False
        
        if self.whisper_model is None or self.current_model_size != model_size:
            try:
                logger.info(f"Loading Whisper model: {model_size}")
                self.whisper_model = WhisperModel(
                    model_size, 
                    device="cpu",  # Use CPU for better compatibility
                    compute_type="int8"  # Use int8 for better performance
                )
                self.current_model_size = model_size
                logger.info(f"Successfully loaded Whisper model: {model_size}")
                return True
            except Exception as e:
                logger.error(f"Error loading Whisper model: {e}")
                return False
        
        return True
    
    def transcribe_audio(self, audio_data: np.ndarray, model_size: str = "base") -> Optional[str]:
        """Transcribe audio data using faster_whisper."""
        if not FASTER_WHISPER_AVAILABLE:
            logger.error("faster_whisper not available")
            return None
        
        if audio_data is None or len(audio_data) == 0:
            logger.warning("No audio data to transcribe")
            return None
        
        # Load model if needed
        if not self._load_whisper_model(model_size):
            return None
        
        try:
            # Ensure audio is in the right format (float32, normalized)
            if audio_data.dtype != np.float32:
                audio_data = audio_data.astype(np.float32)
            
            # Normalize audio if needed
            if np.max(np.abs(audio_data)) > 1.0:
                audio_data = audio_data / np.max(np.abs(audio_data))
            
            logger.info("Starting transcription...")
            
            # Transcribe
            segments, info = self.whisper_model.transcribe(
                audio_data,
                beam_size=5,
                language=None,  # Auto-detect language
                condition_on_previous_text=False
            )
            
            # Combine all segments into a single text
            transcription = ""
            for segment in segments:
                transcription += segment.text
            
            transcription = transcription.strip()
            
            if transcription:
                logger.info(f"Transcription completed: '{transcription}' (language: {info.language})")
                return transcription
            else:
                logger.warning("Transcription returned empty result")
                return None
                
        except Exception as e:
            logger.error(f"Error during transcription: {e}")
            return None
    
    def __del__(self):
        """Cleanup resources."""
        if self.is_recording:
            self.stop_recording()
        
        if hasattr(self, 'pyaudio_instance') and self.pyaudio_instance:
            self.pyaudio_instance.terminate()