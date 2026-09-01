"use client";

import { useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';

import { animalsAPI } from '../services/api';
import AnimalDetails from '../components/AnimalDetails';

const Map = dynamic(() => import('../components/Map'), { ssr: false });

interface Animal {
  id: string;
  animal_code: string;
  species: string;
  collar_id?: string;
  status: string;
  created_at: string;
}

const MAP_CENTER: [number, number] = [12.3456, 76.5432];

export default function AnimalsPage() {
  const [grouped, setGrouped] = useState<Record<string, Animal[]>>({});
  const [selected, setSelected] = useState<Animal | null>(null);
  const [map, setMap] = useState<any>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const response = await animalsAPI.getGrouped();
        const groups: Record<string, Animal[]> = response.data.groups || {};
        setGrouped(groups);

        const firstAnimal = Object.values(groups)[0]?.[0] || null;
        setSelected((current) => current || firstAnimal);
      } catch (error) {
        console.error('Failed to load grouped animals', error);
      }
    };

    load();
  }, []);

  const totals = useMemo(() => {
    const allAnimals = Object.values(grouped).flat();
    const activeAnimals = allAnimals.filter((animal) => animal.status.toLowerCase() === 'active').length;

    return {
      totalAnimals: allAnimals.length,
      totalSpecies: Object.keys(grouped).length,
      activeAnimals
    };
  }, [grouped]);

  return (
    <main className="app-shell">
      <section className="hero hero--compact">
        <div className="hero__copy">
          <span className="eyebrow">Animal Registry</span>
          <h1>Organized visibility for every monitored animal.</h1>
          <p>Browse grouped assets, inspect tracking history, and keep field context close.</p>
        </div>
        <div className="hero__actions">
          <nav className="top-nav" aria-label="Primary navigation">
            <Link href="/" className="top-nav__link">
              Mission Map
            </Link>
            <Link href="/animals" className="top-nav__link top-nav__link--active">
              Animal Registry
            </Link>
          </nav>
          <div className="status-chip">Catalog view</div>
        </div>
      </section>

      <section className="stats-grid">
        <article className="stat-card">
          <span className="stat-card__label">Total animals</span>
          <strong className="stat-card__value">{totals.totalAnimals}</strong>
          <span className="stat-card__note">Grouped from the existing registry feed</span>
        </article>
        <article className="stat-card">
          <span className="stat-card__label">Species groups</span>
          <strong className="stat-card__value">{totals.totalSpecies}</strong>
          <span className="stat-card__note">Monitoring organized by species</span>
        </article>
        <article className="stat-card">
          <span className="stat-card__label">Active animals</span>
          <strong className="stat-card__value">{totals.activeAnimals}</strong>
          <span className="stat-card__note">Currently marked active in the registry</span>
        </article>
      </section>

      <section className="registry-grid">
        <article className="surface-card">
          <div className="surface-card__header">
            <div>
              <span className="section-kicker">Grouped animals</span>
              <h2>Species catalog</h2>
            </div>
            <p>Choose an animal to load its profile and draw its recent path on the map.</p>
          </div>

          <div className="species-groups">
            {Object.keys(grouped).length === 0 ? (
              <div className="empty-state">No animals available.</div>
            ) : (
              Object.entries(grouped).map(([species, items]) => (
                <section key={species} className="species-card">
                  <div className="species-card__header">
                    <h3>{species}</h3>
                    <span>{items.length} records</span>
                  </div>
                  <div className="species-card__list">
                    {items.map((animal) => (
                      <button
                        key={animal.id}
                        type="button"
                        className={`list-row${selected?.id === animal.id ? ' list-row--active' : ''}`}
                        onClick={() => setSelected(animal)}
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

        <div className="registry-side">
          <article className="surface-card surface-card--map">
            <div className="surface-card__header">
              <div>
                <span className="section-kicker">Spatial context</span>
                <h2>Tracking canvas</h2>
              </div>
              <p>The detail view overlays seven-day GPS history onto this map.</p>
            </div>
            <div className="map-stage map-stage--compact">
              <Map center={MAP_CENTER} zoom={13} onMapReady={setMap} height="100%" />
            </div>
          </article>

          <article className="surface-card">
            <div className="surface-card__header">
              <div>
                <span className="section-kicker">Profile details</span>
                <h2>Selected record</h2>
              </div>
              <p>Registry metadata and GPS history remain connected to the existing APIs.</p>
            </div>
            <AnimalDetails animal={selected} onClose={() => setSelected(null)} map={map} />
          </article>
        </div>
      </section>
    </main>
  );
}



