import React, { useState } from 'react';
import { useSchedule } from '../../context/ScheduleContext';
import { Provider, ScheduleRequestType } from '../../types';
import { FileText, X, CheckCircle2 } from 'lucide-react';

interface ScheduleRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  provider: Provider;
}

export const ScheduleRequestModal: React.FC<ScheduleRequestModalProps> = ({
  isOpen,
  onClose,
  provider,
}) => {
  const { currentYear, currentMonthIndex, addScheduleRequest } = useSchedule();

  const [type, setType] = useState<ScheduleRequestType>('day_off');
  const [date, setDate] = useState<string>(() => {
    // Default to 15th of current month
    const m = String(currentMonthIndex + 1).padStart(2, '0');
    return `${currentYear}-${m}-15`;
  });
  const [reason, setReason] = useState<string>('');
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!date) {
      setErrorMsg('Selecione uma data para o pedido.');
      return;
    }
    if (!reason.trim()) {
      setErrorMsg('Descreva a justificativa para a Líder.');
      return;
    }

    addScheduleRequest({
      providerId: provider.id,
      type,
      date,
      reason: reason.trim(),
    });

    setIsSuccess(true);
    setTimeout(() => {
      setIsSuccess(false);
      onClose();
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-100">
      <div className="bg-[#141c28] text-slate-100 rounded-3xl p-6 border border-[#1e2a3a] shadow-2xl max-w-md w-full space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#1e2a3a] pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-cyan-950/60 text-cyan-300 border border-cyan-800/80 flex items-center justify-center font-bold shadow-sm">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-white">
                Pedido para a Escala
              </h3>
              <p className="text-xs text-slate-400 font-medium">
                Colaborador: <strong className="text-cyan-400">{provider.name}</strong>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {isSuccess ? (
          <div className="py-8 text-center space-y-3">
            <div className="w-12 h-12 bg-cyan-950/70 text-cyan-300 rounded-2xl flex items-center justify-center mx-auto border border-cyan-800 shadow-sm">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h4 className="text-base font-extrabold text-white">
              Pedido Enviado à Líder!
            </h4>
            <p className="text-xs text-slate-400">
              Sua solicitação foi salva e sincronizada na nuvem para avaliação.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            {/* Type selector */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Tipo de Solicitação:
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setType('day_off')}
                  className={`py-2 px-3 rounded-xl font-bold border transition-all cursor-pointer ${
                    type === 'day_off'
                      ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-sm font-black'
                      : 'bg-[#0c121c] text-slate-300 border-[#1e2a3a] hover:bg-slate-800'
                  }`}
                >
                  Pedido de Folga (D)
                </button>
                <button
                  type="button"
                  onClick={() => setType('extra_shift')}
                  className={`py-2 px-3 rounded-xl font-bold border transition-all cursor-pointer ${
                    type === 'extra_shift'
                      ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-sm font-black'
                      : 'bg-[#0c121c] text-slate-300 border-[#1e2a3a] hover:bg-slate-800'
                  }`}
                >
                  Plantão Extra
                </button>
              </div>
            </div>

            {/* Date */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Data Desejada:
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={e => setDate(e.target.value)}
                className="w-full px-3 py-2 bg-[#0c121c] border border-[#1e2a3a] rounded-xl text-slate-200 text-xs font-bold focus:border-cyan-400 focus:outline-none transition-colors cursor-pointer"
              />
            </div>

            {/* Reason */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Justificativa / Motivo:
              </label>
              <textarea
                required
                rows={3}
                value={reason}
                onChange={e => setReason(e.target.value)}
                placeholder="Explique o motivo para a coordenação avaliar..."
                className="w-full px-3 py-2 bg-[#0c121c] border border-[#1e2a3a] rounded-xl text-slate-200 text-xs focus:border-cyan-400 focus:outline-none resize-none transition-colors placeholder:text-slate-500"
              />
            </div>

            {errorMsg && (
              <div className="p-3 bg-rose-950/70 border border-rose-800/80 rounded-xl text-xs text-rose-300 font-medium">
                {errorMsg}
              </div>
            )}

            <div className="flex gap-2 pt-2 border-t border-[#1e2a3a]">
              <button
                type="button"
                onClick={onClose}
                className="w-1/2 py-2 text-xs font-bold text-slate-400 hover:text-white rounded-xl transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="w-1/2 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-xl shadow-md shadow-blue-950/40 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <FileText className="w-3.5 h-3.5 text-cyan-200" />
                <span>Enviar Pedido</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
