import React, { useState } from 'react';
import { useSchedule } from '../../context/ScheduleContext';
import { Provider, TeamGroup, WorkRegime } from '../../types';
import {
  X,
  Plus,
  Trash2,
  Edit2,
  Users,
  UserPlus,
  Clock,
  Phone,
  Mail,
  Upload,
  FileText,
  CheckCircle2,
  AlertCircle,
  User,
  DollarSign,
  Award,
  KeyRound,
  ShieldCheck,
} from 'lucide-react';

interface ProviderManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ProviderManagementModal: React.FC<ProviderManagementModalProps> = ({
  isOpen,
  onClose,
}) => {
  const {
    providers,
    addProvider,
    updateProvider,
    deleteProvider,
    resetProviderPin,
    activeRegime,
    batchAddProviders,
  } = useSchedule();

  const [activeTab, setActiveTab] = useState<'list' | 'batch_import'>('list');
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form fields
  const [name, setName] = useState('');
  const [role, setRole] = useState('Prestador');
  const [regime, setRegime] = useState<WorkRegime>(activeRegime);
  const [teamGroup, setTeamGroup] = useState<TeamGroup>('turma_a');
  const [entryTime, setEntryTime] = useState(activeRegime === '5x2' ? '08h00' : '07h00');
  const [exitTime, setExitTime] = useState(activeRegime === '5x2' ? '17h00' : '19h00');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('(11) 90000-0000');
  const [maxHours, setMaxHours] = useState<number>(activeRegime === '5x2' ? 176 : 180);
  const [color, setColor] = useState('blue');

  // Financial fields
  const [baseSalary, setBaseSalary] = useState<number>(3500);
  const [bonusAmount, setBonusAmount] = useState<number>(600);
  const [bonusFreq, setBonusFreq] = useState<number>(3); // 3 = trimestral
  const [deductionMode, setDeductionMode] = useState<'fixed_value' | 'percentage_of_bonus'>('percentage_of_bonus');
  const [deductionLate, setDeductionLate] = useState<number>(0.5); // 0.5% ou R$ 0.50
  const [deductionAbsence, setDeductionAbsence] = useState<number>(10); // 10% ou R$ 150

  // Batch import fields
  const [batchText, setBatchText] = useState('');
  const [batchRegime, setBatchRegime] = useState<WorkRegime>(activeRegime);
  const [batchAutoAlternateTeams, setBatchAutoAlternateTeams] = useState(true);
  const [batchSuccessMsg, setBatchSuccessMsg] = useState('');
  const [batchErrorMsg, setBatchErrorMsg] = useState('');

  if (!isOpen) return null;

  const resetForm = () => {
    setEditingId(null);
    setName('');
    setRole(activeRegime === '5x2' ? 'Técnico / Administrativo' : 'Prestador');
    setRegime(activeRegime);
    setTeamGroup('turma_a');
    setEntryTime(activeRegime === '5x2' ? '08h00' : '07h00');
    setExitTime(activeRegime === '5x2' ? '17h00' : '19h00');
    setEmail('');
    setPhone('(11) 90000-0000');
    setMaxHours(activeRegime === '5x2' ? 176 : 180);
    setColor('blue');
    setBaseSalary(3500);
    setBonusAmount(600);
    setBonusFreq(3);
    setDeductionMode('percentage_of_bonus');
    setDeductionLate(0.5);
    setDeductionAbsence(10);
    setIsAdding(false);
  };

  const handleStartEdit = (p: Provider) => {
    setEditingId(p.id);
    setName(p.name);
    setRole(p.role);
    setRegime(p.regime || '12x36');
    setTeamGroup(p.teamGroup || 'turma_a');
    setEntryTime(p.entryTime || (p.regime === '5x2' ? '08h00' : '07h00'));
    setExitTime(p.exitTime || (p.regime === '5x2' ? '17h00' : '19h00'));
    setEmail(p.email);
    setPhone(p.phone);
    setMaxHours(p.maxMonthlyHours);
    setColor(p.color);
    setBaseSalary(p.baseSalaryOrFee ?? 3500);
    setBonusAmount(p.bonusAmount ?? 600);
    setBonusFreq(p.bonusFrequencyMonths ?? 3);
    setDeductionMode(p.deductionMode ?? 'percentage_of_bonus');
    setDeductionLate(p.deductionPerMinuteLate ?? 0.5);
    setDeductionAbsence(p.deductionPerAbsence ?? 10);
    setIsAdding(true);
    setActiveTab('list');
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const providerData = {
      name: name.trim(),
      role: role.trim(),
      regime,
      teamGroup,
      entryTime: entryTime.trim() || (regime === '5x2' ? '08h00' : '07h00'),
      exitTime: exitTime.trim() || (regime === '5x2' ? '17h00' : '19h00'),
      email: email || `${name.toLowerCase().replace(/\s+/g, '.')}@escala.com`,
      phone: phone || '(11) 90000-0000',
      maxMonthlyHours: Number(maxHours) || (regime === '5x2' ? 176 : 180),
      color,
      baseSalaryOrFee: Number(baseSalary) || 3500,
      bonusAmount: Number(bonusAmount) || 600,
      bonusFrequencyMonths: Number(bonusFreq) || 3,
      deductionMode,
      deductionPerMinuteLate: Number(deductionLate) || 0.5,
      deductionPerAbsence: Number(deductionAbsence) || 10,
    };

    if (editingId) {
      updateProvider(editingId, providerData);
    } else {
      addProvider({
        ...providerData,
        status: 'active',
      });
    }

    resetForm();
  };

  const handleDelete = (id: string, pName: string) => {
    if (window.confirm(`Tem certeza que deseja remover "${pName}" da equipe? Seus plantões serão desvinculados.`)) {
      deleteProvider(id);
    }
  };

  const handleBatchImportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setBatchErrorMsg('');
    setBatchSuccessMsg('');

    const lines = batchText
      .split('\n')
      .map(l => l.trim())
      .filter(l => l.length > 0);

    if (lines.length === 0) {
      setBatchErrorMsg('Cole ao menos um nome na caixa de texto.');
      return;
    }

    const newProvidersList: Array<Omit<Provider, 'id'>> = [];

    lines.forEach((line, idx) => {
      let parsedName = line;
      let parsedPhone = '(11) 90000-0000';
      let parsedRole = 'Prestador';
      let parsedTeam: TeamGroup = batchAutoAlternateTeams
        ? idx % 2 === 0
          ? 'turma_a'
          : 'turma_b'
        : 'turma_a';

      if (line.includes('|')) {
        const parts = line.split('|').map(p => p.trim());
        parsedName = parts[0] || parsedName;
        if (parts[1]) parsedRole = parts[1];
      }

      newProvidersList.push({
        name: parsedName,
        role: parsedRole,
        regime: batchRegime,
        teamGroup: parsedTeam,
        entryTime: batchRegime === '5x2' ? '08h00' : '07h00',
        exitTime: batchRegime === '5x2' ? '17h00' : '19h00',
        email: `${parsedName.toLowerCase().replace(/\s+/g, '.')}@escala.com`,
        phone: parsedPhone,
        color: idx % 2 === 0 ? 'blue' : 'emerald',
        maxMonthlyHours: batchRegime === '5x2' ? 176 : 180,
        baseSalaryOrFee: 3500,
        bonusAmount: 600,
        bonusFrequencyMonths: 3,
        deductionMode: 'percentage_of_bonus',
        deductionPerMinuteLate: 0.5,
        deductionPerAbsence: 10,
        status: 'active',
      });
    });

    const addedCount = batchAddProviders(newProvidersList);
    setBatchSuccessMsg(`${addedCount} colaborador(es) cadastrados com sucesso!`);
    setBatchText('');
    setTimeout(() => {
      setActiveTab('list');
      setBatchSuccessMsg('');
    }, 1200);
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-100 cursor-pointer"
    >
      <div
        onClick={e => e.stopPropagation()}
        className="bg-[#141c28] text-slate-100 rounded-3xl shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden border border-[#1e2a3a] cursor-default"
      >
        
        {/* Header */}
        <div className="p-5 border-b border-[#1e2a3a] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-950/70 border border-blue-800/80 flex items-center justify-center text-cyan-400 shadow-sm">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-white">Gerenciar Equipe, Bônus & Descontos no Bônus</h3>
              <p className="text-xs text-slate-400 font-medium">
                Descontos aplicados exclusivamente sobre o bônus (valor fixo ou porcentagem por atraso/falta)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switch */}
        <div className="px-5 pt-3 flex gap-2 border-b border-[#1e2a3a] bg-[#0c121c]">
          <button
            onClick={() => {
              setActiveTab('list');
              setIsAdding(false);
            }}
            className={`pb-2.5 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'list'
                ? 'border-cyan-400 text-cyan-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Colaboradores Cadastrados ({providers.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('batch_import')}
            className={`pb-2.5 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'batch_import'
                ? 'border-cyan-400 text-cyan-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Upload className="w-3.5 h-3.5 text-cyan-400" />
            <span>Importação em Lote (Colar Lista)</span>
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          
          {activeTab === 'list' && (
            <>
              {!isAdding ? (
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-300 font-medium">
                    Regime Ativo: <strong className="text-cyan-400">{activeRegime}</strong>
                  </span>
                  <button
                    onClick={() => {
                      resetForm();
                      setIsAdding(true);
                    }}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-950/40 cursor-pointer active:scale-98"
                  >
                    <UserPlus className="w-4 h-4 text-cyan-200" />
                    <span>+ Novo Colaborador</span>
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSave} className="p-4 bg-[#0c121c] border border-[#1e2a3a] rounded-2xl space-y-3">
                  <div className="flex items-center justify-between border-b border-[#1e2a3a] pb-2">
                    <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider">
                      {editingId ? 'Editar Colaborador & Regras de Desconto no Bônus' : 'Novo Colaborador & Regras de Desconto no Bônus'}
                    </span>
                    <button
                      type="button"
                      onClick={resetForm}
                      className="text-xs text-slate-400 hover:text-white font-medium cursor-pointer"
                    >
                      Cancelar
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="block font-bold text-slate-300 mb-1">Nome Completo</label>
                      <input
                        type="text"
                        required
                        placeholder="Ex: JOÃO DA SILVA"
                        value={name}
                        onChange={e => setName(e.target.value)}
                        className="w-full px-3 py-2 bg-[#141c28] border border-[#1e2a3a] text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 uppercase font-medium"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-300 mb-1">Cargo / Função</label>
                      <input
                        type="text"
                        required
                        placeholder="Ex: Prestador, Técnico"
                        value={role}
                        onChange={e => setRole(e.target.value)}
                        className="w-full px-3 py-2 bg-[#141c28] border border-[#1e2a3a] text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 font-medium"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-300 mb-1">Regime de Trabalho</label>
                      <select
                        value={regime}
                        onChange={e => {
                          const newReg = e.target.value as WorkRegime;
                          setRegime(newReg);
                          if (newReg === '5x2') {
                            setEntryTime('08h00');
                            setExitTime('17h00');
                            setMaxHours(176);
                          } else {
                            setEntryTime('07h00');
                            setExitTime('19h00');
                            setMaxHours(180);
                          }
                        }}
                        className="w-full px-3 py-2 bg-[#141c28] border border-[#1e2a3a] text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 font-medium cursor-pointer"
                      >
                        <option value="12x36">Escala 12x36 (Plantão 12h)</option>
                        <option value="5x2">Escala 5x2 (Segunda a Sexta)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-300 mb-1">Turma / Cadência (12x36)</label>
                      <select
                        value={teamGroup}
                        onChange={e => setTeamGroup(e.target.value as TeamGroup)}
                        className="w-full px-3 py-2 bg-[#141c28] border border-[#1e2a3a] text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 font-medium cursor-pointer"
                      >
                        <option value="turma_a">Turma A (Dias Ímpares)</option>
                        <option value="turma_b">Turma B (Dias Pares)</option>
                        <option value="none">Sem Turma Fixa</option>
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block font-bold text-slate-300 mb-1">Entrada</label>
                        <input
                          type="text"
                          value={entryTime}
                          onChange={e => setEntryTime(e.target.value)}
                          className="w-full px-3 py-2 bg-[#141c28] border border-[#1e2a3a] text-white rounded-xl text-center font-medium"
                        />
                      </div>
                      <div>
                        <label className="block font-bold text-slate-300 mb-1">Saída</label>
                        <input
                          type="text"
                          value={exitTime}
                          onChange={e => setExitTime(e.target.value)}
                          className="w-full px-3 py-2 bg-[#141c28] border border-[#1e2a3a] text-white rounded-xl text-center font-medium"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-300 mb-1">Telefone / WhatsApp</label>
                      <input
                        type="text"
                        value={phone}
                        onChange={e => setPhone(e.target.value)}
                        className="w-full px-3 py-2 bg-[#141c28] border border-[#1e2a3a] text-white rounded-xl font-medium"
                      />
                    </div>

                    {/* Financial Fields */}
                    <div className="sm:col-span-2 pt-2 border-t border-[#1e2a3a]">
                      <h5 className="text-xs font-bold text-cyan-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                        <DollarSign className="w-4 h-4" />
                        <span>Honorários, Bônus & Descontos Exclusivos no Bônus</span>
                      </h5>
                      <p className="text-xs text-slate-400 mb-2">
                        O líder pode definir se desconta por falta, por atraso, ou por ambos simultaneamente (aplicado apenas ao bônus, protegendo o honorário base).
                      </p>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-300 mb-1">Honorário / Salário Base Fixo (R$)</label>
                      <input
                        type="number"
                        step="50"
                        value={baseSalary}
                        onChange={e => setBaseSalary(Number(e.target.value))}
                        className="w-full px-3 py-2 bg-[#141c28] border border-[#1e2a3a] text-white rounded-xl font-bold text-cyan-300"
                      />
                      <span className="text-xs text-slate-400 block mt-0.5">Não sofre nenhum desconto de faltas/atrasos.</span>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-300 mb-1">Valor do Bônus (R$)</label>
                      <input
                        type="number"
                        step="50"
                        value={bonusAmount}
                        onChange={e => setBonusAmount(Number(e.target.value))}
                        className="w-full px-3 py-2 bg-[#141c28] border border-[#1e2a3a] text-white rounded-xl font-bold text-cyan-300"
                      />
                      <span className="text-xs text-slate-400 block mt-0.5">Onde os descontos de faltas/atrasos serão aplicados.</span>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-300 mb-1">Frequência do Bônus</label>
                      <select
                        value={bonusFreq}
                        onChange={e => setBonusFreq(Number(e.target.value))}
                        className="w-full px-3 py-2 bg-[#141c28] border border-[#1e2a3a] text-white rounded-xl font-medium cursor-pointer text-xs"
                      >
                        <option value={1}>1 Mês (Mensal)</option>
                        <option value={3}>3 Meses (Trimestral)</option>
                        <option value={6}>6 Meses (Semestral)</option>
                        <option value={12}>12 Meses (Anual)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-300 mb-1">Tipo de Cálculo do Desconto</label>
                      <select
                        value={deductionMode}
                        onChange={e => setDeductionMode(e.target.value as 'fixed_value' | 'percentage_of_bonus')}
                        className="w-full px-3 py-2 bg-[#141c28] border border-[#1e2a3a] text-white rounded-xl font-medium cursor-pointer text-xs"
                      >
                        <option value="percentage_of_bonus">Porcentagem (%) sobre o Bônus</option>
                        <option value="fixed_value">Valor Fixo em Reais (R$)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-300 mb-1">
                        Desconto por Atraso ({deductionMode === 'percentage_of_bonus' ? '% por minuto' : 'R$ por minuto'})
                      </label>
                      <input
                        type="number"
                        step={deductionMode === 'percentage_of_bonus' ? '0.1' : '0.50'}
                        value={deductionLate}
                        onChange={e => setDeductionLate(Number(e.target.value))}
                        className="w-full px-3 py-2 bg-[#141c28] border border-[#1e2a3a] text-rose-300 rounded-xl font-bold text-xs"
                      />
                      <span className="text-xs text-slate-400 block mt-0.5">Defina 0 para não descontar atrasos.</span>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-300 mb-1">
                        Desconto por Falta Injustificada ({deductionMode === 'percentage_of_bonus' ? '% por falta' : 'R$ por falta'})
                      </label>
                      <input
                        type="number"
                        step={deductionMode === 'percentage_of_bonus' ? '1' : '10'}
                        value={deductionAbsence}
                        onChange={e => setDeductionAbsence(Number(e.target.value))}
                        className="w-full px-3 py-2 bg-[#141c28] border border-[#1e2a3a] text-rose-300 rounded-xl font-bold text-xs"
                      />
                      <span className="text-xs text-slate-400 block mt-0.5">Defina 0 para não descontar faltas.</span>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={resetForm}
                      className="px-3 py-1.5 text-xs text-slate-400 hover:text-white font-semibold cursor-pointer"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-950/40 cursor-pointer"
                    >
                      {editingId ? 'Salvar Alterações' : 'Cadastrar Prestador'}
                    </button>
                  </div>
                </form>
              )}

              {/* Provider List */}
              <div className="space-y-2">
                {providers.map(p => (
                  <div
                    key={p.id}
                    className="p-3 bg-[#0c121c] border border-[#1e2a3a] rounded-2xl flex items-center justify-between gap-3 hover:border-cyan-500/40 transition-all"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-xl bg-blue-950/70 border border-blue-800/80 flex items-center justify-center font-extrabold text-xs text-cyan-300 shrink-0">
                        {p.name.substring(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-bold text-xs text-white truncate">{p.name}</h4>
                          <span className="text-xs font-bold px-2 py-0.5 rounded-lg bg-slate-800 text-cyan-300 border border-slate-700">
                            {p.regime || '12x36'}
                          </span>
                          {p.baseSalaryOrFee && (
                            <span className="text-xs font-bold px-2 py-0.5 rounded-lg bg-emerald-950/70 text-emerald-300 border border-emerald-800/80">
                              Base: R$ {p.baseSalaryOrFee}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-400 font-medium truncate">
                          {p.role} • Bônus: R$ {p.bonusAmount || 600} (Desc. {p.deductionMode === 'percentage_of_bonus' ? '%' : 'R$'} sobre bônus)
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {/* PIN status badge and reset button */}
                      {p.pin ? (
                        <button
                          type="button"
                          onClick={async () => {
                            if (window.confirm(`Deseja resetar o PIN de ${p.name}? O colaborador poderá criar um novo PIN no próximo acesso.`)) {
                              await resetProviderPin(p.id);
                            }
                          }}
                          className="flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-lg bg-emerald-950/70 hover:bg-emerald-900 text-emerald-300 border border-emerald-800/80 transition-colors cursor-pointer"
                          title="PIN cadastrado. Clique para resetar o PIN deste colaborador."
                        >
                          <ShieldCheck className="w-3 h-3 text-emerald-400" />
                          <span>Resetar PIN</span>
                        </button>
                      ) : (
                        <span
                          className="flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-lg bg-[#141c28] text-slate-400 border border-[#1e2a3a]"
                          title="Colaborador ainda não criou seu PIN de primeiro acesso."
                        >
                          <KeyRound className="w-3 h-3 text-slate-500" />
                          <span>Sem PIN</span>
                        </span>
                      )}

                      <button
                        type="button"
                        onClick={() => handleStartEdit(p)}
                        className="p-1.5 text-slate-400 hover:text-cyan-300 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                        title="Editar prestador"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(p.id, p.name)}
                        className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                        title="Remover prestador"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {activeTab === 'batch_import' && (
            <form onSubmit={handleBatchImportSubmit} className="space-y-4">
              <div className="bg-[#0c121c] border border-[#1e2a3a] p-3.5 rounded-2xl text-xs text-slate-300 space-y-1">
                <span className="font-bold block text-white flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-cyan-400" />
                  <span>Importação em Lote:</span>
                </span>
                <p className="text-slate-400">
                  Cole os nomes da equipe (um por linha) do WhatsApp ou Bloco de Notas.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block font-bold text-slate-300 mb-1">Regime Padrão</label>
                  <select
                    value={batchRegime}
                    onChange={e => setBatchRegime(e.target.value as WorkRegime)}
                    className="w-full px-3 py-2 bg-[#0c121c] border border-[#1e2a3a] rounded-xl text-white font-bold cursor-pointer"
                  >
                    <option value="12x36">12x36 (Plantão 12h)</option>
                    <option value="5x2">5x2 (Segunda a Sexta)</option>
                  </select>
                </div>

                <div className="flex items-center gap-2 pt-5">
                  <input
                    type="checkbox"
                    id="alternateCheck"
                    checked={batchAutoAlternateTeams}
                    onChange={e => setBatchAutoAlternateTeams(e.target.checked)}
                    className="w-4 h-4 rounded text-blue-600 bg-[#0c121c] border-[#1e2a3a] cursor-pointer"
                  />
                  <label htmlFor="alternateCheck" className="text-xs font-semibold text-slate-300 cursor-pointer">
                    Alternar Turma A e Turma B automaticamente
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Cole a Lista de Nomes (1 por linha):
                </label>
                <textarea
                  rows={6}
                  required
                  value={batchText}
                  onChange={e => setBatchText(e.target.value)}
                  placeholder="Cole aqui a lista..."
                  className="w-full p-3 bg-[#0c121c] border border-[#1e2a3a] rounded-2xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>

              {batchErrorMsg && (
                <div className="p-2.5 bg-rose-950/70 border border-rose-800 rounded-xl text-xs text-rose-300 text-center font-semibold">
                  {batchErrorMsg}
                </div>
              )}

              {batchSuccessMsg && (
                <div className="p-2.5 bg-emerald-950/70 border border-emerald-800 rounded-xl text-xs text-emerald-300 text-center font-bold flex items-center justify-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-cyan-300" />
                  <span>{batchSuccessMsg}</span>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setActiveTab('list')}
                  className="px-4 py-2 text-xs text-slate-400 hover:text-white bg-slate-800 rounded-xl font-semibold cursor-pointer border border-[#1e2a3a]"
                >
                  Voltar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-950/40 flex items-center gap-1.5 cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5 text-cyan-200" />
                  <span>Cadastrar Lista em Lote</span>
                </button>
              </div>
            </form>
          )}

        </div>
      </div>
    </div>
  );
};
