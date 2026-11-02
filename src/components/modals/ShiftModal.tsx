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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-[#0e1017] text-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-white/[0.09]">
        {/* Header */}
        <div className="p-5 border-b border-white/[0.08] bg-[#12141c] flex items-center justify-between shrink-0">
          <div>
            <h3 className="text-base font-semibold text-white tracking-tight">
              {role === 'supervisor'
                ? isEditing
                  ? 'Editar Plantão'
                  : 'Adicionar Plantão na Escala'
                : 'Informações do Plantão'}
            </h3>
            <p className="text-xs text-neutral-400 font-medium mt-0.5">
              {date ? formatFriendlyDate(date, true) : 'Defina os detalhes do plantão'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-white/[0.06] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          {/* Conflict Warning */}
          {conflictCheck.hasConflict && (
            <div className="p-3 bg-amber-500/15 border border-amber-500/30 rounded-xl flex items-start gap-2.5 text-amber-300 text-xs">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <span>{conflictCheck.reasons.join(' • ')}</span>
            </div>
          )}

          {/* Date */}
          <div>
            <label className="block text-xs font-semibold text-neutral-300 mb-1">
              Data do Plantão
            </label>
            <input
              type="date"
              required
              disabled={role !== 'supervisor'}
              value={date}
              onChange={e => setDate(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-[#161922] border border-white/[0.08] rounded-xl text-white font-medium focus:outline-none focus:border-[#00d2d3]/50 disabled:opacity-50"
            />
          </div>

          {/* Turno */}
          <div>
            <label className="block text-xs font-semibold text-neutral-300 mb-1">
              Tipo de Turno / Horário
            </label>
            <select
              required
              disabled={role !== 'supervisor'}
              value={shiftTypeId}
              onChange={e => setShiftTypeId(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-[#161922] border border-white/[0.08] rounded-xl text-white font-medium focus:outline-none focus:border-[#00d2d3]/50 disabled:opacity-50"
            >
              {shiftTypes.map(st => (
                <option key={st.id} value={st.id} className="bg-[#12141c] text-white">
                  {st.name} ({st.startTime} às {st.endTime}) - {st.code}
                </option>
              ))}
            </select>
          </div>

          {/* Setor */}
          <div>
            <label className="block text-xs font-semibold text-neutral-300 mb-1">
              Setor / Posto
            </label>
            <select
              required
              disabled={role !== 'supervisor'}
              value={departmentId}
              onChange={e => setDepartmentId(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-[#161922] border border-white/[0.08] rounded-xl text-white font-medium focus:outline-none focus:border-[#00d2d3]/50 disabled:opacity-50"
            >
              {departments.map(d => (
                <option key={d.id} value={d.id} className="bg-[#12141c] text-white">
                  {d.name}
                </option>
              ))}
            </select>
          </div>

          {/* Provider */}
          <div>
            <label className="block text-xs font-semibold text-neutral-300 mb-1">
              Plantonista Escalado
            </label>
            <select
              disabled={role !== 'supervisor'}
              value={providerId}
              onChange={e => setProviderId(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-[#161922] border border-white/[0.08] rounded-xl text-white font-bold focus:outline-none focus:border-[#00d2d3]/50 disabled:opacity-50"
            >
              <option value="" className="bg-[#12141c] text-neutral-400">Vaga em Aberto (Sem plantonista)</option>
              {providers.map(p => (
                <option key={p.id} value={p.id} className="bg-[#12141c] text-white">
                  {p.name} ({p.role})
                </option>
              ))}
            </select>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-neutral-300 mb-1">
              Observações (opcional)
            </label>
            <textarea
              rows={2}
              disabled={role !== 'supervisor'}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Instruções específicas para este plantão..."
              className="w-full px-3.5 py-2.5 bg-[#161922] border border-white/[0.08] rounded-xl text-white placeholder:text-neutral-500 focus:outline-none focus:border-[#00d2d3]/50 disabled:opacity-50 resize-none"
            />
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-between pt-3 border-t border-white/[0.06]">
            {role === 'supervisor' && isEditing ? (
              <button
                type="button"
                onClick={handleDelete}
                className="flex items-center gap-1.5 px-3.5 py-2 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-xl font-medium transition-colors cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>Excluir</span>
              </button>
            ) : <div />}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-neutral-400 hover:text-white hover:bg-white/[0.06] rounded-xl font-medium transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              {role === 'supervisor' && (
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#00d2d3] hover:bg-[#57f1db] text-[#003731] rounded-xl font-bold transition-all shadow-md shadow-[#00d2d3]/20 cursor-pointer active:scale-98"
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
