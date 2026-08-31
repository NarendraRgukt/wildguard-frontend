'use client';

import React from 'react';
import L from 'leaflet';

interface AnimalMarkerProps {
  map: L.Map | null;
  animal: {
    id: string;
    animal_code: string;
    species: string;
    latitude: number;
    longitude: number;
  };
  onClick?: () => void;
  alert?: boolean;
}

const AnimalMarker: React.FC<AnimalMarkerProps> = ({ map, animal, onClick, alert }) => {
  const markerRef = React.useRef<L.Marker | null>(null);

  React.useEffect(() => {
    if (!map) return;

    // Remove old marker
    if (markerRef.current) {
      map.removeLayer(markerRef.current);
    }

    // Choose species icon (fallback to generic) and danger icon for alerts
    const speciesEmoji = (() => {
      const s = (animal.species || '').toLowerCase();
      if (s.includes('elephant')) return '🐘';
      if (s.includes('tiger')) return '🐯';
      if (s.includes('rhino')) return '🦏';
      if (s.includes('leopard')) return '🐆';
      if (s.includes('bear')) return '🐻';
      if (s.includes('deer')) return '🦌';
      if (s.includes('wild boar') || s.includes('boar')) return '🐗';
      return '�';
    })();

    const svg = alert
      ? `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><text x="12" y="20" font-size="20" text-anchor="middle">⚠</text></svg>`
      : `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><text x="12" y="20" font-size="20" text-anchor="middle">${speciesEmoji}</text></svg>`;

    const animalIcon = L.icon({
      iconUrl: `data:image/svg+xml,${encodeURIComponent(svg)}`,
      iconSize: [24, 24],
      popupAnchor: [0, -12]
    });

    // Create marker
    const marker = L.marker([animal.latitude, animal.longitude], { icon: animalIcon })
      .bindPopup(`<b>${animal.animal_code}</b><br/>${animal.species}`)
      .addTo(map);

    if (onClick) {
      marker.on('click', onClick);
    }

    markerRef.current = marker;

    return () => {
      if (markerRef.current) {
        map.removeLayer(markerRef.current);
      }
    };
  }, [map, animal]);

  return null;
};

export default AnimalMarker;
