import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import {
  INITIAL_HONEYPOTS,
  INITIAL_ATTACKERS,
  generateSimulatedEvent
} from '../data/mockData';
import {
  apiService,
  getStoredSettings,
  fetchBackendEvents,
  fetchBackendSessions,
  fetchBackendStats,
  fetchBackendThreats
} from '../services/apiService';

const HoneynetContext = createContext();

function mapCowrieEventToDashboard(raw) {
  const {
    id: dbId,
    honeypot = 'cowrie',
    protocol = 'ssh',
    timestamp = '',
    session = '',
    eventid = '',
    src_ip = '',
    src_port = null,
    username = '',
    password = '',
    input = null,
    message = '',
    duration = null,
    dest_ip = null,
    dest_port = null,
    proto = null,
    alert_signature = null,
    alert_category = null,
    alert_severity = null,
    raw_json = ''
  } = raw;

  const isSuricata = (honeypot || '').toLowerCase() === 'suricata' || (eventid && eventid.startsWith('suricata.'));
  const isHeralding = (honeypot || '').toLowerCase() === 'heralding' || eventid === 'heralding.auth';
  const isAuthFailed = eventid && (eventid.includes('login.failed') || eventid.includes('auth.failed'));
  const isAuthSuccess = eventid && (eventid.includes('login.success') || eventid.includes('auth.success'));
  const isCommand = (eventid && eventid.includes('command')) || Boolean(input);
  const isConnect = eventid && eventid.includes('session.connect');
  const isClosed = eventid && eventid.includes('session.closed');

  let attackType = isSuricata
    ? (alert_signature || 'Suricata IDS Alert')
    : isHeralding
    ? `${(protocol || 'auth').toUpperCase()} Credential Probe`
    : 'SSH Activity';

  let severity = 'Medium';
  let riskScore = 55;
  let mitreTactic = 'T1110.001 - Password Guessing';

  if (isSuricata) {
    // Suricata severity: 1 = High/Critical, 2 = Medium, 3 = Low, 4 = Info
    if (alert_severity === 1) {
      severity = 'Critical';
      riskScore = 95;
    } else if (alert_severity === 2) {
      severity = 'High';
      riskScore = 75;
    } else if (alert_severity === 3) {
      severity = 'Medium';
      riskScore = 50;
    } else {
      severity = 'Low';
      riskScore = 30;
    }
    mitreTactic = alert_category || 'T1046 - Network Service Discovery';
  } else if (isCommand) {
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
  } else if (isHeralding) {
    attackType = `${(protocol || 'AUTH').toUpperCase()} Auth Capture`;
    severity = 'High';
    riskScore = 78;
    mitreTactic = 'T1110 - Brute Force';
  } else if (isConnect) {
    attackType = 'SSH Connection Probe';
    severity = 'Low';
    riskScore = 35;
    mitreTactic = 'T1046 - Network Service Discovery';
  } else if (isClosed) {
    attackType = 'Session Closed';
    severity = 'Low';
    riskScore = 20;
    mitreTactic = 'T1078 - Defense Evasion';
  }

  // Construct descriptive action based on event type
  let actionDescription = message || `Event: ${eventid}`;
  if (isSuricata) {
    actionDescription = `[Suricata Alert] ${alert_signature || 'Network Rule Triggered'} (Severity: ${alert_severity || 'N/A'}, Target: ${dest_ip || 'honeynet'}:${dest_port || 'any'})`;
  } else if (isHeralding) {
    actionDescription = `Captured ${(protocol || 'unknown').toUpperCase()} credentials (User: "${username || 'N/A'}", Pass: "${password || 'N/A'}") on port ${src_port || 'unknown'}`;
  } else if (isAuthFailed) {
    actionDescription = `Login failed (User: "${username || 'N/A'}", Pass: "${password || 'N/A'}")`;
  } else if (isAuthSuccess) {
    actionDescription = `Login succeeded (User: "${username || 'N/A'}", Pass: "${password || 'N/A'}")`;
  } else if (isCommand) {
    actionDescription = `Executed command: ${input}`;
  } else if (isConnect) {
    actionDescription = `Connection opened from ${src_ip || 'unknown'}:${src_port || 'unknown'}`;
  } else if (isClosed) {
    actionDescription = `Session closed (Duration: ${duration !== null ? duration + 's' : 'N/A'})`;
  }

  const userAttempt = username ? (password ? `${username}:${password}` : username) : (input || (alert_signature ? alert_signature : 'N/A'));
  const details = input
    ? `Executed command: ${input}`
    : actionDescription;

  const dateDisplay = timestamp ? timestamp.replace('T', ' ').substring(0, 19) : new Date().toISOString().replace('T', ' ').substring(0, 19);

  const destinationService = isSuricata
    ? `Suricata NIDS (${(proto || protocol || 'TCP').toUpperCase()})`
    : isHeralding
    ? `Heralding (${(protocol || 'Multi-Protocol').toUpperCase()})`
    : 'Cowrie SSH Honeypot';

  return {
    // Exact Cowrie, Heralding & Suricata field names preserved
    id: dbId ? `DB-${dbId}` : `EVT-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
    db_id: dbId,
    honeypot: honeypot || (isSuricata ? 'suricata' : isHeralding ? 'heralding' : 'cowrie'),
    protocol: protocol || proto || (isSuricata ? 'tcp' : isHeralding ? 'auth' : 'ssh'),
    timestamp,
    session,
    eventid,
    src_ip,
    src_port,
    dest_ip,
    dest_port,
    proto,
    alert_signature,
    alert_category,
    alert_severity,
    alert_count: raw.alert_count || 1,
    username,
    password,
    input,
    message,
    duration,
    raw_json,

    // Aliases for component and dashboard compatibility
    sourceIp: src_ip || '127.0.0.1',
    destinationService,
    destinationPort: dest_port || src_port || (isSuricata ? 0 : isHeralding ? 80 : 2222),
    attackType,
    usernameAttempted: userAttempt,
    severity,
    riskScore,
    mitreTactic,
    eventDetails: details,
    sessionActions: [
      { step: 1, time: dateDisplay.split(' ')[1] || '00:00:00', action: actionDescription }
    ],
    aiAnalysis: {
      classification: `${severity} Threat - ${attackType}`,
      confidence: 0.95,
      reasoning: `Ingested from ${(honeypot || 'decoy').toUpperCase()} sensor via SQLite. Event ID: ${eventid}`,
      indicators: [
        `Honeypot: ${honeypot}`,
        `Protocol: ${protocol || proto}`,
        `Source IP: ${src_ip}:${src_port || ''}`,
        dest_ip ? `Destination: ${dest_ip}:${dest_port || ''}` : '',
        alert_signature ? `Rule Signature: ${alert_signature}` : '',
        input ? `Command: ${input}` : `Captured auth: ${userAttempt}`
      ].filter(Boolean),
      recommendedActions: [
        `Inspect ${((protocol || proto) || 'traffic').toUpperCase()} traffic from ${src_ip}`,
        'Review complete honeypot audit trail'
      ]
    }
  };
}

export function HoneynetProvider({ children }) {
  // Pure live state - no mock events or fake attackers
  const [events, setEvents] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [backendStats, setBackendStats] = useState({
    totalEvents: 0,
    failedLogins: 0,
    successfulLogins: 0,
    uniqueAttackers: 0,
    countsPerHoneypot: { cowrie: 0, heralding: 0, suricata: 0 },
    countsPerProtocol: {},
    alertsBySignature: [],
    alertsBySeverity: {}
  });

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
      lastActivity: 'Monitoring port 3001',
      description: 'Live Cowrie SSH honeypot streaming auth logs and terminal commands.',
      decoyType: 'Medium Interaction',
      dockerImage: 'cowrie/cowrie:latest',
      uptime: 'Active'
    },
    {
      id: 'hp-heralding',
      name: 'Heralding Honeypot',
      service: 'FTP / Telnet / HTTP / POP3 / VNC',
      container: 'heralding-honeypot',
      port: 3002,
      internalIp: '127.0.0.1',
      status: 'active',
      riskLevel: 'critical',
      eventCount: 0,
      uniqueAttackers: 0,
      lastActivity: 'Monitoring port 3002',
      description: 'Credentials-catching multi-protocol decoy trapping cleartext authentication probes.',
      decoyType: 'Low Interaction',
      dockerImage: 'heralding/heralding:latest',
      uptime: 'Active'
    },
    {
      id: 'hp-suricata',
      name: 'Suricata Network IDS',
      service: 'Deep Packet Inspection / Threat Detection',
      container: 'suricata-nids',
      port: 3003,
      internalIp: '127.0.0.1',
      status: 'active',
      riskLevel: 'critical',
      eventCount: 0,
      uniqueAttackers: 0,
      lastActivity: 'Monitoring port 3003',
      description: 'Intrusion Detection System analyzing live honeynet packets and firing security signatures.',
      decoyType: 'Network IDS',
      dockerImage: 'suricata/suricata:latest',
      uptime: 'Active'
    }
  ]);
  const [attackers, setAttackers] = useState([]);
  const [threats, setThreats] = useState([]);
  const [highRiskCount, setHighRiskCount] = useState(0);
  const [sessionsTrainedOn, setSessionsTrainedOn] = useState(0);
  const [isDemoStreaming, setIsDemoStreaming] = useState(false);
  const [streamSpeed, setStreamSpeed] = useState(4000);
  const [settings, setSettings] = useState(getStoredSettings());
  const [selectedEventId, setSelectedEventId] = useState(null);

  // Poll backend /api/events, /api/sessions, /api/stats, and /api/threats every 3 seconds
  useEffect(() => {
    let isMounted = true;

    const pollBackend = async () => {
      try {
        const [eventsData, sessionsData, statsData, threatsData] = await Promise.all([
          fetchBackendEvents({ limit: 500 }).catch(() => null),
          fetchBackendSessions(100).catch(() => null),
          fetchBackendStats().catch(() => null),
          fetchBackendThreats().catch(() => null)
        ]);

        if (!isMounted) return;

        if (statsData) {
          setBackendStats(statsData);
        }

        if (threatsData && Array.isArray(threatsData.threats)) {
          setThreats(threatsData.threats);
          setHighRiskCount(threatsData.highRiskCount || 0);
          if (threatsData.sessionsTrainedOn) {
            setSessionsTrainedOn(threatsData.sessionsTrainedOn);
          }
          if (threatsData.attackers && threatsData.attackers.length > 0) {
            setAttackers(threatsData.attackers);
          }
        }

        if (eventsData && Array.isArray(eventsData.events)) {
          const mapped = eventsData.events.map(mapCowrieEventToDashboard);
          setEvents(mapped);

          if (!selectedEventId && mapped.length > 0) {
            setSelectedEventId(mapped[0].id);
          }

          // Update honeypot counters based on backend breakdown
          const cowrieCount = statsData?.countsPerHoneypot?.cowrie || mapped.filter((e) => e.honeypot === 'cowrie').length;
          const heraldingCount = statsData?.countsPerHoneypot?.heralding || mapped.filter((e) => e.honeypot === 'heralding').length;
          const suricataCount = statsData?.countsPerHoneypot?.suricata || mapped.filter((e) => e.honeypot === 'suricata').length;

          setHoneypots((prev) =>
            prev.map((hp) => {
              if (hp.id === 'hp-cowrie') {
                return {
                  ...hp,
                  eventCount: cowrieCount,
                  lastActivity: 'Active'
                };
              }
              if (hp.id === 'hp-heralding') {
                return {
                  ...hp,
                  eventCount: heraldingCount,
                  lastActivity: 'Active'
                };
              }
              if (hp.id === 'hp-suricata') {
                return {
                  ...hp,
                  eventCount: suricataCount,
                  lastActivity: 'Active'
                };
              }
              return hp;
            })
          );

          // Extract unique real attackers from backend events
          const uniqueIps = Array.from(new Set(mapped.map((e) => e.src_ip).filter(Boolean)));
          const attackerList = uniqueIps.map((ip) => {
            const ipEvents = mapped.filter((e) => e.src_ip === ip);
            const firstEvt = ipEvents[ipEvents.length - 1];
            const latestEvt = ipEvents[0];
            return {
              ip,
              label: `Attacker (${ip})`,
              origin: `${latestEvt?.honeypot?.toUpperCase() || 'Honeynet'} Ingress`,
              firstSeen: firstEvt?.timestamp || new Date().toISOString(),
              lastSeen: latestEvt?.timestamp || new Date().toISOString(),
              totalEvents: ipEvents.length,
              mostTargetedService: latestEvt?.destinationService || 'Honeypot Decoy',
              mostFrequentAttackType: latestEvt?.attackType || 'Auth Probe',
              riskScore: latestEvt?.riskScore || 50,
              status: 'Active',
              reputation: 'Live Ingress',
              osFingerprint: `${latestEvt?.protocol?.toUpperCase() || 'TCP'} Client`,
              toolsDetected: [`${latestEvt?.protocol?.toUpperCase() || 'TCP'} Scanner`],
              tacticsUsed: [latestEvt?.mitreTactic?.split(' - ')[0] || 'Initial Access']
            };
          });
          setAttackers(attackerList);
        }

        if (sessionsData && Array.isArray(sessionsData.sessions)) {
          setSessions(sessionsData.sessions);
        }
      } catch (err) {
        console.warn('Backend polling error (retrying in 3s):', err.message);
      }
    };

    pollBackend();
    const intervalId = setInterval(pollBackend, 3000);

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
      }, streamSpeed);
    }
    return () => clearInterval(timer);
  }, [isDemoStreaming, streamSpeed]);

  const updateSettings = (newSettings) => {
    setSettings(newSettings);
    apiService.updateSettings(newSettings);
  };

  // Compute live counters directly from events state and backend stats
  const totalEvents = backendStats.totalEvents || events.length;
  const failedLogins = backendStats.failedLogins || events.filter((e) => {
    const eid = (e.eventid || '').toLowerCase();
    return eid.includes('login.failed') || eid.includes('auth.failed') || eid === 'heralding.auth';
  }).length;
  const successfulLogins = backendStats.successfulLogins || events.filter((e) => {
    const eid = (e.eventid || '').toLowerCase();
    return eid.includes('login.success') || eid.includes('auth.success');
  }).length;
  const uniqueAttackers = backendStats.uniqueAttackers || new Set(
    events.map((e) => e.src_ip || e.sourceIp).filter(Boolean)
  ).size;

  const countsPerHoneypot = backendStats.countsPerHoneypot || {
    cowrie: events.filter((e) => e.honeypot === 'cowrie').length,
    heralding: events.filter((e) => e.honeypot === 'heralding').length,
    suricata: events.filter((e) => e.honeypot === 'suricata').length
  };

  const countsPerProtocol = backendStats.countsPerProtocol || {};
  const alertsBySignature = backendStats.alertsBySignature || [];
  const alertsBySeverity = backendStats.alertsBySeverity || {};

  const getStats = () => {
    const criticalThreats = events.filter((e) => e.severity === 'Critical').length;
    return {
      totalEvents,
      failedLogins,
      successfulLogins,
      uniqueAttackers,
      countsPerHoneypot,
      countsPerProtocol,
      alertsBySignature,
      alertsBySeverity,
      activeHoneypots: 3,
      criticalThreats
    };
  };

  return (
    <HoneynetContext.Provider
      value={{
        events,
        setEvents,
        sessions,
        setSessions,
        totalEvents,
        failedLogins,
        successfulLogins,
        uniqueAttackers,
        countsPerHoneypot,
        countsPerProtocol,
        alertsBySignature,
        alertsBySeverity,
        backendStats,
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
        threats,
        setThreats,
        highRiskCount,
        sessionsTrainedOn,
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
