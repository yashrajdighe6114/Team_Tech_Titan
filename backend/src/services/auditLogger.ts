import crypto from 'node:crypto';
import { db } from '../db/database.js';

export interface AuditLogEntry {
  assetId?: string | null;
  userEmail: string;
  action: string;
  status: 'SUCCESS' | 'FAILED' | 'PENDING' | 'FLAGGED' | 'RESTRICTED';
  details?: any;
  drunixRef?: string;
}

export function logAuditAction(entry: AuditLogEntry) {
  const id = crypto.randomUUID();
  const timestamp = new Date().toISOString();
  const detailsStr = entry.details ? (typeof entry.details === 'string' ? entry.details : JSON.stringify(entry.details)) : null;

  try {
    db.prepare(`
      INSERT INTO audit_logs (id, asset_id, user_email, action, status, details, drunix_ref, timestamp)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      entry.assetId || null,
      entry.userEmail,
      entry.action,
      entry.status,
      detailsStr,
      entry.drunixRef || 'DEV-LEDGER',
      timestamp
    );
  } catch (err) {
    console.error('Failed to log audit entry:', err);
  }

  return { id, timestamp, ...entry };
}

export function getAuditLogs(assetId?: string) {
  if (assetId) {
    return db.prepare('SELECT * FROM audit_logs WHERE asset_id = ? ORDER BY timestamp DESC').all(assetId);
  }
  return db.prepare('SELECT * FROM audit_logs ORDER BY timestamp DESC LIMIT 100').all();
}
