import React, { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/tauri";
import { listen } from "@tauri-apps/api/event";
import { register, unregister } from "@tauri-apps/api/globalShortcut";
import StatusOverlay from "./components/StatusOverlay";
import SettingsPanel from "./components/SettingsPanel";
import "./App.css";

interface AppState {
  isRecording: boolean;
  isProcessing: boolean;
  lastTranscription: string;
  error: string | null;
  showSettings: boolean;
}

interface Settings {
  hotkey: string;
  modelSize: string;
  autoLanguageDetection: boolean;
  insertNewline: boolean;
}

function App() {
  const [state, setState] = useState<AppState>({
    isRecording: false,
    isProcessing: false,
    lastTranscription: "",
    error: null,
    showSettings: false,
  });

  const [settings, setSettings] = useState<Settings>({
    hotkey: "CommandOrControl+Space",
    modelSize: "base",
    autoLanguageDetection: true,
    insertNewline: false,
  });

  const [microphoneStatus, setMicrophoneStatus] = useState<boolean | null>(null);

  // Check microphone status on startup
  useEffect(() => {
    checkMicrophone();
    setupGlobalShortcut();
    
    return () => {
      cleanup();
    };
  }, []);

  // Update global shortcut when hotkey changes
  useEffect(() => {
    setupGlobalShortcut();
  }, [settings.hotkey]);

  const checkMicrophone = async () => {
    try {
      const result = await invoke("check_microphone");
      setMicrophoneStatus(result as boolean);
    } catch (error) {
      console.error("Failed to check microphone:", error);
      setMicrophoneStatus(false);
      setState(prev => ({ ...prev, error: "Failed to check microphone" }));
    }
  };

  const setupGlobalShortcut = async () => {
    try {
      // Unregister existing shortcut
      await unregister(settings.hotkey).catch(() => {
        // Ignore errors if shortcut wasn't registered
      });

      // Register new shortcut
      await register(settings.hotkey, async () => {
        if (state.isRecording) {
          await stopRecordingAndTranscribe();
        } else {
          await startRecording();
        }
      });
    } catch (error) {
      console.error("Failed to setup global shortcut:", error);
      setState(prev => ({ ...prev, error: "Failed to setup global shortcut" }));
    }
  };

  const cleanup = async () => {
    try {
      await unregister(settings.hotkey);
    } catch (error) {
      console.error("Failed to cleanup shortcuts:", error);
    }
  };

  const startRecording = async () => {
    try {
      setState(prev => ({ ...prev, isRecording: true, error: null }));
      const result = await invoke("start_recording");
      console.log("Recording started:", result);
    } catch (error) {
      console.error("Failed to start recording:", error);
      setState(prev => ({ 
        ...prev, 
        isRecording: false, 
        error: "Failed to start recording" 
      }));
    }
  };

  const stopRecordingAndTranscribe = async () => {
    try {
      setState(prev => ({ ...prev, isRecording: false, isProcessing: true }));
      
      const result = await invoke("stop_and_transcribe", {
        modelSize: settings.modelSize,
      }) as { success: boolean; transcription?: string; error?: string };

      if (result.success && result.transcription) {
        setState(prev => ({ 
          ...prev, 
          isProcessing: false,
          lastTranscription: result.transcription!,
          error: null
        }));

        // Type the transcription
        await invoke("type_text", {
          text: result.transcription + (settings.insertNewline ? "\n" : ""),
        });
      } else {
        setState(prev => ({ 
          ...prev, 
          isProcessing: false,
          error: result.error || "Transcription failed"
        }));
      }
    } catch (error) {
      console.error("Failed to transcribe:", error);
      setState(prev => ({ 
        ...prev, 
        isRecording: false, 
        isProcessing: false,
        error: "Failed to transcribe audio"
      }));
    }
  };

  const toggleSettings = () => {
    setState(prev => ({ ...prev, showSettings: !prev.showSettings }));
  };

  const updateSettings = (newSettings: Partial<Settings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  };

  const clearError = () => {
    setState(prev => ({ ...prev, error: null }));
  };

  return (
    <div className="app">
      <div className="app-header">
        <h1>OpenWispr</h1>
        <p>Voice to Text Transcription</p>
        <button onClick={toggleSettings} className="settings-button">
          ⚙️ Settings
        </button>
      </div>

      <div className="app-content">
        <div className="status-section">
          <div className="microphone-status">
            <span>Microphone: </span>
            {microphoneStatus === null ? (
              <span className="status-checking">Checking...</span>
            ) : microphoneStatus ? (
              <span className="status-ok">✅ Available</span>
            ) : (
              <span className="status-error">❌ Not Available</span>
            )}
          </div>

          <div className="hotkey-info">
            <span>Hotkey: <strong>{settings.hotkey}</strong></span>
          </div>

          <div className="model-info">
            <span>Model: <strong>{settings.modelSize}</strong></span>
          </div>
        </div>

        <div className="transcription-section">
          <h3>Last Transcription:</h3>
          <div className="transcription-output">
            {state.lastTranscription || "No transcription yet..."}
          </div>
        </div>

        {state.error && (
          <div className="error-section">
            <div className="error-message">
              ❌ {state.error}
              <button onClick={clearError} className="clear-error">×</button>
            </div>
          </div>
        )}

        <div className="instructions">
          <h3>How to use:</h3>
          <ol>
            <li>Press and hold <strong>{settings.hotkey}</strong> to start recording</li>
            <li>Speak your message</li>
            <li>Release the key to stop recording and transcribe</li>
            <li>The text will be typed at your cursor position</li>
          </ol>
        </div>
      </div>

      <StatusOverlay 
        isRecording={state.isRecording}
        isProcessing={state.isProcessing}
      />

      {state.showSettings && (
        <SettingsPanel
          settings={settings}
          onSettingsChange={updateSettings}
          onClose={toggleSettings}
        />
      )}
    </div>
  );
}

export default App;