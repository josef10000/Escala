import React from 'react';
import {
  Lock,
  Unlock,
  Inbox,
  LogOut,
  Share2,
  User as UserIcon,
  Coins,
  Calendar,
  Users,
  MapPin,
  MessageSquare,
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
  onOpenExecutiveReportModal?: () => void;
  onOpenMarketplace?: () => void;
  onOpenProfileModal?: () => void;
  onOpenImportModal?: () => void;
  onOpenAnnouncements?: () => void;
  onOpenAuditLog?: () => void;
  onOpenKpiModal?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenLeaderAuth,
  onOpenRequestsCenter,
  onOpenProviderModal,
  onOpenShareModal,
  onOpenCollaboratorAuth,
  onOpenExecutiveReportModal,
  onOpenMarketplace,
  onOpenProfileModal,
  onOpenAuditLog,
  onOpenKpiModal,
}) => {
  const {
    providers,
    isLeaderAuthenticated,
    leaderName,
    authenticatedProviderId,
    activeProviderId,
    logoutProvider,
    logoutLeader,
    swapRequests,
    scheduleRequests,
    shiftSaleOffers,
    viewMode,
    setViewMode,
    activeModule,
    setActiveModule,
  } = useSchedule();

  const pendingSwapsCount = swapRequests.filter(s => s.status === 'pending_supervisor').length;
  const pendingRequestsCount = scheduleRequests.filter(r => r.status === 'pending').length;
  const totalPending = pendingSwapsCount + pendingRequestsCount;
  const availableSalesCount = shiftSaleOffers.filter(s => s.status === 'available').length;

  // Active or authenticated collaborator / leader profile
  const authProviderObj = providers.find(p => p.id === authenticatedProviderId);
  const activeProviderObj = providers.find(p => p.id === activeProviderId);
  const leaderProviderObj = leaderName ? providers.find(p => p.name.toLowerCase() === leaderName.toLowerCase()) : null;

  const displayUser =
    authProviderObj ||
    leaderProviderObj ||
    (isLeaderAuthenticated && leaderName ? { id: 'leader-temp', name: leaderName, role: 'GESTOR DA ESCALA' } : null) ||
    activeProviderObj ||
    providers[0] ||
    { id: 'guest', name: 'Gestor da Escala', role: 'GESTOR DA ESCALA' };

  return (
    <header className="fixed top-0 inset-x-0 z-50 bg-[#0d0e13]/95 backdrop-blur-xl border-b border-white/[0.08] text-[#e3e2e7] h-16">
      <div className="h-16 w-full px-3 sm:px-6 flex items-center justify-between gap-3 overflow-hidden">
        
        {/* Left: Brand + Navigation Segmented Tabs */}
        <div className="flex items-center gap-3 md:gap-5 shrink-0">
          
          {/* Brand Identity */}
          <button
            type="button"
            onClick={() => {
              setActiveModule('escala');
              setViewMode('escala');
            }}
            className="flex items-center gap-2 cursor-pointer group shrink-0"
          >
            <img
              src="/assets/aistudio/image_fb26a50f.png"
              alt="EscalaPro Logo"
              className="w-8 h-8 object-contain rounded-lg shadow-sm group-hover:scale-105 transition-transform"
            />
            <span className="font-bold text-white tracking-tight text-base hidden xl:inline">
              EscalaPro
            </span>
          </button>

          {/* Primary Hub Modules */}
          <nav className="flex items-center gap-1 p-1 rounded-xl bg-[#14161e] border border-white/[0.08] shrink-0">
            <button
              type="button"
              onClick={() => setActiveModule('escala')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-all cursor-pointer font-medium whitespace-nowrap ${
                activeModule === 'escala'
                  ? 'bg-gradient-to-r from-cyan-600/35 to-blue-600/35 text-white font-semibold border border-cyan-400/40 shadow-sm'
                  : 'text-[#bacac5] hover:text-white hover:bg-white/5'
              }`}
            >
              <Calendar className="w-3.5 h-3.5 text-cyan-400" />
              <span>Escala</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveModule('prestadores_regional')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-all cursor-pointer font-medium whitespace-nowrap ${
                activeModule === 'prestadores_regional'
                  ? 'bg-gradient-to-r from-[#00d2d3]/25 to-teal-500/25 text-white font-semibold border border-[#00d2d3]/40 shadow-sm'
                  : 'text-[#bacac5] hover:text-white hover:bg-white/5'
              }`}
            >
              <Users className="w-3.5 h-3.5 text-[#00d2d3]" />
              <span>Técnicos & CEP</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveModule('pontos_fixos')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-all cursor-pointer font-medium whitespace-nowrap ${
                activeModule === 'pontos_fixos'
                  ? 'bg-gradient-to-r from-emerald-600/35 to-teal-600/35 text-white font-semibold border border-emerald-400/40 shadow-sm'
                  : 'text-[#bacac5] hover:text-white hover:bg-white/5'
              }`}
            >
              <MapPin className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">Pontos Fixos & Agendas</span>
              <span className="sm:hidden">Pontos Fixos</span>
            </button>
          </nav>

          {/* Sub-tabs for Escala */}
          {activeModule === 'escala' && (
            <div className="hidden 2xl:flex items-center gap-1 p-0.5 rounded-lg bg-[#1a1b20] border border-white/[0.05] shrink-0">
              <button
                type="button"
                onClick={() => setViewMode('escala')}
                className={`px-2.5 py-1 rounded text-xs transition-all cursor-pointer font-medium whitespace-nowrap ${
                  viewMode === 'escala'
                    ? 'bg-[#343439] text-white font-semibold shadow-xs'
                    : 'text-[#bacac5] hover:text-white hover:bg-[#292a2e]'
                }`}
              >
                Quadro Geral
              </button>

              <button
                type="button"
                onClick={() => setViewMode('personal-calendar')}
                className={`px-2.5 py-1 rounded text-xs transition-all cursor-pointer font-medium whitespace-nowrap ${
                  viewMode === 'personal-calendar'
                    ? 'bg-[#343439] text-white font-semibold shadow-xs'
                    : 'text-[#bacac5] hover:text-white hover:bg-[#292a2e]'
                }`}
              >
                Meu Calendário
              </button>

              <button
                type="button"
                onClick={() => setViewMode('agenda')}
                className={`px-2.5 py-1 rounded text-xs transition-all cursor-pointer font-medium whitespace-nowrap ${
                  viewMode === 'agenda'
                    ? 'bg-[#343439] text-white font-semibold shadow-xs'
                    : 'text-[#bacac5] hover:text-white hover:bg-[#292a2e]'
                }`}
              >
                Agenda Diária
              </button>

              <button
                type="button"
                onClick={() => {
                  if (onOpenExecutiveReportModal) {
                    onOpenExecutiveReportModal();
                  } else if (onOpenProviderModal) {
                    onOpenProviderModal();
                  } else {
                    setViewMode('escala');
                  }
                }}
                className="px-2.5 py-1 rounded text-xs transition-all cursor-pointer text-[#bacac5] hover:text-white hover:bg-[#292a2e] font-medium whitespace-nowrap"
              >
                Relatórios & Equipe
              </button>
            </div>
          )}
        </div>

        {/* Right Tools, Share, Leader Auth & User Profile */}
        <div className="flex items-center gap-2 shrink-0">
          
          {/* Venda & Repasse de Plantões PJ */}
          {onOpenMarketplace && (
            <button
              type="button"
              onClick={onOpenMarketplace}
              className="h-8 px-2.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 text-xs font-medium border border-amber-500/25 flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
              title="Mural de venda e compra de plantões remunerados PJ"
            >
              <Coins className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden lg:inline whitespace-nowrap">Venda Plantões</span>
              {availableSalesCount > 0 && (
                <span className="px-1.5 py-0.2 bg-amber-400 text-black rounded-full text-[10px] font-black">
                  {availableSalesCount}
                </span>
              )}
            </button>
          )}

          {/* Gestor Only Additional Tools */}
          {isLeaderAuthenticated && (
            <div className="hidden lg:flex items-center gap-1.5 pl-1 border-l border-white/[0.08]">
              {onOpenKpiModal && (
                <button
                  type="button"
                  onClick={onOpenKpiModal}
                  className="h-8 px-2.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-zinc-300 hover:text-white text-xs font-medium border border-white/[0.08] flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
                  title="Indicadores Operacionais e KPIs de Escala"
                >
                  <span>📊 KPIs</span>
                </button>
              )}

              {onOpenAuditLog && (
                <button
                  type="button"
                  onClick={onOpenAuditLog}
                  className="h-8 px-2.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-zinc-300 hover:text-white text-xs font-medium border border-white/[0.08] flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
                  title="Histórico de Auditoria e Log de Alterações"
                >
                  <span>📋 Auditoria</span>
                </button>
              )}

              {onOpenRequestsCenter && (
                <button
                  type="button"
                  onClick={onOpenRequestsCenter}
                  className="relative flex items-center gap-1.5 h-8 px-2.5 text-xs font-medium text-zinc-300 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] rounded-lg transition-colors cursor-pointer shrink-0"
                  title="Central de pedidos de folga e trocas pendentes"
                >
                  <Inbox className="w-3.5 h-3.5 text-zinc-400" />
                  <span className="hidden xl:inline whitespace-nowrap">Pedidos</span>
                  {totalPending > 0 && (
                    <span className="px-1.5 py-0.2 bg-[#00d2d3] text-[#003731] rounded-full text-[10px] font-black">
                      {totalPending}
                    </span>
                  )}
                </button>
              )}
            </div>
          )}

          {/* Share Schedule Action Button - SÓ O SÍMBOLO (Sem texto) */}
          {onOpenShareModal && (
            <button
              type="button"
              onClick={onOpenShareModal}
              className="h-8 w-8 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-zinc-300 hover:text-white border border-white/[0.08] flex items-center justify-center transition-colors cursor-pointer shrink-0"
              title="Compartilhar Escala com a equipe"
            >
              <Share2 className="w-4 h-4 text-zinc-300 group-hover:text-white" />
            </button>
          )}

          {/* Leadership Access Button */}
          {isLeaderAuthenticated ? (
            <button
              type="button"
              onClick={onOpenLeaderAuth}
              className="h-8 px-2.5 sm:px-3 rounded-lg bg-[#00d2d3]/15 hover:bg-[#00d2d3]/25 text-[#00d2d3] text-xs font-semibold border border-[#00d2d3]/30 flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
              title="Líder autenticado. Clique para gerenciar PIN ou desativar."
            >
              <Unlock className="w-3.5 h-3.5 text-[#00d2d3]" />
              <span className="hidden sm:inline whitespace-nowrap">Gestão Ativa</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={onOpenLeaderAuth}
              className="h-8 px-2.5 sm:px-3 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-zinc-300 hover:text-white text-xs font-medium border border-white/[0.08] flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
              title="Clique para acessar como Gestor/Líder da escala"
            >
              <Lock className="w-3.5 h-3.5 text-zinc-400" />
              <span className="hidden sm:inline whitespace-nowrap">Acesso Gestor</span>
            </button>
          )}

          {/* Hairline Divider */}
          <div className="h-5 w-px bg-white/[0.08] hidden sm:block shrink-0" />

          {/* User Profile Block */}
          <div className="flex items-center gap-2 pl-1 shrink-0">
            {onOpenCollaboratorAuth && !authProviderObj && !isLeaderAuthenticated && (
              <button
                type="button"
                onClick={onOpenCollaboratorAuth}
                className="h-8 px-2.5 rounded-lg bg-[#00d2d3]/15 hover:bg-[#00d2d3]/25 text-[#00d2d3] border border-[#00d2d3]/30 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs active:scale-98 shrink-0"
                title="Clique para escolher seu nome na lista, criar seu PIN e entrar no seu perfil"
              >
                <UserIcon className="w-3.5 h-3.5 text-[#00d2d3]" />
                <span className="hidden sm:inline whitespace-nowrap">Meu Perfil</span>
              </button>
            )}

            {/* Profile Name Badge */}
            <button
              type="button"
              onClick={() => {
                if (onOpenProfileModal) {
                  onOpenProfileModal();
                } else if (onOpenCollaboratorAuth) {
                  onOpenCollaboratorAuth();
                }
              }}
              className="hidden md:flex flex-col text-right cursor-pointer group hover:opacity-90 max-w-[130px] lg:max-w-[180px] shrink-0"
              title="Clique para ver ou alterar seu perfil (Nome, WhatsApp, PIX, PIN ou Sair)"
            >
              <span className="text-xs text-white font-semibold truncate leading-tight group-hover:text-[#00d2d3] transition-colors">
                {displayUser.name}
              </span>
              <span className="text-[10px] font-mono text-[#00d2d3] tracking-wider uppercase truncate">
                {isLeaderAuthenticated ? 'GESTOR DA ESCALA' : authProviderObj ? 'PERFIL ATIVO' : 'SELEÇÃO DE PERFIL'}
              </span>
            </button>

            {/* Profile Avatar / Trigger */}
            <div className="relative group shrink-0">
              <button
                type="button"
                onClick={() => {
                  if (onOpenProfileModal) {
                    onOpenProfileModal();
                  } else if (onOpenCollaboratorAuth) {
                    onOpenCollaboratorAuth();
                  }
                }}
                className="w-8 h-8 rounded-full bg-[#00d2d3] hover:brightness-110 active:scale-95 transition-all flex items-center justify-center text-[#003731] font-bold shadow-md cursor-pointer shrink-0"
                title="Meu Perfil (Editar Nome, WhatsApp, PIX, PIN ou Sair)"
              >
                <UserIcon className="w-4 h-4 text-[#003731]" />
              </button>

              {/* Quick logout badge if authenticated */}
              {(authProviderObj || isLeaderAuthenticated) && (
                <button
                  type="button"
                  onClick={() => {
                    if (isLeaderAuthenticated) logoutLeader();
                    if (authProviderObj) logoutProvider();
                  }}
                  className="hidden group-hover:flex absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-rose-600 text-white items-center justify-center hover:bg-rose-500 cursor-pointer shadow-sm"
                  title="Sair do perfil"
                >
                  <LogOut className="w-2.5 h-2.5" />
                </button>
              )}
            </div>
          </div>

        </div>

      </div>
    </header>
  );
};
