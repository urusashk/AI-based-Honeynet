import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import {
  INITIAL_HONEYPOTS,
  INITIAL_ATTACKERS,
  generateSimulatedEvent
} from '../data/mockData';
import { apiService, getStoredSettings, fetchCowrieLogs } from '../services/apiService';

const HoneynetContext = createContext();

function mapCowrieEventToDashboard(raw) {
  const { eventid = '', src_ip = '', username = '', password = '', input = '', timestamp = '' } = raw;
  const isAuthFailed = eventid.includes('login.failed') || eventid.includes('auth.failed');
  const isAuthSuccess = eventid.includes('login.success') || eventid.includes('auth.success');
  const isCommand = eventid.includes('command') || Boolean(input);

  let attackType = 'SSH Activity';
  let severity = 'Medium';
  let riskScore = 55;
  let mitreTactic = 'T1078 - Valid Accounts';

  if (isCommand) {
    attackType = 'Command Execution';
    severity = 'Critical';
    riskScore = 95;
    mitreTactic = 'T1059.004 - Unix Shell Execution';
  } else if (isAuthSuccess) {
    attackType = 'Successful Login';
    severity = 'Critical';
    riskScore = 90;
    mitreTactic = 'T1078.003 - Local Accounts';
  } else if (isAuthFailed) {
    attackType = 'Failed Login (Brute Force)';
    severity = 'High';
    riskScore = 80;
    mitreTactic = 'T1110.001 - Password Guessing';
  } else if (eventid.includes('connect')) {
    attackType = 'SSH Connection Probe';
    severity = 'Low';
    riskScore = 35;
    mitreTactic = 'T1046 - Network Service Discovery';
  }

  const userAttempt = username ? (password ? `${username}:${password}` : username) : (input || 'N/A');
  const details = input
    ? `Executed command: ${input}`
    : `Event ${eventid} from ${src_ip || 'unknown'} (User: ${username || 'N/A'}${password ? `, Pass: ${password}` : ''})`;

  const dateDisplay = timestamp ? timestamp.replace('T', ' ').substring(0, 19) : new Date().toISOString().replace('T', ' ').substring(0, 19);

  return {
    // Required fields from Cowrie
    eventid,
    src_ip,
    username,
    password,
    input,
    timestamp,

    // Aliases for component and dashboard compatibility
    id: `CW-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
    sourceIp: src_ip || '127.0.0.1',
    destinationService: 'Cowrie SSH Honeypot',
    destinationPort: 2222,
    attackType,
    usernameAttempted: userAttempt,
    severity,
    riskScore,
    mitreTactic,
    eventDetails: details,
    sessionActions: [
      { step: 1, time: dateDisplay.split(' ')[1] || '00:00:00', action: `Cowrie event: ${eventid}` },
      { step: 2, time: dateDisplay.split(' ')[1] || '00:00:00', action: input ? `Command entered: ${input}` : `Auth attempt: ${userAttempt}` }
    ],
    aiAnalysis: {
      classification: `${severity} Threat - ${attackType}`,
      confidence: 0.95,
      reasoning: `Ingested from live Cowrie honeypot log stream. Event ID: ${eventid}`,
      indicators: [
        `Source IP: ${src_ip}`,
        `Event ID: ${eventid}`,
        input ? `Input execution: ${input}` : `Attempted credentials: ${userAttempt}`
      ],
      recommendedActions: [
        'Inspect session commands and source IP in firewall',
        'Check attacker activity timeline in SOC dashboard'
      ]
    }
  };
}

export function HoneynetProvider({ children }) {
  // Pure live state - no mock events or fake attackers
  const [events, setEvents] = useState([]);
  const [honeypots, setHoneypots] = useState([
    {
      id: 'hp-cowrie',
      name: 'Cowrie SSH Honeypot',
      service: 'SSH / Telnet Emulation',
      container: 'cowrie-honeypot',
      port: 2222,
      internalIp: '127.0.0.1',
      status: 'active',
      riskLevel: 'high',
      eventCount: 0,
      uniqueAttackers: 0,
      lastActivity: 'Monitoring /logs/cowrie.json',
      description: 'Live Cowrie SSH honeypot streaming auth logs and terminal commands.',
      decoyType: 'Medium Interaction',
      dockerImage: 'cowrie/cowrie:latest',
      uptime: 'Active'
    }
  ]);
  const [attackers, setAttackers] = useState([]);
  const [isDemoStreaming, setIsDemoStreaming] = useState(false);
  const [streamSpeed, setStreamSpeed] = useState(4000);
  const [settings, setSettings] = useState(getStoredSettings());
  const [selectedEventId, setSelectedEventId] = useState(null);

  // Set to track unique signatures of seen events so only new events are added
  const seenEventKeysRef = useRef(new Set());
  const isFirstFetchRef = useRef(true);

  // Poll Cowrie honeypot logs every 3 seconds
  useEffect(() => {
    let isMounted = true;

    const pollLogs = async () => {
      try {
        const rawEvents = await fetchCowrieLogs();
        if (!isMounted) return;

        const newRawEvents = [];
        for (const raw of rawEvents) {
          // Construct unique key based on required fields: timestamp + eventid + src_ip + input + username + password
          const key = `${raw.timestamp}|${raw.eventid}|${raw.src_ip}|${raw.input}|${raw.username}|${raw.password}`;
          if (!seenEventKeysRef.current.has(key)) {
            seenEventKeysRef.current.add(key);
            newRawEvents.push(raw);
          }
        }

        if (newRawEvents.length > 0) {
          const mappedNew = newRawEvents.map(mapCowrieEventToDashboard);

          // Prepend newly discovered events (newest first)
          setEvents((prev) => [...mappedNew.reverse(), ...prev]);

          setSelectedEventId((prev) => prev || mappedNew[0]?.id);

          // Update honeypot activity counter
          setHoneypots((prev) =>
            prev.map((hp) =>
              hp.id === 'hp-cowrie'
                ? {
                    ...hp,
                    eventCount: hp.eventCount + newRawEvents.length,
                    lastActivity: 'Just now'
                  }
                : hp
            )
          );

          // Dynamically maintain unique real attackers
          setAttackers((prev) => {
            const currentIps = new Set(prev.map((a) => a.ip));
            const newAttackers = [];

            for (const item of mappedNew) {
              if (item.src_ip && !currentIps.has(item.src_ip)) {
                currentIps.add(item.src_ip);
                newAttackers.push({
                  ip: item.src_ip,
                  label: `Attacker (${item.src_ip})`,
                  origin: 'Live Cowrie Ingress',
                  firstSeen: item.timestamp || new Date().toISOString(),
                  lastSeen: item.timestamp || new Date().toISOString(),
                  totalEvents: 1,
                  mostTargetedService: 'Cowrie SSH Honeypot',
                  mostFrequentAttackType: item.attackType,
                  riskScore: item.riskScore,
                  status: 'Active',
                  reputation: 'Live Ingress',
                  osFingerprint: 'SSH Client',
                  toolsDetected: ['SSH Client'],
                  tacticsUsed: [item.mitreTactic?.split(' - ')[0] || 'Initial Access']
                });
              }
            }
            return newAttackers.length > 0 ? [...newAttackers, ...prev] : prev;
          });
        }
      } catch (err) {
        console.warn('Cowrie log fetch error (will retry in 3s):', err.message);
      } finally {
        isFirstFetchRef.current = false;
      }
    };

    // Initial fetch immediately, then poll every 3 seconds
    pollLogs();
    const intervalId = setInterval(pollLogs, 3000);

    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, []);

  // Background stream simulation when demo mode toggle is ON
  useEffect(() => {
    let timer;
    if (isDemoStreaming) {
      timer = setInterval(() => {
        const newEvent = generateSimulatedEvent();
        setEvents((prev) => [newEvent, ...prev.slice(0, 99)]); // keep latest 100

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

  // Compute live counters directly from Cowrie events state
  const totalEvents = events.length;
  const failedLogins = events.filter((e) => {
    const eid = (e.eventid || '').toLowerCase();
    return eid.includes('login.failed') || eid.includes('auth.failed');
  }).length;
  const successfulLogins = events.filter((e) => {
    const eid = (e.eventid || '').toLowerCase();
    return eid.includes('login.success') || eid.includes('auth.success');
  }).length;
  const uniqueAttackers = new Set(
    events.map((e) => e.src_ip || e.sourceIp).filter(Boolean)
  ).size;

  const getStats = () => {
    const criticalThreats = events.filter((e) => e.severity === 'Critical').length;
    return {
      totalEvents,
      failedLogins,
      successfulLogins,
      uniqueAttackers,
      activeHoneypots: 1,
      criticalThreats
    };
  };

  return (
    <HoneynetContext.Provider
      value={{
        events,
        setEvents,
        totalEvents,
        failedLogins,
        successfulLogins,
        uniqueAttackers,
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
