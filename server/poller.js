import db from './db.js';

const COWRIE_URL = process.env.COWRIE_URL || 'http://localhost:3001/cowrie.json';

// Prepared insert statement ignoring duplicates
const insertStmt = db.prepare(`
  INSERT OR IGNORE INTO events (
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
  ) VALUES (
    @timestamp,
    @session,
    @eventid,
    @src_ip,
    @src_port,
    @username,
    @password,
    @input,
    @message,
    @duration,
    @raw_json
  )
`);

// Transaction for batch insertions
const insertMany = db.transaction((rows) => {
  let count = 0;
  for (const row of rows) {
    const result = insertStmt.run(row);
    if (result.changes > 0) count++;
  }
  return count;
});

let isFetching = false;

export async function fetchAndSyncCowrie() {
  if (isFetching) return;
  isFetching = true;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2500);

    const response = await fetch(COWRIE_URL, {
      signal: controller.signal,
      headers: { 'Cache-Control': 'no-cache' }
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      return;
    }

    const text = await response.text();
    const lines = text.split(/\r?\n/);
    const parsedRows = [];

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      try {
        const obj = JSON.parse(trimmed);
        if (obj && typeof obj === 'object') {
          parsedRows.push({
            timestamp: obj.timestamp || null,
            session: obj.session || null,
            eventid: obj.eventid || null,
            src_ip: obj.src_ip || null,
            src_port: typeof obj.src_port === 'number' ? obj.src_port : (parseInt(obj.src_port, 10) || null),
            username: obj.username || null,
            password: obj.password || null,
            input: obj.input || null,
            message: obj.message || null,
            duration: typeof obj.duration === 'number' ? obj.duration : (parseFloat(obj.duration) || null),
            raw_json: trimmed
          });
        }
      } catch {
        // Skip malformed lines safely
      }
    }

    if (parsedRows.length > 0) {
      insertMany(parsedRows);
    }
  } catch (err) {
    // Fail silently or log on retry
  } finally {
    isFetching = false;
  }
}

export function startLogPoller(intervalMs = 3000) {
  // Initial fetch immediately
  fetchAndSyncCowrie();
  return setInterval(fetchAndSyncCowrie, intervalMs);
}
