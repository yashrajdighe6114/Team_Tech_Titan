import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { Link } from 'react-router-dom';
import {
  Building2,
  Search,
  PlusCircle,
  ShieldCheck,
  AlertTriangle,
  Coins,
  ArrowRight,
  Filter
} from 'lucide-react';
import { DrunixBadge } from '../components/DrunixBadge';

export const AssetList: React.FC = () => {
  const [assets, setAssets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  useEffect(() => {
    loadAssets();
  }, [statusFilter]);

  const loadAssets = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (statusFilter !== 'ALL') params.status = statusFilter;
      if (search.trim()) params.search = search.trim();
      const res = await api.assets.list(params);
      setAssets(res.assets || []);
    } catch (err) {
      console.error('Failed to load assets:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadAssets();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            Asset Registry & Ledger Directory
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Verified real-world properties, titles, tokenization contracts, and active liens.
          </p>
        </div>

        <Link
          to="/assets/new"
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold shadow-md transition-all"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Register New Real Asset</span>
        </Link>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4">
        {/* Status Filters */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          {['ALL', 'TOKENIZED', 'ENCUMBERED', 'REVIEW', 'DRAFT'].map(status => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                statusFilter === status
                  ? 'bg-blue-600 text-white font-semibold shadow-sm'
                  : 'bg-slate-800/40 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              {status}
            </button>
          ))}
        </div>

        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by name, ID, location..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-950 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
        </form>
      </div>

      {/* Asset Grid */}
      {loading ? (
        <div className="flex items-center justify-center min-h-[300px]">
          <div className="text-xs text-slate-400 animate-pulse">Loading asset directory...</div>
        </div>
      ) : assets.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center text-slate-400 text-xs">
          No assets match your search criteria.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {assets.map(asset => {
            const isEncumbered = asset.is_encumbered;
            const health = asset.health_score || 50;

            let healthBadgeColor = 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
            if (health < 65) healthBadgeColor = 'bg-rose-500/20 text-rose-400 border-rose-500/30';
            else if (health < 85) healthBadgeColor = 'bg-amber-500/20 text-amber-400 border-amber-500/30';

            return (
              <div
                key={asset.id}
                className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl p-5 shadow-sm transition-all flex flex-col justify-between"
              >
                <div>
                  {/* Top line: Type and Status */}
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                      {asset.asset_type}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                        asset.status === 'TOKENIZED'
                          ? 'bg-blue-500/20 text-blue-400 border-blue-500/30'
                          : asset.status === 'ENCUMBERED'
                          ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                          : asset.status === 'REVIEW'
                          ? 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                          : 'bg-slate-800 text-slate-300 border-slate-700'
                      }`}
                    >
                      {asset.status}
                    </span>
                  </div>

                  {/* Asset Title & ID */}
                  <h3 className="font-bold text-slate-100 text-base mb-0.5">
                    {asset.name}
                  </h3>
                  <div className="text-[11px] font-mono text-slate-500 mb-3 flex items-center justify-between">
                    <span>{asset.property_identifier}</span>
                    <span className="text-slate-400 font-sans">{asset.location}</span>
                  </div>

                  {/* Key Metrics Box */}
                  <div className="bg-slate-950/60 border border-slate-800/80 rounded-lg p-3 space-y-2 mb-3 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">Declared Value:</span>
                      <span className="font-bold text-slate-100 font-mono">
                        ₹{Number(asset.declared_value).toLocaleString('en-IN')}
                      </span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">Owner Name:</span>
                      <span className="font-medium text-slate-200 truncate max-w-[150px]">
                        {asset.owner_name}
                      </span>
                    </div>

                    <div className="flex justify-between items-center pt-1 border-t border-slate-800/80">
                      <span className="text-slate-400 font-medium">Health Score:</span>
                      <span className={`px-2 py-0.5 rounded text-xs font-extrabold border ${healthBadgeColor}`}>
                        {health} / 100
                      </span>
                    </div>
                  </div>

                  {/* Warning Pill if Encumbered or Restricted */}
                  {asset.transfer_restricted && (
                    <div className="p-2 rounded bg-rose-950/30 border border-rose-500/30 text-rose-300 text-[11px] flex items-center gap-1.5 mb-3">
                      <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                      <span className="truncate">⚠ Transfer Restricted (Active Lien / Mismatch)</span>
                    </div>
                  )}

                  {asset.token && (
                    <div className="p-2 rounded bg-blue-950/20 border border-blue-500/20 text-blue-300 text-[11px] flex items-center justify-between mb-3">
                      <span className="flex items-center gap-1">
                        <Coins className="w-3.5 h-3.5 text-blue-400" />
                        <span>{asset.token.symbol}</span>
                      </span>
                      <span className="font-mono text-slate-300">
                        {asset.token.total_supply?.toLocaleString()} @ ₹{asset.token.token_price}
                      </span>
                    </div>
                  )}
                </div>

                {/* Card Actions */}
                <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-2 text-xs">
                  <Link
                    to={`/assets/${asset.id}`}
                    className="flex-1 py-1.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 text-center rounded-lg font-medium transition-all"
                  >
                    View Details
                  </Link>

                  <Link
                    to={`/assets/${asset.id}/verification`}
                    className="py-1.5 px-3 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/30 rounded-lg font-medium transition-all flex items-center gap-1"
                  >
                    <span>AI Audit</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
