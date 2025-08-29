import os
import tempfile
import sounddevice as sd
import numpy as np
from faster_whisper import WhisperModel
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class AudioProcessor:
    def __init__(self, model_size="base", device="cpu"):
        """
        Initialize the audio processor with faster_whisper model
        
        Args:
            model_size (str): Whisper model size (tiny, base, small, medium, large)
            device (str): Device to run inference on (cpu, cuda)
        """
        self.model_size = model_size
        self.device = device
        self.model = None
        self.sample_rate = 16000  # Whisper expects 16kHz
        self.channels = 1  # Mono audio
        self.is_recording = False
        self.audio_data = []
        
        logger.info(f"Initializing AudioProcessor with model: {model_size}")
        self._load_model()
    
    def _load_model(self):
        """Load the faster_whisper model"""
        try:
            self.model = WhisperModel(self.model_size, device=self.device, compute_type="float32")
            logger.info(f"Model {self.model_size} loaded successfully")
        except Exception as e:
            logger.error(f"Failed to load model: {e}")
            raise
    
    def start_recording(self):
        """Start recording audio from the default microphone"""
        if self.is_recording:
            logger.warning("Already recording")
            return
            
        self.is_recording = True
        self.audio_data = []
        logger.info("Started recording")
        
        # Start recording in a separate thread
        def audio_callback(indata, frames, time, status):
            if status:
                logger.warning(f"Audio callback status: {status}")
            if self.is_recording:
                self.audio_data.append(indata.copy())
        
        try:
            self.stream = sd.InputStream(
                samplerate=self.sample_rate,
                channels=self.channels,
                callback=audio_callback,
                dtype=np.float32
            )
            self.stream.start()
        except Exception as e:
            logger.error(f"Failed to start recording: {e}")
            self.is_recording = False
            raise
    
    def stop_recording(self):
        """Stop recording and return the audio data"""
        if not self.is_recording:
            logger.warning("Not currently recording")
            return None
            
        self.is_recording = False
        
        try:
            self.stream.stop()
            self.stream.close()
        except Exception as e:
            logger.error(f"Error stopping recording: {e}")
        
        if not self.audio_data:
            logger.warning("No audio data recorded")
            return None
            
        # Concatenate all audio chunks
        audio_array = np.concatenate(self.audio_data, axis=0)
        audio_flat = audio_array.flatten()
        
        logger.info(f"Stopped recording. Audio length: {len(audio_flat)/self.sample_rate:.2f}s")
        return audio_flat
    
    def transcribe_audio(self, audio_data, language=None):
        """
        Transcribe audio data using faster_whisper
        
        Args:
            audio_data (numpy.ndarray): Audio data as float32 array
            language (str): Language code (optional, auto-detect if None)
            
        Returns:
            str: Transcribed text
        """
        if self.model is None:
            raise RuntimeError("Model not loaded")
            
        if audio_data is None or len(audio_data) == 0:
            return ""
        
        try:
            # Create temporary file for audio data
            with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as temp_file:
                temp_filename = temp_file.name
                
                # Write audio data to temporary file
                import wave
                with wave.open(temp_filename, 'wb') as wav_file:
                    wav_file.setnchannels(self.channels)
                    wav_file.setsampwidth(2)  # 16-bit
                    wav_file.setframerate(self.sample_rate)
                    # Convert float32 to int16
                    audio_int16 = (audio_data * 32767).astype(np.int16)
                    wav_file.writeframes(audio_int16.tobytes())
            
            # Transcribe using faster_whisper
            segments, info = self.model.transcribe(
                temp_filename,
                language=language,
                beam_size=5,
                word_timestamps=False
            )
            
            # Extract text from segments
            transcription = ""
            for segment in segments:
                transcription += segment.text
            
            # Clean up temporary file
            os.unlink(temp_filename)
            
            logger.info(f"Transcription completed: '{transcription.strip()}'")
            return transcription.strip()
            
        except Exception as e:
            logger.error(f"Transcription failed: {e}")
            # Clean up temporary file if it exists
            try:
                os.unlink(temp_filename)
            except:
                pass
            return ""
    
    def record_and_transcribe(self, language=None):
        """
        Convenience method to record audio and transcribe it
        This method blocks until recording is manually stopped
        
        Args:
            language (str): Language code (optional)
            
        Returns:
            str: Transcribed text
        """
        self.start_recording()
        
        # In a real implementation, this would be controlled by hotkey release
        # For now, this is just a placeholder
        import time
        time.sleep(3)  # Record for 3 seconds
        
        audio_data = self.stop_recording()
        if audio_data is not None:
            return self.transcribe_audio(audio_data, language)
        return ""
    
    def change_model(self, model_size):
        """Change the whisper model size"""
        if model_size != self.model_size:
            logger.info(f"Changing model from {self.model_size} to {model_size}")
            self.model_size = model_size
            self._load_model()
    
    def get_available_devices(self):
        """Get list of available audio input devices"""
        try:
            devices = sd.query_devices()
            input_devices = [d for d in devices if d['max_input_channels'] > 0]
            return input_devices
        except Exception as e:
            logger.error(f"Failed to query audio devices: {e}")
            return []