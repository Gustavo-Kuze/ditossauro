import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  TextField,
  Box,
  Chip,
  Alert,
  Divider,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  Mic,
  MicOff,
  Settings,
  Info,
  Refresh,
  VolumeUp,
  Keyboard,
  Language,
  Visibility,
  GitHub
} from '@mui/icons-material';

interface Config {
  hotkey: string;
  modelSize: string;
  language: string | null;
  autoLanguageDetection: boolean;
  overlayEnabled: boolean;
  overlayPosition: string;
}

interface Status {
  status: string;
  is_listening: boolean;
  is_processing: boolean;
}

const MainView: React.FC = () => {
  const [config, setConfig] = useState<Config>({
    hotkey: 'CommandOrControl+Space',
    modelSize: 'base',
    language: null,
    autoLanguageDetection: true,
    overlayEnabled: true,
    overlayPosition: 'top-right'
  });
  
  const [status, setStatus] = useState<Status>({
    status: 'ready',
    is_listening: false,
    is_processing: false
  });
  
  const [backendHealth, setBackendHealth] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    loadConfig();
    checkBackendHealth();
    
    // Set up status polling
    const statusInterval = setInterval(checkStatus, 1000);
    
    return () => clearInterval(statusInterval);
  }, []);

  const loadConfig = async () => {
    try {
      const loadedConfig = await window.electronAPI.getConfig();
      setConfig(loadedConfig);
    } catch (err) {
      setError('Failed to load configuration');
      console.error('Config load error:', err);
    } finally {
      setLoading(false);
    }
  };

  const saveConfig = async (newConfig: Partial<Config>) => {
    try {
      setError('');
      const updatedConfig = await window.electronAPI.updateConfig(newConfig);
      setConfig(updatedConfig);
    } catch (err) {
      setError('Failed to save configuration');
      console.error('Config save error:', err);
    }
  };

  const checkBackendHealth = async () => {
    try {
      const response = await window.electronAPI.backendRequest('GET', '/health');
      setBackendHealth(true);
    } catch (err) {
      setBackendHealth(false);
      console.error('Backend health check failed:', err);
    }
  };

  const checkStatus = async () => {
    try {
      const response = await window.electronAPI.backendRequest('GET', '/status');
      setStatus(response);
    } catch (err) {
      // Silently fail for status checks to avoid spam
    }
  };

  const testRecording = async () => {
    try {
      setError('');
      await window.electronAPI.backendRequest('POST', '/start-recording');
      
      // Stop after 3 seconds for testing
      setTimeout(async () => {
        try {
          await window.electronAPI.backendRequest('POST', '/stop-recording');
        } catch (err) {
          console.error('Test recording stop failed:', err);
        }
      }, 3000);
      
    } catch (err) {
      setError('Failed to test recording');
      console.error('Test recording failed:', err);
    }
  };

  const getStatusColor = () => {
    switch (status.status) {
      case 'listening': return 'error';
      case 'processing': return 'primary';
      default: return 'success';
    }
  };

  const getStatusIcon = () => {
    switch (status.status) {
      case 'listening': return <Mic />;
      case 'processing': return <VolumeUp />;
      default: return <MicOff />;
    }
  };

  const getStatusText = () => {
    switch (status.status) {
      case 'listening': return 'Listening...';
      case 'processing': return 'Processing...';
      default: return 'Ready';
    }
  };

  if (loading) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Typography variant="h6" align="center">Loading...</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4, textAlign: 'center' }}>
        <Typography variant="h3" component="h1" gutterBottom>
          OpenWispr
        </Typography>
        <Typography variant="h6" color="text.secondary" gutterBottom>
          Voice to Text with AI Transcription
        </Typography>
        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, mt: 2 }}>
          <Chip 
            label={backendHealth ? 'Backend Connected' : 'Backend Disconnected'}
            color={backendHealth ? 'success' : 'error'}
            variant="outlined"
          />
          <Chip 
            label={`Status: ${getStatusText()}`}
            color={getStatusColor()}
            icon={getStatusIcon()}
          />
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Quick Actions */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <Mic sx={{ mr: 1, verticalAlign: 'middle' }} />
                Quick Actions
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <Button
                  variant="contained"
                  onClick={testRecording}
                  disabled={!backendHealth || status.is_listening || status.is_processing}
                  startIcon={<Mic />}
                >
                  Test Recording (3s)
                </Button>
                <Button
                  variant="outlined"
                  onClick={checkBackendHealth}
                  startIcon={<Refresh />}
                >
                  Refresh Status
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => window.electronAPI.showOverlay()}
                  disabled={!config.overlayEnabled}
                  startIcon={<Visibility />}
                >
                  Show Overlay
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Current Hotkey */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <Keyboard sx={{ mr: 1, verticalAlign: 'middle' }} />
                Current Hotkey
              </Typography>
              <Box sx={{ 
                p: 2, 
                bgcolor: 'action.hover', 
                borderRadius: 1, 
                textAlign: 'center',
                fontFamily: 'monospace',
                fontSize: '1.2rem'
              }}>
                {config.hotkey}
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Press and hold this key combination to start recording
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Model Information */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <Info sx={{ mr: 1, verticalAlign: 'middle' }} />
                AI Model
              </Typography>
              <Typography variant="h5" color="primary">
                {config.modelSize.toUpperCase()}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Whisper model for transcription
              </Typography>
              <Typography variant="body2" sx={{ mt: 1 }}>
                Language: {config.autoLanguageDetection ? 'Auto-detect' : (config.language || 'English')}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Settings */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <Settings sx={{ mr: 1, verticalAlign: 'middle' }} />
                Settings
              </Typography>
              
              <Grid container spacing={3}>
                {/* Hotkey Configuration */}
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Hotkey Combination"
                    value={config.hotkey}
                    onChange={(e) => saveConfig({ hotkey: e.target.value })}
                    helperText="Use format: CommandOrControl+Space, Alt+Shift+V, etc."
                  />
                </Grid>

                {/* Model Size */}
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>Whisper Model Size</InputLabel>
                    <Select
                      value={config.modelSize}
                      label="Whisper Model Size"
                      onChange={(e) => saveConfig({ modelSize: e.target.value })}
                    >
                      <MenuItem value="tiny">Tiny (Fastest)</MenuItem>
                      <MenuItem value="base">Base (Recommended)</MenuItem>
                      <MenuItem value="small">Small (Better Quality)</MenuItem>
                      <MenuItem value="medium">Medium (Best Quality)</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                {/* Language Settings */}
                <Grid item xs={12} md={6}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={config.autoLanguageDetection}
                        onChange={(e) => saveConfig({ autoLanguageDetection: e.target.checked })}
                      />
                    }
                    label="Auto-detect Language"
                  />
                </Grid>

                {/* Language Selection (when auto-detect is off) */}
                {!config.autoLanguageDetection && (
                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth>
                      <InputLabel>Language</InputLabel>
                      <Select
                        value={config.language || 'en'}
                        label="Language"
                        onChange={(e) => saveConfig({ language: e.target.value })}
                      >
                        <MenuItem value="en">English</MenuItem>
                        <MenuItem value="es">Spanish</MenuItem>
                        <MenuItem value="fr">French</MenuItem>
                        <MenuItem value="de">German</MenuItem>
                        <MenuItem value="it">Italian</MenuItem>
                        <MenuItem value="pt">Portuguese</MenuItem>
                        <MenuItem value="ru">Russian</MenuItem>
                        <MenuItem value="ja">Japanese</MenuItem>
                        <MenuItem value="ko">Korean</MenuItem>
                        <MenuItem value="zh">Chinese</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                )}

                {/* Overlay Settings */}
                <Grid item xs={12}>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="subtitle1" gutterBottom>
                    Overlay Settings
                  </Typography>
                </Grid>

                <Grid item xs={12} md={6}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={config.overlayEnabled}
                        onChange={(e) => saveConfig({ overlayEnabled: e.target.checked })}
                      />
                    }
                    label="Show Visual Overlay"
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <FormControl fullWidth disabled={!config.overlayEnabled}>
                    <InputLabel>Overlay Position</InputLabel>
                    <Select
                      value={config.overlayPosition}
                      label="Overlay Position"
                      onChange={(e) => saveConfig({ overlayPosition: e.target.value })}
                    >
                      <MenuItem value="top-right">Top Right</MenuItem>
                      <MenuItem value="top-left">Top Left</MenuItem>
                      <MenuItem value="bottom-right">Bottom Right</MenuItem>
                      <MenuItem value="bottom-left">Bottom Left</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* About */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                About OpenWispr
              </Typography>
              <Typography variant="body2" paragraph>
                OpenWispr is an open-source voice-to-text application that runs completely offline.
                It uses OpenAI's Whisper model for accurate transcription without sending your data to the cloud.
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                <Button
                  variant="outlined"
                  startIcon={<GitHub />}
                  onClick={() => window.electronAPI.openExternal('https://github.com/openwispr/openwispr')}
                >
                  View on GitHub
                </Button>
                <Typography variant="body2" color="text.secondary">
                  Version 1.0.0 • MIT License
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
};

export default MainView;