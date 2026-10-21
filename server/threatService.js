import db from './db.js';
import { IsolationForest } from './isolationForest.js';

// Single shared suspicious command keywords list: wget, curl, chmod, passwd, crontab, nc, netcat, tftp, ftp
export const SUSPICIOUS_COMMAND_KEYWORDS = [
  'wget',
  'curl',
  'chmod',
  'passwd',
  'crontab',
  'nc',
  'netcat',
  'tftp',
  'ftp'
];

// Regex builder from the shared keyword list
const SUSPICIOUS_REGEXES = SUSPICIOUS_COMMAND_KEYWORDS.map(
  (kw) => new RegExp(`\\b${kw}\\b|/etc/passwd|/exec/passwd`, 'i')
);

/**
 * Checks if a command line string matches any keyword in the shared list
 */
export function isSuspiciousCommand(cmd) {
  if (!cmd || typeof cmd !== 'string') return false;
  return SUSPICIOUS_REGEXES.some((regex) => regex.test(cmd));
}

/**
 * Generates tailored recommendations based on the attack type
 */
export function getRecommendationsForAttackType(attackType, srcIp) {
  const ip = srcIp || 'attacker';

  switch (attackType) {
    case 'Malware Download Attempt':
      return [
        `Isolate and block source IP ${ip} immediately at perimeter firewall (iptables / UFW).`,
        'Quarantine and extract downloaded payloads from honeypot sandbox for binary malware analysis.',
        'Inspect outbound network egress connections to terminate potential reverse shells or C2 beaconing.'
      ];

    case 'Reconnaissance or Port Scan':
      return [
        `Apply drop-rate limiting for IP ${ip} across scanned port ranges at network edge.`,
        'Deploy dynamic honeypot decoy ports (tar-pitting) to slow down automated network scanning tools.',
        'Review Suricata IDS NIDS alerts to identify signature patterns and targeted service probes.'
      ];

    case 'Brute Force':
      return [
        `Ban IP ${ip} with fail2ban jail after repeated failed authentication attempts.`,
        'Enforce public key authentication or Multi-Factor Authentication (MFA) on SSH/Telnet services.',
        'Audit SSH and Telnet daemon configurations to disable default and root logins.'
      ];

    case 'Credential Stuffing':
      return [
        `Block credential stuffing source IP ${ip} across all authentication endpoints.`,
        'Invalidate leaked credential pairs observed in logs and mandate password resets.',
        'Implement CAPTCHA or proof-of-work challenges on multi-protocol login gateways (FTP, HTTP, SSH).'
      ];

    case 'Interactive Shell Execution':
      return [
        `Terminate active session for ${ip} and sever terminal connection.`,
        'Audit commands executed in honeypot container and check file system modifications.',
        'Review privilege escalation vectors and ensure honeypot docker container remains fully unprivileged.'
      ];

    case 'Signature-Matched Network Attack':
      return [
        `Configure firewall IPS rule to drop packet traffic matching detected Suricata signature.`,
        `Inspect packet payload from ${ip} for known CVE exploit strings or scanner headers.`,
        'Verify host patches and package versions for targeted services.'
      ];

    default:
      return [
        `Monitor activity and log incoming probes from ${ip}.`,
        'Keep decoy container services up to date and verify network isolation.',
        'Correlate multi-honeypot telemetry against global threat intelligence feeds.'
      ];
  }
}

/**
 * Parses timestamp string to epoch milliseconds
 */
function toEpochMs(ts) {
  if (!ts) return 0;
  let s = String(ts).trim();
  if (s.includes(' ') && !s.includes('T')) {
    s = s.replace(' ', 'T');
  }
  if (!s.endsWith('Z') && !/[+-]\d{2}/.test(s)) {
    s += 'Z';
  }
  const t = new Date(s).getTime();
  return isNaN(t) ? 0 : t;
}

/**
 * Extracts session-level features and computes rule-based and Isolation Forest threat scores.
 */
export function analyzeThreats() {
  // Query all raw events from events table
  const allEvents = db.prepare(`
    SELECT
      id,
      honeypot,
      protocol,
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
      alert_count,
      username,
      password,
      input,
      duration,
      raw_json
    FROM events
    WHERE src_ip IS NOT NULL AND TRIM(src_ip) != ''
    ORDER BY timestamp ASC, id ASC
  `).all();

  // Step 1: Identify all base sessions (Cowrie and Heralding sessions, plus standalone Suricata flows)
  const sessionGroups = new Map();

  for (const evt of allEvents) {
    const ip = evt.src_ip.trim();
    const sessionKey = evt.session && evt.session.trim() ? evt.session.trim() : `flow_${evt.id}`;
    const groupKey = `${ip}___${sessionKey}`;

    if (!sessionGroups.has(groupKey)) {
      sessionGroups.set(groupKey, {
        src_ip: ip,
        session: sessionKey,
        honeypot: evt.honeypot || 'cowrie',
        events: [],
        startEpoch: Infinity,
        endEpoch: -Infinity
      });
    }

    const group = sessionGroups.get(groupKey);
    group.events.push(evt);

    const ep = toEpochMs(evt.timestamp);
    if (ep > 0) {
      if (ep < group.startEpoch) group.startEpoch = ep;
      if (ep > group.endEpoch) group.endEpoch = ep;
    }
  }

  // Step 2: Correlate Suricata and Heralding events to each session by src_ip within session's start/end time + 30s
  const sessionFeatures = [];

  for (const [, group] of sessionGroups) {
    const { src_ip, session, events, startEpoch, endEpoch } = group;

    const windowStart = (startEpoch !== Infinity ? startEpoch : 0) - 30000;
    const windowEnd = (endEpoch !== -Infinity ? endEpoch : Date.now()) + 30000;

    // Find all cross-correlated events for this IP in the session window (excluding events already in this session)
    const currentSessionIds = new Set(events.map((e) => e.id));
    const correlatedEvents = allEvents.filter((e) => {
      if (e.src_ip !== src_ip) return false;
      if (currentSessionIds.has(e.id)) return false;
      const ep = toEpochMs(e.timestamp);
      return ep >= windowStart && ep <= windowEnd;
    });

    // Combine session events with correlated events
    const allSessionEvents = [...events, ...correlatedEvents];

    let loginAttempts = 0;
    let failedLogins = 0;
    let successfulLogins = 0;
    let commandCount = 0;
    let suricataAlertCount = 0;
    const suspiciousCommandsFound = [];
    const portsSet = new Set();
    const protocolsSet = new Set();
    const signaturesSet = new Set();
    let maxRecordedDuration = 0;

    for (const evt of allSessionEvents) {
      const eid = (evt.eventid || '').toLowerCase();
      const hp = (evt.honeypot || '').toLowerCase();
      const proto = (evt.protocol || evt.proto || (hp === 'cowrie' ? 'ssh' : hp === 'heralding' ? 'auth' : 'tcp')).toLowerCase();
      protocolsSet.add(proto);

      if (evt.src_port) portsSet.add(evt.src_port);
      if (evt.dest_port) portsSet.add(evt.dest_port);

      if (evt.duration && typeof evt.duration === 'number' && evt.duration > maxRecordedDuration) {
        maxRecordedDuration = evt.duration;
      }

      // Login tracking
      if (
        eid.includes('login') ||
        eid.includes('auth') ||
        hp === 'heralding' ||
        evt.username ||
        evt.password
      ) {
        loginAttempts++;
        if (eid.includes('login.success') || eid.includes('auth.success')) {
          successfulLogins++;
        } else {
          failedLogins++;
        }
      }

      // Command tracking
      if (evt.input && evt.input.trim()) {
        commandCount++;
        const inputStr = evt.input.trim();
        if (isSuspiciousCommand(inputStr)) {
          suspiciousCommandsFound.push(inputStr);
        }
      }

      // Suricata alert tracking
      if (hp === 'suricata' || eid.startsWith('suricata.') || evt.alert_signature) {
        const count = evt.alert_count || 1;
        suricataAlertCount += count;
        if (evt.alert_signature) {
          signaturesSet.add(evt.alert_signature);
        }
      }
    }

    // Requirement 2: Make the suspicious command count equal the number of commands listed
    // Unique list of suspicious commands and exact length
    const uniqueSuspiciousCommands = Array.from(new Set(suspiciousCommandsFound));
    const suspiciousCommandCount = uniqueSuspiciousCommands.length;

    // Calculate duration in seconds
    let sessionDuration = maxRecordedDuration;
    if (sessionDuration <= 0 && startEpoch !== Infinity && endEpoch !== -Infinity && endEpoch >= startEpoch) {
      sessionDuration = Math.round((endEpoch - startEpoch) / 1000);
    }

    // Failed login ratio
    const failedLoginRatio = loginAttempts > 0 ? failedLogins / loginAttempts : 0;

    // Distinct counts
    const distinctPortsCount = portsSet.size;
    const distinctProtocolsCount = protocolsSet.size;

    // Rule-Based Threat Scoring (0 to 100)
    let ruleScore = 0;

    // 1. Suricata alerts (each adds weight)
    if (suricataAlertCount > 0) {
      ruleScore += Math.min(suricataAlertCount * 20, 45);
    }

    // 2. Suspicious commands (wget, curl, nc, etc.)
    if (suspiciousCommandCount > 0) {
      ruleScore += Math.min(suspiciousCommandCount * 25, 45);
    } else if (commandCount > 0) {
      ruleScore += Math.min(commandCount * 5, 20);
    }

    // 3. Failed logins / brute force / credential stuffing
    if (loginAttempts > 0) {
      if (loginAttempts >= 5) {
        ruleScore += 25;
      } else {
        ruleScore += loginAttempts * 5;
      }
      if (failedLoginRatio >= 0.8 && loginAttempts >= 2) {
        ruleScore += 15;
      }
    }

    // 4. Reconnaissance / port scanning
    if (distinctPortsCount >= 3 || distinctProtocolsCount >= 2) {
      ruleScore += 20;
    }

    // Bound ruleScore to [0, 100]
    ruleScore = Math.min(Math.max(Math.round(ruleScore), 0), 100);

    // Rule-Based Attack Type Classification:
    // - malware download attempt: wget, curl, tftp
    // - reconnaissance or port scan: nc, distinct ports hit, multi-protocol
    // - brute force: repeated failed logins on a single service/user
    // - credential stuffing: multiple different login attempts or multi-protocol auth
    let attackType = 'Reconnaissance / Probe';
    const hasDownloadCmd = uniqueSuspiciousCommands.some((c) => /wget|curl|tftp/i.test(c));
    const hasNetcatOrScan = uniqueSuspiciousCommands.some((c) => /nc|netcat/i.test(c));

    if (hasDownloadCmd) {
      attackType = 'Malware Download Attempt';
    } else if (hasNetcatOrScan || distinctPortsCount >= 3 || (distinctProtocolsCount >= 2 && loginAttempts <= 2 && suricataAlertCount > 0)) {
      attackType = 'Reconnaissance or Port Scan';
    } else if (loginAttempts >= 3 && failedLoginRatio >= 0.8) {
      attackType = 'Brute Force';
    } else if (loginAttempts >= 2 && distinctProtocolsCount >= 2) {
      attackType = 'Credential Stuffing';
    } else if (commandCount > 0) {
      attackType = 'Interactive Shell Execution';
    } else if (suricataAlertCount > 0) {
      attackType = 'Signature-Matched Network Attack';
    }

    // Requirement 3: Use thresholds Low 0-30, Medium 31-60, High 61-80, Critical 81-100
    let threatLevel = 'Low';
    if (ruleScore >= 81) {
      threatLevel = 'Critical';
    } else if (ruleScore >= 61) {
      threatLevel = 'High';
    } else if (ruleScore >= 31) {
      threatLevel = 'Medium';
    } else {
      threatLevel = 'Low';
    }

    // Tailored recommendations based on the attack type (Requirement 5)
    const recommendations = getRecommendationsForAttackType(attackType, src_ip);

    sessionFeatures.push({
      src_ip,
      session,
      totalEvents: events.length,
      correlatedEventsCount: correlatedEvents.length,
      loginAttempts,
      failedLogins,
      successfulLogins,
      failedLoginRatio: parseFloat(failedLoginRatio.toFixed(2)),
      sessionDuration,
      commandCount,
      suspiciousCommandCount,
      suspiciousCommands: uniqueSuspiciousCommands,
      distinctPorts: Array.from(portsSet),
      distinctPortsCount,
      distinctProtocols: Array.from(protocolsSet),
      distinctProtocolsCount,
      suricataAlertCount,
      alertSignatures: Array.from(signaturesSet),
      ruleScore,
      attackType,
      threatLevel,
      recommendations,
      startTime: events[0]?.timestamp || null,
      lastTime: events[events.length - 1]?.timestamp || null
    });
  }

  // -------------------------------------------------------------
  // Isolation Forest Anomaly Scoring & Dynamic Confidence Calculation
  // -------------------------------------------------------------
  const totalSessionsTrained = sessionFeatures.length;

  if (sessionFeatures.length > 0) {
    const X = sessionFeatures.map((s) => [
      s.loginAttempts,
      s.failedLoginRatio,
      Math.min(s.sessionDuration, 3600),
      s.commandCount,
      s.suspiciousCommandCount,
      s.distinctPortsCount,
      s.suricataAlertCount
    ]);

    const iforest = new IsolationForest(60, 64);
    iforest.fit(X);

    for (let i = 0; i < sessionFeatures.length; i++) {
      const feat = sessionFeatures[i];
      const rawAnomaly = iforest.score(X[i]);

      feat.anomalyScore = parseFloat(rawAnomaly.toFixed(3));
      feat.anomalyPercentage = Math.round(rawAnomaly * 100);

      // Boost threat level if anomaly score is very high (> 0.70)
      if (feat.anomalyScore >= 0.75 && feat.ruleScore >= 50) {
        if (feat.threatLevel === 'Medium') feat.threatLevel = 'High';
        else if (feat.threatLevel === 'High') feat.threatLevel = 'Critical';
      }

      // Requirement 4: Compute confidence from the score and feature agreement, not a fixed value
      // 1. Normalized rule score (0.0 - 1.0)
      const normScore = feat.ruleScore / 100;
      // 2. Anomaly score (0.0 - 1.0)
      const normAnomaly = feat.anomalyScore;
      // 3. Agreement between rule score and unsupervised anomaly model
      const scoreAgreement = 1 - Math.abs(normScore - normAnomaly);

      // 4. Feature richness signal (signals supporting the detection)
      const featureSignals = [
        feat.loginAttempts > 0,
        feat.commandCount > 0,
        feat.suspiciousCommandCount > 0,
        feat.suricataAlertCount > 0,
        feat.distinctPortsCount > 1,
        feat.distinctProtocolsCount > 1
      ].filter(Boolean).length;
      const featureRichness = featureSignals / 6;

      // Weighted dynamic confidence: 50% score magnitude, 30% rule-model agreement, 20% feature richness
      const dynamicConf = 0.40 + (normScore * 0.30) + (scoreAgreement * 0.20) + (featureRichness * 0.10);
      feat.confidence = parseFloat(Math.min(Math.max(dynamicConf, 0.45), 0.99).toFixed(2));
      feat.sessionsTrainedOn = totalSessionsTrained;
    }
  }

  // Sort by highest ruleScore, then highest anomalyScore
  sessionFeatures.sort((a, b) => {
    if (b.ruleScore !== a.ruleScore) return b.ruleScore - a.ruleScore;
    return b.anomalyScore - a.anomalyScore;
  });

  return {
    threats: sessionFeatures,
    sessionsTrainedOn: totalSessionsTrained
  };
}
