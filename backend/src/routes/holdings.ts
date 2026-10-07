import { Router } from 'express';
import { db } from '../db/database.js';
import { authMiddleware } from '../middleware/auth.js';

export const holdingsRouter = Router();

// Get holdings for current user or all holdings
holdingsRouter.get('/', authMiddleware, (req, res) => {
  const userEmail = req.user!.email;
  const isSuper = req.user!.role === 'ADMIN' || req.user!.role === 'BANK';

  let query = 'SELECT * FROM token_holdings';
  const params: any[] = [];

  if (!isSuper && req.query.all !== 'true') {
    query += ' WHERE user_email = ?';
    params.push(userEmail);
  }

  const holdings = db.prepare(query).all(...params) as any[];

  // Enrich with Asset details
  const portfolio = holdings.map(h => {
    const asset = db.prepare('SELECT * FROM assets WHERE id = ?').get(h.asset_id) as any;
    const token = db.prepare('SELECT * FROM tokens WHERE id = ?').get(h.token_id) as any;

    const tokenPrice = token ? token.token_price : 0;
    const totalHoldingValue = h.balance * tokenPrice;

    let riskTier = 'LOW';
    if (asset?.health_score < 65) riskTier = 'HIGH';
    else if (asset?.health_score < 85) riskTier = 'MODERATE';

    return {
      holding_id: h.id,
      asset_id: h.asset_id,
      asset_name: asset?.name || 'Unknown Asset',
      property_identifier: asset?.property_identifier,
      location: asset?.location,
      user_email: h.user_email,
      token_symbol: token?.symbol || 'TOK',
      token_quantity: h.balance,
      token_price: tokenPrice,
      token_value_inr: totalHoldingValue,
      asset_health_score: asset?.health_score || 0,
      risk_tier: riskTier,
      is_encumbered: Boolean(asset?.is_encumbered),
      transfer_status: asset?.transfer_restricted ? 'RESTRICTED' : 'TRANSFERABLE',
      restriction_reason: asset?.restriction_reason,
      updated_at: h.updated_at
    };
  });

  const totalPortfolioValue = portfolio.reduce((sum, item) => sum + item.token_value_inr, 0);
  const totalTokens = portfolio.reduce((sum, item) => sum + item.token_quantity, 0);

  res.json({
    portfolio,
    totalPortfolioValue,
    totalTokens,
    holdingsCount: portfolio.length
  });
});
