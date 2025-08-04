import React from 'react';
import { Settings, Key, Image, Eye } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Button } from './ui/button';
import { AppSettings } from '../types';
import { validateApiKey } from '../lib/street-view-api';

interface SettingsPanelProps {
  settings: AppSettings;
  onSettingsChange: (settings: AppSettings) => void;
  onClose: () => void;
}

export function SettingsPanel({ settings, onSettingsChange, onClose }: SettingsPanelProps) {
  const [localSettings, setLocalSettings] = React.useState<AppSettings>(settings);
  const [apiKeyValid, setApiKeyValid] = React.useState<boolean | null>(null);

  React.useEffect(() => {
    if (localSettings.apiKey) {
      const isValid = validateApiKey(localSettings.apiKey);
      setApiKeyValid(isValid);
    } else {
      setApiKeyValid(null);
    }
  }, [localSettings.apiKey]);

  const handleSave = () => {
    onSettingsChange(localSettings);
    onClose();
  };

  const handleReset = () => {
    const defaultSettings: AppSettings = {
      intervalDistance: 50,
      imageSize: '640x640',
      fov: 90,
      pitch: 0,
      apiKey: ''
    };
    setLocalSettings(defaultSettings);
  };

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* API Key Section */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Key className="h-4 w-4" />
              <Label htmlFor="api-key" className="text-sm font-medium">
                Google API Key
              </Label>
            </div>
            <Input
              id="api-key"
              type="password"
              placeholder="Enter your Google API key"
              value={localSettings.apiKey}
              onChange={(e) => setLocalSettings({ ...localSettings, apiKey: e.target.value })}
              className={apiKeyValid === false ? 'border-destructive' : ''}
            />
            {apiKeyValid === false && (
              <p className="text-sm text-destructive">
                Invalid API key format. Please check your key.
              </p>
            )}
            <div className="text-xs text-muted-foreground space-y-1">
              <p>Required for Street View image generation.</p>
              <p>
                Get your API key from the{' '}
                <a 
                  href="https://console.cloud.google.com/apis/credentials" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  Google Cloud Console
                </a>
              </p>
              <p>Enable the "Street View Static API" for your project.</p>
            </div>
          </div>

          {/* Route Settings */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Route Settings</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="interval" className="text-xs">
                  Image Interval (meters)
                </Label>
                <Select
                  value={localSettings.intervalDistance.toString()}
                  onValueChange={(value) => 
                    setLocalSettings({ ...localSettings, intervalDistance: parseInt(value) })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="25">25m</SelectItem>
                    <SelectItem value="50">50m</SelectItem>
                    <SelectItem value="100">100m</SelectItem>
                    <SelectItem value="200">200m</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Image Settings */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Image className="h-4 w-4" />
              <Label className="text-sm font-medium">Image Settings</Label>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="size" className="text-xs">
                  Image Size
                </Label>
                <Select
                  value={localSettings.imageSize}
                  onValueChange={(value) => 
                    setLocalSettings({ ...localSettings, imageSize: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="400x400">400x400</SelectItem>
                    <SelectItem value="640x640">640x640</SelectItem>
                    <SelectItem value="800x800">800x800</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="fov" className="text-xs">
                  Field of View
                </Label>
                <Select
                  value={localSettings.fov.toString()}
                  onValueChange={(value) => 
                    setLocalSettings({ ...localSettings, fov: parseInt(value) })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="60">60°</SelectItem>
                    <SelectItem value="90">90°</SelectItem>
                    <SelectItem value="120">120°</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="pitch" className="text-xs">
                  Pitch
                </Label>
                <Select
                  value={localSettings.pitch.toString()}
                  onValueChange={(value) => 
                    setLocalSettings({ ...localSettings, pitch: parseInt(value) })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="-10">-10°</SelectItem>
                    <SelectItem value="0">0°</SelectItem>
                    <SelectItem value="10">10°</SelectItem>
                    <SelectItem value="20">20°</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between pt-4 border-t">
            <Button variant="outline" onClick={handleReset}>
              Reset to Defaults
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={!localSettings.apiKey || apiKeyValid === false}>
                Save Settings
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}