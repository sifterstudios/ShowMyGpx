import React, { useState, useEffect, useCallback } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Download, 
  MapPin, 
  Navigation, 
  Info,
  Map,
  Loader2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Slider } from './ui/slider';
import { MapView } from './MapView';
import { StreetViewImage } from '../types';
import { formatDistance, formatCoordinates } from '../lib/utils';
import { loadStreetViewImage } from '../lib/street-view-api';

interface ImageViewerProps {
  images: StreetViewImage[];
  onExport: () => void;
  isExporting?: boolean;
  apiKey: string;
  settings: {
    imageSize: string;
    fov: number;
    pitch: number;
  };
}

export function ImageViewer({ 
  images, 
  onExport, 
  isExporting = false, 
  apiKey,
  settings 
}: ImageViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showInfo, setShowInfo] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [loadedImages, setLoadedImages] = useState<StreetViewImage[]>(images);
  const [isLoadingImage, setIsLoadingImage] = useState(false);

  const currentImage = loadedImages[currentIndex];
  const validImages = loadedImages.filter(img => img.loaded && !img.error);

  // Load current image if not already loaded
  useEffect(() => {
    const loadCurrentImage = async () => {
      if (!currentImage || currentImage.loaded || currentImage.isLoading || !apiKey) {
        return;
      }

      setIsLoadingImage(true);
      try {
        const loadedImage = await loadStreetViewImage(
          currentImage,
          apiKey,
          settings.imageSize,
          settings.fov,
          settings.pitch
        );

        setLoadedImages(prev => 
          prev.map((img, index) => 
            index === currentIndex ? loadedImage : img
          )
        );
      } catch (error) {
        console.error('Failed to load Street View image:', error);
      } finally {
        setIsLoadingImage(false);
      }
    };

    loadCurrentImage();
  }, [currentIndex, currentImage, apiKey, settings]);

  // Preload adjacent images
  useEffect(() => {
    const preloadAdjacent = async () => {
      if (!apiKey) return;

      const indicesToPreload = [
        currentIndex - 1,
        currentIndex + 1
      ].filter(index => 
        index >= 0 && 
        index < loadedImages.length && 
        !loadedImages[index].loaded && 
        !loadedImages[index].isLoading
      );

      for (const index of indicesToPreload) {
        try {
          const loadedImage = await loadStreetViewImage(
            loadedImages[index],
            apiKey,
            settings.imageSize,
            settings.fov,
            settings.pitch
          );

          setLoadedImages(prev => 
            prev.map((img, i) => 
              i === index ? loadedImage : img
            )
          );
        } catch (error) {
          console.error('Failed to preload adjacent image:', error);
        }
      }
    };

    // Delay preloading to prioritize current image
    const timer = setTimeout(preloadAdjacent, 500);
    return () => clearTimeout(timer);
  }, [currentIndex, loadedImages, apiKey, settings]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        goToPrevious();
      } else if (e.key === 'ArrowRight') {
        goToNext();
      } else if (e.key === 'i' || e.key === 'I') {
        setShowInfo(!showInfo);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [showInfo]);

  const goToNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % loadedImages.length);
    setImageLoaded(false);
  }, [loadedImages.length]);

  const goToPrevious = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + loadedImages.length) % loadedImages.length);
    setImageLoaded(false);
  }, [loadedImages.length]);

  const handleSliderChange = useCallback((value: number[]) => {
    setCurrentIndex(value[0]);
    setImageLoaded(false);
  }, []);

  const handleImageLoad = useCallback(() => {
    setImageLoaded(true);
  }, []);

  const handleMapImageSelect = useCallback((index: number) => {
    setCurrentIndex(index);
    setImageLoaded(false);
  }, []);

  if (!currentImage) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardContent className="p-8 text-center">
          <p className="text-muted-foreground">No images to display</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto space-y-4">
      {/* Map View */}
      {showMap && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Map className="h-5 w-5" />
              Route Map
            </CardTitle>
          </CardHeader>
          <CardContent>
            <MapView
              images={loadedImages}
              currentIndex={currentIndex}
              onImageSelect={handleMapImageSelect}
              showMarkers={true}
            />
          </CardContent>
        </Card>
      )}

      {/* Main Image Display */}
      <Card className="overflow-hidden">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Navigation className="h-5 w-5" />
              Street View Explorer
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowMap(!showMap)}
              >
                <Map className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowInfo(!showInfo)}
              >
                <Info className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={onExport}
                disabled={isExporting || validImages.length === 0}
              >
                <Download className="h-4 w-4" />
                {isExporting ? 'Exporting...' : 'Export'}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="relative bg-muted">
            {/* Image */}
            <div className="relative aspect-square max-h-[70vh] overflow-hidden">
              {currentImage.error ? (
                <div className="flex items-center justify-center h-full bg-muted">
                  <div className="text-center">
                    <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                    <p className="text-muted-foreground">Street View not available</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatCoordinates(currentImage.coordinates.lat, currentImage.coordinates.lng)}
                    </p>
                  </div>
                </div>
              ) : !currentImage.url || isLoadingImage ? (
                <div className="flex items-center justify-center h-full bg-muted">
                  <div className="text-center">
                    <Loader2 className="h-12 w-12 text-muted-foreground mx-auto mb-2 animate-spin" />
                    <p className="text-muted-foreground">Loading Street View...</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatCoordinates(currentImage.coordinates.lat, currentImage.coordinates.lng)}
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  {!imageLoaded && (
                    <div className="absolute inset-0 flex items-center justify-center bg-muted">
                      <div className="text-center">
                        <Loader2 className="h-12 w-12 text-muted-foreground mx-auto mb-2 animate-spin" />
                        <p className="text-muted-foreground">Loading image...</p>
                      </div>
                    </div>
                  )}
                  <img
                    src={currentImage.url!}
                    alt={`Street View at ${formatDistance(currentImage.distance)}`}
                    className={`w-full h-full object-cover transition-opacity duration-300 ${
                      imageLoaded ? 'opacity-100' : 'opacity-0'
                    }`}
                    onLoad={handleImageLoad}
                    onError={() => setImageLoaded(true)}
                  />
                </>
              )}
            </div>

            {/* Navigation Buttons */}
            <Button
              variant="secondary"
              size="icon"
              className="absolute left-4 top-1/2 transform -translate-y-1/2 opacity-80 hover:opacity-100"
              onClick={goToPrevious}
              disabled={loadedImages.length <= 1}
            >
              <ChevronLeft className="h-6 w-6" />
            </Button>
            <Button
              variant="secondary"
              size="icon"
              className="absolute right-4 top-1/2 transform -translate-y-1/2 opacity-80 hover:opacity-100"
              onClick={goToNext}
              disabled={loadedImages.length <= 1}
            >
              <ChevronRight className="h-6 w-6" />
            </Button>

            {/* Image Counter */}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-background/80 backdrop-blur-sm rounded-full px-3 py-1 text-sm">
              {currentIndex + 1} / {loadedImages.length}
            </div>

            {/* Info Overlay */}
            {showInfo && (
              <div className="absolute top-4 left-4 bg-background/90 backdrop-blur-sm rounded-lg p-3 text-sm space-y-1 max-w-xs">
                <div className="flex items-center gap-2 font-medium">
                  <MapPin className="h-4 w-4" />
                  Location Info
                </div>
                <div>
                  <span className="text-muted-foreground">Distance:</span> {formatDistance(currentImage.distance)}
                </div>
                <div>
                  <span className="text-muted-foreground">Coordinates:</span>{' '}
                  {formatCoordinates(currentImage.coordinates.lat, currentImage.coordinates.lng)}
                </div>
                {currentImage.heading !== undefined && (
                  <div>
                    <span className="text-muted-foreground">Heading:</span> {Math.round(currentImage.heading)}°
                  </div>
                )}
                <div className="text-xs text-muted-foreground pt-1">
                  Press 'I' to toggle this info
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Controls */}
      <Card>
        <CardContent className="p-4">
          <div className="space-y-4">
            {/* Progress Slider */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Route Progress</span>
                <span>{formatDistance(currentImage.distance)}</span>
              </div>
              <Slider
                value={[currentIndex]}
                onValueChange={handleSliderChange}
                max={loadedImages.length - 1}
                step={1}
                className="w-full"
              />
            </div>

            {/* Navigation Hints */}
            <div className="flex justify-between items-center text-xs text-muted-foreground">
              <div className="flex items-center gap-4">
                <span>← → Navigate</span>
                <span>I Info</span>
                <span>Map Toggle</span>
              </div>
              <div>
                {validImages.length} / {loadedImages.length} images loaded
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}