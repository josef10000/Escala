import React from 'react';
import { CheckCircle2, Info } from 'lucide-react';

interface ToastProps {
  message: string | null;
}

export const Toast: React.FC<ToastProps> = ({ message }) => {
  if (!message) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl bg-slate-900/95 text-white border border-blue-500/40 shadow-2xl shadow-blue-500/20 backdrop-blur-md animate-slideUp text-sm font-medium">
      <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
      <span className="font-mono text-xs text-blue-200">{message}</span>
    </div>
  );
};
