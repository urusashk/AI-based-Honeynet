import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import Database from 'better-sqlite3';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Data directory for SQLite file
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'honeynet.db');
const db = new Database(dbPath);

// Enable WAL mode for high concurrency
db.pragma('journal_mode = WAL');

// Initialize events table
db.exec(`
  CREATE TABLE IF NOT EXISTS events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    honeypot TEXT DEFAULT 'cowrie',
    protocol TEXT DEFAULT 'ssh',
    timestamp TEXT,
    session TEXT,
    eventid TEXT,
    src_ip TEXT,
    src_port INTEGER,
    username TEXT,
    password TEXT,
    input TEXT,
    message TEXT,
    duration REAL,
    dest_ip TEXT,
    dest_port INTEGER,
    proto TEXT,
    alert_signature TEXT,
    alert_category TEXT,
    alert_severity INTEGER,
    alert_count INTEGER DEFAULT 1,
    dedup_key TEXT,
    raw_json TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(timestamp, session, eventid, username, password, src_port)
  );
`);

// Safe migration for existing SQLite databases
try {
  let tableInfo = db.prepare('PRAGMA table_info(events)').all();
  let columnNames = tableInfo.map((c) => c.name);

  if (!columnNames.includes('honeypot')) {
    db.exec(`ALTER TABLE events ADD COLUMN honeypot TEXT DEFAULT 'cowrie'`);
  }
  if (!columnNames.includes('protocol')) {
    db.exec(`ALTER TABLE events ADD COLUMN protocol TEXT DEFAULT 'ssh'`);
  }
  if (!columnNames.includes('dest_ip')) {
    db.exec(`ALTER TABLE events ADD COLUMN dest_ip TEXT`);
  }
  if (!columnNames.includes('dest_port')) {
    db.exec(`ALTER TABLE events ADD COLUMN dest_port INTEGER`);
  }
  if (!columnNames.includes('proto')) {
    db.exec(`ALTER TABLE events ADD COLUMN proto TEXT`);
  }
  if (!columnNames.includes('alert_signature')) {
    db.exec(`ALTER TABLE events ADD COLUMN alert_signature TEXT`);
  }
  if (!columnNames.includes('alert_category')) {
    db.exec(`ALTER TABLE events ADD COLUMN alert_category TEXT`);
  }
  if (!columnNames.includes('alert_severity')) {
    db.exec(`ALTER TABLE events ADD COLUMN alert_severity INTEGER`);
  }
  if (!columnNames.includes('alert_count')) {
    db.exec(`ALTER TABLE events ADD COLUMN alert_count INTEGER DEFAULT 1`);
  }
  if (!columnNames.includes('dedup_key')) {
    db.exec(`ALTER TABLE events ADD COLUMN dedup_key TEXT`);
  }

  // Ensure all existing rows without a honeypot value default to 'cowrie'
  db.exec(`UPDATE events SET honeypot = 'cowrie' WHERE honeypot IS NULL OR honeypot = ''`);
  db.exec(`UPDATE events SET protocol = 'ssh' WHERE (protocol IS NULL OR protocol = '') AND honeypot = 'cowrie'`);
} catch (err) {
  console.warn('[DB Migration Warning]:', err.message);
}

// Create indexes after columns are guaranteed to exist
db.exec(`
  CREATE INDEX IF NOT EXISTS idx_events_timestamp ON events(timestamp DESC);
  CREATE INDEX IF NOT EXISTS idx_events_session ON events(session);
  CREATE INDEX IF NOT EXISTS idx_events_eventid ON events(eventid);
  CREATE INDEX IF NOT EXISTS idx_events_src_ip ON events(src_ip);
  CREATE INDEX IF NOT EXISTS idx_events_honeypot ON events(honeypot);
  CREATE INDEX IF NOT EXISTS idx_events_protocol ON events(protocol);
  CREATE INDEX IF NOT EXISTS idx_events_alert_sig ON events(alert_signature);
  CREATE INDEX IF NOT EXISTS idx_events_alert_sev ON events(alert_severity);
  CREATE UNIQUE INDEX IF NOT EXISTS idx_events_dedup_key ON events(dedup_key);
`);

export default db;
