import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import {
  Building2,
  FileText,
  ShieldCheck,
  AlertTriangle,
  Coins,
  ArrowRightLeft,
  Clock,
  Database,
  PlusCircle,
  X,
  FileCheck2,
  Lock,
  Unlock,
  Sparkles,
  CheckCircle2
} from 'lucide-react';
import { HealthScoreGauge } from '../components/HealthScoreGauge';
import { AuditTimeline } from '../components/AuditTimeline';
import { DrunixBadge } from '../components/DrunixBadge';

export const AssetDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'documents' | 'encumbrances' | 'tokens' | 'audit' | 'drunix'>('overview');

  // Add Encumbrance Modal
  const [encModalOpen, setEncModalOpen] = useState(false);
  const [encLender, setEncLender] = useState('HDFC Bank');
  const [encAmount, setEncAmount] = useState('3000000');
  const [encType, setEncType] = useState('MORTGAGE_LOAN');
  const [encNotes, setEncNotes] = useState('Commercial term mortgage registered against property');
  const [submittingEnc, setSubmittingEnc] = useState(false);
  const [encSuccessMsg, setEncSuccessMsg] = useState('');

  // Action feedback
  const [actionMsg, setActionMsg] = useState('');

  useEffect(() => {
    if (id) loadAssetData();
  }, [id]);

  const loadAssetData = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await api.assets.get(id);
      setData(res);
    } catch (err) {
      console.error('Failed to load asset detail:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddEncumbrance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    setSubmittingEnc(true);
    setEncSuccessMsg('');

    try {
      const res = await api.encumbrances.add(id, {
        lender_name: encLender,
        amount: Number(encAmount),
        encumbrance_type: encType,
        notes: encNotes
      });

      setEncSuccessMsg(`Encumbrance registered! Health score decreased from ${res.assetHealth.previousScore} to ${res.assetHealth.newScore}/100. Secondary transfers locked.`);
      await loadAssetData();
    } catch (err: any) {
      alert(`Failed to add encumbrance: ${err.message}`);
    } finally {
      setSubmittingEnc(false);
    }
  };

  const handleReleaseEncumbrance = async (encId: string) => {
    if (!confirm('Are you sure you want to discharge and release this encumbrance?')) return;
    try {
      const res = await api.encumbrances.release(encId);
      setActionMsg(`Encumbrance discharged! Asset health score restored to ${res.newScore}/100.`);
      await loadAssetData();
    } catch (err: any) {
      alert(`Failed to release encumbrance: ${err.message}`);
    }
  };

  const handleFreezeToggle = async () => {
    if (!id || !data?.asset) return;
    const isRestricted = data.asset.transfer_restricted;

    try {
      if (isRestricted) {
        await api.assets.unfreeze(id);
        setActionMsg('Asset transfer restrictions lifted.');
      } else {
        await api.assets.freeze(id, 'Manual administrative freeze by compliance');
        setActionMsg('Asset frozen. Transfers restricted.');
      }
      await loadAssetData();
    } catch (err: any) {
      alert(err.message || 'Action failed');
    }
  };

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-xs text-slate-400 animate-pulse">Loading asset title intelligence...</div>
      </div>
    );
  }

  const asset = data?.asset || {};
  const documents = data?.documents || [];
  const verifications = data?.verifications || [];
  const token = data?.token || null;
  const holdings = data?.holdings || [];
  const encumbrances = data?.encumbrances || [];
  const auditLogs = data?.auditLogs || [];
  const drunixHistory = data?.drunixHistory || [];
  const latestVerification = verifications[0] || null;

  return (
    <div className="space-y-6">
      {/* Master Asset Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-md space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-mono text-slate-400 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                {asset.property_identifier}
              </span>
              <span className="text-slate-600">&bull;</span>
              <span className="text-xs text-slate-300 font-medium">{asset.asset_type}</span>
              <span className="text-slate-600">&bull;</span>
              <span className="text-xs text-slate-400">{asset.location}</span>
            </div>

            <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
              {asset.name}
            </h1>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
              {asset.description || 'Verified freehold real estate anchored to DRUNIX ledger.'}
            </p>
          </div>

          <div className="flex flex-col items-end gap-2">
            <div className="flex items-center gap-2">
              <span
                className={`text-xs font-bold px-2.5 py-1 rounded-md border ${
                  asset.status === 'TOKENIZED'
                    ? 'bg-blue-500/20 text-blue-400 border-blue-500/30'
                    : asset.status === 'ENCUMBERED'
                    ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                    : asset.status === 'REVIEW'
                    ? 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                    : 'bg-slate-800 text-slate-300 border-slate-700'
                }`}
              >
                STATUS: {asset.status}
              </span>
            </div>
            <DrunixBadge />
          </div>
        </div>

        {/* Action Button Strip */}
        <div className="pt-3 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <Link
              to={`/assets/${asset.id}/verification`}
              className="px-3 py-1.5 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5 text-blue-400" />
              <span>AI Document Audit</span>
            </Link>

            {!token ? (
              <Link
                to={`/assets/${asset.id}/tokenization`}
                className="px-3 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5"
              >
                <Coins className="w-3.5 h-3.5 text-emerald-400" />
                <span>Tokenize Asset</span>
              </Link>
            ) : (
              <Link
                to="/portfolio"
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5"
              >
                <Coins className="w-3.5 h-3.5 text-blue-400" />
                <span>View Tokens ({token.symbol})</span>
              </Link>
            )}

            {/* Differentiating Feature: Add Encumbrance */}
            <button
              type="button"
              onClick={() => {
                setEncSuccessMsg('');
                setEncModalOpen(true);
              }}
              className="px-3 py-1.5 bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border border-amber-500/30 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5"
            >
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
              <span>Add Encumbrance (Risk Demo)</span>
            </button>

            {/* Freeze / Unfreeze */}
            <button
              type="button"
              onClick={handleFreezeToggle}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5"
            >
              {asset.transfer_restricted ? <Unlock className="w-3.5 h-3.5 text-emerald-400" /> : <Lock className="w-3.5 h-3.5 text-rose-400" />}
              <span>{asset.transfer_restricted ? 'Unfreeze Asset' : 'Freeze Asset'}</span>
            </button>
          </div>

          <div className="text-xs text-slate-400 font-medium">
            Declared Valuation: <strong className="text-white font-mono">₹{Number(asset.declared_value).toLocaleString('en-IN')}</strong>
          </div>
        </div>
      </div>

      {actionMsg && (
        <div className="p-3 rounded-lg bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-xs flex items-center justify-between">
          <span>{actionMsg}</span>
          <button onClick={() => setActionMsg('')} className="text-emerald-400 hover:text-white">&times;</button>
        </div>
      )}

      {/* Transfer Restriction Warning Banner */}
      {asset.transfer_restricted && (
        <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-500/40 text-rose-300 text-xs flex items-start gap-3 shadow-lg">
          <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <div className="font-bold text-sm text-rose-300">
              ⚠ Transfer Restricted by Smart Compliance
            </div>
            <p className="text-xs text-rose-200/90 leading-relaxed">
              Reason: {asset.restriction_reason || 'Outstanding loan / encumbrance detected. Secondary transfers and settlements are locked.'}
            </p>
          </div>
        </div>
      )}

      {/* Health Score Gauge + High Level Breakdown */}
      <HealthScoreGauge
        score={asset.health_score || 50}
        breakdown={asset.health_breakdown?.breakdown}
        percentageBreakdown={asset.health_breakdown?.percentageBreakdown}
        isEncumbered={Boolean(asset.is_encumbered)}
        transferRestricted={Boolean(asset.transfer_restricted)}
        restrictionReason={asset.restriction_reason}
      />

      {/* Navigation Tabs */}
      <div className="border-b border-slate-800 flex flex-wrap gap-2 text-xs">
        {[
          { key: 'overview', label: 'Overview & Valuation', icon: Building2 },
          { key: 'documents', label: `Deeds & Documents (${documents.length})`, icon: FileText },
          { key: 'encumbrances', label: `Liens & Mortgages (${encumbrances.length})`, icon: AlertTriangle },
          { key: 'tokens', label: 'Token Economics', icon: Coins },
          { key: 'audit', label: `Audit Trail (${auditLogs.length})`, icon: Clock },
          { key: 'drunix', label: `DRUNIX Ledger (${drunixHistory.length})`, icon: Database },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`flex items-center gap-2 px-4 py-2.5 font-medium border-b-2 transition-all ${
                isActive
                  ? 'border-blue-500 text-blue-400 font-bold bg-slate-900/40'
                  : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/20'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab 1: Overview */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
            <h2 className="text-xs font-semibold text-slate-200 uppercase tracking-wider pb-2 border-b border-slate-800">
              Legal Title Particulars
            </h2>
            <div className="space-y-3 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Registered Owner:</span>
                <span className="font-semibold text-slate-100">{asset.owner_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Property Identifier:</span>
                <span className="font-mono text-slate-200 font-semibold">{asset.property_identifier}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Location / Jurisdiction:</span>
                <span className="text-slate-200">{asset.location}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Asset Category:</span>
                <span className="text-slate-200">{asset.asset_type}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Registry Anchor:</span>
                <span className="font-mono text-amber-400 text-[11px]">{asset.drunix_status || 'DEV-LEDGER'}</span>
              </div>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
            <h2 className="text-xs font-semibold text-slate-200 uppercase tracking-wider pb-2 border-b border-slate-800">
              Financial & Valuation Particulars
            </h2>
            <div className="space-y-3 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Declared Fair Market Value:</span>
                <span className="font-mono text-emerald-400 font-bold text-sm">
                  ₹{Number(asset.declared_value).toLocaleString('en-IN')}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Outstanding Encumbrance / Lien:</span>
                <span className={`font-mono font-bold ${asset.is_encumbered ? 'text-rose-400' : 'text-slate-400'}`}>
                  {asset.is_encumbered ? `₹30,00,000` : '₹0 (Clear Title)'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Net Unencumbered Value:</span>
                <span className="font-mono text-slate-100 font-bold">
                  ₹{Number(asset.is_encumbered ? asset.declared_value - 3000000 : asset.declared_value).toLocaleString('en-IN')}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Tokenization Status:</span>
                <span className="text-blue-400 font-semibold">{token ? 'Tokenized (100,000 Units)' : 'Not Tokenized'}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Documents */}
      {activeTab === 'documents' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
              Verification Documents Archive
            </h2>
            <Link
              to={`/assets/${asset.id}/verification`}
              className="text-xs text-blue-400 hover:underline flex items-center gap-1"
            >
              <span>Open AI Verification Workbench</span>
              <span>&rarr;</span>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {documents.map((doc: any) => (
              <div key={doc.id} className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileCheck2 className="w-4 h-4 text-blue-400" />
                    <span className="font-semibold text-slate-100">{doc.name}</span>
                  </div>
                  <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                    {doc.document_type}
                  </span>
                </div>
                {doc.text_content && (
                  <p className="text-[11px] text-slate-400 bg-slate-950/60 p-2 rounded border border-slate-800/80">
                    {doc.text_content}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Encumbrances */}
      {activeTab === 'encumbrances' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
                Registered Liens & Encumbrances ({encumbrances.length})
              </h2>
              <p className="text-[11px] text-slate-400">
                Mortgages, institutional charges, and litigation attachments recorded against title.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setEncSuccessMsg('');
                setEncModalOpen(true);
              }}
              className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-semibold shadow-sm transition-all flex items-center gap-1"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Register New Lien</span>
            </button>
          </div>

          {encumbrances.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400 bg-slate-900 border border-slate-800 rounded-xl">
              No encumbrances recorded. Asset title is completely unencumbered (Freedom score: 10/10).
            </div>
          ) : (
            <div className="space-y-3">
              {encumbrances.map((enc: any) => (
                <div
                  key={enc.id}
                  className="bg-slate-900 border border-amber-500/30 rounded-xl p-4 text-xs space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-400" />
                      <span className="font-bold text-slate-100">{enc.lender_name}</span>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-950/40 text-amber-300 border border-amber-500/20">
                        {enc.encumbrance_type}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="font-mono text-rose-400 font-extrabold text-sm">
                        ₹{Number(enc.amount).toLocaleString('en-IN')}
                      </span>
                      {enc.status === 'ACTIVE' && (
                        <button
                          type="button"
                          onClick={() => handleReleaseEncumbrance(enc.id)}
                          className="px-2.5 py-1 bg-slate-800 hover:bg-emerald-900/40 text-emerald-300 border border-emerald-500/30 rounded text-[11px] font-semibold"
                        >
                          Discharge Lien
                        </button>
                      )}
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-400">{enc.notes}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 4: Tokens */}
      {activeTab === 'tokens' && (
        <div className="space-y-4">
          {token ? (
            <div className="space-y-4">
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                <div>
                  <span className="text-slate-500 block text-[10px]">Symbol:</span>
                  <span className="font-bold text-slate-100 font-mono text-sm">{token.symbol}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">Total Supply:</span>
                  <span className="font-bold text-slate-100 font-mono text-sm">{Number(token.total_supply).toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">Price per Unit:</span>
                  <span className="font-bold text-emerald-400 font-mono text-sm">₹{token.token_price}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">Total Value:</span>
                  <span className="font-bold text-slate-100 font-mono text-sm">
                    ₹{(token.total_supply * token.token_price).toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
                <h3 className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
                  Investor Token Distribution
                </h3>
                <div className="space-y-2 text-xs">
                  {holdings.map((h: any) => (
                    <div key={h.id} className="p-3 rounded-lg bg-slate-950/60 border border-slate-800 flex justify-between items-center">
                      <span className="text-slate-300 font-mono">{h.user_email}</span>
                      <span className="font-mono font-bold text-slate-100">
                        {h.balance.toLocaleString()} {token.symbol} (₹{(h.balance * token.token_price).toLocaleString('en-IN')})
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center text-xs text-slate-400 bg-slate-900 border border-slate-800 rounded-xl">
              Asset is not yet tokenized. Complete AI verification and compliance approval first.
            </div>
          )}
        </div>
      )}

      {/* Tab 5: Audit Trail */}
      {activeTab === 'audit' && (
        <AuditTimeline logs={auditLogs} />
      )}

      {/* Tab 6: DRUNIX Ledger Blocks */}
      {activeTab === 'drunix' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h2 className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
                DRUNIX Ledger Sequence History ({drunixHistory.length} Blocks)
              </h2>
              <span className="text-[11px] text-amber-300 font-mono">
                NPCI DRUNIX Fabric-Compatible Spec (Development Adapter Mode)
              </span>
            </div>
            <DrunixBadge />
          </div>

          <div className="space-y-3">
            {drunixHistory.map((block: any) => (
              <div key={block.sequenceNumber} className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 text-xs space-y-1.5 font-mono">
                <div className="flex items-center justify-between text-slate-300">
                  <span className="font-bold text-blue-400">Block #{block.sequenceNumber}: {block.action}</span>
                  <span className="text-[10px] text-slate-500 font-sans">
                    {new Date(block.timestamp).toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="text-[11px] text-amber-400/90 font-sans">{block.statusLabel}</div>
                <div className="text-[10px] text-slate-400 bg-slate-900/80 p-2 rounded border border-slate-900 break-words">
                  {JSON.stringify(block.payload)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add Encumbrance Modal */}
      {encModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-slate-100 text-sm">
                  Register Encumbrance / Mortgage Lien
                </h3>
              </div>
              <button onClick={() => setEncModalOpen(false)} className="text-slate-500 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 rounded-lg bg-amber-950/30 border border-amber-500/30 text-amber-300 text-xs leading-relaxed">
              <strong>Hackathon Differentiating Demo:</strong> Registering an encumbrance immediately updates asset status to <span className="font-bold">ENCUMBERED</span>, lowers the Asset Health Score (e.g. 91 &rarr; 68), and locks secondary token transfers via smart compliance rules!
            </div>

            {encSuccessMsg ? (
              <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-500/30 text-emerald-300 text-xs space-y-3">
                <div className="flex items-center gap-2 font-bold">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  <span>Encumbrance Successfully Recorded!</span>
                </div>
                <p>{encSuccessMsg}</p>
                <button
                  type="button"
                  onClick={() => setEncModalOpen(false)}
                  className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold"
                >
                  Close & View Asset
                </button>
              </div>
            ) : (
              <form onSubmit={handleAddEncumbrance} className="space-y-4 text-xs">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Lender / Financial Institution *</label>
                  <input
                    type="text"
                    required
                    value={encLender}
                    onChange={(e) => setEncLender(e.target.value)}
                    placeholder="e.g. HDFC Commercial Banking"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Encumbrance Amount (₹ INR) *</label>
                  <input
                    type="number"
                    required
                    value={encAmount}
                    onChange={(e) => setEncAmount(e.target.value)}
                    placeholder="3000000"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 font-mono font-bold focus:outline-none focus:border-blue-500"
                  />
                  <div className="text-[11px] text-slate-500 mt-1">Example: ₹30,00,000 (30 Lakhs INR)</div>
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Lien Classification</label>
                  <select
                    value={encType}
                    onChange={(e) => setEncType(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:border-blue-500"
                  >
                    <option value="MORTGAGE_LOAN">Commercial Mortgage Loan</option>
                    <option value="BANK_CHARGE">Bank Floating Charge</option>
                    <option value="LEGAL_ATTACHMENT">Judicial Attachment / Notice</option>
                    <option value="TAX_LIEN">Municipal Tax Lien</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Registration Particulars & Charge Notes</label>
                  <textarea
                    rows={2}
                    value={encNotes}
                    onChange={(e) => setEncNotes(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="pt-2 flex justify-between">
                  <button
                    type="button"
                    onClick={() => setEncModalOpen(false)}
                    className="px-4 py-2 bg-slate-800 text-slate-400 hover:text-white rounded-lg font-semibold"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={submittingEnc}
                    className="px-5 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg font-semibold shadow-md flex items-center gap-1.5"
                  >
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>{submittingEnc ? 'Recording Lien...' : 'Register Lien & Lock Asset'}</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
