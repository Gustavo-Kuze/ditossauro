import React, { useState } from "react";
import "./SettingsPanel.css";

interface Settings {
  hotkey: string;
  modelSize: string;
  autoLanguageDetection: boolean;
  insertNewline: boolean;
}

interface SettingsPanelProps {
  settings: Settings;
  onSettingsChange: (settings: Partial<Settings>) => void;
  onClose: () => void;
}

const SettingsPanel: React.FC<SettingsPanelProps> = ({
  settings,
  onSettingsChange,
  onClose,
}) => {
  const [tempSettings, setTempSettings] = useState(settings);

  const modelSizes = [
    { value: "tiny", label: "Tiny (39 MB)" },
    { value: "base", label: "Base (74 MB)" },
    { value: "small", label: "Small (244 MB)" },
    { value: "medium", label: "Medium (769 MB)" },
    { value: "large", label: "Large (1550 MB)" },
  ];

  const commonHotkeys = [
    "CommandOrControl+Space",
    "CommandOrControl+Shift+Space",
    "Alt+Space",
    "CommandOrControl+Alt+V",
    "F12",
  ];

  const handleSave = () => {
    onSettingsChange(tempSettings);
    onClose();
  };

  const handleCancel = () => {
    setTempSettings(settings);
    onClose();
  };

  const updateTempSetting = <K extends keyof Settings>(
    key: K,
    value: Settings[K]
  ) => {
    setTempSettings(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="settings-overlay">
      <div className="settings-panel">
        <div className="settings-header">
          <h2>Settings</h2>
          <button onClick={handleCancel} className="close-button">×</button>
        </div>

        <div className="settings-content">
          <div className="setting-group">
            <label htmlFor="hotkey">Global Hotkey:</label>
            <select
              id="hotkey"
              value={tempSettings.hotkey}
              onChange={(e) => updateTempSetting("hotkey", e.target.value)}
            >
              {commonHotkeys.map((hotkey) => (
                <option key={hotkey} value={hotkey}>
                  {hotkey}
                </option>
              ))}
            </select>
            <small>Press and hold this key combination to record</small>
          </div>

          <div className="setting-group">
            <label htmlFor="modelSize">Whisper Model:</label>
            <select
              id="modelSize"
              value={tempSettings.modelSize}
              onChange={(e) => updateTempSetting("modelSize", e.target.value)}
            >
              {modelSizes.map((model) => (
                <option key={model.value} value={model.value}>
                  {model.label}
                </option>
              ))}
            </select>
            <small>Larger models are more accurate but slower</small>
          </div>

          <div className="setting-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={tempSettings.autoLanguageDetection}
                onChange={(e) =>
                  updateTempSetting("autoLanguageDetection", e.target.checked)
                }
              />
              Auto-detect language
            </label>
            <small>Automatically detect the spoken language</small>
          </div>

          <div className="setting-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={tempSettings.insertNewline}
                onChange={(e) =>
                  updateTempSetting("insertNewline", e.target.checked)
                }
              />
              Insert newline after text
            </label>
            <small>Add a line break after the transcribed text</small>
          </div>
        </div>

        <div className="settings-footer">
          <button onClick={handleCancel} className="cancel-button">
            Cancel
          </button>
          <button onClick={handleSave} className="save-button">
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsPanel;