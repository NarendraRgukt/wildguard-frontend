'use client';

import { useState, useEffect } from 'react';
import Map from './components/Map';
import AnimalMarker from './components/AnimalMarker';
import AnimalDetails from './components/AnimalDetails';
import AlertPanel from './components/AlertPanel';
import { animalsAPI, gpsAPI, alertsAPI } from './services/api';
import L from 'leaflet';
import './page.css';

interface Animal {
  id: string;
  animal_code: string;
  species: string;
  status: string;
  created_at: string;
}

interface GPSEvent {
  latitude: number;
  longitude: number;
  speed: number;
  heading: number;
  timestamp: string;
}

interface Alert {
  id: string;
  animal_id: string;
  threat_type: string;
  severity: string;
  risk_score: number;
  description: string;
  status: string;
  created_at: string;
}

export default function Home() {
  const [map, setMap] = useState<L.Map | null>(null);
  const [animals, setAnimals] = useState<Animal[]>([]);
  const [selectedAnimal, setSelectedAnimal] = useState<Animal | null>(null);
  const [positions, setPositions] = useState<Record<string, GPSEvent | null>>({});
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch animals
  useEffect(() => {
    const fetchAnimals = async () => {
      try {
        const response = await animalsAPI.getAll();
        setAnimals(response.data.animals || []);
        setLoading(false);
      } catch (error) {
        console.error('Failed to fetch animals:', error);
        setLoading(false);
      }
    };

    fetchAnimals();
    const interval = setInterval(fetchAnimals, 30000);
    return () => clearInterval(interval);
  }, []);

  // Subscribe to real-time alerts via SSE
  useEffect(() => {
    const unsubscribe = alertsAPI.subscribeToAlerts(
      (alert) => {
        // Add new alert to the beginning of the list
        setAlerts(prev => {
          // Check if alert already exists
          const exists = prev.some(a => a.id === alert.id);
          if (exists) {
            return prev.map(a => a.id === alert.id ? alert : a);
          }
          return [alert, ...prev];
        });
      },
      (error) => {
        console.error('SSE connection error, falling back to polling:', error);
        // Fallback to polling if SSE fails
        const fetchAlerts = async () => {
          try {
            const response = await alertsAPI.getAll('DETECTED');
            setAlerts(response.data.alerts || []);
          } catch (error) {
            console.error('Failed to fetch alerts:', error);
          }
        };
        
        fetchAlerts();
        const interval = setInterval(fetchAlerts, 10000);
        return () => clearInterval(interval);
      }
    );

    return () => unsubscribe();
  }, []);

  // Fetch latest GPS for each animal
  useEffect(() => {
    const updateGPS = async () => {
      try {
        const newPositions: Record<string, GPSEvent | null> = { ...positions };
        for (const animal of animals) {
          try {
            const resp = await gpsAPI.getLatest(animal.id);
            newPositions[animal.id] = resp.data;
          } catch (e) {
            newPositions[animal.id] = null;
          }
        }
        setPositions(newPositions);
      } catch (error) {
        console.error('Failed to fetch GPS:', error);
      }
    };

    if (animals.length > 0) {
      updateGPS();
      const interval = setInterval(updateGPS, 15000);
      return () => clearInterval(interval);
    }
  }, [animals]);

  const handleAcknowledge = async (alertId: string) => {
    try {
      await alertsAPI.acknowledge(alertId);
      setAlerts(alerts.filter(a => a.id !== alertId));
    } catch (error) {
      console.error('Failed to acknowledge alert:', error);
    }
  };

  if (loading) {
    return <div className="loading">Loading WildGuard...</div>;
  }

  return (
    <main className="dashboard">
      <header className="header">
        <h1>🐘 WildGuard MVP</h1>
        <p>Wildlife Early-Warning System</p>
      </header>

      <div className="container">
        <div className="panel map-panel">
          <Map
            center={[12.3456, 76.5432]}
            zoom={13}
            onMapReady={setMap}
          />
          <AlertMarkerManager map={map} alerts={alerts} />
          {animals.map(animal => (
            (() => {
              const pos = positions[animal.id];
              const lat = pos ? pos.latitude : 12.3456 + (Math.random() - 0.5) * 0.1;
              const lon = pos ? pos.longitude : 76.5432 + (Math.random() - 0.5) * 0.1;
              // Check if there's an active alert for this animal
              const hasAlert = alerts.some(a => a.animal_id === animal.id && a.status === 'DETECTED');
              return (
                <AnimalMarker
                  key={animal.id}
                  map={map}
                  animal={{ ...animal, latitude: lat, longitude: lon }}
                  alert={hasAlert}
                  onClick={() => setSelectedAnimal(animal)}
                />
              );
            })()
          ))}
        </div>

        <div className="sidebar">
          <div className="panel details-panel">
            <h2>Animal Details</h2>
            <AnimalDetails
              animal={selectedAnimal}
              onClose={() => setSelectedAnimal(null)}
              map={map}
            />
          </div>

          <div className="panel alerts-panel">
            <AlertPanel
              alerts={alerts}
              onAcknowledge={handleAcknowledge}
              onAlertClick={(alert) => {
                const animal = animals.find(a => a.id === alert.animal_id);
                if (animal) setSelectedAnimal(animal);
              }}
            />
          </div>
        </div>
      </div>
    </main>
  );
}

// Draw alert markers on map when alerts change
// This is outside component scope to keep map effect localized via hook
function useAlertMarkers(map: L.Map | null, alerts: Alert[]) {
  React.useEffect(() => {
    if (!map) return;
    const markers: L.Marker[] = [];

    alerts.forEach(a => {
      if (a.gps_location) {
        const svg = `<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\"><text x=\"12\" y=\"20\" font-size=\"20\" text-anchor=\"middle\">⚠</text></svg>`;
        const icon = L.icon({ iconUrl: `data:image/svg+xml,${encodeURIComponent(svg)}`, iconSize: [28, 28], popupAnchor: [0, -14] });
        const m = L.marker([a.gps_location.latitude, a.gps_location.longitude], { icon }).addTo(map).bindPopup(`<b>Alert:</b> ${a.threat_type} (${a.severity})`);
        markers.push(m);
      }
    });

    return () => {
      markers.forEach(m => map.removeLayer(m));
    };
  }, [map, alerts]);
}

// Hook usage: invoked by rendering component
function AlertMarkerManager({ map, alerts }: { map: L.Map | null; alerts: Alert[] }) {
  useAlertMarkers(map, alerts);
  return null;
}
