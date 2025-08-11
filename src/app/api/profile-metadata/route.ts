export const runtime = 'nodejs';

// Simple SQLite-backed metadata store keyed by profileId
// Requires: npm i better-sqlite3 (native). If unavailable, falls back to in-memory Map (non-persistent).

type ProfileMetadata = {
  profile_id: string;
  location?: string;
  phone?: string;
  email?: string;
  website?: string;
  image_url?: string;
  updated_at?: string;
};

let memStore: Map<string, ProfileMetadata> | null = null;
let db: any = null;

function getDb() {
  if (db !== null) return db;
  try {
    // Use createRequire to import CJS module in ESM context
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { createRequire } = require('module');
    const req = createRequire(import.meta.url);
    const Database = req('better-sqlite3');
    const fs = req('fs');
    const path = req('path');
    const dir = path.join(process.cwd(), 'data');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    const filePath = path.join(dir, 'metadata.db');
    db = new Database(filePath);
    db.pragma('journal_mode = WAL');
    db.prepare(`CREATE TABLE IF NOT EXISTS profile_metadata (
      profile_id TEXT PRIMARY KEY,
      location TEXT,
      phone TEXT,
      email TEXT,
      website TEXT,
      image_url TEXT,
      updated_at TEXT
    )`).run();
    return db;
  } catch (e) {
    // Fallback to in-memory (non-persistent)
    memStore = memStore || new Map();
    return null;
  }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) return new Response('Missing id', { status: 400 });
  const sqlite = getDb();
  if (sqlite) {
    const row = sqlite.prepare('SELECT * FROM profile_metadata WHERE profile_id = ?').get(id);
    return new Response(JSON.stringify(row || { profile_id: id }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  }
  const data = memStore!.get(id) || { profile_id: id };
  return new Response(JSON.stringify(data), { status: 200, headers: { 'Content-Type': 'application/json' } });
}

export async function PUT(req: Request) {
  try {
    const body = (await req.json()) as ProfileMetadata;
    if (!body?.profile_id) return new Response('Missing profile_id', { status: 400 });
    body.updated_at = new Date().toISOString();
    const sqlite = getDb();
    if (sqlite) {
      sqlite
        .prepare(`INSERT INTO profile_metadata (profile_id, location, phone, email, website, image_url, updated_at)
                  VALUES (@profile_id, @location, @phone, @email, @website, @image_url, @updated_at)
                  ON CONFLICT(profile_id) DO UPDATE SET
                    location=excluded.location,
                    phone=excluded.phone,
                    email=excluded.email,
                    website=excluded.website,
                    image_url=excluded.image_url,
                    updated_at=excluded.updated_at`)
        .run(body);
    } else {
      memStore!.set(body.profile_id, body);
    }
    return new Response(JSON.stringify({ ok: true, updated_at: body.updated_at }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (e: any) {
    return new Response(e?.message || 'Invalid JSON', { status: 400 });
  }
}


