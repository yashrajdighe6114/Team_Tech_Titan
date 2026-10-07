import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import {
  CheckCircle2,
  XCircle,
  Coins,
  ShieldCheck,
  AlertTriangle,
  ArrowRight,
  Database,
  Building2,
  Lock,
  Layers
} from 'lucide-react';
import { DrunixBadge } from '../components/DrunixBadge';

export const TokenizationWizard: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [asset, setAsset] = useState<any>(null);
  const [documents, setDocuments] = useState<any[]>([]);
  const [verification, setVerification] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [minting, setMinting] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<any>(null);

  // Token Config
  const [tokenName, setTokenName] = useState('');
  const [symbol, setSymbol] = useState('');
  const [totalSupply, setTotalSupply] = useState('100000');
  const [tokenPrice, setTokenPrice] = useState('1000');

  useEffect(() => {
    if (id) loadData();
  }, [id]);

  const loadData = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await api.assets.get(id);
      setAsset(res.asset);
      setDocuments(res.documents || []);
      if (res.verifications && res.verifications.length > 0) {
        setVerification(res.verifications[0]);
      }
      if (res.token) {
        setResult({ token: res.token, alreadyMinted: true });
      }

      // Pre-fill token configuration
      setTokenName(`${res.asset.name} Fractional Token`);
      setSymbol(res.asset.name.substring(0, 4).toUpperCase().replace(/[^A-Z]/g, ''));
      const val = Number(res.asset.declared_value) || 10000000;
      setTotalSupply('100000');
      setTokenPrice((val / 100000).toString());
    } catch (err) {
      console.error('Failed to load asset data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Quick Compliance Approval if asset is not yet approved
  const handleQuickApprove = async () => {
    if (!id) return;
    setError('');
    try {
      await api.compliance.approve(id, 'Pre-tokenization compliance sign-off granted by Compliance Officer');
      await loadData();
    } catch (err: any) {
      setError(err.message || 'Compliance approval failed');
    }
  };

  const handleExecuteTokenization = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    setError('');
    setMinting(true);

    try {
      const res = await api.tokenization.tokenize(id, {
        token_name: tokenName,
        symbol,
        total_supply: Number(totalSupply),
        token_price: Number(tokenPrice)
      });
      setResult(res);
      await loadData();
    } catch (err: any) {
      setError(err.message || 'Tokenization failed');
    } finally {
      setMinting(false);
    }
  };

  if (loading && !asset) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-xs text-slate-400 animate-pulse">Initializing tokenization pipeline...</div>
      </div>
    );
  }

  // Pre-requisite checks
  const isAssetVerified = verification?.status === 'PASS';
  const hasDocuments = documents.length >= 2;
  const isAIVerified = Boolean(verification);
  const isComplianceApproved = asset?.status === 'APPROVED' || asset?.status === 'TOKENIZED';
  const isEncumbered = Boolean(asset?.is_encumbered || asset?.transfer_restricted);

  const canMint = isComplianceApproved && !isEncumbered && !asset?.token;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono text-slate-500 uppercase">{asset?.property_identifier}</span>
            <span className="text-slate-600">&bull;</span>
            <span className="text-xs text-slate-400">Valuation: ₹{Number(asset?.declared_value).toLocaleString('en-IN')}</span>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            Guided Real-World Asset Tokenization
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Mint programmable digital asset tokens anchored onto the DRUNIX permissioned DLT.
          </p>
        </div>

        <DrunixBadge />
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-rose-950/40 border border-rose-500/40 text-rose-300 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError('')} className="text-rose-400 hover:text-white">&times;</button>
        </div>
      )}

      {/* Step 1 to 5 Checklist */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
        <h2 className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
          Pre-Tokenization Compliance & Audit Checklist
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Check 1: Documents */}
          <div className={`p-3 rounded-xl border text-xs space-y-1 ${
            hasDocuments ? 'bg-slate-950/60 border-emerald-500/30' : 'bg-slate-950/60 border-slate-800'
          }`}>
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-300">1. Documents</span>
              {hasDocuments ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <XCircle className="w-4 h-4 text-slate-500" />}
            </div>
            <div className="text-[11px] text-slate-400">
              {documents.length} Title Deeds Uploaded
            </div>
          </div>

          {/* Check 2: AI Verification */}
          <div className={`p-3 rounded-xl border text-xs space-y-1 ${
            isAssetVerified ? 'bg-slate-950/60 border-emerald-500/30' : 'bg-slate-950/60 border-amber-500/30'
          }`}>
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-300">2. AI Verification</span>
              {isAssetVerified ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-amber-400" />
              )}
            </div>
            <div className="text-[11px] text-slate-400">
              {verification ? `Status: ${verification.status}` : 'Pending AI Audit'}
            </div>
          </div>

          {/* Check 3: Encumbrance Free */}
          <div className={`p-3 rounded-xl border text-xs space-y-1 ${
            !isEncumbered ? 'bg-slate-950/60 border-emerald-500/30' : 'bg-slate-950/60 border-rose-500/30'
          }`}>
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-300">3. Lien Freedom</span>
              {!isEncumbered ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-rose-400" />
              )}
            </div>
            <div className="text-[11px] text-slate-400">
              {isEncumbered ? 'Encumbered / Restricted' : 'Unencumbered Title'}
            </div>
          </div>

          {/* Check 4: Compliance Approval */}
          <div className={`p-3 rounded-xl border text-xs space-y-1 ${
            isComplianceApproved ? 'bg-slate-950/60 border-emerald-500/30' : 'bg-slate-950/60 border-purple-500/30'
          }`}>
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-300">4. Compliance</span>
              {isComplianceApproved ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              ) : (
                <ShieldCheck className="w-4 h-4 text-purple-400" />
              )}
            </div>
            <div className="text-[11px] text-slate-400 flex items-center justify-between">
              <span>{isComplianceApproved ? 'Approved' : 'Pending'}</span>
              {!isComplianceApproved && (
                <button
                  type="button"
                  onClick={handleQuickApprove}
                  className="text-blue-400 hover:underline font-semibold"
                >
                  Approve Now
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Minted Result Banner if Tokenized */}
      {result?.token ? (
        <div className="bg-slate-900 border border-emerald-500/40 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100">
                Asset Successfully Tokenized
              </h2>
              <p className="text-xs text-slate-400">
                Fractional tokens minted and anchored onto the DRUNIX ledger adapter.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-950/60 p-4 rounded-xl border border-slate-800 text-xs">
            <div>
              <span className="text-slate-500 block text-[10px]">Token Symbol:</span>
              <span className="font-bold text-slate-200 text-sm font-mono">{result.token.symbol}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px]">Total Supply:</span>
              <span className="font-bold text-slate-200 text-sm font-mono">{Number(result.token.total_supply).toLocaleString()}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px]">Price per Token:</span>
              <span className="font-bold text-emerald-400 text-sm font-mono">₹{result.token.token_price}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px]">Market Cap:</span>
              <span className="font-bold text-slate-200 text-sm font-mono">
                ₹{(result.token.total_supply * result.token.token_price).toLocaleString('en-IN')}
              </span>
            </div>
          </div>

          {/* DRUNIX Ledger Transparency Callout */}
          <div className="p-3.5 rounded-xl bg-amber-950/20 border border-amber-500/30 text-xs space-y-1">
            <div className="flex items-center gap-2 font-semibold text-amber-300">
              <Database className="w-4 h-4 text-amber-400" />
              <span>DRUNIX Status: Development Ledger Adapter (DRUNIX network not connected)</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Real-time blockchain transactions are processed through the official Fabric v2.5.x contract interface. Because no live Fabric peer node is active locally, state is preserved deterministically in local cryptographically-chained sequence.
            </p>
            <div className="text-[10px] text-amber-400 font-mono pt-1">
              Ledger Reference: {result.token.drunix_ledger_ref || 'DEV-LEDGER-SEQ-1'}
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <Link
              to={`/assets/${id}`}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold border border-slate-700 transition-all"
            >
              View Asset Details &rarr;
            </Link>

            <Link
              to="/portfolio"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold shadow-md transition-all flex items-center gap-1.5"
            >
              <Coins className="w-4 h-4" />
              <span>View in Token Portfolio</span>
            </Link>
          </div>
        </div>
      ) : (
        /* Token Configuration & Minting Form */
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
          <div>
            <h2 className="text-sm font-semibold text-slate-200 uppercase tracking-wider mb-1">
              Step 5: Configure Token Economics
            </h2>
            <p className="text-xs text-slate-400">
              Set the fractional supply and unit price for secondary market liquidity.
            </p>
          </div>

          <form onSubmit={handleExecuteTokenization} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Token Name
                </label>
                <input
                  type="text"
                  value={tokenName}
                  onChange={(e) => setTokenName(e.target.value)}
                  required
                  className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Symbol (Ticker)
                </label>
                <input
                  type="text"
                  value={symbol}
                  onChange={(e) => setSymbol(e.target.value)}
                  required
                  className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-700 rounded-lg text-slate-100 uppercase font-mono placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Total Token Supply
                </label>
                <input
                  type="number"
                  value={totalSupply}
                  onChange={(e) => {
                    setTotalSupply(e.target.value);
                    const sup = Number(e.target.value) || 1;
                    const val = Number(asset?.declared_value) || 10000000;
                    setTokenPrice((val / sup).toFixed(2));
                  }}
                  required
                  className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-700 rounded-lg text-slate-100 font-mono placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
                <span className="text-[10px] text-slate-500 mt-1 block">
                  Example: 100,000 fractional tokens
                </span>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Token Unit Price (₹ INR)
                </label>
                <input
                  type="number"
                  value={tokenPrice}
                  onChange={(e) => setTokenPrice(e.target.value)}
                  required
                  className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-700 rounded-lg text-slate-100 font-mono placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
                <span className="text-[10px] text-slate-500 mt-1 block">
                  Calculated: ₹{tokenPrice}/token for ₹{Number(asset?.declared_value).toLocaleString('en-IN')} total valuation
                </span>
              </div>
            </div>

            {/* Mint Button */}
            <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
              <div className="text-xs text-slate-400">
                {!canMint ? (
                  <span className="text-amber-400 flex items-center gap-1">
                    <Lock className="w-3.5 h-3.5" />
                    <span>Requires Compliance Approval & Unencumbered Status</span>
                  </span>
                ) : (
                  <span className="text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Ready for Tokenization</span>
                  </span>
                )}
              </div>

              <button
                type="submit"
                disabled={!canMint || minting}
                className="py-2.5 px-6 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-lg text-xs font-semibold transition-all shadow-md flex items-center gap-2"
              >
                <Coins className="w-4 h-4" />
                <span>{minting ? 'Anchoring to DRUNIX Ledger...' : 'Mint & Anchor Tokens'}</span>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
