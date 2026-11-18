import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  AgendaRegiaoItem,
  Prestador,
  TechnicianQualitativeCriteria,
  TechnicianQualitativeEvaluation,
} from '../types';
import {
  Copy,
  Check,
  Edit2,
  Trash2,
  Phone,
  Star,
  ChevronDown,
  MessageSquare,
  RotateCw,
  ArrowLeft,
  Lock,
  Sparkles,
  Save,
  CalendarDays,
  BarChart3,
  ClipboardCheck,
} from 'lucide-react';
import { normalizeText } from '../utils/search';
import { WhatsAppIcon } from './WhatsAppIcon';
import { getWhatsAppUrl, cleanPhoneNumber, openWhatsApp, WHATSAPP_TAB_NAME } from '../utils/whatsapp';
import { useSchedule } from '../../../context/ScheduleContext';
import { DailyAgendaEntry, EncaixeRecord, OcorrenciaRecord } from '../../central_inteligencia/types';
import { computeTechnicianMetrics, TODAY_ISO } from '../../central_inteligencia/data/mockCentralData';
import {
  computeTechnicianScore,
  findRegionalAgendaForPrestador,
  getEvaluationForPrestador,
  getGradeVisualTokens,
  saveTechnicianEvaluation,
} from '../utils/scoring';
import { getStoredAgendas } from '../utils/storage';

export function getInitials(name: string) {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return (name.slice(0, 2) || 'PR').toUpperCase();
}

// Apple iOS Glassmorphic Region Tokens
const getRegionStyle = (region: string) => {
  const norm = normalizeText(region);
  if (norm.startsWith('leste')) {
    return {
      badge: 'bg-emerald-500/10 text-emerald-300 border-emerald-400/20 shadow-[0_0_12px_rgba(16,185,129,0.15)]',
      dot: 'bg-emerald-400',
      avatarRing: 'ring-emerald-500/30 text-emerald-300 bg-emerald-500/10',
      glow: 'from-emerald-500/[0.07]',
    };
  }
  if (norm.startsWith('oeste')) {
    return {
      badge: 'bg-amber-500/10 text-amber-300 border-amber-400/20 shadow-[0_0_12px_rgba(245,158,11,0.15)]',
      dot: 'bg-amber-400',
      avatarRing: 'ring-amber-500/30 text-amber-300 bg-amber-500/10',
      glow: 'from-amber-500/[0.07]',
    };
  }
  if (norm.startsWith('norte')) {
    return {
      badge: 'bg-sky-500/10 text-sky-300 border-sky-400/20 shadow-[0_0_12px_rgba(14,165,233,0.15)]',
      dot: 'bg-sky-400',
      avatarRing: 'ring-sky-500/30 text-sky-300 bg-sky-500/10',
      glow: 'from-sky-500/[0.07]',
    };
  }
  if (norm.startsWith('sul')) {
    return {
      badge: 'bg-purple-500/10 text-purple-300 border-purple-400/20 shadow-[0_0_12px_rgba(168,85,247,0.15)]',
      dot: 'bg-purple-400',
      avatarRing: 'ring-purple-500/30 text-purple-300 bg-purple-500/10',
      glow: 'from-purple-500/[0.07]',
    };
  }
  if (norm.startsWith('abc')) {
    return {
      badge: 'bg-rose-500/10 text-rose-300 border-rose-400/20 shadow-[0_0_12px_rgba(244,63,94,0.15)]',
      dot: 'bg-rose-400',
      avatarRing: 'ring-rose-500/30 text-rose-300 bg-rose-500/10',
      glow: 'from-rose-500/[0.07]',
    };
  }
  return {
    badge: 'bg-cyan-500/10 text-cyan-300 border-cyan-400/20 shadow-[0_0_12px_rgba(6,182,212,0.15)]',
    dot: 'bg-cyan-400',
    avatarRing: 'ring-cyan-500/30 text-cyan-300 bg-cyan-500/10',
    glow: 'from-cyan-500/[0.07]',
  };
};

export interface PrestadorCardProps {
  prestador: Prestador;
  onEdit: (p: Prestador) => void;
  onDelete: (id: string) => void;
  onCopySuccess: (text: string) => void;
  isFavorite: boolean;
  onToggleFavorite: (id: string) => void;
  density?: 'spacious' | 'compact';
  onRecordRecent?: (p: Prestador) => void;
  encaixes?: EncaixeRecord[];
  dailyAgendas?: DailyAgendaEntry[];
  agendas?: AgendaRegiaoItem[];
  ocorrencias?: OcorrenciaRecord[];
  evaluation?: TechnicianQualitativeEvaluation;
  onEvaluationChange?: (next: TechnicianQualitativeEvaluation) => void;
  initialFlipped?: boolean;
  onOpen3DModal?: (p: Prestador) => void;
}

const AGENDA_STATUS_META: Record<
  DailyAgendaEntry['status'],
  { label: string; tone: string }
> = {
  normal: { label: 'Normal', tone: 'text-emerald-300 bg-emerald-500/10 border-emerald-400/20' },
  mudanca: { label: 'Mudança hoje', tone: 'text-cyan-300 bg-cyan-500/10 border-cyan-400/25' },
  reduzida: { label: 'Reduzida', tone: 'text-amber-300 bg-amber-500/10 border-amber-400/25' },
  fechada: { label: 'Agenda fechada', tone: 'text-rose-300 bg-rose-500/10 border-rose-400/25' },
  sem_servico: { label: 'Sem serviço', tone: 'text-slate-300 bg-white/[0.06] border-white/15' },
};

export const PrestadorCard: React.FC<PrestadorCardProps> = ({
  prestador: p,
  onEdit,
  onDelete,
  onCopySuccess,
  isFavorite,
  onToggleFavorite,
  density = 'spacious',
  onRecordRecent,
  encaixes = [],
  dailyAgendas = [],
  agendas,
  ocorrencias = [],
  evaluation,
  onEvaluationChange,
  initialFlipped = false,
  onOpen3DModal,
}) => {
  const { isLeaderAuthenticated, authenticatedProviderId, activeProviderId, leaderName } = useSchedule();
  const loggedInProvId = authenticatedProviderId || activeProviderId;
  const canManagePrestador = isLeaderAuthenticated || (loggedInProvId ? p.id === loggedInProvId : false);

  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isQuickMsgOpen, setIsQuickMsgOpen] = useState(false);
  const [showMetricsDetails, setShowMetricsDetails] = useState(false);
  const [isFlipped, setIsFlipped] = useState(initialFlipped);
  const [backTab, setBackTab] = useState<'resumo' | 'avaliar'>('resumo');
  const [hoverCriterion, setHoverCriterion] = useState<{ key: string; stars: number } | null>(null);
  const [savedFlag, setSavedFlag] = useState(false);
  const quickMsgRef = useRef<HTMLDivElement>(null);

  const initials = getInitials(p.nome);
  const regStyle = getRegionStyle(p.regiao);

  const resolvedAgendas = useMemo(
    () => agendas ?? getStoredAgendas(),
    [agendas]
  );

  const regionalAgenda = useMemo(
    () => findRegionalAgendaForPrestador(p.regiao, resolvedAgendas),
    [p.regiao, resolvedAgendas]
  );

  const todayAgenda = useMemo(
    () =>
      dailyAgendas.find(
        (a) =>
          a.date === TODAY_ISO &&
          (a.technicianId === p.id || a.technicianName.toUpperCase() === p.nome.toUpperCase())
      ),
    [dailyAgendas, p.id, p.nome]
  );

  const metrics = useMemo(
    () => computeTechnicianMetrics(p, encaixes, todayAgenda),
    [p, encaixes, todayAgenda]
  );

  const currentEvaluation = useMemo(
    () => evaluation ?? getEvaluationForPrestador(p),
    [evaluation, p]
  );

  const [notaDraft, setNotaDraft] = useState<string>(currentEvaluation.notaGestor || '');

  useEffect(() => {
    setNotaDraft(currentEvaluation.notaGestor || '');
  }, [currentEvaluation.notaGestor, p.id]);

  const scoreBreakdown = useMemo(
    () => computeTechnicianScore(p, metrics, ocorrencias, currentEvaluation),
    [p, metrics, ocorrencias, currentEvaluation]
  );

  const avgStars = useMemo(() => {
    const sum = scoreBreakdown.qualitativeItems.reduce((acc, item) => acc + item.score, 0);
    return (sum / scoreBreakdown.qualitativeItems.length).toFixed(1);
  }, [scoreBreakdown.qualitativeItems]);

  const gradeTokens = useMemo(
    () => getGradeVisualTokens(scoreBreakdown.grade),
    [scoreBreakdown.grade]
  );

  // Close quick message dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (quickMsgRef.current && !quickMsgRef.current.contains(e.target as Node)) {
        setIsQuickMsgOpen(false);
      }
    };
    if (isQuickMsgOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isQuickMsgOpen]);

  const triggerSavedFeedback = () => {
    setSavedFlag(true);
    setTimeout(() => setSavedFlag(false), 1800);
  };

  const handleRateCriterion = (key: keyof TechnicianQualitativeCriteria, value: number) => {
    if (!isLeaderAuthenticated) return;
    const nextEval: TechnicianQualitativeEvaluation = {
      ...currentEvaluation,
      prestadorId: p.id,
      [key]: value,
      notaGestor: notaDraft,
      updatedBy: leaderName || 'Gestor',
      updatedAt: new Date().toISOString(),
      isCustom: true,
    };
    saveTechnicianEvaluation(nextEval);
    onEvaluationChange?.(nextEval);
    triggerSavedFeedback();
  };

  const handleSaveNotaGestor = () => {
    if (!isLeaderAuthenticated) return;
    const trimmed = notaDraft.trim();
    if (trimmed === (currentEvaluation.notaGestor || '').trim() && currentEvaluation.isCustom) {
      return;
    }
    const nextEval: TechnicianQualitativeEvaluation = {
      ...currentEvaluation,
      prestadorId: p.id,
      notaGestor: trimmed,
      updatedBy: leaderName || 'Gestor',
      updatedAt: new Date().toISOString(),
      isCustom: true,
    };
    saveTechnicianEvaluation(nextEval);
    onEvaluationChange?.(nextEval);
    triggerSavedFeedback();
    onCopySuccess(`Avaliação de ${p.nome} salva!`);
  };

  const handleCopyCard = async (e: React.MouseEvent) => {
    e.stopPropagation();
    onRecordRecent?.(p);
    const textToCopy = `PRESTADOR: ${p.nome}
CÓDIGO: #${p.codigo}
REGIÃO: ${p.regiao}
TELEFONE: ${p.telefone || 'Não informado'}
NOTA OPERACIONAL: ${scoreBreakdown.grade} (${scoreBreakdown.totalScore}/100)
${p.observacao ? `OBS: ${p.observacao}` : ''}`.trim();

    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopiedId(`card-${p.id}`);
      onCopySuccess('Dados do prestador copiados!');
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      onCopySuccess('Não foi possível copiar automaticamente.');
    }
  };

  const handleCopyPhone = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!p.telefone) return;
    onRecordRecent?.(p);

    try {
      await navigator.clipboard.writeText(p.telefone);
      setCopiedId(`phone-${p.id}`);
      onCopySuccess(`Telefone de ${p.nome} copiado!`);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      onCopySuccess('Erro ao copiar telefone.');
    }
  };

  const handleOpenWhatsApp = (customMessage?: string) => {
    if (!p.telefone) return;
    onRecordRecent?.(p);

    const message = customMessage || `Olá ${p.nome} (${p.codigo}), contato da central dr.monitora®. Tudo bem?`;
    const url = getWhatsAppUrl(p.telefone, message);
    openWhatsApp(url, WHATSAPP_TAB_NAME);
    setIsQuickMsgOpen(false);
  };

  const QUICK_MESSAGES = [
    {
      title: 'Padrão Central',
      desc: 'Saudação oficial dr.monitora®',
      msg: `Olá ${p.nome} (${p.codigo}), contato da central dr.monitora®. Tudo bem?`,
    },
    {
      title: 'Disponibilidade de Encaixe',
      desc: 'Pergunta rápida de apoio na região',
      msg: `Olá ${p.nome}! Você teria disponibilidade para um encaixe na região de ${p.regiao} hoje?`,
    },
    {
      title: 'Confirmação de Plantão',
      desc: 'Confirmação da escala oficial',
      msg: `Olá ${p.nome}, tudo bem? Confirmando seu plantão conforme a escala oficial da equipe.`,
    },
    {
      title: 'Abertura de Demanda / OS',
      desc: 'Chamado urgente para atendimento',
      msg: `Olá ${p.nome}, temos uma OS aberta para atendimento presencial na base ${p.regiao}. Pode assumir?`,
    },
  ];

  // -------------------------------------------------------------
  // COMPACT VIEW (Apple Liquid Glass Pill + Grade Crest 3D Launcher)
  // -------------------------------------------------------------
  if (density === 'compact') {
    return (
      <div
        onClick={() => onOpen3DModal?.(p)}
        className={`relative rounded-2xl p-3 flex items-center justify-between gap-2.5 group transition-all duration-300
          bg-gradient-to-b from-white/[0.08] to-white/[0.02]
          hover:from-white/[0.12] hover:to-white/[0.04]
          backdrop-blur-2xl
          border border-white/[0.10] ${gradeTokens.borderAccent}
          shadow-[0_8px_32px_0_rgba(0,0,0,0.37)]
          hover:shadow-[0_12px_40px_0_rgba(0,0,0,0.5)] ${onOpen3DModal ? 'cursor-pointer' : ''}`}
      >
        <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/30 to-transparent pointer-events-none rounded-t-2xl" />

        <div className="flex items-center gap-2.5 min-w-0 relative z-10 flex-1">
          <div className={`w-8 h-8 rounded-full ring-1 flex items-center justify-center font-bold font-mono text-xs shrink-0 backdrop-blur-md ${regStyle.avatarRing}`}>
            {initials}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-mono text-[11px] font-semibold text-white/70 bg-white/[0.06] px-1.5 py-0.5 rounded-full border border-white/10">
                #{p.codigo}
              </span>
              <span className="text-xs font-semibold text-white truncate drop-shadow-sm">{p.nome}</span>
              <span className={`text-[10px] font-medium font-mono uppercase px-2 py-0.5 rounded-full border backdrop-blur-md ${regStyle.badge}`}>
                {p.regiao}
              </span>
            </div>

            <div className="flex items-center gap-2.5 flex-wrap mt-0.5 text-[11px] font-mono tabular-nums">
              {p.telefone && (
                <span className="text-white/60 flex items-center gap-1">
                  <Phone className="w-3 h-3 text-white/40" />
                  <span>{p.telefone}</span>
                </span>
              )}
              {metrics.finalizedCount > 0 ? (
                <span className="text-cyan-300/90">
                  {metrics.acceptanceRate}% aceite · {metrics.avgResponseMinutes !== null ? `${metrics.avgResponseMinutes}m` : '—'} · est. {metrics.estimatedAcceptProbability !== null ? `~${metrics.estimatedAcceptProbability}%` : 'insuf.'}
                </span>
              ) : regionalAgenda ? (
                <span className="text-white/55 font-sans">
                  {regionalAgenda.diasAtendimento}
                </span>
              ) : null}
              {todayAgenda && todayAgenda.status !== 'normal' && (
                <span className={`text-[10px] px-1.5 py-0.2 rounded-md border ${AGENDA_STATUS_META[todayAgenda.status].tone}`}>
                  {AGENDA_STATUS_META[todayAgenda.status].label}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1 relative z-10 shrink-0" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            onClick={() => onOpen3DModal?.(p)}
            title={`Nota ${scoreBreakdown.grade} (${scoreBreakdown.totalScore}/100) · Abrir cartão 3D`}
            className={`inline-flex items-center gap-1 px-2 py-1 rounded-xl bg-gradient-to-br border font-mono text-[11px] font-black transition-all hover:scale-105 cursor-pointer mr-0.5 ${gradeTokens.crest}`}
          >
            <span>{scoreBreakdown.grade}</span>
            <span className="text-[10px] opacity-80 font-semibold">{scoreBreakdown.totalScore}</span>
          </button>

          <button
            type="button"
            onClick={() => onToggleFavorite(p.id)}
            title={isFavorite ? 'Remover dos favoritos' : 'Favoritar prestador'}
            className={`p-1.5 rounded-xl transition-all cursor-pointer ${
              isFavorite
                ? 'text-amber-400 bg-amber-400/15 border border-amber-400/30'
                : 'text-white/40 hover:text-amber-300 hover:bg-white/[0.08]'
            }`}
          >
            <Star className={`w-3.5 h-3.5 ${isFavorite ? 'fill-amber-400' : ''}`} />
          </button>

          <button
            type="button"
            onClick={handleCopyCard}
            title="Copiar dados"
            className="p-1.5 rounded-xl text-white/50 hover:text-white hover:bg-white/[0.08] transition-all cursor-pointer"
          >
            {copiedId === `card-${p.id}` ? (
              <Check className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <Copy className="w-3.5 h-3.5" />
            )}
          </button>

          {p.telefone && cleanPhoneNumber(p.telefone) && (
            <button
              type="button"
              onClick={() => handleOpenWhatsApp()}
              title="Abrir WhatsApp"
              className="p-1.5 rounded-xl text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 transition-all cursor-pointer"
            >
              <WhatsAppIcon className="w-3.5 h-3.5" />
            </button>
          )}

          {canManagePrestador && (
            <>
              <button
                type="button"
                onClick={() => {
                  onRecordRecent?.(p);
                  onEdit(p);
                }}
                title="Editar prestador"
                className="p-1.5 rounded-xl text-white/50 hover:text-white hover:bg-white/[0.08] transition-all cursor-pointer"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={() => onDelete(p.id)}
                title="Excluir prestador"
                className="p-1.5 rounded-xl text-white/50 hover:text-rose-400 hover:bg-rose-500/15 transition-all cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </>
          )}
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // SPACIOUS VIEW (True 3D Flip Card · Balanced Front + Compact Tabbed Back)
  // -------------------------------------------------------------
  return (
    <div className="card-3d-stage relative group/card">
      <div className={`card-3d-rotator ${isFlipped ? 'is-flipped' : ''}`}>
        {/* ===================================================== */}
        {/* FRONT FACE                                            */}
        {/* ===================================================== */}
        <div
          onClick={() => {
            setIsQuickMsgOpen(false);
            setIsFlipped(true);
          }}
          className={`card-3d-face card-3d-face-front relative rounded-3xl p-4 sm:p-5 flex flex-col justify-between transition-shadow duration-300
            bg-gradient-to-b from-white/[0.07] via-white/[0.03] to-[#0c0e14]/95
            hover:from-white/[0.11] hover:via-white/[0.05] hover:to-[#0f1118]/98
            backdrop-blur-2xl
            border border-white/[0.12] ${gradeTokens.borderAccent}
            shadow-[0_12px_40px_0_rgba(0,0,0,0.45)]
            hover:shadow-[0_22px_54px_0_rgba(0,0,0,0.68)]
            ${isFlipped ? 'pointer-events-none select-none' : 'cursor-pointer'}`}
        >
          {/* Clipped background effects & return glare sweep */}
          <div className="absolute inset-0 rounded-3xl overflow-hidden pointer-events-none">
            <div className="card-3d-glare card-3d-glare-return" />
            <div className="absolute inset-x-0 top-0 h-[1.5px] bg-gradient-to-r from-transparent via-white/40 to-transparent" />
            <div
              className={`absolute -top-16 -right-16 w-44 h-44 rounded-full bg-gradient-to-br ${regStyle.glow} to-transparent blur-3xl opacity-60 group-hover/card:opacity-100 transition-opacity duration-500`}
            />
          </div>

          <div className="relative z-10 flex-1 flex flex-col">
            {/* Top Header: Code & Region Pill + Metallic Grade Crest + Action Toolbar */}
            <div className="flex items-center justify-between gap-2 mb-3.5">
              <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                <span className="font-mono text-[11px] font-semibold text-white/80 bg-white/[0.07] px-2.5 py-0.5 rounded-full border border-white/10 shrink-0 backdrop-blur-md">
                  #{p.codigo}
                </span>

                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold font-mono uppercase tracking-wide border backdrop-blur-md ${regStyle.badge} truncate max-w-[140px]`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${regStyle.dot} animate-pulse shrink-0`} />
                  <span className="truncate">{p.regiao}</span>
                </span>
              </div>

              <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                <button
                  type="button"
                  onClick={() => {
                    setIsQuickMsgOpen(false);
                    setIsFlipped(true);
                  }}
                  title={`Nota ${scoreBreakdown.grade} (${scoreBreakdown.totalScore}/100) · Clique para girar em 3D`}
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-gradient-to-br border font-mono text-xs font-black tracking-tight transition-all hover:scale-105 active:scale-95 cursor-pointer ${gradeTokens.crest}`}
                >
                  <span>{scoreBreakdown.grade}</span>
                  <span className="text-[10px] opacity-85 font-semibold">{scoreBreakdown.totalScore}</span>
                  <RotateCw className="w-3 h-3 opacity-70 ml-0.5" />
                </button>

                <div className="flex items-center gap-0.5 bg-white/[0.04] p-1 rounded-2xl border border-white/[0.08] backdrop-blur-md">
                  <button
                    type="button"
                    onClick={() => onToggleFavorite(p.id)}
                    title={isFavorite ? 'Remover dos favoritos' : 'Favoritar prestador'}
                    className={`p-1.5 rounded-xl transition-all cursor-pointer ${
                      isFavorite
                        ? 'text-amber-400 bg-amber-400/15 border border-amber-400/30'
                        : 'text-white/40 hover:text-amber-300 hover:bg-white/[0.08]'
                    }`}
                  >
                    <Star className={`w-3.5 h-3.5 ${isFavorite ? 'fill-amber-400' : ''}`} />
                  </button>

                  {canManagePrestador && (
                    <>
                      <button
                        type="button"
                        onClick={() => {
                          onRecordRecent?.(p);
                          onEdit(p);
                        }}
                        title="Editar prestador"
                        className="p-1.5 rounded-xl text-white/50 hover:text-white hover:bg-white/[0.08] transition-all cursor-pointer"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => onDelete(p.id)}
                        title="Excluir prestador"
                        className="p-1.5 rounded-xl text-white/50 hover:text-rose-400 hover:bg-rose-500/15 transition-all cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Main Body: Avatar + Name + Phone */}
            <div className="flex items-start gap-3.5 my-0.5">
              <div
                className={`w-11 h-11 rounded-2xl ring-1 flex items-center justify-center font-bold font-mono text-sm shrink-0 backdrop-blur-md shadow-inner ${regStyle.avatarRing}`}
              >
                {initials}
              </div>

              <div className="min-w-0 flex-1">
                <h3
                  className="text-base font-bold text-white tracking-tight leading-snug truncate drop-shadow-sm"
                  title={p.nome}
                >
                  {p.nome}
                </h3>

                {p.telefone ? (
                  <div
                    onClick={(e) => e.stopPropagation()}
                    className="flex items-center justify-between gap-2 mt-2 p-1.5 px-3 rounded-2xl bg-white/[0.04] border border-white/[0.08] backdrop-blur-md hover:border-white/[0.15] transition-colors"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <Phone className="w-3.5 h-3.5 text-white/40 shrink-0" />
                      <a
                        href={`tel:${p.telefone}`}
                        className="text-xs font-mono text-white/80 hover:text-white transition-colors truncate"
                      >
                        {p.telefone}
                      </a>
                    </div>

                    <button
                      type="button"
                      onClick={handleCopyPhone}
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-xl text-xs font-medium transition-all cursor-pointer border ${
                        copiedId === `phone-${p.id}`
                          ? 'bg-emerald-500/25 text-emerald-300 border-emerald-400/40'
                          : 'bg-white/[0.06] hover:bg-white/[0.12] text-white/80 border-white/10 hover:text-white'
                      }`}
                      title="Copiar telefone"
                    >
                      {copiedId === `phone-${p.id}` ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-400" />
                          <span>Copiado</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3 text-white/40" />
                          <span>Copiar</span>
                        </>
                      )}
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onRecordRecent?.(p);
                      onEdit(p);
                    }}
                    className="w-full flex items-center justify-between gap-2 mt-2 p-1.5 px-3 rounded-2xl bg-amber-500/[0.05] hover:bg-amber-500/[0.10] border border-dashed border-amber-400/25 hover:border-amber-400/45 text-white/60 hover:text-white transition-all text-xs cursor-pointer"
                    title="Cadastrar telefone para liberar WhatsApp em 1 clique"
                  >
                    <span className="flex items-center gap-1.5 text-xs text-amber-200/75">
                      <Phone className="w-3 h-3 text-amber-300/80" />
                      <span>Sem WhatsApp cadastrado</span>
                    </span>
                    <span className="font-semibold text-[11px] text-cyan-300 hover:text-cyan-200">
                      + Adicionar
                    </span>
                  </button>
                )}

                {p.observacao && (
                  <div className="text-xs text-white/60 mt-2 line-clamp-2 leading-relaxed bg-white/[0.02] p-2 rounded-xl border border-white/[0.06]">
                    {p.observacao}
                  </div>
                )}
              </div>
            </div>

            {/* Cobertura Regional & Agenda de Hoje */}
            <div className="mt-3 pt-2.5 border-t border-white/[0.07] space-y-2">
              <div className="flex items-center justify-between gap-2 text-xs">
                <span className="inline-flex items-center gap-1.5 text-white/65 min-w-0">
                  <CalendarDays className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                  <span className="truncate">
                    {regionalAgenda
                      ? regionalAgenda.diasAtendimento
                      : 'Seg a Sáb · Rota comercial (08h–18h)'}
                  </span>
                </span>

                {todayAgenda && todayAgenda.status !== 'normal' ? (
                  <span
                    className={`font-medium shrink-0 text-[11px] px-2 py-0.5 rounded-full border ${AGENDA_STATUS_META[todayAgenda.status].tone}`}
                  >
                    {AGENDA_STATUS_META[todayAgenda.status].label}
                  </span>
                ) : regionalAgenda?.isencaoKm ? (
                  <span
                    className="font-medium shrink-0 text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-400/25"
                    title={regionalAgenda.isencaoKm.regra}
                  >
                    Isento KM: {regionalAgenda.isencaoKm.dia}
                  </span>
                ) : (
                  <span className="font-mono text-[10px] text-emerald-300/85 shrink-0">
                    Pronto p/ rota
                  </span>
                )}
              </div>

              {todayAgenda && todayAgenda.status !== 'normal' && todayAgenda.dailyCoverage && (
                <p className="text-[11px] text-white/50 truncate" title={todayAgenda.dailyCoverage}>
                  Hoje: {todayAgenda.dailyCoverage}
                </p>
              )}
            </div>

            {/* Métricas Operacionais de Encaixes */}
            <div className="mt-2.5 pt-2.5 border-t border-white/[0.08]">
              {metrics.totalReceived > 0 ? (
                <>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-xs font-medium text-white/60">
                      Encaixes ({metrics.totalReceived})
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowMetricsDetails((prev) => !prev);
                      }}
                      className="inline-flex items-center gap-1 text-xs text-cyan-300/90 hover:text-cyan-200 transition-colors cursor-pointer"
                      title="Expandir detalhamento de encaixes"
                    >
                      <span>{showMetricsDetails ? 'Ocultar' : 'Detalhes'}</span>
                      <ChevronDown
                        className={`w-3.5 h-3.5 transition-transform duration-200 ${
                          showMetricsDetails ? 'rotate-180' : ''
                        }`}
                      />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono tabular-nums">
                    <div>
                      <div className="text-[11px] font-sans text-white/45">Aceite</div>
                      <div className="text-sm font-semibold text-emerald-300 leading-tight mt-0.5">
                        {metrics.acceptanceRate !== null ? `${metrics.acceptanceRate}%` : '—'}
                      </div>
                    </div>

                    <div>
                      <div className="text-[11px] font-sans text-white/45">Resposta</div>
                      <div className="text-sm font-semibold text-cyan-300 leading-tight mt-0.5">
                        {metrics.responseRate !== null ? `${metrics.responseRate}%` : '—'}
                      </div>
                    </div>

                    <div>
                      <div className="text-[11px] font-sans text-white/45">T. médio</div>
                      <div className="text-sm font-semibold text-white leading-tight mt-0.5">
                        {metrics.avgResponseMinutes !== null ? `${metrics.avgResponseMinutes}m` : '—'}
                      </div>
                    </div>

                    <div>
                      <div className="text-[11px] font-sans text-white/45">Estimativa</div>
                      <div
                        className={`text-sm font-semibold leading-tight mt-0.5 ${
                          metrics.estimatedAcceptProbability !== null
                            ? metrics.estimatedAcceptProbability === 0
                              ? 'text-rose-300'
                              : 'text-sky-300'
                            : 'text-amber-300/80'
                        }`}
                      >
                        {metrics.estimatedAcceptProbability !== null
                          ? `~${metrics.estimatedAcceptProbability}%`
                          : 'Insuf.'}
                      </div>
                    </div>
                  </div>

                  {showMetricsDetails && (
                    <div
                      onClick={(e) => e.stopPropagation()}
                      className="pt-2.5 mt-2.5 border-t border-white/[0.06] space-y-1.5 text-xs animate-in fade-in duration-150"
                    >
                      <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 font-mono tabular-nums text-white/70">
                        <span>
                          {metrics.acceptedCount}/{metrics.finalizedCount} aceites
                        </span>
                        <span aria-hidden="true" className="text-white/25">·</span>
                        <span>{metrics.refusedCount} recusas</span>
                        <span aria-hidden="true" className="text-white/25">·</span>
                        <span>{metrics.noResponseCount} sem resp.</span>
                        {metrics.pendingCount > 0 && (
                          <>
                            <span aria-hidden="true" className="text-white/25">·</span>
                            <span>{metrics.pendingCount} pendentes</span>
                          </>
                        )}
                      </div>

                      <p className="text-xs text-white/50 leading-relaxed">
                        {metrics.probabilityBasis}
                      </p>

                      {(metrics.byRegion.length > 0 || metrics.byPeriod.length > 0) && (
                        <div className="text-xs font-mono tabular-nums text-white/65 leading-relaxed">
                          {[
                            ...metrics.byRegion.map((r) => `${r.region}: ${r.accepted}/${r.total}`),
                            ...metrics.byPeriod.map((per) => `${per.period}: ${per.accepted}/${per.total}`),
                          ].join(' · ')}
                        </div>
                      )}
                    </div>
                  )}
                </>
              ) : (
                <div className="rounded-2xl bg-white/[0.025] border border-white/[0.07] px-3 py-2 flex items-center justify-between gap-2 text-xs">
                  <span className="text-white/60">Sem encaixes registrados</span>
                  <span className="font-mono text-[11px] text-amber-300/85" title={metrics.probabilityBasis}>
                    Amostra insuficiente
                  </span>
                </div>
              )}
            </div>

            {/* Prévia Executiva da Nota (Composição + Estrelas do Gestor) */}
            <div className="mt-2.5 rounded-2xl bg-white/[0.03] border border-white/[0.07] p-2.5 space-y-1.5">
              <div className="flex items-center justify-between gap-2 text-[11px]">
                <span className={`font-semibold ${gradeTokens.text}`}>
                  Conceito {scoreBreakdown.grade} · {scoreBreakdown.gradeLabel}
                </span>
                <span className="inline-flex items-center gap-1 font-mono text-amber-300 font-semibold tabular-nums">
                  <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                  <span>{avgStars}/5</span>
                  <span className="text-white/35 font-sans">· gestão</span>
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <div className="flex items-center justify-between text-[10px] text-white/50 mb-1">
                    <span>Operação ({scoreBreakdown.operationalWeight}%)</span>
                    <span className="font-mono text-white/80">{scoreBreakdown.operationalScore}</span>
                  </div>
                  <div className="h-1 rounded-full bg-white/[0.08] overflow-hidden">
                    <div
                      className={`h-full rounded-full ${gradeTokens.bar}`}
                      style={{ width: `${scoreBreakdown.operationalScore}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between text-[10px] text-white/50 mb-1">
                    <span>Gestão ({scoreBreakdown.qualitativeWeight}%)</span>
                    <span className="font-mono text-white/80">{scoreBreakdown.qualitativeScore}</span>
                  </div>
                  <div className="h-1 rounded-full bg-white/[0.08] overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-sky-400"
                      style={{ width: `${scoreBreakdown.qualitativeScore}%` }}
                    />
                  </div>
                </div>
              </div>

              {currentEvaluation.notaGestor && (
                <p className="text-[11px] text-white/55 truncate pt-0.5" title={currentEvaluation.notaGestor}>
                  &ldquo;{currentEvaluation.notaGestor}&rdquo;
                </p>
              )}
            </div>
          </div>

          {/* Bottom Actions + Subtle 3D Hint */}
          <div className="mt-3.5 pt-3 border-t border-white/[0.08] space-y-2 relative z-10">
            <div className="flex items-center gap-2.5" onClick={(e) => e.stopPropagation()}>
              <button
                type="button"
                onClick={handleCopyCard}
                className={`flex-1 py-2 px-3 rounded-2xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer border backdrop-blur-md ${
                  copiedId === `card-${p.id}`
                    ? 'bg-emerald-500/25 text-emerald-300 border-emerald-400/40'
                    : 'bg-white/[0.05] hover:bg-white/[0.10] text-white/80 border-white/[0.10] hover:border-white/[0.20] hover:text-white'
                }`}
                title="Copiar dados formatados"
              >
                {copiedId === `card-${p.id}` ? (
                  <>
                    <Check className="w-3.5 h-3.5 shrink-0 text-emerald-400" />
                    <span>Copiado</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 shrink-0 text-white/50" />
                    <span>Copiar Dados</span>
                  </>
                )}
              </button>

              {p.telefone && cleanPhoneNumber(p.telefone) ? (
                <div className="flex-1 relative" ref={quickMsgRef}>
                  <div className="flex rounded-2xl overflow-hidden border border-emerald-400/30 bg-emerald-500/15 hover:bg-emerald-500/25 transition-all shadow-[0_0_20px_rgba(16,185,129,0.15)] backdrop-blur-md">
                    <button
                      type="button"
                      onClick={() => handleOpenWhatsApp()}
                      className="flex-1 py-2 px-2.5 text-xs font-bold flex items-center justify-center gap-1.5 text-emerald-300 hover:text-emerald-200 cursor-pointer"
                      title={`Abrir WhatsApp com ${p.nome}`}
                    >
                      <WhatsAppIcon className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">WhatsApp</span>
                    </button>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsQuickMsgOpen((prev) => !prev);
                      }}
                      className="px-2 border-l border-emerald-400/20 text-emerald-300 hover:text-white flex items-center justify-center cursor-pointer transition-colors"
                      title="Mensagens rápidas prontas"
                    >
                      <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isQuickMsgOpen ? 'rotate-180' : ''}`} />
                    </button>
                  </div>

                  {isQuickMsgOpen && (
                    <div className="absolute right-0 bottom-full mb-2 w-72 max-w-[calc(100vw-3rem)] bg-slate-950/95 backdrop-blur-3xl border border-white/[0.15] rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.85)] p-2 z-50 animate-in fade-in duration-150 space-y-1">
                      <div className="px-3 py-2 border-b border-white/[0.08] flex items-center justify-between">
                        <span className="text-[11px] font-semibold text-white/60 uppercase tracking-wider flex items-center gap-1.5">
                          <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Disparo Rápido</span>
                        </span>
                        <span className="text-[10px] text-emerald-400 font-mono font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                          1-clique
                        </span>
                      </div>

                      {QUICK_MESSAGES.map((qm, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => handleOpenWhatsApp(qm.msg)}
                          className="w-full text-left p-2.5 rounded-2xl hover:bg-white/[0.08] transition-all group/item cursor-pointer"
                        >
                          <div className="text-xs font-semibold text-white group-hover/item:text-emerald-300 flex items-center justify-between">
                            <span>{qm.title}</span>
                            <WhatsAppIcon className="w-3 h-3 opacity-60 group-hover/item:opacity-100" />
                          </div>
                          <p className="text-[11px] text-white/50 mt-0.5 line-clamp-1">{qm.desc}</p>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    onRecordRecent?.(p);
                    onEdit(p);
                  }}
                  className="flex-1 py-2 px-3 rounded-2xl text-xs font-semibold flex items-center justify-center gap-1.5 bg-white/[0.05] hover:bg-white/[0.10] text-white/80 hover:text-white border border-white/[0.10] hover:border-white/[0.20] transition-all cursor-pointer backdrop-blur-md"
                  title={`Editar cadastro de ${p.nome}`}
                >
                  <Edit2 className="w-3.5 h-3.5 shrink-0 text-white/50" />
                  <span>Editar</span>
                </button>
              )}
            </div>

            <div className="flex items-center justify-between text-[10px] text-white/40 px-0.5">
              <span>{scoreBreakdown.isProvisionalSample ? 'Base provisória' : 'Métricas + Gestão'}</span>
              <span className="inline-flex items-center gap-1 text-white/55 group-hover/card:text-cyan-300 transition-colors">
                <RotateCw className="w-2.5 h-2.5" />
                <span>Clique no card p/ detalhe 3D</span>
              </span>
            </div>
          </div>
        </div>

        {/* ===================================================== */}
        {/* BACK FACE (COMPACT 2-TAB PANEL + METALLIC CREST)      */}
        {/* ===================================================== */}
        <div
          className={`card-3d-face card-3d-face-back relative rounded-3xl p-4 sm:p-5 flex flex-col justify-between
            bg-gradient-to-br from-[#0e1016] via-[#11131a] to-[#090A0F]
            backdrop-blur-2xl
            border border-white/[0.16]
            shadow-[0_24px_60px_rgba(0,0,0,0.75)]
            ${!isFlipped ? 'pointer-events-none select-none' : ''}`}
        >
          {/* Clipped Specular Glare & Grade Glow */}
          <div className="absolute inset-0 rounded-3xl overflow-hidden pointer-events-none">
            <div className="card-3d-glare" />
            <div className="absolute inset-x-0 top-0 h-[1.5px] bg-gradient-to-r from-transparent via-white/45 to-transparent" />
            <div
              className={`absolute -top-20 -right-14 w-52 h-52 rounded-full bg-gradient-to-br ${gradeTokens.backGlow} to-transparent blur-3xl opacity-90`}
            />
          </div>

          <div className="relative z-10 space-y-3">
            {/* Back Header: Back Button + Tech Info + Large Grade Crest */}
            <div className="flex items-start justify-between gap-2.5">
              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsFlipped(false);
                    }}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-white/[0.07] hover:bg-white/[0.14] text-white/85 hover:text-white border border-white/12 text-[11px] font-semibold transition-all cursor-pointer"
                  >
                    <ArrowLeft className="w-3 h-3" />
                    <span>Voltar</span>
                  </button>
                  <span className="font-mono text-[10px] text-white/50">#{p.codigo}</span>
                  {savedFlag && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-[10px] font-semibold animate-in fade-in duration-150">
                      <Check className="w-2.5 h-2.5" />
                      <span>Salvo</span>
                    </span>
                  )}
                </div>

                <h4 className="text-sm font-bold text-white truncate pt-0.5" title={p.nome}>
                  {p.nome}
                </h4>
                <div className="flex items-center gap-1.5 flex-wrap text-[11px]">
                  <span className={`font-semibold ${gradeTokens.text}`}>
                    Conceito {scoreBreakdown.grade} · {scoreBreakdown.gradeLabel}
                  </span>
                  {scoreBreakdown.isProvisionalSample && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-amber-500/15 text-amber-300 border border-amber-400/25 font-mono">
                      Provisória
                    </span>
                  )}
                </div>
              </div>

              <div
                onClick={(e) => {
                  e.stopPropagation();
                  setIsFlipped(false);
                }}
                title="Clique para voltar à frente do card"
                className={`shrink-0 w-14 h-14 rounded-2xl bg-gradient-to-br border flex flex-col items-center justify-center cursor-pointer transition-transform hover:scale-105 ${gradeTokens.crest}`}
              >
                <span className="font-mono text-xl font-black leading-none">{scoreBreakdown.grade}</span>
                <span className="font-mono text-[10px] font-bold opacity-85 mt-0.5 tabular-nums">
                  {scoreBreakdown.totalScore}/100
                </span>
              </div>
            </div>

            {/* Compact 2-Tab Switcher (keeps front & back proportions tightly aligned) */}
            <div
              onClick={(e) => e.stopPropagation()}
              className="grid grid-cols-2 p-1 rounded-xl bg-white/[0.04] border border-white/[0.08] text-xs"
            >
              <button
                type="button"
                onClick={() => setBackTab('resumo')}
                className={`py-1.5 px-2.5 rounded-lg font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  backTab === 'resumo'
                    ? 'bg-white/[0.12] text-white shadow-xs'
                    : 'text-white/55 hover:text-white/85'
                }`}
              >
                <BarChart3 className="w-3.5 h-3.5 text-cyan-400" />
                <span>Resumo & Métricas</span>
              </button>
              <button
                type="button"
                onClick={() => setBackTab('avaliar')}
                className={`py-1.5 px-2.5 rounded-lg font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  backTab === 'avaliar'
                    ? 'bg-white/[0.12] text-white shadow-xs'
                    : 'text-white/55 hover:text-white/85'
                }`}
              >
                <ClipboardCheck className="w-3.5 h-3.5 text-amber-400" />
                <span>Avaliar Gestor</span>
              </button>
            </div>

            {backTab === 'resumo' ? (
              <div onClick={(e) => e.stopPropagation()} className="space-y-2.5 animate-in fade-in duration-150">
                {/* Weighted Composition Bars */}
                <div className="rounded-2xl bg-white/[0.04] border border-white/[0.08] p-3 space-y-2">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-white/75 font-medium">
                      Operação ({scoreBreakdown.operationalWeight}%)
                    </span>
                    <span className="font-mono font-bold text-white tabular-nums">
                      {scoreBreakdown.operationalScore}/100
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full bg-white/[0.07] overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${gradeTokens.bar}`}
                      style={{ width: `${scoreBreakdown.operationalScore}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[11px] pt-0.5">
                    <span className="text-white/75 font-medium">
                      Gestão & Comportamento ({scoreBreakdown.qualitativeWeight}%)
                    </span>
                    <span className="font-mono font-bold text-white tabular-nums">
                      {scoreBreakdown.qualitativeScore}/100
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full bg-white/[0.07] overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-sky-400 transition-all duration-500"
                      style={{ width: `${scoreBreakdown.qualitativeScore}%` }}
                    />
                  </div>
                </div>

                {/* Operational Breakdown 2x2 */}
                <div className="grid grid-cols-2 gap-2">
                  {scoreBreakdown.operationalItems.map((item) => (
                    <div
                      key={item.label}
                      className="rounded-xl bg-white/[0.03] border border-white/[0.07] px-2.5 py-2 flex items-center justify-between gap-2"
                    >
                      <div className="min-w-0">
                        <div className="text-[10px] text-white/45 truncate">{item.label}</div>
                        <div className="text-xs font-mono font-semibold text-white/90 truncate mt-0.5">
                          {item.valueText}
                        </div>
                      </div>
                      <span className="text-[10px] font-mono text-cyan-300/90 shrink-0 tabular-nums">
                        {item.points}/{item.maxPoints}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Parecer resumo do gestor */}
                <div className="rounded-xl bg-white/[0.025] border border-white/[0.06] px-3 py-2 flex items-center justify-between gap-2 text-xs">
                  <span className="text-white/65 truncate">
                    {currentEvaluation.notaGestor
                      ? `"${currentEvaluation.notaGestor}"`
                      : `Média comportamental: ${avgStars}/5`}
                  </span>
                  <button
                    type="button"
                    onClick={() => setBackTab('avaliar')}
                    className="text-[11px] font-semibold text-cyan-300 hover:text-cyan-200 shrink-0 cursor-pointer"
                  >
                    {isLeaderAuthenticated ? 'Editar ★' : 'Ver ★'}
                  </button>
                </div>
              </div>
            ) : (
              <div onClick={(e) => e.stopPropagation()} className="space-y-2.5 animate-in fade-in duration-150">
                {/* Qualitative Manager Criteria (4 x 1..5 Stars) */}
                <div className="rounded-2xl bg-white/[0.03] border border-white/[0.08] p-3 space-y-2">
                  <div className="flex items-center justify-between gap-2 pb-1 border-b border-white/[0.06]">
                    <span className="text-[11px] font-semibold text-white/80 flex items-center gap-1.5">
                      <Sparkles className="w-3 h-3 text-cyan-400" />
                      <span>Critérios do Gestor</span>
                    </span>
                    {!isLeaderAuthenticated ? (
                      <span className="inline-flex items-center gap-1 text-[10px] text-amber-300/85">
                        <Lock className="w-2.5 h-2.5" />
                        <span>Somente Gestor edita</span>
                      </span>
                    ) : (
                      <span className="text-[10px] text-cyan-300/80">Clique nas estrelas</span>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    {scoreBreakdown.qualitativeItems.map((item) => {
                      const previewStars =
                        hoverCriterion && hoverCriterion.key === item.key ? hoverCriterion.stars : item.score;

                      return (
                        <div
                          key={item.key}
                          className="flex items-center justify-between gap-2 py-0.5"
                          title={item.hint}
                        >
                          <div className="min-w-0">
                            <div className="text-xs text-white/85 font-medium truncate">{item.label}</div>
                          </div>

                          <div
                            className="flex items-center gap-0.5 shrink-0"
                            onMouseLeave={() => setHoverCriterion(null)}
                          >
                            {[1, 2, 3, 4, 5].map((starVal) => {
                              const active = starVal <= previewStars;
                              return (
                                <button
                                  key={starVal}
                                  type="button"
                                  disabled={!isLeaderAuthenticated}
                                  onMouseEnter={() => {
                                    if (isLeaderAuthenticated) {
                                      setHoverCriterion({ key: item.key, stars: starVal });
                                    }
                                  }}
                                  onClick={() => handleRateCriterion(item.key, starVal)}
                                  className={`p-0.5 rounded transition-transform ${
                                    isLeaderAuthenticated
                                      ? 'hover:scale-115 cursor-pointer'
                                      : 'cursor-default opacity-85'
                                  }`}
                                  title={
                                    isLeaderAuthenticated
                                      ? `Definir ${starVal}/5 para ${item.label}`
                                      : `${item.label}: ${item.score}/5`
                                  }
                                >
                                  <Star
                                    className={`w-3.5 h-3.5 transition-colors ${
                                      active
                                        ? 'text-amber-400 fill-amber-400 drop-shadow-[0_0_6px_rgba(251,191,36,0.45)]'
                                        : 'text-white/20'
                                    }`}
                                  />
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Nota / Parecer do Gestor */}
                {isLeaderAuthenticated ? (
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label
                        htmlFor={`nota-gestor-${p.id}`}
                        className="text-[11px] font-medium text-white/65"
                      >
                        Observação do gestor
                      </label>
                      <button
                        type="button"
                        onClick={handleSaveNotaGestor}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 border border-cyan-400/25 text-[10px] font-semibold transition-colors cursor-pointer"
                      >
                        <Save className="w-2.5 h-2.5" />
                        <span>Salvar</span>
                      </button>
                    </div>
                    <textarea
                      id={`nota-gestor-${p.id}`}
                      rows={2}
                      value={notaDraft}
                      onChange={(e) => setNotaDraft(e.target.value)}
                      onBlur={handleSaveNotaGestor}
                      placeholder="Ex: postura excelente com cliente, agilidade em encaixes urgentes..."
                      className="w-full rounded-xl bg-white/[0.04] border border-white/[0.10] focus:border-cyan-400/50 px-2.5 py-1.5 text-xs text-white placeholder-white/30 focus:outline-none resize-none"
                    />
                  </div>
                ) : (
                  <div className="rounded-xl bg-white/[0.025] border border-white/[0.06] px-2.5 py-2 text-xs text-white/65 leading-relaxed">
                    {currentEvaluation.notaGestor
                      ? `"${currentEvaluation.notaGestor}"`
                      : 'Sem observação registrada pelo gestor.'}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
