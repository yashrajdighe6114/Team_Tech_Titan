import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import {
  Database,
  ShieldCheck,
  Server,
  Layers,
  Cpu,
  Clock,
  Key,
  CheckCircle2,
  AlertTriangle,
  RefreshCw
} from 'lucide-react';
import { DrunixBadge } from '../components/DrunixBadge';

export const Admin: React.FC = () => {
  const [drunixStatus, setDrunixStatus] = useState<any>(null);
  const [blocks, setBlocks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDrunixData();
  }, []);

  const loadDrunixData = async () => {
    setLoading(true);
    try {
      const [resStatus, resBlocks] = await Promise.all([
        api.drunix.getStatus(),
        api.drunix.getBlocks()
      ]);
      setDrunixStatus(resStatus);
      setBlocks(resBlocks.blocks || []);
    } catch (err) {
      console.error('Failed to load DRUNIX data:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Database className="w-5 h-5 text-amber-400" />
            <h1 className="text-xl font-bold tracking-tight text-white">
              DRUNIX DLT Network & Administration Console
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
            Inspection terminal for NPCI DRUNIX permissioned ledger contracts, cryptographic state chaining, and system health.
          </p>
        </div>

        <button
          onClick={loadDrunixData}
          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold border border-slate-700 transition-all flex items-center gap-1.5"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Blocks</span>
        </button>
      </div>

      {/* System Infrastructure Matrix */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
        {/* DRUNIX Adapter Card */}
        <div className="bg-slate-900 border border-amber-500/30 rounded-xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-bold text-slate-200">DLT Architecture</span>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-950/40 text-amber-300 border border-amber-500/20">
              DEV ADAPTER
            </span>
          </div>
          <div className="space-y-1.5 text-slate-400 text-[11px]">
            <div>Platform: <strong className="text-slate-200">NPCI DRUNIX (Fabric v2.5.x Spec)</strong></div>
            <div>Channel: <strong className="text-slate-200 font-mono">drunix-rwa-channel</strong></div>
            <div>Chaincode: <strong className="text-slate-200 font-mono">rwa-token-cc</strong></div>
            <div className="text-amber-400/90 pt-1 border-t border-slate-800 text-[10px]">
              Label: "DRUNIX integration pending / development adapter"
            </div>
          </div>
        </div>

        {/* AI Engine Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-bold text-slate-200">AI Intelligence Service</span>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950/40 text-emerald-300 border border-emerald-500/20">
              ACTIVE
            </span>
          </div>
          <div className="space-y-1.5 text-slate-400 text-[11px]">
            <div>Framework: <strong className="text-slate-200">Python FastAPI + Uvicorn</strong></div>
            <div>Port: <strong className="text-slate-200 font-mono">8001</strong></div>
            <div>Logic: <strong className="text-slate-200">Deterministic Cross-Document Verifier</strong></div>
            <div>Scoring: <strong className="text-slate-200">100-Point Component Health Engine</strong></div>
          </div>
        </div>

        {/* Database Persistence Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-bold text-slate-200">Storage & Consensus Layer</span>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-950/40 text-blue-300 border border-blue-500/20">
              SQL READY
            </span>
          </div>
          <div className="space-y-1.5 text-slate-400 text-[11px]">
            <div>Current Storage: <strong className="text-slate-200">Node SQLite (Built-in engine)</strong></div>
            <div>PostgreSQL / YugabyteDB: <strong className="text-slate-200">Schema Compatible</strong></div>
            <div>Ledger Blocks: <strong className="text-slate-200 font-mono">{blocks.length} Blocks Sequenced</strong></div>
            <div>Integrity: <strong className="text-slate-200">SHA-256 Chained Hash Trees</strong></div>
          </div>
        </div>
      </div>

      {/* DRUNIX Ledger Block Explorer */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div>
            <h2 className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
              DRUNIX Ledger Block Explorer
            </h2>
            <p className="text-[11px] text-slate-400">
              Sequenced immutable transactions logged by the Development Ledger Adapter.
            </p>
          </div>
          <DrunixBadge compact />
        </div>

        {loading ? (
          <div className="text-center py-10 text-xs text-slate-400 animate-pulse">Loading ledger blocks...</div>
        ) : blocks.length === 0 ? (
          <div className="text-center py-10 text-xs text-slate-400">No ledger blocks found.</div>
        ) : (
          <div className="space-y-3">
            {blocks.map((block) => (
              <div
                key={block.sequence_number}
                className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 text-xs space-y-2 hover:border-slate-700 transition-all font-mono"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 text-slate-300">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-amber-400 font-sans">
                      Sequence #{block.sequence_number}
                    </span>
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30">
                      {block.action}
                    </span>
                    {block.asset_id && (
                      <span className="text-[10px] text-slate-500 font-mono">
                        Asset: {block.asset_id}
                      </span>
                    )}
                  </div>

                  <span className="text-[10px] text-slate-500 font-sans">
                    {new Date(block.timestamp).toLocaleString('en-IN')}
                  </span>
                </div>

                {/* Chained Hashes */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[10px] text-slate-400 bg-slate-900/60 p-2.5 rounded border border-slate-800/80">
                  <div className="truncate">
                    <span className="text-slate-500">Prev Hash: </span>
                    <span className="text-slate-400">{block.previous_hash}</span>
                  </div>
                  <div className="truncate">
                    <span className="text-slate-500">Block Hash: </span>
                    <span className="text-emerald-400">{block.block_hash}</span>
                  </div>
                </div>

                {/* Status indicator */}
                <div className="text-[11px] text-amber-300 font-sans">
                  {block.status_label}
                </div>

                {/* Payload JSON */}
                <div className="text-[11px] text-slate-300 bg-slate-900/80 p-2.5 rounded border border-slate-900 break-words font-mono text-[10px]">
                  {JSON.stringify(block.payload, null, 2)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
