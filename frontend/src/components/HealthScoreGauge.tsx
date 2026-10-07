import React from 'react';
import { ShieldCheck, AlertTriangle, ShieldAlert } from 'lucide-react';

interface BreakdownItem {
  score: number;
  max: number;
  name: string;
}

interface HealthScoreGaugeProps {
  score: number;
  breakdown?: Record<string, BreakdownItem> | null;
  percentageBreakdown?: Record<string, string> | null;
  isEncumbered?: boolean;
  transferRestricted?: boolean;
  restrictionReason?: string;
  showBreakdown?: boolean;
}

export const HealthScoreGauge: React.FC<HealthScoreGaugeProps> = ({
  score,
  breakdown,
  percentageBreakdown,
  isEncumbered = false,
  transferRestricted = false,
  restrictionReason,
  showBreakdown = true
}) => {
  // Color determination
  let color = 'text-emerald-400';
  let bgColor = 'bg-emerald-500/10 border-emerald-500/30';
  let badgeText = 'LOW RISK / INVESTMENT GRADE';
  let ringColor = '#10b981';

  if (score < 65) {
    color = 'text-rose-400';
    bgColor = 'bg-rose-500/10 border-rose-500/30';
    badgeText = 'HIGH RISK / ACTION REQUIRED';
    ringColor = '#ef4444';
  } else if (score < 85) {
    color = 'text-amber-400';
    bgColor = 'bg-amber-500/10 border-amber-500/30';
    badgeText = 'MODERATE RISK / MONITORING';
    ringColor = '#f59e0b';
  }

  // Standard component items if breakdown is not provided
  const components = [
    { key: 'ownership', label: 'Ownership Verification', weight: 20, score: breakdown?.ownership_verification?.score ?? 20, pct: percentageBreakdown?.ownership || '100%' },
    { key: 'documents', label: 'Document Verification', weight: 20, score: breakdown?.document_verification?.score ?? 19, pct: percentageBreakdown?.documents || '95%' },
    { key: 'valuation', label: 'Valuation Assessment', weight: 15, score: breakdown?.valuation?.score ?? 14, pct: percentageBreakdown?.valuation || '90%' },
    { key: 'kyc', label: 'KYC / AML Due Diligence', weight: 15, score: breakdown?.kyc?.score ?? 15, pct: percentageBreakdown?.kyc || '100%' },
    { key: 'insurance', label: 'Insurance Coverage', weight: 10, score: breakdown?.insurance?.score ?? 9, pct: percentageBreakdown?.insurance || '90%' },
    { key: 'encumbrance', label: 'Encumbrance / Lien Freedom', weight: 10, score: isEncumbered ? 0 : (breakdown?.encumbrance?.score ?? 10), pct: isEncumbered ? '0%' : (percentageBreakdown?.encumbrance || '100%') },
    { key: 'legal_review', label: 'Legal Title Review', weight: 10, score: breakdown?.legal_review?.score ?? 8, pct: percentageBreakdown?.legal_review || '80%' }
  ];

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-lg">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
        <div className="flex items-center gap-2">
          {score >= 85 ? (
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
          ) : score >= 65 ? (
            <AlertTriangle className="w-5 h-5 text-amber-400" />
          ) : (
            <ShieldAlert className="w-5 h-5 text-rose-400" />
          )}
          <h3 className="font-semibold text-slate-100 text-sm tracking-wide uppercase">
            Asset Health Score
          </h3>
        </div>
        <span className={`text-[11px] font-medium px-2 py-0.5 rounded border ${bgColor} ${color}`}>
          {badgeText}
        </span>
      </div>

      {/* Main Score Readout */}
      <div className="flex items-center gap-6 my-4">
        <div className="relative flex items-center justify-center w-24 h-24 rounded-full border-4" style={{ borderColor: ringColor }}>
          <div className="text-center">
            <span className={`text-3xl font-extrabold tracking-tight ${color}`}>{score}</span>
            <span className="text-xs text-slate-400 block -mt-1 font-medium">/ 100</span>
          </div>
        </div>

        <div className="flex-1 space-y-1">
          <div className="text-sm font-medium text-slate-200">
            {score >= 85
              ? 'Institutional Grade Title & Compliance'
              : score >= 65
              ? 'Warning: Encumbrance or Verification Discrepancy'
              : 'Critical Risk: Severe Title or Identity Discrepancy'}
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Transparent algorithmic score calculated from verified deed extracts, encumbrance registry, valuer affidavits, and legal title opinion.
          </p>

          {transferRestricted && (
            <div className="mt-2.5 flex items-start gap-2 p-2 rounded-lg bg-rose-950/40 border border-rose-500/40 text-rose-300 text-xs">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold">⚠ Transfer Restricted: </span>
                {restrictionReason || 'Outstanding loan / encumbrance detected. Secondary transfers locked.'}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Component Breakdown */}
      {showBreakdown && (
        <div className="mt-5 pt-4 border-t border-slate-800">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
            Component Weight Breakdown
          </div>
          <div className="space-y-2.5">
            {components.map(c => {
              const fraction = c.score / c.weight;
              const barColor = fraction >= 0.85 ? 'bg-emerald-500' : fraction >= 0.6 ? 'bg-amber-500' : 'bg-rose-500';
              return (
                <div key={c.key} className="text-xs">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-slate-300 font-medium">{c.label} ({c.weight} pts)</span>
                    <span className="text-slate-200 font-semibold">{c.pct} <span className="text-slate-500 font-normal">({c.score}/{c.weight})</span></span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${barColor} rounded-full transition-all duration-500`}
                      style={{ width: `${Math.min(fraction * 100, 100)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
