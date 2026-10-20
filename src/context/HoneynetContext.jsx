import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  INITIAL_EVENTS,
  INITIAL_HONEYPOTS,
  INITIAL_ATTACKERS,
  generateSimulatedEvent
} from '../data/mockData';
import { apiService, getStoredSettings } from '../services/apiService';

const HoneynetContext = createContext();

export function HoneynetProvider({ children }) {
  const [events, setEvents] = useState(INITIAL_EVENTS);
  const [honeypots, setHoneypots] = useState(INITIAL_HONEYPOTS);
  const [attackers, setAttackers] = useState(INITIAL_ATTACKERS);
  const [isDemoStreaming, setIsDemoStreaming] = useState(false);
  const [streamSpeed, setStreamSpeed] = useState(4000); // 4 seconds interval
  const [settings, setSettings] = useState(getStoredSettings());
  const [selectedEventId, setSelectedEventId] = useState(INITIAL_EVENTS[0].id);

  // Background stream simulation when demo mode toggle is ON
  useEffect(() => {
    let timer;
    if (isDemoStreaming) {
      timer = setInterval(() => {
        const newEvent = generateSimulatedEvent();
        setEvents((prev) => [newEvent, ...prev.slice(0, 49)]); // keep latest 50

        // Increment honeypot counter
        setHoneypots((prev) =>
          prev.map((hp) => {
            if (hp.name === newEvent.destinationService) {
              return { ...hp, eventCount: hp.eventCount + 1, lastActivity: 'Just now' };
            }
            return hp;
          })
        );
      }, streamSpeed);
    }
    return () => clearInterval(timer);
  }, [isDemoStreaming, streamSpeed]);

  const updateSettings = (newSettings) => {
    setSettings(newSettings);
    apiService.updateSettings(newSettings);
  };

  const getStats = () => {
    const totalEvents = 1447 + (events.length - INITIAL_EVENTS.length);
    const criticalThreats = events.filter((e) => e.severity === 'Critical').length + 190;
    const uniqueAttackers = attackers.length + 27;
    return {
      totalEvents,
      uniqueAttackers,
      activeHoneypots: 3,
      criticalThreats
    };
  };

  return (
    <HoneynetContext.Provider
      value={{
        events,
        setEvents,
        honeypots,
        setHoneypots,
        attackers,
        setAttackers,
        isDemoStreaming,
        setIsDemoStreaming,
        streamSpeed,
        setStreamSpeed,
        settings,
        updateSettings,
        selectedEventId,
        setSelectedEventId,
        getStats
      }}
    >
      {children}
    </HoneynetContext.Provider>
  );
}

export const useHoneynet = () => {
  const context = useContext(HoneynetContext);
  if (!context) {
    throw new Error('useHoneynet must be used within a HoneynetProvider');
  }
  return context;
};
