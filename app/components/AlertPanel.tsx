'use client';

import React, { useState } from 'react';

interface Alert {
  id: string;
  animal_id: string;
  species: string;
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

const AlertPanel: React.FC<AlertPanelProps> = ({ alerts, onAlertClick, onAcknowledge }) => {
  const [expandedAlertId, setExpandedAlertId] = useState<string | null>(null);

  const getSeverityClass = (severity: string) => {
    return `severity-${severity.toLowerCase()}`;
  };

  const getSeverityEmoji = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'critical':
        return '🔴';
      case 'high':
        return '🟠';
      case 'medium':
        return '🟡';
      case 'low':
        return '🟢';
      default:
        return '⚠️';
    }
  };

  const getThreatIcon = (threatType: string) => {
    switch (threatType.toLowerCase()) {
      case 'railway':
        return '🚆';
      case 'village':
      case 'human_conflict':
        return '👥';
      default:
        return '⚠️';
    }
  };

  const toggleExpand = (alertId: string) => {
    setExpandedAlertId(expandedAlertId === alertId ? null : alertId);
  };

  return (
    <div className="alert-panel">
      <h2>Active Alerts ({alerts.length})</h2>
      {alerts.length === 0 ? (
        <p className="no-alerts">No active alerts</p>
      ) : (
        <ul className="alert-list">
          {alerts.map((alert) => (
            <li
              key={alert.id}
              className={`alert-item ${getSeverityClass(alert.severity)}`}
            >
              <div 
                className="alert-header"
                onClick={() => toggleExpand(alert.id)}
                style={{ cursor: 'pointer' }}
              >
                <span className="alert-icon">{getThreatIcon(alert.threat_type)}</span>
                <div className="alert-title-section">
                  <span className="alert-threat">{alert.threat_type.replace('_', ' ').toUpperCase()}</span>
                  <span className="alert-animal"> • {alert.species} {alert.animal_id}</span>
                </div>
                <span className={`alert-severity ${getSeverityClass(alert.severity)}`}>
                  {getSeverityEmoji(alert.severity)} {alert.severity}
                </span>
              </div>

              <div className="alert-body">
                <p className="alert-description">{alert.description}</p>
                
                <div className="alert-metrics">
                  <div className="metric">
                    <span className="metric-label">Risk Score:</span>
                    <span className="metric-value">{alert.risk_score}/100</span>
                  </div>
                  {alert.gps_location && (
                    <div className="metric">
                      <span className="metric-label">Location:</span>
                      <span className="metric-value">
                        {alert.gps_location.latitude.toFixed(4)}°, {alert.gps_location.longitude.toFixed(4)}°
                      </span>
                    </div>
                  )}
                </div>

                <div className="alert-confirmations">
                  {alert.cctv_confirmed && (
                    <span className="confirmation cctv">✓ CCTV Confirmed</span>
                  )}
                  {alert.anomaly_detected && (
                    <span className="confirmation anomaly">✓ Anomaly Detected</span>
                  )}
                </div>

                {expandedAlertId === alert.id && (
                  <div className="alert-details">
                    {alert.investigation_summary && (
                      <div className="investigation-section">
                        <h4>Investigation Summary</h4>
                        <p>{alert.investigation_summary}</p>
                      </div>
                    )}
                    <div className="alert-info">
                      <p><strong>Status:</strong> {alert.status}</p>
                      <p><strong>Created:</strong> {new Date(alert.created_at).toLocaleString()}</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="alert-footer">
                <small>{new Date(alert.created_at).toLocaleTimeString()}</small>
                {alert.status === 'DETECTED' && (
                  <button
                    className="acknowledge-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      onAcknowledge?.(alert.id);
                    }}
                  >
                    Acknowledge
                  </button>
                )}
                <button
                  className="expand-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleExpand(alert.id);
                  }}
                >
                  {expandedAlertId === alert.id ? '▼' : '▶'}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default AlertPanel;
