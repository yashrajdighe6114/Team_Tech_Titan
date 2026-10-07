import React from 'react';
import { Database, AlertCircle } from 'lucide-react';

interface DrunixBadgeProps {
  compact?: boolean;
}

export const DrunixBadge: React.FC<DrunixBadgeProps> = ({ compact = false }) => {
  return (
    <div
      title="NPCI DRUNIX Permissioned DLT (Fabric v2.5.x Spec). Running in verified Development Ledger Adapter mode because local Docker/Peer network is unconfigured."
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border bg-amber-950/30 border-amber-500/30 text-amber-300 ${
        compact ? 'text-[11px] py-0.5 px-2' : ''
      }`}
    >
      <Database className="w-3.5 h-3.5 text-amber-400 shrink-0" />
      <span className="font-semibold tracking-wide">DRUNIX:</span>
      <span className="text-amber-200/90 truncate">
        {compact ? 'Dev Adapter' : 'DRUNIX integration pending / development adapter'}
      </span>
      <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse ml-0.5"></span>
    </div>
  );
};
