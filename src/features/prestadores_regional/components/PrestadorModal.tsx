import React, { useState, useEffect } from 'react';
import { Prestador } from '../types';
import { X, CheckCircle, UserPlus, Save } from 'lucide-react';
import { WhatsAppIcon } from './WhatsAppIcon';
import { getWhatsAppUrl, cleanPhoneNumber, openWhatsApp, WHATSAPP_TAB_NAME } from '../utils/whatsapp';

interface PrestadorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (prestador: Prestador) => void;
  editingPrestador?: Prestador | null;
  knownRegions: string[];
}

export const PrestadorModal: React.FC<PrestadorModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingPrestador,
  knownRegions,
}) => {
  const [codigo, setCodigo] = useState('');
  const [nome, setNome] = useState('');
  const [regiao, setRegiao] = useState('');
  const [telefone, setTelefone] = useState('');
  const [observacao, setObservacao] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (editingPrestador) {
      setCodigo(editingPrestador.codigo);
      setNome(editingPrestador.nome);
      setRegiao(editingPrestador.regiao);
      setTelefone(editingPrestador.telefone || '');
      setObservacao(editingPrestador.observacao || '');
    } else {
      setCodigo('');
      setNome('');
      setRegiao('');
      setTelefone('');
      setObservacao('');
    }
    setError(null);
  }, [editingPrestador, isOpen]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!codigo.trim() || !nome.trim() || !regiao.trim()) {
      setError('Preencha os campos obrigatórios: Código, Nome e Região.');
      return;
    }

    const payload: Prestador = {
      id: editingPrestador ? editingPrestador.id : Date.now().toString(),
      codigo: codigo.trim().toUpperCase(),
      nome: nome.trim().toUpperCase(),
      regiao: regiao.trim().toUpperCase(),
      telefone: telefone.trim() || undefined,
      observacao: observacao.trim() || undefined,
    };

    onSave(payload);
    onClose();
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm animate-fadeIn"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-[#121929] border border-slate-700/80 rounded-2xl w-full max-w-sm sm:max-w-md shadow-2xl overflow-hidden flex flex-col animate-slideUp"
      >
        {/* Header - Compact */}
        <div className="bg-[#182338] px-4 py-3 border-b border-slate-700/70 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-blue-600/20 text-blue-400">
              {editingPrestador ? <Save className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
            </div>
            <h2 className="text-sm font-bold text-white">
              {editingPrestador ? 'Editar Prestador' : 'Adicionar Novo Prestador'}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700/60 transition-colors"
            title="Fechar (ou clique fora)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form - Compact & Clean */}
        <form onSubmit={handleSubmit} className="p-4 space-y-3">
          {error && (
            <div className="p-2.5 rounded-lg bg-red-500/15 border border-red-500/30 text-red-300 text-xs font-medium">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
                Código <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                required
                value={codigo}
                onChange={(e) => setCodigo(e.target.value)}
                placeholder="Ex: 18890"
                className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-white font-mono text-xs focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
                Região / Base <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                required
                list="regioes-list"
                value={regiao}
                onChange={(e) => setRegiao(e.target.value)}
                placeholder="Ex: OESTE 1"
                className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-white font-mono text-xs uppercase focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
              />
              <datalist id="regioes-list">
                {knownRegions.map((r) => (
                  <option key={r} value={r} />
                ))}
              </datalist>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
              Nome do Prestador <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              required
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex: RICARDO N. GODOY"
              className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs uppercase focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                Telefone / WhatsApp
              </label>
              {cleanPhoneNumber(telefone) && (
                <a
                  href={getWhatsAppUrl(telefone, nome, codigo)}
                  target={WHATSAPP_TAB_NAME}
                  rel="noopener noreferrer"
                  onClick={(e) => {
                    e.preventDefault();
                    openWhatsApp(telefone, nome, codigo);
                  }}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30 transition-all cursor-pointer"
                  title="Abrir na aba do WhatsApp (reutiliza a aba já aberta)"
                >
                  <WhatsAppIcon className="w-3.5 h-3.5" />
                  <span>Testar WhatsApp</span>
                </a>
              )}
            </div>
            <input
              type="text"
              value={telefone}
              onChange={(e) => setTelefone(e.target.value)}
              placeholder="Ex: (11) 98765-4321"
              className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-white font-mono text-xs focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
              Observações (Opcional)
            </label>
            <input
              type="text"
              value={observacao}
              onChange={(e) => setObservacao(e.target.value)}
              placeholder="Detalhes adicionais, turno, veículo..."
              className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
            />
          </div>

          {/* Quick presets for region */}
          <div className="pt-0.5">
            <span className="block text-xs text-slate-400 mb-1">
              Sugestões rápidas:
            </span>
            <div className="flex flex-wrap gap-1">
              {['LESTE 1', 'OESTE 1', 'NORTE 1', 'SUL 1', 'CAMPINAS 1', 'ABC 1'].map((reg) => (
                <button
                  key={reg}
                  type="button"
                  onClick={() => setRegiao(reg)}
                  className="px-2.5 py-1 text-xs rounded-md bg-slate-800/80 text-slate-300 border border-slate-700/80 hover:bg-slate-700 hover:text-white transition-colors"
                >
                  {reg}
                </button>
              ))}
            </div>
          </div>

          {/* Footer buttons */}
          <div className="pt-2.5 border-t border-slate-800 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-xs rounded-xl font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 text-xs rounded-xl font-semibold bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-600/30 flex items-center gap-1.5 transition-all"
            >
              <CheckCircle className="w-3.5 h-3.5" />
              <span>{editingPrestador ? 'Salvar' : 'Cadastrar'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
