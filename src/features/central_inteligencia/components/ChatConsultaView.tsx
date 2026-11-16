import React, { useEffect, useRef, useState } from 'react';
import { Send, Lock, ChevronDown, ChevronUp, ArrowUpRight } from 'lucide-react';
import { Prestador } from '../../prestadores_regional/types';
import {
  ChatEvidence,
  ChatMessageItem,
  ClienteChamadoRecord,
  DailyAgendaEntry,
  EncaixeRecord,
  OcorrenciaRecord,
} from '../types';
import { computeTechnicianMetrics } from '../data/mockCentralData';

interface ChatConsultaViewProps {
  prestadores: Prestador[];
  encaixes: EncaixeRecord[];
  ocorrencias: OcorrenciaRecord[];
  dailyAgendas: DailyAgendaEntry[];
  clientes: ClienteChamadoRecord[];
  onOpenClienteTimeline: (query: string) => void;
  onOpenEncaixesByQuery: (query: string) => void;
}

const SUGGESTED_QUESTIONS = [
  'O que aconteceu com o cliente de placa ABC1D23?',
  'Quais pendências ainda estão abertas hoje?',
  'Quantos encaixes o técnico Rafael D. Carvalho recebeu?',
  'Qual é a taxa de resposta e aceite da equipe?',
  'Quais técnicos atenderam a Leste 1 hoje?',
];

export const ChatConsultaView: React.FC<ChatConsultaViewProps> = ({
  prestadores,
  encaixes,
  ocorrencias,
  dailyAgendas,
  clientes,
  onOpenClienteTimeline,
  onOpenEncaixesByQuery,
}) => {
  const [input, setInput] = useState('');
  const [expandedEvidences, setExpandedEvidences] = useState<Record<string, boolean>>({});
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const [messages, setMessages] = useState<Array<ChatMessageItem & { relatedPlate?: string; relatedQuery?: string }>>([
    {
      id: 'chat-welcome',
      role: 'assistant',
      timestamp: new Date().toISOString(),
      text: 'Consulte informações estruturadas sobre encaixes, técnicos, ocorrências e agendas do dia. Todas as respostas separam fatos registrados, estimativas e mensagens originais.',
      facts: [
        `${encaixes.length} registros de encaixes disponíveis`,
        `${ocorrencias.length} ocorrências da equipe técnica`,
        `${prestadores.length} técnicos vinculados ao cadastro`,
      ],
    },
  ]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  const answerQuestion = (
    question: string
  ): ChatMessageItem & { relatedPlate?: string; relatedQuery?: string } => {
    const q = question.toLowerCase();
    const now = new Date().toISOString();

    const matchedClient = clientes.find(
      (c) =>
        q.includes(c.plate.toLowerCase()) ||
        q.includes(c.nsu.toLowerCase()) ||
        q.includes(c.clientName.toLowerCase().split(' ')[0])
    );
    if (matchedClient) {
      const evidences: ChatEvidence[] = matchedClient.events.map((e) => ({
        group: e.sourceGroup,
        author: e.author,
        timestamp: e.timestamp,
        messageId: e.sourceMessageId,
        text: e.originalText,
      }));
      return {
        id: `ans-${Date.now()}`,
        role: 'assistant',
        timestamp: now,
        relatedPlate: matchedClient.plate,
        text: `Histórico de ${matchedClient.clientName} (${matchedClient.plate} · NSU ${matchedClient.nsu}): ${matchedClient.currentStatus}.`,
        facts: matchedClient.events.map(
          (e) =>
            `${new Date(e.timestamp).toLocaleTimeString('pt-BR', {
              hour: '2-digit',
              minute: '2-digit',
            })} (${e.sourceGroup}): ${e.consolidatedState}`
        ),
        interpretations: [
          `Confiança da associação entre grupos: ${matchedClient.matchConfidence}%.`,
        ],
        uncertainties: matchedClient.ambiguousMatchWarning
          ? [matchedClient.ambiguousMatchWarning]
          : undefined,
        evidences,
      };
    }

    const matchedTech = prestadores.find((p) => {
      const parts = p.nome.toLowerCase().split(/\s+/).filter((w) => w.length >= 4);
      return parts.some((part) => q.includes(part));
    });
    if (
      matchedTech &&
      (q.includes('técnico') ||
        q.includes('tecnico') ||
        q.includes('encaixe') ||
        q.includes('taxa'))
    ) {
      const agenda = dailyAgendas.find((a) => a.technicianId === matchedTech.id);
      const m = computeTechnicianMetrics(matchedTech, encaixes, agenda);
      const techEncaixes = encaixes.filter(
        (e) => e.technicianId === matchedTech.id || e.technicianName === matchedTech.nome
      );
      return {
        id: `ans-${Date.now()}`,
        role: 'assistant',
        timestamp: now,
        relatedQuery: matchedTech.nome,
        text: `Resumo de ${matchedTech.nome} (#${matchedTech.codigo} · Habitual: ${matchedTech.regiao}):`,
        facts: [
          `${m.totalReceived} solicitações válidas (${m.finalizedCount} finalizadas, ${m.pendingCount} pendentes fora do denominador).`,
          `${m.acceptedCount} aceite(s), ${m.refusedCount} recusa(s), ${m.noResponseCount} sem resposta.`,
          m.acceptanceRate !== null
            ? `Taxa de aceite: ${m.acceptanceRate}% · Taxa de resposta: ${m.responseRate}% · Tempo médio: ${m.avgResponseMinutes ?? '—'} min.`
            : 'Ainda não há solicitações finalizadas suficientes para calcular taxas.',
        ],
        interpretations: [
          m.estimatedAcceptProbability !== null
            ? `Probabilidade estimada de aceite: ~${m.estimatedAcceptProbability}% (${m.probabilityBasis}).`
            : `Probabilidade estimada: ${m.probabilityBasis}.`,
        ],
        evidences: techEncaixes.slice(0, 3).map((e) => ({
          group: e.sourceGroup,
          author: e.technicianName || 'Atendimento',
          timestamp: e.requestedAt,
          messageId: e.sourceMessageId,
          text: e.originalText,
        })),
      };
    }

    if (
      q.includes('pendência') ||
      q.includes('pendencia') ||
      q.includes('abertas') ||
      q.includes('retorno')
    ) {
      const pendingEncaixes = encaixes.filter(
        (e) =>
          e.status === 'tecnico_acionado' ||
          e.status === 'aguardando_validacao' ||
          e.status === 'recebido'
      );
      const openOco = ocorrencias.filter((o) => o.state !== 'resolvida');
      return {
        id: `ans-${Date.now()}`,
        role: 'assistant',
        timestamp: now,
        text: `${pendingEncaixes.length} encaixe(s) aguardando definição e ${openOco.length} ocorrência(s) em aberto.`,
        facts: [
          ...pendingEncaixes.map(
            (e) =>
              `Encaixe ${e.plate} (${e.clientName}) — ${e.status.replace(/_/g, ' ')} · ${e.technicianName || 'Não definido'}`
          ),
          ...openOco.map(
            (o) =>
              `Ocorrência ${o.plate} (${o.technicianName}) — ${o.state.replace(/_/g, ' ')}: ${o.summary}`
          ),
        ],
        uncertainties: [
          'Itens sem desfecho identificado permanecem abertos até haver confirmação explícita no grupo.',
        ],
        evidences: openOco.slice(0, 2).map((o) => ({
          group: o.sourceGroup,
          author: o.authorName,
          timestamp: o.timestamp,
          messageId: o.sourceMessageId,
          text: o.originalText,
        })),
      };
    }

    if (q.includes('leste 1') || q.includes('região') || q.includes('regiao')) {
      const habitualLeste1 = prestadores.filter((p) => p.regiao.toUpperCase().includes('LESTE 1'));
      const mudancasLeste1 = dailyAgendas.filter((a) =>
        a.dailyCoverage.toUpperCase().includes('LESTE 1')
      );
      return {
        id: `ans-${Date.now()}`,
        role: 'assistant',
        timestamp: now,
        relatedQuery: 'LESTE 1',
        text: `Cobertura identificada para Leste 1:`,
        facts: [
          `Cobertura habitual: ${habitualLeste1.map((p) => `${p.nome} (#${p.codigo})`).join(', ') || 'Nenhum'}.`,
          `Agendas de hoje apontando Leste 1: ${mudancasLeste1.map((a) => `${a.technicianName} → ${a.dailyCoverage}`).join(' | ') || 'Nenhuma'}.`,
        ],
        evidences: mudancasLeste1.map((a) => ({
          group: 'AGENDAS E MUDANÇAS',
          author: 'Coordenação Rotas',
          timestamp: a.updatedAt,
          messageId: a.id,
          text: a.rawText,
        })),
      };
    }

    if (
      q.includes('taxa') ||
      q.includes('resuma') ||
      q.includes('ocorrência') ||
      q.includes('ocorrencia')
    ) {
      const finalized = encaixes.filter(
        (e) => e.status === 'aceito' || e.status === 'recusado' || e.status === 'sem_resposta'
      );
      const acc = finalized.filter((e) => e.status === 'aceito').length;
      const rec = finalized.filter((e) => e.status === 'recusado').length;
      const sr = finalized.filter((e) => e.status === 'sem_resposta').length;
      const accRate = finalized.length ? Math.round((acc / finalized.length) * 100) : 0;
      const respRate = finalized.length ? Math.round(((acc + rec) / finalized.length) * 100) : 0;

      return {
        id: `ans-${Date.now()}`,
        role: 'assistant',
        timestamp: now,
        text: `Consolidado geral (${finalized.length} encaixes finalizados e ${ocorrencias.length} ocorrências):`,
        facts: [
          `Encaixes: ${acc} aceites (${accRate}%), ${rec} recusas, ${sr} sem resposta. Taxa de resposta: ${respRate}%.`,
          ...ocorrencias.map(
            (o) => `${o.plate} (${o.technicianName}): ${o.summary} [${o.state.replace(/_/g, ' ')}]`
          ),
        ],
        uncertainties: ocorrencias
          .filter((o) => o.needsReview)
          .map((o) => `Item em revisão (${o.sourceMessageId}): ${o.aiInterpretation}`),
      };
    }

    return {
      id: `ans-${Date.now()}`,
      role: 'assistant',
      timestamp: now,
      text: `Não encontrei evidência suficiente para responder com segurança a "${question}".`,
      uncertainties: [
        'Tente consultar por uma placa (ex: ABC1D23, FDS9K12), nome de técnico (ex: Rafael, Carlos André), sub-região (ex: Leste 1) ou pendências do dia.',
      ],
    };
  };

  const handleSend = (textToSend?: string) => {
    const query = (textToSend ?? input).trim();
    if (!query) return;

    const userMsg: ChatMessageItem = {
      id: `usr-${Date.now()}`,
      role: 'user',
      text: query,
      timestamp: new Date().toISOString(),
    };

    const assistantMsg = answerQuestion(query);
    setMessages((prev) => [...prev, userMsg, assistantMsg]);
    if (!textToSend) setInput('');
  };

  return (
    <div className="space-y-4 flex flex-col h-[calc(100vh-145px)] min-h-[460px]">
      <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 border-b border-white/[0.08] pb-4 shrink-0">
        <div>
          <h2 className="text-2xl font-semibold text-white">Consulta Operacional</h2>
          <p className="text-sm text-slate-400 mt-1 leading-relaxed">
            Pergunte sobre placas, técnicos, pendências e agendas com referência às mensagens originais.
          </p>
        </div>

        <div className="flex items-center gap-1.5 text-xs text-slate-400 shrink-0">
          <Lock className="w-3.5 h-3.5 text-cyan-400" />
          <span>Modo somente leitura</span>
        </div>
      </header>

      {/* Sugestões */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 shrink-0">
        {SUGGESTED_QUESTIONS.map((q) => (
          <button
            key={q}
            type="button"
            onClick={() => handleSend(q)}
            className="px-3.5 py-2 rounded-xl bg-[#0e1016] hover:bg-white/[0.06] border border-white/[0.08] text-[13px] text-slate-200 whitespace-nowrap shrink-0 cursor-pointer transition-colors"
          >
            {q}
          </button>
        ))}
      </div>

      {/* Área de Conversa com auto-scroll */}
      <div className="flex-1 min-h-0 overflow-y-auto bg-[#0e1016] border border-white/[0.08] rounded-2xl p-6 space-y-6">
        {messages.map((msg) => {
          const isUser = msg.role === 'user';
          const isExpanded = !!expandedEvidences[msg.id];
          return (
            <div
              key={msg.id}
              className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-3xl space-y-3 ${
                  isUser
                    ? 'bg-cyan-500/12 border border-cyan-500/25 rounded-2xl px-4 py-3 text-white'
                    : 'w-full pb-4 border-b border-white/[0.06] last:border-b-0'
                }`}
              >
                <div className="flex items-center justify-between gap-4 text-xs text-slate-400">
                  <span className="font-medium text-slate-300">
                    {isUser ? 'Você' : 'Central Operacional'}
                  </span>
                  <span className="font-mono tabular-nums">
                    {new Date(msg.timestamp).toLocaleTimeString('pt-BR', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>

                <p className="text-[15px] leading-relaxed text-slate-100">{msg.text}</p>

                {msg.facts && msg.facts.length > 0 && (
                  <div className="space-y-1.5">
                    <div className="text-xs font-semibold text-emerald-400">
                      Fatos registrados
                    </div>
                    <ul className="list-disc list-inside space-y-1 text-[13px] text-slate-300 leading-relaxed">
                      {msg.facts.map((f, i) => (
                        <li key={i}>{f}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {msg.interpretations && msg.interpretations.length > 0 && (
                  <div className="space-y-1.5">
                    <div className="text-xs font-semibold text-cyan-300">
                      Estimativas e leituras
                    </div>
                    <ul className="list-disc list-inside space-y-1 text-[13px] text-slate-300 leading-relaxed">
                      {msg.interpretations.map((it, i) => (
                        <li key={i}>{it}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {msg.uncertainties && msg.uncertainties.length > 0 && (
                  <div className="space-y-1.5">
                    <div className="text-xs font-semibold text-amber-300">Observações</div>
                    <ul className="list-disc list-inside space-y-1 text-[13px] text-amber-200/90 leading-relaxed">
                      {msg.uncertainties.map((u, i) => (
                        <li key={i}>{u}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {(msg.evidences?.length || msg.relatedPlate || msg.relatedQuery) && (
                  <div className="pt-1 flex flex-wrap items-center gap-4">
                    {msg.evidences && msg.evidences.length > 0 && (
                      <button
                        type="button"
                        onClick={() =>
                          setExpandedEvidences((prev) => ({ ...prev, [msg.id]: !isExpanded }))
                        }
                        className="text-xs font-medium text-cyan-300 hover:text-cyan-200 flex items-center gap-1.5 cursor-pointer transition-colors"
                      >
                        <span>
                          {isExpanded
                            ? 'Ocultar mensagens originais'
                            : `Ver ${msg.evidences.length} mensagem(ns) original(is)`}
                        </span>
                        {isExpanded ? (
                          <ChevronUp className="w-3.5 h-3.5" />
                        ) : (
                          <ChevronDown className="w-3.5 h-3.5" />
                        )}
                      </button>
                    )}

                    {msg.relatedPlate && (
                      <button
                        type="button"
                        onClick={() => onOpenClienteTimeline(msg.relatedPlate!)}
                        className="text-xs font-medium text-slate-300 hover:text-white flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        <span>Abrir Timeline ({msg.relatedPlate})</span>
                        <ArrowUpRight className="w-3.5 h-3.5 text-cyan-300" />
                      </button>
                    )}

                    {msg.relatedQuery && (
                      <button
                        type="button"
                        onClick={() => onOpenEncaixesByQuery(msg.relatedQuery!)}
                        className="text-xs font-medium text-slate-300 hover:text-white flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        <span>Filtrar em Encaixes</span>
                        <ArrowUpRight className="w-3.5 h-3.5 text-cyan-300" />
                      </button>
                    )}
                  </div>
                )}

                {isExpanded && msg.evidences && (
                  <div className="mt-3 space-y-3 border-l border-white/15 pl-4">
                    {msg.evidences.map((ev, i) => (
                      <div key={i} className="space-y-0.5 text-[13px]">
                        <div className="text-xs text-slate-400 font-mono tabular-nums">
                          {ev.group} · {ev.author} ·{' '}
                          {new Date(ev.timestamp).toLocaleTimeString('pt-BR', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}{' '}
                          · {ev.messageId}
                        </div>
                        <p className="text-slate-200 leading-relaxed">{ev.text}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Campo de envio */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className="flex items-center gap-3 shrink-0"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Pergunte sobre placa, técnico, região ou pendências..."
          className="flex-1 px-4 py-3 rounded-xl bg-[#0e1016] border border-white/[0.08] text-sm text-white placeholder-slate-500 focus:border-[#00d2d3] focus:outline-none"
        />
        <button
          type="submit"
          className="px-5 py-3 rounded-xl bg-[#00d2d3] hover:bg-[#00e2e3] text-[#003731] text-[13px] font-semibold flex items-center gap-2 cursor-pointer shrink-0 transition-colors"
        >
          <Send className="w-4 h-4" />
          <span>Consultar</span>
        </button>
      </form>
    </div>
  );
};
