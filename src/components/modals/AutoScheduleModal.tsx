import React, { useState } from 'react';
import { useSchedule } from '../../context/ScheduleContext';
import { MONTH_NAMES_PT } from '../../utils/dateUtils';
import { Wand2, X, Users, Calendar, AlertCircle, Check } from 'lucide-react';

interface AutoScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AutoScheduleModal: React.FC<AutoScheduleModalProps> = ({
  isOpen,
  onClose,
}) => {
  const {
    currentYear,
    currentMonthIndex,
    providers,
    shiftTypes,
    departments,
    autoGenerateSchedule,
  } = useSchedule();

  const [pattern, setPattern] = useState<'12x36' | 'rotate'>('12x36');
  const [selectedShiftTypeId, setSelectedShiftTypeId] = useState<string>(
    shiftTypes[0]?.id || ''
  );
  const [selectedDeptIds, setSelectedDeptIds] = useState<string[]>(
    departments.map(d => d.id)
  );

  const half = Math.ceil(providers.length / 2);
  const [teamA, setTeamA] = useState<string[]>(providers.slice(0, half).map(p => p.id));
  const [teamB, setTeamB] = useState<string[]>(providers.slice(half).map(p => p.id));

  const [successCount, setSuccessCount] = useState<number | null>(null);

  if (!isOpen) return null;

  const toggleDept = (deptId: string) => {
    setSelectedDeptIds(prev =>
      prev.includes(deptId) ? prev.filter(id => id !== deptId) : [...prev, deptId]
    );
  };

  const handleGenerate = () => {
    if (selectedDeptIds.length === 0 || !selectedShiftTypeId) return;

    const count = autoGenerateSchedule({
      year: currentYear,
      monthIndex: currentMonthIndex,
      pattern,
      teamAProviderIds: teamA,
      teamBProviderIds: teamB,
      departmentIds: selectedDeptIds,
      shiftTypeId: selectedShiftTypeId,
    });

    setSuccessCount(count);
    setTimeout(() => {
      setSuccessCount(null);
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-100">
      <div className="bg-white text-slate-800 rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden border border-slate-200/90">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-200/80 text-indigo-700 flex items-center justify-center font-bold shadow-2xs">
              <Wand2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900">
                Preenchimento Automático da Escala
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Gere a escala para {MONTH_NAMES_PT[currentMonthIndex]} de {currentYear}
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

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs">
          {successCount !== null ? (
            <div className="p-8 text-center space-y-2">
              <div className="w-12 h-12 bg-emerald-50 text-emerald-700 rounded-full flex items-center justify-center mx-auto text-xl font-bold border border-emerald-200">
                ✓
              </div>
              <h4 className="text-base font-bold text-slate-900">
                Escala Preenchida com Sucesso!
              </h4>
              <p className="text-xs text-slate-500">
                {successCount} plantões foram distribuídos no calendário.
              </p>
            </div>
          ) : (
            <>
              {/* Pattern */}
              <div>
                <label className="block font-bold text-slate-700 mb-1.5">
                  1. Regime de Trabalho
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPattern('12x36')}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                      pattern === '12x36'
                        ? 'border-emerald-500 bg-emerald-50/60 text-emerald-900 shadow-xs'
                        : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <div className="font-bold text-xs">Escala 12x36</div>
                    <div className="text-xs opacity-80 mt-0.5">
                      Equipe A (ímpares) / Equipe B (pares)
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPattern('rotate')}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                      pattern === 'rotate'
                        ? 'border-emerald-500 bg-emerald-50/60 text-emerald-900 shadow-xs'
                        : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <div className="font-bold text-xs">Rodízio Simples</div>
                    <div className="text-xs opacity-80 mt-0.5">
                      Distribuição sequencial na equipe
                    </div>
                  </button>
                </div>
              </div>

              {/* Turno */}
              <div>
                <label className="block font-bold text-slate-700 mb-1.5">
                  2. Horário do Turno
                </label>
                <select
                  value={selectedShiftTypeId}
                  onChange={e => setSelectedShiftTypeId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 text-slate-900 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-200 cursor-pointer"
                >
                  {shiftTypes.map(st => (
                    <option key={st.id} value={st.id}>
                      {st.name} ({st.startTime} às {st.endTime})
                    </option>
                  ))}
                </select>
              </div>

              {/* Departamentos */}
              <div>
                <label className="block font-bold text-slate-700 mb-1.5">
                  3. Setores / Postos
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {departments.map(dept => {
                    const isSelected = selectedDeptIds.includes(dept.id);
                    return (
                      <button
                        key={dept.id}
                        type="button"
                        onClick={() => toggleDept(dept.id)}
                        className={`px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-emerald-50 border-emerald-400 text-emerald-800'
                            : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        {dept.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Warning */}
              <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 flex items-start gap-2 text-xs">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>
                  O preenchimento automático irá sobrescrever plantões existentes do mês de{' '}
                  <strong>{MONTH_NAMES_PT[currentMonthIndex]}</strong> para os setores selecionados.
                </span>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        {successCount === null && (
          <div className="p-4 border-t border-slate-100 flex items-center justify-end gap-2 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl font-semibold cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleGenerate}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-xs transition-all cursor-pointer active:scale-98"
            >
              Gerar Escala Mensal
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
