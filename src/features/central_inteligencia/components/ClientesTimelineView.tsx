import React, { useMemo, useState } from 'react';
import {
  Search,
  AlertTriangle,
  Zap,
  AlertCircle,
  Copy,
  X,
} from 'lucide-react';
import { ClienteChamadoRecord } from '../types';

interface ClientesTimelineViewProps {
  clientes: ClienteChamadoRecord[];
  search: string;
  onSearchChange: (value: string) => void;
  onOpenEncaixeByQuery: (plateOrNsu: string) => void;
  onOpenOcorrenciasByQuery: (plateOrNsu: string) => void;
  onCopyText: (text: string, label: string) => void;
}

export const ClientesTimelineView: React.FC<ClientesTimelineViewProps> = ({
  clientes,
  search,
  onSearchChange,
  onOpenEncaixeByQuery,
  onOpenOcorrenciasByQuery,
  onCopyText,
}) => {
  const [selectedId, setSelectedId] = useState<string>(clientes[0]?.id || '');

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return clientes;
    return clientes.filter(
      (c) =>
        c.clientName.toLowerCase().includes(q) ||
        c.plate.toLowerCase().includes(q) ||
        c.nsu.toLowerCase().includes(q) ||
        c.phone.toLowerCase().includes(q)
    );
  }, [clientes, search]);

  const activeClient = useMemo(() => {
    if (search.trim() && filtered.length > 0) {
      const inFiltered = filtered.find((c) => c.id === selectedId);
      return inFiltered || filtered[0];
    }
    return clientes.find((c) => c.id === selectedId) || filtered[0] || null;
  }, [clientes, selectedId, filtered, search]);

  return (
    <div className="space-y-6">
      <header className="border-b border-white/[0.08] pb-5">
        <h2 className="text-2xl font-semibold text-white">Clientes e Linha do Tempo</h2>
        <p className="text-sm text-slate-400 mt-1 leading-relaxed">
          Histórico consolidado entre os grupos por placa, NSU, telefone e endereço, preservando registros ambíguos separados.
        </p>
      </header>

      {/* Busca */}
      <div className="relative max-w-lg">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Buscar por placa, nome, telefone ou NSU..."
          className="w-full pl-10 pr-8 py-2.5 rounded-xl bg-[#0e1016] border border-white/[0.08] text-[13px] text-white placeholder-slate-500 focus:border-[#00d2d3] focus:outline-none"
        />
        {search && (
          <button
            type="button"
            onClick={() => onSearchChange('')}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white cursor-pointer"
            aria-label="Limpar busca"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Layout Split */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* Lista de Clientes */}
        <div className="xl:col-span-4 bg-[#0e1016] border border-white/[0.08] rounded-2xl overflow-hidden divide-y divide-white/[0.06]">
          {filtered.length === 0 ? (
            <div className="p-10 text-center text-sm text-slate-400">
              Nenhum cliente ou chamado encontrado.
            </div>
          ) : (
            filtered.map((cli) => {
              const isSelected = activeClient?.id === cli.id;
              return (
                <button
                  key={cli.id}
                  type="button"
                  onClick={() => setSelectedId(cli.id)}
                  className={`w-full text-left px-5 py-4 space-y-1 cursor-pointer transition-colors ${
                    isSelected ? 'bg-cyan-500/[0.08]' : 'hover:bg-white/[0.025]'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 text-xs font-mono tabular-nums">
                    <span className="text-cyan-300 font-medium">
                      {cli.plate} · NSU {cli.nsu}
                    </span>
                    <span className="text-slate-400">{cli.matchConfidence}%</span>
                  </div>
                  <div className="text-sm font-semibold text-white truncate">
                    {cli.clientName}
                  </div>
                  <div className="text-[13px] text-slate-400 truncate">
                    {cli.currentStatus}
                  </div>
                  {cli.ambiguousMatchWarning && (
                    <div className="text-xs text-amber-300 flex items-center gap-1.5 pt-1">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                      <span>Homônimo isolado</span>
                    </div>
                  )}
                </button>
              );
            })
          )}
        </div>

        {/* Linha do Tempo */}
        <div className="xl:col-span-8 bg-[#0e1016] border border-white/[0.08] rounded-2xl p-6 space-y-5">
          {!activeClient ? (
            <div className="py-14 text-center text-sm text-slate-400">
              Selecione um cliente à esquerda para visualizar a linha do tempo.
            </div>
          ) : (
            <>
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 border-b border-white/[0.07] pb-4">
                <div>
                  <div className="text-xs font-mono text-cyan-300 tabular-nums">
                    {activeClient.plate} · NSU {activeClient.nsu} · {activeClient.phone}
                  </div>
                  <h3 className="text-xl font-semibold text-white mt-1">
                    {activeClient.clientName}
                  </h3>
                  <p className="text-[13px] text-slate-400 mt-1 leading-relaxed">
                    {activeClient.vehicle} · {activeClient.address}
                  </p>
                </div>

                <div className="sm:text-right shrink-0">
                  <div className="text-xs text-slate-400">Estado atual</div>
                  <div className="text-sm font-medium text-white mt-0.5">
                    {activeClient.currentStatus}
                  </div>
                </div>
              </div>

              {/* Ações cruzadas rápidas */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => onOpenEncaixeByQuery(activeClient.plate)}
                  className="px-3 py-1.5 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] text-xs font-medium text-slate-200 flex items-center gap-1.5 cursor-pointer transition-colors"
                >
                  <Zap className="w-3.5 h-3.5 text-cyan-300" />
                  <span>Ver no Encaixe</span>
                </button>
                <button
                  type="button"
                  onClick={() => onOpenOcorrenciasByQuery(activeClient.plate)}
                  className="px-3 py-1.5 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] text-xs font-medium text-slate-200 flex items-center gap-1.5 cursor-pointer transition-colors"
                >
                  <AlertCircle className="w-3.5 h-3.5 text-amber-300" />
                  <span>Ver Ocorrências</span>
                </button>
                <button
                  type="button"
                  onClick={() =>
                    onCopyText(
                      `${activeClient.clientName} | Placa ${activeClient.plate} | NSU ${activeClient.nsu} | Tel ${activeClient.phone} | ${activeClient.address}`,
                      `Dados de ${activeClient.plate} copiados`
                    )
                  }
                  className="px-3 py-1.5 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] text-xs font-medium text-slate-200 flex items-center gap-1.5 cursor-pointer transition-colors"
                >
                  <Copy className="w-3.5 h-3.5 text-slate-300" />
                  <span>Copiar identificação</span>
                </button>
              </div>

              {activeClient.ambiguousMatchWarning && (
                <div className="border border-amber-500/30 bg-amber-500/[0.06] rounded-xl px-4 py-3 text-[13px] text-amber-200 leading-relaxed flex items-start gap-2.5">
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold">Fusão bloqueada: </span>
                    <span className="text-amber-100/90">{activeClient.ambiguousMatchWarning}</span>
                  </div>
                </div>
              )}

              {/* Eventos em lista limpa com divisórias */}
              <div className="divide-y divide-white/[0.06]">
                {activeClient.events.map((ev, index) => (
                  <div key={ev.id} className="py-5 first:pt-1 last:pb-1 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <span className="font-mono text-xs text-slate-500 tabular-nums">
                          {String(index + 1).padStart(2, '0')}
                        </span>
                        <h4 className="text-sm font-semibold text-white">{ev.eventTitle}</h4>
                      </div>
                      <div className="font-mono text-xs text-slate-400 tabular-nums">
                        {new Date(ev.timestamp).toLocaleTimeString('pt-BR', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}{' '}
                        · <span className="text-cyan-300">{ev.sourceGroup}</span>
                      </div>
                    </div>

                    <div className="space-y-2 pl-6">
                      <p className="text-sm text-slate-200 leading-relaxed border-l border-white/15 pl-3.5">
                        {ev.originalText}
                      </p>
                      <p className="text-[13px] text-slate-400 leading-relaxed">
                        Leitura ({ev.confidence}%): {ev.aiInterpretation}
                      </p>
                      <div className="text-[13px] text-emerald-300 font-medium">
                        Estado: {ev.consolidatedState}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
