import React, { useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import { Settings, MapPin, AlertCircle, Github, User } from 'lucide-react';
import { Button } from './components/ui/button';
import { Alert, AlertDescription } from './components/ui/alert';
import { UserDashboard } from './components/dashboard/UserDashboard';
import { SuccessPage } from './components/SuccessPage';
import { GPXUploader } from './components/GPXUploader';
import { SettingsPanel } from './components/SettingsPanel';
import { ProcessingProgress } from './components/ProcessingProgress';
import { ImageViewer } from './components/ImageViewer';
import { ExportDialog } from './components/ExportDialog';
import { useUser } from './lib/supabase';
import { useLocalStorage } from './hooks/useLocalStorage';
import { useStreetViewProcessor } from './hooks/useStreetViewProcessor';
import { UserService } from './lib/user-service';
import { GPXData, AppSettings } from './types';

const defaultSettings: AppSettings = {
  intervalDistance: 50,
  imageSize: '640x640',
  fov: 90,
  pitch: 0,
  apiKey: ''
};

function App() {
  return (
    <Routes>
      <Route path="/" element={<MainApp />} />
      <Route path="/success" element={<SuccessPage />} />
    </Routes>
  );
}

function MainApp() {
  const { user } = useUser();
  const [settings, setSettings] = useLocalStorage<AppSettings>('gpx-street-view-settings', defaultSettings);
  const [showSettings, setShowSettings] = useState(false);
  const [showDashboard, setShowDashboard] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [currentGPXData, setCurrentGPXData] = useState<GPXData | null>(null);
  const [currentFileName, setCurrentFileName] = useState<string>('');

  const {
    images,
    progress,
    isProcessing,
    error,
    processGPXData,
    reset
  } = useStreetViewProcessor();

  const handleGPXLoaded = async (gpxData: GPXData, fileName: string) => {
    setCurrentGPXData(gpxData);
    setCurrentFileName(fileName);
    
    // Save GPX file to database if user is authenticated
    if (user && gpxData.tracks.length > 0) {
      try {
        const track = gpxData.tracks[0];
        const totalDistance = calculateTotalDistance(track.points);
        
        await UserService.saveGPXFile(
          user.id,
          fileName,
          fileName,
          0, // file size - we don't have this from the parsed data
          '', // storage path - not using file storage for now
          gpxData.metadata?.name || track.name,
          totalDistance,
          track.points.length
        );
      } catch (error) {
        console.error('Failed to save GPX file:', error);
      }
    }
    
    // Process GPX data immediately (no API key needed for placeholders)
    await processGPXData(gpxData, settings.intervalDistance);
  };
  
  const calculateTotalDistance = (points: any[]) => {
    let total = 0;
    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1];
      const curr = points[i];
      // Simple distance calculation - you might want to use the haversine formula
      const dx = curr.lat - prev.lat;
      const dy = curr.lon - prev.lon;
      total += Math.sqrt(dx * dx + dy * dy) * 111000; // rough conversion to meters
    }
    return total;
  };

  const handleSettingsChange = async (newSettings: AppSettings) => {
    setSettings(newSettings);
  };

  const handleNewUpload = () => {
    reset();
    setCurrentGPXData(null);
    setCurrentFileName('');
  };

  const getRouteDisplayName = () => {
    if (currentGPXData?.metadata?.name) {
      return currentGPXData.metadata.name;
    }
    return currentFileName.replace(/\.[^/.]+$/, '') || 'gpx-route';
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <MapPin className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-xl font-bold">GPX Street View Explorer</h1>
                <p className="text-sm text-muted-foreground">
                  Upload GPX files and explore your routes with Street View
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowDashboard(true)}
              >
                <User className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowSettings(true)}
              >
                <Settings className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                asChild
              >
                <a
                  href="https://github.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2"
                >
                  <Github className="h-4 w-4" />
                </a>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="space-y-8">
          {/* API Key Warning */}
          {!settings.apiKey && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                A Google API key is required to load Street View images.{' '}
                <Button
                  variant="link"
                  className="p-0 h-auto text-primary"
                  onClick={() => setShowSettings(true)}
                >
                  Configure in Settings
                </Button>
              </AlertDescription>
            </Alert>
          )}

          {/* Error Display */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Content based on current state */}
          {!currentGPXData && !isProcessing && (
            <GPXUploader onGPXLoaded={handleGPXLoaded} />
          )}

          {progress && (
            <ProcessingProgress progress={progress} />
          )}

          {images.length > 0 && !isProcessing && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold">Street View Images</h2>
                  <p className="text-muted-foreground">
                    Route: {getRouteDisplayName()} • {images.length} images generated
                  </p>
                </div>
                <Button onClick={handleNewUpload} variant="outline">
                  Upload New GPX
                </Button>
              </div>
              
              <ImageViewer
                images={images}
                onExport={() => setShowExportDialog(true)}
                isExporting={isExporting}
                apiKey={settings.apiKey}
                settings={{
                  imageSize: settings.imageSize,
                  fov: settings.fov,
                  pitch: settings.pitch
                }}
              />
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t bg-card/50 mt-16">
        <div className="container mx-auto px-4 py-6">
          <div className="text-center text-sm text-muted-foreground">
            <p>
              Built with React, TypeScript, and Google Street View API • 
              All processing happens locally in your browser • Images load on demand
            </p>
            <p className="mt-2">
              Need help? Check the{' '}
              <a
                href="https://developers.google.com/maps/documentation/streetview/get-api-key"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                Google API documentation
              </a>{' '}
              for setting up your API key.
            </p>
          </div>
        </div>
      </footer>

      {/* Modals */}
      {showDashboard && (
        <UserDashboard onClose={() => setShowDashboard(false)} />
      )}

      {showSettings && (
        <SettingsPanel
          settings={settings}
          onSettingsChange={handleSettingsChange}
          onClose={() => setShowSettings(false)}
        />
      )}

      {showExportDialog && (
        <ExportDialog
          images={images}
          routeName={getRouteDisplayName()}
          onClose={() => setShowExportDialog(false)}
          isExporting={isExporting}
          onExportStart={() => setIsExporting(true)}
          onExportComplete={() => setIsExporting(false)}
        />
      )}
    </div>
  );
}

export default App;