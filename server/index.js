import express from 'express';
import cors from 'cors';
import db from './db.js';
import { startLogPoller } from './poller.js';

const app = express();
const PORT = process.env.PORT || 4000;

// Enable CORS and JSON parsing
app.use(cors());
app.use(express.json());

/**
 * GET /api/events
 * Returns events newest first, with limit, offset, and optional session and eventid filters.
 */
app.get('/api/events', (req, res) => {
  try {
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 50, 1), 1000);
    const offset = Math.max(parseInt(req.query.offset, 10) || 0, 0);
    const session = req.query.session;
    const eventid = req.query.eventid;

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

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    // Total count for pagination
    const totalRow = db.prepare(`SELECT COUNT(*) as count FROM events ${whereSql}`).get(params);
    const total = totalRow ? totalRow.count : 0;

    // Fetch paginated events sorted newest first
    const rows = db.prepare(`
      SELECT
        id,
        timestamp,
        session,
        eventid,
        src_ip,
        src_port,
        username,
        password,
        input,
        message,
        duration,
        raw_json
      FROM events
      ${whereSql}
      ORDER BY timestamp DESC, id DESC
      LIMIT @limit OFFSET @offset
    `).all({ ...params, limit, offset });

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

    // Fetch individual events for each session
    const getSessionEvents = db.prepare(`
      SELECT id, timestamp, eventid, src_ip, username, password, input, message
      FROM events
      WHERE session = ?
      ORDER BY timestamp ASC, id ASC
    `);

    const result = sessions.map((sess) => ({
      session: sess.session,
      src_ip: sess.src_ip,
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
 * Returns total events, failed logins, successful logins, unique IPs, and top commands.
 */
app.get('/api/stats', (req, res) => {
  try {
    const totalRow = db.prepare('SELECT COUNT(*) as count FROM events').get();
    const totalEvents = totalRow ? totalRow.count : 0;

    const failedLoginsRow = db.prepare(`
      SELECT COUNT(*) as count
      FROM events
      WHERE eventid LIKE '%login.failed%' OR eventid LIKE '%auth.failed%'
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
      topCommands
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve stats', details: err.message });
  }
});

/**
 * GET /api/export.csv
 * Exports all rows as CSV for AI model training.
 */
app.get('/api/export.csv', (req, res) => {
  try {
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="cowrie_events_ai_training.csv"');

    const headers = [
      'id',
      'timestamp',
      'session',
      'eventid',
      'src_ip',
      'src_port',
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
        timestamp,
        session,
        eventid,
        src_ip,
        src_port,
        username,
        password,
        input,
        message,
        duration,
        raw_json
      FROM events
      ORDER BY id ASC
    `).iterate();

    for (const row of cursor) {
      const line = [
        row.id,
        escapeCsv(row.timestamp),
        escapeCsv(row.session),
        escapeCsv(row.eventid),
        escapeCsv(row.src_ip),
        row.src_port !== null ? row.src_port : '',
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

// Start background log poller (every 3 seconds)
startLogPoller(3000);

// Start HTTP server on port 4000
app.listen(PORT, () => {
  console.log(`[Honeynet Backend] Express running on http://localhost:${PORT}`);
  console.log(`[Honeynet Backend] Polling Cowrie at http://localhost:3001/cowrie.json every 3s`);
});
