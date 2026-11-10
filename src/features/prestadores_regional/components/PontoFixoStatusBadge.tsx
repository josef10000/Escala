import React, { useState, useEffect } from 'react';
import { PontoFixoItem } from '../types';
import { getPontoFixoStatus } from '../utils/pontoFixoSchedule';
import { Clock } from 'lucide-react';

interface Props {
  pontoFixo: PontoFixoItem;
  size?: 'sm' | 'md';
  showSubtext?: boolean;
}

export const PontoFixoStatusBadge: React.FC<Props> = ({
  pontoFixo,
  size = 'md',
  showSubtext = true,
}) => {
  const [status, setStatus] = useState(() => getPontoFixoStatus(pontoFixo));

  useEffect(() => {
    // Initial evaluation
    setStatus(getPontoFixoStatus(pontoFixo));

    // Update every minute to keep realtime accuracy
    const timer = setInterval(() => {
      setStatus(getPontoFixoStatus(pontoFixo));
    }, 30000);

    return () => clearInterval(timer);
  }, [pontoFixo]);

  const colorStyles = {
    emerald: {
      dot: 'bg-emerald-400 animate-pulse',
      bg: 'bg-emerald-500/10 border-emerald-500/25 text-emerald-300',
      label: 'text-emerald-300',
      sub: 'text-emerald-400/90',
    },
    amber: {
      dot: 'bg-amber-400 animate-pulse',
      bg: 'bg-amber-500/10 border-amber-500/25 text-amber-300',
      label: 'text-amber-300',
      sub: 'text-amber-400/90',
    },
    rose: {
      dot: 'bg-rose-400',
      bg: 'bg-rose-500/10 border-rose-500/25 text-rose-300',
      label: 'text-rose-300',
      sub: 'text-rose-400/80',
    },
  }[status.badgeColor];

  if (size === 'sm') {
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-medium border ${colorStyles.bg}`}
        title={`${status.label} • ${status.subtext}`}
      >
        <span className={`w-1.5 h-1.5 rounded-full ${colorStyles.dot}`} />
        <span className="font-semibold">{status.label}</span>
      </span>
    );
  }

  return (
    <div
      className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-lg border text-xs ${colorStyles.bg}`}
      title={`${status.label} • ${status.subtext}`}
    >
      <div className="flex items-center gap-1.5">
        <span className={`w-2 h-2 rounded-full shrink-0 ${colorStyles.dot}`} />
        <span className={`font-semibold tracking-tight ${colorStyles.label}`}>
          {status.label}
        </span>
      </div>

      {showSubtext && (
        <span className={`border-l border-slate-700/60 pl-2 font-mono text-xs ${colorStyles.sub}`}>
          {status.subtext}
        </span>
      )}
    </div>
  );
};
