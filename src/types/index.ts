export interface GPXPoint {
  lat: number;
  lon: number;
  ele?: number;
  time?: Date;
}

export interface GPXTrack {
  name?: string;
  points: GPXPoint[];
}

export interface GPXData {
  tracks: GPXTrack[];
  waypoints?: GPXPoint[];
  metadata?: {
    name?: string;
    desc?: string;
    time?: Date;
  };
}

export interface StreetViewImage {
  id: string;
  url?: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  heading?: number;
  pitch?: number;
  distance: number;
  loaded: boolean;
  error?: string;
  isLoading?: boolean;
}

export interface ProcessingProgress {
  current: number;
  total: number;
  stage: 'parsing' | 'generating' | 'loading' | 'complete';
  message: string;
}

export interface AppSettings {
  intervalDistance: number; // meters
  imageSize: string;
  fov: number;
  pitch: number;
  apiKey: string;
}

export interface ExportOptions {
  format: 'zip' | 'individual';
  includeMetadata: boolean;
  imageQuality: 'high' | 'medium' | 'low';
}

export interface MapViewSettings {
  showRoute: boolean;
  showMarkers: boolean;
  centerOnCurrent: boolean;
}
