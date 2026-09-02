'use client';

import { useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import AnimalMarker from './components/AnimalMarker';
import AnimalDetails from './components/AnimalDetails';
import AlertPanel from './components/AlertPanel';
import { animalsAPI, gpsAPI, alertsAPI, simulationAPI } from './services/api';
import './page.css';

const Map = dynamic(() => import('./components/Map'), { ssr: false });

interface Animal {
  id: string;
  animal_code: string;
  species: string;
  collar_id?: string;
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
  species?: string;
  threat_type: string;
  severity: string;
  risk_score: number;
  description: string;
  investigation_summary?: string;
  gps_location?: { latitude: number; longitude: number };
  cctv_confirmed?: boolean;
  anomaly_detected?: boolean;
  status: string;
  created_at: string;
}

const MAP_CENTER: [number, number] = [12.3456, 76.5432];

export default function Home() {
  const [map, setMap] = useState<any>(null);
  const [animals, setAnimals] = useState<Animal[]>([]);
  const [grouped, setGrouped] = useState<Record<string, Animal[]>>({});
  const [selectedAnimal, setSelectedAnimal] = useState<Animal | null>(null);
  const [positions, setPositions] = useState<Record<string, GPSEvent | null>>({});
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [simulationRunning, setSimulationRunning] = useState(false);
  const [simulationStarting, setSimulationStarting] = useState(false);
  const [simulationMessage, setSimulationMessage] = useState('');

  useEffect(() => {
    simulationAPI.getStatus()
      .then((response) => setSimulationRunning(Boolean(response.data.running)))
      .catch((error) => console.warn('Failed to fetch simulation status:', error));
  }, []);

  useEffect(() => {
    const fetchAnimals = async () => {
      try {
        const response = await animalsAPI.getAll();
        const nextAnimals = response.data.animals || [];
        setAnimals(nextAnimals);

        try {
          const groupedResponse = await animalsAPI.getGrouped();
          setGrouped(groupedResponse.data.groups || {});
        } catch (error) {
          console.warn('Failed to fetch grouped animals:', error);
        }

        setSelectedAnimal((current) => {
          if (!current) {
            return nextAnimals[0] || null;
          }

          return nextAnimals.find((animal: Animal) => animal.id === current.id) || nextAnimals[0] || null;
        });
      } catch (error) {
        console.error('Failed to fetch animals:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAnimals();
    const interval = setInterval(fetchAnimals, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const unsubscribe = alertsAPI.subscribeToAlerts(
      (alert) => {
        setAlerts((previous) => {
          const exists = previous.some((item) => item.id === alert.id);
          if (exists) {
            return previous.map((item) => (item.id === alert.id ? alert : item));
          }
          return [alert, ...previous];
        });
      },
      (error) => {
        console.error('SSE connection error, falling back to polling:', error);

        const fetchAlerts = async () => {
          try {
            const response = await alertsAPI.getAll('DETECTED');
            setAlerts(response.data.alerts || []);
          } catch (pollError) {
            console.error('Failed to fetch alerts:', pollError);
          }
        };

        fetchAlerts();
        const interval = setInterval(fetchAlerts, 10000);
        return () => clearInterval(interval);
      }
    );

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const updateGPS = async () => {
      try {
        const nextPositions: Record<string, GPSEvent | null> = {};

        for (const animal of animals) {
          try {
            const response = await gpsAPI.getLatest(animal.id);
            nextPositions[animal.id] = response.data;
          } catch (error) {
            nextPositions[animal.id] = null;
          }
        }

        setPositions(nextPositions);
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
      setAlerts((previous) => previous.filter((alert) => alert.id !== alertId));
    } catch (error) {
      console.error('Failed to acknowledge alert:', error);
    }
  };

  const handleStartSimulation = async () => {
    setSimulationStarting(true);
    setSimulationMessage('');
    try {
      const response = await simulationAPI.start();
      setSimulationRunning(Boolean(response.data.running));
      setSimulationMessage(response.data.message || 'Animal simulation started');
    } catch (error) {
      console.error('Failed to start simulation:', error);
      setSimulationMessage('Could not start the simulation. Confirm the backend is running.');
    } finally {
      setSimulationStarting(false);
    }
  };

  const metrics = useMemo(() => {
    const activeAnimals = animals.filter((animal) => animal.status.toLowerCase() === 'active').length;
    const criticalAlerts = alerts.filter((alert) => alert.severity.toLowerCase() === 'critical').length;
    const trackedAnimals = Object.values(positions).filter(Boolean).length;

    return [
      { label: 'Tracked animals', value: String(animals.length), note: `${trackedAnimals} with fresh telemetry` },
      { label: 'Active collars', value: String(activeAnimals), note: 'Operational in the field' },
      { label: 'Open alerts', value: String(alerts.length), note: `${criticalAlerts} critical incidents` },
      { label: 'Coverage groups', value: String(Object.keys(grouped).length), note: 'Species monitoring clusters' }
    ];
  }, [animals, alerts, grouped, positions]);

  if (loading) {
    return <div className="loading-shell">Loading WildGuard command center...</div>;
  }

  return (
    <main className="app-shell">
      <section className="hero">
        <div className="hero__copy">
          <span className="eyebrow">WildGuard Control Room</span>
          <h1>Wildlife monitoring with a sharper operational surface.</h1>
          <p>
            Live telemetry, grouped field assets, and active threat signals in one
            enterprise-grade interface.
          </p>
        </div>
        <div className="hero__actions">
          <nav className="top-nav" aria-label="Primary navigation">
            <Link href="/" className="top-nav__link top-nav__link--active">
              Mission Map
            </Link>
            <Link href="/animals" className="top-nav__link">
              Animal Registry
            </Link>
          </nav>
          <div className="simulation-control">
            <button type="button" className="simulate-button" onClick={handleStartSimulation} disabled={simulationRunning || simulationStarting}>
              {simulationStarting ? 'Starting...' : simulationRunning ? 'Simulation running' : 'Simulate animals'}
            </button>
            {simulationMessage && <span className="simulation-message" role="status">{simulationMessage}</span>}
          </div>
        </div>
      </section>

      <section className="stats-grid">
        {metrics.map((metric) => (
          <article key={metric.label} className="stat-card">
            <span className="stat-card__label">{metric.label}</span>
            <strong className="stat-card__value">{metric.value}</strong>
            <span className="stat-card__note">{metric.note}</span>
          </article>
        ))}
      </section>

      <section className="dashboard-grid">
        <div className="workspace-column">
          <article className="surface-card surface-card--map">
            <div className="surface-card__header">
              <div>
                <span className="section-kicker">Monitoring map</span>
                <h2>Field coverage overview</h2>
              </div>
              <p>Telemetry updates every 15 seconds while alerts stream in real time.</p>
            </div>
            <div className="map-stage">
              <Map center={MAP_CENTER} zoom={13} onMapReady={setMap} height="100%" />
              <div className="map-stage__overlay">
                <span>Live zone</span>
                <strong>{selectedAnimal ? selectedAnimal.animal_code : 'No selection'}</strong>
              </div>
              <AlertMarkerManager map={map} alerts={alerts} />
              {animals.map((animal) => {
                const position = positions[animal.id];
                const latitude = position ? position.latitude : MAP_CENTER[0] + (Math.random() - 0.5) * 0.1;
                const longitude = position ? position.longitude : MAP_CENTER[1] + (Math.random() - 0.5) * 0.1;
                const hasAlert = alerts.some(
                  (alert) => alert.animal_id === animal.id && alert.status === 'DETECTED'
                );

                return (
                  <AnimalMarker
                    key={animal.id}
                    map={map}
                    animal={{ ...animal, latitude, longitude }}
                    alert={hasAlert}
                    onClick={() => setSelectedAnimal(animal)}
                  />
                );
              })}
            </div>
          </article>

          <div className="dashboard-subgrid">
            <article className="surface-card">
              <div className="surface-card__header">
                <div>
                  <span className="section-kicker">Species registry</span>
                  <h2>Animals by species</h2>
                </div>
                <p>Select an animal to inspect its status and seven-day trail.</p>
              </div>
              <div className="species-groups">
                {Object.keys(grouped).length === 0 ? (
                  <div className="empty-state">No grouped animals available.</div>
                ) : (
                  Object.entries(grouped).map(([species, items]) => (
                    <section key={species} className="species-card">
                      <div className="species-card__header">
                        <h3>{species}</h3>
                        <span>{items.length} monitored</span>
                      </div>
                      <div className="species-card__list">
                        {items.map((animal) => (
                          <button
                            key={animal.id}
                            type="button"
                            className={`list-row${selectedAnimal?.id === animal.id ? ' list-row--active' : ''}`}
                            onClick={() => setSelectedAnimal(animal)}
                          >
                            <span>{animal.animal_code}</span>
                            <span className={`status-pill status-pill--${animal.status.toLowerCase()}`}>
                              {animal.status}
                            </span>
                          </button>
                        ))}
                      </div>
                    </section>
                  ))
                )}
              </div>
            </article>

            <article className="surface-card">
              <div className="surface-card__header">
                <div>
                  <span className="section-kicker">Selected animal</span>
                  <h2>Tracking profile</h2>
                </div>
                <p>Selection syncs across the list, map markers, and alert interactions.</p>
              </div>
              <AnimalDetails animal={selectedAnimal} map={map} />
            </article>
          </div>
        </div>

        <aside className="sidebar-column">
          <article className="surface-card surface-card--alerts">
            <AlertPanel
              alerts={alerts}
              onAcknowledge={handleAcknowledge}
              onAlertClick={(alert) => {
                const animal = animals.find((item) => item.id === alert.animal_id);
                if (animal) {
                  setSelectedAnimal(animal);
                }
              }}
            />
          </article>
        </aside>
      </section>
    </main>
  );
}

function useAlertMarkers(map: any, alerts: Alert[]) {
  useEffect(() => {
    if (!map) {
      return;
    }

    const markers: any[] = [];
    let cancelled = false;

    import('leaflet')
      .then((leaflet) => {
        if (cancelled) {
          return;
        }

        alerts.forEach((alert) => {
          if (!alert.gps_location) {
            return;
          }

          const svg =
            '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><text x="12" y="20" font-size="20" text-anchor="middle">!</text></svg>';
          const icon = leaflet.icon({
            iconUrl: `data:image/svg+xml,${encodeURIComponent(svg)}`,
            iconSize: [28, 28],
            popupAnchor: [0, -14]
          });
          const marker = leaflet
            .marker([alert.gps_location.latitude, alert.gps_location.longitude], { icon })
            .addTo(map)
            .bindPopup(`<b>Alert:</b> ${alert.threat_type} (${alert.severity})`);
          markers.push(marker);
        });
      })
      .catch((error) => {
        console.error('Failed to load leaflet for alert markers:', error);
      });

    return () => {
      cancelled = true;
      markers.forEach((marker) => {
        try {
          map.removeLayer(marker);
        } catch (error) {}
      });
    };
  }, [map, alerts]);
}

function AlertMarkerManager({ map, alerts }: { map: any; alerts: Alert[] }) {
  useAlertMarkers(map, alerts);
  return null;
}
