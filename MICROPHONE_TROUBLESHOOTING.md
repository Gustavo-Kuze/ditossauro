# OpenWispr - Microphone Troubleshooting Guide

This guide helps resolve microphone detection issues in OpenWispr.

## 🔍 Quick Diagnosis

### Step 1: Test Python Backend Directly
```bash
# Test the Python backend directly
python backend/main.py check_microphone

# Or use the test script
python test_backend.py
```

### Step 2: Check Console Output
When running the app, check the console/terminal for detailed logs:
- Tauri logs will show Python command execution
- Python logs will show audio backend initialization
- Microphone test results will be logged

## 🛠️ Common Issues and Solutions

### Issue 1: "No audio backend available"

**Cause:** Neither sounddevice nor pyaudio is installed.

**Solution:**
```bash
# Install audio dependencies
pip install sounddevice pyaudio

# On Windows, you might need:
pip install pyaudio-binary

# On Linux (Ubuntu/Debian):
sudo apt-get install portaudio19-dev python3-pyaudio
pip install sounddevice pyaudio

# On macOS:
brew install portaudio
pip install sounddevice pyaudio
```

### Issue 2: "Failed to initialize pyaudio"

**Cause:** PyAudio can't access audio system.

**Windows Solution:**
```bash
# Try installing the binary version
pip uninstall pyaudio
pip install pyaudio-binary

# Or install Microsoft C++ Build Tools and reinstall
pip install pyaudio
```

**Linux Solution:**
```bash
# Install system dependencies
sudo apt-get install portaudio19-dev libasound2-dev
pip install --upgrade pyaudio
```

**macOS Solution:**
```bash
# Install portaudio via Homebrew
brew install portaudio
pip install --upgrade pyaudio
```

### Issue 3: "Microphone test failed"

**Cause:** System microphone permissions or hardware issues.

**Solution:**

**Windows:**
1. Go to Settings → Privacy → Microphone
2. Enable "Allow apps to access your microphone"
3. Make sure your microphone is not muted
4. Check Device Manager for audio device issues

**macOS:**
1. Go to System Preferences → Security & Privacy → Privacy → Microphone
2. Grant permission to Terminal or your IDE
3. Test microphone in System Preferences → Sound → Input

**Linux:**
1. Check if user is in audio group: `groups $USER`
2. Add user to audio group: `sudo usermod -a -G audio $USER`
3. Test with: `arecord -l` (list recording devices)
4. Check PulseAudio: `pulseaudio --check`

### Issue 4: "Python backend error" or "Command not found"

**Cause:** Python not found or wrong Python version.

**Solution:**
```bash
# Check Python installation
python --version
python3 --version

# Make sure dependencies are installed
pip list | grep -E "(sounddevice|pyaudio|faster-whisper)"

# Reinstall dependencies if needed
pip install -r backend/requirements.txt
```

### Issue 5: Tauri Can't Find Python Backend

**Cause:** Working directory or path issues.

**Solution:** The updated Rust code now tries both `python` and `python3` commands and provides better error messages.

## 🧪 Testing Commands

### Test Backend Directly
```bash
# Basic test
python backend/main.py check_microphone

# Comprehensive test
python test_backend.py

# Windows batch test
test_backend.bat
```

### Test from NPM
```bash
# Test backend
npm run test:backend

# Windows-specific test
npm run test:backend:windows

# Full diagnosis
npm run diagnose
```

## 📋 Expected Output

### Successful Microphone Check
```json
{
  "success": true,
  "microphone_available": true
}
```

### Failed Microphone Check
```json
{
  "success": false,
  "error": "No audio backend available"
}
```

## 🔧 Advanced Debugging

### Enable Verbose Logging
The Python backend now includes detailed logging. Check the console output for:
- Audio backend initialization
- Device detection results
- Error tracebacks

### Manual Audio Test
```python
# Test sounddevice directly
import sounddevice as sd
import numpy as np

# Record 1 second
duration = 1  # seconds
sample_rate = 16000
audio = sd.rec(int(duration * sample_rate), samplerate=sample_rate, channels=1)
sd.wait()
print(f"Recorded {len(audio)} samples")
```

```python
# Test pyaudio directly
import pyaudio

p = pyaudio.PyAudio()
print(f"PyAudio version: {pyaudio.get_version_text()}")

# List devices
for i in range(p.get_device_count()):
    info = p.get_device_info_by_index(i)
    if info['maxInputChannels'] > 0:
        print(f"Input device {i}: {info['name']}")

p.terminate()
```

## 🆘 Still Not Working?

1. **Check the logs:** Look for specific error messages in the console
2. **Test manually:** Run `python backend/main.py check_microphone` directly
3. **Verify permissions:** Ensure microphone permissions are granted
4. **Try different backend:** If one audio library fails, try the other
5. **System reboot:** Sometimes required after installing audio drivers

## 📝 Reporting Issues

When reporting microphone issues, please include:

1. Operating system and version
2. Python version (`python --version`)
3. Output of `pip list | grep -E "(sounddevice|pyaudio|faster-whisper)"`
4. Output of `python test_backend.py`
5. Console logs from the Tauri app
6. Whether microphone works in other applications

## ✅ Verification Checklist

- [ ] Python backend runs successfully: `python backend/main.py check_microphone`
- [ ] Audio libraries installed: `pip list | grep -E "(sounddevice|pyaudio)"`
- [ ] Microphone permissions granted
- [ ] Microphone not muted/disabled
- [ ] Test script passes: `python test_backend.py`
- [ ] Tauri app shows microphone as available
