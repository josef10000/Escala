import React, { useState } from 'react';
import { X, Copy, Check, Sparkles } from 'lucide-react';

interface TemplateFormFillerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCopySuccess: (text: string) => void;
}

export const TemplateFormFillerModal: React.FC<TemplateFormFillerModalProps> = ({
  isOpen,
  onClose,
  onCopySuccess,
}) => {
  const [placa, setPlaca] = useState('');
  const [nome, setNome] = useState('');
  const [telefone, setTelefone] = useState('');
  const [endereco, setEndereco] = useState('');
  const [cidade, setCidade] = useState('');
  const [bairro, setBairro] = useState('');
  const [cep, setCep] = useState('');
  const [regiao, setRegiao] = useState('');
  const [dataDesejada, setDataDesejada] = useState('');
  const [isCopied, setIsCopied] = useState(false);

  if (!isOpen) return null;

  const generateFilledText = () => {
    return `Placa: ${placa}
Nome: ${nome}
Telefone: ${telefone}
Endereço com nº: ${endereco}
Cidade: ${cidade}
Bairro: ${bairro}
CEP: ${cep}
Região do técnico: ${regiao}
Data desejada para o agendamento: ${dataDesejada}`;
  };

  const handleCopy = () => {
    const text = generateFilledText();
    navigator.clipboard.writeText(text);
    setIsCopied(true);
    onCopySuccess('Formulário de Encaixe preenchido copiado com sucesso!');
    setTimeout(() => {
      setIsCopied(false);
      onClose();
    }, 1200);
  };

  const handleClear = () => {
    setPlaca('');
    setNome('');
    setTelefone('');
    setEndereco('');
    setCidade('');
    setBairro('');
    setCep('');
    setRegiao('');
    setDataDesejada('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-lg bg-[#0e1628] border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-600/20 text-emerald-400 border border-emerald-500/30">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-tight">
                Preenchimento Rápido de Encaixe
              </h3>
              <p className="text-xs text-slate-400">
                Preencha os dados e copie o bloco formatado para colar no chat
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Fields */}
        <div className="p-5 space-y-3 text-xs overflow-y-auto max-h-[70vh]">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Placa do Veículo</label>
              <input
                type="text"
                value={placa}
                onChange={(e) => setPlaca(e.target.value.toUpperCase())}
                placeholder="Ex: ABC1D23"
                className="w-full px-3 py-1.5 bg-slate-900 text-white rounded-lg border border-slate-800 focus:border-emerald-500 focus:outline-none font-mono"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Nome do Cliente</label>
              <input
                type="text"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Ex: João da Silva"
                className="w-full px-3 py-1.5 bg-slate-900 text-white rounded-lg border border-slate-800 focus:border-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Telefone / WhatsApp</label>
              <input
                type="text"
                value={telefone}
                onChange={(e) => setTelefone(e.target.value)}
                placeholder="Ex: (11) 98888-7777"
                className="w-full px-3 py-1.5 bg-slate-900 text-white rounded-lg border border-slate-800 focus:border-emerald-500 focus:outline-none font-mono"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Região do Técnico</label>
              <input
                type="text"
                value={regiao}
                onChange={(e) => setRegiao(e.target.value.toUpperCase())}
                placeholder="Ex: LESTE 1, OESTE, ABC"
                className="w-full px-3 py-1.5 bg-slate-900 text-white rounded-lg border border-slate-800 focus:border-emerald-500 focus:outline-none uppercase font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">Endereço com Nº</label>
            <input
              type="text"
              value={endereco}
              onChange={(e) => setEndereco(e.target.value)}
              placeholder="Ex: Av. Paulista, 1000 - Apto 42"
              className="w-full px-3 py-1.5 bg-slate-900 text-white rounded-lg border border-slate-800 focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Bairro</label>
              <input
                type="text"
                value={bairro}
                onChange={(e) => setBairro(e.target.value)}
                placeholder="Ex: Bela Vista"
                className="w-full px-3 py-1.5 bg-slate-900 text-white rounded-lg border border-slate-800 focus:border-emerald-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Cidade</label>
              <input
                type="text"
                value={cidade}
                onChange={(e) => setCidade(e.target.value)}
                placeholder="Ex: São Paulo"
                className="w-full px-3 py-1.5 bg-slate-900 text-white rounded-lg border border-slate-800 focus:border-emerald-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-semibold mb-1">CEP</label>
              <input
                type="text"
                value={cep}
                onChange={(e) => setCep(e.target.value)}
                placeholder="Ex: 01310-100"
                className="w-full px-3 py-1.5 bg-slate-900 text-white rounded-lg border border-slate-800 focus:border-emerald-500 focus:outline-none font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">Data Desejada</label>
            <input
              type="text"
              value={dataDesejada}
              onChange={(e) => setDataDesejada(e.target.value)}
              placeholder="Ex: 10/10/2026 - Período da manhã"
              className="w-full px-3 py-1.5 bg-slate-900 text-white rounded-lg border border-slate-800 focus:border-emerald-500 focus:outline-none"
            />
          </div>

          {/* Live Preview */}
          <div className="mt-3 p-3 bg-slate-950 rounded-xl border border-slate-800 font-mono text-xs text-slate-300 whitespace-pre-wrap leading-relaxed">
            {generateFilledText()}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-800 flex items-center justify-between gap-2 bg-[#0c1322]">
          <button
            type="button"
            onClick={handleClear}
            className="px-3 py-2 text-slate-400 hover:text-slate-200 text-xs font-medium hover:underline"
          >
            Limpar Campos
          </button>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 font-medium transition-colors"
            >
              Fechar
            </button>
            <button
              type="button"
              onClick={handleCopy}
              className={`px-4 py-2 rounded-xl font-bold flex items-center gap-1.5 transition-all shadow-md active:scale-[0.98] ${
                isCopied
                  ? 'bg-emerald-600 text-white'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-950/40'
              }`}
            >
              {isCopied ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Copiado com Sucesso!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Copiar Formulário Preenchido</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
