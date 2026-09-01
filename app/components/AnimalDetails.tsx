'use client';

import React, { useEffect, useState } from 'react';
import { gpsAPI } from '../services/api';

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
  map?: any;
}

interface GPSEvent {
  latitude: number;
  longitude: number;
  speed?: number;
  heading?: number;
  timestamp: string;
}

const formatDate = (value: string) => new Date(value).toLocaleString();

const AnimalDetails: React.FC<AnimalDetailsProps> = ({ animal, onClose, map }) => {
  if (!animal) {
    return (
      <div className="empty-state empty-state--details">
        Select an animal from the registry or map to load its profile.
      </div>
    );
  }

  return (
    <div className="animal-details">
      {onClose ? (
        <button type="button" onClick={onClose} className="close-btn" aria-label="Close selected animal">
          x
        </button>
      ) : null}

      <div className="animal-details__hero">
        <div>
          <span className="section-kicker">Profile</span>
          <h3>{animal.animal_code}</h3>
          <p>{animal.species}</p>
        </div>
        <span className={`status-pill status-pill--${animal.status.toLowerCase()}`}>{animal.status}</span>
      </div>

      <div className="detail-grid">
        <div className="detail-card">
          <span className="detail-card__label">Collar ID</span>
          <strong>{animal.collar_id || 'Not assigned'}</strong>
        </div>
        <div className="detail-card">
          <span className="detail-card__label">Created</span>
          <strong>{formatDate(animal.created_at)}</strong>
        </div>
      </div>

      <div className="history-panel">
        <div className="history-panel__header">
          <h4>GPS history</h4>
          <span>Last 7 days</span>
        </div>
        <GPSHistoryList animalId={animal.id} map={map} />
      </div>
    </div>
  );
};

const GPSHistoryList: React.FC<{ animalId: string; map?: any }> = ({ animalId, map }) => {
  const [events, setEvents] = useState<GPSEvent[]>([]);

  useEffect(() => {
    let polyLayer: any = null;
    let markers: any[] = [];
    let cancelled = false;

    const fetchHistory = async () => {
      try {
        const end = new Date();
        const start = new Date(end.getTime() - 7 * 24 * 60 * 60 * 1000);
        const response = await gpsAPI.getHistory(animalId, {
          limit: 1000,
          start: start.toISOString(),
          end: end.toISOString()
        });
        const recent: GPSEvent[] = response.data.events || [];
        setEvents(recent.reverse());

        if (map && recent.length > 0) {
          const L = (await import('leaflet')).default;
          if (cancelled) {
            return;
          }

          const latlngs = recent.map((event) => [event.latitude, event.longitude] as [number, number]);
          polyLayer = L.polyline(latlngs, {
            color: '#2388ff',
            weight: 5,
            opacity: 0.82
          }).addTo(map);

          if (typeof polyLayer?.bringToFront === 'function') {
            polyLayer.bringToFront();
          }

          markers = recent.map((event) =>
            L.circleMarker([event.latitude, event.longitude], {
              radius: 4,
              color: '#9ad0ff',
              fillColor: '#2388ff',
              fillOpacity: 0.95
            }).addTo(map)
          );

          const bounds = L.latLngBounds(latlngs);
          map.fitBounds(bounds.pad(0.2));
        }
      } catch (error) {
        console.error('Failed to fetch GPS history:', error);
      }
    };

    fetchHistory();

    return () => {
      cancelled = true;
      if (polyLayer && map) {
        map.removeLayer(polyLayer);
      }
      markers.forEach((marker) => map?.removeLayer(marker));
    };
  }, [animalId, map]);

  if (events.length === 0) {
    return <p className="empty-state empty-state--inline">No GPS history for the last 7 days.</p>;
  }

  return (
    <div className="gps-history">
      {events.map((event, index) => (
        <div key={`${event.timestamp}-${index}`} className="timeline-row">
          <span className="timeline-row__dot" />
          <div className="timeline-row__content">
            <strong>{formatDate(event.timestamp)}</strong>
            <span>
              {event.latitude.toFixed(4)}, {event.longitude.toFixed(4)}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
};

export default AnimalDetails;
