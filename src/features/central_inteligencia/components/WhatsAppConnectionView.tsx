import React, { useEffect, useMemo, useState } from 'react';
import {
  QrCode,
  RefreshCw,
  CheckCircle2,
  WifiOff,
  Copy,
  Check,
  CornerDownRight,
} from 'lucide-react';
import {
  CentralOperationalConfig,
  RawWhatsAppMessage,
  WhatsAppConnectionStatus,
  WhatsAppGroupKey,
} from '../types';

interface WhatsAppConnectionViewProps {
  connectionStatus: WhatsAppConnectionStatus;
  onChangeConnectionStatus: (status: WhatsAppConnectionStatus) => void;
  instanceName: string;
  onChangeInstanceName: (name: string) => void;
  connectedPhone: string;
  monitoredGroups: Record<WhatsAppGroupKey, boolean>;
  onToggleGroup: (group: WhatsAppGroupKey) => void;
  rawMessages: RawWhatsAppMessage[];
  onSimulateIncomingMessage: (group: WhatsAppGroupKey) => void;
  config: CentralOperationalConfig;
  onUpdateConfig: (next: CentralOperationalConfig) => void;
}

function buildQrMatrix(seed: string): boolean[][] {
  const size = 25;
  const grid: boolean[][] = Array.from({ length: size }, () => Array(size).fill(false));

  const drawFinder = (r0: number, c0: number) => {
    for (let r = 0; r < 7; r++) {
      for (let c = 0; c < 7; c++) {
        const isBorder = r === 0 || r === 6 || c === 0 || c === 6;
        const isCenter = r >= 2 && r <= 4 && c >= 2 && c <= 4;
        grid[r0 + r][c0 + c] = isBorder || isCenter;
      }
    }
  };

  drawFinder(0, 0);
  drawFinder(0, size - 7);
  drawFinder(size - 7, 0);

  let hash = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    hash ^= seed.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const inTopLeft = r < 8 && c < 8;
      const inTopRight = r < 8 && c >= size - 8;
      const inBottomLeft = r >= size - 8 && c < 8;
      if (inTopLeft || inTopRight || inBottomLeft) continue;
      if (r === 6 || c === 6) {
        grid[r][c] = (r + c) % 2 === 0;
        continue;
      }
      hash ^= (r * 31 + c * 17) & 0xff;
      hash = Math.imul(hash, 16777619);
      grid[r][c] = (Math.abs(hash) % 100) < 48;
    }
  }

  return grid;
}

export const WhatsAppConnectionView: React.FC<WhatsAppConnectionViewProps> = ({
  connectionStatus,
  onChangeConnectionStatus,
  instanceName,
  onChangeInstanceName,
  connectedPhone,
  monitoredGroups,
  onToggleGroup,
  rawMessages,
  onSimulateIncomingMessage,
  config,
  onUpdateConfig,
}) => {
  const [qrSeed, setQrSeed] = useState<string>(() => `ominihub-evo-${Date.now()}`);
  const [qrSecondsLeft, setQrSecondsLeft] = useState<number>(45);
  const [groupFilter, setGroupFilter] = useState<'all' | WhatsAppGroupKey>('all');
  const [copiedWebhook, setCopiedWebhook] = useState(false);

  useEffect(() => {
    if (connectionStatus !== 'qr_pending') return;
    const timer = setInterval(() => {
      setQrSecondsLeft((prev) => {
        if (prev <= 1) {
          setQrSeed(`ominihub-evo-${Date.now()}`);
          return 45;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [connectionStatus]);

  const qrMatrix = useMemo(() => buildQrMatrix(qrSeed), [qrSeed]);

  const handleGenerateQr = () => {
    setQrSeed(`ominihub-evo-${Date.now()}`);
    setQrSecondsLeft(45);
    onChangeConnectionStatus('qr_pending');
  };

  const handleSimulateScan = () => {
    onChangeConnectionStatus('connecting');
    setTimeout(() => {
      onChangeConnectionStatus('connected');
    }, 850);
  };

  const handleCopyWebhook = () => {
    navigator.clipboard?.writeText('https://api.ominihub.local/webhooks/evolution/whatsapp-groups');
    setCopiedWebhook(true);
    setTimeout(() => setCopiedWebhook(false), 1800);
  };

  const filteredMessages = useMemo(() => {
    if (groupFilter === 'all') return rawMessages;
    return rawMessages.filter((m) => m.group === groupFilter);
  }, [rawMessages, groupFilter]);

  const groups: WhatsAppGroupKey[] = [
    'ENCAIXES MESMO DIA',
    'EQUIPE TÉCNICA',
    'AGENDAS E MUDANÇAS',
  ];

  return (
    <div className="space-y-6">
      <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 border-b border-white/[0.08] pb-5">
        <div>
          <h2 className="text-2xl font-semibold text-white">Conexão WhatsApp e Parâmetros</h2>
          <p className="text-sm text-slate-400 mt-1 leading-relaxed">
            Pareamento via QR Code da instância observadora, grupos autorizados e regras operacionais.
          </p>
        </div>

        <span className="text-xs text-amber-300 font-medium shrink-0">
          Simulação interativa de front-end
        </span>
      </header>

      {/* QR Code + Grupos */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-stretch">
        {/* Instância & QR Code */}
        <section className="xl:col-span-5 bg-[#0e1016] border border-white/[0.08] rounded-2xl p-6 flex flex-col justify-between gap-6">
          <div className="space-y-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-semibold text-white">Instância Evolution API</h3>
                <p className="text-[13px] text-slate-400 mt-0.5">Leitura passiva sem envio</p>
              </div>

              <div className="flex items-center gap-1.5 text-xs font-semibold shrink-0">
                {connectionStatus === 'connected' && (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span className="text-emerald-400">Conectado</span>
                  </>
                )}
                {connectionStatus === 'qr_pending' && (
                  <>
                    <QrCode className="w-4 h-4 text-amber-400" />
                    <span className="text-amber-300">Aguardando QR</span>
                  </>
                )}
                {connectionStatus === 'connecting' && (
                  <>
                    <RefreshCw className="w-4 h-4 text-cyan-400 animate-spin" />
                    <span className="text-cyan-300">Pareando...</span>
                  </>
                )}
                {(connectionStatus === 'disconnected' || connectionStatus === 'error') && (
                  <>
                    <WifiOff className="w-4 h-4 text-rose-400" />
                    <span className="text-rose-400">
                      {connectionStatus === 'error' ? 'Falha' : 'Desconectado'}
                    </span>
                  </>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[13px]">
              <div>
                <label className="block text-xs text-slate-400 mb-1.5">Nome da instância</label>
                <input
                  type="text"
                  value={instanceName}
                  onChange={(e) => onChangeInstanceName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#090A0F] border border-white/[0.1] font-mono text-xs text-white focus:border-[#00d2d3] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1.5">Webhook de eventos</label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    readOnly
                    value="/webhooks/evolution/whatsapp-groups"
                    className="w-full px-3 py-2 rounded-xl bg-[#090A0F] border border-white/[0.1] font-mono text-xs text-slate-300 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleCopyWebhook}
                    className="p-2 rounded-xl bg-[#090A0F] hover:bg-white/[0.08] border border-white/[0.1] text-slate-300 cursor-pointer shrink-0"
                    title="Copiar webhook"
                  >
                    {copiedWebhook ? (
                      <Check className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Bloco do QR Code sem caixa aninhada pesada */}
            <div className="border-t border-white/[0.07] pt-5 flex flex-col sm:flex-row items-center gap-5">
              {connectionStatus === 'connected' ? (
                <div className="w-36 h-36 rounded-2xl border border-emerald-500/30 bg-emerald-500/[0.06] flex flex-col items-center justify-center text-center p-4 shrink-0">
                  <CheckCircle2 className="w-9 h-9 text-emerald-400 mb-2" />
                  <span className="text-[13px] font-semibold text-white">Sessão Ativa</span>
                  <span className="text-xs font-mono text-emerald-300 mt-1 tabular-nums">
                    {connectedPhone}
                  </span>
                </div>
              ) : connectionStatus === 'qr_pending' || connectionStatus === 'connecting' ? (
                <div className="relative bg-white p-2.5 rounded-xl shrink-0">
                  <svg
                    viewBox="0 0 25 25"
                    className={`w-36 h-36 transition-opacity ${
                      connectionStatus === 'connecting' ? 'opacity-40' : 'opacity-100'
                    }`}
                    shapeRendering="crispEdges"
                  >
                    <rect width="25" height="25" fill="#ffffff" />
                    {qrMatrix.map((row, r) =>
                      row.map((cell, c) =>
                        cell ? (
                          <rect key={`${r}-${c}`} x={c} y={r} width="1" height="1" fill="#090A0F" />
                        ) : null
                      )
                    )}
                  </svg>
                  {connectionStatus === 'connecting' && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <RefreshCw className="w-7 h-7 text-slate-900 animate-spin" />
                    </div>
                  )}
                </div>
              ) : (
                <div className="w-36 h-36 rounded-2xl border border-dashed border-white/20 flex flex-col items-center justify-center text-center p-4 shrink-0">
                  <QrCode className="w-8 h-8 text-slate-500 mb-2" />
                  <span className="text-xs font-medium text-slate-300">QR não gerado</span>
                </div>
              )}

              <div className="flex-1 space-y-2 text-[13px]">
                {connectionStatus === 'connected' ? (
                  <>
                    <h4 className="text-sm font-semibold text-white">
                      Número conectado aos grupos
                    </h4>
                    <p className="text-slate-400 leading-relaxed">
                      Instância <span className="font-mono text-slate-200">{instanceName}</span> recebendo textos, áudios e imagens em modo passivo.
                    </p>
                    <div className="text-xs text-slate-400 font-mono tabular-nums pt-1">
                      {rawMessages.length} eventos registrados hoje
                    </div>
                  </>
                ) : connectionStatus === 'qr_pending' ? (
                  <>
                    <h4 className="text-sm font-semibold text-white">Parear WhatsApp</h4>
                    <ol className="text-slate-300 space-y-1.5 list-decimal list-inside leading-relaxed">
                      <li>Abra Dispositivos Conectados no aparelho</li>
                      <li>Toque em Conectar dispositivo</li>
                      <li>Aponte a câmera para este QR Code</li>
                    </ol>
                    <div className="text-xs font-mono text-amber-300 tabular-nums pt-1">
                      Renova em {qrSecondsLeft}s
                    </div>
                  </>
                ) : (
                  <>
                    <h4 className="text-sm font-semibold text-white">
                      {connectionStatus === 'error' ? 'Falha na conexão' : 'Desconectado'}
                    </h4>
                    <p className="text-slate-400 leading-relaxed">
                      Gere um novo QR Code para retomar o monitoramento dos grupos autorizados.
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 pt-4 border-t border-white/[0.07]">
            {connectionStatus !== 'connected' ? (
              <>
                <button
                  type="button"
                  onClick={handleGenerateQr}
                  className="px-4 py-2 rounded-xl bg-[#00d2d3] hover:bg-[#00e2e3] text-[#003731] text-[13px] font-semibold flex items-center gap-2 cursor-pointer transition-colors"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>{connectionStatus === 'qr_pending' ? 'Atualizar QR' : 'Gerar QR Code'}</span>
                </button>
                {connectionStatus === 'qr_pending' && (
                  <button
                    type="button"
                    onClick={handleSimulateScan}
                    className="px-4 py-2 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 text-[13px] font-medium cursor-pointer transition-colors"
                  >
                    Simular Leitura
                  </button>
                )}
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => onChangeConnectionStatus('disconnected')}
                  className="px-4 py-2 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 text-[13px] font-medium cursor-pointer transition-colors"
                >
                  Desconectar
                </button>
                <button
                  type="button"
                  onClick={() => onChangeConnectionStatus('error')}
                  className="px-3.5 py-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-slate-300 text-[13px] font-medium cursor-pointer transition-colors"
                >
                  Simular Falha
                </button>
              </>
            )}
          </div>
        </section>

        {/* Grupos Autorizados e Log */}
        <section className="xl:col-span-7 bg-[#0e1016] border border-white/[0.08] rounded-2xl p-6 flex flex-col justify-between gap-5">
          <div className="space-y-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-semibold text-white">Grupos Monitorados</h3>
                <p className="text-[13px] text-slate-400 mt-0.5">
                  Somente estes três grupos alimentam o painel, com deduplicação por ID.
                </p>
              </div>
              <span className="text-xs font-mono text-slate-400 tabular-nums shrink-0">
                {Object.values(monitoredGroups).filter(Boolean).length}/3 ativos
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-white/[0.07] border-y border-white/[0.07] py-3">
              {groups.map((grp, idx) => {
                const enabled = monitoredGroups[grp];
                const count = rawMessages.filter((m) => m.group === grp).length;
                return (
                  <div
                    key={grp}
                    className={`py-2 md:py-1 space-y-2.5 ${
                      idx === 0 ? 'md:pr-4' : idx === 1 ? 'md:px-4' : 'md:pl-4'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[13px] font-semibold text-white truncate">{grp}</span>
                      <button
                        type="button"
                        onClick={() => onToggleGroup(grp)}
                        className={`text-xs font-medium cursor-pointer transition-colors ${
                          enabled ? 'text-emerald-400' : 'text-slate-500'
                        }`}
                      >
                        {enabled ? 'Ativo' : 'Pausado'}
                      </button>
                    </div>
                    <div className="text-xs text-slate-400 font-mono tabular-nums">
                      {count} mensagens
                    </div>
                    <button
                      type="button"
                      onClick={() => onSimulateIncomingMessage(grp)}
                      disabled={connectionStatus !== 'connected' || !enabled}
                      className="text-xs font-medium text-cyan-300 hover:text-cyan-200 disabled:opacity-35 disabled:cursor-not-allowed cursor-pointer transition-colors"
                    >
                      + Simular mensagem
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Stream de Mensagens */}
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-[13px] font-medium text-slate-300">
                  Mensagens recentes recebidas
                </span>
                <div className="flex items-center gap-1 bg-[#090A0F] p-1 rounded-lg border border-white/[0.07]">
                  <button
                    type="button"
                    onClick={() => setGroupFilter('all')}
                    className={`px-2.5 py-1 rounded text-xs font-medium cursor-pointer ${
                      groupFilter === 'all' ? 'bg-white/[0.12] text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Todos
                  </button>
                  {groups.map((g) => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => setGroupFilter(g)}
                      className={`px-2.5 py-1 rounded text-xs font-medium cursor-pointer truncate max-w-[100px] ${
                        groupFilter === g ? 'bg-white/[0.12] text-white' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {g.split(' ')[0]}
                    </button>
                  ))}
                </div>
              </div>

              <div className="max-h-64 overflow-y-auto divide-y divide-white/[0.06] pr-1">
                {filteredMessages.map((msg) => (
                  <div key={msg.id} className="py-3 first:pt-1 last:pb-1 space-y-1.5">
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="font-medium text-white truncate">{msg.senderName}</span>
                        <span aria-hidden="true">·</span>
                        <span className="text-cyan-300">{msg.group}</span>
                        <span aria-hidden="true">·</span>
                        <span className="font-mono tabular-nums">
                          {new Date(msg.timestamp).toLocaleTimeString('pt-BR', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>

                      <span
                        className={`font-mono tabular-nums ${
                          msg.confidence < 70 ? 'text-amber-300' : 'text-slate-400'
                        }`}
                      >
                        {msg.aiModel} ({msg.confidence}%)
                      </span>
                    </div>

                    {msg.quotedPreview && (
                      <div className="flex items-center gap-1.5 text-xs text-slate-400 border-l border-white/20 pl-2.5">
                        <CornerDownRight className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">{msg.quotedPreview}</span>
                      </div>
                    )}

                    <p className="text-[13px] text-slate-200 leading-relaxed">{msg.text}</p>

                    {(msg.mediaNote || msg.deduplicatedCount) && (
                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
                        {msg.mediaNote && (
                          <span className={msg.mediaStatus === 'unreadable' ? 'text-rose-300' : 'text-amber-300'}>
                            {msg.mediaNote}
                          </span>
                        )}
                        {msg.deduplicatedCount && (
                          <span>{msg.deduplicatedCount} entrega(s) duplicada(s) ignorada(s)</span>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Parâmetros Operacionais e LGPD */}
      <section className="bg-[#0e1016] border border-white/[0.08] rounded-2xl p-6 space-y-4">
        <h3 className="text-base font-semibold text-white">Parâmetros e LGPD</h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 text-[13px]">
          <div>
            <label className="block text-slate-300 mb-1.5">
              Prazo para "Sem resposta" (min)
            </label>
            <div className="flex items-center gap-3">
              <input
                type="number"
                min={5}
                max={180}
                value={config.noResponseSlaMinutes}
                onChange={(e) =>
                  onUpdateConfig({
                    ...config,
                    noResponseSlaMinutes: Math.max(5, Number(e.target.value) || 30),
                  })
                }
                className="w-24 px-3 py-2 rounded-xl bg-[#090A0F] border border-white/[0.1] text-white font-mono tabular-nums focus:border-[#00d2d3] focus:outline-none"
              />
              <span className="text-xs text-slate-400">Sugerido: 30 min</span>
            </div>
          </div>

          <div>
            <label className="block text-slate-300 mb-1.5">
              Regra de Agenda Reduzida
            </label>
            <input
              type="text"
              value={config.reducedAgendaRule}
              onChange={(e) => onUpdateConfig({ ...config, reducedAgendaRule: e.target.value })}
              className="w-full px-3.5 py-2 rounded-xl bg-[#090A0F] border border-white/[0.1] text-slate-200 focus:border-[#00d2d3] focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-slate-300 mb-1.5">
              Retenção de mensagens e mídias (dias)
            </label>
            <div className="flex items-center gap-3">
              <input
                type="number"
                min={30}
                max={1825}
                value={config.retentionDays}
                onChange={(e) =>
                  onUpdateConfig({
                    ...config,
                    retentionDays: Math.max(30, Number(e.target.value) || 180),
                  })
                }
                className="w-28 px-3 py-2 rounded-xl bg-[#090A0F] border border-white/[0.1] text-white font-mono tabular-nums focus:border-[#00d2d3] focus:outline-none"
              />
              <span className="text-xs text-slate-400">Expurgo automático LGPD</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
