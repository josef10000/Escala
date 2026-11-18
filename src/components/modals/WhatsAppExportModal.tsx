import React, { useState } from 'react';
import {
  X,
  Copy,
  Check,
  Share2,
  Link,
  ShieldCheck,
  Send,
  Calendar,
  Users
} from 'lucide-react';
import { useSchedule } from '../../context/ScheduleContext';
import { MONTH_NAMES_PT, DAYS_SHORT_PT, getMonthDaysArray } from '../../utils/dateUtils';

interface WhatsAppExportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const WhatsAppExportModal: React.FC<WhatsAppExportModalProps> = ({ isOpen, onClose }) => {
  const {
    currentYear,
    currentMonthIndex,
    providers,
    assignments,
    departments,
    activeRegime,
  } = useSchedule();

  const [exportType, setExportType] = useState<'link_invite' | 'month_summary' | 'day_schedule'>('link_invite');
  const [selectedDayNumber, setSelectedDayNumber] = useState<number>(() => {
    const today = new Date();
    return today.getDate();
  });
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedText, setCopiedText] = useState(false);

  if (!isOpen) return null;

  const monthName = MONTH_NAMES_PT[currentMonthIndex];
  const daysInMonth = getMonthDaysArray(currentYear, currentMonthIndex);
  const deptName = departments[0]?.name || 'Equipe Técnica';
  const regimeProviders = providers.filter(p => (p.regime || '12x36') === activeRegime);

  // Get current app URL
  const appUrl = typeof window !== 'undefined' ? window.location.href.split('#')[0] : '';

  // Generate Message based on tab
  const generateMessage = (): string => {
    if (exportType === 'link_invite') {
      let msg = `📅 *ESCALA TÉCNICA (${activeRegime.toUpperCase()}) - ${monthName.toUpperCase()} / ${currentYear}*\n`;
      msg += `🏢 *Setor:* ${deptName}\n`;
      msg += `👥 *Equipe:* ${regimeProviders.length} colaboradores cadastrados\n`;
      msg += `─────────────────────────\n\n`;
      msg += `Olá equipe! A escala técnica de *${monthName} / ${currentYear}* já está disponível para consulta online.\n\n`;
      msg += `🔗 *Acesse seu calendário e plantões pelo link:* \n${appUrl}\n\n`;
      msg += `📌 *Instruções para o time:*\n`;
      msg += `• Acesse o link acima pelo celular ou computador.\n`;
      msg += `• Clique no seu nome para ver seu calendário pessoal do mês.\n`;
      msg += `• Você pode consultar dias de trabalho (*T*), folgas (*D*) e solicitar trocas.\n\n`;
      msg += `─────────────────────────\n`;
      msg += `☁️ _Escala sincronizada em tempo real na nuvem_`;
      return msg;
    }

    if (exportType === 'month_summary') {
      let msg = `🏥 *ESCALA TÉCNICA (${activeRegime.toUpperCase()}) - ${monthName.toUpperCase()} / ${currentYear}*\n`;
      msg += `📋 *Setor:* ${deptName}\n`;
      msg += `👥 *Total de Colaboradores:* ${regimeProviders.length}\n`;
      msg += `🔗 *Acesso Online:* ${appUrl}\n`;
      msg += `─────────────────────────\n\n`;

      if (regimeProviders.length === 0) {
        msg += `_Nenhum colaborador cadastrado na escala ${activeRegime}_\n\n`;
      } else {
        regimeProviders.forEach(prov => {
          const provShifts = assignments.filter(a => {
            const [y, m] = a.date.split('-').map(Number);
            return (
              y === currentYear &&
              m === currentMonthIndex + 1 &&
              a.providerId === prov.id &&
              a.shiftTypeId === 'st-t'
            );
          });

          const workingDaysFormatted = provShifts
            .map(a => {
              const dayNum = Number(a.date.split('-')[2]);
              const isHo = a.workModality === 'home_office';
              return `${String(dayNum).padStart(2, '0')}${isHo ? '(HO)' : ''}`;
            })
            .sort();

          const hoursPerShift = activeRegime === '5x2' ? 8 : 12;
          const totalHours = provShifts.length * hoursPerShift;

          msg += `👤 *${prov.name}* (${prov.role || 'Colaborador'}):\n`;
          msg += `   Plantões (${provShifts.length} = ${totalHours}h): ${workingDaysFormatted.join(', ') || 'Nenhum'}\n\n`;
        });
      }

      msg += `─────────────────────────\n`;
      msg += `✨ _EscalaPro - Gestão Humanizada de Escalas_`;
      return msg;
    }

    // day_schedule
    const targetDateObj = daysInMonth.find(d => d.dayNumber === selectedDayNumber);
    const dateStr = targetDateObj ? targetDateObj.dateStr : `${currentYear}-${String(currentMonthIndex + 1).padStart(2, '0')}-${String(selectedDayNumber).padStart(2, '0')}`;
    const formattedDateStr = formatFriendlyDateLocal(dateStr);

    const dayShifts = assignments.filter(a => a.date === dateStr && a.shiftTypeId === 'st-t');
    const dayWorkers = regimeProviders.filter(prov => dayShifts.some(a => a.providerId === prov.id));

    let msg = `📅 *PLANTÃO DO DIA ${formattedDateStr.toUpperCase()}*\n`;
    msg += `🏥 *Setor:* ${deptName} (${activeRegime})\n`;
    msg += `─────────────────────────\n\n`;

    if (dayWorkers.length === 0) {
      msg += `_Nenhum colaborador escalado para trabalhar neste dia._\n\n`;
    } else {
      msg += `👨‍⚕️ *Plantonistas em Escala (${dayWorkers.length}):*\n`;
      dayWorkers.forEach(w => {
        const shift = dayShifts.find(a => a.providerId === w.id);
        const isHo = shift?.workModality === 'home_office';
        msg += `• *${w.name}* (${w.entryTime || '07h00'} às ${w.exitTime || '19h00'}) ${isHo ? '🏠 [Home Office]' : '🏢 [Presencial]'}\n`;
      });
    }

    msg += `\n─────────────────────────\n`;
    msg += `🔗 *Consulte a escala completa:* ${appUrl}`;
    return msg;
  };

  const formatFriendlyDateLocal = (dateStr: string) => {
    try {
      const [y, m, d] = dateStr.split('-').map(Number);
      const dateObj = new Date(y, m - 1, d);
      return dateObj.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' });
    } catch {
      return dateStr;
    }
  };

  const messageText = generateMessage();

  const handleCopyLink = () => {
    navigator.clipboard.writeText(appUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleCopyMessage = () => {
    navigator.clipboard.writeText(messageText);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  };

  const handleSendWhatsApp = () => {
    const encoded = encodeURIComponent(messageText);
    window.open(`https://api.whatsapp.com/send?text=${encoded}`, '_blank');
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-100 cursor-pointer"
    >
      <div
        onClick={e => e.stopPropagation()}
        className="bg-[#0e1017] text-[#e3e1e9] rounded-3xl border border-white/[0.09] shadow-2xl max-w-2xl w-full flex flex-col max-h-[90vh] overflow-hidden cursor-default"
      >
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/[0.08] bg-[#12141c] p-5 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#00d2d3]/15 text-[#00d2d3] border border-[#00d2d3]/30 flex items-center justify-center shadow-xs">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white flex items-center gap-2">
                <span>Compartilhar Escala com a Equipe</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#00d2d3]/15 text-[#00d2d3] border border-[#00d2d3]/30 uppercase font-bold font-mono">
                  {activeRegime}
                </span>
              </h3>
              <p className="text-xs text-zinc-400 font-medium">
                Envie o link de acesso direto ou a mensagem formatada para o WhatsApp da equipe
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-white rounded-xl hover:bg-white/[0.06] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Area */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1 text-xs">
          
          {/* Quick Direct Link Card */}
          <div className="bg-[#141720] border border-white/[0.08] rounded-2xl p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
                <Link className="w-3.5 h-3.5 text-[#00d2d3]" />
                <span>Link Direto da Aplicação (Para envio à equipe):</span>
              </label>
              <span className="text-[10px] text-[#00d2d3] font-semibold flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Salvo e protegido na nuvem</span>
              </span>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={appUrl}
                className="w-full px-3 py-2 text-xs bg-[#090A0F] border border-white/[0.08] rounded-xl text-zinc-200 font-mono select-all focus:outline-none"
              />
              <button
                type="button"
                onClick={handleCopyLink}
                className="px-3.5 py-2 bg-[#090A0F] hover:bg-white/[0.06] active:scale-95 text-zinc-200 rounded-xl text-xs font-bold transition-all border border-white/[0.08] flex items-center gap-1.5 shrink-0 cursor-pointer"
              >
                {copiedLink ? <Check className="w-3.5 h-3.5 text-[#00d2d3]" /> : <Copy className="w-3.5 h-3.5 text-zinc-400" />}
                <span>{copiedLink ? 'Copiado!' : 'Copiar Link'}</span>
              </button>
            </div>
          </div>

          {/* Model Selection Tabs */}
          <div>
            <label className="block text-xs font-bold text-zinc-300 mb-1.5 uppercase tracking-wider">
              Escolha o formato da mensagem:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setExportType('link_invite')}
                className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                  exportType === 'link_invite'
                    ? 'border-[#00d2d3]/50 bg-[#00d2d3]/12 shadow-xs'
                    : 'border-white/[0.08] bg-[#141720] hover:bg-white/[0.05] text-zinc-400'
                }`}
              >
                <div className="font-bold text-xs text-white flex items-center gap-1.5">
                  <Link className="w-3.5 h-3.5 text-[#00d2d3]" />
                  <span>Link de Consulta</span>
                </div>
                <p className="text-[11px] text-zinc-400 mt-0.5">
                  Convite com o link direto para a equipe abrir pelo celular.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setExportType('month_summary')}
                className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                  exportType === 'month_summary'
                    ? 'border-[#00d2d3]/50 bg-[#00d2d3]/12 shadow-xs'
                    : 'border-white/[0.08] bg-[#141720] hover:bg-white/[0.05] text-zinc-400'
                }`}
              >
                <div className="font-bold text-xs text-white flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-[#00d2d3]" />
                  <span>Resumo Mensal</span>
                </div>
                <p className="text-[11px] text-zinc-400 mt-0.5">
                  Lista com todos os plantões de cada colaborador do mês.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setExportType('day_schedule')}
                className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                  exportType === 'day_schedule'
                    ? 'border-[#00d2d3]/50 bg-[#00d2d3]/12 shadow-xs'
                    : 'border-white/[0.08] bg-[#141720] hover:bg-white/[0.05] text-zinc-400'
                }`}
              >
                <div className="font-bold text-xs text-white flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-[#00d2d3]" />
                  <span>Plantão de 1 Dia</span>
                </div>
                <p className="text-[11px] text-zinc-400 mt-0.5">
                  Quem está em plantão presencial, HO e folgas em um dia específico.
                </p>
              </button>
            </div>
          </div>

          {/* If Day Schedule is selected, pick day */}
          {exportType === 'day_schedule' && (
            <div className="p-3 bg-[#141720] border border-white/[0.08] rounded-2xl flex items-center justify-between gap-3">
              <span className="text-xs font-bold text-zinc-300">Selecione o dia para exportar:</span>
              <select
                value={selectedDayNumber}
                onChange={e => setSelectedDayNumber(Number(e.target.value))}
                className="bg-[#090A0F] border border-white/[0.08] rounded-xl px-3 py-1.5 text-xs text-zinc-200 font-bold focus:outline-none cursor-pointer"
              >
                {daysInMonth.map(d => (
                  <option key={d.dayNumber} value={d.dayNumber}>
                    Dia {String(d.dayNumber).padStart(2, '0')} ({DAYS_SHORT_PT[d.dayOfWeek]})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Textarea Preview */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-zinc-300">
                Pré-visualização da Mensagem Formatada:
              </label>
              <button
                type="button"
                onClick={handleCopyMessage}
                className="text-xs text-[#00d2d3] hover:text-[#57f1db] font-bold flex items-center gap-1 hover:underline cursor-pointer"
              >
                {copiedText ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedText ? 'Texto copiado!' : 'Copiar texto'}</span>
              </button>
            </div>

            <textarea
              readOnly
              rows={9}
              value={messageText}
              className="w-full p-3 bg-[#090A0F] border border-white/[0.08] rounded-2xl text-xs text-zinc-200 leading-relaxed font-sans select-all focus:outline-none"
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-white/[0.08] flex items-center justify-between bg-[#12141c] shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-zinc-400 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] rounded-xl cursor-pointer"
          >
            Fechar
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyMessage}
              className="px-4 py-2 bg-[#141720] hover:bg-white/[0.08] active:scale-95 text-zinc-200 rounded-xl text-xs font-bold transition-all border border-white/[0.08] flex items-center gap-1.5 cursor-pointer"
            >
              {copiedText ? <Check className="w-3.5 h-3.5 text-[#00d2d3]" /> : <Copy className="w-3.5 h-3.5 text-zinc-400" />}
              <span>{copiedText ? 'Copiado!' : 'Copiar Mensagem'}</span>
            </button>

            <button
              type="button"
              onClick={handleSendWhatsApp}
              className="px-5 py-2 bg-[#00d2d3] hover:bg-[#57f1db] active:scale-95 text-[#003731] rounded-xl text-xs font-bold shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Abrir no WhatsApp</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
