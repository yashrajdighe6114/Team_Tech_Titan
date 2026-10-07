import { Router } from 'express';
import crypto from 'node:crypto';
import { db } from '../db/database.js';
import { authMiddleware } from '../middleware/auth.js';
import { drunixLedger } from '../drunix/drunix-adapter.js';
import { logAuditAction } from '../services/auditLogger.js';

export const settlementsRouter = Router();

// List settlements
settlementsRouter.get('/', (req, res) => {
  const settlements = db.prepare('SELECT * FROM settlements ORDER BY created_at DESC LIMIT 50').all() as any[];

  const enriched = settlements.map(s => {
    const asset = db.prepare('SELECT name, property_identifier, location, is_encumbered, transfer_restricted FROM assets WHERE id = ?').get(s.asset_id);
    return {
      ...s,
      asset,
      conditions_met: Boolean(s.conditions_met),
      payment_adapter_label: 'Simulated Payment Adapter (DvP Institutional Demo)'
    };
  });

  res.json({ settlements: enriched });
});

// Create new settlement order (Buyer initiates)
settlementsRouter.post('/', authMiddleware, async (req, res) => {
  const { asset_id, token_amount, seller_email } = req.body;

  if (!asset_id || !token_amount || Number(token_amount) <= 0) {
    return res.status(400).json({ error: 'Asset ID and valid token amount required' });
  }

  const asset = db.prepare('SELECT * FROM assets WHERE id = ?').get(asset_id) as any;
  if (!asset) return res.status(404).json({ error: 'Asset not found' });

  if (asset.transfer_restricted || asset.is_encumbered) {
    return res.status(400).json({
      error: `Settlement cannot be initiated: Asset is ENCUMBERED / Transfer Restricted (${asset.restriction_reason || 'Active lien'})`
    });
  }

  const token = db.prepare('SELECT * FROM tokens WHERE asset_id = ?').get(asset_id) as any;
  if (!token) return res.status(404).json({ error: 'Token not found for asset' });

  const buyerEmail = req.user!.email;
  const seller = (seller_email || 'owner@assettrust.demo').trim().toLowerCase();

  const amount = Number(token_amount);
  const price = token.token_price;
  const totalInr = amount * price;

  const settlementId = `set-${crypto.randomUUID().substring(0, 8)}`;
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO settlements (
      id, asset_id, token_id, buyer_id, buyer_email, seller_id, seller_email,
      amount, price_per_token, total_inr, status, payment_method, conditions_met, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'CREATED', 'SIMULATED_ESCROW', 0, ?, ?)
  `).run(
    settlementId,
    asset_id,
    token.id,
    req.user!.id,
    buyerEmail,
    'usr-seller',
    seller,
    amount,
    price,
    totalInr,
    now,
    now
  );

  // DRUNIX Ledger Adapter record
  const drunixResult = await drunixLedger.createSettlement({
    settlementId,
    assetId: asset_id,
    buyerAccount: buyerEmail,
    sellerAccount: seller,
    tokenAmount: amount,
    totalInr
  });

  logAuditAction({
    assetId: asset_id,
    userEmail: buyerEmail,
    action: 'Settlement Initiated',
    status: 'PENDING',
    details: `Initiated DvP settlement for ${amount} tokens at ₹${price} (Total: ₹${totalInr.toLocaleString('en-IN')}) with seller ${seller}`,
    drunixRef: `DEV-SEQ-#${drunixResult.sequenceNumber}`
  });

  res.status(201).json({
    success: true,
    settlementId,
    status: 'CREATED',
    totalInr,
    drunixResult,
    paymentAdapter: 'Simulated Payment Adapter',
    message: 'Settlement order created. Next step: simulate payment.'
  });
});

// Step 2 & 3: Simulate Payment & Check Delivery-versus-Payment Conditions
settlementsRouter.post('/:id/simulate-payment', authMiddleware, async (req, res) => {
  const settlementId = req.params.id;
  const settlement = db.prepare('SELECT * FROM settlements WHERE id = ?').get(settlementId) as any;
  if (!settlement) return res.status(404).json({ error: 'Settlement not found' });

  if (settlement.status !== 'CREATED' && settlement.status !== 'PAYMENT_PENDING') {
    return res.status(400).json({ error: `Settlement is in ${settlement.status} status and cannot be paid.` });
  }

  const now = new Date().toISOString();
  const paymentRef = `SIM-PAY-${Date.now()}`;

  // Advance to PAYMENT_PENDING
  db.prepare(`
    UPDATE settlements
    SET status = 'PAYMENT_PENDING', payment_reference = ?, updated_at = ?
    WHERE id = ?
  `).run(paymentRef, now, settlementId);

  logAuditAction({
    assetId: settlement.asset_id,
    userEmail: req.user!.email,
    action: 'Payment Simulated',
    status: 'SUCCESS',
    details: `Simulated escrow payment clearance for ₹${Number(settlement.total_inr).toLocaleString('en-IN')}. Payment Ref: ${paymentRef}`
  });

  // Verify settlement conditions
  const asset = db.prepare('SELECT * FROM assets WHERE id = ?').get(settlement.asset_id) as any;
  if (asset.transfer_restricted || asset.is_encumbered) {
    db.prepare("UPDATE settlements SET status = 'FAILED', updated_at = ? WHERE id = ?").run(now, settlementId);
    return res.status(400).json({
      error: 'Settlement Failed: Asset is encumbered or transfer restricted.',
      status: 'FAILED'
    });
  }

  // Check seller's balance
  const sellerHolding = db.prepare(
    'SELECT * FROM token_holdings WHERE token_id = ? AND user_email = ?'
  ).get(settlement.token_id, settlement.seller_email) as any;

  if (!sellerHolding || sellerHolding.balance < settlement.amount) {
    db.prepare("UPDATE settlements SET status = 'FAILED', updated_at = ? WHERE id = ?").run(now, settlementId);
    return res.status(400).json({
      error: `Settlement Failed: Seller ${settlement.seller_email} has insufficient tokens. Available: ${sellerHolding?.balance || 0}`,
      status: 'FAILED'
    });
  }

  // Conditions Passed -> advance to CONDITIONS_PENDING -> then complete transfer
  db.prepare("UPDATE settlements SET status = 'CONDITIONS_PENDING', conditions_met = 1, updated_at = ? WHERE id = ?").run(now, settlementId);

  // Atomic Token Delivery (DvP)
  const newSellerBal = sellerHolding.balance - settlement.amount;
  db.prepare('UPDATE token_holdings SET balance = ?, updated_at = ? WHERE id = ?').run(newSellerBal, now, sellerHolding.id);

  const buyerHolding = db.prepare(
    'SELECT * FROM token_holdings WHERE token_id = ? AND user_email = ?'
  ).get(settlement.token_id, settlement.buyer_email) as any;

  if (buyerHolding) {
    const newBuyerBal = buyerHolding.balance + settlement.amount;
    db.prepare('UPDATE token_holdings SET balance = ?, updated_at = ? WHERE id = ?').run(newBuyerBal, now, buyerHolding.id);
  } else {
    db.prepare(`
      INSERT INTO token_holdings (id, token_id, asset_id, user_id, user_email, balance, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      `hld-${crypto.randomUUID().substring(0, 8)}`,
      settlement.token_id,
      settlement.asset_id,
      settlement.buyer_id,
      settlement.buyer_email,
      settlement.amount,
      now
    );
  }

  // Mark Settlement COMPLETED
  const completedAt = new Date().toISOString();
  db.prepare("UPDATE settlements SET status = 'COMPLETED', updated_at = ? WHERE id = ?").run(completedAt, settlementId);

  // Record transfer in transfer table
  const transferId = `txf-set-${crypto.randomUUID().substring(0, 8)}`;
  db.prepare(`
    INSERT INTO transfers (id, token_id, asset_id, from_user, to_user, amount, status, reason, drunix_ref, created_at)
    VALUES (?, ?, ?, ?, ?, ?, 'COMPLETED', 'DvP Settlement Finalized', 'DEV-LEDGER', ?)
  `).run(
    transferId,
    settlement.token_id,
    settlement.asset_id,
    settlement.seller_email,
    settlement.buyer_email,
    settlement.amount,
    completedAt
  );

  // Invoke DRUNIX transfer
  await drunixLedger.transferToken({
    assetId: settlement.asset_id,
    fromAccount: settlement.seller_email,
    toAccount: settlement.buyer_email,
    amount: settlement.amount,
    purpose: `Settlement execution ${settlementId}`
  });

  logAuditAction({
    assetId: settlement.asset_id,
    userEmail: req.user!.email,
    action: 'Settlement Completed',
    status: 'SUCCESS',
    details: `Settlement ${settlementId} fulfilled. Delivered ${settlement.amount} tokens to ${settlement.buyer_email}. Funds disbursed to seller.`
  });

  res.json({
    success: true,
    settlementId,
    status: 'COMPLETED',
    paymentReference: paymentRef,
    conditionsMet: true,
    tokensTransferred: settlement.amount,
    disbursedInr: settlement.total_inr,
    message: 'Delivery-versus-Payment (DvP) settlement successfully executed via Simulated Payment Adapter.'
  });
});

// Cancel settlement
settlementsRouter.post('/:id/cancel', authMiddleware, (req, res) => {
  const settlementId = req.params.id;
  const settlement = db.prepare('SELECT * FROM settlements WHERE id = ?').get(settlementId) as any;
  if (!settlement) return res.status(404).json({ error: 'Settlement not found' });

  if (settlement.status === 'COMPLETED') {
    return res.status(400).json({ error: 'Cannot cancel a completed settlement.' });
  }

  const now = new Date().toISOString();
  db.prepare("UPDATE settlements SET status = 'CANCELLED', updated_at = ? WHERE id = ?").run(now, settlementId);

  logAuditAction({
    assetId: settlement.asset_id,
    userEmail: req.user!.email,
    action: 'Settlement Cancelled',
    status: 'FLAGGED',
    details: `Settlement ${settlementId} was cancelled by user.`
  });

  res.json({ success: true, message: 'Settlement cancelled.' });
});
