import express from 'express';
import cors from 'cors';
import db from './db.js';
import { startLogPoller } from './poller.js';
import { analyzeThreats } from './threatService.js';

const app = express();
const PORT = process.env.PORT || 4000;

// Enable CORS and JSON parsing
app.use(cors());
app.use(express.json());

/**
 * GET /api/events
 * Returns events newest first, with limit, offset, and optional session, eventid, and honeypot filters.
 */
app.get('/api/events', (req, res) => {
  try {
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 50, 1), 1000);
    const offset = Math.max(parseInt(req.query.offset, 10) || 0, 0);
    const session = req.query.session;
    const eventid = req.query.eventid;
    const honeypot = req.query.honeypot;

    const whereClauses = [];
    const params = {};

    if (session) {
      whereClauses.push('session = @session');
      params.session = session;
    }

    if (eventid) {
      whereClauses.push('eventid = @eventid');
      params.eventid = eventid;
    }

    if (honeypot && honeypot.toLowerCase() !== 'all') {
      whereClauses.push('LOWER(honeypot) = LOWER(@honeypot)');
      params.honeypot = honeypot;
    }

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    // Total count for pagination
    const totalRow = db.prepare(`SELECT COUNT(*) as count FROM events ${whereSql}`).get(params);
    const total = totalRow ? totalRow.count : 0;

    let rows;
    if ((!honeypot || honeypot.toLowerCase() === 'all') && !session && !eventid) {
      // Requirement 4: make "All" show a balanced mix across sources (Cowrie, Heralding, Suricata)
      // Fetch up to limit/3 from each honeypot, then merge and sort by id DESC (newest ingestion first)
      const perSourceLimit = Math.max(Math.ceil(limit / 3), 20);

      const cowrieRows = db.prepare(`
        SELECT id, honeypot, protocol, timestamp, session, eventid, src_ip, src_port, dest_ip, dest_port,
               proto, alert_signature, alert_category, alert_severity, alert_count, username, password,
               input, message, duration, raw_json, created_at
        FROM events WHERE honeypot = 'cowrie'
        ORDER BY id DESC LIMIT ?
      `).all(perSourceLimit);

      const heraldingRows = db.prepare(`
        SELECT id, honeypot, protocol, timestamp, session, eventid, src_ip, src_port, dest_ip, dest_port,
               proto, alert_signature, alert_category, alert_severity, alert_count, username, password,
               input, message, duration, raw_json, created_at
        FROM events WHERE honeypot = 'heralding'
        ORDER BY id DESC LIMIT ?
      `).all(perSourceLimit);

      const suricataRows = db.prepare(`
        SELECT id, honeypot, protocol, timestamp, session, eventid, src_ip, src_port, dest_ip, dest_port,
               proto, alert_signature, alert_category, alert_severity, alert_count, username, password,
               input, message, duration, raw_json, created_at
        FROM events WHERE honeypot = 'suricata'
        ORDER BY id DESC LIMIT ?
      `).all(perSourceLimit);

      // Merge and sort by ingestion time, newest first (id DESC)
      const merged = [...cowrieRows, ...heraldingRows, ...suricataRows];
      merged.sort((a, b) => b.id - a.id);

      rows = merged.slice(offset, offset + limit);
    } else {
      // Per-source filter or specific session/eventid query: sort by ingestion time, newest first (id DESC)
      rows = db.prepare(`
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
          message,
          duration,
          raw_json,
          created_at
        FROM events
        ${whereSql}
        ORDER BY id DESC
        LIMIT @limit OFFSET @offset
      `).all({ ...params, limit, offset });
    }

    res.json({
      total,
      limit,
      offset,
      events: rows
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve events', details: err.message });
  }
});

/**
 * GET /api/sessions
 * Returns events grouped by session with aggregated session stats.
 */
app.get('/api/sessions', (req, res) => {
  try {
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 50, 1), 200);

    const sessions = db.prepare(`
      SELECT
        session,
        src_ip,
        honeypot,
        protocol,
        MIN(timestamp) as start_time,
        MAX(timestamp) as last_time,
        COUNT(*) as total_events,
        GROUP_CONCAT(DISTINCT username) as usernames,
        GROUP_CONCAT(DISTINCT input) as commands_run
      FROM events
      WHERE session IS NOT NULL AND session != ''
      GROUP BY session
      ORDER BY MAX(timestamp) DESC
      LIMIT ?
    `).all(limit);

    // Fetch individual events for each session in time order
    const getSessionEvents = db.prepare(`
      SELECT id, honeypot, protocol, timestamp, session, eventid, src_ip, src_port, username, password, input, message, duration, raw_json
      FROM events
      WHERE session = ?
      ORDER BY timestamp ASC, id ASC
    `);

    const result = sessions.map((sess) => ({
      session: sess.session,
      src_ip: sess.src_ip,
      honeypot: sess.honeypot || 'cowrie',
      protocol: sess.protocol || 'ssh',
      start_time: sess.start_time,
      last_time: sess.last_time,
      total_events: sess.total_events,
      usernames: sess.usernames ? sess.usernames.split(',') : [],
      commands_run: sess.commands_run ? sess.commands_run.split(',') : [],
      events: getSessionEvents.all(sess.session)
    }));

    res.json({ sessions: result });
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve sessions', details: err.message });
  }
});

/**
 * GET /api/stats
 * Returns total events, failed logins, successful logins, unique IPs, top commands,
 * and breakdown counts per honeypot and per protocol.
 */
app.get('/api/stats', (req, res) => {
  try {
    const totalRow = db.prepare('SELECT COUNT(*) as count FROM events').get();
    const totalEvents = totalRow ? totalRow.count : 0;

    const failedLoginsRow = db.prepare(`
      SELECT COUNT(*) as count
      FROM events
      WHERE eventid LIKE '%login.failed%' OR eventid LIKE '%auth.failed%' OR eventid = 'heralding.auth'
    `).get();
    const failedLogins = failedLoginsRow ? failedLoginsRow.count : 0;

    const successfulLoginsRow = db.prepare(`
      SELECT COUNT(*) as count
      FROM events
      WHERE eventid LIKE '%login.success%' OR eventid LIKE '%auth.success%'
    `).get();
    const successfulLogins = successfulLoginsRow ? successfulLoginsRow.count : 0;

    const uniqueIpsRow = db.prepare(`
      SELECT COUNT(DISTINCT src_ip) as count
      FROM events
      WHERE src_ip IS NOT NULL AND src_ip != ''
    `).get();
    const uniqueAttackers = uniqueIpsRow ? uniqueIpsRow.count : 0;

    // Counts per honeypot (cowrie, heralding, suricata, etc.)
    const honeypotRows = db.prepare(`
      SELECT COALESCE(honeypot, 'cowrie') as honeypot, COUNT(*) as count
      FROM events
      GROUP BY COALESCE(honeypot, 'cowrie')
    `).all();

    const countsPerHoneypot = {
      cowrie: 0,
      heralding: 0,
      suricata: 0
    };
    for (const r of honeypotRows) {
      countsPerHoneypot[r.honeypot.toLowerCase()] = r.count;
    }

    // Counts per protocol (ssh, ftp, telnet, http, pop3, vnc, tcp, etc.)
    const protocolRows = db.prepare(`
      SELECT LOWER(COALESCE(protocol, 'ssh')) as protocol, COUNT(*) as count
      FROM events
      WHERE protocol IS NOT NULL AND protocol != ''
      GROUP BY LOWER(protocol)
      ORDER BY count DESC
    `).all();

    const countsPerProtocol = {};
    for (const r of protocolRows) {
      countsPerProtocol[r.protocol] = r.count;
    }

    // Suricata Alerts by Signature
    const alertsBySignature = db.prepare(`
      SELECT alert_signature as signature, COUNT(*) as count
      FROM events
      WHERE alert_signature IS NOT NULL AND TRIM(alert_signature) != ''
      GROUP BY alert_signature
      ORDER BY count DESC
      LIMIT 15
    `).all();

    // Suricata Alerts by Severity (1 = High, 2 = Medium, 3 = Low, 4 = Info)
    const alertsBySeverityRows = db.prepare(`
      SELECT alert_severity as severity, COUNT(*) as count
      FROM events
      WHERE alert_severity IS NOT NULL
      GROUP BY alert_severity
      ORDER BY alert_severity ASC
    `).all();
    const alertsBySeverity = {};
    for (const r of alertsBySeverityRows) {
      alertsBySeverity[r.severity] = r.count;
    }

    const topCommands = db.prepare(`
      SELECT input as command, COUNT(*) as count
      FROM events
      WHERE input IS NOT NULL AND TRIM(input) != ''
      GROUP BY input
      ORDER BY count DESC
      LIMIT 10
    `).all();

    res.json({
      totalEvents,
      failedLogins,
      successfulLogins,
      uniqueAttackers,
      countsPerHoneypot,
      countsPerProtocol,
      alertsBySignature,
      alertsBySeverity,
      topCommands
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve stats', details: err.message });
  }
});

/**
 * GET /api/threats
 * Groups events by src_ip and session, extracts features, computes rule-based threat score (0-100),
 * attack type classification, and Isolation Forest anomaly score.
 */
app.get('/api/threats', (req, res) => {
  try {
    const analysisResult = analyzeThreats();
    const threats = analysisResult.threats || [];
    const sessionsTrainedOn = analysisResult.sessionsTrainedOn || threats.length;

    // High risk count: High (61-80) and Critical (81-100)
    const highRiskThreats = threats.filter((t) => t.threatLevel === 'Critical' || t.threatLevel === 'High');

    // Aggregate attacker summary
    const attackerMap = new Map();
    for (const t of threats) {
      if (!attackerMap.has(t.src_ip)) {
        attackerMap.set(t.src_ip, {
          ip: t.src_ip,
          maxScore: t.ruleScore,
          maxAnomaly: t.anomalyScore,
          threatLevel: t.threatLevel,
          sessionsCount: 0,
          totalEvents: 0,
          attackTypes: new Set(),
          isHighRisk: t.threatLevel === 'Critical' || t.threatLevel === 'High',
          firstSeen: t.startTime,
          lastSeen: t.lastTime
        });
      }
      const atk = attackerMap.get(t.src_ip);
      atk.sessionsCount++;
      atk.totalEvents += t.totalEvents;
      atk.attackTypes.add(t.attackType);
      if (t.ruleScore > atk.maxScore) {
        atk.maxScore = t.ruleScore;
        atk.threatLevel = t.threatLevel;
      }
      if (t.anomalyScore > atk.maxAnomaly) {
        atk.maxAnomaly = t.anomalyScore;
      }
      if (t.threatLevel === 'Critical' || t.threatLevel === 'High') {
        atk.isHighRisk = true;
      }
      if (t.lastTime && (!atk.lastSeen || t.lastTime > atk.lastSeen)) {
        atk.lastSeen = t.lastTime;
      }
    }

    const attackers = Array.from(attackerMap.values()).map((a) => ({
      ...a,
      attackTypes: Array.from(a.attackTypes)
    })).sort((a, b) => b.maxScore - a.maxScore);

    res.json({
      totalThreats: threats.length,
      highRiskCount: highRiskThreats.length,
      sessionsTrainedOn,
      threats,
      attackers
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to analyze threats', details: err.message });
  }
});

/**
 * GET /api/export.csv
 * Exports all rows as CSV for AI model training including honeypot and protocol.
 */
app.get('/api/export.csv', (req, res) => {
  try {
    const honeypotFilter = req.query.honeypot;
    let whereSql = '';
    const params = {};
    if (honeypotFilter && honeypotFilter.toLowerCase() !== 'all') {
      whereSql = 'WHERE LOWER(honeypot) = LOWER(@honeypot)';
      params.honeypot = honeypotFilter;
    }

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="honeynet_events_ai_training.csv"');

    const headers = [
      'id',
      'honeypot',
      'protocol',
      'timestamp',
      'session',
      'eventid',
      'src_ip',
      'src_port',
      'dest_ip',
      'dest_port',
      'proto',
      'alert_signature',
      'alert_category',
      'alert_severity',
      'username',
      'password',
      'input',
      'message',
      'duration',
      'raw_json'
    ];

    const escapeCsv = (val) => {
      if (val === null || val === undefined) return '""';
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    };

    res.write(headers.join(',') + '\r\n');

    // Stream rows directly from SQLite cursor
    const cursor = db.prepare(`
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
        username,
        password,
        input,
        message,
        duration,
        raw_json
      FROM events
      ${whereSql}
      ORDER BY id ASC
    `).iterate(params);

    for (const row of cursor) {
      const line = [
        row.id,
        escapeCsv(row.honeypot || 'cowrie'),
        escapeCsv(row.protocol || 'ssh'),
        escapeCsv(row.timestamp),
        escapeCsv(row.session),
        escapeCsv(row.eventid),
        escapeCsv(row.src_ip),
        row.src_port !== null ? row.src_port : '',
        escapeCsv(row.dest_ip),
        row.dest_port !== null ? row.dest_port : '',
        escapeCsv(row.proto),
        escapeCsv(row.alert_signature),
        escapeCsv(row.alert_category),
        row.alert_severity !== null ? row.alert_severity : '',
        escapeCsv(row.username),
        escapeCsv(row.password),
        escapeCsv(row.input),
        escapeCsv(row.message),
        row.duration !== null ? row.duration : '',
        escapeCsv(row.raw_json)
      ].join(',');
      res.write(line + '\r\n');
    }

    res.end();
  } catch (err) {
    res.status(500).send(`Error exporting CSV: ${err.message}`);
  }
});

// Start background log poller (every 3 seconds for Cowrie, Heralding, and Suricata)
startLogPoller(3000);

// Start HTTP server on port 4000
app.listen(PORT, () => {
  console.log(`[Honeynet Backend] Express running on http://localhost:${PORT}`);
  console.log(`[Honeynet Backend] Ingesting Cowrie (3001), Heralding (3002) & Suricata (3003) every 3s`);
});

