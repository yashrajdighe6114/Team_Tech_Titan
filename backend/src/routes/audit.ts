import { Router } from 'express';
import { db } from '../db/database.js';

export const auditRouter = Router();

// Get audit logs
auditRouter.get('/', (req, res) => {
  const { assetId, limit } = req.query;
  const max = Number(limit) || 100;

  let query = 'SELECT * FROM audit_logs';
  const params: any[] = [];

  if (assetId) {
    query += ' WHERE asset_id = ?';
    params.push(assetId);
  }

  query += ' ORDER BY timestamp DESC LIMIT ?';
  params.push(max);

  const logs = db.prepare(query).all(...params) as any[];

  const enriched = logs.map(l => {
    let assetName = 'System';
    if (l.asset_id) {
      const asset = db.prepare('SELECT name FROM assets WHERE id = ?').get(l.asset_id) as any;
      if (asset) assetName = asset.name;
    }
    return {
      ...l,
      asset_name: assetName,
      details: l.details ? (typeof l.details === 'string' && (l.details.startsWith('{') || l.details.startsWith('[')) ? JSON.parse(l.details) : l.details) : ''
    };
  });

  res.json({ logs: enriched });
});
