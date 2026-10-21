import db from './db.js';

const COWRIE_URL = process.env.COWRIE_URL || 'http://127.0.0.1:3001/cowrie.json';
const HERALDING_URL = process.env.HERALDING_URL || 'http://127.0.0.1:3002/log_auth.csv';
const SURICATA_URL = process.env.SURICATA_URL || 'http://127.0.0.1:3003/eve.json';

/**
 * Normalizes any timestamp string into UTC ISO-8601 string (e.g. 2026-10-21T12:56:32.362Z).
 * Ensures Heralding, Cowrie, and Suricata timestamps sort identically and accurately.
 */
export function normalizeToUtcIso(ts) {
  if (!ts) return new Date().toISOString();
  let s = String(ts).trim();

  // If already standard ISO with Z, parse and return clean ISO
  if (s.endsWith('Z')) {
    const d = new Date(s);
    return isNaN(d.getTime()) ? s : d.toISOString();
  }

  // If timezone offset is present (+0000, +00:00, etc.)
  if (/[+-]\d{2}:?\d{2}$/.test(s)) {
    const d = new Date(s);
    return isNaN(d.getTime()) ? s : d.toISOString();
  }

  // If it's a space-separated timestamp without timezone (e.g. Heralding: '2026-10-21 12:56:32.362082')
  // Treat as UTC by appending 'Z'
  if (s.includes(' ') && !s.includes('T')) {
    s = s.replace(' ', 'T');
  }
  if (!s.endsWith('Z')) {
    s += 'Z';
  }

  const d = new Date(s);
  return isNaN(d.getTime()) ? String(ts) : d.toISOString();
}

// Prepared insert statement ignoring duplicates
const insertStmt = db.prepare(`
  INSERT OR IGNORE INTO events (
    honeypot,
    protocol,
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
    dest_ip,
    dest_port,
    proto,
    alert_signature,
    alert_category,
    alert_severity,
    alert_count,
    dedup_key,
    raw_json
  ) VALUES (
    @honeypot,
    @protocol,
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
    @dest_ip,
    @dest_port,
    @proto,
    @alert_signature,
    @alert_category,
    @alert_severity,
    @alert_count,
    @dedup_key,
    @raw_json
  )
`);

// Check if a Heralding row already exists based on timestamp, session, eventid, username, password, and src_port
const checkHeraldingExistsStmt = db.prepare(`
  SELECT id FROM events
  WHERE honeypot = 'heralding'
    AND timestamp = ?
    AND session = ?
    AND eventid = 'heralding.auth'
    AND ((username IS NULL AND ? IS NULL) OR username = ?)
    AND ((password IS NULL AND ? IS NULL) OR password = ?)
    AND ((src_port IS NULL AND ? IS NULL) OR src_port = ?)
  LIMIT 1
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

let isCowrieFetching = false;
let isHeraldingFetching = false;
let isSuricataFetching = false;

/**
 * Ingest Cowrie logs from http://127.0.0.1:3001/cowrie.json (JSON Lines)
 */
export async function fetchAndSyncCowrie() {
  if (isCowrieFetching) return;
  isCowrieFetching = true;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2500);

    const response = await fetch(COWRIE_URL, {
      signal: controller.signal,
      headers: { 'Cache-Control': 'no-cache' }
    });
    clearTimeout(timeoutId);

    if (!response.ok) return;

    const text = await response.text();
    const lines = text.split(/\r?\n/);
    const parsedRows = [];

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      try {
        const obj = JSON.parse(trimmed);
        if (obj && typeof obj === 'object') {
          const normTs = normalizeToUtcIso(obj.timestamp);
          const sess = obj.session || '';
          const eid = obj.eventid || '';

          parsedRows.push({
            honeypot: 'cowrie',
            protocol: obj.protocol || 'ssh',
            timestamp: normTs,
            session: sess,
            eventid: eid,
            src_ip: obj.src_ip || null,
            src_port: typeof obj.src_port === 'number' ? obj.src_port : (parseInt(obj.src_port, 10) || null),
            username: obj.username || null,
            password: obj.password || null,
            input: obj.input || null,
            message: obj.message || null,
            duration: typeof obj.duration === 'number' ? obj.duration : (parseFloat(obj.duration) || null),
            dest_ip: obj.dst_ip || obj.dest_ip || null,
            dest_port: typeof obj.dst_port === 'number' ? obj.dst_port : (parseInt(obj.dst_port, 10) || null),
            proto: obj.protocol || 'tcp',
            alert_signature: null,
            alert_category: null,
            alert_severity: null,
            alert_count: 1,
            dedup_key: `cowrie_${normTs}_${sess}_${eid}`,
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
    // Fail silently on timeout or network errors
  } finally {
    isCowrieFetching = false;
  }
}

/**
 * Robust CSV line parser that properly unquotes fields and handles escaped quotes
 */
function parseCsvLine(text) {
  const result = [];
  let cur = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === '"') {
      if (inQuotes && text[i + 1] === '"') {
        cur += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (c === ',' && !inQuotes) {
      result.push(cur.trim());
      cur = '';
    } else {
      cur += c;
    }
  }
  result.push(cur.trim());

  // Clean surrounding quotes from extracted values
  return result.map((val) => {
    if (typeof val === 'string' && val.startsWith('"') && val.endsWith('"') && val.length >= 2) {
      return val.slice(1, -1).replace(/""/g, '"').trim();
    }
    return val;
  });
}

/**
 * Ingest Heralding logs from http://127.0.0.1:3002/log_auth.csv (CSV with Header row)
 * Maps: timestamp (normalized to UTC ISO), session_id -> session, source_ip -> src_ip, source_port -> src_port,
 * protocol (ftp, telnet, http, pop3, vnc), username, password, eventid -> 'heralding.auth',
 * honeypot -> 'heralding'
 */
export async function fetchAndSyncHeralding() {
  if (isHeraldingFetching) return;
  isHeraldingFetching = true;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const response = await fetch(HERALDING_URL, {
      signal: controller.signal,
      headers: { 'Cache-Control': 'no-cache' }
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      console.warn(`[Heralding Poller] HTTP request failed with status: ${response.status} ${response.statusText}`);
      return;
    }

    const text = await response.text();
    const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
    if (lines.length <= 1) {
      console.log(`[Heralding Poller] Found ${lines.length} lines (header only or empty file). 0 newly inserted into DB.`);
      return;
    }

    // Parse header row
    const headers = parseCsvLine(lines[0]).map((h) => h.toLowerCase().replace(/[\s"']/g, ''));

    // Map column names to indexes
    const idxTimestamp = headers.findIndex((h) => h === 'timestamp');
    const idxSession = headers.findIndex((h) => h === 'session_id' || h === 'session' || h === 'id');
    const idxSrcIp = headers.findIndex((h) => h === 'source_ip' || h === 'src_ip' || h === 'ip');
    const idxSrcPort = headers.findIndex((h) => h === 'source_port' || h === 'src_port' || h === 'port');
    const idxProtocol = headers.findIndex((h) => h === 'protocol' || h === 'service');
    const idxUsername = headers.findIndex((h) => h === 'username' || h === 'user');
    const idxPassword = headers.findIndex((h) => h === 'password' || h === 'pass');

    const totalCsvRows = lines.length - 1;
    const newRowsToInsert = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      if (!line.trim()) continue;

      try {
        const cols = parseCsvLine(line);
        if (cols.length === 0) continue;

        const rawTimestamp = idxTimestamp !== -1 ? cols[idxTimestamp] : (cols[0] || null);
        const timestamp = normalizeToUtcIso(rawTimestamp);
        const session = idxSession !== -1 ? cols[idxSession] : (cols[1] || null);
        const src_ip = idxSrcIp !== -1 ? cols[idxSrcIp] : (cols[2] || null);
        const src_port_raw = idxSrcPort !== -1 ? cols[idxSrcPort] : cols[3];
        const src_port = parseInt(src_port_raw, 10) || null;
        const protocolRaw = idxProtocol !== -1 ? cols[idxProtocol] : (cols[7] || cols[4] || 'auth');
        const protocol = (protocolRaw || '').toLowerCase();
        const username = idxUsername !== -1 ? cols[idxUsername] : (cols[8] || cols[5] || null);
        const password = idxPassword !== -1 ? cols[idxPassword] : (cols[9] || cols[6] || null);

        // Check whether row already exists using (timestamp, session, username, password, src_port)
        const existing = checkHeraldingExistsStmt.get(
          timestamp,
          session,
          username,
          username,
          password,
          password,
          src_port,
          src_port
        );

        if (!existing) {
          const rawJsonObj = {
            honeypot: 'heralding',
            timestamp,
            raw_timestamp: rawTimestamp,
            session_id: session,
            source_ip: src_ip,
            source_port: src_port,
            protocol,
            username,
            password
          };

          newRowsToInsert.push({
            honeypot: 'heralding',
            protocol: protocol || 'auth',
            timestamp,
            session: session || null,
            eventid: 'heralding.auth',
            src_ip: src_ip || null,
            src_port,
            username: username || null,
            password: password || null,
            input: null,
            message: `Heralding ${protocol.toUpperCase()} auth attempt from ${src_ip || 'unknown'}:${src_port || 'unknown'}`,
            duration: null,
            dest_ip: null,
            dest_port: null,
            proto: 'tcp',
            alert_signature: null,
            alert_category: null,
            alert_severity: null,
            alert_count: 1,
            dedup_key: `heralding_${timestamp}_${session}_${username || ''}_${password || ''}_${src_port || ''}`,
            raw_json: JSON.stringify(rawJsonObj)
          });
        }
      } catch {
        // Skip bad lines safely
      }
    }

    let insertedCount = 0;
    if (newRowsToInsert.length > 0) {
      insertedCount = insertMany(newRowsToInsert);
    }

    console.log(`[Heralding Poller] Cycle complete: ${totalCsvRows} CSV rows found, ${insertedCount} newly inserted into DB.`);
  } catch (err) {
    console.error(`[Heralding Poller Error]:`, err.message, err.cause ? `(Cause: ${err.cause})` : '');
  } finally {
    isHeraldingFetching = false;
  }
}

/**
 * Ingest Suricata EVE logs from http://127.0.0.1:3003/eve.json (JSON Lines)
 * Stores each unique alert once using duplicate key: flow_id + signature_id + timestamp.
 * Groups repeated alerts into one row with a count (same src_ip and signature within 60 seconds).
 */
export async function fetchAndSyncSuricata() {
  if (isSuricataFetching) return;
  isSuricataFetching = true;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    const response = await fetch(SURICATA_URL, {
      signal: controller.signal,
      headers: {
        'Cache-Control': 'no-cache',
        'Accept': 'application/json, text/plain, */*'
      }
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      console.warn(`[Suricata Poller] HTTP error fetching ${SURICATA_URL}: ${response.status} ${response.statusText}`);
      return;
    }

    const text = await response.text();
    const lines = text.split(/\r?\n/);
    const parsedAlerts = [];
    let alertLinesFound = 0;

    // Set to ensure each raw alert is processed only once (flow_id + signature_id + timestamp)
    const seenRawKeys = new Set();

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      try {
        const obj = JSON.parse(trimmed);
        if (obj && obj.event_type === 'alert') {
          alertLinesFound++;

          const rawTs = obj.timestamp || null;
          const normTs = normalizeToUtcIso(rawTs);
          const flowId = obj.flow_id ? String(obj.flow_id) : (obj.in_iface || 'flow');
          const alertObj = obj.alert || {};
          const sigId = alertObj.signature_id ? String(alertObj.signature_id) : (alertObj.signature || 'sig');

          // Requirement 2: store each Suricata alert only once with duplicate key flow_id + signature_id + timestamp
          const rawUniqueKey = `${flowId}_${sigId}_${normTs}`;
          if (seenRawKeys.has(rawUniqueKey)) {
            continue;
          }
          seenRawKeys.add(rawUniqueKey);

          const sig = alertObj.signature || 'Suricata Alert';
          const cat = alertObj.category || null;
          const sev = typeof alertObj.severity === 'number' ? alertObj.severity : (parseInt(alertObj.severity, 10) || null);
          const proto = (obj.proto || 'tcp').toLowerCase();
          const src_port = typeof obj.src_port === 'number' ? obj.src_port : (parseInt(obj.src_port, 10) || null);
          const dest_port = typeof obj.dest_port === 'number' ? obj.dest_port : (parseInt(obj.dest_port, 10) || null);
          const eventid = alertObj.signature_id ? `suricata.alert.${alertObj.signature_id}` : 'suricata.alert';

          parsedAlerts.push({
            honeypot: 'suricata',
            protocol: proto,
            timestamp: normTs,
            timeMs: new Date(normTs).getTime(),
            session: flowId,
            eventid,
            src_ip: obj.src_ip || null,
            src_port,
            username: null,
            password: null,
            input: null,
            duration: null,
            dest_ip: obj.dest_ip || null,
            dest_port,
            proto,
            alert_signature: sig,
            alert_category: cat,
            alert_severity: sev,
            sigId,
            raw_json: trimmed
          });
        }
      } catch {
        // Skip malformed lines safely
      }
    }

    // Requirement 3: group repeated Suricata alerts into one row with a count (same src_ip and signature within 60 seconds)
    // Partition by (src_ip, alert_signature)
    const alertPartitions = new Map();
    for (const alert of parsedAlerts) {
      const partKey = `${alert.src_ip || 'unknown'}::${alert.alert_signature}`;
      if (!alertPartitions.has(partKey)) {
        alertPartitions.set(partKey, []);
      }
      alertPartitions.get(partKey).push(alert);
    }

    const groupedRowsToInsert = [];

    for (const [partKey, alertList] of alertPartitions.entries()) {
      // Sort chronologically within the partition
      alertList.sort((a, b) => a.timeMs - b.timeMs);

      const timeWindows = [];
      for (const item of alertList) {
        const lastWindow = timeWindows[timeWindows.length - 1];
        if (lastWindow && (item.timeMs - lastWindow.startTimeMs) <= 60000) {
          lastWindow.count++;
          lastWindow.lastTimestamp = item.timestamp;
          // Keep newest sample's timestamp as the row timestamp
          lastWindow.row.timestamp = item.timestamp;
          lastWindow.row.message = `[Suricata IDS] [Sev ${lastWindow.row.alert_severity || 3}] ${lastWindow.row.alert_signature} (${lastWindow.count}x events in 60s)`;
          lastWindow.row.alert_count = lastWindow.count;
        } else {
          const initialRow = {
            ...item,
            alert_count: 1,
            message: `[Suricata IDS] [Sev ${item.alert_severity || 3}] ${item.alert_signature}`,
            dedup_key: `suricata_grp_${item.src_ip}_${item.sigId}_${Math.floor(item.timeMs / 60000)}`
          };
          timeWindows.push({
            startTimeMs: item.timeMs,
            count: 1,
            row: initialRow
          });
        }
      }

      for (const win of timeWindows) {
        groupedRowsToInsert.push(win.row);
      }
    }

    let insertedCount = 0;
    if (groupedRowsToInsert.length > 0) {
      insertedCount = insertMany(groupedRowsToInsert);
    }

    console.log(`[Suricata Poller] Cycle complete: ${alertLinesFound} alert lines found in eve.json (${groupedRowsToInsert.length} after 60s grouping), ${insertedCount} newly inserted into DB.`);
  } catch (err) {
    console.error(`[Suricata Poller Error]:`, err.message, err.cause ? `(Cause: ${err.cause})` : '');
  } finally {
    isSuricataFetching = false;
  }
}

/**
 * Start poller for Cowrie, Heralding, and Suricata every 3 seconds
 */
export function startLogPoller(intervalMs = 3000) {
  // Initial fetches immediately
  fetchAndSyncCowrie();
  fetchAndSyncHeralding();
  fetchAndSyncSuricata();

  return setInterval(() => {
    fetchAndSyncCowrie();
    fetchAndSyncHeralding();
    fetchAndSyncSuricata();
  }, intervalMs);
}
