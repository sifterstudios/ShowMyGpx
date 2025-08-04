import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { StreetViewImage, ExportOptions } from '../types';
import { formatCoordinates, formatDistance } from './utils';

/**
 * Export Street View images as a ZIP file
 */
export async function exportImagesAsZip(
  images: StreetViewImage[],
  options: ExportOptions,
  routeName: string = 'gpx-route'
): Promise<void> {
  const zip = new JSZip();
  const imageFolder = zip.folder('images');
  
  if (!imageFolder) {
    throw new Error('Failed to create ZIP folder');
  }
  
  // Add images to ZIP
  for (let i = 0; i < images.length; i++) {
    const image = images[i];
    
    if (!image.loaded || image.error) {
      continue; // Skip failed images
    }
    
    try {
      // Fetch image data
      const response = await fetch(image.url);
      const blob = await response.blob();
      
      // Generate filename
      const filename = `${String(i + 1).padStart(3, '0')}_${formatDistance(image.distance)}.jpg`;
      
      // Add image to ZIP
      imageFolder.file(filename, blob);
      
    } catch (error) {
      console.warn(`Failed to add image ${i + 1} to ZIP:`, error);
    }
  }
  
  // Add metadata file if requested
  if (options.includeMetadata) {
    const metadata = generateMetadata(images, routeName);
    zip.file('metadata.json', JSON.stringify(metadata, null, 2));
    zip.file('route_info.txt', generateRouteInfo(images, routeName));
  }
  
  // Generate and download ZIP
  try {
    const content = await zip.generateAsync({ type: 'blob' });
    const filename = `${routeName.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_street_view.zip`;
    saveAs(content, filename);
  } catch (error) {
    throw new Error(`Failed to generate ZIP file: ${error}`);
  }
}

/**
 * Export individual images
 */
export async function exportIndividualImages(
  images: StreetViewImage[],
  routeName: string = 'gpx-route'
): Promise<void> {
  for (let i = 0; i < images.length; i++) {
    const image = images[i];
    
    if (!image.loaded || image.error) {
      continue; // Skip failed images
    }
    
    try {
      const response = await fetch(image.url);
      const blob = await response.blob();
      
      const filename = `${routeName}_${String(i + 1).padStart(3, '0')}_${formatDistance(image.distance)}.jpg`;
      saveAs(blob, filename);
      
      // Add small delay to prevent overwhelming the browser
      await new Promise(resolve => setTimeout(resolve, 100));
      
    } catch (error) {
      console.warn(`Failed to download image ${i + 1}:`, error);
    }
  }
}

/**
 * Generate metadata for export
 */
function generateMetadata(images: StreetViewImage[], routeName: string) {
  return {
    routeName,
    exportDate: new Date().toISOString(),
    totalImages: images.length,
    successfulImages: images.filter(img => img.loaded && !img.error).length,
    totalDistance: images.length > 0 ? images[images.length - 1].distance : 0,
    images: images.map((image, index) => ({
      index: index + 1,
      filename: `${String(index + 1).padStart(3, '0')}_${formatDistance(image.distance)}.jpg`,
      coordinates: formatCoordinates(image.coordinates.lat, image.coordinates.lng),
      heading: image.heading,
      distance: image.distance,
      loaded: image.loaded,
      error: image.error
    }))
  };
}

/**
 * Generate human-readable route information
 */
function generateRouteInfo(images: StreetViewImage[], routeName: string): string {
  const successfulImages = images.filter(img => img.loaded && !img.error);
  const totalDistance = images.length > 0 ? images[images.length - 1].distance : 0;
  
  let info = `GPX Street View Export - ${routeName}\n`;
  info += `Generated: ${new Date().toLocaleString()}\n\n`;
  info += `Route Statistics:\n`;
  info += `- Total Distance: ${formatDistance(totalDistance)}\n`;
  info += `- Total Images: ${images.length}\n`;
  info += `- Successful Images: ${successfulImages.length}\n`;
  info += `- Failed Images: ${images.length - successfulImages.length}\n\n`;
  
  if (successfulImages.length > 0) {
    info += `Image Details:\n`;
    info += `${'#'.padEnd(4)} ${'Distance'.padEnd(10)} ${'Coordinates'.padEnd(20)} ${'Heading'.padEnd(8)}\n`;
    info += `${'-'.repeat(50)}\n`;
    
    successfulImages.forEach((image, index) => {
      const num = String(index + 1).padEnd(4);
      const dist = formatDistance(image.distance).padEnd(10);
      const coords = formatCoordinates(image.coordinates.lat, image.coordinates.lng).padEnd(20);
      const heading = `${Math.round(image.heading || 0)}°`.padEnd(8);
      
      info += `${num}${dist}${coords}${heading}\n`;
    });
  }
  
  return info;
}

/**
 * Calculate export file size estimate
 */
export function estimateExportSize(images: StreetViewImage[]): number {
  // Estimate average Street View image size (JPEG, 640x640)
  const averageImageSize = 150 * 1024; // ~150KB per image
  const successfulImages = images.filter(img => img.loaded && !img.error).length;
  
  return successfulImages * averageImageSize;
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}