export const runtime = 'nodejs';

import { dbLogger } from '../../../lib/logger';
import type { DatabaseError, APIError } from '../../../types/api';

// Simple SQLite-backed metadata store keyed by profileId
// Requires: npm i better-sqlite3 (native). If unavailable, falls back to in-memory Map (non-persistent).

type ProfileMetadata = {
  profile_id: string;
  location?: string;
  phone?: string;
  email?: string;
  website?: string;
  image_url?: string;
  birth_date?: string;
  gender?: string;
  updated_at?: string;
};

interface SQLiteDatabase {
  pragma: (setting: string) => void;
  prepare: (sql: string) => {
    run: (params?: Record<string, unknown>) => void;
    get: (params?: unknown) => ProfileMetadata | undefined;
  };
  transaction: (fn: () => void) => () => void;
}

let memStore: Map<string, ProfileMetadata> | null = null;
let db: SQLiteDatabase | null = null;
let dbInitialized = false;

function getDb(): SQLiteDatabase | null {
  if (db !== null) return db;
  if (dbInitialized) return null; // Prevent multiple initialization attempts
  
  try {
    // Use createRequire to import CJS module in ESM context
     
    const { createRequire } = require('module');
    const req = createRequire(import.meta.url);
    const Database = req('better-sqlite3');
    const fs = req('fs');
    const path = req('path');
    
    const dir = path.join(process.cwd(), 'data');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    
    const filePath = path.join(dir, 'metadata.db');
    db = new Database(filePath) as SQLiteDatabase;
    
    // Optimize SQLite performance
    db.pragma('journal_mode = WAL');
    db.pragma('synchronous = NORMAL');
    db.pragma('cache_size = 10000');
    db.pragma('temp_store = MEMORY');
    db.pragma('mmap_size = 268435456'); // 256MB
    
    // Create table with indexes for better performance
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
    
    // Create indexes for common queries
    db.prepare('CREATE INDEX IF NOT EXISTS idx_profile_metadata_updated_at ON profile_metadata(updated_at)').run();
    db.prepare('CREATE INDEX IF NOT EXISTS idx_profile_metadata_email ON profile_metadata(email)').run();
    
    dbInitialized = true;
    return db;
  } catch (error) {
    const dbError: DatabaseError = {
      message: 'Failed to initialize SQLite database',
      code: 'INITIALIZATION_FAILED',
      details: { error: error instanceof Error ? error.message : 'Unknown error' }
    };
    
    dbLogger.error(dbError.message, error instanceof Error ? error : new Error(dbError.message), {
      fallback: 'in-memory'
    });
    
    dbInitialized = true;
    // Fallback to in-memory (non-persistent)
    memStore = memStore || new Map();
    return null;
  }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  
  if (!id) {
    const error: APIError = {
      message: 'Missing id parameter',
      status: 400,
      code: 'MISSING_PARAMETER'
    };
    
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 400, 
      headers: { 'Content-Type': 'application/json' } 
    });
  }
  
  try {
    const sqlite = getDb();
    if (sqlite) {
      const row = sqlite.prepare('SELECT * FROM profile_metadata WHERE profile_id = ?').get(id);
      return new Response(JSON.stringify(row || { profile_id: id }), { 
        status: 200, 
        headers: { 
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=300' // Cache for 5 minutes
        } 
      });
    }
    
    const data = memStore!.get(id) || { profile_id: id };
    return new Response(JSON.stringify(data), { 
      status: 200, 
      headers: { 
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=300' // Cache for 5 minutes
      } 
    });
  } catch (error) {
    const apiError: APIError = {
      message: 'Database error occurred',
      status: 500,
      code: 'DATABASE_ERROR'
    };
    
    dbLogger.error('GET profile metadata error', error instanceof Error ? error : new Error(apiError.message), {
      profileId: id
    });
    
    return new Response(JSON.stringify({ error: apiError.message }), { 
      status: 500, 
      headers: { 'Content-Type': 'application/json' } 
    });
  }
}

export async function PUT(req: Request) {
  try {
    const body = (await req.json()) as ProfileMetadata;
    
    if (!body?.profile_id) {
      const error: APIError = {
        message: 'Missing profile_id in request body',
        status: 400,
        code: 'MISSING_PARAMETER'
      };
      
      return new Response(JSON.stringify({ error: error.message }), { 
        status: 400, 
        headers: { 'Content-Type': 'application/json' } 
      });
    }
    
    body.updated_at = new Date().toISOString();
    const sqlite = getDb();
    
    if (sqlite) {
      // Use transaction for better performance
      const transaction = sqlite.transaction(() => {
        sqlite
          .prepare(`INSERT INTO profile_metadata (profile_id, location, phone, email, website, image_url, birth_date, gender, updated_at)
                    VALUES (@profile_id, @location, @phone, @email, @website, @image_url, @birth_date, @gender, @updated_at)
                    ON CONFLICT(profile_id) DO UPDATE SET
                      location=excluded.location,
                      phone=excluded.phone,
                      email=excluded.email,
                      website=excluded.website,
                      image_url=excluded.image_url,
                      birth_date=excluded.birth_date,
                      gender=excluded.gender,
                      updated_at=excluded.updated_at`)
          .run(body);
      });
      
      transaction();
    } else {
      memStore!.set(body.profile_id, body);
    }
    
    return new Response(JSON.stringify({ ok: true, updated_at: body.updated_at }), { 
      status: 200, 
      headers: { 'Content-Type': 'application/json' } 
    });
  } catch (error) {
    const apiError: APIError = {
      message: error instanceof Error ? error.message : 'Invalid JSON',
      status: 400,
      code: 'INVALID_REQUEST'
    };
    
    dbLogger.error('PUT profile metadata error', error instanceof Error ? error : new Error(apiError.message));
    
    return new Response(JSON.stringify({ error: apiError.message }), { 
      status: 400, 
      headers: { 'Content-Type': 'application/json' } 
    });
  }
}


