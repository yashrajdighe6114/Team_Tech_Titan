import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { Link } from 'react-router-dom';
import {
  Building2,
  TrendingUp,
  Users,
  ShieldAlert,
  ShieldCheck,
  ArrowLeftRight,
  FileSearch,
  ExternalLink,
  PlusCircle,
  Activity
} from 'lucide-react';
import { DrunixBadge } from '../components/DrunixBadge';

export const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const data = await api.stats.get();
      setStats(data);
    } catch (err) {
      console.error('Failed to load dashboard stats:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-xs text-slate-400 animate-pulse">Loading institutional dashboard...</div>
      </div>
    );
  }

  const metrics = stats?.metrics || {};
  const healthDist = stats?.healthDistribution || {};
  const statusDist = stats?.statusDistribution || {};
  const recentAudit = stats?.recentAudit || [];
  const recentTransfers = stats?.recentTransfers || [];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-blue-950/40 border border-slate-800 rounded-2xl p-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-xl font-bold tracking-tight text-white">
              Institutional Asset Tokenization Overview
            </h1>
            <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30">
              Live Network Sandbox
            </span>
          </div>
          <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
            Real-world asset (RWA) digital representations governed by automated title verification, continuous health scoring, and NPCI DRUNIX permissioned DLT architecture.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/assets/new"
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold shadow-md transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Add Real Asset</span>
          </Link>
          <Link
            to="/compliance"
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold border border-slate-700 transition-all"
          >
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Compliance Workbench</span>
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Assets */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
            <span className="font-semibold uppercase tracking-wider">Registered Assets</span>
            <Building2 className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-extrabold text-white">{metrics.totalAssets || 3}</div>
          <div className="text-[11px] text-slate-500 mt-1 flex items-center justify-between">
            <span>Verified & Tokenized: <strong className="text-slate-300">{statusDist.tokenized || 1}</strong></span>
            <span>Encumbered: <strong className="text-amber-400">{statusDist.encumbered || 1}</strong></span>
          </div>
        </div>

        {/* Card 2: Total Tokenized Value */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
            <span className="font-semibold uppercase tracking-wider">Total Tokenized Value</span>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-extrabold text-emerald-400">
            ₹{(metrics.totalTokenizedValue || 10000000).toLocaleString('en-IN')}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Active fractional market valuation
          </div>
        </div>

        {/* Card 3: Average Asset Health */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
            <span className="font-semibold uppercase tracking-wider">Average Asset Health</span>
            <Activity className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <div className="text-2xl font-extrabold text-slate-100">{metrics.averageAssetHealth || 80}</div>
            <span className="text-xs text-slate-400 font-medium">/ 100</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Weighted algorithmic compliance index
          </div>
        </div>

        {/* Card 4: Under Review & Pending */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
            <span className="font-semibold uppercase tracking-wider">Pending / Under Review</span>
            <FileSearch className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-extrabold text-amber-400">
            {(metrics.pendingVerification || 0) + (metrics.assetsUnderReview || 1)}
          </div>
          <div className="text-[11px] text-slate-500 mt-1 flex items-center justify-between">
            <span>Discrepancy Flags: <strong className="text-rose-400">{metrics.assetsUnderReview || 1}</strong></span>
            <Link to="/compliance" className="text-blue-400 hover:underline">Review &rarr;</Link>
          </div>
        </div>
      </div>

      {/* Analytics & Risk Breakdown Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Health Score Distribution */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h2 className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
              Asset Health Distribution
            </h2>
            <span className="text-[11px] text-slate-500">3 Assets Monitored</span>
          </div>

          <div className="space-y-3 text-xs">
            {/* Low Risk */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-slate-300 flex items-center gap-1.5 font-medium">
                  <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                  Low Risk (85 - 100)
                </span>
                <span className="font-semibold text-emerald-400">{healthDist.highQuality || 1} Asset (Sunrise)</span>
              </div>
              <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full" style={{ width: '33.3%' }}></div>
              </div>
            </div>

            {/* Moderate Risk */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-slate-300 flex items-center gap-1.5 font-medium">
                  <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                  Moderate Risk (65 - 84)
                </span>
                <span className="font-semibold text-amber-400">{healthDist.moderateRisk || 1} Asset (GreenField)</span>
              </div>
              <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-amber-500 rounded-full" style={{ width: '33.3%' }}></div>
              </div>
            </div>

            {/* High Risk */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-slate-300 flex items-center gap-1.5 font-medium">
                  <span className="w-2 h-2 rounded-full bg-rose-400"></span>
                  High Risk (&lt; 65)
                </span>
                <span className="font-semibold text-rose-400">{healthDist.highRisk || 1} Asset (LakeView)</span>
              </div>
              <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-rose-500 rounded-full" style={{ width: '33.3%' }}></div>
              </div>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-slate-800/40 border border-slate-800 text-[11px] text-slate-400 leading-relaxed">
            Encumbrance additions dynamically reduce the asset health score and trigger automated transfer lockouts via DLT smart compliance rules.
          </div>
        </div>

        {/* Featured Assets Quick Table */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h2 className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
              Featured Demo Assets (Pre-seeded)
            </h2>
            <Link to="/assets" className="text-xs text-blue-400 hover:underline">
              View All Assets &rarr;
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-slate-500 border-b border-slate-800">
                  <th className="pb-2 font-medium">Asset Name</th>
                  <th className="pb-2 font-medium">Location</th>
                  <th className="pb-2 font-medium">Declared Value</th>
                  <th className="pb-2 font-medium">Health</th>
                  <th className="pb-2 font-medium">Status</th>
                  <th className="pb-2 font-medium text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {/* Asset 1 */}
                <tr className="hover:bg-slate-800/30">
                  <td className="py-2.5 font-semibold text-slate-200">
                    Sunrise Residency
                    <span className="block text-[10px] text-slate-500 font-mono">PROP-PUN-001</span>
                  </td>
                  <td className="py-2.5 text-slate-400">Pune</td>
                  <td className="py-2.5 text-slate-300 font-mono">₹1,00,00,000</td>
                  <td className="py-2.5">
                    <span className="px-2 py-0.5 rounded font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      91/100
                    </span>
                  </td>
                  <td className="py-2.5">
                    <span className="px-2 py-0.5 rounded text-[11px] bg-blue-500/20 text-blue-400 border border-blue-500/30 font-semibold">
                      TOKENIZED
                    </span>
                  </td>
                  <td className="py-2.5 text-right">
                    <Link to="/assets/ast-sunrise-001" className="text-blue-400 hover:underline">
                      Inspect &rarr;
                    </Link>
                  </td>
                </tr>

                {/* Asset 2 */}
                <tr className="hover:bg-slate-800/30">
                  <td className="py-2.5 font-semibold text-slate-200">
                    GreenField Complex
                    <span className="block text-[10px] text-slate-500 font-mono">PROP-COMM-002</span>
                  </td>
                  <td className="py-2.5 text-slate-400">Pune</td>
                  <td className="py-2.5 text-slate-300 font-mono">₹1,00,00,000</td>
                  <td className="py-2.5">
                    <span className="px-2 py-0.5 rounded font-semibold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                      68/100
                    </span>
                  </td>
                  <td className="py-2.5">
                    <span className="px-2 py-0.5 rounded text-[11px] bg-amber-500/20 text-amber-400 border border-amber-500/30 font-semibold">
                      ENCUMBERED
                    </span>
                  </td>
                  <td className="py-2.5 text-right">
                    <Link to="/assets/ast-greenfield-002" className="text-amber-400 hover:underline">
                      Inspect &rarr;
                    </Link>
                  </td>
                </tr>

                {/* Asset 3 */}
                <tr className="hover:bg-slate-800/30">
                  <td className="py-2.5 font-semibold text-slate-200">
                    LakeView Property
                    <span className="block text-[10px] text-slate-500 font-mono">PROP-LAKE-003</span>
                  </td>
                  <td className="py-2.5 text-slate-400">Pune</td>
                  <td className="py-2.5 text-slate-300 font-mono">₹75,00,000</td>
                  <td className="py-2.5">
                    <span className="px-2 py-0.5 rounded font-semibold bg-rose-500/20 text-rose-400 border border-rose-500/30">
                      52/100
                    </span>
                  </td>
                  <td className="py-2.5">
                    <span className="px-2 py-0.5 rounded text-[11px] bg-rose-500/20 text-rose-400 border border-rose-500/30 font-semibold">
                      REVIEW
                    </span>
                  </td>
                  <td className="py-2.5 text-right">
                    <Link to="/assets/ast-lakeview-003" className="text-rose-400 hover:underline">
                      Inspect &rarr;
                    </Link>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Bottom Section: Recent Audit Log Timeline */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-3">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-blue-400" />
            <h2 className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
              Live Audit Trail & DRUNIX Event Ledger
            </h2>
          </div>
          <Link to="/admin" className="text-xs text-blue-400 hover:underline">
            View DRUNIX Blocks &rarr;
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {recentAudit.slice(0, 6).map((log: any) => (
            <div key={log.id} className="p-3 rounded-lg bg-slate-800/40 border border-slate-800 text-xs">
              <div className="flex items-center justify-between mb-1">
                <span className="font-semibold text-slate-200">{log.action}</span>
                <span className="text-[10px] text-slate-500 font-mono">
                  {new Date(log.timestamp).toLocaleTimeString('en-IN')}
                </span>
              </div>
              <div className="text-slate-400 text-[11px] mb-1">
                Actor: <span className="text-slate-300">{log.user_email}</span>
              </div>
              {log.details && (
                <div className="text-[11px] text-slate-300 bg-slate-900/60 p-1.5 rounded border border-slate-800/80 truncate">
                  {typeof log.details === 'string' ? log.details : JSON.stringify(log.details)}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
