import React, { useState, useEffect } from 'react';
import { X, MapPin, Clock, Save } from 'lucide-react';
import { PontoFixoItem } from '../types';

interface PontoFixoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (item: PontoFixoItem) => void;
  editingItem: PontoFixoItem | null;
  totalItems: number;
}

export const PontoFixoModal: React.FC<PontoFixoModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingItem,
  totalItems,
}) => {
  const [nome, setNome] = useState('');
  const [subtitulo, setSubtitulo] = useState('');
  const [endereco, setEndereco] = useState('');
  const [cep, setCep] = useState('');
  const [referencia, setReferencia] = useState('');
  const [horarioSemana, setHorarioSemana] = useState('');
  const [horarioSabado, setHorarioSabado] = useState('');
  const [horarioFeriados, setHorarioFeriados] = useState('');
  const [mapsQuery, setMapsQuery] = useState('');
  const [wazeQuery, setWazeQuery] = useState('');

  useEffect(() => {
    if (editingItem) {
      setNome(editingItem.nome);
      setSubtitulo(editingItem.subtitulo);
      setEndereco(editingItem.endereco);
      setCep(editingItem.cep);
      setReferencia(editingItem.referencia);
      setHorarioSemana(editingItem.horarioSemana);
      setHorarioSabado(editingItem.horarioSabado);
      setHorarioFeriados(editingItem.horarioFeriados);
      setMapsQuery(editingItem.mapsQuery || '');
      setWazeQuery(editingItem.wazeQuery || '');
    } else {
      setNome('');
      setSubtitulo('');
      setEndereco('');
      setCep('');
      setReferencia('');
      setHorarioSemana('08:00 às 17:30 (Segunda a Sexta)');
      setHorarioSabado('08:00 às 12:00 (Sábado)');
      setHorarioFeriados('Fechado aos Domingos e Feriados');
      setMapsQuery('');
      setWazeQuery('');
    }
  }, [editingItem, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim() || !endereco.trim()) return;

    const saved: PontoFixoItem = {
      id: editingItem ? editingItem.id : `pf-${Date.now()}`,
      numero: editingItem ? editingItem.numero : totalItems + 1,
      nome: nome.trim(),
      subtitulo: subtitulo.trim() || 'Ponto Fixo Dr. Monitora',
      endereco: endereco.trim(),
      cep: cep.trim(),
      referencia: referencia.trim(),
      horarioSemana: horarioSemana.trim(),
      horarioSabado: horarioSabado.trim(),
      horarioFeriados: horarioFeriados.trim(),
      mapsQuery: mapsQuery.trim() || endereco.trim(),
      wazeQuery: wazeQuery.trim(),
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
              <MapPin className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                {editingItem ? 'Editar Ponto Fixo de Atendimento' : 'Novo Ponto Fixo de Atendimento'}
              </h3>
              <p className="text-xs text-slate-400">
                Informações de base física para envio de clientes
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">
                Nome da Base / Região <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Ex: Zona Norte – Guarulhos"
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">Subtítulo / Estabelecimento</label>
              <input
                type="text"
                value={subtitulo}
                onChange={(e) => setSubtitulo(e.target.value)}
                placeholder="Ex: Posto de Combustível ALE"
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300">
              Endereço Completo <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              value={endereco}
              onChange={(e) => setEndereco(e.target.value)}
              placeholder="Ex: Av. Papa João Paulo I, 4489 – Guarulhos"
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">CEP</label>
              <input
                type="text"
                value={cep}
                onChange={(e) => setCep(e.target.value)}
                placeholder="07170-350"
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">Ponto de Referência</label>
              <input
                type="text"
                value={referencia}
                onChange={(e) => setReferencia(e.target.value)}
                placeholder="Ex: Próximo à Ponte do Limão"
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Horários */}
          <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-xl space-y-3">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
              Horários de Funcionamento
            </span>

            <div className="space-y-1">
              <label className="text-xs text-slate-300">Segunda a Sexta</label>
              <input
                type="text"
                value={horarioSemana}
                onChange={(e) => setHorarioSemana(e.target.value)}
                placeholder="08:00 às 17:00 (Segunda a Sexta)"
                className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs text-slate-300">Sábado</label>
              <input
                type="text"
                value={horarioSabado}
                onChange={(e) => setHorarioSabado(e.target.value)}
                placeholder="08:00 às 12:00 (Sábado)"
                className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs text-slate-300">Domingos e Feriados</label>
              <input
                type="text"
                value={horarioFeriados}
                onChange={(e) => setHorarioFeriados(e.target.value)}
                placeholder="Fechado aos Domingos e Feriados"
                className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Links Maps / Waze */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs text-slate-300">Termo de busca Google Maps</label>
              <input
                type="text"
                value={mapsQuery}
                onChange={(e) => setMapsQuery(e.target.value)}
                placeholder="Ex: Av. Ordem e Progresso 56 SP"
                className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs text-slate-300">Link direto Waze (opcional)</label>
              <input
                type="text"
                value={wazeQuery}
                onChange={(e) => setWazeQuery(e.target.value)}
                placeholder="https://waze.com/ul?q=..."
                className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-blue-500"
              />
            </div>
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
              <span>Salvar Ponto Fixo</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
