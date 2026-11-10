import React, { useState, useMemo, useEffect } from 'react';
import {
  Users,
  MessageSquare,
  MapPin,
  CalendarCheck,
  Clock,
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
  Phone,
  Sparkles,
  X,
  Maximize2,
  Minimize2,
  ShieldAlert,
} from 'lucide-react';
import {
  Prestador,
  TemplateItem,
  PontoFixoItem,
  AgendaRegiaoItem,
  RegraOperacionalItem,
} from '../types';
import { UniversalSearchResults, getRegionColor } from '../utils/search';
import { applyGreetingToText, getGreetingInfo } from '../utils/greeting';
import { openWhatsApp } from '../utils/whatsapp';
import { PontoFixoStatusBadge } from './PontoFixoStatusBadge';

interface SearchAccordionFeedProps {
  query: string;
  onClearQuery: () => void;
  results: UniversalSearchResults;
  onCopySuccess: (msg: string) => void;
  favorites?: string[];
  onToggleFavorite?: (id: string) => void;
  onNavigateToTab?: (tab: import('../types').MainTab) => void;
}

const QUICK_SEARCH_CHIPS = [
  'Horário Fixo',
  'Encaixe',
  'Isenção KM',
  'Barra Funda',
  'Leste 1',
  'Domingos',
  'São José dos Campos',
  'Litoral Norte',
];

export const SearchAccordionFeed: React.FC<SearchAccordionFeedProps> = ({
  query,
  onClearQuery,
  results,
  onCopySuccess,
  favorites = [],
  onToggleFavorite,
  onNavigateToTab,
}) => {
  const greetingInfo = useMemo(() => getGreetingInfo('auto'), []);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Accordion state: open all sections that have results by default
  const [openSections, setOpenSections] = useState({
    prestadores: true,
    templates: true,
    pontosFixos: true,
    regras: true,
    agendas: true,
  });

  // Keep sections with results open whenever search results change
  useEffect(() => {
    setOpenSections({
      prestadores: results.prestadoresMatches.length > 0,
      templates: results.templatesMatches.length > 0,
      pontosFixos: results.pontosFixosMatches.length > 0,
      regras: results.regrasMatches.length > 0,
      agendas: results.agendasMatches.length > 0,
    });
  }, [
    results.prestadoresMatches.length,
    results.templatesMatches.length,
    results.pontosFixosMatches.length,
    results.regrasMatches.length,
    results.agendasMatches.length,
  ]);

  const toggleSection = (section: keyof typeof openSections) => {
    setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const expandAll = () => {
    setOpenSections({
      prestadores: true,
      templates: true,
      pontosFixos: true,
      regras: true,
      agendas: true,
    });
  };

  const collapseAll = () => {
    setOpenSections({
      prestadores: false,
      templates: false,
      pontosFixos: false,
      regras: false,
      agendas: false,
    });
  };

  const handleCopy = (id: string, text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    onCopySuccess(`Copiado: ${label}`);
    setTimeout(() => {
      setCopiedId((curr) => (curr === id ? null : curr));
    }, 2000);
  };

  const total = results.totalMatches;

  return (
    <div className="space-y-4 animate-in fade-in duration-150">
      {/* Top Banner of Accordion Feed */}
      <div className="relative overflow-hidden rounded-2xl bg-[#0e1424]/80 backdrop-blur-xl border border-white/10 shadow-[0_12px_32px_rgba(0,0,0,0.55)] p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Specular line */}
        <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/25 to-indigo-500/25 border border-blue-400/30 flex items-center justify-center text-blue-300 shrink-0 shadow-sm shadow-blue-500/20">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm sm:text-base font-bold text-white tracking-tight">
                Resultados da Busca Universal
              </h2>
              <span className="px-2.5 py-0.5 rounded-full bg-blue-500/15 border border-blue-500/30 text-blue-300 font-mono text-xs font-bold shadow-xs">
                {total} {total === 1 ? 'item encontrado' : 'itens encontrados'}
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              Pesquisando por: <strong className="text-white">&quot;{query}&quot;</strong> em todos os módulos integrados.
            </p>
          </div>
        </div>

        {/* Action Controls: Expand/Collapse & Clear */}
        <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
          <button
            type="button"
            onClick={expandAll}
            className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 text-xs font-semibold inline-flex items-center gap-1.5 transition-all shadow-xs active:scale-95"
            title="Expandir todas as seções"
          >
            <Maximize2 className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Expandir Todos</span>
          </button>
          <button
            type="button"
            onClick={collapseAll}
            className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 text-xs font-semibold inline-flex items-center gap-1.5 transition-all shadow-xs active:scale-95"
            title="Recolher todas as seções"
          >
            <Minimize2 className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Recolher Todos</span>
          </button>
          <button
            type="button"
            onClick={onClearQuery}
            className="px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 hover:text-white border border-rose-500/25 text-xs font-semibold inline-flex items-center gap-1.5 transition-all shadow-xs active:scale-95"
            title="Limpar busca e voltar à tela normal"
          >
            <X className="w-3.5 h-3.5 text-rose-400" />
            <span>Limpar Busca</span>
          </button>
        </div>
      </div>

      {/* Greeting info notification */}
      <div className="px-4 py-2.5 rounded-xl bg-[#080d18]/70 backdrop-blur-md border border-white/10 text-xs text-slate-300 flex items-center justify-between shadow-inner">
        <span className="flex items-center gap-2">
          <span>{greetingInfo.icon}</span>
          <span>
            Saudação para templates:{' '}
            <strong className="text-white font-semibold">{greetingInfo.greeting}</strong> (atualizada automaticamente pelo horário)
          </span>
        </span>
        <span className="text-xs text-slate-400 hidden sm:inline">
          Copie telefones, mensagens e endereços diretamente com 1 clique
        </span>
      </div>

      {/* Zero results state */}
      {total === 0 && (
        <div className="relative overflow-hidden rounded-2xl bg-[#0e1424]/80 backdrop-blur-xl border border-white/10 shadow-[0_12px_32px_rgba(0,0,0,0.55)] p-8 text-center space-y-4">
          <p className="text-sm font-semibold text-slate-200">
            Nenhum resultado encontrado para &quot;{query}&quot; em toda a base de prestadores, templates e regras.
          </p>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Verifique se digitou corretamente ou tente um dos termos operacionais mais comuns abaixo:
          </p>
          <div className="flex flex-wrap justify-center gap-2 pt-2">
            {QUICK_SEARCH_CHIPS.map((chip) => (
              <button
                key={chip}
                type="button"
                onClick={() => {
                  const input = document.querySelector<HTMLInputElement>('header input[type="text"]');
                  if (input) {
                    const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set;
                    nativeSetter?.call(input, chip);
                    input.dispatchEvent(new Event('input', { bubbles: true }));
                    input.focus();
                  }
                }}
                className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-semibold text-slate-300 hover:text-white border border-white/10 hover:border-white/20 transition-all active:scale-95 shadow-xs"
              >
                {chip}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 1. Accordion Block: Prestadores de Serviços */}
      {results.prestadoresMatches.length > 0 && (
        <div className="relative overflow-hidden rounded-2xl bg-[#0e1424]/80 backdrop-blur-xl border border-white/10 shadow-[0_12px_32px_rgba(0,0,0,0.55)] transition-all">
          <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/15 to-transparent pointer-events-none" />

          {/* Accordion Header */}
          <button
            type="button"
            onClick={() => toggleSection('prestadores')}
            className="w-full px-5 py-4 bg-white/5 hover:bg-white/10 flex items-center justify-between text-left transition-all border-b border-white/5"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-blue-500/20 text-blue-300 border border-blue-400/30 flex items-center justify-center shadow-xs">
                <Users className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs sm:text-sm font-bold text-white flex items-center gap-2">
                  <span>Prestadores de Serviços</span>
                  <span className="px-2.5 py-0.5 rounded-full bg-blue-500/20 border border-blue-500/30 text-blue-300 text-xs font-mono font-bold">
                    {results.prestadoresMatches.length}
                  </span>
                </h3>
                <p className="text-xs text-slate-400">
                  Técnicos, códigos e contatos diretos por região
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {onNavigateToTab && (
                <span
                  role="button"
                  tabIndex={0}
                  onClick={(e) => {
                    e.stopPropagation();
                    onNavigateToTab('prestadores');
                  }}
                  className="hidden sm:inline-flex items-center text-xs font-bold text-blue-300 hover:text-white px-2.5 py-1 rounded-xl bg-blue-500/15 border border-blue-500/30 transition-colors cursor-pointer"
                >
                  Ir para Módulo →
                </span>
              )}
              <div className="p-1.5 rounded-lg text-slate-400 hover:text-white bg-white/5 border border-white/10">
                {openSections.prestadores ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </div>
            </div>
          </button>

          {/* Accordion Content */}
          {openSections.prestadores && (
            <div className="p-4 sm:p-5">
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                {results.prestadoresMatches.map((p) => {
                  const regionStyle = getRegionColor(p.regiao);
                  const isCopied = copiedId === `acc-tel-${p.id}`;

                  return (
                    <div
                      key={p.id}
                      className="relative overflow-hidden rounded-xl bg-gradient-to-b from-[#141b2b]/90 via-[#101623]/90 to-[#0c101a]/90 backdrop-blur-md border border-white/10 hover:border-white/20 p-4 flex flex-col justify-between gap-3 transition-all hover:-translate-y-0.5 shadow-md group"
                    >
                      <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/15 to-transparent pointer-events-none" />

                      <div>
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-mono text-xs font-bold text-white tracking-tight bg-white/10 px-2 py-0.5 rounded-md border border-white/15">
                            {p.codigo}
                          </span>
                          <span
                            className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${regionStyle.bg} ${regionStyle.text} ${regionStyle.border} shadow-xs`}
                          >
                            {p.regiao}
                          </span>
                        </div>
                        <h4 className="text-xs sm:text-sm font-bold text-white mt-1.5 truncate group-hover:text-blue-300 transition-colors">
                          {p.nome}
                        </h4>
                        {p.observacao && (
                          <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                            {p.observacao}
                          </p>
                        )}
                      </div>

                      {/* Direct Actions */}
                      <div className="flex items-center gap-2 pt-2.5 border-t border-white/10">
                        {p.telefone ? (
                          <>
                            <button
                              type="button"
                              onClick={() => handleCopy(`acc-tel-${p.id}`, p.telefone!, `Telefone ${p.nome}`)}
                              className={`flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all shadow-xs active:scale-95 ${
                                isCopied
                                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                  : 'bg-white/10 hover:bg-white/15 text-slate-200 border border-white/15'
                              }`}
                            >
                              {isCopied ? (
                                <>
                                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                                  <span>Copiado!</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3.5 h-3.5 text-slate-400" />
                                  <span>Copiar Tel</span>
                                </>
                              )}
                            </button>

                            <button
                              type="button"
                              onClick={() => openWhatsApp(p.telefone!, p.nome, p.codigo)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-gradient-to-r from-emerald-600 to-teal-600 hover:brightness-110 text-white shadow-md shadow-emerald-500/25 border-t border-white/25 transition-all active:scale-95"
                            >
                              <Phone className="w-3.5 h-3.5" />
                              <span>WhatsApp</span>
                            </button>
                          </>
                        ) : (
                          <span className="text-xs text-slate-500 italic">
                            Sem telefone cadastrado
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 2. Accordion Block: Templates OPA */}
      {results.templatesMatches.length > 0 && (
        <div className="relative overflow-hidden rounded-2xl bg-[#0e1424]/80 backdrop-blur-xl border border-white/10 shadow-[0_12px_32px_rgba(0,0,0,0.55)] transition-all">
          <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/15 to-transparent pointer-events-none" />

          {/* Accordion Header */}
          <button
            type="button"
            onClick={() => toggleSection('templates')}
            className="w-full px-5 py-4 bg-white/5 hover:bg-white/10 flex items-center justify-between text-left transition-all border-b border-white/5"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-300 border border-purple-400/30 flex items-center justify-center shadow-xs">
                <MessageSquare className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs sm:text-sm font-bold text-white flex items-center gap-2">
                  <span>Templates OPA de Atendimento</span>
                  <span className="px-2.5 py-0.5 rounded-full bg-purple-500/20 border border-purple-500/30 text-purple-300 text-xs font-mono font-bold">
                    {results.templatesMatches.length}
                  </span>
                </h3>
                <p className="text-xs text-slate-400">
                  Respostas padronizadas com saudação adaptada automaticamente
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {onNavigateToTab && (
                <span
                  role="button"
                  tabIndex={0}
                  onClick={(e) => {
                    e.stopPropagation();
                    onNavigateToTab('templates');
                  }}
                  className="hidden sm:inline-flex items-center text-xs font-bold text-purple-300 hover:text-white px-2.5 py-1 rounded-xl bg-purple-500/15 border border-purple-500/30 transition-colors cursor-pointer"
                >
                  Ir para Módulo →
                </span>
              )}
              <div className="p-1.5 rounded-lg text-slate-400 hover:text-white bg-white/5 border border-white/10">
                {openSections.templates ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </div>
            </div>
          </button>

          {/* Accordion Content */}
          {openSections.templates && (
            <div className="p-4 sm:p-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {results.templatesMatches.map((t) => {
                  const adaptedText = applyGreetingToText(t.texto, 'auto');
                  const isCopied = copiedId === `acc-tpl-${t.id}`;

                  return (
                    <div
                      key={t.id}
                      className="relative overflow-hidden rounded-xl bg-gradient-to-b from-[#141b2b]/90 via-[#101623]/90 to-[#0c101a]/90 backdrop-blur-md border border-white/10 hover:border-white/20 p-4 flex flex-col justify-between gap-3 transition-all hover:-translate-y-0.5 shadow-md group"
                    >
                      <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/15 to-transparent pointer-events-none" />

                      <div className="space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <h4 className="text-xs sm:text-sm font-bold text-white group-hover:text-purple-300 transition-colors">
                            {t.titulo}
                          </h4>
                          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-purple-500/15 text-purple-300 border border-purple-500/25 font-mono">
                            {t.categoria}
                          </span>
                        </div>

                        <p className="text-xs text-slate-300 whitespace-pre-line leading-relaxed bg-[#070b14]/80 p-3 rounded-xl border border-white/5 font-sans shadow-inner">
                          {adaptedText}
                        </p>
                      </div>

                      <div className="flex items-center justify-between pt-2.5 border-t border-white/10 text-xs">
                        <span className="text-[11px] text-slate-400 flex items-center gap-1 font-medium">
                          <span>{greetingInfo.icon}</span>
                          <span>{greetingInfo.greeting}</span>
                        </span>

                        <button
                          type="button"
                          onClick={() => handleCopy(`acc-tpl-${t.id}`, adaptedText, t.titulo)}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all shadow-xs active:scale-95 ${
                            isCopied
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:brightness-110 text-white shadow-md shadow-blue-500/25 border-t border-white/25'
                          }`}
                        >
                          {isCopied ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                              <span>Frase copiada!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              <span>Copiar Frase</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 3. Accordion Block: Pontos Fixos */}
      {results.pontosFixosMatches.length > 0 && (
        <div className="relative overflow-hidden rounded-2xl bg-[#0e1424]/80 backdrop-blur-xl border border-white/10 shadow-[0_12px_32px_rgba(0,0,0,0.55)] transition-all">
          <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/15 to-transparent pointer-events-none" />

          {/* Accordion Header */}
          <button
            type="button"
            onClick={() => toggleSection('pontosFixos')}
            className="w-full px-5 py-4 bg-white/5 hover:bg-white/10 flex items-center justify-between text-left transition-all border-b border-white/5"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-sky-500/20 text-sky-300 border border-sky-400/30 flex items-center justify-center shadow-xs">
                <MapPin className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs sm:text-sm font-bold text-white flex items-center gap-2">
                  <span>Pontos Fixos de Atendimento</span>
                  <span className="px-2.5 py-0.5 rounded-full bg-sky-500/20 border border-sky-500/30 text-sky-300 text-xs font-mono font-bold">
                    {results.pontosFixosMatches.length}
                  </span>
                </h3>
                <p className="text-xs text-slate-400">
                  Bases de atendimento presencial, horários e endereços completos
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {onNavigateToTab && (
                <span
                  role="button"
                  tabIndex={0}
                  onClick={(e) => {
                    e.stopPropagation();
                    onNavigateToTab('regras');
                  }}
                  className="hidden sm:inline-flex items-center text-xs font-bold text-sky-300 hover:text-white px-2.5 py-1 rounded-xl bg-sky-500/15 border border-sky-500/30 transition-colors cursor-pointer"
                >
                  Ir para Módulo →
                </span>
              )}
              <div className="p-1.5 rounded-lg text-slate-400 hover:text-white bg-white/5 border border-white/10">
                {openSections.pontosFixos ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </div>
            </div>
          </button>

          {/* Accordion Content */}
          {openSections.pontosFixos && (
            <div className="p-4 sm:p-5">
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5">
                {results.pontosFixosMatches.map((pf) => {
                  const isCopied = copiedId === `acc-pf-${pf.id}`;
                  const formattedAddress = `*PONTO FIXO DR. MONITORA®*\n📍 ${pf.nome}\n🏢 ${pf.endereco}\n📬 CEP: ${pf.cep}\n🔎 Ref: ${pf.referencia}\n🕒 Horário: ${pf.horarioSemana}`;

                  return (
                    <div
                      key={pf.id}
                      className="relative overflow-hidden rounded-xl bg-gradient-to-b from-[#141b2b]/90 via-[#101623]/90 to-[#0c101a]/90 backdrop-blur-md border border-white/10 hover:border-white/20 p-4 flex flex-col justify-between gap-3 transition-all hover:-translate-y-0.5 shadow-md group"
                    >
                      <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/15 to-transparent pointer-events-none" />

                      <div className="space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <h4 className="text-xs sm:text-sm font-bold text-white group-hover:text-sky-300 transition-colors">{pf.nome}</h4>
                          <span className="text-[11px] font-semibold text-sky-300 bg-sky-500/15 px-2 py-0.5 rounded-md border border-sky-500/25 shrink-0">
                            {pf.subtitulo}
                          </span>
                        </div>
                        <div className="pt-0.5">
                          <PontoFixoStatusBadge pontoFixo={pf} size="sm" />
                        </div>
                        <p className="text-xs text-slate-300">{pf.endereco}</p>

                        {/* CEP Highlight Box with Instant 1-Click Copy */}
                        <div className="flex items-center justify-between gap-2 bg-[#070b14]/90 border border-sky-500/25 rounded-xl px-2.5 py-1.5 transition-all shadow-inner">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span className="text-slate-400 text-xs font-mono">📬 CEP:</span>
                            <span className="text-sky-300 font-mono font-bold text-xs tracking-wider select-all">
                              {pf.cep}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleCopy(`acc-cep-${pf.id}`, pf.cep, `CEP ${pf.cep}`)}
                            className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-xs font-semibold bg-sky-500/15 hover:bg-sky-500/25 text-sky-300 border border-sky-500/30 transition-all active:scale-95 shrink-0 shadow-xs"
                            title="Copiar apenas o CEP"
                          >
                            {copiedId === `acc-cep-${pf.id}` ? (
                              <>
                                <Check className="w-3 h-3 text-emerald-400" />
                                <span className="text-emerald-400 font-bold">Copiado!</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3 h-3 text-sky-400" />
                                <span>Copiar CEP</span>
                              </>
                            )}
                          </button>
                        </div>

                        <p className="text-xs text-slate-400">Ref: {pf.referencia}</p>
                        <p className="text-xs text-slate-400">{pf.horarioSemana}</p>
                      </div>

                      <div className="grid grid-cols-2 gap-2 pt-2.5 border-t border-white/10">
                        <button
                          type="button"
                          onClick={() => handleCopy(`acc-cep-${pf.id}`, pf.cep, `CEP ${pf.cep}`)}
                          className="inline-flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-sky-500/10 hover:bg-sky-500/20 text-sky-300 border border-sky-500/30 transition-all active:scale-95 shadow-xs"
                          title="Copiar apenas o CEP"
                        >
                          {copiedId === `acc-cep-${pf.id}` ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                              <span className="text-emerald-400 font-bold">CEP copiado!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5 text-sky-400" />
                              <span>Copiar CEP</span>
                            </>
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={() => handleCopy(`acc-pf-${pf.id}`, formattedAddress, pf.nome)}
                          className={`inline-flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all shadow-xs active:scale-95 ${
                            isCopied
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : 'bg-white/10 hover:bg-white/15 text-white border border-white/15 border-t-white/25'
                          }`}
                        >
                          {isCopied ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                              <span>Copiado!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5 text-slate-300" />
                              <span>Copiar Endereço</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 4. Accordion Block: Regras Operacionais */}
      {results.regrasMatches.length > 0 && (
        <div className="relative overflow-hidden rounded-2xl bg-[#0e1424]/80 backdrop-blur-xl border border-white/10 shadow-[0_12px_32px_rgba(0,0,0,0.55)] transition-all">
          <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/15 to-transparent pointer-events-none" />

          {/* Accordion Header */}
          <button
            type="button"
            onClick={() => toggleSection('regras')}
            className="w-full px-5 py-4 bg-white/5 hover:bg-white/10 flex items-center justify-between text-left transition-all border-b border-white/5"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-400/30 flex items-center justify-center shadow-xs">
                <ShieldAlert className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs sm:text-sm font-bold text-white flex items-center gap-2">
                  <span>Regras Operacionais & Diretrizes</span>
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-mono font-bold">
                    {results.regrasMatches.length}
                  </span>
                </h3>
                <p className="text-xs text-slate-400">
                  Políticas de horário fixo, regras de encaixe e proibições de prioridade
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {onNavigateToTab && (
                <span
                  role="button"
                  tabIndex={0}
                  onClick={(e) => {
                    e.stopPropagation();
                    onNavigateToTab('regras');
                  }}
                  className="hidden sm:inline-flex items-center text-xs font-bold text-amber-300 hover:text-white px-2.5 py-1 rounded-xl bg-amber-500/15 border border-amber-500/30 transition-colors cursor-pointer"
                >
                  Ir para Módulo →
                </span>
              )}
              <div className="p-1.5 rounded-lg text-slate-400 hover:text-white bg-white/5 border border-white/10">
                {openSections.regras ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </div>
            </div>
          </button>

          {/* Accordion Content */}
          {openSections.regras && (
            <div className="p-4 sm:p-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {results.regrasMatches.map((r) => {
                  const isCopied = copiedId === `acc-reg-${r.id}`;

                  return (
                    <div
                      key={r.id}
                      className="relative overflow-hidden rounded-xl bg-gradient-to-b from-[#141b2b]/90 via-[#101623]/90 to-[#0c101a]/90 backdrop-blur-md border border-white/10 hover:border-white/20 p-4 flex flex-col justify-between gap-3 transition-all hover:-translate-y-0.5 shadow-md group"
                    >
                      <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/15 to-transparent pointer-events-none" />

                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs sm:text-sm font-bold text-white group-hover:text-amber-300 transition-colors">{r.titulo}</h4>
                          <span className="text-[11px] font-semibold text-amber-300 font-mono bg-amber-500/15 px-2 py-0.5 rounded-md border border-amber-500/30">
                            {r.categoria}
                          </span>
                        </div>
                        <p className="text-xs text-slate-300">{r.subtitulo}</p>
                        {r.alerta && (
                          <div className="text-xs text-amber-200 bg-amber-500/10 p-2.5 rounded-xl border border-amber-500/25 shadow-inner">
                            {r.alerta}
                          </div>
                        )}
                      </div>

                      {r.textoCopiaAtendente && (
                        <div className="flex justify-end pt-2.5 border-t border-white/10">
                          <button
                            type="button"
                            onClick={() =>
                              handleCopy(`acc-reg-${r.id}`, r.textoCopiaAtendente!, r.titulo)
                            }
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all shadow-xs active:scale-95 ${
                              isCopied
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                : 'bg-white/10 hover:bg-white/15 text-slate-200 border border-white/15'
                            }`}
                          >
                            {isCopied ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-emerald-400" />
                                <span className="text-emerald-400 font-bold">Texto copiado!</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5 text-slate-300" />
                                <span>Copiar Texto Oficial</span>
                              </>
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 5. Accordion Block: Agendas Regionais & Isenções */}
      {results.agendasMatches.length > 0 && (
        <div className="relative overflow-hidden rounded-2xl bg-[#0e1424]/80 backdrop-blur-xl border border-white/10 shadow-[0_12px_32px_rgba(0,0,0,0.55)] transition-all">
          <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/15 to-transparent pointer-events-none" />

          {/* Accordion Header */}
          <button
            type="button"
            onClick={() => toggleSection('agendas')}
            className="w-full px-5 py-4 bg-white/5 hover:bg-white/10 flex items-center justify-between text-left transition-all border-b border-white/5"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 flex items-center justify-center shadow-xs">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs sm:text-sm font-bold text-white flex items-center gap-2">
                  <span>Agendas Regionais & Isenção de KM</span>
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-mono font-bold">
                    {results.agendasMatches.length}
                  </span>
                </h3>
                <p className="text-xs text-slate-400">
                  Dias de atendimento e dias isentos de cobrança de quilometragem
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {onNavigateToTab && (
                <span
                  role="button"
                  tabIndex={0}
                  onClick={(e) => {
                    e.stopPropagation();
                    onNavigateToTab('regras');
                  }}
                  className="hidden sm:inline-flex items-center text-xs font-bold text-emerald-300 hover:text-white px-2.5 py-1 rounded-xl bg-emerald-500/15 border border-emerald-500/30 transition-colors cursor-pointer"
                >
                  Ir para Módulo →
                </span>
              )}
              <div className="p-1.5 rounded-lg text-slate-400 hover:text-white bg-white/5 border border-white/10">
                {openSections.agendas ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </div>
            </div>
          </button>

          {/* Accordion Content */}
          {openSections.agendas && (
            <div className="p-4 sm:p-5">
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5">
                {results.agendasMatches.map((ag) => {
                  const isCopied = copiedId === `acc-ag-${ag.id}`;
                  const copyText = `*AGENDA REGIONAL DR. MONITORA®*\n📍 Região: ${ag.regiao}\n📅 Dias: ${ag.diasAtendimento}\nℹ️ ${ag.observacoes}${ag.isencaoKm ? `\n🚗 Isenção de KM: ${ag.isencaoKm.regra} (${ag.isencaoKm.dia})` : ''}`;

                  return (
                    <div
                      key={ag.id}
                      className="relative overflow-hidden rounded-xl bg-gradient-to-b from-[#141b2b]/90 via-[#101623]/90 to-[#0c101a]/90 backdrop-blur-md border border-white/10 hover:border-white/20 p-4 flex flex-col justify-between gap-3 transition-all hover:-translate-y-0.5 shadow-md group"
                    >
                      <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/15 to-transparent pointer-events-none" />

                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs sm:text-sm font-bold text-white group-hover:text-emerald-300 transition-colors">{ag.regiao}</h4>
                          <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-blue-500/15 text-blue-300 border border-blue-500/25">
                            {ag.diasAtendimento}
                          </span>
                        </div>
                        <p className="text-xs text-slate-300">{ag.observacoes}</p>
                        {ag.isencaoKm && (
                          <div className="text-xs text-emerald-200 bg-emerald-500/15 p-2 rounded-xl border border-emerald-500/25 font-semibold">
                            🚗 {ag.isencaoKm.regra} ({ag.isencaoKm.dia})
                          </div>
                        )}
                      </div>

                      <div className="flex justify-end pt-2.5 border-t border-white/10">
                        <button
                          type="button"
                          onClick={() => handleCopy(`acc-ag-${ag.id}`, copyText, ag.regiao)}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all shadow-xs active:scale-95 ${
                            isCopied
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : 'bg-white/10 hover:bg-white/15 text-slate-200 border border-white/15'
                          }`}
                        >
                          {isCopied ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                              <span className="text-emerald-400 font-bold">Copiado!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5 text-slate-300" />
                              <span>Copiar Regra</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
