# AI-Based Intelligent Honeynet SOC Dashboard

A modern, professional cybersecurity Security Operations Center (SOC) dashboard built for college Computer Networks project demonstrations and research.

## 1. Project Overview & Architecture

This dashboard serves as the central monitoring and analysis interface for a decoy deception network. 

### Planned Network Infrastructure:
- **Ubuntu Server VM**: Hosts Docker containers running isolated honeypot decoys in a private bridge network (`172.20.0.0/16`).
  - **Cowrie SSH Honeypot** (Port 2222): Emulates an interactive SSH/Telnet service capturing brute force dictionary attacks, downloaded payloads, and shell command sequences.
  - **Fake Web Server** (Port 8080): Emulates web applications and portals trapping SQL Injection, directory traversal (`/etc/passwd`), and CVE exploit probes (e.g., Log4j / Spring4Shell).
  - **Fake Database Service** (Port 3306): Emulates MySQL/Redis credential auth challenges and logging unauthorized query injections.
  - **AI Analysis Engine** (Port 5000): Ingestion pipeline classifying attacks via behavioral heuristics and MITRE ATT&CK tactics.
- **Kali Linux VM**: Operates as the external simulated attacker executing port sweeps, brute forcing, and exploit injections.

> **Demonstration Mode Notice**:
> In accordance with academic research standards, all demo IP addresses strictly use **RFC 5737** reserved documentation ranges (`192.0.2.0/24` TEST-NET-1, `198.51.100.0/24` TEST-NET-2, `203.0.113.0/24` TEST-NET-3). The dashboard includes a live interactive demo event stream generator for offline evaluation.

---

## 2. Dashboard Pages & Capabilities

1. **Dashboard Overview (`/`)**:
   - 4 SOC metric cards: Total Attack Events, Unique Attacker IPs, Active Honeypots, and Critical Threats.
   - Attack activity over time (Area chart with Total vs. Critical volume).
   - Attack type distribution (Donut chart).
   - Severity level breakdown cards (Critical, High, Medium, Low).
   - Intercepted events table with direct triage action buttons.
2. **Honeynet Monitoring (`/honeynet`)**:
   - Interactive network topology diagram displaying Kali Linux attacker node, Docker container decoy network, and AI analysis core.
   - Interactive node inspector showing IP, port, container status, uptime, and decoy interaction level.
3. **Live Attack Stream (`/live-attacks`)**:
   - Real-time event log stream with live sorting, pagination, and multi-field search.
   - Severity and vector filter dropdowns.
   - Integrated **Demo Stream Generator** toggle with adjustable generation intervals (2s, 4s, 7s).
   - Session sequence audit trail displaying chronological attacker reconnaissance steps.
4. **AI Threat Analysis (`/ai-analysis`)**:
   - Threat scoring gauge (0-100) and severity classification.
   - Explainable AI detection rationale and feature weighting.
   - Observed behavioral anomaly indicators.
   - Automated countermeasure playbooks and MITRE ATT&CK tactic mappings.
   - Correlated events from the same simulated adversary.
5. **Simulated Adversary Profiles (`/attackers`)**:
   - Attacker dossier cards with risk scores and reputation tags.
   - OS and tool fingerprinting (Nmap, Hydra, sqlmap, Nikto, ffuf, etc.).
   - Chronological attack history timeline per attacker IP.
6. **Reports & Export (`/reports`)**:
   - Executive security operations briefing.
   - Time window filtering (1h, 6h, 24h, 7d).
   - Printable report view (for PDF generation).
   - One-click RFC-compliant **CSV Export** for further data analysis.
7. **Settings & Integration Readiness (`/settings`)**:
   - Pre-configured backend connection inputs (`apiUrl`, `cowrieLogPath`, `dockerSocket`).
   - Built-in test ping mechanism.
   - Threshold sliders for alert severity triggers.

---

## 3. Technology Stack

- **Framework**: React 19 + Vite 6
- **Routing**: React Router v7
- **Styling**: Tailwind CSS v4 + Custom SOC Dark Theme
- **Data Visualization**: Recharts
- **Icons**: Lucide React
- **Architecture**: Pluggable service layer (`src/services/apiService.js`)

---

## 4. Setup & Running Locally

### Prerequisites
Node.js (v18+ or v20+) and npm.

### Quick Start
```bash
# 1. Navigate to the project directory
cd "AI-based-Honeynet"

# 2. Install dependencies (already installed if cloned with node_modules)
npm install

# 3. Start the development server
npm run dev
```

Open your browser at:
```
http://127.0.0.1:5173/
```

### Production Build
```bash
npm run build
npm run preview
```

---

## 5. Connecting to Ubuntu Server & Python AI Backend

The dashboard is structured with a central API service layer ([apiService.js](file:///c:/Users/saad%20qureshi/CN%20project/AI-based-Honeynet/src/services/apiService.js)) prepared for the following REST endpoints:

- `GET /api/overview` - Returns high-level statistics and hourly attack volume.
- `GET /api/events` - Returns filtered honeynet event logs.
- `GET /api/attackers` - Returns attacker profiles and tool fingerprints.
- `GET /api/honeypots` - Returns Docker container status and port mappings.
- `GET /api/analysis/:eventId` - Returns machine learning model classifications, confidence scores, and mitigation steps.

### Switching from Demo Mode to Live Backend
1. Open the dashboard and navigate to **Settings & Integrations**.
2. Set **Backend API URL** to your server address (e.g., `http://192.168.1.150:8000`).
3. Toggle Data Provider Mode to **Live Backend Stream**.
4. Click **Test Ping** and **Save Integration Settings**.
5. If the backend is ever unreachable, the dashboard automatically falls back to simulated demo mode without crashing.
