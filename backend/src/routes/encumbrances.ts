import { Router } from 'express';
import crypto from 'node:crypto';
import { db } from '../db/database.js';
import { authMiddleware, requireRole } from '../middleware/auth.js';
import { computeAssetHealthScore } from '../services/healthScore.js';
import { drunixLedger } from '../drunix/drunix-adapter.js';
import { logAuditAction } from '../services/auditLogger.js';

export const encumbrancesRouter = Router();

// List encumbrances for an asset
encumbrancesRouter.get('/:assetId', (req, res) => {
  const assetId = req.params.assetId;
  const encumbrances = db.prepare('SELECT * FROM encumbrances WHERE asset_id = ? ORDER BY created_at DESC').all(assetId);
  res.json({ encumbrances });
});

// Add Encumbrance
encumbrancesRouter.post('/:assetId', authMiddleware, requireRole(['BANK', 'ADMIN', 'COMPLIANCE_OFFICER']), async (req, res) => {
  const assetId = req.params.assetId;
  const { lender_name, amount, encumbrance_type, notes } = req.body;

  if (!amount || Number(amount) <= 0) {
    return res.status(400).json({ error: 'Valid encumbrance / loan amount is required' });
  }

  const asset = db.prepare('SELECT * FROM assets WHERE id = ?').get(assetId) as any;
  if (!asset) return res.status(404).json({ error: 'Asset not found' });

  const encId = `enc-${crypto.randomUUID().substring(0, 8)}`;
  const encAmount = Number(amount);
  const lender = lender_name || 'HDFC Bank';
  const type = encumbrance_type || 'MORTGAGE_LOAN';
  const now = new Date().toISOString();

  // 1. Insert encumbrance record
  db.prepare(`
    INSERT INTO encumbrances (id, asset_id, lender_name, amount, encumbrance_type, status, notes, created_at)
    VALUES (?, ?, ?, ?, ?, 'ACTIVE', ?, ?)
  `).run(
    encId,
    assetId,
    lender,
    encAmount,
    type,
    notes || 'Commercial term mortgage charge registered',
    now
  );

  // 2. Fetch all active encumbrances for asset
  const allEncumbrances = db.prepare('SELECT * FROM encumbrances WHERE asset_id = ?').all(assetId) as any[];

  // 3. Recalculate health score (e.g., drops significantly from 91 to 68)
  const latestVer = db.prepare('SELECT * FROM verifications WHERE asset_id = ? ORDER BY created_at DESC LIMIT 1').get(assetId) as any;
  const updatedHealth = computeAssetHealthScore({
    verificationStatus: latestVer ? latestVer.status : 'PASS',
    encumbrances: allEncumbrances,
    complianceApproved: asset.status === 'TOKENIZED' || asset.status === 'APPROVED'
  });

  const restrictionReason = `Outstanding loan / encumbrance detected (₹${encAmount.toLocaleString('en-IN')} by ${lender}). Transfer restricted by smart compliance.`;

  // 4. Update asset to ENCUMBERED and RESTRICTED
  db.prepare(`
    UPDATE assets
    SET is_encumbered = 1,
        transfer_restricted = 1,
        restriction_reason = ?,
        health_score = ?,
        health_breakdown = ?,
        updated_at = ?
    WHERE id = ?
  `).run(
    restrictionReason,
    updatedHealth.totalScore,
    JSON.stringify(updatedHealth),
    now,
    assetId
  );

  // 5. Record in DRUNIX Ledger Adapter
  const drunixResult = await drunixLedger.addEncumbrance({
    assetId,
    encumbranceId: encId,
    lenderName: lender,
    amount: encAmount,
    encumbranceType: type,
    registeredDate: now
  });

  // Freeze asset in DRUNIX
  await drunixLedger.freezeAsset(assetId, restrictionReason);

  // 6. Log Audit Trail
  logAuditAction({
    assetId,
    userEmail: req.user!.email,
    action: 'Encumbrance Added',
    status: 'FLAGGED',
    details: `Added ₹${encAmount.toLocaleString('en-IN')} lien by ${lender}. Asset Health decreased to ${updatedHealth.totalScore}/100. Transfers locked.`,
    drunixRef: `DEV-SEQ-#${drunixResult.sequenceNumber}`
  });

  res.status(201).json({
    success: true,
    encumbranceId: encId,
    assetHealth: {
      previousScore: asset.health_score,
      newScore: updatedHealth.totalScore,
      healthBreakdown: updatedHealth
    },
    transferRestricted: true,
    restrictionReason,
    drunixResult,
    message: 'Encumbrance successfully registered. Asset health decreased and transfers locked.'
  });
});

// Discharge / Release Encumbrance
encumbrancesRouter.post('/:encumbranceId/release', authMiddleware, requireRole(['BANK', 'ADMIN', 'COMPLIANCE_OFFICER']), async (req, res) => {
  const { encumbranceId } = req.params;
  const enc = db.prepare('SELECT * FROM encumbrances WHERE id = ?').get(encumbranceId) as any;
  if (!enc) return res.status(404).json({ error: 'Encumbrance record not found' });

  const now = new Date().toISOString();
  db.prepare("UPDATE encumbrances SET status = 'DISCHARGED' WHERE id = ?").run(encumbranceId);

  // Check remaining active encumbrances
  const remaining = db.prepare("SELECT * FROM encumbrances WHERE asset_id = ? AND status = 'ACTIVE'").all(enc.asset_id) as any[];

  const asset = db.prepare('SELECT * FROM assets WHERE id = ?').get(enc.asset_id) as any;
  const latestVer = db.prepare('SELECT * FROM verifications WHERE asset_id = ? ORDER BY created_at DESC LIMIT 1').get(enc.asset_id) as any;

  const updatedHealth = computeAssetHealthScore({
    verificationStatus: latestVer ? latestVer.status : 'PASS',
    encumbrances: remaining,
    complianceApproved: true
  });

  const isStillEncumbered = remaining.length > 0;
  const restrictionReason = isStillEncumbered ? asset.restriction_reason : null;

  db.prepare(`
    UPDATE assets
    SET is_encumbered = ?,
        transfer_restricted = ?,
        restriction_reason = ?,
        health_score = ?,
        health_breakdown = ?,
        updated_at = ?
    WHERE id = ?
  `).run(
    isStillEncumbered ? 1 : 0,
    isStillEncumbered ? 1 : 0,
    restrictionReason,
    updatedHealth.totalScore,
    JSON.stringify(updatedHealth),
    now,
    enc.asset_id
  );

  logAuditAction({
    assetId: enc.asset_id,
    userEmail: req.user!.email,
    action: 'Encumbrance Discharged',
    status: 'SUCCESS',
    details: `Discharged encumbrance of ₹${enc.amount.toLocaleString('en-IN')} by ${enc.lender_name}. Asset Health restored to ${updatedHealth.totalScore}/100.`
  });

  res.json({
    success: true,
    message: 'Encumbrance discharged and released. Health score updated.',
    newScore: updatedHealth.totalScore,
    transferRestricted: isStillEncumbered
  });
});
