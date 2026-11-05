import React, { useState } from 'react';
import { useSchedule } from '../../context/ScheduleContext';
import { X, Megaphone, Plus, Trash2, AlertTriangle, CheckCircle2 } from 'lucide-react';

interface AnnouncementsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AnnouncementsModal: React.FC<AnnouncementsModalProps> = ({ isOpen, onClose }) => {
  const { announcements, addAnnouncement, deleteAnnouncement, role, leaderName } = useSchedule();
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [priority, setPriority] = useState<'normal' | 'urgent'>('normal');
  const [isAdding, setIsAdding] = useState(false);

  if (!isOpen) return null;

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) return;

    addAnnouncement({
      title: title.trim(),
      message: message.trim(),
      priority,
      authorName: leaderName || 'Liderança',
    });

    setTitle('');
    setMessage('');
    setPriority('normal');
    setIsAdding(false);
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200 cursor-pointer"
    >
      <div
        onClick={e => e.stopPropagation()}
        className="bg-[#0e1017] text-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] flex flex-col overflow-hidden border border-white/[0.09] cursor-default"
      >
        {/* Header */}
        <div className="p-5 border-b border-white/[0.08] bg-[#12141c] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 flex items-center justify-center font-bold">
              <Megaphone className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white tracking-tight">
                Mural de Avisos & Comunicados
              </h3>
              <p className="text-xs text-neutral-400 font-medium">
                Informes da liderança e diretrizes operacionais para a equipe
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-white/[0.06] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1 text-xs">
          {role === 'supervisor' && !isAdding && (
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setIsAdding(true)}
                className="px-4 py-2 bg-[#00d2d3] hover:bg-[#57f1db] text-[#003731] font-bold rounded-xl flex items-center gap-1.5 transition-all shadow-md shadow-[#00d2d3]/20 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Novo Comunicado</span>
              </button>
            </div>
          )}

          {isAdding && role === 'supervisor' && (
            <form onSubmit={handleCreate} className="p-4 rounded-xl bg-[#141720] border border-white/[0.08] space-y-3">
              <div className="flex items-center justify-between border-b border-white/[0.06] pb-2">
                <span className="font-semibold text-cyan-400 uppercase tracking-wider text-[11px]">Novo Comunicado Oficial</span>
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="text-neutral-400 hover:text-white text-xs cursor-pointer"
                >
                  Cancelar
                </button>
              </div>

              <div>
                <label className="block text-neutral-300 font-semibold mb-1">Título do Aviso</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="Ex: Atualização de protocolos de plantão..."
                  className="w-full px-3.5 py-2.5 bg-[#1b1f2b] border border-white/[0.08] rounded-xl text-white focus:outline-none focus:border-[#00d2d3]/50"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-neutral-300 font-semibold mb-1">Prioridade</label>
                  <select
                    value={priority}
                    onChange={e => setPriority(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 bg-[#1b1f2b] border border-white/[0.08] rounded-xl text-white font-medium focus:outline-none focus:border-[#00d2d3]/50 cursor-pointer"
                  >
                    <option value="normal" className="bg-[#12141c]">Informativo Normal</option>
                    <option value="urgent" className="bg-[#12141c]">⚠️ Urgente / Atenção</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-neutral-300 font-semibold mb-1">Mensagem Detalhada</label>
                <textarea
                  rows={3}
                  required
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  placeholder="Descreva o comunicado..."
                  className="w-full p-3.5 bg-[#1b1f2b] border border-white/[0.08] rounded-xl text-white placeholder:text-neutral-500 focus:outline-none focus:border-[#00d2d3]/50 resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#00d2d3] hover:bg-[#57f1db] text-[#003731] font-bold rounded-xl transition-all shadow-md shadow-[#00d2d3]/20 cursor-pointer"
                >
                  Publicar Aviso
                </button>
              </div>
            </form>
          )}

          {/* Announcements list */}
          <div className="space-y-3">
            {announcements.length === 0 ? (
              <div className="p-8 text-center bg-[#141720] rounded-xl border border-white/[0.06] text-neutral-400 space-y-2">
                <Megaphone className="w-8 h-8 text-neutral-500 mx-auto" />
                <p className="font-semibold text-white">Nenhum aviso publicado</p>
                <p className="text-neutral-400">A liderança ainda não publicou comunicados neste mural.</p>
              </div>
            ) : (
              announcements.map(item => (
                <div
                  key={item.id}
                  className={`p-4 rounded-xl border space-y-2 transition-all ${
                    item.priority === 'urgent'
                      ? 'bg-amber-500/10 border-amber-500/30 text-amber-200'
                      : 'bg-[#141720] border-white/[0.06] text-white'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      {item.priority === 'urgent' && <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />}
                      <h4 className="font-bold text-sm tracking-tight">{item.title}</h4>
                    </div>
                    {role === 'supervisor' && (
                      <button
                        onClick={() => deleteAnnouncement(item.id)}
                        className="text-neutral-400 hover:text-rose-400 p-1 rounded-lg hover:bg-white/[0.06] transition-colors cursor-pointer"
                        title="Remover aviso"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <p className="text-neutral-300 text-xs leading-relaxed whitespace-pre-wrap">
                    {item.message}
                  </p>

                  <div className="flex items-center justify-between text-[10px] text-neutral-400 pt-1 border-t border-white/[0.06]">
                    <span>Por: <strong className="text-neutral-300">{item.authorName}</strong></span>
                    <span>{new Date(item.createdAt).toLocaleDateString('pt-BR')} às {new Date(item.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-white/[0.06] bg-[#12141c] flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-medium text-neutral-300 hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
