import React, { useState } from 'react';
import { useSchedule } from '../../context/ScheduleContext';
import { Provider, ScheduleRequestType } from '../../types';
import { FileText, X, Calendar, PlusCircle, Check } from 'lucide-react';
import { formatDateToISO } from '../../utils/dateUtils';

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
    // Default to 15th of next or current month
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-100">
      <div className="bg-slate-900 text-white rounded-3xl p-6 border border-slate-800 shadow-2xl max-w-md w-full space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-indigo-950 text-indigo-400 border border-indigo-500/40 flex items-center justify-center font-bold">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-white">
                Pedido para Escala
              </h3>
              <p className="text-xs text-slate-400">
                Colaborador: <strong className="text-indigo-300">{provider.name}</strong>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {isSuccess ? (
          <div className="py-8 text-center space-y-3">
            <div className="w-12 h-12 bg-emerald-950 text-emerald-400 rounded-full flex items-center justify-center mx-auto border border-emerald-500/40">
              <Check className="w-6 h-6" />
            </div>
            <h4 className="text-base font-black text-emerald-300">
              Pedido Enviado à Líder!
            </h4>
            <p className="text-xs text-slate-400">
              Sua solicitação foi salva e sincronizada na nuvem para avaliação.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Type selector */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                Tipo de Pedido:
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setType('day_off')}
                  className={`py-2 px-3 text-xs font-bold rounded-xl border text-center transition-all ${
                    type === 'day_off'
                      ? 'bg-blue-600/30 text-blue-200 border-blue-500 ring-1 ring-blue-500/50'
                      : 'bg-slate-950 border-slate-700 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Solicitar Folga (D)
                </button>
                <button
                  type="button"
                  onClick={() => setType('extra_shift')}
                  className={`py-2 px-3 text-xs font-bold rounded-xl border text-center transition-all ${
                    type === 'extra_shift'
                      ? 'bg-emerald-600/30 text-emerald-200 border-emerald-500 ring-1 ring-emerald-500/50'
                      : 'bg-slate-950 border-slate-700 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Disponibilidade Extra (T)
                </button>
              </div>
            </div>

            {/* Date selection */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Data Desejada:
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={e => setDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs font-mono focus:border-indigo-500 focus:outline-none"
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
                placeholder="Ex: Aniversário da minha filha / Exame marcado / Viagem programada..."
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs focus:border-indigo-500 focus:outline-none resize-none"
              />
            </div>

            {errorMsg && (
              <div className="p-2.5 bg-rose-950/50 border border-rose-800/60 rounded-xl text-xs text-rose-300">
                {errorMsg}
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="w-1/2 py-2 text-xs font-bold text-slate-400 hover:text-white"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="w-1/2 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Enviar Solicitação</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
