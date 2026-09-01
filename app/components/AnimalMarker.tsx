'use client';

import React from 'react';

interface AnimalMarkerProps {
  map: any;
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
  const markerRef = React.useRef<any>(null);

  React.useEffect(() => {
    if (!map) {
      return;
    }

    if (typeof map.addLayer !== 'function' || typeof map.getPanes !== 'function') {
      return;
    }

    let active = true;

    const renderMarker = async () => {
      const L = (await import('leaflet')).default;
      if (!active) {
        return;
      }

      if (markerRef.current) {
        map.removeLayer(markerRef.current);
      }

      const speciesEmoji = (() => {
        const species = (animal.species || '').toLowerCase();
        if (species.includes('elephant')) return 'E';
        if (species.includes('tiger')) return 'T';
        if (species.includes('rhino')) return 'R';
        if (species.includes('leopard')) return 'L';
        if (species.includes('bear')) return 'B';
        if (species.includes('deer')) return 'D';
        if (species.includes('wild boar') || species.includes('boar')) return 'W';
        return 'A';
      })();

      const svg = alert
        ? '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 30 30"><circle cx="15" cy="15" r="14" fill="#b73232" /><text x="15" y="20" font-size="15" fill="white" text-anchor="middle">!</text></svg>'
        : `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 30 30"><circle cx="15" cy="15" r="14" fill="#1f89ff" /><text x="15" y="20" font-size="13" fill="white" text-anchor="middle">${speciesEmoji}</text></svg>`;

      const animalIcon = L.icon({
        iconUrl: `data:image/svg+xml,${encodeURIComponent(svg)}`,
        iconSize: [30, 30],
        popupAnchor: [0, -15]
      });

      const marker = L.marker([animal.latitude, animal.longitude], { icon: animalIcon }).bindPopup(
        `<b>${animal.animal_code}</b><br/>${animal.species}`
      );

      try {
        marker.addTo(map);
      } catch (error) {
        console.warn('Failed to add marker to map', error);
      }

      if (onClick) {
        marker.on('click', onClick);
      }

      markerRef.current = marker;
    };

    renderMarker();

    return () => {
      active = false;
      if (markerRef.current) {
        map.removeLayer(markerRef.current);
      }
    };
  }, [map, animal, onClick, alert]);

  return null;
};

export default AnimalMarker;
