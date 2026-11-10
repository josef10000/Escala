import React, { useState } from 'react';
import { Share2, Copy, Check, X, ExternalLink, Globe, Smartphone, QrCode } from 'lucide-react';
import { DrMonitoraLogo } from './DrMonitoraLogo';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  sharedUrl: string;
}

export const ShareModal: React.FC<ShareModalProps> = ({
  isOpen,
  onClose,
  sharedUrl,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(sharedUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-[#121929] border border-slate-700/80 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="bg-[#182338] px-6 py-4 border-b border-slate-700/70 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <DrMonitoraLogo size="sm" theme="dark" />
            <div>
              <h2 className="text-base font-bold text-white">Compartilhar App</h2>
              <p className="text-xs text-slate-400">Central de Prestadores</p>
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
        <div className="p-6 space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-blue-400" />
              Link Público do App
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={sharedUrl}
                className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs font-mono text-blue-200 select-all focus:outline-none"
              />
              <button
                type="button"
                onClick={handleCopy}
                className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shrink-0 transition-colors shadow-md shadow-blue-600/20"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-300" />
                    <span>Copiado!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copiar</span>
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2 text-xs text-slate-300">
            <div className="flex items-start gap-2">
              <Smartphone className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <p>
                Qualquer pessoa com esse link pode abrir no <strong>celular, tablet ou computador</strong> sem precisar instalar nada nem fazer login.
              </p>
            </div>
            <div className="flex items-start gap-2 text-slate-400 pt-1">
              <ExternalLink className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
              <p>
                Você também pode clicar no botão <strong>&ldquo;Share&rdquo; (Compartilhar)</strong> no canto superior direito da tela do Google AI Studio para gerenciar permissões.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-[#182338] px-6 py-3 border-t border-slate-700/70 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs rounded-xl font-medium text-slate-300 hover:bg-slate-800 transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
