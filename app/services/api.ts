import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Animals API
export const animalsAPI = {
  getAll: () => api.get('/animals'),
  getById: (id: string) => api.get(`/animals/${id}`),
  getTrajectory: (id: string) => api.get(`/animals/${id}/trajectory`),
  getGrouped: () => api.get('/animals/grouped'),
  create: (data: any) => api.post('/animals', data),
  update: (id: string, data: any) => api.put(`/animals/${id}`, data)
};

// GPS API
export const gpsAPI = {
  ingest: (data: any) => api.post('/gps', data),
  getLatest: (animalId: string) => api.get(`/gps/animal/${animalId}/latest`),
  getHistory: (animalId: string, opts?: { limit?: number; start?: string; end?: string }) => 
    api.get(`/gps/animal/${animalId}/history`, { params: opts })
};

// Alerts API
export const alertsAPI = {
  getAll: (status?: string) => api.get('/alerts', { params: { status } }),
  getById: (id: string) => api.get(`/alerts/${id}`),
  create: (data: any) => api.post('/alerts', data),
  acknowledge: (id: string) => api.post(`/alerts/${id}/acknowledge`),
  resolve: (id: string, resolution: string) => 
    api.post(`/alerts/${id}/resolve`, { resolution }),
  
  // Real-time SSE stream for alerts
  subscribeToAlerts: (onAlert: (alert: any) => void, onError?: (error: any) => void): (() => void) => {
    const eventSource = new EventSource(`${API_BASE_URL}/alerts/stream`);
    
    eventSource.addEventListener('message', (event) => {
      try {
        const alert = JSON.parse(event.data);
        onAlert(alert);
      } catch (e) {
        console.error('Failed to parse alert:', e);
      }
    });
    
    eventSource.addEventListener('error', (event) => {
      console.error('SSE connection error:', event);
      if (onError) onError(event);
      eventSource.close();
    });
    
    // Return unsubscribe function
    return () => {
      eventSource.close();
    };
  }
};

export default api;
