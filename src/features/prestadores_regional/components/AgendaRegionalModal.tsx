import React, { useState, useEffect } from 'react';
import { X, Calendar, Save, CheckSquare, Square, DollarSign } from 'lucide-react';
import { AgendaRegiaoItem } from '../types';

interface AgendaRegionalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (item: AgendaRegiaoItem) => void;
  editingItem: AgendaRegiaoItem | null;
}

const DIAS_OPCOES = [
  { id: 1, label: 'Seg' },
  { id: 2, label: 'Ter' },
  { id: 3, label: 'Qua' },
  { id: 4, label: 'Qui' },
  { id: 5, label: 'Sex' },
  { id: 6, label: 'Sáb' },
  { id: 0, label: 'Dom' },
];

export const AgendaRegionalModal: React.FC<AgendaRegionalModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingItem,
}) => {
  const [regiao, setRegiao] = useState('');
  const [cidadesStr, setCidadesStr] = useState('');
  const [diasAtendimento, setDiasAtendimento] = useState('');
  const [diasSemanaIds, setDiasSemanaIds] = useState<number[]>([1, 2, 3, 4, 5, 6]);
  const [semHorarioFixo, setSemHorarioFixo] = useState(true);
  const [observacoes, setObservacoes] = useState('');
  const [destaque, setDestaque] = useState('');
  
  // Isenção de KM
  const [hasIsencaoKm, setHasIsencaoKm] = useState(false);
  const [isencaoDia, setIsencaoDia] = useState('Quarta-feira');
  const [isencaoDiaId, setIsencaoDiaId] = useState(3);
  const [isencaoRegra, setIsencaoRegra] = useState('');

  useEffect(() => {
    if (editingItem) {
      setRegiao(editingItem.regiao);
      setCidadesStr(editingItem.cidades ? editingItem.cidades.join(', ') : '');
      setDiasAtendimento(editingItem.diasAtendimento);
      setDiasSemanaIds(editingItem.diasSemanaIds || []);
      setSemHorarioFixo(editingItem.semHorarioFixo ?? true);
      setObservacoes(editingItem.observacoes);
      setDestaque(editingItem.destaque || '');
      if (editingItem.isencaoKm) {
        setHasIsencaoKm(true);
        setIsencaoDia(editingItem.isencaoKm.dia);
        setIsencaoDiaId(editingItem.isencaoKm.diaSemanaId);
        setIsencaoRegra(editingItem.isencaoKm.regra);
      } else {
        setHasIsencaoKm(false);
        setIsencaoDia('Quarta-feira');
        setIsencaoDiaId(3);
        setIsencaoRegra('');
      }
    } else {
      setRegiao('');
      setCidadesStr('');
      setDiasAtendimento('Segunda a Sábado');
      setDiasSemanaIds([1, 2, 3, 4, 5, 6]);
      setSemHorarioFixo(true);
      setObservacoes('Sem horário fixo gratuito; atendimento comercial por rota planejada.');
      setDestaque('');
      setHasIsencaoKm(false);
      setIsencaoDia('Quarta-feira');
      setIsencaoDiaId(3);
      setIsencaoRegra('');
    }
  }, [editingItem, isOpen]);

  if (!isOpen) return null;

  const toggleDay = (dayId: number) => {
    if (diasSemanaIds.includes(dayId)) {
      setDiasSemanaIds(diasSemanaIds.filter((d) => d !== dayId));
    } else {
      setDiasSemanaIds([...diasSemanaIds, dayId].sort());
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!regiao.trim() || !diasAtendimento.trim()) return;

    const parsedCidades = cidadesStr
      .split(',')
      .map((c) => c.trim())
      .filter(Boolean);

    const saved: AgendaRegiaoItem = {
      id: editingItem ? editingItem.id : `ag-${Date.now()}`,
      regiao: regiao.trim(),
      cidades: parsedCidades.length > 0 ? parsedCidades : undefined,
      diasAtendimento: diasAtendimento.trim(),
      diasSemanaIds: diasSemanaIds.length > 0 ? diasSemanaIds : [1, 2, 3, 4, 5, 6],
      semHorarioFixo,
      observacoes: observacoes.trim(),
      destaque: destaque.trim() || undefined,
      isencaoKm: hasIsencaoKm
        ? {
            dia: isencaoDia.trim(),
            diaSemanaId: isencaoDiaId,
            regra: isencaoRegra.trim() || `Isenção de taxa de KM às ${isencaoDia}.`,
          }
        : undefined,
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
            <div className="w-8 h-8 rounded-lg bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                {editingItem ? 'Editar Agenda Regional' : 'Nova Agenda Regional'}
              </h3>
              <p className="text-xs text-slate-400">
                Configure dias de atendimento, cidades e regras de deslocamento
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
              Nome da Região <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              value={regiao}
              onChange={(e) => setRegiao(e.target.value)}
              placeholder="Ex: Guarujá, Atibaia, Litoral Norte, Campinas..."
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300">
              Texto dos Dias de Atendimento <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              value={diasAtendimento}
              onChange={(e) => setDiasAtendimento(e.target.value)}
              placeholder="Ex: Quarta e Sábado, Segunda e Quinta, Segunda a Sábado..."
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Dias da semana para filtro interativo */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">
              Dias da Semana Atendidos (para filtro rápido)
            </label>
            <div className="flex flex-wrap gap-1.5">
              {DIAS_OPCOES.map((d) => {
                const isSelected = diasSemanaIds.includes(d.id);
                return (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => toggleDay(d.id)}
                    className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                      isSelected
                        ? 'bg-blue-600 text-white font-bold'
                        : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-slate-200'
                    }`}
                  >
                    {d.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300">
              Cidades e Bairros Atendidos (separados por vírgula)
            </label>
            <input
              type="text"
              value={cidadesStr}
              onChange={(e) => setCidadesStr(e.target.value)}
              placeholder="Ex: Atibaia, Bragança Paulista, Piracaia, Bom Jesus dos Perdões"
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Sem Horário Fixo Toggle */}
          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="semHorarioFixo"
              checked={semHorarioFixo}
              onChange={(e) => setSemHorarioFixo(e.target.checked)}
              className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 bg-slate-900 border-slate-700"
            />
            <label htmlFor="semHorarioFixo" className="text-xs text-slate-300">
              Sem horário fixo gratuito (atendimento por rota comercial padrão)
            </label>
          </div>

          {/* Destaque opcional */}
          <div className="space-y-1">
            <label className="text-xs text-slate-300">Destaque do Card (opcional)</label>
            <input
              type="text"
              value={destaque}
              onChange={(e) => setDestaque(e.target.value)}
              placeholder="Ex: Dias específicos: Quarta e Sábado"
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Isenção de KM Section */}
          <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-xl space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-semibold text-slate-200">
                  Possui Isenção de KM Fora do Mapa?
                </span>
              </div>
              <input
                type="checkbox"
                checked={hasIsencaoKm}
                onChange={(e) => setHasIsencaoKm(e.target.checked)}
                className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 bg-slate-900 border-slate-700"
              />
            </div>

            {hasIsencaoKm && (
              <div className="space-y-2 pt-2 border-t border-slate-800">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-xs text-slate-300">Dia da Isenção</label>
                    <input
                      type="text"
                      value={isencaoDia}
                      onChange={(e) => setIsencaoDia(e.target.value)}
                      placeholder="Ex: Quarta-feira"
                      className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-slate-300">Dia da Semana (0 a 6)</label>
                    <select
                      value={isencaoDiaId}
                      onChange={(e) => setIsencaoDiaId(Number(e.target.value))}
                      className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-emerald-500"
                    >
                      <option value={1}>Segunda-feira</option>
                      <option value={2}>Terça-feira</option>
                      <option value={3}>Quarta-feira</option>
                      <option value={4}>Quinta-feira</option>
                      <option value={5}>Sexta-feira</option>
                      <option value={6}>Sábado</option>
                      <option value={0}>Domingo</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-slate-300">Regra Detalhada de Isenção</label>
                  <input
                    type="text"
                    value={isencaoRegra}
                    onChange={(e) => setIsencaoRegra(e.target.value)}
                    placeholder="Cliente isento de taxa de KM quando agendado para este dia..."
                    className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Observações */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300">
              Observações Operacionais <span className="text-rose-400">*</span>
            </label>
            <textarea
              required
              rows={3}
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              placeholder="Instruções para o atendente ao informar o cliente..."
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-blue-500"
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
              <span>Salvar Agenda</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
