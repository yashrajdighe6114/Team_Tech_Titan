import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import {
  ArrowLeftRight,
  ShieldCheck,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Play,
  XCircle,
  TrendingUp,
  Building2,
  CreditCard
} from 'lucide-react';
import { DrunixBadge } from '../components/DrunixBadge';

export const Settlements: React.FC = () => {
  const { user } = useAuth();

  const [settlements, setSettlements] = useState<any[]>([]);
  const [assets, setAssets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // New settlement order form
  const [selectedAssetId, setSelectedAssetId] = useState('');
  const [tokenAmount, setTokenAmount] = useState('100');
  const [sellerEmail, setSellerEmail] = useState('owner@assettrust.demo');
  const [creating, setCreating] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Execution in progress
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [resSet, resAst] = await Promise.all([
        api.settlements.list(),
        api.assets.list({ status: 'TOKENIZED' })
      ]);
      setSettlements(resSet.settlements || []);
      setAssets(resAst.assets || []);
      if (resAst.assets && resAst.assets.length > 0 && !selectedAssetId) {
        setSelectedAssetId(resAst.assets[0].id);
      }
    } catch (err) {
      console.error('Failed to load settlements:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSettlement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAssetId) return;
    setErrorMsg('');
    setSuccessMsg('');
    setCreating(true);

    try {
      const res = await api.settlements.create({
        asset_id: selectedAssetId,
        token_amount: Number(tokenAmount),
        seller_email: sellerEmail
      });
      setSuccessMsg(`Settlement order #${res.settlementId} created. You can now execute the simulated payment step.`);
      await loadData();
    } catch (err: any) {
      setErrorMsg(err.message || 'Settlement creation failed');
    } finally {
      setCreating(false);
    }
  };

  const handleSimulatePayment = async (settlementId: string) => {
    setErrorMsg('');
    setSuccessMsg('');
    setProcessingId(settlementId);

    try {
      const res = await api.settlements.simulatePayment(settlementId);
      setSuccessMsg(`Settlement completed! Delivered ${res.tokensTransferred} tokens to buyer via Simulated Payment Adapter.`);
      await loadData();
    } catch (err: any) {
      setErrorMsg(err.message || 'Payment simulation failed');
    } finally {
      setProcessingId(null);
    }
  };

  const handleCancelSettlement = async (settlementId: string) => {
    if (!confirm('Cancel this settlement order?')) return;
    try {
      await api.settlements.cancel(settlementId);
      await loadData();
    } catch (err: any) {
      setErrorMsg(err.message || 'Cancel failed');
    }
  };

  const selectedAsset = assets.find(a => a.id === selectedAssetId);
  const tokenPrice = selectedAsset?.token?.token_price || 1000;
  const calculatedTotal = Number(tokenAmount) * tokenPrice;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <ArrowLeftRight className="w-5 h-5 text-blue-400" />
            <h1 className="text-xl font-bold tracking-tight text-white">
              Institutional Delivery-versus-Payment (DvP) Settlement Engine
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
            Atomic token-for-cash settlement workflow: Funds simulation escrow verifies unencumbered title conditions before unlocking secondary digital token transfers.
          </p>
        </div>

        <DrunixBadge />
      </div>

      {/* Mandatory Labeling Banner for Hackathon Demo */}
      <div className="p-3.5 rounded-xl bg-blue-950/30 border border-blue-500/30 text-blue-300 text-xs flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CreditCard className="w-4 h-4 text-blue-400 shrink-0" />
          <span>
            <strong>Simulated Payment Adapter:</strong> Payments are processed via simulated institutional sandbox escrow for hackathon demonstration. No direct live banking/NPCI credentials used.
          </span>
        </div>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-900/60 border border-blue-500/40 text-blue-200">
          DvP Engine v1.0
        </span>
      </div>

      {errorMsg && (
        <div className="p-3 rounded-lg bg-rose-950/40 border border-rose-500/40 text-rose-300 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <button onClick={() => setErrorMsg('')} className="text-rose-400 hover:text-white">&times;</button>
        </div>
      )}

      {successMsg && (
        <div className="p-3 rounded-lg bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg('')} className="text-emerald-400 hover:text-white">&times;</button>
        </div>
      )}

      {/* DvP Lifecycle Progress Visualization */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-3">
        <h2 className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
          DvP Settlement State Machine
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-3 rounded-lg bg-slate-950/70 border border-slate-800 text-center">
            <div className="font-bold text-blue-400 mb-0.5">1. CREATED</div>
            <div className="text-[10px] text-slate-500">Buyer initiates order</div>
          </div>
          <div className="p-3 rounded-lg bg-slate-950/70 border border-slate-800 text-center">
            <div className="font-bold text-amber-400 mb-0.5">2. PAYMENT_PENDING</div>
            <div className="text-[10px] text-slate-500">Simulate funds escrow</div>
          </div>
          <div className="p-3 rounded-lg bg-slate-950/70 border border-slate-800 text-center">
            <div className="font-bold text-purple-400 mb-0.5">3. CONDITIONS_CHECK</div>
            <div className="text-[10px] text-slate-500">Lien freedom & balance</div>
          </div>
          <div className="p-3 rounded-lg bg-slate-950/70 border border-slate-800 text-center">
            <div className="font-bold text-emerald-400 mb-0.5">4. COMPLETED</div>
            <div className="text-[10px] text-slate-500">Tokens delivered to buyer</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Initiate New Order (Left 1 col) */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
          <h2 className="text-xs font-semibold text-slate-200 uppercase tracking-wider pb-2 border-b border-slate-800">
            Initiate DvP Settlement Order
          </h2>

          <form onSubmit={handleCreateSettlement} className="space-y-3 text-xs">
            <div>
              <label className="block text-slate-300 font-medium mb-1">Target Tokenized Asset</label>
              <select
                value={selectedAssetId}
                onChange={(e) => setSelectedAssetId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:border-blue-500"
              >
                {assets.map(a => (
                  <option key={a.id} value={a.id}>
                    {a.name} ({a.property_identifier})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">Tokens to Purchase</label>
              <input
                type="number"
                min="1"
                value={tokenAmount}
                onChange={(e) => setTokenAmount(e.target.value)}
                required
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 font-mono focus:outline-none focus:border-blue-500 font-bold"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">Seller Account</label>
              <input
                type="email"
                value={sellerEmail}
                onChange={(e) => setSellerEmail(e.target.value)}
                required
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 font-mono text-xs focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Calculated summary */}
            <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800 space-y-1 text-[11px]">
              <div className="flex justify-between">
                <span className="text-slate-400">Unit Price:</span>
                <span className="font-mono text-slate-200">₹{tokenPrice}</span>
              </div>
              <div className="flex justify-between pt-1 border-t border-slate-800/80">
                <span className="text-slate-300 font-bold">Total Consideration:</span>
                <span className="font-mono font-bold text-emerald-400 text-xs">₹{calculatedTotal.toLocaleString('en-IN')}</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={creating || assets.length === 0}
              className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-lg font-semibold shadow-md transition-all flex items-center justify-center gap-2"
            >
              <Play className="w-3.5 h-3.5" />
              <span>{creating ? 'Creating Order...' : 'Create Settlement Order'}</span>
            </button>
          </form>
        </div>

        {/* Settlement Orders Table (Right 2 cols) */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h2 className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
              Settlement Ledger & Escrow Order Book ({settlements.length})
            </h2>
            <span className="text-xs text-slate-500 font-mono">Atomic DvP Sequence</span>
          </div>

          {loading ? (
            <div className="text-center py-10 text-xs text-slate-400 animate-pulse">Loading settlement orders...</div>
          ) : settlements.length === 0 ? (
            <div className="text-center py-10 text-xs text-slate-400">
              No settlement transactions recorded. Initiate an order from the left panel.
            </div>
          ) : (
            <div className="space-y-3">
              {settlements.map((s) => {
                const isCompleted = s.status === 'COMPLETED';
                const isPending = s.status === 'CREATED' || s.status === 'PAYMENT_PENDING' || s.status === 'CONDITIONS_PENDING';

                return (
                  <div
                    key={s.id}
                    className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 text-xs space-y-2 hover:border-slate-700 transition-all"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-100">{s.asset?.name || 'Sunrise Residency'}</span>
                        <span className="text-[10px] font-mono text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded">
                          {s.id}
                        </span>
                      </div>

                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                          isCompleted
                            ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                            : s.status === 'FAILED' || s.status === 'CANCELLED'
                            ? 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                            : 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                        }`}
                      >
                        {s.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-800/80 text-[11px]">
                      <div>
                        <span className="text-slate-500 block text-[10px]">Buyer Account</span>
                        <span className="font-mono text-slate-300 truncate block">{s.buyer_email}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[10px]">Seller Account</span>
                        <span className="font-mono text-slate-300 truncate block">{s.seller_email}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[10px]">Tokens Transferred</span>
                        <span className="font-mono font-bold text-slate-100 block">{s.amount} Units</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[10px]">Disbursed INR</span>
                        <span className="font-mono font-bold text-emerald-400 block">
                          ₹{Number(s.total_inr).toLocaleString('en-IN')}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[11px]">
                      <span className="text-slate-500">
                        {s.payment_reference ? `Payment Ref: ${s.payment_reference}` : 'Awaiting payment simulation'}
                      </span>

                      {isPending && (
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleCancelSettlement(s.id)}
                            className="px-2.5 py-1 text-slate-400 hover:text-rose-400 bg-slate-900 rounded border border-slate-800"
                          >
                            Cancel
                          </button>

                          <button
                            type="button"
                            onClick={() => handleSimulatePayment(s.id)}
                            disabled={processingId === s.id}
                            className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-semibold shadow-sm flex items-center gap-1"
                          >
                            <Play className="w-3 h-3" />
                            <span>{processingId === s.id ? 'Settling...' : 'Simulate Payment & Fulfill'}</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
