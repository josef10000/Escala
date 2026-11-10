import React from 'react';
import {
  X,
  Search,
  Copy,
  Check,
  ExternalLink,
  Users,
  MessageSquare,
  CalendarCheck,
  MapPin,
  Clock,
  ArrowRight,
} from 'lucide-react';
import {
  Prestador,
  TemplateItem,
  PontoFixoItem,
  AgendaRegiaoItem,
  RegraOperacionalItem,
  MainTab,
} from '../types';
import { PontoFixoStatusBadge } from './PontoFixoStatusBadge';

interface UniversalOmniModalProps {
  isOpen: boolean;
  onClose: () => void;
  query: string;
  onQueryChange: (q: string) => void;
  prestadores: Prestador[];
  templates: TemplateItem[];
  pontosFixos: PontoFixoItem[];
  agendas: AgendaRegiaoItem[];
  regras: RegraOperacionalItem[];
  onNavigateToTab: (tab: MainTab) => void;
  onCopySuccess: (msg: string) => void;
}

export const UniversalOmniModal: React.FC<UniversalOmniModalProps> = ({
  isOpen,
  onClose,
  query,
  onQueryChange,
  prestadores,
  templates,
  pontosFixos,
  agendas,
  regras,
  onNavigateToTab,
  onCopySuccess,
}) => {
  const [copiedId, setCopiedId] = React.useState<string | null>(null);

  if (!isOpen) return null;

  const handleCopy = (id: string, text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    onCopySuccess(`Copiado: ${label}`);
    setTimeout(() => {
      setCopiedId((curr) => (curr === id ? null : curr));
    }, 2000);
  };

  const totalResults =
    prestadores.length + templates.length + pontosFixos.length + agendas.length + regras.length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-2xl animate-fade-in">
      <div className="relative overflow-hidden rounded-3xl bg-[#0b101d]/95 backdrop-blur-2xl border border-white/15 w-full max-w-4xl max-h-[88vh] flex flex-col shadow-[0_25px_70px_-15px_rgba(0,0,0,0.95)]">
        {/* Specular top highlight */}
        <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/25 to-transparent pointer-events-none" />

        {/* Search Header */}
        <div className="p-4 sm:p-5 border-b border-white/10 bg-white/[0.03] flex flex-col gap-3.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-500/25 to-indigo-500/25 border border-blue-400/30 flex items-center justify-center text-blue-300 shadow-sm shadow-blue-500/20">
                <Search className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <span>Busca Universal Dr. Monitora</span>
                  <span className="px-2.5 py-0.5 rounded-full bg-blue-500/20 border border-blue-500/30 text-blue-300 text-xs font-mono font-bold shadow-xs">
                    100% dos módulos
                  </span>
                </h3>
                <p className="text-xs text-slate-300">
                  Pesquise qualquer termo: código de prestador, cidade, ponto fixo, regra de KM, template OPA...
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 transition-all active:scale-95"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              autoFocus
              value={query}
              onChange={(e) => onQueryChange(e.target.value)}
              placeholder="Digite qualquer termo (ex: KM, Barra Funda, Itaquá, Encaixe, Domingo, 18890)..."
              className="w-full pl-10 pr-10 py-3 bg-[#070b14]/90 backdrop-blur-md border border-white/15 rounded-2xl text-sm text-white placeholder-slate-400 focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 shadow-inner transition-all font-sans"
            />
            {query && (
              <button
                type="button"
                onClick={() => onQueryChange('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs px-1.5 py-0.5 rounded-md bg-white/10"
              >
                ✕
              </button>
            )}
          </div>

          {/* Quick counts summary */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <span className="text-slate-400 font-mono text-xs mr-1">
              {totalResults} resultado(s):
            </span>
            <span className="px-2.5 py-1 rounded-xl bg-white/5 border border-white/10 text-slate-200 font-medium shadow-xs">
              👥 Prestadores ({prestadores.length})
            </span>
            <span className="px-2.5 py-1 rounded-xl bg-white/5 border border-white/10 text-slate-200 font-medium shadow-xs">
              💬 Templates OPA ({templates.length})
            </span>
            <span className="px-2.5 py-1 rounded-xl bg-white/5 border border-white/10 text-slate-200 font-medium shadow-xs">
              📍 Pontos Fixos ({pontosFixos.length})
            </span>
            <span className="px-2.5 py-1 rounded-xl bg-white/5 border border-white/10 text-slate-200 font-medium shadow-xs">
              📅 Agendas ({agendas.length})
            </span>
            <span className="px-2.5 py-1 rounded-xl bg-white/5 border border-white/10 text-slate-200 font-medium shadow-xs">
              ⚠️ Regras ({regras.length})
            </span>
          </div>
        </div>

        {/* Results List */}
        <div className="p-4 overflow-y-auto space-y-5 flex-1">
          {totalResults === 0 ? (
            <div className="py-12 text-center text-slate-500 text-xs">
              Nenhum resultado encontrado para &quot;{query}&quot; em toda a base de dados.
            </div>
          ) : (
            <>
              {/* Pontos Fixos Matches */}
              {pontosFixos.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5" />
                      <span>Pontos Fixos de Atendimento ({pontosFixos.length})</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        onNavigateToTab('regras');
                        onClose();
                      }}
                      className="text-xs text-blue-400 hover:text-blue-300 inline-flex items-center gap-1 hover:underline font-medium"
                    >
                      <span>Abrir na aba Regras & Agendas</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {pontosFixos.map((pf) => (
                      <div
                        key={pf.id}
                        className="relative overflow-hidden rounded-2xl bg-gradient-to-b from-[#141b2b]/90 via-[#101623]/90 to-[#0c101a]/90 backdrop-blur-md border border-white/10 hover:border-white/20 p-4 space-y-2.5 shadow-md"
                      >
                        <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/15 to-transparent pointer-events-none" />

                        <div className="flex items-center justify-between gap-1.5">
                          <strong className="text-white text-xs font-bold">{pf.nome}</strong>
                          <span className="text-[11px] font-semibold text-sky-300 bg-sky-500/15 px-2 py-0.5 rounded-md border border-sky-500/25 shrink-0">
                            {pf.subtitulo}
                          </span>
                        </div>
                        <div className="pt-0.5">
                          <PontoFixoStatusBadge pontoFixo={pf} size="sm" />
                        </div>
                        <p className="text-slate-300 text-xs">{pf.endereco}</p>

                        {/* CEP Highlight Box with Instant 1-Click Copy */}
                        <div className="flex items-center justify-between gap-1.5 bg-[#070b14]/90 border border-sky-500/25 rounded-xl px-2.5 py-1.5 text-xs shadow-inner">
                          <span className="text-slate-400 font-mono text-[11px]">
                            📬 CEP: <strong className="text-sky-300 font-bold tracking-wider">{pf.cep}</strong>
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopy(`omni-cep-${pf.id}`, pf.cep, `CEP ${pf.cep}`)}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-semibold bg-sky-500/15 hover:bg-sky-500/25 text-sky-300 border border-sky-500/30 transition-all active:scale-95"
                            title="Copiar apenas o CEP"
                          >
                            {copiedId === `omni-cep-${pf.id}` ? (
                              <>
                                <Check className="w-3 h-3 text-emerald-400" />
                                <span className="text-emerald-400 font-bold">Copiado</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3 h-3 text-sky-400" />
                                <span>Copiar CEP</span>
                              </>
                            )}
                          </button>
                        </div>

                        <p className="text-slate-400 text-xs">Ref: {pf.referencia}</p>
                        <div className="pt-2 flex items-center justify-between border-t border-white/10">
                          <span className="text-xs text-slate-400">{pf.horarioSemana}</span>
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleCopy(`omni-cep-${pf.id}`, pf.cep, `CEP ${pf.cep}`)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-semibold bg-sky-500/10 hover:bg-sky-500/20 text-sky-300 border border-sky-500/30 transition-all active:scale-95 shadow-xs"
                              title="Copiar apenas o CEP"
                            >
                              {copiedId === `omni-cep-${pf.id}` ? (
                                <>
                                  <Check className="w-3 h-3 text-emerald-400" />
                                  <span className="text-emerald-400">CEP copiado</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3 h-3 text-sky-400" />
                                  <span>CEP</span>
                                </>
                              )}
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                handleCopy(
                                  `omni-pf-${pf.id}`,
                                  `*PONTO FIXO DR. MONITORA®*\n📍 ${pf.nome}\n🏢 ${pf.endereco}\n📬 CEP: ${pf.cep}\n🔎 Ref: ${pf.referencia}\n🕒 ${pf.horarioSemana}`,
                                  pf.nome
                                )
                              }
                              className="inline-flex items-center gap-1 px-3 py-1 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/15 text-white border border-white/15 border-t-white/30 shadow-sm transition-all active:scale-95"
                            >
                              {copiedId === `omni-pf-${pf.id}` ? (
                                <>
                                  <Check className="w-3 h-3 text-emerald-300" />
                                  <span>Copiado</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3 h-3" />
                                  <span>Endereço</span>
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Regras Operacionais Matches */}
              {regras.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                      <CalendarCheck className="w-3.5 h-3.5" />
                      <span>Regras Operacionais & Isenções ({regras.length})</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        onNavigateToTab('regras');
                        onClose();
                      }}
                      className="text-xs text-amber-300 hover:text-white inline-flex items-center gap-1 hover:underline font-bold"
                    >
                      <span>Abrir na aba Regras & Agendas</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {regras.map((r) => (
                      <div
                        key={r.id}
                        className="relative overflow-hidden rounded-2xl bg-gradient-to-b from-[#141b2b]/90 via-[#101623]/90 to-[#0c101a]/90 backdrop-blur-md border border-white/10 hover:border-white/20 p-4 space-y-2 shadow-md"
                      >
                        <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/15 to-transparent pointer-events-none" />

                        <strong className="text-white text-xs block font-bold">{r.titulo}</strong>
                        <p className="text-slate-300 text-xs">{r.subtitulo}</p>
                        {r.alerta && (
                          <div className="text-xs text-amber-200 font-medium bg-amber-500/10 p-2.5 rounded-xl border border-amber-500/25 shadow-inner">
                            {r.alerta}
                          </div>
                        )}
                        {r.textoCopiaAtendente && (
                          <div className="pt-2 border-t border-white/10 flex justify-end">
                            <button
                              type="button"
                              onClick={() =>
                                handleCopy(`omni-r-${r.id}`, r.textoCopiaAtendente!, r.titulo)
                              }
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/15 text-slate-200 border border-white/15 transition-all active:scale-95 shadow-xs"
                            >
                              {copiedId === `omni-r-${r.id}` ? (
                                <>
                                  <Check className="w-3 h-3 text-emerald-400" />
                                  <span className="text-emerald-400 font-bold">Copiado</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3 h-3 text-slate-300" />
                                  <span>Copiar Texto Oficial</span>
                                </>
                              )}
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Agendas Regionais Matches */}
              {agendas.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-300 uppercase tracking-wider flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" />
                      <span>Agendas por Região ({agendas.length})</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        onNavigateToTab('regras');
                        onClose();
                      }}
                      className="text-xs text-emerald-300 hover:text-white inline-flex items-center gap-1 hover:underline font-bold"
                    >
                      <span>Abrir na aba Regras & Agendas</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {agendas.map((ag) => (
                      <div
                        key={ag.id}
                        className="relative overflow-hidden rounded-2xl bg-gradient-to-b from-[#141b2b]/90 via-[#101623]/90 to-[#0c101a]/90 backdrop-blur-md border border-white/10 hover:border-white/20 p-4 space-y-2 shadow-md"
                      >
                        <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/15 to-transparent pointer-events-none" />

                        <div className="flex items-center justify-between">
                          <strong className="text-white text-xs font-bold">{ag.regiao}</strong>
                          <span className="px-2.5 py-0.5 rounded-lg text-xs bg-blue-500/15 text-blue-300 border border-blue-500/25 font-bold">
                            {ag.diasAtendimento}
                          </span>
                        </div>
                        <p className="text-slate-300 text-xs">{ag.observacoes}</p>
                        {ag.isencaoKm && (
                          <div className="text-xs text-emerald-300 bg-emerald-500/15 p-2 rounded-xl border border-emerald-500/25 font-semibold">
                            🚗 {ag.isencaoKm.regra}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Prestadores Matches */}
              {prestadores.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-sky-300 uppercase tracking-wider flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5" />
                      <span>Prestadores de Serviço ({prestadores.length})</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        onNavigateToTab('prestadores');
                        onClose();
                      }}
                      className="text-xs text-sky-300 hover:text-white inline-flex items-center gap-1 hover:underline font-bold"
                    >
                      <span>Abrir na aba Prestadores</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                    {prestadores.slice(0, 10).map((p) => (
                      <div
                        key={p.id}
                        className="relative overflow-hidden rounded-xl bg-gradient-to-b from-[#141b2b]/90 via-[#101623]/90 to-[#0c101a]/90 backdrop-blur-md border border-white/10 hover:border-white/20 p-3 flex items-center justify-between shadow-md"
                      >
                        <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/15 to-transparent pointer-events-none" />

                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold text-blue-300 bg-white/10 px-2 py-0.5 rounded-md border border-white/10">{p.codigo}</span>
                            <span className="text-xs font-bold text-white">{p.nome}</span>
                          </div>
                          <span className="text-xs text-slate-400 mt-0.5 block">{p.regiao}</span>
                        </div>
                        {p.telefone && (
                          <button
                            type="button"
                            onClick={() => handleCopy(`omni-tel-${p.id}`, p.telefone!, p.nome)}
                            className="text-xs text-slate-200 hover:text-white px-2.5 py-1 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 font-mono font-medium transition-all active:scale-95 shadow-xs"
                          >
                            {p.telefone}
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Templates Matches */}
              {templates.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-purple-300 uppercase tracking-wider flex items-center gap-1.5">
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>Templates OPA ({templates.length})</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        onNavigateToTab('templates');
                        onClose();
                      }}
                      className="text-xs text-purple-300 hover:text-white inline-flex items-center gap-1 hover:underline font-bold"
                    >
                      <span>Abrir na aba Templates</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                    {templates.map((t) => (
                      <div
                        key={t.id}
                        className="relative overflow-hidden rounded-xl bg-gradient-to-b from-[#141b2b]/90 via-[#101623]/90 to-[#0c101a]/90 backdrop-blur-md border border-white/10 hover:border-white/20 p-3 space-y-2 shadow-md"
                      >
                        <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/15 to-transparent pointer-events-none" />

                        <div className="flex items-center justify-between">
                          <strong className="text-white text-xs font-bold">{t.titulo}</strong>
                          <span className="text-[11px] font-semibold text-purple-300 bg-purple-500/15 px-2 py-0.5 rounded-md border border-purple-500/25 font-mono">{t.categoria}</span>
                        </div>
                        <p className="text-slate-300 text-xs line-clamp-2">{t.texto}</p>
                        <div className="pt-1.5 flex justify-end border-t border-white/10">
                          <button
                            type="button"
                            onClick={() => handleCopy(`omni-tpl-${t.id}`, t.texto, t.titulo)}
                            className="inline-flex items-center gap-1 px-3 py-1 rounded-xl text-xs font-semibold bg-gradient-to-r from-purple-600 to-indigo-600 hover:brightness-110 text-white shadow-sm shadow-purple-500/25 border-t border-white/25 transition-all active:scale-95"
                          >
                            {copiedId === `omni-tpl-${t.id}` ? (
                              <>
                                <Check className="w-3 h-3 text-emerald-300" />
                                <span>Copiado</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3 h-3" />
                                <span>Copiar</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
