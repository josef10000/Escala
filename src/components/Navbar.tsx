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
  Shield,
  FileSpreadsheet,
  User as UserIcon,
  Coins,
  Sparkles,
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
  onOpenShareModal,
  onOpenCollaboratorAuth,
  onOpenExecutiveReportModal,
  onOpenMarketplace,
  onOpenProfileModal,
  onOpenImportModal,
  onOpenAnnouncements,
  onOpenAuditLog,
  onOpenKpiModal,
}) => {
  const {
    providers,
    isLeaderAuthenticated,
    authenticatedProviderId,
    activeProviderId,
    logoutProvider,
    isSyncing,
    swapRequests,
    scheduleRequests,
    shiftSaleOffers,
    viewMode,
    setViewMode,
  } = useSchedule();

  const pendingSwapsCount = swapRequests.filter(s => s.status === 'pending_supervisor').length;
  const pendingRequestsCount = scheduleRequests.filter(r => r.status === 'pending').length;
  const totalPending = pendingSwapsCount + pendingRequestsCount;
  const availableSalesCount = shiftSaleOffers.filter(s => s.status === 'available').length;

  // Active or authenticated collaborator profile
  const authProviderObj = providers.find(p => p.id === authenticatedProviderId);
  const activeProviderObj = providers.find(p => p.id === activeProviderId) || providers[0];
  const displayUser = authProviderObj || (isLeaderAuthenticated ? { name: 'Daniel Antonio da Silva', role: 'PRESTADOR / GESTOR' } : activeProviderObj);

  return (
    <header className="fixed top-0 inset-x-0 z-50 bg-[#0d0e13]/85 backdrop-blur-xl border-b border-white/[0.07] text-[#e3e2e7]">
      <div className="h-16 w-full px-4 sm:px-8 flex items-center justify-between gap-4">
        
        {/* Left: Brand + Nuvem Status + Desktop Navigation Pill */}
        <div className="flex items-center gap-6 xl:gap-8">
          
          {/* Brand Identity */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setViewMode('escala')}
              className="flex items-center gap-2.5 cursor-pointer group text-left"
            >
              <img
                src="/assets/aistudio/image_fb26a50f.png"
                alt="EscalaPro Logo"
                className="w-8 h-8 object-contain rounded-lg shadow-sm group-hover:scale-105 transition-transform"
              />
              <span className="font-semibold text-white tracking-tight text-base">
                EscalaPro
              </span>
            </button>
          </div>

          {/* Center Navigation Tabs (Obsidian Segmented Menu) */}
          <nav className="hidden xl:flex items-center gap-1 p-1 rounded-xl bg-[#1a1b20] border border-white/[0.04]">
            <button
              type="button"
              onClick={() => setViewMode('escala')}
              className={`px-3 py-1.5 rounded-lg text-xs transition-all cursor-pointer font-medium ${
                viewMode === 'escala'
                  ? 'bg-[#343439] text-white font-semibold shadow-sm'
                  : 'text-[#bacac5] hover:text-white hover:bg-[#292a2e]'
              }`}
            >
              Quadro Geral
            </button>

            <button
              type="button"
              onClick={() => setViewMode('personal-calendar')}
              className={`px-3 py-1.5 rounded-lg text-xs transition-all cursor-pointer font-medium ${
                viewMode === 'personal-calendar'
                  ? 'bg-[#343439] text-white font-semibold shadow-sm'
                  : 'text-[#bacac5] hover:text-white hover:bg-[#292a2e]'
              }`}
            >
              Meu Calendário
            </button>

            <button
              type="button"
              onClick={() => setViewMode('agenda')}
              className={`px-3 py-1.5 rounded-lg text-xs transition-all cursor-pointer font-medium ${
                viewMode === 'agenda'
                  ? 'bg-[#343439] text-white font-semibold shadow-sm'
                  : 'text-[#bacac5] hover:text-white hover:bg-[#292a2e]'
              }`}
            >
              Agenda Diária
            </button>

            <button
              type="button"
              onClick={() => {
                if (onOpenExecutiveReportModal) onOpenExecutiveReportModal();
                else setViewMode('escala');
              }}
              className="px-3 py-1.5 rounded-lg text-xs transition-all cursor-pointer text-[#bacac5] hover:text-white hover:bg-[#292a2e] font-medium"
            >
              Relatórios & Equipe
            </button>
          </nav>
        </div>

        {/* Right Actions & User Profile */}
        <div className="flex items-center gap-3">
          
          {/* Venda & Repasse de Plantões PJ */}
          {onOpenMarketplace && (
            <button
              type="button"
              onClick={onOpenMarketplace}
              className="h-8 px-2.5 sm:px-3 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 text-xs font-medium border border-amber-500/25 flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Mural de venda e compra de plantões remunerados PJ"
            >
              <Coins className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">Venda de Plantões</span>
              {availableSalesCount > 0 && (
                <span className="px-1.5 py-0.2 bg-amber-400 text-black rounded-full text-[10px] font-black">
                  {availableSalesCount}
                </span>
              )}
            </button>
          )}

          {/* Announcements / Bulletin Board (Everyone) */}
          {onOpenAnnouncements && (
            <button
              type="button"
              onClick={onOpenAnnouncements}
              className="h-8 px-2.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-zinc-300 hover:text-white text-xs font-medium border border-white/[0.08] flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Mural de Avisos e Comunicados da Liderança"
            >
              <span>📢 Avisos</span>
            </button>
          )}

          {/* Gestor Only Section (Organized, clean, restricted) */}
          {isLeaderAuthenticated && (
            <div className="flex items-center gap-1.5 pl-1 border-l border-white/[0.08]">
              {/* Montar / Importar Escala */}
              {onOpenImportModal && (
                <button
                  type="button"
                  onClick={onOpenImportModal}
                  className="h-8 px-3 rounded-lg bg-[#00d2d3] hover:bg-[#57f1db] text-[#003731] text-xs font-bold shadow-sm flex items-center gap-1.5 transition-all cursor-pointer"
                  title="Importar escala por foto (IA), copiar texto do WhatsApp, gerar por turmas ou zerar escala"
                >
                  <Sparkles className="w-3.5 h-3.5 text-[#003731]" />
                  <span className="hidden md:inline">Montar Escala</span>
                </button>
              )}

              {/* KPIs (Gestor only) */}
              {onOpenKpiModal && (
                <button
                  type="button"
                  onClick={onOpenKpiModal}
                  className="h-8 px-2.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-zinc-300 hover:text-white text-xs font-medium border border-white/[0.08] flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="Indicadores Operacionais e KPIs de Escala"
                >
                  <span>📊 KPIs</span>
                </button>
              )}

              {/* Audit Log (Gestor only) */}
              {onOpenAuditLog && (
                <button
                  type="button"
                  onClick={onOpenAuditLog}
                  className="h-8 px-2.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-zinc-300 hover:text-white text-xs font-medium border border-white/[0.08] flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="Histórico de Auditoria e Log de Alterações"
                >
                  <span>📋 Auditoria</span>
                </button>
              )}

              {/* Pending Requests Badge */}
              {onOpenRequestsCenter && (
                <button
                  type="button"
                  onClick={onOpenRequestsCenter}
                  className="relative flex items-center gap-1.5 h-8 px-2.5 text-xs font-medium text-zinc-300 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] rounded-lg transition-colors cursor-pointer"
                  title="Central de pedidos de folga e trocas pendentes"
                >
                  <Inbox className="w-3.5 h-3.5 text-zinc-400" />
                  <span className="hidden md:inline">Pedidos</span>
                  {totalPending > 0 && (
                    <span className="px-1.5 py-0.2 bg-[#00d2d3] text-[#003731] rounded-full text-[10px] font-black">
                      {totalPending}
                    </span>
                  )}
                </button>
              )}
            </div>
          )}

          {/* Share Schedule Action Button */}
          {onOpenShareModal && (
            <button
              type="button"
              onClick={onOpenShareModal}
              className="hidden sm:flex h-8 px-3 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-zinc-300 hover:text-white text-xs font-medium border border-white/[0.08] items-center gap-1.5 transition-colors cursor-pointer"
              title="Compartilhar Escala com a equipe"
            >
              <Share2 className="w-3.5 h-3.5 text-zinc-400" />
              <span>Compartilhar</span>
            </button>
          )}

          {/* Leadership Access Button */}
          {isLeaderAuthenticated ? (
            <button
              type="button"
              onClick={onOpenLeaderAuth}
              className="h-8 px-2.5 sm:px-3 rounded-lg bg-white/[0.05] hover:bg-white/[0.09] text-zinc-200 hover:text-white text-xs font-medium border border-white/[0.12] flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Líder autenticado. Clique para alterar PIN ou sair."
            >
              <Unlock className="w-3.5 h-3.5 text-[#00d2d3]" />
              <span className="hidden sm:inline">Gestão Ativa</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={onOpenLeaderAuth}
              className="h-8 px-2.5 sm:px-3 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-zinc-300 hover:text-white text-xs font-medium border border-white/[0.08] flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Apenas a líder pode fazer alterações na escala."
            >
              <Lock className="w-3.5 h-3.5 text-zinc-400" />
              <span className="hidden sm:inline">Acesso Gestor</span>
            </button>
          )}

          {/* Hairline Divider */}
          <div className="h-5 w-px bg-white/[0.08] hidden sm:block" />

          {/* Collaborator Profile Information Block */}
          <div className="flex items-center gap-2.5 pl-1">
            <button
              type="button"
              onClick={() => {
                if (onOpenProfileModal) onOpenProfileModal();
                else if (onOpenCollaboratorAuth) onOpenCollaboratorAuth();
              }}
              className="hidden md:flex flex-col text-right cursor-pointer group text-left hover:opacity-90"
              title="Ver meu perfil, cadastrar WhatsApp e gerenciar PIN"
            >
              <span className="text-xs text-white font-medium leading-none group-hover:text-[#57f1db] transition-colors">
                {displayUser.name}
              </span>
              <span className="text-[11px] font-mono text-[#bacac5] tracking-wider uppercase pt-1">
                {isLeaderAuthenticated ? 'GESTOR DA ESCALA' : authProviderObj ? 'PRESTADOR (VER PERFIL)' : 'PRESTADOR PJ'}
              </span>
            </button>

            {/* Profile Avatar / Trigger for Profile */}
            <div className="relative group">
              <button
                type="button"
                onClick={() => {
                  if (onOpenProfileModal) onOpenProfileModal();
                  else if (onOpenCollaboratorAuth) onOpenCollaboratorAuth();
                }}
                className="w-8 h-8 rounded-full bg-[#57f1db] hover:brightness-110 active:scale-95 transition-all flex items-center justify-center text-[#003731] font-bold shadow-md cursor-pointer"
                title="Meu Perfil de Prestador (WhatsApp & PIN)"
              >
                <UserIcon className="w-4 h-4 text-[#003731]" />
              </button>

              {/* Logout button if collaborator is explicitly authenticated */}
              {authProviderObj && (
                <button
                  type="button"
                  onClick={logoutProvider}
                  className="hidden group-hover:flex absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-rose-600 text-white items-center justify-center hover:bg-rose-500 cursor-pointer shadow-sm"
                  title="Desconectar perfil deste aparelho"
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
