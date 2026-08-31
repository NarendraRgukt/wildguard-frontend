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

  // Fetch alerts
  useEffect(() => {
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
  }, []);

  // Fetch latest GPS for each animal
  useEffect(() => {
    const updateGPS = async () => {
      try {
        for (const animal of animals) {
          await gpsAPI.getLatest(animal.id);
        }
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
          {animals.map(animal => (
            <AnimalMarker
              key={animal.id}
              map={map}
              animal={{
                ...animal,
                latitude: 12.3456 + (Math.random() - 0.5) * 0.1,
                longitude: 76.5432 + (Math.random() - 0.5) * 0.1
              }}
              onClick={() => setSelectedAnimal(animal)}
            />
          ))}
        </div>

        <div className="sidebar">
          <div className="panel details-panel">
            <h2>Animal Details</h2>
            <AnimalDetails
              animal={selectedAnimal}
              onClose={() => setSelectedAnimal(null)}
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
