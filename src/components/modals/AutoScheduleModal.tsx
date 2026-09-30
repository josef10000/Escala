import React, { useState } from 'react';
import { X, Wand2, Sparkles } from 'lucide-react';
import { useSchedule } from '../../context/ScheduleContext';
import { MONTH_NAMES_PT } from '../../utils/dateUtils';

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
    departments,
    shiftTypes,
    autoGenerateSchedule,
  } = useSchedule();

  const [pattern, setPattern] = useState<'12x36' | 'rotate'>('12x36');
  const [selectedDeptIds, setSelectedDeptIds] = useState<string[]>([departments[0]?.id || '']);
  const [selectedShiftTypeId, setSelectedShiftTypeId] = useState<string>(shiftTypes[0]?.id || '');

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-slate-900 text-slate-100 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden border border-slate-800 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/70 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold">
              <Wand2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                Preenchimento Automático da Escala
              </h3>
              <p className="text-xs text-slate-400">
                Gere a escala para {MONTH_NAMES_PT[currentMonthIndex]} de {currentYear}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs">
          {successCount !== null ? (
            <div className="p-8 text-center space-y-2">
              <div className="w-12 h-12 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto text-xl font-bold border border-emerald-500/40">
                ✓
              </div>
              <h4 className="text-base font-bold text-white">
                Escala Preenchida com Sucesso!
              </h4>
              <p className="text-xs text-slate-400">
                {successCount} plantões foram distribuídos no calendário.
              </p>
            </div>
          ) : (
            <>
              {/* Pattern */}
              <div>
                <label className="block font-bold text-slate-300 mb-1.5">
                  1. Regime de Trabalho
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPattern('12x36')}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      pattern === '12x36'
                        ? 'border-indigo-500 bg-indigo-950/50 text-white'
                        : 'border-slate-800 bg-slate-950 text-slate-400 hover:bg-slate-800'
                    }`}
                  >
                    <div className="font-bold text-xs">Escala 12x36</div>
                    <div className="text-[11px] opacity-75 mt-0.5">
                      Equipe A (ímpares) / Equipe B (pares)
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPattern('rotate')}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      pattern === 'rotate'
                        ? 'border-indigo-500 bg-indigo-950/50 text-white'
                        : 'border-slate-800 bg-slate-950 text-slate-400 hover:bg-slate-800'
                    }`}
                  >
                    <div className="font-bold text-xs">Rodízio Simples</div>
                    <div className="text-[11px] opacity-75 mt-0.5">
                      Distribuição sequencial na equipe
                    </div>
                  </button>
                </div>
              </div>

              {/* Turno */}
              <div>
                <label className="block font-bold text-slate-300 mb-1.5">
                  2. Horário do Turno
                </label>
                <select
                  value={selectedShiftTypeId}
                  onChange={e => setSelectedShiftTypeId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 text-white rounded-xl text-xs"
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
                <label className="block font-bold text-slate-300 mb-1.5">
                  3. Setores a Preencher
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-slate-950 p-3 rounded-xl border border-slate-800">
                  {departments.map(d => {
                    const checked = selectedDeptIds.includes(d.id);
                    return (
                      <label
                        key={d.id}
                        className="flex items-center gap-2 cursor-pointer p-1 rounded hover:bg-slate-900 transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleDept(d.id)}
                          className="rounded text-indigo-600 focus:ring-indigo-500"
                        />
                        <span className="font-medium text-slate-200">{d.name}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="p-3 bg-indigo-950/40 border border-indigo-800/60 rounded-xl text-indigo-300 flex items-start gap-2">
                <Sparkles className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                <span>
                  O sistema criará automaticamente os plantões de todos os dias do mês para os setores selecionados.
                </span>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        {successCount === null && (
          <div className="p-4 border-t border-slate-800 bg-slate-950 flex items-center justify-between shrink-0">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white"
            >
              Cancelar
            </button>
            <button
              onClick={handleGenerate}
              disabled={selectedDeptIds.length === 0}
              className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 rounded-xl shadow-md transition-all flex items-center gap-1.5"
            >
              <Wand2 className="w-3.5 h-3.5" />
              <span>Gerar Plantões</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
