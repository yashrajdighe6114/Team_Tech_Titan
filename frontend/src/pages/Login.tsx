import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Lock, Mail, ArrowRight, CheckCircle2 } from 'lucide-react';
import { DrunixBadge } from '../components/DrunixBadge';

export const Login: React.FC = () => {
  const { login, demoSwitch } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('owner@assettrust.demo');
  const [password, setPassword] = useState('Password123!');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const demoAccounts = [
    { email: 'owner@assettrust.demo', label: 'Asset Owner', desc: 'Registers assets & submits deeds', role: 'ASSET_OWNER' },
    { email: 'investor@assettrust.demo', label: 'Investor', desc: 'Holds tokens & trades fractions', role: 'INVESTOR' },
    { email: 'compliance@assettrust.demo', label: 'Compliance Officer', desc: 'Reviews AI audits & approves mints', role: 'COMPLIANCE_OFFICER' },
    { email: 'bank@assettrust.demo', label: 'Bank / Custodian', desc: 'Adds liens & settles DvP escrows', role: 'BANK' },
    { email: 'admin@assettrust.demo', label: 'Admin', desc: 'Manages platform & ledger consensus', role: 'ADMIN' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Login failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (role: string, accEmail: string) => {
    setEmail(accEmail);
    setLoading(true);
    try {
      await demoSwitch(role);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Quick login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden">
      {/* Background radial glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-xl z-10 space-y-6">
        {/* Brand header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 shadow-xl mb-1">
            <ShieldCheck className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            AssetTrust
          </h1>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            AI-Verified Real-World Asset Tokenization & Institutional Settlement Platform
          </p>
          <div className="pt-1">
            <DrunixBadge />
          </div>
        </div>

        {/* Login Box */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h2 className="text-sm font-semibold text-slate-200 uppercase tracking-wider">
              Institutional Sign In
            </h2>
            <span className="text-xs text-slate-500">
              Demo Sandbox Mode
            </span>
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-rose-950/50 border border-rose-500/40 text-rose-300 text-xs">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full pl-9 pr-3 py-2 text-xs bg-slate-950 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  placeholder="name@assettrust.demo"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full pl-9 pr-3 py-2 text-xs bg-slate-950 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold tracking-wide transition-all shadow-md flex items-center justify-center gap-2"
            >
              <span>{loading ? 'Authenticating...' : 'Sign In to Portal'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Demo Switcher Selection */}
          <div className="pt-4 border-t border-slate-800">
            <div className="text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider">
              One-Click Hackathon Demo Access:
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {demoAccounts.map(acc => (
                <button
                  key={acc.email}
                  type="button"
                  onClick={() => handleQuickLogin(acc.role, acc.email)}
                  className="p-2.5 text-left rounded-lg bg-slate-800/40 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 transition-all text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-200">{acc.label}</span>
                    <span className="text-[10px] text-blue-400 font-mono">Instant &rarr;</span>
                  </div>
                  <div className="text-[11px] text-slate-400 truncate">{acc.email}</div>
                  <div className="text-[10px] text-slate-500">{acc.desc}</div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Demo Credentials Note */}
        <div className="text-center text-xs text-slate-500">
          Default password for all accounts: <strong className="text-slate-300 font-mono">Password123!</strong>
        </div>
      </div>
    </div>
  );
};
