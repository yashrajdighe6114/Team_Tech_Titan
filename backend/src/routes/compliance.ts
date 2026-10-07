import { Router } from 'express';
import { db } from '../db/database.js';
import { authMiddleware, requireRole } from '../middleware/auth.js';
import { computeAssetHealthScore } from '../services/healthScore.js';
import { logAuditAction } from '../services/auditLogger.js';

export const complianceRouter = Router();

// Get assets pending compliance approval
complianceRouter.get('/pending', authMiddleware, (req, res) => {
  const assets = db.prepare(`
    SELECT * FROM assets
    WHERE status IN ('VERIFIED', 'REVIEW', 'DRAFT', 'ENCUMBERED')
    ORDER BY created_at DESC
  `).all() as any[];

  const enriched = assets.map(a => {
    const latestVer = db.prepare('SELECT * FROM verifications WHERE asset_id = ? ORDER BY created_at DESC LIMIT 1').get(a.id) as any;
    const encumbrances = db.prepare('SELECT * FROM encumbrances WHERE asset_id = ?').all(a.id);
    const documents = db.prepare('SELECT * FROM asset_documents WHERE asset_id = ?').all(a.id);

    return {
      ...a,
      is_encumbered: Boolean(a.is_encumbered),
      transfer_restricted: Boolean(a.transfer_restricted),
      health_breakdown: a.health_breakdown ? JSON.parse(a.health_breakdown) : {},
      latest_verification: latestVer ? {
        ...latestVer,
        extracted_fields: latestVer.extracted_fields ? JSON.parse(latestVer.extracted_fields) : {},
        detected_issues: latestVer.detected_issues ? JSON.parse(latestVer.detected_issues) : [],
        evidence: latestVer.evidence ? JSON.parse(latestVer.evidence) : []
      } : null,
      encumbrances,
      documents_count: documents.length
    };
  });

  res.json({ assets: enriched });
});

// Compliance Officer Approves Asset
complianceRouter.post('/:assetId/approve', authMiddleware, requireRole(['COMPLIANCE_OFFICER', 'ADMIN']), async (req, res) => {
  const assetId = req.params.assetId;
  const { notes } = req.body;

  const asset = db.prepare('SELECT * FROM assets WHERE id = ?').get(assetId) as any;
  if (!asset) return res.status(404).json({ error: 'Asset not found' });

  // Safety check: Cannot approve if critical issues exist
  const latestVer = db.prepare('SELECT * FROM verifications WHERE asset_id = ? ORDER BY created_at DESC LIMIT 1').get(assetId) as any;
  if (latestVer) {
    const issues = latestVer.detected_issues ? JSON.parse(latestVer.detected_issues) : [];
    const hasCriticalMismatch = issues.some((i: string) => i.toLowerCase().includes('mismatch'));
    if (hasCriticalMismatch) {
      return res.status(400).json({
        error: 'Compliance Approval Blocked: Unresolved title mismatch detected in verification documents. Resolve discrepancies before approval.'
      });
    }
  }

  const encumbrances = db.prepare('SELECT * FROM encumbrances WHERE asset_id = ?').all(assetId) as any[];

  // Recalculate health score with compliance approval
  const newHealth = computeAssetHealthScore({
    verificationStatus: latestVer ? latestVer.status : 'PASS',
    encumbrances,
    complianceApproved: true
  });

  const now = new Date().toISOString();
  db.prepare(`
    UPDATE assets
    SET status = 'APPROVED', health_score = ?, health_breakdown = ?, updated_at = ?
    WHERE id = ?
  `).run(newHealth.totalScore, JSON.stringify(newHealth), now, assetId);

  logAuditAction({
    assetId,
    userEmail: req.user!.email,
    action: 'Compliance Approved',
    status: 'SUCCESS',
    details: notes || 'Asset approved for tokenization and issuance'
  });

  res.json({
    success: true,
    message: 'Asset officially approved by Compliance Officer. Ready for tokenization.',
    health_score: newHealth.totalScore
  });
});

// Compliance Officer Rejects Asset
complianceRouter.post('/:assetId/reject', authMiddleware, requireRole(['COMPLIANCE_OFFICER', 'ADMIN']), async (req, res) => {
  const assetId = req.params.assetId;
  const { reason } = req.body;

  const asset = db.prepare('SELECT * FROM assets WHERE id = ?').get(assetId) as any;
  if (!asset) return res.status(404).json({ error: 'Asset not found' });

  const now = new Date().toISOString();
  db.prepare(`
    UPDATE assets
    SET status = 'REJECTED', transfer_restricted = 1, restriction_reason = ?, updated_at = ?
    WHERE id = ?
  `).run(reason || 'Rejected by Compliance Officer', now, assetId);

  logAuditAction({
    assetId,
    userEmail: req.user!.email,
    action: 'Compliance Rejected',
    status: 'FLAGGED',
    details: reason || 'Asset rejected due to regulatory or title deficiencies'
  });

  res.json({
    success: true,
    message: 'Asset rejected by Compliance Officer.'
  });
});

// Compliance Officer Requests Review
complianceRouter.post('/:assetId/request-review', authMiddleware, requireRole(['COMPLIANCE_OFFICER', 'ADMIN']), async (req, res) => {
  const assetId = req.params.assetId;
  const { instructions } = req.body;

  const asset = db.prepare('SELECT * FROM assets WHERE id = ?').get(assetId) as any;
  if (!asset) return res.status(404).json({ error: 'Asset not found' });

  const now = new Date().toISOString();
  db.prepare(`
    UPDATE assets
    SET status = 'REVIEW', restriction_reason = ?, updated_at = ?
    WHERE id = ?
  `).run(instructions || 'Additional documentation requested by Compliance', now, assetId);

  logAuditAction({
    assetId,
    userEmail: req.user!.email,
    action: 'Compliance Review Requested',
    status: 'PENDING',
    details: instructions || 'Further clarification requested on ownership or valuation documents'
  });

  res.json({
    success: true,
    message: 'Review request sent to Asset Owner.'
  });
});
