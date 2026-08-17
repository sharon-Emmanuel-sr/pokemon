export class NetworkClient {
  constructor(options = {}) {
    this.url = options.url || this.getDefaultUrl();
    this.ws = null;
    this.listeners = new Map();
    this.isConnected = false;
    this.pingInterval = null;
    this.reconnectTimer = null;
  }

  getDefaultUrl() {
    if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_WS_URL) {
      return import.meta.env.VITE_WS_URL;
    }
    if (typeof window !== 'undefined' && window.location) {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = window.location.hostname || 'localhost';
      return `${protocol}//${host}:8080`;
    }
    return 'ws://localhost:8080';
  }

  setUrl(newUrl) {
    if (newUrl && newUrl !== this.url) {
      this.url = newUrl;
      if (this.isConnected) {
        this.disconnect();
        this.connect();
      }
    }
  }

  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event).add(callback);
    return () => this.listeners.get(event).delete(callback);
  }

  emit(event, data) {
    if (this.listeners.has(event)) {
      for (const cb of this.listeners.get(event)) {
        try {
          cb(data);
        } catch (e) {
          console.error(`Error in listener for ${event}:`, e);
        }
      }
    }
  }

  connect(customUrl = null) {
    if (customUrl) {
      this.url = customUrl;
    }

    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      try {
        console.log(`[NetworkClient] Connecting to ${this.url}...`);
        this.ws = new WebSocket(this.url);

        this.ws.onopen = () => {
          console.log(`[NetworkClient] Connected successfully to ${this.url}`);
          this.isConnected = true;
          this.emit('connected', { url: this.url });
          this.startHeartbeat();
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            this.emit(data.type, data);
          } catch (err) {
            console.error('Failed to parse incoming WebSocket message:', err);
          }
        };

        this.ws.onclose = () => {
          this.isConnected = false;
          this.stopHeartbeat();
          this.emit('disconnected');
        };

        this.ws.onerror = (err) => {
          console.warn('[NetworkClient] Connection error on', this.url);
          this.emit('error', err);
          reject(err);
        };
      } catch (err) {
        reject(err);
      }
    });
  }

  startHeartbeat() {
    this.stopHeartbeat();
    this.pingInterval = setInterval(() => {
      if (this.isConnected && this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.send({ type: 'ping' });
      }
    }, 25000);
  }

  stopHeartbeat() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  send(data) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    } else {
      console.warn('Cannot send message, WebSocket is not open.');
    }
  }

  createRoom(playerName, teamSize = 3) {
    this.send({
      type: 'create_room',
      playerName,
      teamSize
    });
  }

  joinRoom(roomCode, playerName) {
    this.send({
      type: 'join_room',
      roomCode,
      playerName
    });
  }

  setTeamSize(teamSize) {
    this.send({
      type: 'set_team_size',
      teamSize
    });
  }

  submitTeam(team) {
    this.send({
      type: 'submit_team',
      team
    });
  }

  submitAction(action) {
    this.send({
      type: 'submit_action',
      action
    });
  }

  submitForcedSwitch(targetIndex) {
    this.send({
      type: 'submit_forced_switch',
      targetIndex
    });
  }

  rematch() {
    this.send({
      type: 'rematch'
    });
  }

  leaveRoom() {
    this.send({
      type: 'leave_room'
    });
  }

  disconnect() {
    this.stopHeartbeat();
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.isConnected = false;
  }
}
