/**
 * IoT Registry Service
 * Simulates real-time sensor data from multiple gateways.
 */
import env from '../config/env';

class IoTRegistry {
  constructor() {
    this.subscribers = new Set();
    this.sensors = {
      [env.IOT_SENSORS.ALPHA]: { temp: 4.5, humidity: 45, battery: 92, lastUpdate: Date.now() },
      [env.IOT_SENSORS.BETA]: { temp: 2.1, humidity: 30, battery: 88, lastUpdate: Date.now() },
      [env.IOT_SENSORS.GAMMA]: { temp: -18.5, humidity: 20, battery: 75, lastUpdate: Date.now() }
    };
    
    this.startSimulation();
  }

  startSimulation() {
    setInterval(() => {
      Object.keys(this.sensors).forEach(id => {
        // Drift temperature slightly
        const min = env.TEMP_MIN;
        const max = env.TEMP_MAX;
        
        const drift = (Math.random() - 0.5) * 0.5;
        let newTemp = this.sensors[id].temp + drift;
        
        // Keep within reasonable bounds or simulate anomaly
        if (newTemp < min - 2) newTemp = min;
        if (newTemp > max + 5) newTemp = max;

        this.sensors[id].temp = parseFloat(newTemp.toFixed(1));
        this.sensors[id].lastUpdate = Date.now();
      });
      this.notifySubscribers();
    }, 3000);
  }

  subscribe(callback) {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }

  notifySubscribers() {
    this.subscribers.forEach(callback => callback(this.sensors));
  }

  getSensorData(id) {
    return this.sensors[id] || null;
  }
}

export const iotRegistry = new IoTRegistry();
