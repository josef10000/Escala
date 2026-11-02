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
        status: providerId ? 'confirmed' : 'pending',
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-100">
      <div className="bg-white text-slate-800 rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200/90">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between shrink-0">
          <div>
            <h3 className="text-base font-extrabold text-slate-900">
              {role === 'supervisor'
                ? isEditing
                  ? 'Editar Plantão'
                  : 'Adicionar Plantão na Escala'
                : 'Informações do Plantão'}
            </h3>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              {date ? formatFriendlyDate(date, true) : 'Defina os detalhes do plantão'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          {/* Conflict Warning */}
          {conflictCheck.hasConflict && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-2.5 text-amber-800 text-xs">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span>{conflictCheck.reasons.join(' • ')}</span>
            </div>
          )}

          {/* Date */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Data do Plantão
            </label>
            <input
              type="date"
              required
              disabled={role !== 'supervisor'}
              value={date}
              onChange={e => setDate(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-200"
            />
          </div>

          {/* Turno */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Tipo de Turno / Horário
            </label>
            <select
              required
              disabled={role !== 'supervisor'}
              value={shiftTypeId}
              onChange={e => setShiftTypeId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-200"
            >
              {shiftTypes.map(st => (
                <option key={st.id} value={st.id}>
                  {st.name} ({st.startTime} às {st.endTime}) - {st.code}
                </option>
              ))}
            </select>
          </div>

          {/* Setor */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Setor / Posto
            </label>
            <select
              required
              disabled={role !== 'supervisor'}
              value={departmentId}
              onChange={e => setDepartmentId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-200"
            >
              {departments.map(d => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>

          {/* Provider */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Plantonista Escalado
            </label>
            <select
              disabled={role !== 'supervisor'}
              value={providerId}
              onChange={e => setProviderId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-bold focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-200"
            >
              <option value="">Vaga em Aberto (Sem plantonista)</option>
              {providers.map(p => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.role})
                </option>
              ))}
            </select>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Observações (opcional)
            </label>
            <textarea
              rows={2}
              disabled={role !== 'supervisor'}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Instruções específicas para este plantão..."
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-200"
            />
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-100">
            {role === 'supervisor' && isEditing ? (
              <button
                type="button"
                onClick={handleDelete}
                className="flex items-center gap-1.5 px-3 py-2 text-rose-700 hover:text-rose-800 hover:bg-rose-50 rounded-xl font-bold transition-colors cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>Excluir</span>
              </button>
            ) : <div />}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl font-semibold cursor-pointer"
              >
                Cancelar
              </button>
              {role === 'supervisor' && (
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-xs transition-all cursor-pointer active:scale-98"
                >
                  {isEditing ? 'Salvar Plantão' : 'Adicionar Plantão'}
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
