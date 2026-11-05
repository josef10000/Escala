import React, { useState } from 'react';
import { X, Copy, Check, Sparkles, ArrowRight, ShieldCheck, AlertCircle } from 'lucide-react';
import { useSchedule } from '../../context/ScheduleContext';
import { MONTH_NAMES_PT } from '../../utils/dateUtils';

interface CloneMonthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CloneMonthModal: React.FC<CloneMonthModalProps> = ({ isOpen, onClose }) => {
  const {
    currentYear,
    currentMonthIndex,
    clonePreviousMonthSchedule,
    providers,
  } = useSchedule();

  const [mode, setMode] = useState<'continue_12x36' | 'exact'>('continue_12x36');
  const [successCount, setSuccessCount] = useState<number | null>(null);

  if (!isOpen) return null;

  // Compute previous month name and year
  let prevMonthIndex = currentMonthIndex - 1;
  let prevYear = currentYear;
  if (prevMonthIndex < 0) {
    prevMonthIndex = 11;
    prevYear--;
  }

  const prevMonthName = MONTH_NAMES_PT[prevMonthIndex];
  const currentMonthName = MONTH_NAMES_PT[currentMonthIndex];

  const handleClone = () => {
    const count = clonePreviousMonthSchedule(currentYear, currentMonthIndex, mode);
    setSuccessCount(count);
    setTimeout(() => {
      setSuccessCount(null);
      onClose();
    }, 1400);
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200 cursor-pointer"
    >
      <div
        onClick={e => e.stopPropagation()}
        className="bg-[#12141A] text-zinc-100 rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-white/[0.08] cursor-default"
      >
        {/* Header */}
        <div className="p-5 border-b border-white/[0.08] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#00d2d3]/15 border border-[#00d2d3]/30 text-[#00d2d3] flex items-center justify-center font-bold shadow-sm">
              <Copy className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                Copiar Escala do Mês Anterior
              </h3>
              <p className="text-xs text-zinc-400 font-medium">
                De <span className="font-bold text-[#00d2d3]">{prevMonthName} {prevYear}</span> para <span className="font-bold text-white">{currentMonthName} {currentYear}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-white rounded-xl hover:bg-white/[0.05] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 text-xs">
          {successCount !== null ? (
            <div className="py-8 text-center space-y-3">
              <div className="w-12 h-12 bg-[#00d2d3]/20 text-[#00d2d3] rounded-full flex items-center justify-center mx-auto text-xl font-bold border border-[#00d2d3]/30">
                <Check className="w-6 h-6" />
              </div>
              <h4 className="text-base font-bold text-white">
                Escala de {currentMonthName} Copiada com Sucesso!
              </h4>
              <p className="text-xs text-zinc-400">
                {successCount} plantões e folgas foram distribuídos para a equipe.
              </p>
            </div>
          ) : (
            <>
              {/* Flow preview banner */}
              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-[#1A1D24] border border-white/[0.08]">
                <div className="text-center flex-1">
                  <div className="text-[11px] uppercase font-bold text-zinc-400">Mês de Origem</div>
                  <div className="text-sm font-bold text-[#00d2d3]">{prevMonthName} {prevYear}</div>
                </div>
                <div className="px-3 text-zinc-500">
                  <ArrowRight className="w-4 h-4 text-zinc-500" />
                </div>
                <div className="text-center flex-1">
                  <div className="text-[11px] uppercase font-bold text-zinc-400">Mês de Destino</div>
                  <div className="text-sm font-bold text-emerald-400">{currentMonthName} {currentYear}</div>
                </div>
              </div>

              {/* Mode Selection */}
              <div className="space-y-2.5">
                <label className="text-xs font-bold text-zinc-300">
                  Escolha o método de cópia:
                </label>

                {/* Option 1: Continuidade 12x36 (Smart) */}
                <div
                  onClick={() => setMode('continue_12x36')}
                  className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                    mode === 'continue_12x36'
                      ? 'bg-[#00d2d3]/10 border-[#00d2d3]/50 shadow-xs'
                      : 'bg-[#1A1D24] border-white/[0.08] hover:bg-[#252830]'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <input
                      type="radio"
                      checked={mode === 'continue_12x36'}
                      onChange={() => setMode('continue_12x36')}
                      className="mt-0.5 accent-[#00d2d3]"
                    />
                    <div className="space-y-1">
                      <div className="font-bold text-white flex items-center gap-1.5">
                        <span>Continuidade Inteligente 12x36</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#00d2d3]/20 text-[#00d2d3] border border-[#00d2d3]/40 font-bold">
                          Recomendado
                        </span>
                      </div>
                      <p className="text-zinc-400 text-xs leading-relaxed">
                        Calcula o descanso de 36h da virada do mês: quem trabalhou no último dia de {prevMonthName} começará folgando no dia 1º de {currentMonthName}, evitando plantões consecutivos.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Option 2: Exact Copy */}
                <div
                  onClick={() => setMode('exact')}
                  className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                    mode === 'exact'
                      ? 'bg-[#00d2d3]/10 border-[#00d2d3]/50 shadow-xs'
                      : 'bg-[#1A1D24] border-white/[0.08] hover:bg-[#252830]'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <input
                      type="radio"
                      checked={mode === 'exact'}
                      onChange={() => setMode('exact')}
                      className="mt-0.5 accent-[#00d2d3]"
                    />
                    <div className="space-y-1">
                      <div className="font-bold text-white">
                        Cópia Exata Dia a Dia (1 para 1)
                      </div>
                      <p className="text-zinc-400 text-xs leading-relaxed">
                        Copia exatamente o que estava no dia 1 para o dia 1, dia 2 para o dia 2, mantendo a mesma matriz numérica.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Notice */}
              <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-2.5 text-amber-300 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
                <span>
                  Qualquer plantão previamente preenchido no mês de <strong>{currentMonthName}</strong> será substituído pela nova escala clonada.
                </span>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        {successCount === null && (
          <div className="p-4 border-t border-white/[0.08] flex items-center justify-end gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-zinc-400 hover:text-white bg-[#1A1D24] hover:bg-[#252830] transition-colors font-semibold cursor-pointer border border-white/[0.08]"
            >
              Cancelar
            </button>
            <button
              onClick={handleClone}
              className="px-5 py-2 rounded-xl bg-[#00d2d3] hover:bg-[#57f1db] text-[#003731] font-bold transition-all shadow-xs flex items-center gap-2 cursor-pointer active:scale-98"
            >
              <Copy className="w-4 h-4" />
              <span>Clonar para {currentMonthName}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
