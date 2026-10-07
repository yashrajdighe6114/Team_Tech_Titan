import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import fs from 'node:fs';

const DB_PATH = path.resolve(process.cwd(), 'assettrust.db');

export const db = new DatabaseSync(DB_PATH);

export function initDatabase() {
  // Enable foreign keys
  db.exec('PRAGMA foreign_keys = ON;');

  // Users table
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      full_name TEXT NOT NULL,
      role TEXT NOT NULL,
      kyc_status TEXT DEFAULT 'VERIFIED',
      created_at TEXT NOT NULL
    );
  `);

  // Assets table
  db.exec(`
    CREATE TABLE IF NOT EXISTS assets (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      asset_type TEXT NOT NULL,
      owner_name TEXT NOT NULL,
      owner_id TEXT,
      location TEXT NOT NULL,
      property_identifier TEXT NOT NULL,
      declared_value REAL NOT NULL,
      description TEXT,
      status TEXT NOT NULL DEFAULT 'DRAFT',
      health_score INTEGER NOT NULL DEFAULT 50,
      health_breakdown TEXT,
      is_encumbered INTEGER NOT NULL DEFAULT 0,
      transfer_restricted INTEGER NOT NULL DEFAULT 0,
      restriction_reason TEXT,
      drunix_status TEXT DEFAULT 'PENDING_REGISTRATION',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);

  // Asset Documents table
  db.exec(`
    CREATE TABLE IF NOT EXISTS asset_documents (
      id TEXT PRIMARY KEY,
      asset_id TEXT NOT NULL,
      name TEXT NOT NULL,
      document_type TEXT NOT NULL,
      file_path TEXT,
      text_content TEXT,
      extracted_data TEXT,
      verification_status TEXT DEFAULT 'PENDING',
      created_at TEXT NOT NULL,
      FOREIGN KEY (asset_id) REFERENCES assets(id) ON DELETE CASCADE
    );
  `);

  // Verifications table
  db.exec(`
    CREATE TABLE IF NOT EXISTS verifications (
      id TEXT PRIMARY KEY,
      asset_id TEXT NOT NULL,
      status TEXT NOT NULL,
      confidence REAL NOT NULL,
      extracted_fields TEXT,
      detected_issues TEXT,
      evidence TEXT,
      verified_by TEXT DEFAULT 'AI_ENGINE_V1',
      created_at TEXT NOT NULL,
      FOREIGN KEY (asset_id) REFERENCES assets(id) ON DELETE CASCADE
    );
  `);

  // Tokens table
  db.exec(`
    CREATE TABLE IF NOT EXISTS tokens (
      id TEXT PRIMARY KEY,
      asset_id TEXT NOT NULL UNIQUE,
      token_name TEXT NOT NULL,
      symbol TEXT NOT NULL,
      total_supply REAL NOT NULL,
      available_supply REAL NOT NULL,
      token_price REAL NOT NULL,
      status TEXT NOT NULL DEFAULT 'ACTIVE',
      drunix_ledger_ref TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (asset_id) REFERENCES assets(id) ON DELETE CASCADE
    );
  `);

  // Token Holdings table
  db.exec(`
    CREATE TABLE IF NOT EXISTS token_holdings (
      id TEXT PRIMARY KEY,
      token_id TEXT NOT NULL,
      asset_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      user_email TEXT NOT NULL,
      balance REAL NOT NULL DEFAULT 0,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (token_id) REFERENCES tokens(id) ON DELETE CASCADE,
      UNIQUE(token_id, user_id)
    );
  `);

  // Token Transfers table
  db.exec(`
    CREATE TABLE IF NOT EXISTS transfers (
      id TEXT PRIMARY KEY,
      token_id TEXT NOT NULL,
      asset_id TEXT NOT NULL,
      from_user TEXT NOT NULL,
      to_user TEXT NOT NULL,
      amount REAL NOT NULL,
      status TEXT NOT NULL,
      reason TEXT,
      drunix_ref TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (token_id) REFERENCES tokens(id) ON DELETE CASCADE
    );
  `);

  // Encumbrances table
  db.exec(`
    CREATE TABLE IF NOT EXISTS encumbrances (
      id TEXT PRIMARY KEY,
      asset_id TEXT NOT NULL,
      lender_name TEXT NOT NULL,
      amount REAL NOT NULL,
      encumbrance_type TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'ACTIVE',
      notes TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (asset_id) REFERENCES assets(id) ON DELETE CASCADE
    );
  `);

  // Settlements table
  db.exec(`
    CREATE TABLE IF NOT EXISTS settlements (
      id TEXT PRIMARY KEY,
      asset_id TEXT NOT NULL,
      token_id TEXT NOT NULL,
      buyer_id TEXT NOT NULL,
      buyer_email TEXT NOT NULL,
      seller_id TEXT NOT NULL,
      seller_email TEXT NOT NULL,
      amount REAL NOT NULL,
      price_per_token REAL NOT NULL,
      total_inr REAL NOT NULL,
      status TEXT NOT NULL DEFAULT 'CREATED',
      payment_method TEXT DEFAULT 'SIMULATED_ESCROW',
      payment_reference TEXT,
      drunix_ref TEXT,
      conditions_met INTEGER DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (asset_id) REFERENCES assets(id) ON DELETE CASCADE
    );
  `);

  // Audit Logs table
  db.exec(`
    CREATE TABLE IF NOT EXISTS audit_logs (
      id TEXT PRIMARY KEY,
      asset_id TEXT,
      user_email TEXT NOT NULL,
      action TEXT NOT NULL,
      status TEXT NOT NULL,
      details TEXT,
      drunix_ref TEXT,
      timestamp TEXT NOT NULL
    );
  `);

  // DRUNIX Ledger Blocks (Local cryptographically chained ledger store for dev adapter)
  db.exec(`
    CREATE TABLE IF NOT EXISTS drunix_ledger_blocks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sequence_number INTEGER NOT NULL,
      action TEXT NOT NULL,
      asset_id TEXT,
      payload TEXT NOT NULL,
      previous_hash TEXT NOT NULL,
      block_hash TEXT NOT NULL,
      adapter_mode TEXT DEFAULT 'DEVELOPMENT_ADAPTER',
      status_label TEXT NOT NULL,
      timestamp TEXT NOT NULL
    );
  `);

  // Create uploads folder
  const uploadsDir = path.resolve(process.cwd(), 'uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  console.log('✅ SQLite database initialized at', DB_PATH);
}
