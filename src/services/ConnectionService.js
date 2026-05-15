/**
 * ConnectionService.js
 * Gestiona el estado de UI de integraciones (Garmin, Strava, etc.)
 * Los tokens de Strava se almacenan en Firestore vía serverless — nunca en localStorage.
 */

class ConnectionService {
  constructor() {
    this.storageKey = 'coreadapt_connections';
    this.connections = this.loadConnections();
  }

  loadConnections() {
    const saved = localStorage.getItem(this.storageKey);
    let connections = saved ? JSON.parse(saved) : {
      garmin: { connected: false, lastSync: null, data: {} },
      strava: { connected: false, lastSync: null, data: {} },
      apple_health: { connected: false, lastSync: null, data: {} },
      coros: { connected: false, lastSync: null, data: {} },
      alpha_intelligence: { connected: true, lastSync: new Date().toISOString(), data: {} }
    };

    // Migración ALPHA: eliminar NotebookLM si existe en caché antiguo
    if (connections.notebooklm) {
      delete connections.notebooklm;
      connections.alpha_intelligence = { connected: true, lastSync: new Date().toISOString(), data: {} };
      localStorage.setItem(this.storageKey, JSON.stringify(connections));
    }

    // Migración de seguridad: eliminar tokens que hayan quedado en localStorage
    if (connections.strava?.accessToken || connections.strava?.refreshToken) {
      const { accessToken, refreshToken, expiresAt, ...safeState } = connections.strava;
      connections.strava = safeState;
      localStorage.setItem(this.storageKey, JSON.stringify(connections));
    }

    return connections;
  }

  saveConnections() {
    localStorage.setItem(this.storageKey, JSON.stringify(this.connections));
  }

  getStravaAuthUrl() {
    const clientId = import.meta.env.VITE_STRAVA_CLIENT_ID;
    const redirectUri = import.meta.env.VITE_STRAVA_REDIRECT_URI;
    const scope = 'read,activity:read_all,profile:read_all';
    return `https://www.strava.com/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=${scope}&state=strava`;
  }

  getCorosAuthUrl() {
    return "#";
  }

  async exchangeStravaCode(code, uid) {
    if (!uid) throw new Error('Personal UID required to connect Strava');

    try {
      const response = await fetch('/api/strava-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, uid })
      });

      if (!response.ok) throw new Error('Failed to exchange Strava code');

      const data = await response.json();

      // Solo guardamos estado de UI — los tokens están en Firestore
      this.connections['strava'] = {
        connected: true,
        lastSync: new Date().toISOString(),
        data: {
          userName: data.athlete ? `${data.athlete.firstname} ${data.athlete.lastname}` : 'Atleta',
          profilePic: data.athlete?.profile || null
        }
      };

      this.saveConnections();
      return this.connections['strava'];
    } catch (error) {
      console.error('Error in exchangeStravaCode:', error);
      throw error;
    }
  }

  async connect(serviceId, code = null, uid = null) {
    if (serviceId === 'strava' && code) {
      return await this.exchangeStravaCode(code, uid);
    }

    // Conexión genérica simulada para otros servicios
    return new Promise((resolve) => {
      setTimeout(() => {
        this.connections[serviceId] = {
          connected: true,
          lastSync: new Date().toISOString(),
          data: { userName: "Athlete User" }
        };
        this.saveConnections();
        resolve(this.connections[serviceId]);
      }, 1500);
    });
  }

  disconnect(serviceId) {
    this.connections[serviceId] = { connected: false, lastSync: null, data: {} };
    this.saveConnections();
    return this.connections[serviceId];
  }

  getStatus(serviceId) {
    return this.connections[serviceId];
  }

  getAllStatus() {
    return this.connections;
  }
}

export const connectionService = new ConnectionService();
