import React from 'react';
import {
  Lock,
  Unlock,
  Inbox,
  LogOut,
  Share2,
  CalendarDays,
  Calendar,
  LayoutGrid,
  UserCheck,
} from 'lucide-react';
import { useSchedule } from '../context/ScheduleContext';

interface NavbarProps {
  onOpenLeaderAuth: () => void;
  onOpenRequestsCenter?: () => void;
  onOpenNewShiftModal?: () => void;
  onOpenAutoScheduleModal?: () => void;
  onOpenProviderModal?: () => void;
  onOpenShareModal?: () => void;
  onOpenCollaboratorAuth?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenLeaderAuth,
  onOpenRequestsCenter,
  onOpenShareModal,
  onOpenCollaboratorAuth,
}) => {
  const {
    providers,
    isLeaderAuthenticated,
    authenticatedProviderId,
    logoutProvider,
    isSyncing,
    swapRequests,
    scheduleRequests,
    viewMode,
    setViewMode,
  } = useSchedule();

  const pendingSwapsCount = swapRequests.filter(s => s.status === 'pending_supervisor').length;
  const pendingRequestsCount = scheduleRequests.filter(r => r.status === 'pending').length;
  const totalPending = pendingSwapsCount + pendingRequestsCount;

  const authProviderObj = providers.find(p => p.id === authenticatedProviderId);

  return (
    <header className="bg-[#0c121c]/95 backdrop-blur-md border-b border-[#1a2538] sticky top-0 z-40 text-slate-100 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-15 gap-4">
          
          {/* Brand + Clean Cyan Identity with Grey Calendar Icon */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-slate-800/90 border border-slate-700/80 flex items-center justify-center text-slate-400 font-black text-sm shadow-md transition-colors hover:text-cyan-400 hover:border-cyan-500/50">
              <Calendar className="w-5 h-5 text-slate-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-black tracking-tight text-cyan-400 flex items-center gap-0.5">
                  EscalaPro
                </span>
                <span
                  className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-cyan-400 bg-slate-900/80 border border-slate-800 px-2.5 py-0.5 rounded-full font-medium transition-colors cursor-default"
                  title="Sincronização em tempo real ativa na nuvem"
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      isSyncing ? 'bg-amber-400 animate-pulse' : 'bg-cyan-400 shadow-[0_0_6px_rgba(6,182,212,0.9)]'
                    }`}
                  />
                  <span className="hidden sm:inline">Nuvem Conectada</span>
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium hidden sm:block">
                Gestão Humanizada de Escalas & Plantões
              </p>
            </div>
          </div>

          {/* Center: Neutral Grey Navigation Icons turning Cyan on Hover */}
          <div className="hidden lg:flex items-center p-1 bg-[#141c28] rounded-xl border border-[#1e2a3a] text-xs font-semibold">
            <button
              onClick={() => setViewMode('escala')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                viewMode === 'escala'
                  ? 'bg-slate-800/90 text-cyan-400 shadow-sm border border-cyan-500/30 font-bold'
                  : 'text-slate-400 hover:text-cyan-400 hover:bg-slate-800/50'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Quadro Geral</span>
            </button>

            <button
              onClick={() => setViewMode('personal-calendar')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                viewMode === 'personal-calendar'
                  ? 'bg-slate-800/90 text-cyan-400 shadow-sm border border-cyan-500/30 font-bold'
                  : 'text-slate-400 hover:text-cyan-400 hover:bg-slate-800/50'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Meu Calendário</span>
            </button>

            <button
              onClick={() => setViewMode('agenda')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                viewMode === 'agenda'
                  ? 'bg-slate-800/90 text-cyan-400 shadow-sm border border-cyan-500/30 font-bold'
                  : 'text-slate-400 hover:text-cyan-400 hover:bg-slate-800/50'
              }`}
            >
              <CalendarDays className="w-3.5 h-3.5" />
              <span>Agenda Diária</span>
            </button>
          </div>

          {/* Right Controls */}
          <div className="flex items-center gap-2">
            {/* If supervisor, show Leader Central de Pedidos button */}
            {isLeaderAuthenticated && onOpenRequestsCenter && (
              <button
                onClick={onOpenRequestsCenter}
                className="relative flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:text-cyan-400 bg-[#141c28] hover:bg-slate-800 border border-[#1e2a3a] rounded-xl transition-colors cursor-pointer"
                title="Central de pedidos de folga e trocas"
              >
                <Inbox className="w-4 h-4 text-slate-400" />
                <span className="hidden md:inline">Pedidos & Trocas</span>
                {totalPending > 0 && (
                  <span className="px-1.5 py-0.2 bg-cyan-500 text-slate-950 rounded-full text-xs font-black shadow-xs">
                    {totalPending}
                  </span>
                )}
              </button>
            )}

            {/* If collaborator is identified, show their badge with switch / disconnect */}
            {!isLeaderAuthenticated && authProviderObj && (
              <div className="flex items-center gap-1.5 bg-[#141c28] border border-[#1e2a3a] px-2.5 py-1 rounded-xl text-xs shadow-sm">
                <button
                  type="button"
                  onClick={() => {
                    setViewMode('personal-calendar');
                  }}
                  className="flex items-center gap-1.5 text-slate-200 hover:text-cyan-300 font-bold transition-colors cursor-pointer"
                  title="Abrir meu calendário individual"
                >
                  <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_6px_rgba(6,182,212,0.9)]" />
                  <span className="truncate max-w-[120px]">{authProviderObj.name.split(' ')[0]} (Você)</span>
                </button>
                {onOpenCollaboratorAuth && (
                  <button
                    type="button"
                    onClick={onOpenCollaboratorAuth}
                    className="text-slate-400 hover:text-cyan-300 p-0.5 rounded transition-colors cursor-pointer ml-1"
                    title="Trocar de colaborador"
                  >
                    <UserCheck className="w-3.5 h-3.5" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={logoutProvider}
                  className="text-slate-400 hover:text-rose-400 p-0.5 rounded transition-colors cursor-pointer"
                  title="Desconectar deste aparelho"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* If collaborator is NOT identified, show Identificar-me button */}
            {!isLeaderAuthenticated && !authProviderObj && onOpenCollaboratorAuth && (
              <button
                type="button"
                onClick={onOpenCollaboratorAuth}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-cyan-300 hover:text-white bg-cyan-950/60 hover:bg-cyan-900/60 border border-cyan-800/80 rounded-xl transition-all cursor-pointer shadow-sm"
                title="Conectar seu perfil de prestador neste aparelho"
              >
                <UserCheck className="w-3.5 h-3.5 text-cyan-400" />
                <span className="hidden sm:inline">Identificar-me</span>
              </button>
            )}

            {/* Share with Team button in electric blue/cyan */}
            {onOpenShareModal && (
              <button
                onClick={onOpenShareModal}
                className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 border border-cyan-400/30 rounded-xl transition-all cursor-pointer shadow-md shadow-cyan-950/40 active:scale-98"
                title="Compartilhar link de acesso com a equipe ou enviar no WhatsApp"
              >
                <Share2 className="w-3.5 h-3.5 text-cyan-200" />
                <span className="hidden sm:inline">Compartilhar Escala</span>
              </button>
            )}

            {/* Leader Access Button */}
            {isLeaderAuthenticated ? (
              <button
                onClick={onOpenLeaderAuth}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-200 bg-[#141c28] hover:bg-slate-800 border border-[#1e2a3a] hover:border-cyan-500/40 rounded-xl transition-all cursor-pointer"
                title="Você está com permissão de edição. Clique para opções de senha ou sair."
              >
                <Unlock className="w-3.5 h-3.5 text-cyan-400" />
                <span className="text-slate-100">Modo Líder</span>
              </button>
            ) : (
              <button
                onClick={onOpenLeaderAuth}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-300 hover:text-cyan-400 bg-[#141c28] hover:bg-slate-800 border border-[#1e2a3a] rounded-xl transition-all cursor-pointer shadow-sm"
                title="Apenas a líder pode fazer alterações na escala. Clique para digitar o PIN."
              >
                <Lock className="w-3.5 h-3.5 text-slate-400" />
                <span>Acesso da Líder</span>
              </button>
            )}
          </div>

        </div>
      </div>
    </header>
  );
};
