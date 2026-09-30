import React from 'react';
import {
  Calendar,
  CalendarDays,
  Lock,
  Unlock,
  Cloud,
  Clock,
  Inbox,
  User,
  LogOut
} from 'lucide-react';
import { useSchedule } from '../context/ScheduleContext';
import { ViewMode } from '../types';

interface NavbarProps {
  onOpenLeaderAuth: () => void;
  onOpenRequestsCenter?: () => void;
  onOpenNewShiftModal?: () => void;
  onOpenAutoScheduleModal?: () => void;
  onOpenProviderModal?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenLeaderAuth,
  onOpenRequestsCenter,
}) => {
  const {
    role,
    activeProviderId,
    setActiveProviderId,
    providers,
    viewMode,
    setViewMode,
    isLeaderAuthenticated,
    authenticatedProviderId,
    logoutProvider,
    isSyncing,
    lastUpdatedAt,
    lastUpdatedBy,
    swapRequests,
    scheduleRequests,
  } = useSchedule();

  const pendingSwapsCount = swapRequests.filter(s => s.status === 'pending_supervisor').length;
  const pendingRequestsCount = scheduleRequests.filter(r => r.status === 'pending').length;
  const totalPending = pendingSwapsCount + pendingRequestsCount;

  const authProviderObj = providers.find(p => p.id === authenticatedProviderId);

  const formatLastUpdatedShort = (isoStr: string) => {
    try {
      const d = new Date(isoStr);
      return d.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return '';
    }
  };

  return (
    <header className="bg-slate-900/95 backdrop-blur-md border-b border-slate-800 sticky top-0 z-40 text-slate-100 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-3">
          {/* Brand + Cloud info */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-emerald-500 flex items-center justify-center text-white font-black text-base shadow-sm">
              EP
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-bold tracking-tight text-white">
                  EscalaPro
                </span>
                {/* Cloud Sync Indicator */}
                <div
                  className="flex items-center gap-1 text-[10px] text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-2 py-0.5 rounded-full font-medium"
                  title="Sincronizado na Nuvem via Firebase"
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      isSyncing ? 'bg-amber-400 animate-ping' : 'bg-emerald-400'
                    }`}
                  />
                  <span className="hidden md:inline">Nuvem Ativa</span>
                </div>
              </div>

              {/* Last update date */}
              {lastUpdatedAt && (
                <div className="text-[10px] text-slate-400 flex items-center gap-1.5 flex-wrap mt-0.5">
                  <Clock className="w-3 h-3 text-slate-500 shrink-0" />
                  <span className="hidden sm:inline">Última atualização:</span>
                  <span className="text-indigo-300 font-mono font-medium">
                    {formatLastUpdatedShort(lastUpdatedAt)}
                  </span>
                  {lastUpdatedBy && (
                    <span className="text-emerald-400 font-bold bg-emerald-950/40 border border-emerald-500/20 px-1.5 py-0.2 rounded-md">
                      por {lastUpdatedBy}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Primary Navigation Tabs */}
          <nav className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800/80">
            <button
              onClick={() => setViewMode('escala')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                viewMode === 'escala'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Quadro Geral</span>
              <span className="sm:hidden">Quadro</span>
            </button>

            <button
              onClick={() => {
                // If collaborator logged in, open their personal calendar
                if (authenticatedProviderId) {
                  setActiveProviderId(authenticatedProviderId);
                }
                setViewMode('personal-calendar');
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                viewMode === 'personal-calendar'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <CalendarDays className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Meu Calendário</span>
              <span className="sm:hidden">Meu Mês</span>
            </button>
          </nav>

          {/* Right Controls */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* If supervisor, show Leader Central de Pedidos button */}
            {isLeaderAuthenticated && onOpenRequestsCenter && (
              <button
                onClick={onOpenRequestsCenter}
                className="relative flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-indigo-950 border border-indigo-500/40 hover:bg-indigo-900 rounded-xl transition-all shadow-sm"
                title="Central de pedidos de folga e trocas de escala"
              >
                <Inbox className="w-3.5 h-3.5 text-indigo-400" />
                <span className="hidden lg:inline">Pedidos & Trocas</span>
                {totalPending > 0 && (
                  <span className="px-1.5 py-0.2 bg-amber-500 text-slate-950 rounded-full text-[10px] font-black animate-pulse">
                    {totalPending}
                  </span>
                )}
              </button>
            )}

            {/* If collaborator is identified, show their badge */}
            {!isLeaderAuthenticated && authProviderObj && (
              <div className="hidden md:flex items-center gap-1.5 bg-slate-950 border border-indigo-500/40 px-2.5 py-1 rounded-xl text-xs">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span className="text-slate-300 font-medium truncate max-w-[110px]">
                  {authProviderObj.name}
                </span>
                <button
                  onClick={logoutProvider}
                  className="text-slate-500 hover:text-rose-400 p-0.5 rounded transition-colors"
                  title="Desconectar do meu perfil"
                >
                  <LogOut className="w-3 h-3" />
                </button>
              </div>
            )}

            {/* Leader Access Button */}
            {isLeaderAuthenticated ? (
              <button
                onClick={onOpenLeaderAuth}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-emerald-300 bg-emerald-950/80 hover:bg-emerald-900/80 border border-emerald-500/40 rounded-xl transition-all shadow-sm"
                title="Você está com permissão de edição. Clique para opções de senha ou sair."
              >
                <Unlock className="w-3.5 h-3.5 text-emerald-400" />
                <span className="hidden sm:inline">Líder (Edição Ativa)</span>
                <span className="sm:hidden">Líder</span>
              </button>
            ) : (
              <button
                onClick={onOpenLeaderAuth}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-amber-300 bg-slate-800 hover:bg-slate-700 border border-amber-500/40 rounded-xl transition-all shadow-sm"
                title="Apenas a líder pode fazer alterações na escala. Clique para digitar o PIN."
              >
                <Lock className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden sm:inline">Acesso da Líder</span>
                <span className="sm:hidden">Líder</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
