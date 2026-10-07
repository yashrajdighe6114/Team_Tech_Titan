import { Router } from 'express';
import crypto from 'node:crypto';
import { db } from '../db/database.js';
import { authMiddleware, requireRole } from '../middleware/auth.js';
import { drunixLedger } from '../drunix/drunix-adapter.js';
import { logAuditAction } from '../services/auditLogger.js';

export const tokenizationRouter = Router();

// Get token details for an asset
tokenizationRouter.get('/:assetId', (req, res) => {
  const assetId = req.params.assetId;
  const token = db.prepare('SELECT * FROM tokens WHERE asset_id = ?').get(assetId) as any;
  if (!token) return res.status(404).json({ error: 'Token not yet minted for this asset' });

  const holdings = db.prepare('SELECT * FROM token_holdings WHERE token_id = ?').all(token.id);
  res.json({ token, holdings });
});

// Execute Tokenization
tokenizationRouter.post('/:assetId', authMiddleware, requireRole(['ADMIN', 'ASSET_OWNER']), async (req, res) => {
  const assetId = req.params.assetId;
  const { token_name, symbol, total_supply, token_price } = req.body;

  const asset = db.prepare('SELECT * FROM assets WHERE id = ?').get(assetId) as any;
  if (!asset) return res.status(404).json({ error: 'Asset not found' });

  // 1. Guard: Check duplicate tokenization
  const existingToken = db.prepare('SELECT id FROM tokens WHERE asset_id = ?').get(assetId);
  if (existingToken) {
    return res.status(400).json({ error: 'Asset is already tokenized. Duplicate tokenization is prohibited.' });
  }

  // 2. Guard: Compliance Approval check (Required by Hackathon rules: "An asset cannot be tokenized until approved")
  if (asset.status !== 'APPROVED' && asset.status !== 'VERIFIED') {
    return res.status(400).json({
      error: `Compliance Approval Required: Asset current status is '${asset.status}'. It must be reviewed and approved by a Compliance Officer before tokenization.`
    });
  }

  // 3. Guard: Encumbrance / Restriction check
  if (asset.transfer_restricted) {
    return res.status(400).json({
      error: `Cannot tokenize: Asset has active restrictions (${asset.restriction_reason || 'Encumbrance / Lien active'})`
    });
  }

  const supply = Number(total_supply) || 100000;
  const price = Number(token_price) || (Number(asset.declared_value) / supply);
  const tName = token_name || `${asset.name} Fractional Token`;
  const tSymbol = symbol || asset.name.substring(0, 4).toUpperCase();

  const tokenId = `tok-${crypto.randomUUID().substring(0, 8)}`;
  const now = new Date().toISOString();

  // Execute on DRUNIX Ledger Adapter
  const drunixResult = await drunixLedger.tokenizeAsset({
    assetId,
    tokenName: tName,
    symbol: tSymbol,
    totalSupply: supply,
    tokenPrice: price,
    complianceApprovalHash: crypto.createHash('sha256').update(`${assetId}:compliance-approved:${now}`).digest('hex')
  });

  // Store token in database
  db.prepare(`
    INSERT INTO tokens (id, asset_id, token_name, symbol, total_supply, available_supply, token_price, status, drunix_ledger_ref, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, 'ACTIVE', ?, ?)
  `).run(
    tokenId,
    assetId,
    tName,
    tSymbol,
    supply,
    supply,
    price,
    `DEV-SEQ-#${drunixResult.sequenceNumber}`,
    now
  );

  // Update asset status
  db.prepare(`
    UPDATE assets
    SET status = 'TOKENIZED', drunix_status = 'ANCHORED_DEV_LEDGER', updated_at = ?
    WHERE id = ?
  `).run(now, assetId);

  // Initial token allocation to Asset Owner
  const ownerHoldingId = `hld-${crypto.randomUUID().substring(0, 8)}`;
  const ownerEmail = req.user?.email || 'owner@assettrust.demo';
  const ownerId = req.user?.id || 'usr-owner';

  db.prepare(`
    INSERT INTO token_holdings (id, token_id, asset_id, user_id, user_email, balance, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    ownerHoldingId,
    tokenId,
    assetId,
    ownerId,
    ownerEmail,
    supply,
    now
  );

  logAuditAction({
    assetId,
    userEmail: req.user!.email,
    action: 'Asset Tokenized',
    status: 'SUCCESS',
    details: `Minted ${supply.toLocaleString()} ${tSymbol} tokens at ₹${price.toLocaleString('en-IN')}/token (Total Value: ₹${(supply * price).toLocaleString('en-IN')})`,
    drunixRef: `DEV-SEQ-#${drunixResult.sequenceNumber}`
  });

  const createdToken = db.prepare('SELECT * FROM tokens WHERE id = ?').get(tokenId);

  res.status(201).json({
    success: true,
    token: createdToken,
    drunixResult,
    networkStatus: drunixLedger.getNetworkStatus(),
    message: 'Asset successfully tokenized on DRUNIX Development Ledger Adapter.'
  });
});
