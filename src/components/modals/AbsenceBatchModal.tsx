import React, { useState } from 'react';
import { useSchedule } from '../../context/ScheduleContext';
import { AbsenceType } from '../../types';
import { formatDateToISO } from '../../utils/dateUtils';
import {
  CalendarRange,
  X,
  Palmtree,
  Stethoscope,
  Baby,
  Clock,
  FileText,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';

interface AbsenceBatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultProviderId?: string;
}

export const AbsenceBatchModal: React.FC<AbsenceBatchModalProps> = ({
  isOpen,
  onClose,
  defaultProviderId,
}) => {
  const {
    providers,
    activeRegime,
    currentYear,
    currentMonthIndex,
    applyAbsenceRange,
  } = useSchedule();

  const regimeProviders = providers.filter(
    p => (p.regime || '12x36') === activeRegime
  );

  const defaultMonthStr = String(currentMonthIndex + 1).padStart(2, '0');
  const defaultStart = `${currentYear}-${defaultMonthStr}-01`;
  const defaultEnd = `${currentYear}-${defaultMonthStr}-05`;

  const [selectedProviderId, setSelectedProviderId] = useState<string>(
    defaultProviderId || regimeProviders[0]?.id || ''
  );
  const [absenceType, setAbsenceType] = useState<AbsenceType>('vacation');
  const [startDate, setStartDate] = useState<string>(defaultStart);
  const [endDate, setEndDate] = useState<string>(defaultEnd);
  const [notes, setNotes] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');

  if (!isOpen) return null;

  // Calculate days count
  const calculateDays = () => {
    if (!startDate || !endDate) return 0;
    const s = new Date(startDate);
    const e = new Date(endDate);
    const diffTime = e.getTime() - s.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays > 0 ? diffDays : 0;
  };

  const totalDays = calculateDays();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!selectedProviderId) {
      setErrorMsg('Selecione um colaborador.');
      return;
    }
    if (!startDate || !endDate) {
      setErrorMsg('Selecione as datas de início e término.');
      return;
    }
    if (new Date(startDate) > new Date(endDate)) {
      setErrorMsg('A data inicial não pode ser posterior à data final.');
      return;
    }

    const appliedCount = applyAbsenceRange({
      providerId: selectedProviderId,
      startDate,
      endDate,
      type: absenceType,
      notes: notes.trim() || undefined,
    });

    setSuccessMsg(`Sucesso! ${appliedCount} dia(s) de afastamento lançados na escala.`);
    setTimeout(() => {
      onClose();
      setSuccessMsg('');
    }, 1200);
  };

  const typeIcons = {
    vacation: <Palmtree className="w-4 h-4 text-emerald-600" />,
    medical: <Stethoscope className="w-4 h-4 text-rose-600" />,
    maternity: <Baby className="w-4 h-4 text-purple-600" />,
    compensation: <Clock className="w-4 h-4 text-amber-600" />,
    other: <FileText className="w-4 h-4 text-sky-600" />,
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-100">
      <div className="bg-white text-slate-800 rounded-3xl p-6 border border-slate-200/90 shadow-2xl max-w-lg w-full space-y-4">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-50 border border-amber-200/80 flex items-center justify-center text-amber-700 shadow-2xs">
              <CalendarRange className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900">
                Lançar Férias ou Afastamento
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Bloqueia o período e anota na escala do colaborador
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          
          {/* Provider Select */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Colaborador:
            </label>
            <select
              value={selectedProviderId}
              onChange={e => setSelectedProviderId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-200 cursor-pointer"
            >
              {regimeProviders.map(p => (
                <option key={p.id} value={p.id}>
                  {p.name} {p.teamGroup ? `(${p.teamGroup === 'turma_a' ? 'Turma A - Ímpar' : 'Turma B - Par'})` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Absence Type Selector Grid */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Tipo de Afastamento:
            </label>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => setAbsenceType('vacation')}
                className={`p-2.5 rounded-xl border flex items-center gap-2 font-bold transition-all cursor-pointer ${
                  absenceType === 'vacation'
                    ? 'bg-emerald-50 border-emerald-400 text-emerald-800 shadow-xs'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                {typeIcons.vacation}
                <span>Férias</span>
              </button>

              <button
                type="button"
                onClick={() => setAbsenceType('medical')}
                className={`p-2.5 rounded-xl border flex items-center gap-2 font-bold transition-all cursor-pointer ${
                  absenceType === 'medical'
                    ? 'bg-rose-50 border-rose-400 text-rose-800 shadow-xs'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                {typeIcons.medical}
                <span>Licença Médica</span>
              </button>

              <button
                type="button"
                onClick={() => setAbsenceType('compensation')}
                className={`p-2.5 rounded-xl border flex items-center gap-2 font-bold transition-all cursor-pointer ${
                  absenceType === 'compensation'
                    ? 'bg-amber-50 border-amber-400 text-amber-800 shadow-xs'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                {typeIcons.compensation}
                <span>Banco de Horas / Folga</span>
              </button>

              <button
                type="button"
                onClick={() => setAbsenceType('maternity')}
                className={`p-2.5 rounded-xl border flex items-center gap-2 font-bold transition-all cursor-pointer ${
                  absenceType === 'maternity'
                    ? 'bg-purple-50 border-purple-400 text-purple-800 shadow-xs'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                {typeIcons.maternity}
                <span>Licença Maternidade</span>
              </button>
            </div>
          </div>

          {/* Date range selection */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Data Inicial:
              </label>
              <input
                type="date"
                required
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-200"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Data Final:
              </label>
              <input
                type="date"
                required
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-200"
              />
            </div>
          </div>

          {/* Total Days Pill */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between text-xs">
            <span className="text-slate-600 font-medium">Duração total calculada:</span>
            <span className="font-extrabold text-emerald-800 bg-white px-3 py-1 rounded-xl border border-emerald-200 shadow-2xs">
              {totalDays} dia(s)
            </span>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Observação / Parecer da Liderança (opcional):
            </label>
            <input
              type="text"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Ex: Aprovado pela diretoria; atestado médico anexo..."
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-200"
            />
          </div>

          {errorMsg && (
            <p className="text-xs text-rose-600 bg-rose-50 p-2.5 rounded-xl border border-rose-200 font-medium">
              {errorMsg}
            </p>
          )}

          {successMsg && (
            <p className="text-xs text-emerald-700 bg-emerald-50 p-2.5 rounded-xl border border-emerald-200 font-semibold">
              {successMsg}
            </p>
          )}

          {/* Footer Actions */}
          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-xl shadow-xs transition-all cursor-pointer active:scale-98"
            >
              Aplicar Afastamento na Escala
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
