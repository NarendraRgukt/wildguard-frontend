'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
const Map = dynamic(() => import('./components/Map'), { ssr: false });
import AnimalMarker from './components/AnimalMarker';
import AnimalDetails from './components/AnimalDetails';
import AlertPanel from './components/AlertPanel';
import { animalsAPI, gpsAPI, alertsAPI } from './services/api';
import type L from 'leaflet';
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
  // removed in-page tabs; navigation uses pages
  const [map, setMap] = useState<L.Map | null>(null);
  const [animals, setAnimals] = useState<Animal[]>([]);
  const [grouped, setGrouped] = useState<Record<string, Animal[]>>({});
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
        // also fetch grouped animals for sidebar
        try {
          const g = await animalsAPI.getGrouped();
          setGrouped(g.data.groups || {});
        } catch (e) {
          console.warn('Failed to fetch grouped animals:', e);
        }
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1>🐘 WildGuard MVP</h1>
            <p>Wildlife Early-Warning System</p>
          </div>
          <nav style={{ display: 'flex', gap: 12 }}>
            <Link href="/" style={{ color: '#fff', fontWeight: 700 }}>Map</Link>
            <Link href="/animals" style={{ color: '#fff', fontWeight: 700 }}>Animals</Link>
          </nav>
        </div>
      </header>

      <div className="container">
        <div className="panel map-panel">
          {activeTab === 'map' ? (
            <>
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
            </>
          ) : (
            <div style={{ padding: 20 }}>
              <h3>All Animals</h3>
              {Object.keys(grouped).length === 0 ? (
                <p>No animals available</p>
              ) : (
                Object.entries(grouped).map(([species, items]) => (
                  <div key={species} style={{ marginBottom: 12 }}>
                    <h4 style={{ marginBottom: 6 }}>{species} ({items.length})</h4>
                    <ul>
                      {items.map(a => (
                        <li key={a.id} style={{ marginBottom: 4 }}>
                          <button onClick={() => { setSelectedAnimal(a); setActiveTab('map'); }} style={{ background: 'none', border: 'none', color: '#0366d6', cursor: 'pointer' }}>{a.animal_code} • {a.status}</button>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        <div className="sidebar">
          {/* Animal details moved to /animals page */}
          <div className="panel list-panel">
            <h2>Animals by Species</h2>
            <div className="grouped-list">
              {Object.keys(grouped).length === 0 ? (
                <p>No animals grouped</p>
              ) : (
                Object.entries(grouped).map(([species, items]) => (
                  <div key={species} className="species-group">
                    <h4>{species} ({items.length})</h4>
                    <ul>
                      {items.map(a => (
                                <li key={a.id}>
                                  <button onClick={() => { console.log('select animal', a); setSelectedAnimal(a); }} style={{ cursor: 'pointer', background: 'none', border: 'none', padding: 0, color: '#0366d6' }}>
                                    {a.animal_code} • {a.status}
                                  </button>
                                </li>
                      ))}
                    </ul>
                  </div>
                ))
              )}
            </div>
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
  useEffect(() => {
    if (!map) return;
    const markers: any[] = [];
    let cancelled = false;

    // Dynamically import Leaflet at runtime (client-side only)
    import('leaflet').then((leaflet) => {
      if (cancelled) return;
      alerts.forEach(a => {
        if (a.gps_location) {
          const svg = `<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\"><text x=\"12\" y=\"20\" font-size=\"20\" text-anchor=\"middle\">⚠</text></svg>`;
          const icon = leaflet.icon({ iconUrl: `data:image/svg+xml,${encodeURIComponent(svg)}`, iconSize: [28, 28], popupAnchor: [0, -14] });
          const m = leaflet.marker([a.gps_location.latitude, a.gps_location.longitude], { icon }).addTo(map).bindPopup(`<b>Alert:</b> ${a.threat_type} (${a.severity})`);
          markers.push(m);
        }
      });
    }).catch(err => {
      console.error('Failed to load leaflet for alert markers:', err);
    });

    return () => {
      cancelled = true;
      markers.forEach(m => {
        try { map.removeLayer(m); } catch (e) {}
      });
    };
  }, [map, alerts]);
}

// Hook usage: invoked by rendering component
function AlertMarkerManager({ map, alerts }: { map: L.Map | null; alerts: Alert[] }) {
  useAlertMarkers(map, alerts);
  return null;
}
