import sqlite3 from 'sqlite3';
import path from 'path';
import fs from 'fs';
import os from 'os';

// Use temp directory on Vercel, local data dir otherwise
const dbPath = process.env.DATABASE_URL || 
  (process.env.VERCEL 
    ? path.join(os.tmpdir(), 'knowledge.db')
    : path.join(process.cwd(), 'data', 'knowledge.db'));

// Ensure data directory exists (may fail on Vercel, that's okay)
const dataDir = path.dirname(dbPath);
try {
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
} catch (err) {
  console.warn(`Could not create data directory at ${dataDir}:`, err);
  // Continue anyway - SQLite will try to create the file
}

let db: sqlite3.Database | null = null;

// Wrapper to convert sqlite3 callback API to promises
function runAsync(query: string, params: any[] = []): Promise<void> {
  return new Promise((resolve, reject) => {
    db!.run(query, params, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
}

function getAsync(query: string, params: any[] = []): Promise<any> {
  return new Promise((resolve, reject) => {
    db!.get(query, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

function allAsync(query: string, params: any[] = []): Promise<any[]> {
  return new Promise((resolve, reject) => {
    db!.all(query, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows || []);
    });
  });
}

function execAsync(sql: string): Promise<void> {
  return new Promise((resolve, reject) => {
    db!.exec(sql, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
}

export function getDatabase(): sqlite3.Database {
  if (!db) {
    db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        console.error('Database error:', err);
      } else {
        console.log('Database connected successfully');
        initializeDatabase();
      }
    });
    db.configure('busyTimeout', 5000);
  }
  return db;
}

let initialized = false;
let initPromise: Promise<void> | null = null;

async function initializeDatabase() {
  if (initialized || initPromise) return initPromise;

  initPromise = (async () => {
    try {
      // Create documents table
      await execAsync(`
        CREATE TABLE IF NOT EXISTS documents (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          content TEXT NOT NULL,
          uploadedAt TEXT NOT NULL,
          wordCount INTEGER NOT NULL
        );
      `);

      // Create embeddings/chunks table for source attribution
      await execAsync(`
        CREATE TABLE IF NOT EXISTS chunks (
          id TEXT PRIMARY KEY,
          documentId TEXT NOT NULL,
          chunkIndex INTEGER NOT NULL,
          content TEXT NOT NULL,
          FOREIGN KEY (documentId) REFERENCES documents(id) ON DELETE CASCADE
        );
      `);

      // Create conversation history table
      await execAsync(`
        CREATE TABLE IF NOT EXISTS conversations (
          id TEXT PRIMARY KEY,
          question TEXT NOT NULL,
          answer TEXT NOT NULL,
          sources TEXT NOT NULL,
          createdAt TEXT NOT NULL
        );
      `);
      
      initialized = true;
      console.log('Database initialized successfully');
    } catch (error) {
      console.error('Error initializing database:', error);
      // Don't mark as initialized if there's an error
      initPromise = null;
    }
  })();
  
  return initPromise;
}

export { runAsync, getAsync, allAsync, execAsync };

export function closeDatabase() {
  if (db) {
    db.close((err) => {
      if (err) {
        console.error('Error closing database:', err);
      }
    });
    db = null;
  }
}

