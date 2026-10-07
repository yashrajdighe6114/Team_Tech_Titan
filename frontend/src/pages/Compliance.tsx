import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { Link } from 'react-router-dom';
import {
  ShieldCheck,
  AlertTriangle,
  XCircle,
  CheckCircle2,
  FileSearch,
  Building2,
  ArrowRight,
  Eye,
  MessageSquare
} from 'lucide-react';
import { DrunixBadge } from '../components/DrunixBadge';

export const Compliance: React.FC = () => {
  const [assets, setAssets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionMsg, setActionMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    loadPendingAssets();
  }, []);

  const loadPendingAssets = async () => {
    setLoading(true);
    try {
      const res = await api.compliance.getPending();
      setAssets(res.assets || []);
    } catch (err) {
      console.error('Failed to load compliance pending assets:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (assetId: string) => {
    setActionMsg('');
    setErrorMsg('');
    try {
      await api.compliance.approve(assetId, 'Title and KYC verified. Approved for DRUNIX tokenization.');
      setActionMsg('Asset approved! It can now be tokenized.');
      await loadPendingAssets();
    } catch (err: any) {
      setErrorMsg(err.message || 'Approval blocked by policy.');
    }
  };

  const handleReject = async (assetId: string) => {
    const reason = prompt('Enter rejection reason:') || 'Title discrepancies unrectified';
    setActionMsg('');
    setErrorMsg('');
    try {
      await api.compliance.reject(assetId, reason);
      setActionMsg('Asset rejected by Compliance Officer.');
      await loadPendingAssets();
    } catch (err: any) {
      setErrorMsg(err.message || 'Reject failed');
    }
  };

  const handleRequestReview = async (assetId: string) => {
    const note = prompt('Enter instructions for asset owner:') || 'Please provide registered Khata extract matching owner name';
    setActionMsg('');
    setErrorMsg('');
    try {
      await api.compliance.requestReview(assetId, note);
      setActionMsg('Review request dispatched to asset owner.');
      await loadPendingAssets();
    } catch (err: any) {
      setErrorMsg(err.message || 'Request review failed');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <ShieldCheck className="w-5 h-5 text-purple-400" />
            <h1 className="text-xl font-bold tracking-tight text-white">
              Institutional Compliance & Regulatory Approval Workbench
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Mandatory gatekeeper audit: Assets must be signed off by Compliance before DRUNIX tokenization can proceed.
          </p>
        </div>

        <DrunixBadge />
      </div>

      {actionMsg && (
        <div className="p-3 rounded-lg bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{actionMsg}</span>
          </div>
          <button onClick={() => setActionMsg('')} className="text-emerald-400 hover:text-white">&times;</button>
        </div>
      )}

      {errorMsg && (
        <div className="p-3 rounded-lg bg-rose-950/40 border border-rose-500/40 text-rose-300 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <button onClick={() => setErrorMsg('')} className="text-rose-400 hover:text-white">&times;</button>
        </div>
      )}

      {/* Review List */}
      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-12 text-xs text-slate-400 animate-pulse">
            Loading compliance queue...
          </div>
        ) : assets.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400 bg-slate-900 border border-slate-800 rounded-xl">
            No assets currently pending compliance review.
          </div>
        ) : (
          assets.map((asset) => {
            const ver = asset.latest_verification;
            const issues = ver?.detected_issues || [];
            const hasMismatch = issues.some((i: string) => i.toLowerCase().includes('mismatch'));

            return (
              <div
                key={asset.id}
                className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4 hover:border-slate-700 transition-all"
              >
                {/* Header row */}
                <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-3">
                    <Building2 className="w-5 h-5 text-blue-400" />
                    <div>
                      <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                        {asset.name}
                        <span className="text-[10px] font-mono text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700">
                          {asset.property_identifier}
                        </span>
                      </h2>
                      <div className="text-[11px] text-slate-400">
                        Owner: <strong className="text-slate-300 font-normal">{asset.owner_name}</strong> &bull; Location: {asset.location} &bull; Declared Value: ₹{Number(asset.declared_value).toLocaleString('en-IN')}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400 font-medium">Health Score:</span>
                    <span
                      className={`text-xs font-bold px-2 py-0.5 rounded border ${
                        asset.health_score >= 85
                          ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                          : asset.health_score >= 65
                          ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                          : 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                      }`}
                    >
                      {asset.health_score}/100
                    </span>
                    <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                      {asset.status}
                    </span>
                  </div>
                </div>

                {/* Verification & Risk Summary */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                  <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800 space-y-1">
                    <span className="text-slate-500 block text-[10px]">AI Verification Result</span>
                    <span className="font-bold text-slate-200">
                      {ver ? `${ver.status} (${Math.round((ver.confidence || 0) * 100)}% Confidence)` : 'Pending'}
                    </span>
                  </div>

                  <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800 space-y-1">
                    <span className="text-slate-500 block text-[10px]">Encumbrance / Lien Check</span>
                    <span className={`font-bold ${asset.is_encumbered ? 'text-amber-400' : 'text-emerald-400'}`}>
                      {asset.is_encumbered ? 'Active Encumbrance Detected' : 'Unencumbered Title'}
                    </span>
                  </div>

                  <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800 space-y-1">
                    <span className="text-slate-500 block text-[10px]">Title Deeds Submitted</span>
                    <span className="font-bold text-slate-200">
                      {asset.documents_count} Document(s) Archival Verified
                    </span>
                  </div>
                </div>

                {/* Detected Issues Callout */}
                {issues.length > 0 ? (
                  <div className="space-y-1.5">
                    <div className="text-[11px] font-semibold text-rose-400 uppercase tracking-wider flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>Compliance Discrepancies Detected:</span>
                    </div>
                    {issues.map((issue: string, idx: number) => (
                      <div key={idx} className="p-2 rounded bg-rose-950/30 border border-rose-500/30 text-rose-300 text-xs">
                        {issue}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-2 rounded bg-emerald-950/20 border border-emerald-500/20 text-emerald-300 text-xs flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>No title discrepancies detected. Cleared for compliance sign-off.</span>
                  </div>
                )}

                {/* Actions */}
                <div className="pt-2 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2">
                    <Link
                      to={`/assets/${asset.id}/verification`}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg font-medium flex items-center gap-1"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Inspect AI Audit</span>
                    </Link>

                    <Link
                      to={`/assets/${asset.id}`}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg font-medium"
                    >
                      Asset Profile &rarr;
                    </Link>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleRequestReview(asset.id)}
                      className="px-3 py-1.5 bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 rounded-lg font-medium transition-all"
                    >
                      Request Review
                    </button>

                    <button
                      type="button"
                      onClick={() => handleReject(asset.id)}
                      className="px-3 py-1.5 bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 rounded-lg font-medium transition-all"
                    >
                      Reject Asset
                    </button>

                    <button
                      type="button"
                      onClick={() => handleApprove(asset.id)}
                      disabled={hasMismatch}
                      className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white rounded-lg font-semibold shadow-md transition-all flex items-center gap-1.5"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{hasMismatch ? 'Approval Blocked' : 'Approve for Tokenization'}</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
