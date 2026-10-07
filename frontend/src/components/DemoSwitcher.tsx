import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Users, UserCheck } from 'lucide-react';

export const DemoSwitcher: React.FC = () => {
  const { user, demoSwitch } = useAuth();

  const roles = [
    { role: 'ASSET_OWNER', label: 'Asset Owner', name: 'Rahul Sharma', color: 'border-blue-500/40 text-blue-300 bg-blue-950/30' },
    { role: 'INVESTOR', label: 'Investor', name: 'Priya Deshmukh', color: 'border-emerald-500/40 text-emerald-300 bg-emerald-950/30' },
    { role: 'COMPLIANCE_OFFICER', label: 'Compliance Officer', name: 'Ananya Roy', color: 'border-purple-500/40 text-purple-300 bg-purple-950/30' },
    { role: 'BANK', label: 'Bank / Custodian', name: 'HDFC Escrow', color: 'border-amber-500/40 text-amber-300 bg-amber-950/30' },
    { role: 'ADMIN', label: 'Admin', name: 'Vikramaditya', color: 'border-slate-500/40 text-slate-300 bg-slate-900' }
  ];

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 shadow-md">
      <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
        <Users className="w-4 h-4 text-slate-400" />
        <span>Hackathon Demo Role Switcher:</span>
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        {roles.map(r => {
          const isActive = user?.role === r.role;
          return (
            <button
              key={r.role}
              onClick={() => demoSwitch(r.role)}
              className={`text-xs px-2.5 py-1 rounded-md font-medium transition-all flex items-center gap-1.5 border ${
                isActive
                  ? `${r.color} ring-1 ring-white/20 font-semibold shadow-sm`
                  : 'bg-slate-800/40 border-slate-700/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              {isActive && <UserCheck className="w-3.5 h-3.5 text-white" />}
              <span>{r.label}</span>
              <span className="text-[10px] opacity-75 font-normal">({r.name})</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
