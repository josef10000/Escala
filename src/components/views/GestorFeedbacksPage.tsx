import React, { useState, useMemo } from 'react';
import { useSchedule } from '../../context/ScheduleContext';
import { TeamFeedback } from '../../types';
import {
  NotebookPen,
  Search,
  Plus,
  Trash2,
  Edit2,
  Calendar,
  User,
  CheckCircle2,
  AlertTriangle,
  MessageSquare,
  Sparkles,
  Filter,
  Lock,
  ChevronRight,
  TrendingUp,
  Tag,
  ShieldAlert,
} from 'lucide-react';
import { formatDateToISO } from '../../utils/dateUtils';

export const GestorFeedbacksPage: React.FC = () => {
  const {
    providers,
    teamFeedbacks,
    addTeamFeedback,
    updateTeamFeedback,
    deleteTeamFeedback,
    isLeaderAuthenticated,
    leaderName,
  } = useSchedule();

  // Filters & State
  const [selectedProviderId, setSelectedProviderId] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form fields
  const [formProviderId, setFormProviderId] = useState<string>(providers[0]?.id || '');
  const [formDate, setFormDate] = useState<string>(formatDateToISO(new Date()));
  const [formType, setFormType] = useState<TeamFeedback['type']>('elogio');
  const [formTitle, setFormTitle] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [formContext, setFormContext] = useState('Plantão FDS Home');

  // Filtered feedbacks
  const filteredFeedbacks = useMemo(() => {
    return teamFeedbacks.filter(f => {
      if (selectedProviderId !== 'all' && f.providerId !== selectedProviderId) return false;
      if (selectedType !== 'all' && f.type !== selectedType) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = f.providerName.toLowerCase().includes(q);
        const matchesTitle = f.title.toLowerCase().includes(q);
        const matchesNotes = f.notes.toLowerCase().includes(q);
        const matchesContext = (f.shiftContext || '').toLowerCase().includes(q);
        return matchesName || matchesTitle || matchesNotes || matchesContext;
      }
      return true;
    });
  }, [teamFeedbacks, selectedProviderId, selectedType, searchQuery]);

  // Statistics
  const stats = useMemo(() => {
    const total = teamFeedbacks.length;
    const elogios = teamFeedbacks.filter(f => f.type === 'elogio').length;
    const atencao = teamFeedbacks.filter(f => f.type === 'atencao').length;
    const alinhamento = teamFeedbacks.filter(f => f.type === 'alinhamento').length;
    return { total, elogios, atencao, alinhamento };
  }, [teamFeedbacks]);

  // If not authenticated as Leader, show security notice
  if (!isLeaderAuthenticated) {
    return (
      <div className="flex-1 flex items-center justify-center p-6 bg-[#090a0f]">
        <div className="max-w-md w-full p-8 rounded-3xl bg-slate-900 border border-slate-800 text-center space-y-4 shadow-2xl">
          <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
            <Lock className="w-7 h-7" />
          </div>
          <h2 className="text-lg font-bold text-white tracking-tight">Área Restrita da Liderança</h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            O Diário de Feedbacks e Registros é de acesso exclusivo para Gestores e Líderes autenticados.
            Por favor, utilize o botão <strong>"Acesso Gestor"</strong> na barra superior para entrar.
          </p>
        </div>
      </div>
    );
  }

  const handleOpenCreate = () => {
    setEditingId(null);
    setFormProviderId(providers[0]?.id || '');
    setFormDate(formatDateToISO(new Date()));
    setFormType('elogio');
    setFormTitle('');
    setFormNotes('');
    setFormContext('Plantão FDS Home');
    setIsCreating(true);
  };

  const handleOpenEdit = (fb: TeamFeedback) => {
    setEditingId(fb.id);
    setFormProviderId(fb.providerId);
    setFormDate(fb.date);
    setFormType(fb.type);
    setFormTitle(fb.title);
    setFormNotes(fb.notes);
    setFormContext(fb.shiftContext || 'Plantão FDS Home');
    setIsCreating(true);
  };

  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || !formNotes.trim()) return;

    const selectedProv = providers.find(p => p.id === formProviderId);
    const provName = selectedProv?.name || 'Colaborador';

    if (editingId) {
      updateTeamFeedback(editingId, {
        providerId: formProviderId,
        providerName: provName,
        date: formDate,
        type: formType,
        title: formTitle.trim(),
        notes: formNotes.trim(),
        shiftContext: formContext.trim(),
      });
    } else {
      addTeamFeedback({
        providerId: formProviderId,
        providerName: provName,
        date: formDate,
        type: formType,
        title: formTitle.trim(),
        notes: formNotes.trim(),
        shiftContext: formContext.trim(),
      });
    }

    setIsCreating(false);
    setEditingId(null);
  };

  const getTypeBadge = (type: TeamFeedback['type']) => {
    switch (type) {
      case 'elogio':
        return {
          label: 'Ponto Forte / Elogio',
          pill: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
          dot: 'bg-emerald-400',
        };
      case 'atencao':
        return {
          label: 'Ponto de Atenção',
          pill: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
          dot: 'bg-amber-400',
        };
      case 'alinhamento':
        return {
          label: 'Alinhamento 1:1',
          pill: 'bg-sky-500/15 text-sky-300 border-sky-500/30',
          dot: 'bg-sky-400',
        };
      case 'anotacao':
        return {
          label: 'Anotação Geral',
          pill: 'bg-slate-500/15 text-slate-300 border-slate-500/30',
          dot: 'bg-slate-400',
        };
    }
  };

  return (
    <div className="flex-1 bg-[#090a0f] text-slate-100 flex flex-col overflow-y-auto">
      {/* Top Banner Header */}
      <div className="border-b border-white/10 bg-slate-900/60 backdrop-blur-xl px-6 py-6 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-300 shadow-sm">
              <NotebookPen className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-xl font-bold text-white tracking-tight">
                  Diário do Gestor & Feedbacks do Atendimento
                </h1>
                <span className="px-2.5 py-0.5 text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 rounded-full font-mono">
                  100% Confidencial
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Espaço exclusivo da liderança para documentar desempenho, elogios, alinhamentos e observações da equipe.
              </p>
            </div>
          </div>

          {/* New Feedback Button */}
          <button
            type="button"
            onClick={handleOpenCreate}
            className="px-4 py-2.5 rounded-2xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center gap-2 cursor-pointer shadow-lg shadow-cyan-500/20 transition-all active:scale-95 shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Novo Registro de Feedback</span>
          </button>
        </div>
      </div>

      <div className="max-w-7xl w-full mx-auto p-6 space-y-6">
        
        {/* KPI Mini-Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-[11px] text-slate-400 uppercase font-medium block">Total Registros</span>
              <span className="text-2xl font-bold text-white font-mono mt-0.5 block">{stats.total}</span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-300">
              <NotebookPen className="w-5 h-5" />
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-[11px] text-emerald-400 uppercase font-medium block">Pontos Fortes</span>
              <span className="text-2xl font-bold text-emerald-300 font-mono mt-0.5 block">{stats.elogios}</span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-[11px] text-amber-400 uppercase font-medium block">Pontos de Atenção</span>
              <span className="text-2xl font-bold text-amber-300 font-mono mt-0.5 block">{stats.atencao}</span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-[11px] text-sky-400 uppercase font-medium block">Alinhamentos 1:1</span>
              <span className="text-2xl font-bold text-sky-300 font-mono mt-0.5 block">{stats.alinhamento}</span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
              <MessageSquare className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Filters Toolbar (iOS Frosted Glass) */}
        <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 shadow-sm">
          
          {/* Search Bar */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Buscar por colaborador, palavra-chave ou contexto (ex: OPA, Full grupo)..."
              className="w-full bg-slate-950/80 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
            />
          </div>

          {/* Filter by Provider Dropdown */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 shrink-0">Colaborador:</span>
            <select
              value={selectedProviderId}
              onChange={e => setSelectedProviderId(e.target.value)}
              className="bg-slate-950/80 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400 font-medium"
            >
              <option value="all">Todos os Colaboradores</option>
              {providers.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          {/* Filter by Type Dropdown */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 shrink-0">Categoria:</span>
            <select
              value={selectedType}
              onChange={e => setSelectedType(e.target.value)}
              className="bg-slate-950/80 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400 font-medium"
            >
              <option value="all">Todas as Categorias</option>
              <option value="elogio">Ponto Forte / Elogio</option>
              <option value="atencao">Ponto de Atenção</option>
              <option value="alinhamento">Alinhamento 1:1</option>
              <option value="anotacao">Anotação Geral</option>
            </select>
          </div>
        </div>

        {/* FEEDBACK CREATION / EDIT PANEL (Inline Card) */}
        {isCreating && (
          <form
            onSubmit={handleSubmitForm}
            className="p-6 rounded-3xl bg-slate-900 border border-cyan-500/40 shadow-2xl space-y-4 animate-in fade-in duration-200"
          >
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <span className="text-sm font-bold text-white flex items-center gap-2">
                <NotebookPen className="w-4 h-4 text-cyan-400" />
                <span>{editingId ? 'Editar Registro de Feedback' : 'Novo Registro de Feedback'}</span>
              </span>
              <button
                type="button"
                onClick={() => setIsCreating(false)}
                className="text-xs text-slate-400 hover:text-white cursor-pointer"
              >
                Cancelar
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Colaborador */}
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-300">Colaborador:</label>
                <select
                  value={formProviderId}
                  onChange={e => setFormProviderId(e.target.value)}
                  className="w-full bg-slate-950/80 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400"
                >
                  {providers.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              {/* Data do Ocorrido */}
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-300">Data:</label>
                <input
                  type="date"
                  value={formDate}
                  onChange={e => setFormDate(e.target.value)}
                  className="w-full bg-slate-950/80 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400"
                />
              </div>

              {/* Categoria */}
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-300">Categoria:</label>
                <select
                  value={formType}
                  onChange={e => setFormType(e.target.value as any)}
                  className="w-full bg-slate-950/80 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400"
                >
                  <option value="elogio">🟢 Ponto Forte / Elogio</option>
                  <option value="atencao">🟡 Ponto de Atenção</option>
                  <option value="alinhamento">🔵 Alinhamento 1:1</option>
                  <option value="anotacao">📝 Anotação Geral</option>
                </select>
              </div>
            </div>

            {/* Contexto / Turno */}
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-300">Contexto / Fila (Opcional):</label>
              <input
                type="text"
                value={formContext}
                onChange={e => setFormContext(e.target.value)}
                placeholder="Ex: Plantão FDS Home, Fila OPA encaixes, Semana Presencial..."
                className="w-full bg-slate-950/80 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400"
              />
            </div>

            {/* Título / Resumo */}
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-300">Título / Assunto:</label>
              <input
                type="text"
                required
                value={formTitle}
                onChange={e => setFormTitle(e.target.value)}
                placeholder="Ex: Ótima proatividade na resolução de encaixes no sábado..."
                className="w-full bg-slate-950/80 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400 font-semibold"
              />
            </div>

            {/* Detalhes do Registro */}
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-300">Observações Detalhadas (Confidencial):</label>
              <textarea
                required
                rows={3}
                value={formNotes}
                onChange={e => setFormNotes(e.target.value)}
                placeholder="Descreva detalhadamente o ocorrido, combinados e apontamentos que você quer guardar..."
                className="w-full bg-slate-950/80 border border-white/10 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-cyan-400 leading-relaxed"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsCreating(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white bg-white/5 border border-white/10 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl text-xs font-bold bg-cyan-500 hover:bg-cyan-400 text-slate-950 cursor-pointer shadow-md shadow-cyan-500/20"
              >
                {editingId ? 'Salvar Alterações' : 'Registrar Feedback'}
              </button>
            </div>
          </form>
        )}

        {/* FEEDBACKS LIST */}
        <div className="space-y-3">
          {filteredFeedbacks.length === 0 ? (
            <div className="p-12 text-center rounded-3xl bg-slate-900/40 border border-slate-800 space-y-3">
              <NotebookPen className="w-8 h-8 text-slate-600 mx-auto" />
              <h3 className="text-sm font-semibold text-white">Nenhum registro encontrado</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Utilize o botão acima para cadastrar observações, pontos fortes ou de atenção sobre os colaboradores.
              </p>
            </div>
          ) : (
            filteredFeedbacks.map(fb => {
              const badge = getTypeBadge(fb.type);
              return (
                <div
                  key={fb.id}
                  className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition-all shadow-sm space-y-3 group"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className="font-bold text-sm text-white flex items-center gap-2">
                        <User className="w-4 h-4 text-cyan-400" />
                        <span>{fb.providerName}</span>
                      </span>

                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${badge.pill}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
                        <span>{badge.label}</span>
                      </span>

                      {fb.shiftContext && (
                        <span className="text-[11px] font-medium text-slate-400 bg-slate-950 px-2 py-0.5 rounded-md border border-slate-800">
                          {fb.shiftContext}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <span className="font-mono text-[11px]">{fb.date.split('-').reverse().join('/')}</span>
                      
                      <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(fb)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer transition-colors"
                          title="Editar registro"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (window.confirm('Deseja excluir este registro de feedback?')) {
                              deleteTeamFeedback(fb.id);
                            }
                          }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 cursor-pointer transition-colors"
                          title="Excluir registro"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-xs font-bold text-slate-200 tracking-tight">
                      {fb.title}
                    </h4>
                    <p className="text-xs text-slate-400 mt-1.5 leading-relaxed whitespace-pre-wrap bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
                      {fb.notes}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>

      </div>
    </div>
  );
};
