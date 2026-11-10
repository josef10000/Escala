import React, { useState } from 'react';
import { Prestador } from '../types';
import { Copy, Check, Edit2, Trash2, Star, ArrowUpDown, MapPin, Hash } from 'lucide-react';
import { getRegionColor } from '../utils/search';
import { Pagination } from './Pagination';
import { WhatsAppIcon } from './WhatsAppIcon';
import { getWhatsAppUrl, cleanPhoneNumber, openWhatsApp, WHATSAPP_TAB_NAME } from '../utils/whatsapp';

interface PrestadorTableViewProps {
  prestadores: Prestador[];
  onEdit: (p: Prestador) => void;
  onDelete: (id: string) => void;
  onCopySuccess: (text: string) => void;
  favorites: string[];
  onToggleFavorite: (id: string) => void;
}

export const PrestadorTableView: React.FC<PrestadorTableViewProps> = ({
  prestadores,
  onEdit,
  onDelete,
  onCopySuccess,
  favorites,
  onToggleFavorite,
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [sortField, setSortField] = useState<'codigo' | 'nome' | 'regiao'>('nome');
  const [sortAsc, setSortAsc] = useState<boolean>(true);
  const itemsPerPage = 15;

  const handleCopy = (p: Prestador) => {
    const text = `${p.codigo} - ${p.nome} - ${p.regiao}`;
    navigator.clipboard.writeText(text);
    setCopiedId(p.id);
    onCopySuccess(`Copiado: ${text}`);
    setTimeout(() => setCopiedId(null), 1800);
  };

  const sortedList = [...prestadores].sort((a, b) => {
    const valA = a[sortField].toLowerCase();
    const valB = b[sortField].toLowerCase();
    if (valA < valB) return sortAsc ? -1 : 1;
    if (valA > valB) return sortAsc ? 1 : -1;
    return 0;
  });

  const totalPages = Math.ceil(sortedList.length / itemsPerPage);
  const effectivePage = Math.min(currentPage, Math.max(1, totalPages));
  const startIndex = (effectivePage - 1) * itemsPerPage;
  const paginatedList = sortedList.slice(startIndex, startIndex + itemsPerPage);

  const toggleSort = (field: 'codigo' | 'nome' | 'regiao') => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  if (prestadores.length === 0) {
    return (
      <div className="bg-[#111827] border border-slate-800/80 rounded-2xl p-12 text-center">
        <p className="text-sm font-semibold text-white">Nenhum registro encontrado</p>
        <p className="text-xs text-[#9CA3AF] mt-1.5">Ajuste os filtros de pesquisa para visualizar os prestadores.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-[#111622]/80 backdrop-blur-2xl border border-white/[0.08] rounded-2xl overflow-hidden shadow-[0_12px_32px_rgba(0,0,0,0.6)]">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-[#090d16]/80 uppercase font-semibold text-slate-400 border-b border-white/[0.08]">
              <tr>
                <th scope="col" className="px-3 py-3 w-10 text-center">Fav</th>
                <th
                  scope="col"
                  className="px-4 py-3 cursor-pointer hover:text-white transition-colors"
                  onClick={() => toggleSort('codigo')}
                >
                  <div className="flex items-center gap-1 font-mono">
                    <span>Código</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-500" />
                  </div>
                </th>
                <th
                  scope="col"
                  className="px-4 py-3 cursor-pointer hover:text-white transition-colors"
                  onClick={() => toggleSort('nome')}
                >
                  <div className="flex items-center gap-1">
                    <span>Nome</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-500" />
                  </div>
                </th>
                <th
                  scope="col"
                  className="px-4 py-3 cursor-pointer hover:text-white transition-colors"
                  onClick={() => toggleSort('regiao')}
                >
                  <div className="flex items-center gap-1">
                    <span>Região / Base</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-500" />
                  </div>
                </th>
                <th scope="col" className="px-4 py-3 text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {paginatedList.map((p) => {
                const isCopied = copiedId === p.id;
                const isFav = favorites.includes(p.id);
                const color = getRegionColor(p.regiao);

                return (
                  <tr
                    key={p.id}
                    className="hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="px-3 py-2.5 text-center">
                      <button
                        type="button"
                        onClick={() => onToggleFavorite(p.id)}
                        className={`p-1 rounded transition-colors ${
                          isFav ? 'text-amber-400' : 'text-slate-600 hover:text-slate-400'
                        }`}
                        title={isFav ? 'Remover favorito' : 'Favoritar'}
                      >
                        <Star className={`w-3.5 h-3.5 ${isFav ? 'fill-amber-400' : ''}`} />
                      </button>
                    </td>

                    <td className="px-4 py-2.5 font-mono font-bold text-slate-200">
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300">
                        <Hash className="w-2.5 h-2.5 text-slate-500" />
                        {p.codigo}
                      </span>
                    </td>

                    <td className="px-4 py-2.5 font-medium text-slate-100 uppercase tracking-tight">
                      <div className="flex items-center gap-2">
                        <span>{p.nome}</span>
                        {p.telefone && (
                          <a
                            href={getWhatsAppUrl(p.telefone, p.nome, p.codigo)}
                            target={WHATSAPP_TAB_NAME}
                            rel="noopener noreferrer"
                            onClick={(e) => {
                              e.preventDefault();
                              openWhatsApp(p.telefone!, p.nome, p.codigo);
                            }}
                            className="inline-flex items-center gap-1 font-mono text-slate-400 hover:text-emerald-400 text-xs font-normal hover:underline cursor-pointer"
                            title="Conversar no WhatsApp (mesma aba)"
                          >
                            <WhatsAppIcon className="w-3.5 h-3.5 text-emerald-500" />
                            <span>{p.telefone}</span>
                          </a>
                        )}
                      </div>
                    </td>

                    <td className="px-4 py-2.5">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-medium font-mono uppercase tracking-wide border ${color.bg} ${color.text} ${color.border}`}
                      >
                        <MapPin className="w-3 h-3 opacity-70" />
                        {p.regiao}
                      </span>
                    </td>

                    <td className="px-4 py-2.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleCopy(p)}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                            isCopied
                              ? 'bg-emerald-600 text-white'
                              : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700/60'
                          }`}
                        >
                          {isCopied ? (
                            <>
                              <Check className="w-3 h-3" />
                              <span>Copiado</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3 text-slate-400" />
                              <span>Copiar</span>
                            </>
                          )}
                        </button>

                        {p.telefone && cleanPhoneNumber(p.telefone) && (
                          <a
                            href={getWhatsAppUrl(p.telefone, p.nome, p.codigo)}
                            target={WHATSAPP_TAB_NAME}
                            rel="noopener noreferrer"
                            onClick={(e) => {
                              e.preventDefault();
                              openWhatsApp(p.telefone!, p.nome, p.codigo);
                            }}
                            className="p-1 rounded-lg bg-slate-800/80 hover:bg-emerald-950/60 text-slate-400 hover:text-emerald-400 border border-slate-700/60 transition-colors flex items-center justify-center cursor-pointer"
                            title={`Conversar no WhatsApp com ${p.nome} (mesma aba)`}
                          >
                            <WhatsAppIcon className="w-3.5 h-3.5" />
                          </a>
                        )}

                        <button
                          type="button"
                          onClick={() => onEdit(p)}
                          className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                          title="Editar"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>

                        <button
                          type="button"
                          onClick={() => onDelete(p.id)}
                          className="p-1 rounded text-slate-400 hover:text-red-400 hover:bg-slate-800 transition-colors"
                          title="Excluir"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      <Pagination
        currentPage={effectivePage}
        totalItems={sortedList.length}
        itemsPerPage={itemsPerPage}
        onPageChange={(page) => {
          setCurrentPage(page);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />
    </div>
  );
};
