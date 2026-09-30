import React, { useState } from 'react';
import { X, UserPlus, Trash2, Edit2, User, Clock } from 'lucide-react';
import { useSchedule } from '../../context/ScheduleContext';
import { Provider } from '../../types';

interface ProviderManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ProviderManagementModal: React.FC<ProviderManagementModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { providers, addProvider, updateProvider, deleteProvider } = useSchedule();

  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [role, setRole] = useState('Enfermeiro(a)');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [maxHours, setMaxHours] = useState(144);
  const [color, setColor] = useState('indigo');

  if (!isOpen) return null;

  const resetForm = () => {
    setName('');
    setRole('Enfermeiro(a)');
    setEmail('');
    setPhone('');
    setMaxHours(144);
    setColor('indigo');
    setIsAdding(false);
    setEditingId(null);
  };

  const handleStartEdit = (p: Provider) => {
    setEditingId(p.id);
    setName(p.name);
    setRole(p.role);
    setEmail(p.email);
    setPhone(p.phone);
    setMaxHours(p.maxMonthlyHours);
    setColor(p.color);
    setIsAdding(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (editingId) {
      updateProvider(editingId, {
        name,
        role,
        email: email || `${name.toLowerCase().replace(/\s+/g, '.')}@equipe.com`,
        phone: phone || '(11) 90000-0000',
        maxMonthlyHours: Number(maxHours) || 144,
        color,
      });
    } else {
      addProvider({
        name,
        role,
        email: email || `${name.toLowerCase().replace(/\s+/g, '.')}@equipe.com`,
        phone: phone || '(11) 90000-0000',
        maxMonthlyHours: Number(maxHours) || 144,
        color,
        badgeColor: {
          bg: `bg-${color}-500/20`,
          text: `text-${color}-300`,
          border: `border-${color}-500/40`,
        },
        status: 'active',
      });
    }

    resetForm();
  };

  const handleDelete = (id: string, pName: string) => {
    if (window.confirm(`Tem certeza que deseja remover "${pName}"? Seus plantões se tornarão vagas abertas.`)) {
      deleteProvider(id);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-slate-900 text-slate-100 rounded-2xl shadow-2xl w-full max-w-xl max-h-[85vh] flex flex-col overflow-hidden border border-slate-800 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/70 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold">
              <User className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                Equipe de Colaboradores
              </h3>
              <p className="text-xs text-slate-400">
                Cadastro de médicos, enfermeiros e plantonistas
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-4">
          {!isAdding ? (
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-slate-400">
                {providers.length} colaboradores na equipe
              </span>
              <button
                onClick={() => setIsAdding(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl transition-all shadow-sm"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Novo Colaborador</span>
              </button>
            </div>
          ) : (
            <form onSubmit={handleSave} className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-xs font-bold text-white">
                  {editingId ? 'Editar Colaborador' : 'Novo Colaborador'}
                </span>
                <button
                  type="button"
                  onClick={resetForm}
                  className="text-xs text-slate-400 hover:text-white"
                >
                  Cancelar
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Nome Completo</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Dra. Ana Costa"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 text-white rounded-lg"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Cargo / Especialidade</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Médica Plantonista"
                    value={role}
                    onChange={e => setRole(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 text-white rounded-lg"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">E-mail</label>
                  <input
                    type="email"
                    placeholder="nome@hospital.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 text-white rounded-lg"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Telefone / WhatsApp</label>
                  <input
                    type="text"
                    placeholder="(11) 98765-4321"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 text-white rounded-lg"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-sm"
                >
                  {editingId ? 'Salvar' : 'Cadastrar'}
                </button>
              </div>
            </form>
          )}

          {/* List */}
          <div className="divide-y divide-slate-800 border border-slate-800 rounded-xl overflow-hidden bg-slate-950">
            {providers.map(p => (
              <div
                key={p.id}
                className="p-3 hover:bg-slate-900 flex items-center justify-between gap-4 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center font-bold text-xs text-white shrink-0">
                    {p.name.charAt(0)}
                  </div>
                  <div>
                    <div className="font-bold text-xs text-white flex items-center gap-2">
                      <span>{p.name}</span>
                      <span className="text-[10px] text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded-sm">
                        {p.role}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5 font-mono-nums">
                      <span>{p.phone}</span>
                      <span>·</span>
                      <span>{p.maxMonthlyHours}h/mês</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => handleStartEdit(p)}
                    className="p-1.5 text-slate-400 hover:text-indigo-400 rounded-md transition-colors"
                    title="Editar"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(p.id, p.name)}
                    className="p-1.5 text-slate-400 hover:text-rose-400 rounded-md transition-colors"
                    title="Remover"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-300 hover:text-white bg-slate-900 border border-slate-700 hover:bg-slate-800 rounded-xl"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
