import React from 'react';
import { Clock, CheckCircle2, AlertTriangle, Shield, ArrowRight } from 'lucide-react';

interface AuditItem {
  id: string;
  asset_id?: string;
  asset_name?: string;
  user_email: string;
  action: string;
  status: string;
  details?: any;
  drunix_ref?: string;
  timestamp: string;
}

interface AuditTimelineProps {
  logs: AuditItem[];
  title?: string;
}

export const AuditTimeline: React.FC<AuditTimelineProps> = ({ logs, title = 'Audit Trail & Compliance Timeline' }) => {
  if (!logs || logs.length === 0) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 text-center text-sm text-slate-400">
        No audit logs recorded yet.
      </div>
    );
  }

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-slate-400" />
          <h3 className="font-semibold text-slate-200 text-sm tracking-wide uppercase">
            {title}
          </h3>
        </div>
        <span className="text-xs text-slate-500 font-mono">
          Immutable DLT Sequence
        </span>
      </div>

      <div className="mt-4 space-y-4">
        {logs.map((log, index) => {
          const isSuccess = log.status === 'SUCCESS';
          const isFlagged = log.status === 'FLAGGED' || log.status === 'RESTRICTED';

          return (
            <div key={log.id || index} className="relative flex gap-3 text-xs">
              {/* Vertical connector line */}
              {index < logs.length - 1 && (
                <div className="absolute left-[13px] top-6 bottom-[-16px] w-[2px] bg-slate-800" />
              )}

              {/* Status node */}
              <div className="z-10 mt-0.5">
                {isSuccess ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 bg-slate-900 rounded-full" />
                ) : isFlagged ? (
                  <AlertTriangle className="w-5 h-5 text-amber-400 bg-slate-900 rounded-full" />
                ) : (
                  <Shield className="w-5 h-5 text-blue-400 bg-slate-900 rounded-full" />
                )}
              </div>

              {/* Log Content */}
              <div className="flex-1 bg-slate-800/40 border border-slate-800/80 rounded-lg p-3">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-200">{log.action}</span>
                    {log.asset_name && (
                      <span className="text-[11px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                        {log.asset_name}
                      </span>
                    )}
                  </div>
                  <span className="text-slate-500 text-[11px] font-mono">
                    {new Date(log.timestamp).toLocaleString('en-IN', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit'
                    })}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-slate-400 text-[11px] mb-1.5">
                  <span>Actor: <strong className="text-slate-300 font-normal">{log.user_email}</strong></span>
                  {log.drunix_ref && (
                    <span className="text-amber-400/90 font-mono text-[10px] bg-amber-950/30 px-1 rounded border border-amber-500/20">
                      Ref: {log.drunix_ref}
                    </span>
                  )}
                </div>

                {log.details && (
                  <div className="text-slate-300 text-xs bg-slate-900/60 p-2 rounded border border-slate-800/60 mt-1 break-words">
                    {typeof log.details === 'string' ? log.details : JSON.stringify(log.details)}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
