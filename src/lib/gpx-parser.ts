import { GPXData, GPXPoint, GPXTrack } from '../types';

/**
 * Parse GPX file content and extract track data
 */
export async function parseGPXFile(file: File): Promise<GPXData> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const xmlContent = e.target?.result as string;
        const gpxData = parseGPXContent(xmlContent);
        resolve(gpxData);
      } catch (error) {
        reject(new Error(`Failed to parse GPX file: ${error}`));
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read GPX file'));
    };
    
    reader.readAsText(file);
  });
}

/**
 * Parse GPX XML content
 */
function parseGPXContent(xmlContent: string): GPXData {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlContent, 'text/xml');
  
  // Check for parsing errors
  const parserError = xmlDoc.querySelector('parsererror');
  if (parserError) {
    throw new Error('Invalid XML format');
  }
  
  const gpxElement = xmlDoc.querySelector('gpx');
  if (!gpxElement) {
    throw new Error('Invalid GPX format: missing gpx element');
  }
  
  // Extract metadata
  const metadata = extractMetadata(xmlDoc);
  
  // Extract tracks
  const tracks = extractTracks(xmlDoc);
  
  // Extract waypoints
  const waypoints = extractWaypoints(xmlDoc);
  
  if (tracks.length === 0) {
    throw new Error('No tracks found in GPX file');
  }
  
  return {
    tracks,
    waypoints,
    metadata
  };
}

/**
 * Extract metadata from GPX
 */
function extractMetadata(xmlDoc: Document) {
  const metadataElement = xmlDoc.querySelector('metadata');
  if (!metadataElement) return undefined;
  
  const name = metadataElement.querySelector('name')?.textContent || undefined;
  const desc = metadataElement.querySelector('desc')?.textContent || undefined;
  const timeElement = metadataElement.querySelector('time');
  const time = timeElement ? new Date(timeElement.textContent || '') : undefined;
  
  return { name, desc, time };
}

/**
 * Extract tracks from GPX
 */
function extractTracks(xmlDoc: Document): GPXTrack[] {
  const trackElements = xmlDoc.querySelectorAll('trk');
  const tracks: GPXTrack[] = [];
  
  trackElements.forEach(trackElement => {
    const name = trackElement.querySelector('name')?.textContent || undefined;
    const points: GPXPoint[] = [];
    
    // Get all track segments
    const segmentElements = trackElement.querySelectorAll('trkseg');
    
    segmentElements.forEach(segmentElement => {
      const trackPoints = segmentElement.querySelectorAll('trkpt');
      
      trackPoints.forEach(pointElement => {
        const lat = parseFloat(pointElement.getAttribute('lat') || '0');
        const lon = parseFloat(pointElement.getAttribute('lon') || '0');
        
        if (isNaN(lat) || isNaN(lon)) return;
        
        const eleElement = pointElement.querySelector('ele');
        const timeElement = pointElement.querySelector('time');
        
        const point: GPXPoint = {
          lat,
          lon,
          ele: eleElement ? parseFloat(eleElement.textContent || '0') : undefined,
          time: timeElement ? new Date(timeElement.textContent || '') : undefined
        };
        
        points.push(point);
      });
    });
    
    if (points.length > 0) {
      tracks.push({ name, points });
    }
  });
  
  return tracks;
}

/**
 * Extract waypoints from GPX
 */
function extractWaypoints(xmlDoc: Document): GPXPoint[] {
  const waypointElements = xmlDoc.querySelectorAll('wpt');
  const waypoints: GPXPoint[] = [];
  
  waypointElements.forEach(waypointElement => {
    const lat = parseFloat(waypointElement.getAttribute('lat') || '0');
    const lon = parseFloat(waypointElement.getAttribute('lon') || '0');
    
    if (isNaN(lat) || isNaN(lon)) return;
    
    const eleElement = waypointElement.querySelector('ele');
    const timeElement = waypointElement.querySelector('time');
    
    const waypoint: GPXPoint = {
      lat,
      lon,
      ele: eleElement ? parseFloat(eleElement.textContent || '0') : undefined,
      time: timeElement ? new Date(timeElement.textContent || '') : undefined
    };
    
    waypoints.push(waypoint);
  });
  
  return waypoints;
}

/**
 * Validate GPX file format
 */
export function validateGPXFile(file: File): boolean {
  const validExtensions = ['.gpx'];
  const fileName = file.name.toLowerCase();
  const isValidExtension = validExtensions.some(ext => fileName.endsWith(ext));
  const isValidSize = file.size > 0 && file.size < 50 * 1024 * 1024; // Max 50MB
  
  return isValidExtension && isValidSize;
}