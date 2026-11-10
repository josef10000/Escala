import React, { useState, useEffect } from 'react';
import { TemplateItem } from '../types';
import { X, Check, FileText } from 'lucide-react';

interface TemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (template: TemplateItem) => void;
  editingTemplate: TemplateItem | null;
  knownCategories: string[];
}

export const TemplateModal: React.FC<TemplateModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingTemplate,
  knownCategories,
}) => {
  const [categoria, setCategoria] = useState('');
  const [customCategoria, setCustomCategoria] = useState('');
  const [titulo, setTitulo] = useState('');
  const [texto, setTexto] = useState('');
  const [badge, setBadge] = useState('');

  useEffect(() => {
    if (editingTemplate) {
      setCategoria(editingTemplate.categoria);
      setCustomCategoria('');
      setTitulo(editingTemplate.titulo);
      setTexto(editingTemplate.texto);
      setBadge(editingTemplate.badge || '');
    } else {
      setCategoria(knownCategories[0] || '1. ABERTURA');
      setCustomCategoria('');
      setTitulo('');
      setTexto('');
      setBadge('');
    }
  }, [editingTemplate, isOpen, knownCategories]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalCategoria = (categoria === 'NOVA' ? customCategoria : categoria).trim() || 'GERAL';
    if (!titulo.trim() || !texto.trim()) return;

    const item: TemplateItem = {
      id: editingTemplate?.id || `tpl-${Date.now()}`,
      categoria: finalCategoria,
      titulo: titulo.trim(),
      texto: texto.trim(),
      badge: badge.trim() || undefined,
      favorito: editingTemplate?.favorito || false,
    };

    onSave(item);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-lg bg-[#0e1628] border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-tight">
                {editingTemplate ? 'Editar Template de Frase' : 'Novo Template de Frase'}
              </h3>
              <p className="text-xs text-slate-400">
                Configure os textos prontos para atendimento rápido
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

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          {/* Category */}
          <div>
            <label className="block text-slate-300 font-semibold mb-1.5">
              Categoria / Módulo
            </label>
            <select
              value={categoria}
              onChange={(e) => setCategoria(e.target.value)}
              className="w-full px-3 py-2 bg-slate-900 text-white rounded-xl border border-slate-800 focus:border-blue-500 focus:outline-none"
            >
              {knownCategories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
              <option value="NOVA">+ Criar Nova Categoria...</option>
            </select>
          </div>

          {categoria === 'NOVA' && (
            <div>
              <label className="block text-slate-300 font-semibold mb-1.5">
                Nome da Nova Categoria
              </label>
              <input
                type="text"
                required
                value={customCategoria}
                onChange={(e) => setCustomCategoria(e.target.value)}
                placeholder="Ex: 12. DÚVIDAS FREQUENTES"
                className="w-full px-3 py-2 bg-slate-900 text-white rounded-xl border border-slate-800 focus:border-blue-500 focus:outline-none"
              />
            </div>
          )}

          {/* Title & Badge */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-slate-300 font-semibold mb-1.5">
                Título do Template
              </label>
              <input
                type="text"
                required
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                placeholder="Ex: Encaixe Aprovado com Sucesso"
                className="w-full px-3 py-2 bg-slate-900 text-white rounded-xl border border-slate-800 focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1.5">
                Selo / Badge (opcional)
              </label>
              <input
                type="text"
                value={badge}
                onChange={(e) => setBadge(e.target.value)}
                placeholder="Ex: ✔️ Aprovado"
                className="w-full px-3 py-2 bg-slate-900 text-white rounded-xl border border-slate-800 focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Text Message */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-slate-300 font-semibold">
                Texto da Mensagem (Conteúdo para Cópia)
              </label>
              <span className="text-xs text-blue-400 font-medium">
                💡 Ajusta Bom dia/Boa tarde/Boa noite sozinho
              </span>
            </div>
            <textarea
              required
              rows={6}
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              placeholder="Digite ou cole aqui a mensagem que será enviada no atendimento (ex: 'Boa tarde! Estou verificando seu atendimento...')"
              className="w-full px-3 py-2.5 bg-slate-900 text-white rounded-xl border border-slate-800 focus:border-blue-500 focus:outline-none font-mono text-xs leading-relaxed resize-y"
            />
            <p className="text-xs text-slate-400 mt-1">
              Saudações como <code>Bom dia</code>, <code>Boa tarde</code> ou <code>Boa noite</code> mudarão automaticamente de acordo com a hora do atendimento.
            </p>
          </div>

          {/* Buttons */}
          <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 font-medium transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold flex items-center gap-1.5 shadow-sm transition-colors"
            >
              <Check className="w-3.5 h-3.5" />
              <span>{editingTemplate ? 'Salvar Alterações' : 'Criar Template'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
