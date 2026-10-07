import { Router } from 'express';
import { drunixLedger } from '../drunix/drunix-adapter.js';
import { db } from '../db/database.js';

export const drunixRouter = Router();

// DRUNIX status
drunixRouter.get('/status', (req, res) => {
  res.json(drunixLedger.getNetworkStatus());
});

// DRUNIX blocks (dev adapter sequenced blocks)
drunixRouter.get('/blocks', (req, res) => {
  const blocks = db.prepare('SELECT * FROM drunix_ledger_blocks ORDER BY sequence_number DESC LIMIT 50').all() as any[];
  res.json({
    networkInfo: drunixLedger.getNetworkStatus(),
    blocks: blocks.map(b => ({
      ...b,
      payload: JSON.parse(b.payload)
    }))
  });
});

// Asset DRUNIX ledger history
drunixRouter.get('/asset/:id/history', async (req, res) => {
  const history = await drunixLedger.getAssetHistory(req.params.id);
  res.json({
    assetId: req.params.id,
    networkInfo: drunixLedger.getNetworkStatus(),
    history
  });
});
