import React, { useState, useEffect } from 'react';
import { X, Trash2, Clock, MapPin, AlertTriangle } from 'lucide-react';
import { useSchedule } from '../../context/ScheduleContext';
import { ShiftAssignment } from '../../types';
import { formatFriendlyDate } from '../../utils/dateUtils';

interface ShiftModalProps {
  isOpen: boolean;
  onClose: () => void;
  shiftToEdit?: ShiftAssignment | null;
  initialDate?: string;
  initialProviderId?: string;
  onRequestSwap?: (shift: ShiftAssignment) => void;
}

export const ShiftModal: React.FC<ShiftModalProps> = ({
  isOpen,
  onClose,
  shiftToEdit,
  initialDate,
  initialProviderId,
}) => {
  const {
    providers,
    shiftTypes,
    departments,
    addAssignment,
    updateAssignment,
    deleteAssignment,
    checkShiftConflicts,
    role,
  } = useSchedule();

  const [date, setDate] = useState<string>('');
  const [shiftTypeId, setShiftTypeId] = useState<string>('');
  const [departmentId, setDepartmentId] = useState<string>('');
  const [providerId, setProviderId] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  useEffect(() => {
    if (shiftToEdit) {
      setDate(shiftToEdit.date);
      setShiftTypeId(shiftToEdit.shiftTypeId);
      setDepartmentId(shiftToEdit.departmentId);
      setProviderId(shiftToEdit.providerId || '');
      setNotes(shiftToEdit.notes || '');
    } else {
      setDate(initialDate || new Date().toISOString().split('T')[0]);
      setShiftTypeId(shiftTypes[0]?.id || '');
      setDepartmentId(departments[0]?.id || '');
      setProviderId(initialProviderId || '');
      setNotes('');
    }
  }, [shiftToEdit, initialDate, initialProviderId, shiftTypes, departments, isOpen]);

  if (!isOpen) return null;

  // Conflict check
  const conflictCheck = checkShiftConflicts(
    providerId || null,
    date,
    shiftTypeId,
    shiftToEdit?.id
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!date || !shiftTypeId || !departmentId) return;

    if (shiftToEdit) {
      updateAssignment(shiftToEdit.id, {
        date,
        shiftTypeId,
        departmentId,
        providerId: providerId || null,
        notes,
      });
    } else {
      addAssignment({
        date,
        shiftTypeId,
        departmentId,
        providerId: providerId || null,
        status: providerId ? 'confirmed' : 'pending',
        notes,
        acknowledgedByProvider: false,
      });
    }
    onClose();
  };

  const handleDelete = () => {
    if (shiftToEdit && window.confirm('Deseja realmente remover este plantão da escala?')) {
      deleteAssignment(shiftToEdit.id);
      onClose();
    }
  };

  const isEditing = Boolean(shiftToEdit);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-slate-900 text-slate-100 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-800 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/70">
          <div>
            <h3 className="text-base font-bold text-white">
              {role === 'supervisor'
                ? isEditing
                  ? 'Editar Plantão'
                  : 'Adicionar Plantão na Escala'
                : 'Informações do Plantão'}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              {date ? formatFriendlyDate(date, true) : 'Defina os detalhes do plantão'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Supervisor Form or Provider view */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Data */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">
              Data do Plantão
            </label>
            <input
              type="date"
              required
              disabled={role !== 'supervisor'}
              value={date}
              onChange={e => setDate(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-slate-950 border border-slate-700 rounded-xl focus:border-indigo-500 focus:outline-none text-white disabled:opacity-75"
            />
          </div>

          {/* Quem vai trabalhar (Prestador) */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-slate-300">
                Colaborador Escalado
              </label>
              {role === 'supervisor' && (
                <span className="text-[11px] text-slate-500">
                  Deixe vazio para vaga aberta
                </span>
              )}
            </div>
            <select
              disabled={role !== 'supervisor'}
              value={providerId}
              onChange={e => setProviderId(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-slate-950 border border-slate-700 rounded-xl focus:border-indigo-500 focus:outline-none text-white disabled:opacity-75"
            >
              <option value="">-- [Vaga em Aberto / Sem Prestador] --</option>
              {providers.map(p => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.role})
                </option>
              ))}
            </select>
          </div>

          {/* Turno e Setor */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                Turno / Horário
              </label>
              <select
                required
                disabled={role !== 'supervisor'}
                value={shiftTypeId}
                onChange={e => setShiftTypeId(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-slate-950 border border-slate-700 rounded-xl focus:border-indigo-500 focus:outline-none text-white disabled:opacity-75"
              >
                {shiftTypes.map(st => (
                  <option key={st.id} value={st.id}>
                    {st.name} ({st.startTime} às {st.endTime})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                Setor / Posto
              </label>
              <select
                required
                disabled={role !== 'supervisor'}
                value={departmentId}
                onChange={e => setDepartmentId(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-slate-950 border border-slate-700 rounded-xl focus:border-indigo-500 focus:outline-none text-white disabled:opacity-75"
              >
                {departments.map(d => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Warnings */}
          {role === 'supervisor' && conflictCheck.hasConflict && (
            <div className="p-3 bg-amber-950/40 border border-amber-800/80 rounded-xl text-amber-300 text-xs space-y-1">
              <div className="flex items-center gap-1.5 font-bold">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <span>Alerta de Escala:</span>
              </div>
              <ul className="list-disc pl-5 space-y-0.5 opacity-90">
                {conflictCheck.reasons.map((r, i) => (
                  <li key={i}>{r}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">
              Observações (opcional)
            </label>
            <input
              type="text"
              disabled={role !== 'supervisor'}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Ex: Leito 04, substituição, etc."
              className="w-full px-3 py-2 text-sm bg-slate-950 border border-slate-700 rounded-xl focus:border-indigo-500 focus:outline-none text-white disabled:opacity-75"
            />
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-800">
            {role === 'supervisor' && isEditing ? (
              <button
                type="button"
                onClick={handleDelete}
                className="flex items-center gap-1 px-3 py-2 text-xs font-bold text-rose-400 hover:text-rose-300 hover:bg-rose-950/50 rounded-xl transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                <span>Excluir</span>
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
              >
                {role === 'supervisor' ? 'Cancelar' : 'Fechar'}
              </button>
              {role === 'supervisor' && (
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow-md transition-all"
                >
                  {isEditing ? 'Salvar Alterações' : 'Criar Plantão'}
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
