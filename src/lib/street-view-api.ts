import { GPXPoint, StreetViewImage } from '../types';
import { calculateDistance, calculateBearing, generateId } from './utils';

/**
 * Generate Street View image placeholders along a GPX route (no API calls yet)
 */
export async function generateStreetViewPlaceholders(
  points: GPXPoint[],
  intervalDistance: number,
  onProgress?: (current: number, total: number) => void
): Promise<StreetViewImage[]> {
  if (points.length < 2) {
    throw new Error('At least 2 points are required to generate Street View placeholders');
  }
  
  // Sample points at specified intervals
  const sampledPoints = samplePointsAtInterval(points, intervalDistance);
  
  if (sampledPoints.length === 0) {
    throw new Error('No valid points found for Street View placeholder generation');
  }
  
  const images: StreetViewImage[] = [];
  let totalDistance = 0;
  
  for (let i = 0; i < sampledPoints.length; i++) {
    const point = sampledPoints[i];
    const nextPoint = sampledPoints[i + 1];
    
    // Calculate heading to next point (if available)
    let heading = 0;
    if (nextPoint) {
      heading = calculateBearing(point.lat, point.lon, nextPoint.lat, nextPoint.lon);
    }
    
    // Calculate distance from start
    if (i > 0) {
      totalDistance += calculateDistance(
        sampledPoints[i - 1].lat,
        sampledPoints[i - 1].lon,
        point.lat,
        point.lon
      );
    }
    
    const image: StreetViewImage = {
      id: generateId(),
      coordinates: { lat: point.lat, lng: point.lon },
      heading,
      pitch: 0,
      distance: totalDistance,
      loaded: false,
      isLoading: false
    };
    
    images.push(image);
    
    if (onProgress) {
      onProgress(i + 1, sampledPoints.length);
    }
  }
  
  return images;
}

/**
 * Load a single Street View image on demand
 */
export async function loadStreetViewImage(
  image: StreetViewImage,
  apiKey: string,
  size: string = '640x640',
  fov: number = 90,
  pitch: number = 0
): Promise<StreetViewImage> {
  if (!apiKey) {
    throw new Error('Google API key is required');
  }

  if (image.loaded || image.isLoading) {
    return image; // Already loaded or loading
  }

  const updatedImage = { ...image, isLoading: true };

  try {
    const url = generateStreetViewURL(
      image.coordinates.lat,
      image.coordinates.lng,
      image.heading || 0,
      apiKey,
      size,
      fov,
      pitch
    );

    // Test if the image loads successfully
    await loadImage(url);

    return {
      ...updatedImage,
      url,
      loaded: true,
      isLoading: false
    };
  } catch (error) {
    return {
      ...updatedImage,
      loaded: false,
      isLoading: false,
      error: 'Failed to load Street View image'
    };
  }
}

/**
 * Sample points at regular intervals along the route
 */
function samplePointsAtInterval(points: GPXPoint[], intervalDistance: number): GPXPoint[] {
  if (points.length < 2) return points;
  
  const sampledPoints: GPXPoint[] = [points[0]]; // Always include first point
  let accumulatedDistance = 0;
  let lastSampledIndex = 0;
  
  for (let i = 1; i < points.length; i++) {
    const distance = calculateDistance(
      points[i - 1].lat,
      points[i - 1].lon,
      points[i].lat,
      points[i].lon
    );
    
    accumulatedDistance += distance;
    
    // If we've traveled the interval distance, add this point
    if (accumulatedDistance >= intervalDistance) {
      sampledPoints.push(points[i]);
      accumulatedDistance = 0;
      lastSampledIndex = i;
    }
  }
  
  // Always include the last point if it's not already included
  const lastPoint = points[points.length - 1];
  const lastSampledPoint = sampledPoints[sampledPoints.length - 1];
  
  if (lastSampledPoint.lat !== lastPoint.lat || lastSampledPoint.lon !== lastPoint.lon) {
    sampledPoints.push(lastPoint);
  }
  
  return sampledPoints;
}

/**
 * Generate Google Street View Static API URL
 */
function generateStreetViewURL(
  lat: number,
  lng: number,
  heading: number = 0,
  apiKey: string,
  size: string = '640x640',
  fov: number = 90,
  pitch: number = 0
): string {
  const baseUrl = 'https://maps.googleapis.com/maps/api/streetview';
  const params = new URLSearchParams({
    size,
    location: `${lat},${lng}`,
    heading: heading.toString(),
    pitch: pitch.toString(),
    fov: fov.toString(),
    key: apiKey
  });
  
  return `${baseUrl}?${params.toString()}`;
}

/**
 * Check if Street View is available at a location
 */
export async function checkStreetViewAvailability(
  lat: number,
  lng: number,
  apiKey: string
): Promise<boolean> {
  try {
    const url = `https://maps.googleapis.com/maps/api/streetview/metadata?location=${lat},${lng}&key=${apiKey}`;
    const response = await fetch(url);
    const data = await response.json();
    return data.status === 'OK';
  } catch (error) {
    console.warn('Failed to check Street View availability:', error);
    return false;
  }
}

/**
 * Preload multiple Street View images
 */
export async function preloadMultipleStreetViewImages(
  images: StreetViewImage[],
  apiKey: string,
  size: string = '640x640',
  fov: number = 90,
  pitch: number = 0,
  onProgress?: (loaded: number, total: number) => void
): Promise<StreetViewImage[]> {
  const loadPromises = images.map(async (image, index) => {
    const result = await loadStreetViewImage(image, apiKey, size, fov, pitch);
    
    if (onProgress) {
      onProgress(index + 1, images.length);
    }
    
    return result;
  });
  
  return Promise.all(loadPromises);
}

/**
 * Load a single image
 */
function loadImage(url: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = url;
  });
}

/**
 * Validate Google API key format
 */
export function validateApiKey(apiKey: string): boolean {
  // Basic validation - Google API keys are typically 39 characters long
  // and contain alphanumeric characters, hyphens, and underscores
  const apiKeyRegex = /^[A-Za-z0-9_-]{35,45}$/;
  return apiKeyRegex.test(apiKey);
}