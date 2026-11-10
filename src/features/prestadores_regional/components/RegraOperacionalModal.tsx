import React, { useState, useEffect } from 'react';
import { X, ShieldAlert, Save } from 'lucide-react';
import { RegraOperacionalItem } from '../types';

interface RegraOperacionalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (item: RegraOperacionalItem) => void;
  editingItem: RegraOperacionalItem | null;
}

export const RegraOperacionalModal: React.FC<RegraOperacionalModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingItem,
}) => {
  const [titulo, setTitulo] = useState('');
  const [subtitulo, setSubtitulo] = useState('');
  const [categoria, setCategoria] = useState<'horario' | 'domingos' | 'encaixe' | 'pagamento' | 'pre_agendado'>('horario');
  const [destaqueCor, setDestaqueCor] = useState<'blue' | 'amber' | 'emerald' | 'rose' | 'purple'>('blue');
  const [alerta, setAlerta] = useState('');
  const [itensRaw, setItensRaw] = useState('');
  const [textoCopiaAtendente, setTextoCopiaAtendente] = useState('');

  useEffect(() => {
    if (editingItem) {
      setTitulo(editingItem.titulo);
      setSubtitulo(editingItem.subtitulo);
      setCategoria(editingItem.categoria);
      setDestaqueCor(editingItem.destaqueCor || 'blue');
      setAlerta(editingItem.alerta || '');
      setItensRaw(editingItem.itens.join('\n'));
      setTextoCopiaAtendente(editingItem.textoCopiaAtendente || '');
    } else {
      setTitulo('');
      setSubtitulo('');
      setCategoria('horario');
      setDestaqueCor('blue');
      setAlerta('');
      setItensRaw('');
      setTextoCopiaAtendente('');
    }
  }, [editingItem, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!titulo.trim()) return;

    const itensParsed = itensRaw
      .split('\n')
      .map((i) => i.trim())
      .filter(Boolean);

    const saved: RegraOperacionalItem = {
      id: editingItem ? editingItem.id : `regra-${Date.now()}`,
      titulo: titulo.trim(),
      subtitulo: subtitulo.trim() || 'Diretriz operacional Dr. Monitora',
      categoria,
      destaqueCor,
      alerta: alerta.trim() || undefined,
      itens: itensParsed.length > 0 ? itensParsed : ['Diretriz em vigor conforme manual de operações.'],
      textoCopiaAtendente: textoCopiaAtendente.trim() || undefined,
      icone: editingItem ? editingItem.icone : 'ShieldAlert',
    };

    onSave(saved);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#0e1628] border border-slate-700/80 rounded-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800 sticky top-0 bg-[#0e1628] z-10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-600/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                {editingItem ? 'Editar Regra Operacional' : 'Nova Regra Operacional'}
              </h3>
              <p className="text-xs text-slate-400">
                Diretrizes críticas de agendamento, horário fixo, domingo, PIX e encaixes
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-4 flex-1">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300">
              Título da Regra <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Ex: Horários de Atendimento & Horário Fixo (R$ 100,00)"
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300">Subtítulo / Resumo</label>
            <input
              type="text"
              value={subtitulo}
              onChange={(e) => setSubtitulo(e.target.value)}
              placeholder="Ex: Política oficial sobre previsão de chegada e contratação"
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">Categoria</label>
              <select
                value={categoria}
                onChange={(e) => setCategoria(e.target.value as any)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-blue-500"
              >
                <option value="horario">Horário / Agendamento</option>
                <option value="domingos">Domingos e Feriados</option>
                <option value="encaixe">Encaixes</option>
                <option value="pagamento">Pagamento e PIX</option>
                <option value="pre_agendado">Pré-Agendados e Frustração</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">Cor de Destaque</label>
              <select
                value={destaqueCor}
                onChange={(e) => setDestaqueCor(e.target.value as any)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-blue-500"
              >
                <option value="blue">Azul (Padrão)</option>
                <option value="amber">Âmbar (Atenção/PIX)</option>
                <option value="rose">Rosa / Vermelho (Restrito/Domingo)</option>
                <option value="emerald">Verde (Isenção/Vantagem)</option>
                <option value="purple">Roxo (Encaixes)</option>
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300">
              Alerta de Destaque / Caixa Amarela (opcional)
            </label>
            <input
              type="text"
              value={alerta}
              onChange={(e) => setAlerta(e.target.value)}
              placeholder="Ex: Qualquer promessa de horário prioritário sem os R$ 100 gera advertência."
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300">
              Itens da Regra (um por linha) <span className="text-rose-400">*</span>
            </label>
            <textarea
              required
              rows={5}
              value={itensRaw}
              onChange={(e) => setItensRaw(e.target.value)}
              placeholder="Digite cada norma em uma linha..."
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white font-mono focus:outline-none focus:border-blue-500 leading-relaxed"
            />
            <span className="text-xs text-slate-400 block">
              Pressione Enter para criar novos pontos de instrução.
            </span>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300">
              Texto Pronto para Copiar e Enviar ao Cliente / Vendedor
            </label>
            <textarea
              rows={3}
              value={textoCopiaAtendente}
              onChange={(e) => setTextoCopiaAtendente(e.target.value)}
              placeholder="Mensagem formatada e educada pronta para o atendente copiar no WhatsApp..."
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-blue-500 leading-relaxed"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white transition-colors shadow-sm"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Salvar Regra</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
