import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Building2,
  PlusCircle,
  Coins,
  ShieldCheck,
  ArrowLeftRight,
  Database,
  FileCheck
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Sidebar: React.FC = () => {
  const { user } = useAuth();

  const navItems = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/assets', label: 'Asset Registry', icon: Building2 },
    { to: '/assets/new', label: 'Register Asset', icon: PlusCircle },
    { to: '/portfolio', label: 'Token Holdings', icon: Coins },
    { to: '/compliance', label: 'Compliance Office', icon: ShieldCheck, badge: 'Officer' },
    { to: '/settlements', label: 'Settlement Engine', icon: ArrowLeftRight },
    { to: '/admin', label: 'DRUNIX & Admin', icon: Database },
  ];

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col shrink-0 min-h-screen">
      {/* Brand Header */}
      <div className="h-16 flex items-center px-6 border-b border-slate-800 gap-3">
        <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-md">
          <ShieldCheck className="w-5 h-5 text-white" />
        </div>
        <div>
          <div className="font-bold text-slate-100 text-base tracking-tight flex items-center gap-1.5">
            AssetTrust
            <span className="text-[10px] font-semibold uppercase tracking-wider bg-blue-500/20 text-blue-400 px-1.5 py-0.2 rounded border border-blue-500/30">
              RWA
            </span>
          </div>
          <div className="text-[10px] text-slate-400 tracking-wide font-medium">
            AI & DRUNIX DLT Platform
          </div>
        </div>
      </div>

      {/* Nav items */}
      <div className="flex-1 py-5 px-3 space-y-1">
        <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider px-3 mb-2">
          Platform Navigation
        </div>
        {navItems.map(item => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center justify-between px-3.5 py-2.5 rounded-lg text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-blue-600/15 text-blue-400 border border-blue-500/30 shadow-sm font-semibold'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`
              }
            >
              <div className="flex items-center gap-3">
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span className="text-[10px] font-normal px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                  {item.badge}
                </span>
              )}
            </NavLink>
          );
        })}
      </div>

      {/* User info footer */}
      <div className="p-4 border-t border-slate-800 bg-slate-900/60">
        <div className="text-xs text-slate-400 mb-1">Signed in as:</div>
        <div className="text-xs font-semibold text-slate-200 truncate">{user?.full_name}</div>
        <div className="text-[11px] text-blue-400 font-mono truncate">{user?.email}</div>
      </div>
    </aside>
  );
};
