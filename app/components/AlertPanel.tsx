'use client';

import React from 'react';

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

interface AlertPanelProps {
  alerts: Alert[];
  onAlertClick?: (alert: Alert) => void;
  onAcknowledge?: (alertId: string) => void;
}

const AlertPanel: React.FC<AlertPanelProps> = ({ alerts, onAlertClick, onAcknowledge }) => {
  const getSeverityClass = (severity: string) => {
    return `severity-${severity.toLowerCase()}`;
  };

  const getThreatIcon = (threatType: string) => {
    switch (threatType) {
      case 'railway':
        return '🚆';
      case 'village':
        return '🏠';
      default:
        return '⚠️';
    }
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
              onClick={() => onAlertClick?.(alert)}
            >
              <div className="alert-header">
                <span className="alert-icon">{getThreatIcon(alert.threat_type)}</span>
                <span className="alert-threat">{alert.threat_type.toUpperCase()}</span>
                <span className={`alert-severity ${getSeverityClass(alert.severity)}`}>
                  {alert.severity}
                </span>
              </div>
              <div className="alert-body">
                <p className="alert-description">{alert.description}</p>
                <p className="alert-risk">Risk: {alert.risk_score}/100</p>
              </div>
              <div className="alert-footer">
                <small>{new Date(alert.created_at).toLocaleString()}</small>
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
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default AlertPanel;
