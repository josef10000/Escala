import React, { useMemo, useState } from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  Plus,
  Search,
  Copy,
} from 'lucide-react';
import { Prestador } from '../../prestadores_regional/types';
import {
  AgendaStatusType,
  DailyAgendaEntry,
  GeoHierarchyItem,
} from '../types';
import { TODAY_ISO } from '../data/mockCentralData';

interface AgendasGeografiaViewProps {
  dailyAgendas: DailyAgendaEntry[];
  geoHierarchy: GeoHierarchyItem[];
  prestadores: Prestador[];
  statusFilter: 'all' | AgendaStatusType;
  onStatusFilterChange: (value: 'all' | AgendaStatusType) => void;
  onApproveAgendaReview: (id: string) => void;
  onSimulateAgendaMessage: (rawText: string, date: string) => void;
  onCopyText: (text: string, label: string) => void;
}

const AGENDA_STATUS_LABELS: Record<AgendaStatusType, string> = {
  normal: 'Normal',
  mudanca: 'Mudança temporária',
  reduzida: 'Capacidade reduzida',
  fechada: 'Agenda fechada',
  sem_servico: 'Sem serviço',
};

function offsetIsoDate(baseIso: string, deltaDays: number): string {
  const [y, m, d] = baseIso.split('-').map(Number);
  const dt = new Date(y, m - 1, d + deltaDays);
  const yyyy = dt.getFullYear();
  const mm = String(dt.getMonth() + 1).padStart(2, '0');
  const dd = String(dt.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

export const AgendasGeografiaView: React.FC<AgendasGeografiaViewProps> = ({
  dailyAgendas,
  geoHierarchy,
  prestadores,
  statusFilter,
  onStatusFilterChange,
  onApproveAgendaReview,
  onSimulateAgendaMessage,
  onCopyText,
}) => {
  const [subTab, setSubTab] = useState<'agendas' | 'geografia'>('agendas');
  const [selectedDate, setSelectedDate] = useState(TODAY_ISO);
  const [rawAgendaInput, setRawAgendaInput] = useState(
    'Rafael D. Carvalho: Leste 1/4 altas'
  );
  const [geoQuery, setGeoQuery] = useState('08010-090');

  const yesterdayIso = useMemo(() => offsetIsoDate(TODAY_ISO, -1), []);
  const tomorrowIso = useMemo(() => offsetIsoDate(TODAY_ISO, 1), []);

  const agendasForDate = useMemo(
    () =>
      dailyAgendas.filter((a) => {
        if (a.date !== selectedDate) return false;
        if (statusFilter !== 'all' && a.status !== statusFilter) return false;
        return true;
      }),
    [dailyAgendas, selectedDate, statusFilter]
  );

  const countForDate = (dateIso: string) =>
    dailyAgendas.filter((a) => a.date === dateIso).length;

  const geoLookupResult = useMemo(() => {
    const q = geoQuery.trim().toLowerCase();
    if (!q) return null;
    const cleanDigits = q.replace(/\D/g, '');

    for (const item of geoHierarchy) {
      const cepMatch =
        cleanDigits.length >= 5 &&
        item.cepPrefixes.some((prefix) => cleanDigits.startsWith(prefix));
      const bairroMatch = item.neighborhoods.some((b) => q.includes(b.toLowerCase()));
      const subMatch = q.includes(item.subRegion.toLowerCase());
      if (cepMatch || bairroMatch || subMatch) {
        return {
          matched: true as const,
          item,
          suggestedTechs: prestadores
            .filter(
              (p) => p.regiao.trim().toUpperCase() === item.subRegion.toUpperCase()
            )
            .map((tech) => {
              const agendaToday = dailyAgendas.find(
                (a) => a.date === TODAY_ISO && a.technicianId === tech.id
              );
              return { tech, agendaToday };
            }),
        };
      }
    }

    return { matched: false as const };
  }, [geoQuery, geoHierarchy, prestadores, dailyAgendas]);

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-white/[0.08] pb-5">
        <div>
          <h2 className="text-2xl font-semibold text-white">Agendas e Geografia</h2>
          <p className="text-sm text-slate-400 mt-1 leading-relaxed">
            Mudanças diárias valem somente para a data informada; setores (Alta, Meio, Baixa) definem subáreas geográficas.
          </p>
        </div>

        <div className="flex items-center gap-1 p-1 bg-[#0e1016] border border-white/[0.08] rounded-xl self-start md:self-auto shrink-0">
          <button
            type="button"
            onClick={() => setSubTab('agendas')}
            className={`px-3.5 py-2 rounded-lg text-[13px] font-medium cursor-pointer transition-colors whitespace-nowrap ${
              subTab === 'agendas'
                ? 'bg-[#00d2d3] text-[#003731] font-semibold'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            Agendas Diárias
          </button>
          <button
            type="button"
            onClick={() => setSubTab('geografia')}
            className={`px-3.5 py-2 rounded-lg text-[13px] font-medium cursor-pointer transition-colors whitespace-nowrap ${
              subTab === 'geografia'
                ? 'bg-[#00d2d3] text-[#003731] font-semibold'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            Classificador CEP
          </button>
        </div>
      </header>

      {subTab === 'agendas' ? (
        <div className="space-y-6">
          {/* Simulador de Agenda Diária + Navegação rápida de datas */}
          <section className="bg-[#0e1016] border border-white/[0.08] rounded-2xl p-4 sm:p-6 space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-semibold text-white">
                  Simular atualização de agenda
                </h3>
                <p className="text-[13px] text-slate-400 mt-0.5">
                  Interpreta mudanças pontuais enviadas no grupo sem sobrescrever dias futuros.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedDate(yesterdayIso)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-colors ${
                    selectedDate === yesterdayIso
                      ? 'bg-white/[0.14] text-white'
                      : 'bg-[#090A0F] border border-white/[0.08] text-slate-400 hover:text-white'
                  }`}
                >
                  Ontem ({countForDate(yesterdayIso)})
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedDate(TODAY_ISO)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-colors ${
                    selectedDate === TODAY_ISO
                      ? 'bg-cyan-500/20 border border-cyan-500/40 text-cyan-200'
                      : 'bg-[#090A0F] border border-white/[0.08] text-slate-400 hover:text-white'
                  }`}
                >
                  Hoje ({countForDate(TODAY_ISO)})
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedDate(tomorrowIso)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-colors ${
                    selectedDate === tomorrowIso
                      ? 'bg-white/[0.14] text-white'
                      : 'bg-[#090A0F] border border-white/[0.08] text-slate-400 hover:text-white'
                  }`}
                >
                  Amanhã ({countForDate(tomorrowIso)})
                </button>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="px-3 py-1.5 rounded-lg bg-[#090A0F] border border-white/[0.1] text-xs font-mono text-white"
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                value={rawAgendaInput}
                onChange={(e) => setRawAgendaInput(e.target.value)}
                placeholder="Ex.: Carlos André: Leste 1/4 altas | Felipe Sul1 alta/abc3 meio"
                className="flex-1 px-3.5 py-2.5 rounded-xl bg-[#090A0F] border border-white/[0.1] text-[13px] text-white placeholder-slate-500 focus:border-[#00d2d3] focus:outline-none"
              />
              <button
                type="button"
                onClick={() => {
                  if (rawAgendaInput.trim()) {
                    onSimulateAgendaMessage(rawAgendaInput.trim(), selectedDate);
                  }
                }}
                className="px-4 py-2.5 rounded-xl bg-[#00d2d3] hover:bg-[#00e2e3] text-[#003731] text-[13px] font-semibold flex items-center gap-2 cursor-pointer shrink-0 whitespace-nowrap transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Interpretar Agenda</span>
              </button>
            </div>
          </section>

          {/* Filtro por impacto na data */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-1.5">
              {(['all', 'mudanca', 'reduzida', 'fechada', 'sem_servico', 'normal'] as const).map(
                (st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => onStatusFilterChange(st)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-colors ${
                      statusFilter === st
                        ? 'bg-white/[0.14] text-white'
                        : 'bg-[#0e1016] border border-white/[0.08] text-slate-400 hover:text-white'
                    }`}
                  >
                    {st === 'all' ? 'Todos' : AGENDA_STATUS_LABELS[st]}
                  </button>
                )
              )}
            </div>
            <span className="text-xs text-slate-400 font-mono tabular-nums">
              {agendasForDate.length} registro(s) em {selectedDate}
            </span>
          </div>

          {/* Lista de Agendas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {agendasForDate.length === 0 ? (
              <div className="md:col-span-2 bg-[#0e1016] border border-white/[0.08] rounded-2xl p-12 text-center text-sm text-slate-400">
                Nenhuma alteração de agenda encontrada para {selectedDate} com o filtro selecionado. Técnicos sem registro mantêm a cobertura habitual.
              </div>
            ) : (
              agendasForDate.map((entry) => (
                <article
                  key={entry.id}
                  className="bg-[#0e1016] border border-white/[0.08] rounded-2xl p-4 sm:p-6 space-y-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-xs font-mono text-cyan-300 tabular-nums">
                        #{entry.technicianCode} · {entry.date} · v{entry.version}
                      </div>
                      <h3 className="text-base font-semibold text-white mt-1">
                        {entry.technicianName}
                      </h3>
                    </div>

                    <span
                      className={`text-xs font-semibold whitespace-nowrap ${
                        entry.status === 'fechada'
                          ? 'text-rose-400'
                          : entry.status === 'reduzida'
                          ? 'text-amber-300'
                          : entry.status === 'mudanca'
                          ? 'text-cyan-300'
                          : entry.status === 'sem_servico'
                          ? 'text-slate-400'
                          : 'text-emerald-400'
                      }`}
                    >
                      {AGENDA_STATUS_LABELS[entry.status]}
                    </span>
                  </div>

                  {/* Cobertura Habitual vs Diária em tipografia limpa */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-white/[0.06] pt-4">
                    <div>
                      <div className="text-xs text-slate-400">Cobertura habitual</div>
                      <div className="text-[13px] text-slate-200 mt-1 leading-snug">
                        {entry.habitualCoverage}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-400">Cobertura nesta data</div>
                      <div className="text-[13px] font-medium text-white mt-1 leading-snug">
                        {entry.dailyCoverage}
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-white/[0.06] pt-3.5 space-y-1.5 text-[13px]">
                    <p className="text-slate-300 leading-relaxed">
                      <span className="text-slate-500">Original: </span>
                      <span className="font-mono text-xs text-slate-200">{entry.rawText}</span>
                    </p>
                    <p className="text-slate-400 leading-relaxed">
                      Leitura ({entry.confidence}%): {entry.aiInterpretation}
                    </p>
                  </div>

                  {entry.needsReview && (
                    <div className="flex items-center justify-between gap-3 border border-amber-500/30 bg-amber-500/[0.06] rounded-xl px-3.5 py-2.5 text-[13px]">
                      <span className="text-amber-200 flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                        <span>Confirmar regra aplicada</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => onApproveAgendaReview(entry.id)}
                        className="px-3 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-100 text-xs font-medium cursor-pointer shrink-0 transition-colors"
                      >
                        Aprovar
                      </button>
                    </div>
                  )}

                  {entry.history.length > 0 && (
                    <div className="border-t border-white/[0.06] pt-3 space-y-1 text-xs text-slate-400">
                      {entry.history.map((h) => (
                        <div key={h.version} className="leading-relaxed">
                          v{h.version} ·{' '}
                          {new Date(h.timestamp).toLocaleTimeString('pt-BR', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}{' '}
                          · {h.summary}
                        </div>
                      ))}
                    </div>
                  )}
                </article>
              ))
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Testador Determinístico de CEP com cruzamento de agenda do dia */}
          <section
            id="cep-lookup-card"
            className="bg-[#0e1016] border border-white/[0.08] rounded-2xl p-4 sm:p-6 space-y-4 scroll-mt-4"
          >
            <div>
              <h3 className="text-base font-semibold text-white">
                Classificador Geográfico por CEP ou Bairro
              </h3>
              <p className="text-[13px] text-slate-400 mt-1 leading-relaxed">
                Associação determinística pela tabela operacional de regiões, já verificando a situação da agenda de hoje de cada técnico.
              </p>
            </div>

            <div className="relative max-w-lg">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={geoQuery}
                onChange={(e) => setGeoQuery(e.target.value)}
                placeholder="Digite CEP (ex: 08010-090) ou bairro (ex: Tatuapé)..."
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-[#090A0F] border border-white/[0.1] text-[13px] text-white placeholder-slate-500 focus:border-[#00d2d3] focus:outline-none"
              />
            </div>

            {geoLookupResult && (
              <div className="border-t border-white/[0.06] pt-4 text-[13px]">
                {geoLookupResult.matched ? (
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2 text-emerald-400 font-medium">
                        <CheckCircle2 className="w-4 h-4 shrink-0" />
                        <span>
                          {geoLookupResult.item.macroRegion} → {geoLookupResult.item.subRegion}
                        </span>
                      </div>
                      <span className="text-xs text-slate-400">
                        Setores: {geoLookupResult.item.sectors.join(' · ')}
                      </span>
                    </div>

                    {geoLookupResult.suggestedTechs.length === 0 ? (
                      <p className="text-slate-400">
                        Nenhum técnico habitual vinculado a {geoLookupResult.item.subRegion}.
                      </p>
                    ) : (
                      <div className="divide-y divide-white/[0.06] border-t border-white/[0.06]">
                        {geoLookupResult.suggestedTechs.map(({ tech, agendaToday }) => (
                          <div
                            key={tech.id}
                            className="py-2.5 flex flex-wrap items-center justify-between gap-3"
                          >
                            <div className="min-w-0">
                              <div className="text-white font-medium">
                                {tech.nome}{' '}
                                <span className="font-mono text-xs text-slate-400">
                                  (#{tech.codigo})
                                </span>
                              </div>
                              <div className="text-xs text-slate-400 mt-0.5">
                                Agenda hoje:{' '}
                                <span
                                  className={
                                    agendaToday?.status === 'fechada' ||
                                    agendaToday?.status === 'sem_servico'
                                      ? 'text-rose-300 font-medium'
                                      : agendaToday?.status === 'reduzida'
                                      ? 'text-amber-300 font-medium'
                                      : 'text-emerald-300 font-medium'
                                  }
                                >
                                  {agendaToday
                                    ? `${AGENDA_STATUS_LABELS[agendaToday.status]} (${agendaToday.dailyCoverage})`
                                    : 'Normal (cobertura habitual)'}
                                </span>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() =>
                                onCopyText(
                                  `${tech.nome} (#${tech.codigo}) - ${tech.regiao}${
                                    tech.telefone ? ` · ${tech.telefone}` : ''
                                  }`,
                                  `Contato de ${tech.nome} copiado`
                                )
                              }
                              className="px-3 py-1.5 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] text-xs font-medium text-slate-200 flex items-center gap-1.5 cursor-pointer transition-colors shrink-0"
                            >
                              <Copy className="w-3.5 h-3.5 text-cyan-300" />
                              <span>Copiar técnico</span>
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-amber-300 font-medium">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>
                      Região não identificada para "{geoQuery}" — requer revisão manual.
                    </span>
                  </div>
                )}
              </div>
            )}
          </section>

          {/* Lista/Tabela da Hierarquia Geográfica */}
          <section className="bg-[#0e1016] border border-white/[0.08] rounded-2xl overflow-hidden">
            {/* Cards Mobile (< md) */}
            <div className="md:hidden divide-y divide-white/[0.06]">
              {geoHierarchy.map((g) => (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => {
                    setGeoQuery(g.cepPrefixes[0] || g.subRegion);
                    document
                      .getElementById('cep-lookup-card')
                      ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }}
                  className="w-full text-left p-4 space-y-1.5 hover:bg-white/[0.025] cursor-pointer transition-colors"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium text-sm text-white">{g.macroRegion}</span>
                    <span className="font-mono text-xs text-cyan-300 shrink-0">{g.subRegion}</span>
                  </div>
                  <div className="text-xs text-slate-300">
                    Setores: {g.sectors.join(' · ')} · CEP {g.cepPrefixes.join(', ')}
                  </div>
                  <div className="text-xs text-slate-400 leading-relaxed">
                    {g.neighborhoods.join(', ')} ({g.cities.join(', ')})
                  </div>
                </button>
              ))}
            </div>

            {/* Tabela Desktop (>= md) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/[0.08] text-xs text-slate-400">
                    <th className="py-3.5 px-5 font-medium">Região</th>
                    <th className="py-3.5 px-3 font-medium">Sub-região</th>
                    <th className="py-3.5 px-3 font-medium">Setores</th>
                    <th className="py-3.5 px-3 font-medium">Prefixos CEP</th>
                    <th className="py-3.5 px-5 font-medium">Bairros e Cidades</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.06] text-[13px]">
                  {geoHierarchy.map((g) => (
                    <tr
                      key={g.id}
                      onClick={() => setGeoQuery(g.cepPrefixes[0] || g.subRegion)}
                      className="hover:bg-white/[0.025] cursor-pointer transition-colors"
                    >
                      <td className="py-3.5 px-5 font-medium text-white">{g.macroRegion}</td>
                      <td className="py-3.5 px-3 font-mono text-xs text-cyan-300">
                        {g.subRegion}
                      </td>
                      <td className="py-3.5 px-3 text-slate-200">{g.sectors.join(' · ')}</td>
                      <td className="py-3.5 px-3 font-mono text-xs text-slate-300 tabular-nums">
                        {g.cepPrefixes.join(', ')}
                      </td>
                      <td className="py-3.5 px-5 text-slate-400 leading-relaxed">
                        {g.neighborhoods.join(', ')} ({g.cities.join(', ')})
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      )}
    </div>
  );
};
