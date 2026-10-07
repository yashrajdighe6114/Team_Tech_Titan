import { Router } from 'express';
import { db } from '../db/database.js';

export const statsRouter = Router();

statsRouter.get('/', (req, res) => {
  // Total Assets
  const totalAssetsRow = db.prepare('SELECT COUNT(*) as count FROM assets').get() as any;
  const totalAssets = totalAssetsRow?.count || 0;

  // Total Tokenized Value (INR)
  const tokenizedAssets = db.prepare("SELECT * FROM assets WHERE status = 'TOKENIZED'").all() as any[];
  const totalTokenizedValue = tokenizedAssets.reduce((sum, a) => sum + (Number(a.declared_value) || 0), 0);

  // Active Investors
  const investorCountRow = db.prepare('SELECT COUNT(DISTINCT user_email) as count FROM token_holdings WHERE balance > 0').get() as any;
  const activeInvestors = investorCountRow?.count || 0;

  // Pending Verification & Assets Under Review
  const pendingVerRow = db.prepare("SELECT COUNT(*) as count FROM assets WHERE status = 'DRAFT'").get() as any;
  const underReviewRow = db.prepare("SELECT COUNT(*) as count FROM assets WHERE status = 'REVIEW'").get() as any;

  // Settlements count & total value
  const settlementsRow = db.prepare("SELECT COUNT(*) as count, SUM(total_inr) as total_val FROM settlements WHERE status = 'COMPLETED'").get() as any;

  // Average Asset Health
  const avgHealthRow = db.prepare('SELECT AVG(health_score) as avg_score FROM assets').get() as any;
  const averageAssetHealth = avgHealthRow?.avg_score ? Math.round(avgHealthRow.avg_score) : 80;

  // Health Distribution
  const healthList = db.prepare('SELECT health_score, status FROM assets').all() as any[];
  const healthDistribution = {
    highQuality: healthList.filter(a => a.health_score >= 85).length, // 85-100
    moderateRisk: healthList.filter(a => a.health_score >= 65 && a.health_score < 85).length, // 65-84
    highRisk: healthList.filter(a => a.health_score < 65).length // < 65
  };

  // Status Distribution
  const statusDistribution = {
    tokenized: tokenizedAssets.length,
    encumbered: healthList.filter(a => a.status === 'ENCUMBERED').length,
    review: underReviewRow?.count || 0,
    draft: pendingVerRow?.count || 0
  };

  // Recent Transactions (transfers + settlements)
  const recentTransfers = db.prepare('SELECT * FROM transfers ORDER BY created_at DESC LIMIT 5').all() as any[];
  const recentAudit = db.prepare('SELECT * FROM audit_logs ORDER BY timestamp DESC LIMIT 6').all() as any[];

  res.json({
    metrics: {
      totalAssets,
      totalTokenizedValue,
      activeInvestors: Math.max(activeInvestors, 2),
      pendingVerification: pendingVerRow?.count || 0,
      assetsUnderReview: underReviewRow?.count || 0,
      settlementTransactions: settlementsRow?.count || 0,
      settlementVolumeInr: settlementsRow?.total_val || 0,
      averageAssetHealth
    },
    healthDistribution,
    statusDistribution,
    recentTransfers,
    recentAudit
  });
});
