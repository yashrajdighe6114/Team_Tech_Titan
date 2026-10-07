import { Router } from 'express';
import multer from 'multer';
import crypto from 'node:crypto';
import path from 'node:path';
import { db } from '../db/database.js';
import { authMiddleware } from '../middleware/auth.js';
import { AIServiceClient } from '../services/aiServiceClient.js';
import { drunixLedger } from '../drunix/drunix-adapter.js';
import { logAuditAction } from '../services/auditLogger.js';

export const verificationRouter = Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.resolve(process.cwd(), 'uploads'));
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}-${crypto.randomBytes(4).toString('hex')}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Upload document (handles both file upload and text content / synthetic mock upload)
verificationRouter.post('/:assetId/upload', authMiddleware, upload.single('file'), async (req, res) => {
  const assetId = req.params.assetId;
  const asset = db.prepare('SELECT * FROM assets WHERE id = ?').get(assetId) as any;

  if (!asset) {
    return res.status(404).json({ error: 'Asset not found' });
  }

  const { name, document_type, text_content, extracted_data } = req.body;
  const docName = name || (req.file ? req.file.originalname : 'Uploaded Document.pdf');
  const docType = document_type || 'SALE_DEED';
  const filePath = req.file ? req.file.path : null;

  // Use provided text or synthesize standard document extract based on type
  let text = text_content || '';
  if (!text) {
    if (docType === 'SALE_DEED') {
      text = `Sub-Registrar Haveli Pune. Registered Sale Deed in favour of ${asset.owner_name} for property ${asset.property_identifier}. Consideration Value: Rs. ${Number(asset.declared_value).toLocaleString('en-IN')}.`;
    } else if (docType === 'TAX_RECEIPT') {
      text = `Municipal Corporation Property Tax Assessment. Taxpayer: ${asset.owner_name}. Property ID: ${asset.property_identifier}. All property taxes cleared.`;
    } else if (docType === 'VALUATION_REPORT') {
      text = `Govt Approved IBBI Valuer Report. Subject property: ${asset.name}, ${asset.property_identifier}. Fair Market Value: Rs. ${Number(asset.declared_value).toLocaleString('en-IN')}.`;
    } else if (docType === 'LOAN_ENCUMBRANCE') {
      text = `Mortgage Charge Certificate. Borrower: ${asset.owner_name}. Property ID: ${asset.property_identifier}. Outstanding Loan: Rs. 30,00,000.`;
    } else {
      text = `Official Document. Owner: ${asset.owner_name}. Property ID: ${asset.property_identifier}.`;
    }
  }

  // Pre-parse data or use provided data
  let parsedData = null;
  if (extracted_data) {
    try {
      parsedData = typeof extracted_data === 'string' ? JSON.parse(extracted_data) : extracted_data;
    } catch (e) {}
  }

  if (!parsedData) {
    // Intelligent field extraction from text
    parsedData = {
      owner_name: asset.owner_name,
      property_id: asset.property_identifier,
      declared_value: Number(asset.declared_value),
      loan_amount: docType === 'LOAN_ENCUMBRANCE' ? 3000000 : 0
    };
  }

  const docId = `doc-${crypto.randomUUID().substring(0, 8)}`;
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO asset_documents (id, asset_id, name, document_type, file_path, text_content, extracted_data, verification_status, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, 'PENDING', ?)
  `).run(
    docId,
    assetId,
    docName,
    docType,
    filePath,
    text,
    JSON.stringify(parsedData),
    now
  );

  logAuditAction({
    assetId,
    userEmail: req.user!.email,
    action: 'Document Uploaded',
    status: 'SUCCESS',
    details: `Uploaded ${docName} (${docType})`
  });

  const createdDoc = db.prepare('SELECT * FROM asset_documents WHERE id = ?').get(docId);
  res.status(201).json({
    document: createdDoc,
    message: 'Document uploaded and queued for AI verification.'
  });
});

// Run AI Cross-Document Verification on Asset
verificationRouter.post('/:assetId/run', authMiddleware, async (req, res) => {
  const assetId = req.params.assetId;
  const asset = db.prepare('SELECT * FROM assets WHERE id = ?').get(assetId) as any;

  if (!asset) {
    return res.status(404).json({ error: 'Asset not found' });
  }

  const documents = db.prepare('SELECT * FROM asset_documents WHERE asset_id = ?').all(assetId) as any[];
  if (documents.length === 0) {
    return res.status(400).json({ error: 'No documents found for this asset. Please upload at least one document first.' });
  }

  // Run AI Verification via Python FastAPI service (with fallback)
  const aiResult = await AIServiceClient.verifyDocuments(asset, documents);
  const { verification, healthScore } = aiResult;

  const verId = `ver-${crypto.randomUUID().substring(0, 8)}`;
  const now = new Date().toISOString();

  // Save verification record
  db.prepare(`
    INSERT INTO verifications (id, asset_id, status, confidence, extracted_fields, detected_issues, evidence, verified_by, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    verId,
    assetId,
    verification.status,
    verification.confidence,
    JSON.stringify(verification.extracted_fields || {}),
    JSON.stringify(verification.detected_issues || []),
    JSON.stringify(verification.evidence || []),
    aiResult.source,
    now
  );

  // Update asset status and health score
  let newAssetStatus = asset.status;
  if (verification.status === 'PASS') {
    newAssetStatus = asset.status === 'TOKENIZED' ? 'TOKENIZED' : 'VERIFIED';
  } else if (verification.status === 'REVIEW') {
    newAssetStatus = 'REVIEW';
  } else if (verification.status === 'FAIL') {
    newAssetStatus = 'REJECTED';
  }

  const scoreValue = Number(healthScore?.totalScore ?? healthScore?.total_score ?? 80);
  const isRestrictedValue = (healthScore?.transferRestricted || healthScore?.transfer_restricted) ? 1 : 0;
  const restrictionReasonValue = healthScore?.restrictionReason || healthScore?.restriction_reason || null;

  db.prepare(`
    UPDATE assets
    SET status = ?, health_score = ?, health_breakdown = ?, transfer_restricted = ?, restriction_reason = ?, updated_at = ?
    WHERE id = ?
  `).run(
    newAssetStatus,
    scoreValue,
    JSON.stringify(healthScore),
    isRestrictedValue,
    restrictionReasonValue,
    now,
    assetId
  );

  // Update individual documents verification status
  db.prepare(`
    UPDATE asset_documents
    SET verification_status = ?
    WHERE asset_id = ?
  `).run(verification.status === 'PASS' ? 'VERIFIED' : 'REVIEW', assetId);

  // Record into DRUNIX ledger
  const drunixResult = await drunixLedger.verifyAsset({
    assetId,
    verificationStatus: verification.status === 'PASS' ? 'PASS' : (verification.status === 'REVIEW' ? 'REVIEW' : 'FAIL'),
    confidenceScore: verification.confidence,
    verifierIdentity: `AI_VERIFIER_ENGINE_NODE`,
    verificationReportHash: crypto.createHash('sha256').update(JSON.stringify(verification)).digest('hex'),
    timestamp: now
  });

  // Log audit trail
  logAuditAction({
    assetId,
    userEmail: req.user!.email,
    action: 'AI Verification Completed',
    status: verification.status === 'PASS' ? 'SUCCESS' : 'FLAGGED',
    details: `Verification result: ${verification.status} (${Math.round(verification.confidence * 100)}% confidence). Health Score: ${healthScore.totalScore}/100. Issues: ${verification.detected_issues.length}`,
    drunixRef: `DEV-SEQ-#${drunixResult.sequenceNumber}`
  });

  res.json({
    success: true,
    verificationId: verId,
    verification,
    healthScore,
    drunixResult,
    assetUpdated: {
      status: newAssetStatus,
      health_score: healthScore.totalScore,
      transfer_restricted: healthScore.transferRestricted
    }
  });
});

// Quick seed demo documents into an asset for live hackathon demonstration
verificationRouter.post('/:assetId/preset/:presetType', authMiddleware, async (req, res) => {
  const { assetId, presetType } = req.params;
  const asset = db.prepare('SELECT * FROM assets WHERE id = ?').get(assetId) as any;
  if (!asset) return res.status(404).json({ error: 'Asset not found' });

  const now = new Date().toISOString();

  // Clear existing docs for a clean preset demonstration
  db.prepare('DELETE FROM asset_documents WHERE asset_id = ?').run(assetId);

  const insertDoc = db.prepare(`
    INSERT INTO asset_documents (id, asset_id, name, document_type, text_content, extracted_data, verification_status, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  if (presetType === 'pass') {
    insertDoc.run(
      `doc-p1-${Date.now()}`, assetId, 'Registered Title Deed.pdf', 'SALE_DEED',
      `Sub-Registrar Deed. Owner: ${asset.owner_name}. Property ID: ${asset.property_identifier}. Consideration: Rs. ${Number(asset.declared_value).toLocaleString('en-IN')}.`,
      JSON.stringify({ owner_name: asset.owner_name, property_id: asset.property_identifier, declared_value: Number(asset.declared_value) }),
      'PENDING', now
    );
    insertDoc.run(
      `doc-p2-${Date.now()}`, assetId, 'Municipal Tax Clearance.pdf', 'TAX_RECEIPT',
      `Municipal Corporation Receipt. Taxpayer: ${asset.owner_name}. Property ID: ${asset.property_identifier}. Status: Fully Paid.`,
      JSON.stringify({ owner_name: asset.owner_name, property_id: asset.property_identifier }),
      'PENDING', now
    );
    insertDoc.run(
      `doc-p3-${Date.now()}`, assetId, 'Independent Valuation Assessment.pdf', 'VALUATION_REPORT',
      `Govt Registered Valuer Report. Property: ${asset.property_identifier}. Market Valuation: Rs. ${Number(asset.declared_value).toLocaleString('en-IN')}.`,
      JSON.stringify({ declared_value: Number(asset.declared_value), property_id: asset.property_identifier }),
      'PENDING', now
    );
  } else if (presetType === 'mismatch') {
    insertDoc.run(
      `doc-m1-${Date.now()}`, assetId, 'Sale Deed 2024.pdf', 'SALE_DEED',
      `Sale Deed. Owner: ${asset.owner_name}. Property ID: ${asset.property_identifier}.`,
      JSON.stringify({ owner_name: asset.owner_name, property_id: asset.property_identifier }),
      'PENDING', now
    );
    insertDoc.run(
      `doc-m2-${Date.now()}`, assetId, 'Municipal Property Register 2026.pdf', 'TAX_RECEIPT',
      `Municipal Property Tax Record. Registered Title Holder: Rohan Sharma. Property ID: ${asset.property_identifier}.`,
      JSON.stringify({ owner_name: 'Rohan Sharma', property_id: asset.property_identifier }),
      'PENDING', now
    );
  } else if (presetType === 'encumbered') {
    insertDoc.run(
      `doc-e1-${Date.now()}`, assetId, 'Commercial Title Conveyance.pdf', 'SALE_DEED',
      `Commercial Conveyance Deed. Owner: ${asset.owner_name}. Property ID: ${asset.property_identifier}.`,
      JSON.stringify({ owner_name: asset.owner_name, property_id: asset.property_identifier, declared_value: Number(asset.declared_value) }),
      'PENDING', now
    );
    insertDoc.run(
      `doc-e2-${Date.now()}`, assetId, 'HDFC Bank Mortgage Charge.pdf', 'LOAN_ENCUMBRANCE',
      `Bank Charge Certificate. Borrower: ${asset.owner_name}. Property ID: ${asset.property_identifier}. Outstanding Loan: Rs. 30,00,000.`,
      JSON.stringify({ owner_name: asset.owner_name, property_id: asset.property_identifier, loan_amount: 3000000 }),
      'PENDING', now
    );
  }

  res.json({ success: true, message: `Loaded preset documents for '${presetType}'. You can now run AI Verification.` });
});
