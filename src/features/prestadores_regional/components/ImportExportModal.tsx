import React, { useState } from 'react';
import { Prestador } from '../types';
import { X, Download, Upload, FileText, CheckCircle2, AlertCircle } from 'lucide-react';
import { exportToJSON, exportToCSV } from '../utils/storage';

interface ImportExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  prestadores: Prestador[];
  onImport: (newItems: Prestador[]) => void;
}

export const ImportExportModal: React.FC<ImportExportModalProps> = ({
  isOpen,
  onClose,
  prestadores,
  onImport,
}) => {
  const [pasteText, setPasteText] = useState('');
  const [parseError, setParseError] = useState<string | null>(null);
  const [parsedCount, setParsedCount] = useState<number | null>(null);

  if (!isOpen) return null;

  const handleParseText = () => {
    setParseError(null);
    if (!pasteText.trim()) {
      setParseError('Cole pelo menos uma linha de dados.');
      return;
    }

    const lines = pasteText.split('\n').map((l) => l.trim()).filter(Boolean);
    const parsed: Prestador[] = [];

    for (const line of lines) {
      // Split by " - " or "-" or tab or semicolon or comma
      let parts = line.split(/\s*-\s*/);
      if (parts.length < 3) {
        // try semicolon or tab
        parts = line.split(/[;\t]/).map(p => p.trim());
      }

      if (parts.length >= 3) {
        parsed.push({
          id: `imp-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          codigo: parts[0].trim(),
          nome: parts[1].trim(),
          regiao: parts[2].trim().toUpperCase(),
        });
      } else if (parts.length === 2) {
        parsed.push({
          id: `imp-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          codigo: parts[0].trim(),
          nome: parts[1].trim(),
          regiao: 'GERAL_SP',
        });
      }
    }

    if (parsed.length === 0) {
      setParseError('Não foi possível identificar o formato. Use: CÓDIGO - NOME - REGIÃO');
      return;
    }

    setParsedCount(parsed.length);
    onImport(parsed);
    setPasteText('');
    setTimeout(() => {
      onClose();
    }, 1200);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        if (file.name.endsWith('.json')) {
          const parsed = JSON.parse(text);
          if (Array.isArray(parsed)) {
            onImport(parsed);
            onClose();
          }
        } else {
          // treat as csv or plain lines
          setPasteText(text);
        }
      } catch (err) {
        setParseError('Erro ao ler arquivo. Verifique se o formato é válido.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-[#121929] border border-slate-700/80 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="bg-[#182338] px-6 py-4 border-b border-slate-700/70 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-blue-600/20 text-blue-400">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Importar / Exportar Prestadores</h2>
              <p className="text-xs text-slate-400">Faça backup ou adicione novos dados em lote</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Export Section */}
          <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-3">
            <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
              <Download className="w-4 h-4 text-blue-400" />
              Exportar Dados Atuais ({prestadores.length} registros)
            </h3>
            <p className="text-xs text-slate-400">
              Baixe os dados salvos no seu LocalStorage para manter um backup no seu computador.
            </p>
            <div className="flex flex-wrap gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => exportToJSON(prestadores)}
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-md"
              >
                <FileText className="w-4 h-4" />
                Baixar JSON
              </button>
              <button
                type="button"
                onClick={() => exportToCSV(prestadores)}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                <Download className="w-4 h-4" />
                Baixar Planilha CSV
              </button>
            </div>
          </div>

          {/* Import Section */}
          <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-3">
            <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
              <Upload className="w-4 h-4 text-emerald-400" />
              Importar em Lote (Colar Texto ou Subir Arquivo)
            </h3>
            <p className="text-xs text-slate-400">
              Cole linhas no formato clássico: <code className="bg-slate-800 px-1 py-0.5 rounded text-blue-300 font-mono text-xs">18890 - RICARDO N. GODOY - OESTE 1</code>
            </p>

            <textarea
              rows={4}
              value={pasteText}
              onChange={(e) => setPasteText(e.target.value)}
              placeholder="18890 - RICARDO N. GODOY - OESTE 1&#10;59506 - RODOLFO RAMOS - SOROCABA"
              className="w-full p-3 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono text-xs focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none resize-none"
            />

            {parseError && (
              <div className="flex items-center gap-2 p-2.5 rounded-lg bg-red-500/15 border border-red-500/30 text-red-300 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{parseError}</span>
              </div>
            )}

            {parsedCount !== null && (
              <div className="flex items-center gap-2 p-2.5 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-medium">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{parsedCount} prestadores importados com sucesso!</span>
              </div>
            )}

            <div className="flex items-center justify-between pt-1">
              <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-medium transition-colors">
                <Upload className="w-3.5 h-3.5" />
                <span>Escolher Arquivo (.json/.csv/.txt)</span>
                <input
                  type="file"
                  accept=".json,.csv,.txt"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>

              <button
                type="button"
                onClick={handleParseText}
                className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-colors shadow-md flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                Processar e Importar
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-[#182338] px-6 py-3 border-t border-slate-700/70 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs rounded-lg font-medium text-slate-300 hover:bg-slate-800 transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
