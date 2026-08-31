'use client';

import React from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface MapProps {
  center?: [number, number];
  zoom?: number;
  onMapReady?: (map: L.Map) => void;
}

const Map: React.FC<MapProps> = ({ 
  center = [12.3456, 76.5432], 
  zoom = 13,
  onMapReady 
}) => {
  const mapRef = React.useRef<HTMLDivElement>(null);
  const [map, setMap] = React.useState<L.Map | null>(null);

  React.useEffect(() => {
    if (!mapRef.current) return;

    const mapInstance = L.map(mapRef.current).setView(center, zoom);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19
    }).addTo(mapInstance);

    setMap(mapInstance);
    onMapReady?.(mapInstance);

    return () => {
      mapInstance.remove();
    };
  }, []);

  return <div ref={mapRef} style={{ width: '100%', height: '600px' }} />;
};

export default Map;
