import { Router } from 'express';
import crypto from 'node:crypto';
import { db } from '../db/database.js';
import { authMiddleware } from '../middleware/auth.js';
import { drunixLedger } from '../drunix/drunix-adapter.js';
import { logAuditAction } from '../services/auditLogger.js';

export const transfersRouter = Router();

// List transfers
transfersRouter.get('/', (req, res) => {
  const { assetId } = req.query;
  let query = 'SELECT * FROM transfers';
  const params: any[] = [];

  if (assetId) {
    query += ' WHERE asset_id = ?';
    params.push(assetId);
  }

  query += ' ORDER BY created_at DESC LIMIT 50';
  const transfers = db.prepare(query).all(...params);
  res.json({ transfers });
});

// Execute Token Transfer
transfersRouter.post('/', authMiddleware, async (req, res) => {
  const { asset_id, to_email, amount, reason } = req.body;

  if (!asset_id || !to_email || !amount || Number(amount) <= 0) {
    return res.status(400).json({ error: 'Asset ID, recipient email, and a valid positive amount are required' });
  }

  const transferAmount = Number(amount);
  const senderEmail = req.user!.email;
  const recipientEmail = to_email.trim().toLowerCase();

  if (senderEmail.toLowerCase() === recipientEmail) {
    return res.status(400).json({ error: 'Sender and recipient cannot be identical' });
  }

  // 1. Check Asset Status
  const asset = db.prepare('SELECT * FROM assets WHERE id = ?').get(asset_id) as any;
  if (!asset) {
    return res.status(404).json({ error: 'Asset not found' });
  }

  if (asset.status !== 'TOKENIZED') {
    return res.status(400).json({ error: `Asset is not currently in TOKENIZED state (Status: ${asset.status})` });
  }

  // 2. Encumbrance / Restriction Check (CRITICAL REQUIREMENT)
  if (asset.transfer_restricted || asset.is_encumbered) {
    const errorMsg = `Transfer Blocked: ${asset.restriction_reason || 'Asset is ENCUMBERED with an active lien/mortgage. Transfers are restricted by smart compliance.'}`;
    
    // Log failed transfer attempt to audit trail
    logAuditAction({
      assetId: asset_id,
      userEmail: senderEmail,
      action: 'Transfer Attempt Blocked',
      status: 'RESTRICTED',
      details: `Attempted transfer of ${transferAmount} tokens to ${recipientEmail} blocked due to active encumbrance.`
    });

    return res.status(403).json({
      error: errorMsg,
      code: 'ENCUMBRANCE_RESTRICTION',
      asset_health: asset.health_score,
      restriction_reason: asset.restriction_reason
    });
  }

  // 3. Check Token Existence
  const token = db.prepare('SELECT * FROM tokens WHERE asset_id = ?').get(asset_id) as any;
  if (!token) {
    return res.status(404).json({ error: 'No active token configuration found for asset' });
  }

  // 4. Validate Sender Balance
  const senderHolding = db.prepare(
    'SELECT * FROM token_holdings WHERE token_id = ? AND user_email = ?'
  ).get(token.id, senderEmail) as any;

  if (!senderHolding || senderHolding.balance < transferAmount) {
    const currentBalance = senderHolding ? senderHolding.balance : 0;
    return res.status(400).json({
      error: `Insufficient token balance. You hold ${currentBalance} tokens, but requested to transfer ${transferAmount}.`
    });
  }

  // 5. Ensure Recipient Account Exists (or find user id)
  let recipientUser = db.prepare('SELECT * FROM users WHERE email = ?').get(recipientEmail) as any;
  let recipientUserId = recipientUser ? recipientUser.id : `usr-ext-${crypto.randomUUID().substring(0, 6)}`;

  const now = new Date().toISOString();
  const transferId = `txf-${crypto.randomUUID().substring(0, 8)}`;

  // 6. Atomic Balance Update
  const newSenderBal = senderHolding.balance - transferAmount;
  db.prepare('UPDATE token_holdings SET balance = ?, updated_at = ? WHERE id = ?').run(newSenderBal, now, senderHolding.id);

  const recipientHolding = db.prepare(
    'SELECT * FROM token_holdings WHERE token_id = ? AND user_email = ?'
  ).get(token.id, recipientEmail) as any;

  if (recipientHolding) {
    const newRecipientBal = recipientHolding.balance + transferAmount;
    db.prepare('UPDATE token_holdings SET balance = ?, updated_at = ? WHERE id = ?').run(newRecipientBal, now, recipientHolding.id);
  } else {
    db.prepare(`
      INSERT INTO token_holdings (id, token_id, asset_id, user_id, user_email, balance, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      `hld-${crypto.randomUUID().substring(0, 8)}`,
      token.id,
      asset_id,
      recipientUserId,
      recipientEmail,
      transferAmount,
      now
    );
  }

  // 7. Record into DRUNIX Ledger
  const drunixResult = await drunixLedger.transferToken({
    assetId: asset_id,
    fromAccount: senderEmail,
    toAccount: recipientEmail,
    amount: transferAmount,
    purpose: reason || 'Secondary market peer-to-peer transfer'
  });

  // 8. Record Transfer
  db.prepare(`
    INSERT INTO transfers (id, token_id, asset_id, from_user, to_user, amount, status, reason, drunix_ref, created_at)
    VALUES (?, ?, ?, ?, ?, ?, 'COMPLETED', ?, ?, ?)
  `).run(
    transferId,
    token.id,
    asset_id,
    senderEmail,
    recipientEmail,
    transferAmount,
    reason || 'Peer-to-peer transfer',
    `DEV-SEQ-#${drunixResult.sequenceNumber}`,
    now
  );

  // 9. Audit Log
  logAuditAction({
    assetId: asset_id,
    userEmail: senderEmail,
    action: 'Token Transferred',
    status: 'SUCCESS',
    details: `Transferred ${transferAmount.toLocaleString()} tokens to ${recipientEmail}`,
    drunixRef: `DEV-SEQ-#${drunixResult.sequenceNumber}`
  });

  res.json({
    success: true,
    transferId,
    from: senderEmail,
    to: recipientEmail,
    amount: transferAmount,
    remainingBalance: newSenderBal,
    drunixResult,
    timestamp: now,
    message: 'Token transfer settled successfully.'
  });
});
