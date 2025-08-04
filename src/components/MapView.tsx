import React, { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Polyline, Marker, Popup, useMap } from 'react-leaflet';
import { LatLngBounds } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { StreetViewImage } from '../types';
import { formatDistance, formatCoordinates } from '../lib/utils';

// Fix for default markers in react-leaflet
import L from 'leaflet';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

interface MapViewProps {
  images: StreetViewImage[];
  currentIndex: number;
  onImageSelect: (index: number) => void;
  showMarkers?: boolean;
}

// Component to fit map bounds to route
function FitBounds({ images }: { images: StreetViewImage[] }) {
  const map = useMap();
  
  useEffect(() => {
    if (images.length > 0) {
      const bounds = new LatLngBounds(
        images.map(img => [img.coordinates.lat, img.coordinates.lng])
      );
      map.fitBounds(bounds, { padding: [20, 20] });
    }
  }, [images, map]);
  
  return null;
}

// Component to center map on current image
function CenterOnCurrent({ currentImage }: { currentImage: StreetViewImage | null }) {
  const map = useMap();
  
  useEffect(() => {
    if (currentImage) {
      map.setView([currentImage.coordinates.lat, currentImage.coordinates.lng], map.getZoom());
    }
  }, [currentImage, map]);
  
  return null;
}

export function MapView({ images, currentIndex, onImageSelect, showMarkers = true }: MapViewProps) {
  const currentImage = images[currentIndex];
  
  // Create route path from all images
  const routePath = images.map(img => [img.coordinates.lat, img.coordinates.lng] as [number, number]);
  
  // Create custom icon for current position
  const currentIcon = new L.Icon({
    iconUrl: 'data:image/svg+xml;base64,' + btoa(`
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="12" cy="12" r="8" fill="#3b82f6" stroke="#ffffff" stroke-width="2"/>
        <circle cx="12" cy="12" r="3" fill="#ffffff"/>
      </svg>
    `),
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -12],
  });
  
  const regularIcon = new L.Icon({
    iconUrl: 'data:image/svg+xml;base64,' + btoa(`
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="8" cy="8" r="6" fill="#6b7280" stroke="#ffffff" stroke-width="1"/>
      </svg>
    `),
    iconSize: [16, 16],
    iconAnchor: [8, 8],
    popupAnchor: [0, -8],
  });

  if (images.length === 0) {
    return (
      <div className="w-full h-64 bg-muted rounded-lg flex items-center justify-center">
        <p className="text-muted-foreground">No route data to display</p>
      </div>
    );
  }

  return (
    <div className="w-full h-64 md:h-80 rounded-lg overflow-hidden border">
      <MapContainer
        center={[currentImage.coordinates.lat, currentImage.coordinates.lng]}
        zoom={13}
        className="w-full h-full"
        zoomControl={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {/* Route polyline */}
        <Polyline
          positions={routePath}
          color="#3b82f6"
          weight={3}
          opacity={0.8}
        />
        
        {/* Image markers */}
        {showMarkers && images.map((image, index) => (
          <Marker
            key={image.id}
            position={[image.coordinates.lat, image.coordinates.lng]}
            icon={index === currentIndex ? currentIcon : regularIcon}
            eventHandlers={{
              click: () => onImageSelect(index),
            }}
          >
            <Popup>
              <div className="text-sm">
                <div className="font-medium mb-1">
                  Image {index + 1} of {images.length}
                </div>
                <div className="text-muted-foreground space-y-1">
                  <div>Distance: {formatDistance(image.distance)}</div>
                  <div>Coordinates: {formatCoordinates(image.coordinates.lat, image.coordinates.lng)}</div>
                  {image.heading !== undefined && (
                    <div>Heading: {Math.round(image.heading)}°</div>
                  )}
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
        
        <FitBounds images={images} />
        <CenterOnCurrent currentImage={currentImage} />
      </MapContainer>
    </div>
  );
}