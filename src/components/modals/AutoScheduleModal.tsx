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
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200 cursor-pointer"
    >
      <div
        onClick={e => e.stopPropagation()}
        className="bg-[#0e1017] text-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden border border-white/[0.09] cursor-default"
      >
        {/* Header */}
        <div className="p-5 border-b border-white/[0.08] bg-[#12141c] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/15 border border-purple-500/30 text-purple-300 flex items-center justify-center font-bold">
              <Wand2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white tracking-tight">
                Preenchimento Automático da Escala
              </h3>
              <p className="text-xs text-neutral-400 font-medium">
                Gere a escala para {MONTH_NAMES_PT[currentMonthIndex]} de {currentYear}
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
        <div className="p-5 overflow-y-auto space-y-4 text-xs">
          {successCount !== null ? (
            <div className="p-8 text-center space-y-2">
              <div className="w-12 h-12 bg-emerald-500/20 text-emerald-300 rounded-full flex items-center justify-center mx-auto text-xl font-bold border border-emerald-500/30">
                ✓
              </div>
              <h4 className="text-base font-semibold text-white">
                Escala Preenchida com Sucesso!
              </h4>
              <p className="text-xs text-neutral-400">
                {successCount} plantões foram distribuídos no calendário.
              </p>
            </div>
          ) : (
            <>
              {/* Pattern */}
              <div>
                <label className="block font-semibold text-neutral-300 mb-1.5">
                  1. Regime de Trabalho
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPattern('12x36')}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      pattern === '12x36'
                        ? 'border-[#00d2d3]/50 bg-[#00d2d3]/15 text-[#00d2d3]'
                        : 'border-white/[0.08] bg-[#161922] text-neutral-400 hover:bg-white/[0.06]'
                    }`}
                  >
                    <div className="font-bold text-xs">Escala 12x36</div>
                    <div className="text-[11px] opacity-80 mt-0.5">
                      Equipe A (ímpares) / Equipe B (pares)
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPattern('rotate')}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      pattern === 'rotate'
                        ? 'border-[#00d2d3]/50 bg-[#00d2d3]/15 text-[#00d2d3]'
                        : 'border-white/[0.08] bg-[#161922] text-neutral-400 hover:bg-white/[0.06]'
                    }`}
                  >
                    <div className="font-bold text-xs">Rodízio Simples</div>
                    <div className="text-[11px] opacity-80 mt-0.5">
                      Distribuição sequencial na equipe
                    </div>
                  </button>
                </div>
              </div>

              {/* Turno */}
              <div>
                <label className="block font-semibold text-neutral-300 mb-1.5">
                  2. Horário do Turno
                </label>
                <select
                  value={selectedShiftTypeId}
                  onChange={e => setSelectedShiftTypeId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#161922] border border-white/[0.08] text-white rounded-xl text-xs font-medium focus:outline-none focus:border-[#00d2d3]/50 cursor-pointer"
                >
                  {shiftTypes.map(st => (
                    <option key={st.id} value={st.id} className="bg-[#12141c] text-white">
                      {st.name} ({st.startTime} às {st.endTime})
                    </option>
                  ))}
                </select>
              </div>

              {/* Departamentos */}
              <div>
                <label className="block font-semibold text-neutral-300 mb-1.5">
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
                            ? 'bg-[#00d2d3]/20 border-[#00d2d3]/40 text-[#00d2d3]'
                            : 'bg-[#161922] border-white/[0.08] text-neutral-400 hover:bg-white/[0.06]'
                        }`}
                      >
                        {dept.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Warning */}
              <div className="p-3 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 flex items-start gap-2 text-xs">
                <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
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
          <div className="p-4 border-t border-white/[0.06] flex items-center justify-end gap-2 shrink-0 bg-[#12141c]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-neutral-400 hover:text-white hover:bg-white/[0.06] rounded-xl font-medium transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleGenerate}
              className="px-5 py-2 bg-[#00d2d3] hover:bg-[#57f1db] text-[#003731] rounded-xl font-bold transition-all shadow-md shadow-[#00d2d3]/20 cursor-pointer active:scale-98"
            >
              Gerar Escala Mensal
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
