/**
 * Central API Service Layer for AI-Based Intelligent Honeynet
 *
 * This module is architected to seamlessly switch between local DEMO MOCK DATA
 * and a live backend (e.g., Python FastAPI / Flask / Cowrie collector)
 * by configuring the API URL in Settings or .env.
 *
 * Endpoints prepared:
 * - GET /api/overview
 * - GET /api/events
 * - GET /api/attackers
 * - GET /api/honeypots
 * - GET /api/analysis/:eventId
 */

import {
  INITIAL_HONEYPOTS,
  INITIAL_ATTACKERS,
  INITIAL_EVENTS,
  HOURLY_ATTACK_ACTIVITY,
  ATTACK_TYPE_DISTRIBUTION,
  SEVERITY_DISTRIBUTION
} from '../data/mockData';

// Stored settings in localStorage or defaults
const SETTINGS_KEY = 'honeynet_soc_settings';

export const getDefaultSettings = () => ({
  apiUrl: 'http://localhost:8000',
  useMockData: true,
  refreshInterval: 3000,
  cowrieLogPath: '/var/log/cowrie/cowrie.json',
  dockerSocket: 'unix:///var/run/docker.sock',
  aiEngineStatus: 'Simulated Engine Active',
  honeypotServicesStatus: '3 Decoys Active (Docker)',
  aiSensitivity: 'High (Aggressive Threshold)',
  alertThreshold: 75
});

export const getStoredSettings = () => {
  try {
    const item = localStorage.getItem(SETTINGS_KEY);
    return item ? { ...getDefaultSettings(), ...JSON.parse(item) } : getDefaultSettings();
  } catch {
    return getDefaultSettings();
  }
};

export const saveStoredSettings = (settings) => {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (e) {
    console.error('Failed to save settings to localStorage', e);
  }
};

class ApiService {
  constructor() {
    this.settings = getStoredSettings();
  }

  updateSettings(newSettings) {
    this.settings = { ...this.settings, ...newSettings };
    saveStoredSettings(this.settings);
  }

  async getOverview() {
    if (this.settings.useMockData) {
      // Simulate realistic async network delay
      await new Promise((r) => setTimeout(r, 120));
      return {
        isDemo: true,
        stats: {
          totalEvents: 1447,
          uniqueAttackers: 32,
          activeHoneypots: 3,
          criticalThreats: 197,
          avgRiskScore: 78.4,
          mitreTacticsObserved: 6
        },
        hourlyActivity: HOURLY_ATTACK_ACTIVITY,
        attackTypeDistribution: ATTACK_TYPE_DISTRIBUTION,
        severityDistribution: SEVERITY_DISTRIBUTION,
        recentEvents: INITIAL_EVENTS.slice(0, 5)
      };
    }

    try {
      const res = await fetch(`${this.settings.apiUrl}/api/overview`);
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      return await res.json();
    } catch (err) {
      console.warn('Backend unavailable, falling back to mock overview data:', err);
      return {
        isDemo: true,
        backendError: err.message,
        stats: {
          totalEvents: 1447,
          uniqueAttackers: 32,
          activeHoneypots: 3,
          criticalThreats: 197,
          avgRiskScore: 78.4,
          mitreTacticsObserved: 6
        },
        hourlyActivity: HOURLY_ATTACK_ACTIVITY,
        attackTypeDistribution: ATTACK_TYPE_DISTRIBUTION,
        severityDistribution: SEVERITY_DISTRIBUTION,
        recentEvents: INITIAL_EVENTS.slice(0, 5)
      };
    }
  }

  async getHoneypots() {
    if (this.settings.useMockData) {
      await new Promise((r) => setTimeout(r, 100));
      return { isDemo: true, honeypots: INITIAL_HONEYPOTS };
    }

    try {
      const res = await fetch(`${this.settings.apiUrl}/api/honeypots`);
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      return await res.json();
    } catch (err) {
      console.warn('Backend unavailable, falling back to mock honeypots:', err);
      return { isDemo: true, backendError: err.message, honeypots: INITIAL_HONEYPOTS };
    }
  }

  async getEvents(filters = {}) {
    if (this.settings.useMockData) {
      await new Promise((r) => setTimeout(r, 120));
      let events = [...INITIAL_EVENTS];

      if (filters.severity && filters.severity !== 'All') {
        events = events.filter((e) => e.severity.toLowerCase() === filters.severity.toLowerCase());
      }
      if (filters.attackType && filters.attackType !== 'All') {
        events = events.filter((e) => e.attackType === filters.attackType);
      }
      if (filters.search) {
        const q = filters.search.toLowerCase();
        events = events.filter(
          (e) =>
            e.sourceIp.toLowerCase().includes(q) ||
            e.destinationService.toLowerCase().includes(q) ||
            e.attackType.toLowerCase().includes(q) ||
            e.eventDetails.toLowerCase().includes(q)
        );
      }

      return { isDemo: true, events, total: events.length };
    }

    try {
      const params = new URLSearchParams(filters);
      const res = await fetch(`${this.settings.apiUrl}/api/events?${params}`);
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      return await res.json();
    } catch (err) {
      console.warn('Backend unavailable, falling back to mock events:', err);
      return { isDemo: true, backendError: err.message, events: INITIAL_EVENTS, total: INITIAL_EVENTS.length };
    }
  }

  async getAttackers() {
    if (this.settings.useMockData) {
      await new Promise((r) => setTimeout(r, 100));
      return { isDemo: true, attackers: INITIAL_ATTACKERS };
    }

    try {
      const res = await fetch(`${this.settings.apiUrl}/api/attackers`);
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      return await res.json();
    } catch (err) {
      console.warn('Backend unavailable, falling back to mock attackers:', err);
      return { isDemo: true, backendError: err.message, attackers: INITIAL_ATTACKERS };
    }
  }

  async getAnalysis(eventId) {
    if (this.settings.useMockData) {
      await new Promise((r) => setTimeout(r, 100));
      const evt = INITIAL_EVENTS.find((e) => e.id === eventId) || INITIAL_EVENTS[0];
      return { isDemo: true, event: evt, analysis: evt.aiAnalysis };
    }

    try {
      const res = await fetch(`${this.settings.apiUrl}/api/analysis/${eventId}`);
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      return await res.json();
    } catch (err) {
      console.warn('Backend unavailable, falling back to mock analysis:', err);
      const evt = INITIAL_EVENTS.find((e) => e.id === eventId) || INITIAL_EVENTS[0];
      return { isDemo: true, backendError: err.message, event: evt, analysis: evt.aiAnalysis };
    }
  }
}

/**
 * Fetch Cowrie logs from /logs/cowrie.json (proxied to http://localhost:3001/cowrie.json),
 * parse lines safely (skipping invalid/malformed lines), and extract the required fields:
 * eventid, src_ip, username, password, input, timestamp.
 */
export async function fetchCowrieLogs() {
  const response = await fetch('/logs/cowrie.json', {
    headers: { 'Cache-Control': 'no-cache' }
  });
  if (!response.ok) {
    throw new Error(`Failed to fetch cowrie logs: ${response.status} ${response.statusText}`);
  }

  const text = await response.text();
  const lines = text.split(/\r?\n/);
  const events = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    try {
      const obj = JSON.parse(trimmed);
      if (obj && typeof obj === 'object') {
        events.push({
          eventid: obj.eventid || '',
          src_ip: obj.src_ip || '',
          username: obj.username || '',
          password: obj.password || '',
          input: obj.input || '',
          timestamp: obj.timestamp || ''
        });
      }
    } catch {
      // Skip bad lines safely
    }
  }

  return events;
}

export const apiService = new ApiService();

