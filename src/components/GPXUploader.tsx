import React, { useCallback, useState } from 'react';
import { Upload, FileText, AlertCircle } from 'lucide-react';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Alert, AlertDescription } from './ui/alert';
import { parseGPXFile, validateGPXFile } from '../lib/gpx-parser';
import { GPXData } from '../types';

interface GPXUploaderProps {
  onGPXLoaded: (data: GPXData, fileName: string) => void;
  isLoading?: boolean;
}

export function GPXUploader({ onGPXLoaded, isLoading = false }: GPXUploaderProps) {
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFiles = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const file = files[0];
    setError(null);

    // Validate file
    if (!validateGPXFile(file)) {
      setError('Please select a valid GPX file (max 50MB)');
      return;
    }

    try {
      const gpxData = await parseGPXFile(file);
      onGPXLoaded(gpxData, file.name);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to parse GPX file');
    }
  }, [onGPXLoaded]);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  }, [handleFiles]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFiles(e.target.files);
    }
  }, [handleFiles]);

  return (
    <div className="w-full max-w-2xl mx-auto">
      <Card className="border-2 border-dashed border-muted-foreground/25 hover:border-muted-foreground/50 transition-colors">
        <CardContent className="p-8">
          <div
            className={`relative ${dragActive ? 'bg-muted/50' : ''} rounded-lg transition-colors`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <input
              type="file"
              accept=".gpx"
              onChange={handleChange}
              disabled={isLoading}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
              id="gpx-upload"
            />
            
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="mb-4">
                {isLoading ? (
                  <div className="animate-pulse-slow">
                    <FileText className="h-12 w-12 text-muted-foreground" />
                  </div>
                ) : (
                  <Upload className="h-12 w-12 text-muted-foreground" />
                )}
              </div>
              
              <h3 className="text-lg font-semibold mb-2">
                {isLoading ? 'Processing GPX file...' : 'Upload GPX File'}
              </h3>
              
              <p className="text-muted-foreground mb-4 max-w-sm">
                {isLoading 
                  ? 'Please wait while we parse your route data'
                  : 'Drag and drop your GPX file here, or click to browse'
                }
              </p>
              
              {!isLoading && (
                <Button variant="outline" asChild>
                  <label htmlFor="gpx-upload" className="cursor-pointer">
                    Choose File
                  </label>
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {error && (
        <Alert variant="destructive" className="mt-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="mt-4 text-sm text-muted-foreground text-center">
        <p>Supported format: GPX files up to 50MB</p>
        <p className="mt-1">
          Your GPX file will be processed locally in your browser - no data is sent to external servers
        </p>
      </div>
    </div>
  );
}