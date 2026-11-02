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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white text-slate-800 rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200/90">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-sky-50 border border-sky-200/80 text-sky-700 flex items-center justify-center font-bold shadow-2xs">
              <Copy className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900">
                Copiar Escala do Mês Anterior
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                De <span className="font-bold text-sky-700">{prevMonthName} {prevYear}</span> para <span className="font-bold text-slate-800">{currentMonthName} {currentYear}</span>
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
        <div className="p-5 space-y-4 text-xs">
          {successCount !== null ? (
            <div className="py-8 text-center space-y-3">
              <div className="w-12 h-12 bg-emerald-50 text-emerald-700 rounded-full flex items-center justify-center mx-auto text-xl font-bold border border-emerald-200">
                <Check className="w-6 h-6" />
              </div>
              <h4 className="text-base font-bold text-slate-900">
                Escala de {currentMonthName} Copiada com Sucesso!
              </h4>
              <p className="text-xs text-slate-500">
                {successCount} plantões e folgas foram distribuídos para a equipe.
              </p>
            </div>
          ) : (
            <>
              {/* Flow preview banner */}
              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
                <div className="text-center flex-1">
                  <div className="text-xs uppercase font-bold text-slate-500">Mês de Origem</div>
                  <div className="text-sm font-extrabold text-sky-700">{prevMonthName} {prevYear}</div>
                </div>
                <div className="px-3 text-slate-400">
                  <ArrowRight className="w-4 h-4 text-slate-400" />
                </div>
                <div className="text-center flex-1">
                  <div className="text-xs uppercase font-bold text-slate-500">Mês de Destino</div>
                  <div className="text-sm font-extrabold text-emerald-700">{currentMonthName} {currentYear}</div>
                </div>
              </div>

              {/* Mode Selection */}
              <div className="space-y-2.5">
                <label className="text-xs font-bold text-slate-700">
                  Escolha o método de cópia:
                </label>

                {/* Option 1: Continuidade 12x36 (Smart) */}
                <div
                  onClick={() => setMode('continue_12x36')}
                  className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                    mode === 'continue_12x36'
                      ? 'bg-emerald-50/60 border-emerald-500 shadow-xs ring-1 ring-emerald-200'
                      : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <input
                      type="radio"
                      checked={mode === 'continue_12x36'}
                      onChange={() => setMode('continue_12x36')}
                      className="mt-0.5 text-emerald-600 focus:ring-0"
                    />
                    <div className="space-y-1">
                      <div className="font-bold text-slate-900 flex items-center gap-1.5">
                        <span>Continuidade Inteligente 12x36</span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 font-bold">
                          Recomendado
                        </span>
                      </div>
                      <p className="text-slate-500 text-xs leading-relaxed">
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
                      ? 'bg-emerald-50/60 border-emerald-500 shadow-xs ring-1 ring-emerald-200'
                      : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <input
                      type="radio"
                      checked={mode === 'exact'}
                      onChange={() => setMode('exact')}
                      className="mt-0.5 text-emerald-600 focus:ring-0"
                    />
                    <div className="space-y-1">
                      <div className="font-bold text-slate-900">
                        Cópia Exata Dia a Dia (1 para 1)
                      </div>
                      <p className="text-slate-500 text-xs leading-relaxed">
                        Copia exatamente o que estava no dia 1 para o dia 1, dia 2 para o dia 2, mantendo a mesma matriz numérica.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Notice */}
              <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 flex items-start gap-2.5 text-amber-800 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
                <span>
                  Qualquer plantão previamente preenchido no mês de <strong>{currentMonthName}</strong> será substituído pela nova escala clonada.
                </span>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        {successCount === null && (
          <div className="p-4 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 transition-colors font-semibold cursor-pointer"
            >
              Cancelar
            </button>
            <button
              onClick={handleClone}
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition-all shadow-xs flex items-center gap-2 cursor-pointer active:scale-98"
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
