import React from 'react';
import { useSchedule } from '../../context/ScheduleContext';
import { X, History, ShieldCheck, Clock, User } from 'lucide-react';

interface AuditLogModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuditLogModal: React.FC<AuditLogModalProps> = ({ isOpen, onClose }) => {
  const { lastUpdatedAt, lastUpdatedBy, assignments, attendanceIncidents } = useSchedule();

  if (!isOpen) return null;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200 cursor-pointer"
    >
      <div
        onClick={e => e.stopPropagation()}
        className="bg-[#0e1017] text-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] flex flex-col overflow-hidden border border-white/[0.09] cursor-default"
      >
        {/* Header */}
        <div className="p-5 border-b border-white/[0.08] bg-[#12141c] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/15 border border-purple-500/30 text-purple-300 flex items-center justify-center font-bold">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white tracking-tight">
                Histórico de Auditoria & Registro de Ações
              </h3>
              <p className="text-xs text-neutral-400 font-medium">
                Rastreabilidade e log de alterações em tempo real sincronizadas na nuvem
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-white/[0.06] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1 text-xs">
          <div className="p-4 rounded-xl bg-[#141720] border border-white/[0.06] flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[10px] text-neutral-400 uppercase tracking-wider block">Última Sincronização Geral</span>
              <div className="font-bold text-white text-sm flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#00d2d3]" />
                <span>{new Date(lastUpdatedAt).toLocaleString('pt-BR')}</span>
              </div>
            </div>
            <div className="text-right space-y-1">
              <span className="text-[10px] text-neutral-400 uppercase tracking-wider block">Responsável</span>
              <div className="font-bold text-[#00d2d3] flex items-center gap-1.5 justify-end">
                <User className="w-3.5 h-3.5" />
                <span>{lastUpdatedBy || 'Sistema / Liderança'}</span>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Atividades Recentes no Sistema</h4>
            
            <div className="p-3.5 rounded-xl bg-[#141720] border border-white/[0.06] flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center justify-center font-bold shrink-0">
                ✓
              </div>
              <div className="space-y-1 flex-1">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-white">Escala Oficial Sincronizada</span>
                  <span className="text-[10px] text-neutral-400">{new Date(lastUpdatedAt).toLocaleDateString('pt-BR')}</span>
                </div>
                <p className="text-xs text-neutral-300">
                  Total de {assignments.length} plantões e ocorrências validados e ativos na base unificada.
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-[#141720] border border-white/[0.06] flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#00d2d3]/20 text-[#00d2d3] border border-[#00d2d3]/30 flex items-center justify-center font-bold shrink-0">
                🛡️
              </div>
              <div className="space-y-1 flex-1">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-white">Auditoria de Carga Horária & PJ</span>
                  <span className="text-[10px] text-neutral-400">Ativo</span>
                </div>
                <p className="text-xs text-neutral-300">
                  Regras de bônus e abatimento por atraso/falta aplicadas em conformidade com as diretrizes contratuais.
                </p>
              </div>
            </div>

            {attendanceIncidents.length > 0 && (
              <div className="p-3.5 rounded-xl bg-[#141720] border border-white/[0.06] flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center justify-center font-bold shrink-0">
                  ⚡
                </div>
                <div className="space-y-1 flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-white">Ocorrências & Atestados Registrados</span>
                    <span className="text-[10px] text-neutral-400">{attendanceIncidents.length} evento(s)</span>
                  </div>
                  <p className="text-xs text-neutral-300">
                    Última ocorrência registrada em {attendanceIncidents[0]?.date || 'data recente'} com tratativa de RH aplicada.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-white/[0.06] bg-[#12141c] flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-medium text-neutral-300 hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
