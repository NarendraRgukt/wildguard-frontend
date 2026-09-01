'use client';

import React, { useState } from 'react';

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

interface AlertPanelProps {
  alerts: Alert[];
  onAlertClick?: (alert: Alert) => void;
  onAcknowledge?: (alertId: string) => void;
}

const threatLabel = (value: string) => value.replace(/_/g, ' ').toUpperCase();

const threatIcon = (threatType: string) => {
  switch (threatType.toLowerCase()) {
    case 'railway':
      return 'RAIL';
    case 'village':
    case 'human_conflict':
      return 'HUMAN';
    default:
      return 'RISK';
  }
};

const AlertPanel: React.FC<AlertPanelProps> = ({ alerts, onAlertClick, onAcknowledge }) => {
  const [expandedAlertId, setExpandedAlertId] = useState<string | null>(null);

  const toggleExpand = (alertId: string) => {
    setExpandedAlertId((current) => (current === alertId ? null : alertId));
  };

  return (
    <div className="alert-panel">
      <div className="surface-card__header surface-card__header--tight">
        <div>
          <span className="section-kicker">Incident queue</span>
          <h2>Active alerts</h2>
        </div>
        <p>{alerts.length} incidents awaiting review or acknowledgement.</p>
      </div>

      {alerts.length === 0 ? (
        <div className="empty-state">No active alerts at the moment.</div>
      ) : (
        <div className="alert-list">
          {alerts.map((alert) => {
            const severity = alert.severity.toLowerCase();
            const expanded = expandedAlertId === alert.id;

            return (
              <article
                key={alert.id}
                className={`alert-card alert-card--${severity}`}
                onClick={() => {
                  toggleExpand(alert.id);
                  onAlertClick?.(alert);
                }}
              >
                <div className="alert-card__topline">
                  <span className="alert-badge">{threatIcon(alert.threat_type)}</span>
                  <div className="alert-card__title">
                    <strong>{threatLabel(alert.threat_type)}</strong>
                    <span>
                      {alert.species || 'Unknown species'} · {alert.animal_id}
                    </span>
                  </div>
                  <span className={`severity-tag severity-tag--${severity}`}>{alert.severity}</span>
                </div>

                <p className="alert-card__description">{alert.description}</p>

                <div className="alert-meta">
                  <div className="alert-meta__item">
                    <span>Risk score</span>
                    <strong>{alert.risk_score}/100</strong>
                  </div>
                  <div className="alert-meta__item">
                    <span>Created</span>
                    <strong>{new Date(alert.created_at).toLocaleTimeString()}</strong>
                  </div>
                </div>

                {(alert.cctv_confirmed || alert.anomaly_detected) && (
                  <div className="signal-row">
                    {alert.cctv_confirmed ? <span className="signal-pill">CCTV confirmed</span> : null}
                    {alert.anomaly_detected ? <span className="signal-pill">Anomaly detected</span> : null}
                  </div>
                )}

                {expanded ? (
                  <div className="alert-card__details">
                    {alert.gps_location ? (
                      <p>
                        Location: {alert.gps_location.latitude.toFixed(4)}, {alert.gps_location.longitude.toFixed(4)}
                      </p>
                    ) : null}
                    {alert.investigation_summary ? <p>{alert.investigation_summary}</p> : null}
                    <p>Status: {alert.status}</p>
                    <p>Logged: {new Date(alert.created_at).toLocaleString()}</p>
                  </div>
                ) : null}

                <div className="alert-card__footer">
                  <button
                    type="button"
                    className="ghost-btn"
                    onClick={(event) => {
                      event.stopPropagation();
                      toggleExpand(alert.id);
                    }}
                  >
                    {expanded ? 'Hide details' : 'View details'}
                  </button>
                  {alert.status === 'DETECTED' ? (
                    <button
                      type="button"
                      className="primary-btn"
                      onClick={(event) => {
                        event.stopPropagation();
                        onAcknowledge?.(alert.id);
                      }}
                    >
                      Acknowledge
                    </button>
                  ) : null}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AlertPanel;

