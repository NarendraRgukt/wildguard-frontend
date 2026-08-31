'use client';

import React, { useEffect, useState } from 'react';
import { gpsAPI } from '../services/api';
import L from 'leaflet';

interface Animal {
  id: string;
  animal_code: string;
  species: string;
  collar_id?: string;
  status: string;
  created_at: string;
}

interface AnimalDetailsProps {
  animal: Animal | null;
  onClose?: () => void;
  map?: import('leaflet').Map | null;
}

const AnimalDetails: React.FC<AnimalDetailsProps> = ({ animal, onClose, map }) => {
  if (!animal) {
    return (
      <div className="animal-details">
        <p>No animal selected</p>
      </div>
    );
  }

  return (
    <div className="animal-details">
      <button onClick={onClose} className="close-btn">×</button>
      <h3>{animal.animal_code}</h3>
      <p className="small">Species: {animal.species}</p>
      <div>
        <h4>GPS History (last 7 days)</h4>
        <GPSHistoryList animalId={animal.id} map={map} />
      </div>
      <dl>
        <dt>Species:</dt>
        <dd>{animal.species}</dd>
        <dt>Collar ID:</dt>
        <dd>{animal.collar_id || 'N/A'}</dd>
        <dt>Status:</dt>
        <dd>
          <span className={`status-badge status-${animal.status.toLowerCase()}`}>
            {animal.status}
          </span>
        </dd>
        <dt>Created:</dt>
        <dd>{new Date(animal.created_at).toLocaleString()}</dd>
      </dl>
    </div>
  );
};

export default AnimalDetails;

// --- GPSHistoryList component ---

interface GPSEvent {
  latitude: number;
  longitude: number;
  speed?: number;
  heading?: number;
  timestamp: string;
}

const GPSHistoryList: React.FC<{ animalId: string; map?: L.Map | null }> = ({ animalId, map }) => {
  const [events, setEvents] = useState<GPSEvent[]>([]);

  useEffect(() => {
    let polyLayer: L.Layer | null = null;
    let markers: L.Marker[] = [];

    const fetchHistory = async () => {
      try {
        // request only last 7 days from backend using start/end params
        const end = new Date();
        const start = new Date(end.getTime() - 7 * 24 * 60 * 60 * 1000);
        const res = await gpsAPI.getHistory(animalId, { limit: 1000, start: start.toISOString(), end: end.toISOString() });
        const recent: GPSEvent[] = res.data.events || [];
        setEvents(recent.reverse());

        if (map && recent.length > 0) {
          const latlngs = recent.map(e => [e.latitude, e.longitude] as [number, number]);
          polyLayer = L.polyline(latlngs, { color: 'orange' }).addTo(map);
          // markers for history
          markers = recent.map(e => L.marker([e.latitude, e.longitude]).addTo(map));
          // fit map to bounds
          const bounds = L.latLngBounds(latlngs as any);
          map.fitBounds(bounds.pad(0.2));
        }
      } catch (err) {
        console.error('Failed to fetch GPS history:', err);
      }
    };

    fetchHistory();

    return () => {
      if (polyLayer && map) map.removeLayer(polyLayer);
      markers.forEach(m => map?.removeLayer(m));
    };
  }, [animalId, map]);

  if (events.length === 0) return <p>No GPS history for last 7 days.</p>;

  return (
    <div className="gps-history">
      <ul>
        {events.map((e, idx) => (
          <li key={idx}>{new Date(e.timestamp).toLocaleString()} — {e.latitude.toFixed(4)}, {e.longitude.toFixed(4)}</li>
        ))}
      </ul>
    </div>
  );
};
