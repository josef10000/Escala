import React, { useState } from 'react';
import { useSchedule } from '../../context/ScheduleContext';
import { MONTH_NAMES_PT, formatDateToISO } from '../../utils/dateUtils';
import {
  Plus,
  Trash2,
  CheckCircle2,
  X,
  ShieldAlert
} from 'lucide-react';
import { IncidentType } from '../../types';

interface AttendanceIncidentModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultProviderId?: string;
}

export const AttendanceIncidentModal: React.FC<AttendanceIncidentModalProps> = ({
  isOpen,
  onClose,
  defaultProviderId,
}) => {
  const {
    providers,
    currentYear,
    currentMonthIndex,
    attendanceIncidents,
    addAttendanceIncident,
    deleteAttendanceIncident,
  } = useSchedule();

  const [isAddingNew, setIsAddingNew] = useState(false);
  const [providerId, setProviderId] = useState(defaultProviderId || providers[0]?.id || '');
  const [date, setDate] = useState(formatDateToISO(new Date()));
  const [type, setType] = useState<IncidentType>('atraso');
  const [durationMinutes, setDurationMinutes] = useState<number>(15);
  const [certificateNumber, setCertificateNumber] = useState('');
  const [reason, setReason] = useState('');
  const [status, setStatus] = useState<'registrado' | 'abonado' | 'descontado'>('registrado');

  if (!isOpen) return null;

  const monthName = MONTH_NAMES_PT[currentMonthIndex];
  
  // Filter incidents for this month
  const monthIncidents = attendanceIncidents.filter(inc => {
    const [y, m] = inc.date.split('-').map(Number);
    return y === currentYear && m === currentMonthIndex + 1;
  });

  const handleCreateIncident = (e: React.FormEvent) => {
    e.preventDefault();
    if (!providerId || !reason.trim()) return;

    addAttendanceIncident({
      providerId,
      date,
      type,
      durationMinutes: type === 'atraso' || type === 'hora_extra' || type === 'saida_antecipada' ? Number(durationMinutes) : undefined,
      certificateNumber: type === 'atestado_medico' ? certificateNumber.trim() : undefined,
      reason: reason.trim(),
      registeredByRole: 'supervisor',
      status,
    });

    // Reset form
    setReason('');
    setCertificateNumber('');
    setIsAddingNew(false);
  };

  const getTypeLabel = (t: IncidentType) => {
    switch (t) {
      case 'atraso':
        return { label: 'Atraso', color: 'bg-amber-950/60 text-amber-300 border-amber-800/80' };
      case 'atestado_medico':
        return { label: 'Atestado Médico', color: 'bg-indigo-950/60 text-indigo-300 border-indigo-800/80' };
      case 'falta_justificada':
        return { label: 'Falta Justificada', color: 'bg-cyan-950/60 text-cyan-300 border-cyan-800/80' };
      case 'falta_injustificada':
        return { label: 'Falta Injustificada', color: 'bg-rose-950/60 text-rose-300 border-rose-800/80' };
      case 'saida_antecipada':
        return { label: 'Saída Antecipada', color: 'bg-orange-950/60 text-orange-300 border-orange-800/80' };
      case 'hora_extra':
        return { label: 'Hora Extra / Dobra', color: 'bg-cyan-950/60 text-cyan-300 border-cyan-800/80' };
      default:
        return { label: 'Observação', color: 'bg-slate-800 text-slate-300 border-slate-700' };
    }
  };

  const getStatusLabel = (st?: string) => {
    switch (st) {
      case 'abonado':
        return { label: 'Abonado ✓', color: 'bg-cyan-950/60 text-cyan-300 border-cyan-800/80' };
      case 'descontado':
        return { label: 'Descontar em Folha', color: 'bg-rose-950/60 text-rose-300 border-rose-800/80' };
      default:
        return { label: 'Registrado', color: 'bg-slate-800 text-slate-300 border-slate-700' };
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-100">
      <div className="bg-[#141c28] text-slate-100 rounded-3xl p-6 border border-[#1e2a3a] shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden space-y-4">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#1e2a3a] pb-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-950/70 border border-amber-800/80 flex items-center justify-center text-amber-400 shadow-sm">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-white">
                Registro de Ocorrências & Atestados
              </h3>
              <p className="text-xs text-slate-400 font-medium">
                Atrasos, faltas, atestados e horas extras — {monthName}/{currentYear}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action button to show form */}
        {!isAddingNew ? (
          <div className="flex items-center justify-between shrink-0 bg-[#0c121c] p-3 rounded-2xl border border-[#1e2a3a]">
            <span className="text-xs text-slate-300 font-medium">
              {monthIncidents.length === 0
                ? 'Nenhuma ocorrência registrada neste mês'
                : `${monthIncidents.length} ocorrência(s) registrada(s) neste mês`}
            </span>
            <button
              onClick={() => setIsAddingNew(true)}
              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-md shadow-blue-950/40 active:scale-98"
            >
              <Plus className="w-4 h-4 text-cyan-200" />
              <span>+ Registrar Ocorrência</span>
            </button>
          </div>
        ) : (
          /* New Incident Form */
          <form onSubmit={handleCreateIncident} className="p-4 bg-[#0c121c] border border-[#1e2a3a] rounded-2xl space-y-3 shrink-0 animate-in fade-in">
            <div className="flex items-center justify-between">
              <h4 className="font-extrabold text-xs text-cyan-400 uppercase tracking-wider">
                Nova Ocorrência / Atestado
              </h4>
              <button
                type="button"
                onClick={() => setIsAddingNew(false)}
                className="text-xs text-slate-400 hover:text-white font-medium cursor-pointer"
              >
                Cancelar
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Colaborador */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Colaborador:
                </label>
                <select
                  value={providerId}
                  onChange={e => setProviderId(e.target.value)}
                  className="w-full bg-[#141c28] border border-[#1e2a3a] rounded-xl px-3 py-1.5 text-xs text-slate-200 font-medium focus:outline-none focus:border-cyan-400 cursor-pointer"
                >
                  {providers.map(p => (
                    <option key={p.id} value={p.id} className="bg-[#141c28] text-slate-200">
                      {p.name} ({p.role})
                    </option>
                  ))}
                </select>
              </div>

              {/* Data */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Data do Ocorrido:
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={e => setDate(e.target.value)}
                  className="w-full bg-[#141c28] border border-[#1e2a3a] rounded-xl px-3 py-1.5 text-xs text-slate-200 font-medium focus:outline-none focus:border-cyan-400 cursor-pointer"
                />
              </div>

              {/* Tipo de Ocorrência */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Tipo de Evento:
                </label>
                <select
                  value={type}
                  onChange={e => setType(e.target.value as IncidentType)}
                  className="w-full bg-[#141c28] border border-[#1e2a3a] rounded-xl px-3 py-1.5 text-xs text-slate-200 font-medium focus:outline-none focus:border-cyan-400 cursor-pointer"
                >
                  <option value="atraso">⏱️ Atraso (em minutos)</option>
                  <option value="atestado_medico">📄 Atestado Médico</option>
                  <option value="falta_justificada">✓ Falta Justificada</option>
                  <option value="falta_injustificada">⚠️ Falta Injustificada</option>
                  <option value="saida_antecipada">🚪 Saída Antecipada</option>
                  <option value="hora_extra">⭐ Hora Extra / Dobra</option>
                  <option value="observacao">📝 Observação Geral</option>
                </select>
              </div>

              {/* Duração se atraso ou hora extra */}
              {(type === 'atraso' || type === 'hora_extra' || type === 'saida_antecipada') && (
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Tempo em Minutos:
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="720"
                    value={durationMinutes}
                    onChange={e => setDurationMinutes(Number(e.target.value))}
                    className="w-full bg-[#141c28] border border-[#1e2a3a] rounded-xl px-3 py-1.5 text-xs text-slate-200 font-medium focus:outline-none focus:border-cyan-400"
                    placeholder="Ex: 15, 30, 60..."
                  />
                </div>
              )}

              {/* CRM / CID / Número de atestado se atestado médico */}
              {type === 'atestado_medico' && (
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Nº do Atestado / CID (opcional):
                  </label>
                  <input
                    type="text"
                    value={certificateNumber}
                    onChange={e => setCertificateNumber(e.target.value)}
                    className="w-full bg-[#141c28] border border-[#1e2a3a] rounded-xl px-3 py-1.5 text-xs text-slate-200 font-medium focus:outline-none focus:border-cyan-400"
                    placeholder="Ex: CRM 123456 / CID J06"
                  />
                </div>
              )}

              {/* Status financeiro / RH */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Tratativa RH:
                </label>
                <select
                  value={status}
                  onChange={e => setStatus(e.target.value as any)}
                  className="w-full bg-[#141c28] border border-[#1e2a3a] rounded-xl px-3 py-1.5 text-xs text-slate-200 font-medium focus:outline-none focus:border-cyan-400 cursor-pointer"
                >
                  <option value="registrado">Apenas Registrado</option>
                  <option value="abonado">Abonado pela Liderança</option>
                  <option value="descontado">Descontar em Folha de Pagamento</option>
                </select>
              </div>
            </div>

            {/* Motivo / Descrição */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Motivo / Justificativa detalhada:
              </label>
              <textarea
                rows={2}
                required
                value={reason}
                onChange={e => setReason(e.target.value)}
                placeholder="Ex: Teve imprevisto no trânsito; apresentou atestado médico da UPA; cobriu colega que passou mal..."
                className="w-full bg-[#141c28] border border-[#1e2a3a] rounded-xl px-3 py-1.5 text-xs text-slate-200 font-medium focus:outline-none focus:border-cyan-400 resize-none placeholder:text-slate-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setIsAddingNew(false)}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-950/40 cursor-pointer"
              >
                Salvar Ocorrência
              </button>
            </div>
          </form>
        )}

        {/* List of Incidents for Current Month */}
        <div className="overflow-y-auto flex-1 space-y-2.5 pr-1">
          {monthIncidents.length === 0 ? (
            <div className="p-8 text-center bg-[#0c121c] rounded-2xl border border-[#1e2a3a] text-slate-400 space-y-2">
              <CheckCircle2 className="w-8 h-8 text-cyan-400 mx-auto" />
              <p className="text-xs font-bold text-slate-200">Tudo em ordem!</p>
              <p className="text-xs text-slate-400">
                Nenhum atraso, falta injustificada ou atestado lançado para {monthName}/{currentYear}.
              </p>
            </div>
          ) : (
            monthIncidents.map(inc => {
              const prov = providers.find(p => p.id === inc.providerId);
              const typeBadge = getTypeLabel(inc.type);
              const statusBadge = getStatusLabel(inc.status);

              return (
                <div
                  key={inc.id}
                  className="p-3.5 bg-[#0c121c] border border-[#1e2a3a] hover:border-slate-600 rounded-2xl space-y-2 shadow-sm transition-all"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-slate-800 border border-[#1e2a3a] font-extrabold text-xs text-cyan-400 flex items-center justify-center shrink-0">
                        {prov?.name.substring(0, 2).toUpperCase() || '??'}
                      </div>
                      <div>
                        <h4 className="font-bold text-xs text-white">
                           {prov?.name || 'Colaborador não encontrado'}
                        </h4>
                        <div className="flex items-center gap-2 text-xs text-slate-400">
                          <span>Data: {inc.date.split('-').reverse().join('/')}</span>
                          {inc.durationMinutes && (
                            <span className="font-bold text-cyan-300">
                              • Duração: {inc.durationMinutes} min
                            </span>
                          )}
                          {inc.certificateNumber && (
                            <span className="font-bold text-indigo-300">
                              • Ref: {inc.certificateNumber}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded-lg border text-xs font-bold ${typeBadge.color}`}>
                        {typeBadge.label}
                      </span>
                      <button
                        onClick={() => {
                          if (window.confirm('Deseja excluir este registro de ocorrência?')) {
                            deleteAttendanceIncident(inc.id);
                          }
                        }}
                        className="text-slate-400 hover:text-rose-400 p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                        title="Excluir ocorrência"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <p className="text-xs text-slate-300 bg-[#141c28] p-2 rounded-xl border border-[#1e2a3a]">
                    "{inc.reason}"
                  </p>

                  <div className="flex items-center justify-between text-xs pt-1">
                    <span className="text-slate-400">
                      Lançado por: {inc.registeredByRole === 'supervisor' ? 'Liderança' : 'Colaborador'}
                    </span>
                    <span className={`px-2 py-0.5 rounded-md border font-semibold ${statusBadge.color}`}>
                      {statusBadge.label}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="pt-2 border-t border-[#1e2a3a] flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition-colors cursor-pointer"
          >
            Fechar
          </button>
        </div>

      </div>
    </div>
  );
};
