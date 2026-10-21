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

// Initialize events table with unique constraint on (timestamp, session, eventid)
db.exec(`
  CREATE TABLE IF NOT EXISTS events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
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
    raw_json TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(timestamp, session, eventid)
  );

  CREATE INDEX IF NOT EXISTS idx_events_timestamp ON events(timestamp DESC);
  CREATE INDEX IF NOT EXISTS idx_events_session ON events(session);
  CREATE INDEX IF NOT EXISTS idx_events_eventid ON events(eventid);
  CREATE INDEX IF NOT EXISTS idx_events_src_ip ON events(src_ip);
`);

export default db;
