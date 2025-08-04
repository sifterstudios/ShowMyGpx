import { useState, useCallback } from 'react';
import { GPXData, StreetViewImage, ProcessingProgress, AppSettings } from '../types';
import { generateStreetViewPlaceholders } from '../lib/street-view-api';

export function useStreetViewProcessor() {
  const [images, setImages] = useState<StreetViewImage[]>([]);
  const [progress, setProgress] = useState<ProcessingProgress | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const processGPXData = useCallback(async (
    gpxData: GPXData,
    intervalDistance: number
  ) => {
    setIsProcessing(true);
    setError(null);
    setImages([]);

    try {
      // Stage 1: Parse GPX and extract points
      setProgress({
        current: 0,
        total: 1,
        stage: 'parsing',
        message: 'Extracting route points from GPX data...'
      });

      // Get all points from all tracks
      const allPoints = gpxData.tracks.flatMap(track => track.points);
      
      if (allPoints.length < 2) {
        throw new Error('GPX file must contain at least 2 track points');
      }

      // Stage 2: Generate Street View placeholders (no API calls)
      setProgress({
        current: 0,
        total: 0,
        stage: 'generating',
        message: 'Generating Street View placeholders...'
      });

      const streetViewImages = await generateStreetViewPlaceholders(
        allPoints,
        intervalDistance,
        (current, total) => {
          setProgress({
            current,
            total,
            stage: 'generating',
            message: `Generating placeholders (${current}/${total})...`
          });
        }
      );

      if (streetViewImages.length === 0) {
        throw new Error('No Street View placeholders could be generated from the route');
      }

      // Complete - no preloading, images load on demand
      setProgress({
        current: streetViewImages.length,
        total: streetViewImages.length,
        stage: 'complete',
        message: `Generated ${streetViewImages.length} Street View points - images will load on demand`
      });

      setImages(streetViewImages);

      // Clear progress after a short delay
      setTimeout(() => {
        setProgress(null);
      }, 2000);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to process GPX data';
      setError(errorMessage);
      setProgress(null);
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const reset = useCallback(() => {
    setImages([]);
    setProgress(null);
    setIsProcessing(false);
    setError(null);
  }, []);

  return {
    images,
    progress,
    isProcessing,
    error,
    processGPXData,
    reset
  };
}