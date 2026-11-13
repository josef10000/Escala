import React, { useState, useEffect } from 'react';
import { useSchedule } from '../../context/ScheduleContext';
import { X, Copy, Check, Send, Calendar, Clock, User, Plus, Trash2, ShieldCheck, Sparkles, AlertCircle } from 'lucide-react';
import { formatDateToISO } from '../../utils/dateUtils';
import { WhatsAppIcon } from '../../features/prestadores_regional/components/WhatsAppIcon';
import { openWhatsApp, WHATSAPP_TAB_NAME } from '../../features/prestadores_regional/utils/whatsapp';

interface WeekendDutyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface DutyMember {
  id: string;
  name: string;
  hours: string; // e.g. "07h as 19h" or "08h as 16h"
  assignment: string; // e.g. "OPA encaixe/agendamentos" or "Full grupo"
}

interface DayDutyConfig {
  dateStr: string; // "DD/MM" e.g. "07/11"
  isoDate: string; // "YYYY-MM-DD"
  workType: 'Home' | 'Presencial';
  responsibleText: string; // e.g. "Eu :) 07h as 19h - (Responsável)" or "Regiane"
  members: DutyMember[];
}

const COMMON_ASSIGNMENTS = [
  'OPA encaixe/agendamentos',
  'Full grupo',
  'Responsável',
  'Apoio técnico / OS',
  'Monitoramento central',
];

const COMMON_HOURS = [
  '07h as 19h',
  '08h as 16h',
  '07h as 18h',
  '08h as 20h',
  '09h as 18h',
];

export const WeekendDutyModal: React.FC<WeekendDutyModalProps> = ({ isOpen, onClose }) => {
  const {
    providers,
    assignments,
    isLeaderAuthenticated,
    leaderName,
  } = useSchedule();

  const [greeting, setGreeting] = useState('Boa tarde!');
  const [copied, setCopied] = useState(false);
  const [activeDayTab, setActiveDayTab] = useState<0 | 1>(0);

  // Calculate upcoming or current weekend (Saturday & Sunday)
  const [saturdayConfig, setSaturdayConfig] = useState<DayDutyConfig>(() => {
    return {
      dateStr: '07/11',
      isoDate: '2026-11-07',
      workType: 'Home',
      responsibleText: 'Eu :) 07h as 19h - (Responsável)',
      members: [],
    };
  });

  const [sundayConfig, setSundayConfig] = useState<DayDutyConfig>(() => {
    return {
      dateStr: '08/11',
      isoDate: '2026-11-08',
      workType: 'Home',
      responsibleText: 'Regiane',
      members: [],
    };
  });

  // Automatically find upcoming weekend and load assigned people
  useEffect(() => {
    if (!isOpen) return;

    const today = new Date();
    const dayOfWeek = today.getDay(); // 0 is Sunday, 6 is Saturday, 5 is Friday
    
    // Find next Saturday and Sunday
    const satOffset = (6 - dayOfWeek + 7) % 7;
    const satDate = new Date(today);
    satDate.setDate(today.getDate() + (dayOfWeek === 6 ? 0 : satOffset === 0 ? 7 : satOffset));
    
    const sunDate = new Date(satDate);
    sunDate.setDate(satDate.getDate() + 1);

    const satISO = formatDateToISO(satDate);
    const sunISO = formatDateToISO(sunDate);

    const satFormatted = `${String(satDate.getDate()).padStart(2, '0')}/${String(satDate.getMonth() + 1).padStart(2, '0')}`;
    const sunFormatted = `${String(sunDate.getDate()).padStart(2, '0')}/${String(sunDate.getMonth() + 1).padStart(2, '0')}`;

    // Look for providers with shift 'st-t' on Saturday
    const satAssignments = assignments.filter(a => a.date === satISO && a.shiftTypeId === 'st-t');
    const satMembers: DutyMember[] = [];
    satAssignments.forEach(a => {
      const p = providers.find(prov => prov.id === a.providerId);
      if (p) {
        const isRegiane = p.name.toLowerCase().includes('regiane');
        satMembers.push({
          id: p.id,
          name: isRegiane ? 'Regiane Técnica' : p.name.split(' ').slice(0, 2).join(' '),
          hours: isRegiane ? '07h as 19h' : '07h as 19h',
          assignment: isRegiane ? 'OPA encaixe/agendamentos' : 'Full grupo',
        });
      }
    });

    // Look for providers with shift 'st-t' on Sunday
    const sunAssignments = assignments.filter(a => a.date === sunISO && a.shiftTypeId === 'st-t');
    const sunMembers: DutyMember[] = [];
    sunAssignments.forEach(a => {
      const p = providers.find(prov => prov.id === a.providerId);
      if (p) {
        const isRegiane = p.name.toLowerCase().includes('regiane');
        sunMembers.push({
          id: p.id,
          name: isRegiane ? 'Regiane Técnica' : p.name.split(' ').slice(0, 2).join(' '),
          hours: '07h as 19h',
          assignment: isRegiane ? 'OPA encaixe/agendamentos' : 'Full grupo',
        });
      }
    });

    // Default fallback if no assignments generated yet
    const fallbackSat = satMembers.length > 0 ? satMembers : [
      { id: '1', name: 'Regiane Técnica', hours: '07h as 19h', assignment: 'OPA encaixe/agendamentos' },
      { id: '2', name: 'Patricia Vieira', hours: '07h as 19h', assignment: 'Full grupo' },
      { id: '3', name: 'Danilo Rocha Dr Monitora', hours: '08h as 16h', assignment: 'Full grupo' },
    ];

    const fallbackSun = sunMembers.length > 0 ? sunMembers : [
      { id: '1', name: 'Regiane Técnica', hours: '07h as 19h', assignment: 'OPA encaixe/agendamentos' },
      { id: '2', name: 'Patricia Vieira', hours: '07h as 19h', assignment: 'Full grupo' },
    ];

    setSaturdayConfig({
      dateStr: satFormatted,
      isoDate: satISO,
      workType: 'Home',
      responsibleText: leaderName ? `${leaderName} (Eu :) 07h as 19h - (Responsável))` : 'Eu :) 07h as 19h - (Responsável)',
      members: fallbackSat,
    });

    setSundayConfig({
      dateStr: sunFormatted,
      isoDate: sunISO,
      workType: 'Home',
      responsibleText: 'Regiane',
      members: fallbackSun,
    });
  }, [isOpen]);

  if (!isOpen) return null;

  // Build the EXACT WhatsApp message string
  const generateWhatsAppMessage = () => {
    let msg = `${greeting}\n\n`;
    msg += `Plantão Técnica ${saturdayConfig.dateStr} e ${sundayConfig.dateStr}\n\n`;

    // Saturday
    msg += `${saturdayConfig.dateStr} ${saturdayConfig.workType}\n`;
    msg += `Responsável pelo plantão: ${saturdayConfig.responsibleText}\n\n`;
    saturdayConfig.members.forEach(m => {
      msg += `@~${m.name} - ${m.hours} - (${m.assignment})\n`;
    });

    msg += `\n\n`;

    // Sunday
    msg += `${sundayConfig.dateStr} ${sundayConfig.workType}\n`;
    msg += `Responsável pelo plantão: ${sundayConfig.responsibleText}\n\n`;
    sundayConfig.members.forEach(m => {
      msg += `@~${m.name} - ${m.hours} - (${m.assignment})\n`;
    });

    return msg.trim();
  };

  const handleCopyMessage = async () => {
    const text = generateWhatsAppMessage();
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      alert('Não foi possível copiar automaticamente.');
    }
  };

  const handleOpenWhatsApp = () => {
    const text = generateWhatsAppMessage();
    const encoded = encodeURIComponent(text);
    openWhatsApp(`https://web.whatsapp.com/send?text=${encoded}`, WHATSAPP_TAB_NAME);
  };

  // Member CRUD
  const handleAddMember = (isSaturday: boolean) => {
    const newMember: DutyMember = {
      id: `member-${Date.now()}`,
      name: 'Novo Colaborador',
      hours: '07h as 19h',
      assignment: 'Full grupo',
    };
    if (isSaturday) {
      setSaturdayConfig(prev => ({ ...prev, members: [...prev.members, newMember] }));
    } else {
      setSundayConfig(prev => ({ ...prev, members: [...prev.members, newMember] }));
    }
  };

  const handleUpdateMember = (isSaturday: boolean, memberId: string, field: keyof DutyMember, val: string) => {
    if (isSaturday) {
      setSaturdayConfig(prev => ({
        ...prev,
        members: prev.members.map(m => m.id === memberId ? { ...m, [field]: val } : m)
      }));
    } else {
      setSundayConfig(prev => ({
        ...prev,
        members: prev.members.map(m => m.id === memberId ? { ...m, [field]: val } : m)
      }));
    }
  };

  const handleRemoveMember = (isSaturday: boolean, memberId: string) => {
    if (isSaturday) {
      setSaturdayConfig(prev => ({
        ...prev,
        members: prev.members.filter(m => m.id !== memberId)
      }));
    } else {
      setSundayConfig(prev => ({
        ...prev,
        members: prev.members.filter(m => m.id !== memberId)
      }));
    }
  };

  const currentConfig = activeDayTab === 0 ? saturdayConfig : sundayConfig;
  const isSatTab = activeDayTab === 0;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150 cursor-pointer"
    >
      <div
        onClick={e => e.stopPropagation()}
        className="relative w-full max-w-4xl bg-slate-900 border border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] cursor-default"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-300">
              <WhatsAppIcon className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-tight">
                  Confirmação de Plantão Técnica (Fim de Semana)
                </h2>
                <span className="px-2 py-0.5 text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full">
                  Exclusivo Gestor
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Gerencie quem atende cada fila (OPA, Full grupo) e gere o texto padrão para o WhatsApp
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body - 2 Columns on Desktop */}
        <div className="p-6 overflow-y-auto flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* LEFT COLUMN: Controls & Day Config (7 cols) */}
          <div className="lg:col-span-7 space-y-4">
            
            {/* Greeting + Quick Switch */}
            <div className="flex items-center gap-3 bg-white/[0.02] p-3 rounded-2xl border border-white/5">
              <label className="text-xs font-semibold text-slate-300 shrink-0">Saudação:</label>
              <input
                type="text"
                value={greeting}
                onChange={e => setGreeting(e.target.value)}
                className="bg-slate-950/70 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-400 flex-1 font-medium"
                placeholder="Ex: Boa tarde!"
              />
            </div>

            {/* Day Selector Tabs (Saturday vs Sunday) */}
            <div className="flex items-center gap-2 p-1 bg-slate-950 rounded-2xl border border-white/10">
              <button
                type="button"
                onClick={() => setActiveDayTab(0)}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
                  activeDayTab === 0
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>Sábado ({saturdayConfig.dateStr})</span>
                <span className="text-[10px] bg-black/40 px-1.5 py-0.5 rounded-full">{saturdayConfig.members.length}</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveDayTab(1)}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
                  activeDayTab === 1
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>Domingo ({sundayConfig.dateStr})</span>
                <span className="text-[10px] bg-black/40 px-1.5 py-0.5 rounded-full">{sundayConfig.members.length}</span>
              </button>
            </div>

            {/* Active Day Header Settings */}
            <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-300">Data (DD/MM):</label>
                  <input
                    type="text"
                    value={currentConfig.dateStr}
                    onChange={e => {
                      const v = e.target.value;
                      if (isSatTab) setSaturdayConfig(prev => ({ ...prev, dateStr: v }));
                      else setSundayConfig(prev => ({ ...prev, dateStr: v }));
                    }}
                    className="w-full bg-slate-950/70 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-400 font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-300">Modalidade:</label>
                  <select
                    value={currentConfig.workType}
                    onChange={e => {
                      const v = e.target.value as 'Home' | 'Presencial';
                      if (isSatTab) setSaturdayConfig(prev => ({ ...prev, workType: v }));
                      else setSundayConfig(prev => ({ ...prev, workType: v }));
                    }}
                    className="w-full bg-slate-950/70 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-400"
                  >
                    <option value="Home">Home</option>
                    <option value="Presencial">Presencial</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-300">Responsável pelo Plantão:</label>
                <input
                  type="text"
                  value={currentConfig.responsibleText}
                  onChange={e => {
                    const v = e.target.value;
                    if (isSatTab) setSaturdayConfig(prev => ({ ...prev, responsibleText: v }));
                    else setSundayConfig(prev => ({ ...prev, responsibleText: v }));
                  }}
                  className="w-full bg-slate-950/70 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-400 font-medium"
                  placeholder="Ex: Eu :) 07h as 19h - (Responsável) ou Regiane"
                />
              </div>
            </div>

            {/* Members List for the active day */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-300">
                  Colaboradores Escalados no dia ({currentConfig.members.length}):
                </span>
                <button
                  type="button"
                  onClick={() => handleAddMember(isSatTab)}
                  className="px-2.5 py-1 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <Plus className="w-3 h-3" />
                  Adicionar Pessoa
                </button>
              </div>

              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {currentConfig.members.map((member, idx) => (
                  <div
                    key={member.id}
                    className="p-3 rounded-2xl bg-white/[0.02] border border-white/5 space-y-2 hover:border-white/15 transition-all"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 flex-1">
                        <span className="text-xs font-mono text-emerald-400">@~</span>
                        <input
                          type="text"
                          value={member.name}
                          onChange={e => handleUpdateMember(isSatTab, member.id, 'name', e.target.value)}
                          className="flex-1 bg-slate-950/70 border border-white/10 rounded-lg px-2.5 py-1 text-xs text-white font-semibold focus:outline-none focus:border-emerald-400"
                          placeholder="Nome do colaborador"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveMember(isSatTab, member.id)}
                        className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                        title="Remover do plantão"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {/* Horário */}
                      <div className="space-y-1">
                        <span className="text-[10px] text-slate-400">Horário:</span>
                        <input
                          type="text"
                          list="hours-list"
                          value={member.hours}
                          onChange={e => handleUpdateMember(isSatTab, member.id, 'hours', e.target.value)}
                          className="w-full bg-slate-950/70 border border-white/10 rounded-lg px-2 py-1 text-xs text-white font-mono focus:outline-none focus:border-emerald-400"
                          placeholder="07h as 19h"
                        />
                      </div>

                      {/* Atribuição */}
                      <div className="space-y-1">
                        <span className="text-[10px] text-slate-400">Atribuição / Fila:</span>
                        <input
                          type="text"
                          list="assignments-list"
                          value={member.assignment}
                          onChange={e => handleUpdateMember(isSatTab, member.id, 'assignment', e.target.value)}
                          className="w-full bg-slate-950/70 border border-white/10 rounded-lg px-2 py-1 text-xs text-white focus:outline-none focus:border-emerald-400"
                          placeholder="OPA encaixe/agendamentos"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Datalists for quick completion */}
              <datalist id="assignments-list">
                {COMMON_ASSIGNMENTS.map(a => <option key={a} value={a} />)}
              </datalist>
              <datalist id="hours-list">
                {COMMON_HOURS.map(h => <option key={h} value={h} />)}
              </datalist>
            </div>
          </div>

          {/* RIGHT COLUMN: WhatsApp Real-time Preview (5 cols) */}
          <div className="lg:col-span-5 flex flex-col justify-between bg-slate-950/80 border border-white/10 rounded-3xl p-4 shadow-inner">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-3">
                <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <WhatsAppIcon className="w-4 h-4 text-emerald-400" />
                  <span>Prévia WhatsApp (Formato Exato)</span>
                </span>
                <span className="text-[10px] font-mono text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full">
                  Pronto
                </span>
              </div>

              {/* Message Box Styled like WhatsApp bubble */}
              <div className="bg-[#121b22] text-[#e9edef] rounded-2xl p-4 font-mono text-xs leading-relaxed whitespace-pre-wrap border border-emerald-500/20 shadow-md max-h-[380px] overflow-y-auto">
                {generateWhatsAppMessage()}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-4 mt-4 border-t border-white/10 space-y-2">
              <button
                type="button"
                onClick={handleCopyMessage}
                className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md ${
                  copied
                    ? 'bg-emerald-600 text-white'
                    : 'bg-white/10 hover:bg-white/15 text-white border border-white/10'
                }`}
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4 text-slate-400" />}
                <span>{copied ? 'Copiado para a Área de Transferência!' : 'Copiar Texto Pronto'}</span>
              </button>

              <button
                type="button"
                onClick={handleOpenWhatsApp}
                className="w-full py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white transition-all cursor-pointer shadow-lg shadow-emerald-600/20 active:scale-98"
              >
                <WhatsAppIcon className="w-4 h-4" />
                <span>Abrir WhatsApp Web com Mensagem</span>
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
