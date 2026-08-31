"use client";

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { animalsAPI } from '../services/api';
import AnimalDetails from '../components/AnimalDetails';
import L from 'leaflet';

const Map = dynamic(() => import('../components/Map'), { ssr: false });

export default function AnimalsPage() {
  const [grouped, setGrouped] = useState<Record<string, any[]>>({});
  const [selected, setSelected] = useState<any | null>(null);
  const [map, setMap] = useState<L.Map | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await animalsAPI.getGrouped();
        setGrouped(res.data.groups || {});
      } catch (e) {
        console.error('Failed to load grouped animals', e);
      }
    };
    load();
  }, []);

  return (
    <main style={{ padding: 20 }}>
      <h2>Animals</h2>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 450px', gap: 20, marginTop: 12 }}>
        <div style={{ background: '#fff', borderRadius: 8, padding: 16 }}>
          {Object.keys(grouped).length === 0 ? (
            <p>No animals</p>
          ) : (
            Object.entries(grouped).map(([species, items]) => (
              <div key={species} style={{ marginBottom: 12 }}>
                <h4>{species} ({items.length})</h4>
                <ul>
                  {items.map(a => (
                    <li key={a.id} style={{ marginBottom: 6 }}>
                      <button onClick={() => setSelected(a)} style={{ background: 'none', border: 'none', color: '#0366d6', cursor: 'pointer' }}>{a.animal_code} • {a.status}</button>
                    </li>
                  ))}
                </ul>
              </div>
            ))
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ height: 420 }}>
            <Map center={[12.3456, 76.5432]} zoom={13} onMapReady={setMap} />
          </div>
          <div style={{ background: '#fff', borderRadius: 8, padding: 16 }}>
            <h3>Animal Details</h3>
            <AnimalDetails animal={selected} onClose={() => setSelected(null)} map={map} />
          </div>
        </div>
      </div>
    </main>
  );
}
