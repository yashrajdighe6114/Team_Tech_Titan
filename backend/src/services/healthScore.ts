export interface HealthScoreResult {
  totalScore: number;
  maxScore: number;
  riskTier: 'LOW' | 'MODERATE' | 'HIGH';
  badgeColor: 'emerald' | 'amber' | 'rose';
  isEncumbered: boolean;
  transferRestricted: boolean;
  restrictionReason?: string;
  breakdown: {
    ownership_verification: { score: number; max: number; name: string };
    document_verification: { score: number; max: number; name: string };
    valuation: { score: number; max: number; name: string };
    kyc: { score: number; max: number; name: string };
    insurance: { score: number; max: number; name: string };
    encumbrance: { score: number; max: number; name: string };
    legal_review: { score: number; max: number; name: string };
  };
  percentageBreakdown: Record<string, string>;
}

export function computeAssetHealthScore(params: {
  verificationStatus?: string;
  detectedIssues?: string[];
  encumbrances?: Array<{ status: string; amount: number }>;
  complianceApproved?: boolean;
}): HealthScoreResult {
  const {
    verificationStatus = 'PENDING',
    detectedIssues = [],
    encumbrances = [],
    complianceApproved = false
  } = params;

  const hasOwnerMismatch = detectedIssues.some(i => i.toLowerCase().includes('mismatch'));
  const hasActiveEncumbrance = encumbrances.some(e => ['ACTIVE', 'REGISTERED', 'PENDING'].includes(e.status.toUpperCase()));

  // Default baseline
  const breakdown = {
    ownership_verification: { score: 20, max: 20, name: 'Ownership Verification' },
    document_verification: { score: 20, max: 20, name: 'Document Verification' },
    valuation: { score: 15, max: 15, name: 'Valuation Assessment' },
    kyc: { score: 15, max: 15, name: 'KYC / AML Due Diligence' },
    insurance: { score: 9, max: 10, name: 'Insurance Coverage' },
    encumbrance: { score: 10, max: 10, name: 'Encumbrance / Lien Freedom' },
    legal_review: { score: 8, max: 10, name: 'Legal Title Review' }
  };

  if (hasOwnerMismatch) {
    breakdown.ownership_verification.score = 6;
    breakdown.document_verification.score = 8;
    breakdown.legal_review.score = 3;
  } else if (verificationStatus === 'PASS') {
    breakdown.ownership_verification.score = 20;
    breakdown.document_verification.score = 19;
    breakdown.valuation.score = 14;
    breakdown.legal_review.score = 8;
  } else if (verificationStatus === 'REVIEW') {
    breakdown.ownership_verification.score = 10;
    breakdown.document_verification.score = 12;
    breakdown.legal_review.score = 5;
  } else if (verificationStatus === 'FAIL') {
    breakdown.ownership_verification.score = 4;
    breakdown.document_verification.score = 4;
    breakdown.legal_review.score = 2;
  }

  // Active encumbrance deducts heavily from Encumbrance, Valuation and Legal
  if (hasActiveEncumbrance) {
    breakdown.encumbrance.score = 0;
    breakdown.valuation.score = Math.min(breakdown.valuation.score, 9);
    breakdown.legal_review.score = Math.min(breakdown.legal_review.score, 5);
  }

  if (complianceApproved) {
    breakdown.legal_review.score = Math.min(breakdown.legal_review.score + 2, 10);
    breakdown.kyc.score = 15;
  }

  const totalScore = Object.values(breakdown).reduce((sum, item) => sum + item.score, 0);

  let riskTier: 'LOW' | 'MODERATE' | 'HIGH' = 'LOW';
  let badgeColor: 'emerald' | 'amber' | 'rose' = 'emerald';
  if (totalScore >= 85) {
    riskTier = 'LOW';
    badgeColor = 'emerald';
  } else if (totalScore >= 65) {
    riskTier = 'MODERATE';
    badgeColor = 'amber';
  } else {
    riskTier = 'HIGH';
    badgeColor = 'rose';
  }

  const transferRestricted = hasActiveEncumbrance || totalScore < 70 || hasOwnerMismatch;
  let restrictionReason = '';
  if (hasActiveEncumbrance) {
    restrictionReason = 'Outstanding loan / encumbrance detected. Transfer restricted by smart compliance rule.';
  } else if (hasOwnerMismatch) {
    restrictionReason = 'Ownership title mismatch detected. Under compliance review.';
  } else if (totalScore < 70) {
    restrictionReason = 'Asset health score below acceptable institutional risk threshold (70/100).';
  }

  const percentageBreakdown = {
    ownership: `${Math.round((breakdown.ownership_verification.score / 20) * 100)}%`,
    documents: `${Math.round((breakdown.document_verification.score / 20) * 100)}%`,
    valuation: `${Math.round((breakdown.valuation.score / 15) * 100)}%`,
    kyc: `${Math.round((breakdown.kyc.score / 15) * 100)}%`,
    insurance: `${Math.round((breakdown.insurance.score / 10) * 100)}%`,
    encumbrance: `${Math.round((breakdown.encumbrance.score / 10) * 100)}%`,
    legal_review: `${Math.round((breakdown.legal_review.score / 10) * 100)}%`,
  };

  return {
    totalScore,
    maxScore: 100,
    riskTier,
    badgeColor,
    isEncumbered: hasActiveEncumbrance,
    transferRestricted,
    restrictionReason: transferRestricted ? restrictionReason : undefined,
    breakdown,
    percentageBreakdown
  };
}
