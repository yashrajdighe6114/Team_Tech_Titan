import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import {
  Coins,
  ArrowRightLeft,
  TrendingUp,
  ShieldCheck,
  AlertTriangle,
  Send,
  X,
  CheckCircle2,
  Lock,
  Building2
} from 'lucide-react';
import { DrunixBadge } from '../components/DrunixBadge';

export const TokenHoldings: React.FC = () => {
  const { user } = useAuth();

  const [portfolio, setPortfolio] = useState<any[]>([]);
  const [totalValue, setTotalValue] = useState(0);
  const [totalTokens, setTotalTokens] = useState(0);
  const [loading, setLoading] = useState(true);

  // Transfer Modal State
  const [transferModalOpen, setTransferModalOpen] = useState(false);
  const [selectedHolding, setSelectedHolding] = useState<any>(null);
  const [recipientEmail, setRecipientEmail] = useState('investor@assettrust.demo');
  const [transferAmount, setTransferAmount] = useState('500');
  const [transferReason, setTransferReason] = useState('Secondary market liquidity settlement');
  const [submittingTransfer, setSubmittingTransfer] = useState(false);
  const [transferError, setTransferError] = useState('');
  const [transferSuccess, setTransferSuccess] = useState<any>(null);

  // Transfers history
  const [transfersHistory, setTransfersHistory] = useState<any[]>([]);

  useEffect(() => {
    loadPortfolio();
    loadTransfers();
  }, [user]);

  const loadPortfolio = async () => {
    setLoading(true);
    try {
      // By default pass true so we can inspect all holdings or current user holdings
      const res = await api.holdings.get(true);
      setPortfolio(res.portfolio || []);
      setTotalValue(res.totalPortfolioValue || 0);
      setTotalTokens(res.totalTokens || 0);
    } catch (err) {
      console.error('Failed to load portfolio:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadTransfers = async () => {
    try {
      const res = await api.transfers.list();
      setTransfersHistory(res.transfers || []);
    } catch (err) {
      console.error('Failed to load transfers:', err);
    }
  };

  const openTransferModal = (holding: any) => {
    setSelectedHolding(holding);
    setTransferAmount('500');
    setRecipientEmail(user?.email === 'investor@assettrust.demo' ? 'owner@assettrust.demo' : 'investor@assettrust.demo');
    setTransferError('');
    setTransferSuccess(null);
    setTransferModalOpen(true);
  };

  const handleExecuteTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedHolding) return;

    setTransferError('');
    setTransferSuccess(null);
    setSubmittingTransfer(true);

    try {
      const res = await api.transfers.transfer({
        asset_id: selectedHolding.asset_id,
        to_email: recipientEmail,
        amount: Number(transferAmount),
        reason: transferReason
      });

      setTransferSuccess(res);
      await loadPortfolio();
      await loadTransfers();
    } catch (err: any) {
      setTransferError(err.message || 'Transfer failed. Check restrictions.');
    } finally {
      setSubmittingTransfer(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            Institutional Token Portfolio & Secondary Transfers
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time digital asset token holdings, balance breakdown, and peer-to-peer settlement controls.
          </p>
        </div>

        <DrunixBadge />
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span className="font-semibold uppercase tracking-wider">Total Portfolio Valuation</span>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-extrabold text-emerald-400">
            ₹{totalValue.toLocaleString('en-IN')}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Aggregated tokenized holding value</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span className="font-semibold uppercase tracking-wider">Total Tokens Circulating</span>
            <Coins className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-extrabold text-slate-100">
            {totalTokens.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Across all registered institutional positions</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span className="font-semibold uppercase tracking-wider">Active Asset Positions</span>
            <Building2 className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-extrabold text-purple-300">
            {portfolio.length}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Fractional real-world assets held</div>
        </div>
      </div>

      {/* Holdings Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <h2 className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
            Token Holdings By Account
          </h2>
          <span className="text-xs text-slate-500 font-mono">DRUNIX Account Register</span>
        </div>

        {loading ? (
          <div className="text-xs text-slate-400 text-center py-8 animate-pulse">Loading token balances...</div>
        ) : portfolio.length === 0 ? (
          <div className="text-xs text-slate-400 text-center py-8">
            No active token holdings found. Go to Asset Tokenization to mint tokens.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-slate-500 border-b border-slate-800">
                  <th className="pb-2.5 font-medium">Asset & Identifier</th>
                  <th className="pb-2.5 font-medium">Holder Email</th>
                  <th className="pb-2.5 font-medium">Tokens</th>
                  <th className="pb-2.5 font-medium">Unit Price</th>
                  <th className="pb-2.5 font-medium">Position Value</th>
                  <th className="pb-2.5 font-medium">Asset Health</th>
                  <th className="pb-2.5 font-medium">Transfer Status</th>
                  <th className="pb-2.5 font-medium text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {portfolio.map((item) => {
                  const isRestricted = item.transfer_status === 'RESTRICTED' || item.is_encumbered;
                  const healthColor =
                    item.asset_health_score >= 85
                      ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                      : item.asset_health_score >= 65
                      ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                      : 'bg-rose-500/20 text-rose-400 border-rose-500/30';

                  return (
                    <tr key={item.holding_id} className="hover:bg-slate-800/30">
                      <td className="py-3 font-semibold text-slate-200">
                        {item.asset_name}
                        <span className="block text-[10px] text-slate-500 font-mono">
                          {item.property_identifier} ({item.token_symbol})
                        </span>
                      </td>

                      <td className="py-3 text-slate-300 font-mono text-[11px]">
                        {item.user_email}
                      </td>

                      <td className="py-3 font-mono font-bold text-slate-100">
                        {item.token_quantity.toLocaleString()}
                      </td>

                      <td className="py-3 font-mono text-slate-400">
                        ₹{item.token_price}
                      </td>

                      <td className="py-3 font-mono font-bold text-emerald-400">
                        ₹{item.token_value_inr.toLocaleString('en-IN')}
                      </td>

                      <td className="py-3">
                        <span className={`px-2 py-0.5 rounded text-[11px] font-bold border ${healthColor}`}>
                          {item.asset_health_score}/100
                        </span>
                      </td>

                      <td className="py-3">
                        {isRestricted ? (
                          <span
                            title={item.restriction_reason || 'Encumbrance active'}
                            className="px-2 py-0.5 rounded text-[10px] font-semibold bg-rose-500/20 text-rose-400 border border-rose-500/30 inline-flex items-center gap-1"
                          >
                            <AlertTriangle className="w-3 h-3 text-rose-400" />
                            <span>RESTRICTED</span>
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 inline-flex items-center gap-1">
                            <ShieldCheck className="w-3 h-3 text-emerald-400" />
                            <span>TRANSFERABLE</span>
                          </span>
                        )}
                      </td>

                      <td className="py-3 text-right">
                        <button
                          type="button"
                          onClick={() => openTransferModal(item)}
                          className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold shadow-sm transition-all inline-flex items-center gap-1"
                        >
                          <Send className="w-3 h-3" />
                          <span>Transfer</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Transfer History Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <h2 className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
            Settled Token Transfer History
          </h2>
          <span className="text-xs text-slate-500">Immutable Ledger Records</span>
        </div>

        {transfersHistory.length === 0 ? (
          <div className="text-xs text-slate-400 text-center py-4">No token transfers recorded yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-slate-500 border-b border-slate-800">
                  <th className="pb-2 font-medium">Tx ID</th>
                  <th className="pb-2 font-medium">Sender</th>
                  <th className="pb-2 font-medium">Recipient</th>
                  <th className="pb-2 font-medium">Amount</th>
                  <th className="pb-2 font-medium">Status</th>
                  <th className="pb-2 font-medium">DLT Sequence</th>
                  <th className="pb-2 font-medium text-right">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                {transfersHistory.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-800/30">
                    <td className="py-2.5 text-slate-400">{t.id}</td>
                    <td className="py-2.5 text-slate-300 font-sans">{t.from_user}</td>
                    <td className="py-2.5 text-slate-300 font-sans">{t.to_user}</td>
                    <td className="py-2.5 font-bold text-slate-100">{Number(t.amount).toLocaleString()}</td>
                    <td className="py-2.5 font-sans">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        {t.status}
                      </span>
                    </td>
                    <td className="py-2.5 text-amber-400/90">{t.drunix_ref || 'DEV-LEDGER'}</td>
                    <td className="py-2.5 text-right text-slate-500 font-sans">
                      {new Date(t.created_at).toLocaleTimeString('en-IN')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Transfer Modal */}
      {transferModalOpen && selectedHolding && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <ArrowRightLeft className="w-5 h-5 text-blue-400" />
                <h3 className="font-bold text-slate-100 text-sm">
                  Transfer Tokens: {selectedHolding.asset_name}
                </h3>
              </div>
              <button
                onClick={() => setTransferModalOpen(false)}
                className="text-slate-500 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Encumbrance warning in modal if asset is restricted */}
            {(selectedHolding.is_encumbered || selectedHolding.transfer_status === 'RESTRICTED') && (
              <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/40 text-rose-300 text-xs space-y-1">
                <div className="flex items-center gap-1.5 font-semibold text-rose-400">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>Transfer Restriction Enforced by Smart Compliance</span>
                </div>
                <p className="text-[11px] leading-relaxed">
                  {selectedHolding.restriction_reason ||
                    'Outstanding loan / encumbrance detected. Transfers are blocked until lien is discharged.'}
                </p>
              </div>
            )}

            {transferError && (
              <div className="p-3 rounded-lg bg-rose-950/40 border border-rose-500/40 text-rose-300 text-xs">
                {transferError}
              </div>
            )}

            {transferSuccess ? (
              <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-500/30 text-emerald-300 text-xs space-y-2">
                <div className="flex items-center gap-2 font-bold text-sm">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  <span>Transfer Successfully Executed!</span>
                </div>
                <div>Sent: <strong>{transferSuccess.amount} tokens</strong> to {transferSuccess.to}</div>
                <div className="text-[11px] text-slate-400">Remaining Balance: {transferSuccess.remainingBalance} tokens</div>
                <div className="text-[10px] text-amber-400 font-mono">
                  DRUNIX Sequence: #{transferSuccess.drunixResult?.sequenceNumber} (Dev Adapter)
                </div>
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => setTransferModalOpen(false)}
                    className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold"
                  >
                    Done
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleExecuteTransfer} className="space-y-4 text-xs">
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Sender Account</label>
                  <input
                    type="text"
                    disabled
                    value={selectedHolding.user_email}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-400 font-mono"
                  />
                  <div className="text-[11px] text-slate-500 mt-1">
                    Available balance: <strong className="text-slate-300">{selectedHolding.token_quantity} tokens</strong>
                  </div>
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Recipient Account (Email) *</label>
                  <input
                    type="email"
                    required
                    value={recipientEmail}
                    onChange={(e) => setRecipientEmail(e.target.value)}
                    placeholder="e.g. investor@assettrust.demo"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Quantity of Tokens to Transfer *</label>
                  <input
                    type="number"
                    required
                    max={selectedHolding.token_quantity}
                    value={transferAmount}
                    onChange={(e) => setTransferAmount(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:border-blue-500 font-mono font-bold"
                  />
                  <div className="text-[11px] text-slate-500 mt-1">
                    Equivalent Value: <strong className="text-slate-300 font-mono">₹{(Number(transferAmount) * selectedHolding.token_price).toLocaleString('en-IN')}</strong>
                  </div>
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Transfer Purpose / Notes</label>
                  <input
                    type="text"
                    value={transferReason}
                    onChange={(e) => setTransferReason(e.target.value)}
                    placeholder="e.g. Secondary market trade settlement"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="pt-2 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setTransferModalOpen(false)}
                    className="px-4 py-2 bg-slate-800 text-slate-400 hover:text-white rounded-lg text-xs font-semibold"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={submittingTransfer}
                    className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold shadow-md transition-all flex items-center gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{submittingTransfer ? 'Validating & Settling...' : 'Execute DLT Transfer'}</span>
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
