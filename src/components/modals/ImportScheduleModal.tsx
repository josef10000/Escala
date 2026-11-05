import React, { useState } from 'react';
import { useSchedule } from '../../context/ScheduleContext';
import {
  X,
  Sparkles,
  Camera,
  FileText,
  Zap,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Upload,
  Copy,
  Trash2,
  ArrowRight,
  ShieldCheck,
  User,
  Calendar,
  Loader2,
} from 'lucide-react';
import { MONTH_NAMES_PT } from '../../utils/dateUtils';
import { ShiftAssignment, WorkModality } from '../../types';

interface ImportScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ImportScheduleModal: React.FC<ImportScheduleModalProps> = ({
  isOpen,
  onClose,
}) => {
  const {
    currentYear,
    currentMonthIndex,
    providers,
    assignments,
    addAssignment,
    clearMonthAssignments,
    applyTeamGroupsSchedule,
    clonePreviousMonthSchedule,
    isLeaderAuthenticated,
  } = useSchedule();

  const [activeTab, setActiveTab] = useState<'ai_photo' | 'text_paste' | 'team_patterns' | 'clear'>('ai_photo');

  // AI Photo State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiPreviewData, setAiPreviewData] = useState<any[]>([]);

  // Text Paste State
  const [rawText, setRawText] = useState('');

  // Status & Feedback
  const [toast, setToast] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  if (!isOpen) return null;

  const monthName = MONTH_NAMES_PT[currentMonthIndex];

  // Handle Image File Selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
    setAiPreviewData([]);
    setToast(null);
  };

  // Run AI Parse on Server
  const handleRunAiParse = async () => {
    if (!imagePreview && !rawText.trim()) {
      setToast({ type: 'error', text: 'Selecione uma imagem ou insira um texto para a IA analisar.' });
      return;
    }

    setIsAiLoading(true);
    setToast(null);

    try {
      const response = await fetch('/api/ai/parse-schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: imagePreview,
          textContent: rawText.trim() || undefined,
          providersList: providers.map(p => ({ id: p.id, name: p.name })),
        }),
      });

      const resData = await response.json();
      if (resData.success && resData.data?.parsedAssignments) {
        setAiPreviewData(resData.data.parsedAssignments);
        setToast({
          type: 'success',
          text: `IA analisou a escala com sucesso! ${resData.data.parsedAssignments.length} plantões identificados. Confira a prévia abaixo.`,
        });
      } else {
        setToast({
          type: 'error',
          text: resData.error || 'Não foi possível extrair a escala da imagem. Tente uma imagem mais nítida ou use o colar texto.',
        });
      }
    } catch (err: any) {
      setToast({
        type: 'error',
        text: err.message || 'Erro ao conectar ao servidor de IA.',
      });
    } finally {
      setIsAiLoading(false);
    }
  };

  // Apply AI Extracted Assignments into Schedule
  const handleApplyAiAssignments = () => {
    if (!aiPreviewData || aiPreviewData.length === 0) return;

    let appliedCount = 0;
    aiPreviewData.forEach(item => {
      // Find matching provider
      let targetProv = providers.find(p => p.id === item.providerId);
      if (!targetProv && item.providerName) {
        const q = item.providerName.toLowerCase();
        targetProv = providers.find(p => p.name.toLowerCase().includes(q));
      }

      if (targetProv && item.date) {
        addAssignment({
          providerId: targetProv.id,
          date: item.date,
          shiftTypeId: item.shiftCode === 'D' ? 'st-d' : 'st-t',
          departmentId: 'dept-1',
          status: 'confirmed',
          workModality: (item.shiftCode === 'HO' ? 'home_office' : 'presencial') as WorkModality,
          notes: item.notes || 'Importado via IA',
        });
        appliedCount++;
      }
    });

    setToast({
      type: 'success',
      text: `${appliedCount} plantões importados e salvos com sucesso na escala!`,
    });

    setTimeout(() => {
      onClose();
    }, 1500);
  };

  // Quick Pattern Actions
  const handleApplyTurmas = () => {
    const total = applyTeamGroupsSchedule(currentYear, currentMonthIndex);
    setToast({
      type: 'success',
      text: `Escala gerada automaticamente em lote! ${total} plantões distribuídos entre Turma A (Ímpares), Turma B (Pares) e Regime 5x2.`,
    });
    setTimeout(() => onClose(), 1500);
  };

  // Clear Month
  const handleClearMonth = () => {
    clearMonthAssignments(currentYear, currentMonthIndex);
    setToast({
      type: 'success',
      text: `A escala de ${monthName}/${currentYear} foi zerada completamente com sucesso!`,
    });
    setTimeout(() => onClose(), 1500);
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200 cursor-pointer"
    >
      <div
        onClick={e => e.stopPropagation()}
        className="bg-[#0e1017] border border-white/[0.09] text-white rounded-2xl max-w-3xl w-full overflow-hidden shadow-2xl flex flex-col max-h-[92vh] cursor-default"
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-white/[0.08] flex items-center justify-between bg-[#12141c]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#00d2d3]/20 to-purple-500/20 border border-[#00d2d3]/30 flex items-center justify-center text-[#00d2d3]">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-base text-white tracking-tight flex items-center gap-2">
                Montador e Importador de Escala
                <span className="px-2 py-0.5 text-[10px] font-semibold bg-[#00d2d3]/20 text-[#00d2d3] border border-[#00d2d3]/30 rounded-full">
                  Sem necessidade de API Key
                </span>
              </h3>
              <p className="text-xs text-neutral-400">
                Insira a escala por foto de papel/lousa com IA, colar texto, padrões de turma ou zerar escala
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

        {/* Feedback Alert */}
        {toast && (
          <div
            className={`mx-6 mt-4 p-3.5 rounded-xl border flex items-center gap-3 text-xs ${
              toast.type === 'success'
                ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                : 'bg-rose-500/15 border-rose-500/30 text-rose-300'
            }`}
          >
            {toast.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
            )}
            <span className="font-medium">{toast.text}</span>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="px-6 pt-4 pb-2 border-b border-white/[0.06] flex items-center gap-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab('ai_photo')}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 shrink-0 ${
              activeTab === 'ai_photo'
                ? 'bg-[#00d2d3] text-black shadow-md shadow-[#00d2d3]/20'
                : 'bg-[#141720] text-neutral-400 hover:text-white border border-white/[0.06]'
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Foto / Imagem com IA</span>
          </button>

          <button
            onClick={() => setActiveTab('text_paste')}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 shrink-0 ${
              activeTab === 'text_paste'
                ? 'bg-[#00d2d3] text-black shadow-md shadow-[#00d2d3]/20'
                : 'bg-[#141720] text-neutral-400 hover:text-white border border-white/[0.06]'
            }`}
          >
            <Copy className="w-3.5 h-3.5" />
            <span>Copiar & Colar Texto / WhatsApp</span>
          </button>

          <button
            onClick={() => setActiveTab('team_patterns')}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 shrink-0 ${
              activeTab === 'team_patterns'
                ? 'bg-[#00d2d3] text-black shadow-md shadow-[#00d2d3]/20'
                : 'bg-[#141720] text-neutral-400 hover:text-white border border-white/[0.06]'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Gerar por Turma (1 Clique)</span>
          </button>

          <button
            onClick={() => setActiveTab('clear')}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 shrink-0 ${
              activeTab === 'clear'
                ? 'bg-rose-600 text-white shadow-md shadow-rose-600/20'
                : 'bg-[#141720] text-rose-400 hover:bg-rose-500/10 border border-rose-500/20'
            }`}
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Zerar Escala</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6 overflow-y-auto space-y-5 text-sm flex-1">
          {/* TAB 1: AI PHOTO PARSER */}
          {activeTab === 'ai_photo' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-[#141720] border border-white/[0.06] space-y-2">
                <h4 className="text-xs font-semibold text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#00d2d3]" />
                  Upload da Foto ou Print da Escala
                </h4>
                <p className="text-xs text-neutral-400">
                  Tire foto da escala no papel, lousa, PDF ou envie o print do WhatsApp. O sistema utiliza a IA integrada no servidor sem necessidade de você colocar nenhuma chave de API.
                </p>
              </div>

              {/* Upload Dropzone */}
              <label className="border-2 border-dashed border-white/[0.12] hover:border-[#00d2d3]/50 rounded-2xl p-6 flex flex-col items-center justify-center gap-3 cursor-pointer bg-[#12141c]/50 hover:bg-[#141720] transition-all">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
                {imagePreview ? (
                  <div className="relative max-h-48 w-full flex justify-center">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="max-h-48 rounded-xl object-contain border border-white/10"
                    />
                  </div>
                ) : (
                  <>
                    <div className="w-12 h-12 rounded-2xl bg-[#00d2d3]/10 border border-[#00d2d3]/20 text-[#00d2d3] flex items-center justify-center">
                      <Upload className="w-6 h-6" />
                    </div>
                    <div className="text-center">
                      <span className="text-xs font-semibold text-white block">
                        Clique para selecionar ou solte a imagem da escala aqui
                      </span>
                      <span className="text-[11px] text-neutral-500 block mt-1">
                        Formatos aceitos: PNG, JPG, JPEG, WebP
                      </span>
                    </div>
                  </>
                )}
              </label>

              {/* Action button */}
              <div className="flex items-center justify-between">
                <span className="text-xs text-neutral-400">
                  {selectedFile ? `Arquivo: ${selectedFile.name}` : 'Nenhum arquivo selecionado'}
                </span>
                <button
                  type="button"
                  onClick={handleRunAiParse}
                  disabled={!imagePreview || isAiLoading}
                  className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-[#00d2d3] hover:bg-[#57f1db] text-[#003731] shadow-lg shadow-[#00d2d3]/20 transition-all disabled:opacity-50 flex items-center gap-2"
                >
                  {isAiLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Analisando com IA...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Analisar Foto com IA</span>
                    </>
                  )}
                </button>
              </div>

              {/* Preview Table of Extracted Data */}
              {aiPreviewData.length > 0 && (
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between">
                    <h5 className="text-xs font-semibold text-white flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      Prévia dos Plantões Extraídos ({aiPreviewData.length})
                    </h5>
                    <button
                      type="button"
                      onClick={handleApplyAiAssignments}
                      className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-black shadow-md flex items-center gap-1.5"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Aplicar esta Escala no Sistema
                    </button>
                  </div>

                  <div className="max-h-48 overflow-y-auto border border-white/[0.08] rounded-xl bg-[#141720] divide-y divide-white/[0.04]">
                    {aiPreviewData.map((item, idx) => (
                      <div key={idx} className="p-2.5 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <User className="w-3.5 h-3.5 text-neutral-400" />
                          <span className="font-semibold text-white">{item.providerName || 'Desconhecido'}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-mono text-neutral-300">{item.date}</span>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              item.shiftCode === 'T'
                                ? 'bg-[#00d2d3]/20 text-[#00d2d3]'
                                : 'bg-neutral-800 text-neutral-400'
                            }`}
                          >
                            {item.shiftCode === 'T' ? 'Trabalha (T)' : 'Folga (D)'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: TEXT PASTE / WHATSAPP */}
          {activeTab === 'text_paste' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-[#141720] border border-white/[0.06] space-y-1">
                <h4 className="text-xs font-semibold text-white flex items-center gap-2">
                  <FileText className="w-4 h-4 text-[#00d2d3]" />
                  Cole a Mensagem do WhatsApp ou Texto da Escala
                </h4>
                <p className="text-xs text-neutral-400">
                  Copie a mensagem de escala recebida no WhatsApp ou documento de texto e cole abaixo. A IA interpretará os dias de cada colaborador.
                </p>
              </div>

              <textarea
                rows={6}
                value={rawText}
                onChange={e => setRawText(e.target.value)}
                placeholder={`Exemplo:\nDaniel: dias 01, 03, 05, 07, 09, 11, 13, 15, 17, 19, 21, 23, 25, 27, 29, 31\nNatasha: dias 02, 04, 06, 08, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30`}
                className="w-full bg-[#161922] border border-white/[0.08] rounded-xl p-3.5 text-white font-mono text-xs focus:outline-none focus:border-[#00d2d3]/50 resize-none"
              />

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleRunAiParse}
                  disabled={!rawText.trim() || isAiLoading}
                  className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-[#00d2d3] hover:bg-[#57f1db] text-[#003731] shadow-lg shadow-[#00d2d3]/20 transition-all disabled:opacity-50 flex items-center gap-2"
                >
                  {isAiLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Processando Texto...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Processar Texto com IA</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: TEAM PATTERNS (1 CLICK GENERATOR) */}
          {activeTab === 'team_patterns' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-[#141720] border border-white/[0.06] space-y-1">
                <h4 className="text-xs font-semibold text-white flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-400" />
                  Gerador Automático por Padrão de Turma
                </h4>
                <p className="text-xs text-neutral-400">
                  Aplica automaticamente os dias de trabalho para toda a equipe cadastrada em {monthName} de {currentYear} com base no grupo contratual (Turma A = Dias Ímpares, Turma B = Dias Pares, Regime 5x2 = Seg-Sex).
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="p-4 rounded-xl bg-[#141720] border border-white/[0.06] space-y-2">
                  <span className="text-xs font-bold text-white block">Turma A (Dias Ímpares)</span>
                  <p className="text-[11px] text-neutral-400">
                    Trabalha nos dias 1, 3, 5, 7, 9, 11, 13, 15, 17, 19, 21, 23, 25, 27, 29, 31 e folga nos pares.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-[#141720] border border-white/[0.06] space-y-2">
                  <span className="text-xs font-bold text-white block">Turma B (Dias Pares)</span>
                  <p className="text-[11px] text-neutral-400">
                    Trabalha nos dias 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30 e folga nos ímpares.
                  </p>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={handleApplyTurmas}
                  className="px-6 py-3 rounded-xl text-xs font-bold bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black shadow-lg shadow-amber-500/20 flex items-center gap-2"
                >
                  <Zap className="w-4 h-4" />
                  Gerar Escala por Turmas para {monthName}/{currentYear}
                </button>
              </div>
            </div>
          )}

          {/* TAB 4: CLEAR MONTH SCHEDULE */}
          {activeTab === 'clear' && (
            <div className="space-y-4">
              <div className="p-5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-200 space-y-2">
                <h4 className="text-sm font-semibold flex items-center gap-2 text-rose-300">
                  <Trash2 className="w-4 h-4" />
                  Zerar Escala de {monthName} de {currentYear}?
                </h4>
                <p className="text-xs text-neutral-300 leading-relaxed">
                  Esta ação removerá todos os plantões cadastrados no mês de {monthName} de {currentYear} de todos os prestadores de serviço, deixando a grade 100% limpa para você inserir a nova escala.
                </p>
              </div>

              <div className="pt-3 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl text-xs font-medium text-neutral-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleClearMonth}
                  className="px-6 py-2.5 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/30 flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Confirmar e Zerar Escala Agora
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-white/[0.08] bg-[#12141c] flex items-center justify-between">
          <span className="text-xs text-neutral-400">
            {providers.length} colaboradores cadastrados na equipe
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-medium text-neutral-300 hover:text-white hover:bg-white/[0.06] transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
