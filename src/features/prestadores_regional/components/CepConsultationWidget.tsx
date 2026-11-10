import React, { useState } from 'react';
import { PontoFixoItem } from '../types';
import { lookupCep, formatCep, CepLookupResult } from '../utils/cepLookup';
import { PontoFixoStatusBadge } from './PontoFixoStatusBadge';
import {
  Search,
  MapPin,
  Check,
  Copy,
  Sparkles,
  ExternalLink,
  Navigation,
  RotateCcw,
  ShieldCheck,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';

interface Props {
  pontosFixos: PontoFixoItem[];
  onCopySuccess?: (text: string) => void;
  className?: string;
  defaultExpanded?: boolean;
}

export const CepConsultationWidget: React.FC<Props> = ({
  pontosFixos,
  onCopySuccess,
  className = '',
  defaultExpanded = true,
}) => {
  const [cepInput, setCepInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CepLookupResult | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  const handleCopy = (key: string, text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    if (onCopySuccess) {
      onCopySuccess(`${label} copiado!`);
    }
    setTimeout(() => {
      setCopiedKey((curr) => (curr === key ? null : curr));
    }, 2000);
  };

  const handleSearch = async (targetCep?: string) => {
    const raw = targetCep || cepInput;
    const clean = raw.replace(/\D/g, '');

    if (clean.length !== 8) {
      setError('Digite um CEP válido com 8 números (ex: 01310-100).');
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      const res = await lookupCep(clean, pontosFixos);
      setResult(res);
      setCepInput(formatCep(clean));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao consultar CEP.';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = () => {
    setCepInput('');
    setResult(null);
    setError(null);
  };

  const quickExamples = [
    { label: 'SJC (Isenção Quarta)', cep: '12245-000' },
    { label: 'Litoral Norte (Isenção Quinta)', cep: '11600-000' },
    { label: 'Guarujá (Qua & Sáb)', cep: '11400-000' },
    { label: 'Guarulhos', cep: '07170-350' },
    { label: 'Barra Funda', cep: '01141-030' },
  ];

  return (
    <div
      className={`relative overflow-hidden rounded-2xl bg-[#13151c]/90 backdrop-blur-xl border border-[#1e2029] shadow-[0_12px_32px_rgba(0,0,0,0.55)] transition-all ${className}`}
    >
      {/* Specular top highlight */}
      <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent pointer-events-none" />

      {/* Header bar */}
      <div className="px-5 py-4 bg-gradient-to-r from-[#00d2d3]/10 via-[#13151c] to-[#090A0F] border-b border-[#1e2029] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#00d2d3]/15 border border-[#00d2d3]/30 text-[#00d2d3] flex items-center justify-center shrink-0 shadow-sm shadow-[#00d2d3]/10">
            <MapPin className="w-5 h-5 text-[#00d2d3]" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm font-bold text-white tracking-tight">
                Localizador Rápido de Base & Regras de KM
              </h3>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#00d2d3]/15 text-[#00d2d3] border border-[#00d2d3]/30 shadow-xs">
                ViaCEP Integrado
              </span>
            </div>
            <p className="text-xs text-zinc-400">
              Cole o CEP do cliente para identificar a base recomendada e alertas de isenção de KM
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-xs font-semibold text-zinc-300 hover:text-white px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all self-start sm:self-auto shadow-xs active:scale-95 cursor-pointer"
        >
          {isExpanded ? 'Recolher Localizador' : 'Expandir Localizador'}
        </button>
      </div>

      {isExpanded && (
        <div className="p-5 space-y-4">
          {/* Input & Form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSearch();
            }}
            className="flex flex-col sm:flex-row items-stretch gap-2.5"
          >
            <div className="relative flex-1">
              <input
                type="text"
                value={cepInput}
                onChange={(e) => {
                  const val = e.target.value;
                  setCepInput(val);
                  if (error) setError(null);
                }}
                placeholder="Cole ou digite o CEP do cliente (ex: 12245-000 ou 04776000)..."
                maxLength={10}
                className="w-full pl-10 pr-24 py-2.5 rounded-xl bg-[#090A0F] backdrop-blur-md border border-[#1e2029] text-white placeholder-zinc-500 text-xs sm:text-sm font-mono focus:outline-none focus:border-[#00d2d3] focus:ring-1 focus:ring-[#00d2d3] shadow-inner transition-all"
              />
              <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />

              {cepInput && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-400 hover:text-white px-2 py-0.5 rounded-lg bg-white/10 hover:bg-white/15 border border-white/10 transition-colors cursor-pointer"
                >
                  Limpar
                </button>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading || !cepInput.trim()}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-black bg-[#00d2d3] hover:bg-[#00e2e3] text-[#003731] shadow-md shadow-[#00d2d3]/20 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 transition-all cursor-pointer"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-[#003731]/30 border-t-[#003731] rounded-full animate-spin" />
                  <span>Consultando...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-[#003731]" />
                  <span>Localizar Base & Regras</span>
                </>
              )}
            </button>
          </form>

          {/* Quick Shortcuts */}
          <div className="flex items-center gap-1.5 flex-wrap text-xs text-slate-400">
            <span className="font-semibold text-slate-400 flex items-center gap-1">
              <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
              Exemplos rápidos:
            </span>
            {quickExamples.map((ex) => (
              <button
                key={ex.cep}
                type="button"
                onClick={() => {
                  setCepInput(ex.cep);
                  handleSearch(ex.cep);
                }}
                className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 hover:border-white/20 transition-all active:scale-95 text-[11px]"
              >
                {ex.label}
              </button>
            ))}
          </div>

          {/* Error notice */}
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-500/15 border border-rose-500/30 flex items-center gap-2.5 text-xs text-rose-200 shadow-inner">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Result Presentation */}
          {result && (
            <div className="bg-[#0B0F17] border border-slate-800 rounded-xl p-4 sm:p-5 space-y-4 animate-in fade-in duration-200">
              {/* Client Location Summary */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3.5 border-b border-slate-800/80">
                <div className="space-y-0.5">
                  <span className="text-xs uppercase font-mono text-slate-500 block">
                    Localização Identificada do Cliente
                  </span>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm sm:text-base font-bold text-white">
                      {result.bairro ? `${result.bairro}, ` : ''}
                      {result.cidade} - {result.uf}
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-slate-800 text-sky-400 font-mono text-xs font-semibold border border-slate-700">
                      CEP {result.formattedCep}
                    </span>
                  </div>
                  {result.logradouro && (
                    <p className="text-xs text-slate-400">{result.logradouro}</p>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      handleCopy('res-client-cep', result.formattedCep, 'CEP do Cliente')
                    }
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700/60 transition-colors"
                  >
                    {copiedKey === 'res-client-cep' ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-400" />
                        <span className="text-emerald-400">CEP copiado!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3 text-slate-400" />
                        <span>Copiar CEP Cliente</span>
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={handleClear}
                    className="p-1 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-slate-800 transition-colors"
                    title="Nova consulta"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Special KM Exemption / Operating Rules Alerts */}
              {result.regrasEspeciais.length > 0 && (
                <div className="space-y-2">
                  {result.regrasEspeciais.map((regra, idx) => (
                    <div
                      key={idx}
                      className={`p-3.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                        regra.isHojeAtivo
                          ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-200'
                          : 'bg-amber-950/20 border-amber-500/30 text-amber-200'
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className={`px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider ${
                              regra.isHojeAtivo
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            }`}
                          >
                            {regra.isHojeAtivo ? '🎉 HOJE ATIVO' : '⚠️ ATENÇÃO À REGRA'}
                          </span>
                          <strong className="text-xs sm:text-sm font-semibold text-white">
                            {regra.titulo}
                          </strong>
                        </div>
                        <p className="text-xs text-slate-300">{regra.descricao}</p>
                      </div>

                      <div className="shrink-0">
                        <span
                          className={`inline-block px-3 py-1 rounded-lg text-xs font-bold ${
                            regra.isHojeAtivo
                              ? 'bg-emerald-600 text-white shadow-xs'
                              : 'bg-slate-800 text-amber-300 border border-amber-500/30'
                          }`}
                        >
                          {regra.temIsencaoKm
                            ? `Isenção às ${regra.diaSemanaRecomendado}s`
                            : `Atendimento: ${regra.diaSemanaRecomendado}`}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Recommended Base Card */}
              <div className="bg-[#111827] border border-slate-800 rounded-xl p-4 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2.5">
                  <div>
                    <span className="text-xs font-bold text-sky-400 uppercase tracking-wider flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-sky-400" />
                      Ponto Fixo Recomendado
                    </span>
                    <h4 className="text-sm sm:text-base font-bold text-white mt-0.5">
                      {result.baseRecomendada.nome}
                    </h4>
                    <span className="text-xs text-slate-400">
                      {result.baseRecomendada.subtitulo}
                    </span>
                  </div>

                  {/* Real-time Open/Closed Badge! */}
                  <div className="self-start sm:self-auto">
                    <PontoFixoStatusBadge pontoFixo={result.baseRecomendada} />
                  </div>
                </div>

                <div className="text-xs text-slate-300 space-y-1 bg-[#0B0F17] p-3 rounded-lg border border-slate-800">
                  <p>
                    <strong className="text-slate-400 font-medium">Endereço:</strong>{' '}
                    {result.baseRecomendada.endereco}
                  </p>
                  
                  {/* CEP Box */}
                  <div className="flex items-center justify-between gap-2 py-1 my-1 px-2.5 bg-slate-900 border border-slate-800 rounded-md">
                    <span className="font-mono text-slate-300 text-xs">
                      📬 CEP: <strong className="text-sky-300">{result.baseRecomendada.cep}</strong>
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        handleCopy(
                          'res-base-cep',
                          result.baseRecomendada.cep,
                          `CEP ${result.baseRecomendada.cep}`
                        )
                      }
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-sky-500/10 hover:bg-sky-500/20 text-sky-300 border border-sky-500/30 transition-colors"
                      title="Copiar CEP da Base"
                    >
                      {copiedKey === 'res-base-cep' ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-400" />
                          <span className="text-emerald-400 font-semibold">Copiado</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3 text-sky-400" />
                          <span>Copiar CEP</span>
                        </>
                      )}
                    </button>
                  </div>

                  <p className="text-xs text-slate-400">
                    <strong className="text-slate-500 font-medium">Motivo:</strong>{' '}
                    {result.motivoRecomendacao}
                  </p>
                  <p className="text-xs text-slate-400">
                    <strong className="text-slate-500 font-medium">Horário:</strong>{' '}
                    {result.baseRecomendada.horarioSemana} • {result.baseRecomendada.horarioSabado}
                  </p>
                </div>

                {/* Action buttons */}
                <div className="flex flex-col sm:flex-row items-stretch gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() =>
                      handleCopy(
                        'res-whatsapp',
                        result.textoWhatsapp,
                        'Resumo completo para WhatsApp'
                      )
                    }
                    className="flex-1 inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-lg text-xs font-black bg-[#00d2d3] hover:bg-[#00e2e3] text-[#003731] transition-colors shadow-sm cursor-pointer"
                  >
                    {copiedKey === 'res-whatsapp' ? (
                      <>
                        <Check className="w-4 h-4 text-[#003731]" />
                        <span>Resumo Copiado para WhatsApp!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4 text-[#003731]" />
                        <span>Copiar Resumo para WhatsApp</span>
                      </>
                    )}
                  </button>

                  {result.baseRecomendada.mapsQuery && (
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                        result.baseRecomendada.mapsQuery
                      )}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-[#0B0F17] hover:bg-slate-800 text-slate-300 border border-slate-700/60 transition-colors"
                    >
                      <Navigation className="w-3.5 h-3.5 text-slate-400" />
                      <span>Google Maps</span>
                      <ExternalLink className="w-3 h-3 text-slate-500" />
                    </a>
                  )}

                  {result.baseRecomendada.wazeQuery && (
                    <a
                      href={result.baseRecomendada.wazeQuery}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-[#0B0F17] hover:bg-slate-800 text-slate-300 border border-slate-700/60 transition-colors"
                    >
                      <Navigation className="w-3.5 h-3.5 text-slate-400" />
                      <span>Waze</span>
                      <ExternalLink className="w-3 h-3 text-slate-500" />
                    </a>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
