'use client';

import React from 'react';

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
}

const AnimalDetails: React.FC<AnimalDetailsProps> = ({ animal, onClose }) => {
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
