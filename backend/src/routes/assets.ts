import { Router } from 'express';
import crypto from 'node:crypto';
import { db } from '../db/database.js';
import { authMiddleware, requireRole } from '../middleware/auth.js';
import { drunixLedger } from '../drunix/drunix-adapter.js';
import { computeAssetHealthScore } from '../services/healthScore.js';
import { logAuditAction } from '../services/auditLogger.js';

export const assetsRouter = Router();

// List all assets
assetsRouter.get('/', (req, res) => {
  const { status, search } = req.query;
  let query = 'SELECT * FROM assets';
  const params: any[] = [];

  const conditions: string[] = [];
  if (status) {
    conditions.push('status = ?');
    params.push(status);
  }
  if (search) {
    conditions.push('(name LIKE ? OR property_identifier LIKE ? OR location LIKE ? OR owner_name LIKE ?)');
    const searchTerm = `%${search}%`;
    params.push(searchTerm, searchTerm, searchTerm, searchTerm);
  }

  if (conditions.length > 0) {
    query += ' WHERE ' + conditions.join(' AND ');
  }

  query += ' ORDER BY created_at DESC';

  const assets = db.prepare(query).all(...params) as any[];

  // Attach token info for each asset
  const enriched = assets.map(a => {
    const token = db.prepare('SELECT * FROM tokens WHERE asset_id = ?').get(a.id);
    let healthBreakdown = {};
    try {
      healthBreakdown = a.health_breakdown ? JSON.parse(a.health_breakdown) : {};
    } catch (e) {}

    return {
      ...a,
      token,
      health_breakdown: healthBreakdown,
      is_encumbered: Boolean(a.is_encumbered),
      transfer_restricted: Boolean(a.transfer_restricted)
    };
  });

  res.json({ assets: enriched });
});

// Get single asset by ID (with all related details)
assetsRouter.get('/:id', async (req, res) => {
  const assetId = req.params.id;
  const asset = db.prepare('SELECT * FROM assets WHERE id = ?').get(assetId) as any;

  if (!asset) {
    return res.status(404).json({ error: 'Asset not found' });
  }

  const documents = db.prepare('SELECT * FROM asset_documents WHERE asset_id = ? ORDER BY created_at ASC').all(assetId);
  const verifications = db.prepare('SELECT * FROM verifications WHERE asset_id = ? ORDER BY created_at DESC').all(assetId);
  const token = db.prepare('SELECT * FROM tokens WHERE asset_id = ?').get(assetId);
  const holdings = token ? db.prepare('SELECT * FROM token_holdings WHERE asset_id = ?').all(assetId) : [];
  const encumbrances = db.prepare('SELECT * FROM encumbrances WHERE asset_id = ? ORDER BY created_at DESC').all(assetId);
  const transfers = db.prepare('SELECT * FROM transfers WHERE asset_id = ? ORDER BY created_at DESC').all(assetId);
  const settlements = db.prepare('SELECT * FROM settlements WHERE asset_id = ? ORDER BY created_at DESC').all(assetId);
  const auditLogs = db.prepare('SELECT * FROM audit_logs WHERE asset_id = ? ORDER BY timestamp DESC').all(assetId);

  // Retrieve DRUNIX ledger history
  const drunixHistory = await drunixLedger.getAssetHistory(assetId);

  let parsedHealthBreakdown = {};
  try {
    parsedHealthBreakdown = asset.health_breakdown ? JSON.parse(asset.health_breakdown) : {};
  } catch (e) {}

  res.json({
    asset: {
      ...asset,
      is_encumbered: Boolean(asset.is_encumbered),
      transfer_restricted: Boolean(asset.transfer_restricted),
      health_breakdown: parsedHealthBreakdown
    },
    documents,
    verifications: verifications.map((v: any) => ({
      ...v,
      extracted_fields: v.extracted_fields ? JSON.parse(v.extracted_fields) : {},
      detected_issues: v.detected_issues ? JSON.parse(v.detected_issues) : [],
      evidence: v.evidence ? JSON.parse(v.evidence) : []
    })),
    token,
    holdings,
    encumbrances: encumbrances.map((e: any) => ({ ...e, active: e.status === 'ACTIVE' })),
    transfers,
    settlements,
    auditLogs,
    drunixHistory,
    drunixNetworkInfo: drunixLedger.getNetworkStatus()
  });
});

// Add Asset workflow
assetsRouter.post('/', authMiddleware, async (req, res) => {
  const {
    name,
    asset_type,
    owner_name,
    location,
    property_identifier,
    declared_value,
    description
  } = req.body;

  if (!name || !property_identifier || !declared_value) {
    return res.status(400).json({ error: 'Asset name, property identifier and declared value are required' });
  }

  // Check duplicate property identifier
  const existing = db.prepare('SELECT id FROM assets WHERE property_identifier = ?').get(property_identifier.trim());
  if (existing) {
    return res.status(400).json({ error: `Asset with Property Identifier '${property_identifier}' already exists.` });
  }

  const assetId = `ast-${crypto.randomUUID().substring(0, 8)}`;
  const now = new Date().toISOString();
  const declaredValNum = Number(declared_value);

  // Initial baseline health score
  const initialHealth = computeAssetHealthScore({
    verificationStatus: 'PENDING',
    detectedIssues: ['Pending document upload and AI verification'],
    complianceApproved: false
  });

  db.prepare(`
    INSERT INTO assets (
      id, name, asset_type, owner_name, owner_id, location, property_identifier,
      declared_value, description, status, health_score, health_breakdown,
      is_encumbered, transfer_restricted, drunix_status, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    assetId,
    name.trim(),
    asset_type || 'Residential Property',
    owner_name ? owner_name.trim() : (req.user?.full_name || 'Rahul Sharma'),
    req.user?.id || 'usr-owner',
    location ? location.trim() : 'Pune',
    property_identifier.trim(),
    declaredValNum,
    description || '',
    'DRAFT',
    initialHealth.totalScore,
    JSON.stringify(initialHealth),
    0,
    0,
    'DEVELOPMENT_ADAPTER_PENDING',
    now,
    now
  );

  // Record into DRUNIX ledger
  const drunixResult = await drunixLedger.createAsset({
    assetId,
    name: name.trim(),
    assetType: asset_type || 'Residential Property',
    ownerName: owner_name ? owner_name.trim() : req.user!.full_name,
    location: location ? location.trim() : 'Pune',
    propertyIdentifier: property_identifier.trim(),
    declaredValue: declaredValNum
  });

  // Audit log
  logAuditAction({
    assetId,
    userEmail: req.user!.email,
    action: 'Asset Created',
    status: 'SUCCESS',
    details: `Created asset ${name} (${property_identifier}) with declared value ₹${declaredValNum.toLocaleString('en-IN')}`,
    drunixRef: `DEV-SEQ-#${drunixResult.sequenceNumber}`
  });

  const createdAsset = db.prepare('SELECT * FROM assets WHERE id = ?').get(assetId);

  res.status(201).json({
    asset: createdAsset,
    drunixResult,
    message: 'Asset successfully registered and recorded in ledger adapter.'
  });
});

// Freeze/Unfreeze Asset
assetsRouter.post('/:id/freeze', authMiddleware, requireRole(['ADMIN', 'COMPLIANCE_OFFICER']), async (req, res) => {
  const assetId = req.params.id;
  const { reason } = req.body;

  const asset = db.prepare('SELECT * FROM assets WHERE id = ?').get(assetId) as any;
  if (!asset) return res.status(404).json({ error: 'Asset not found' });

  const freezeReason = reason || 'Administrative freeze order applied';
  db.prepare(`
    UPDATE assets SET transfer_restricted = 1, restriction_reason = ?, updated_at = ? WHERE id = ?
  `).run(freezeReason, new Date().toISOString(), assetId);

  const drunixResult = await drunixLedger.freezeAsset(assetId, freezeReason);

  logAuditAction({
    assetId,
    userEmail: req.user!.email,
    action: 'Asset Frozen',
    status: 'RESTRICTED',
    details: freezeReason,
    drunixRef: `DEV-SEQ-#${drunixResult.sequenceNumber}`
  });

  res.json({ success: true, message: 'Asset frozen successfully', restriction_reason: freezeReason });
});

assetsRouter.post('/:id/unfreeze', authMiddleware, requireRole(['ADMIN', 'COMPLIANCE_OFFICER']), async (req, res) => {
  const assetId = req.params.id;
  const asset = db.prepare('SELECT * FROM assets WHERE id = ?').get(assetId) as any;
  if (!asset) return res.status(404).json({ error: 'Asset not found' });

  if (asset.is_encumbered) {
    return res.status(400).json({ error: 'Cannot unfreeze: Asset has an active encumbrance/loan.' });
  }

  db.prepare(`
    UPDATE assets SET transfer_restricted = 0, restriction_reason = NULL, updated_at = ? WHERE id = ?
  `).run(new Date().toISOString(), assetId);

  logAuditAction({
    assetId,
    userEmail: req.user!.email,
    action: 'Asset Unfrozen',
    status: 'SUCCESS',
    details: 'Administrative freeze lifted'
  });

  res.json({ success: true, message: 'Asset transfer restrictions lifted' });
});
