// Initialize local SQLite DB for profile metadata
// Run: node scripts/init-db.js

const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');

const dataDir = path.join(process.cwd(), 'data');
fs.mkdirSync(dataDir, { recursive: true });
const dbPath = path.join(dataDir, 'metadata.db');
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');

db.prepare(`CREATE TABLE IF NOT EXISTS profile_metadata (
  profile_id TEXT PRIMARY KEY,
  location TEXT,
  phone TEXT,
  email TEXT,
  website TEXT,
  image_url TEXT,
  birth_date TEXT,
  gender TEXT,
  updated_at TEXT
)`).run();

// Add missing columns if they don't exist (for existing databases)
try {
  db.prepare('ALTER TABLE profile_metadata ADD COLUMN birth_date TEXT').run();
} catch (e) {
  // Column already exists, ignore error
}

try {
  db.prepare('ALTER TABLE profile_metadata ADD COLUMN gender TEXT').run();
} catch (e) {
  // Column already exists, ignore error
}

console.log('Initialized DB at', dbPath);


