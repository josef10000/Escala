import React, { useState, useRef, useEffect } from 'react';
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
  ChevronDown,
  X,
  Send,
  Notebook,
  History,
  KeyRound,
  ShieldCheck,
  CheckCircle2,
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
  onOpenWeekendDutyModal?: () => void;
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
  onOpenWeekendDutyModal,
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

  const [isGestorDrawerOpen, setIsGestorDrawerOpen] = useState(false);
  const gestorDrawerRef = useRef<HTMLDivElement>(null);

  const pendingSwapsCount = swapRequests.filter(s => s.status === 'pending_supervisor').length;
  const pendingRequestsCount = scheduleRequests.filter(r => r.status === 'pending').length;
  const totalPending = pendingSwapsCount + pendingRequestsCount;
  const availableSalesCount = shiftSaleOffers.filter(s => s.status === 'available').length;

  // Active or authenticated collaborator / leader profile
  const authProviderObj = authenticatedProviderId ? providers.find(p => p.id === authenticatedProviderId) : null;
  const activeProviderObj = activeProviderId ? providers.find(p => p.id === activeProviderId) : null;
  const leaderProviderObj = leaderName ? providers.find(p => p.name.toLowerCase() === leaderName.toLowerCase()) : null;

  const displayUser =
    authProviderObj ||
    leaderProviderObj ||
    (isLeaderAuthenticated && leaderName ? { id: 'leader-temp', name: leaderName, role: 'GESTOR DA ESCALA' } : null) ||
    activeProviderObj ||
    null;

  // Close Gestor Drawer on click outside
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (gestorDrawerRef.current && !gestorDrawerRef.current.contains(e.target as Node)) {
        setIsGestorDrawerOpen(false);
      }
    };
    if (isGestorDrawerOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isGestorDrawerOpen]);

  return (
    <header className="fixed top-0 inset-x-0 z-50 bg-[#0d0e13]/95 backdrop-blur-2xl border-b border-white/[0.08] text-[#e3e2e7] h-16">
      <div className="h-16 w-full px-3 sm:px-6 flex items-center justify-between gap-3 overflow-visible relative">
        
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
              src="/assets/aistudio/1-Photoroom_fd21f84e.png"
              alt="OminiHub Logo"
              className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg object-contain transform group-hover:scale-105 transition-transform"
            />
            <div className="flex flex-col text-left">
              <span className="font-black text-sm tracking-tight text-white flex items-center gap-1">
                <span>OminiHub</span>
                <span className="text-[10px] font-mono px-1 py-0.2 rounded bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/30">
                  PRO
                </span>
              </span>
              <span className="text-[9px] text-[#78958c] font-medium tracking-wider uppercase -mt-0.5">
                Escala & Produtividade
              </span>
            </div>
          </button>

          {/* Module Switcher Tabs (Segmented Glass) */}
          <nav className="flex items-center gap-1 p-1 bg-white/[0.04] rounded-xl border border-white/[0.06] backdrop-blur-md">
            <button
              type="button"
              onClick={() => setActiveModule('escala')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-all cursor-pointer font-medium whitespace-nowrap ${
                activeModule === 'escala'
                  ? 'bg-white/[0.12] text-white font-semibold shadow-sm border border-white/10'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              <Calendar className="w-3.5 h-3.5 text-cyan-400" />
              <span>Quadro Geral</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveModule('prestadores_regional')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-all cursor-pointer font-medium whitespace-nowrap ${
                activeModule === 'prestadores_regional'
                  ? 'bg-gradient-to-r from-cyan-500/25 to-teal-500/25 text-white font-semibold border border-cyan-400/40 shadow-sm'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              <Users className="w-3.5 h-3.5 text-cyan-400" />
              <span>Técnicos & CEP</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveModule('pontos_fixos')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-all cursor-pointer font-medium whitespace-nowrap ${
                activeModule === 'pontos_fixos'
                  ? 'bg-gradient-to-r from-emerald-600/35 to-teal-600/35 text-white font-semibold border border-emerald-400/40 shadow-sm'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              <MapPin className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">Pontos Fixos & Agendas</span>
              <span className="sm:hidden">Pontos Fixos</span>
            </button>
          </nav>

          {/* Sub-tabs for Escala View */}
          {activeModule === 'escala' && (
            <div className="hidden 2xl:flex items-center gap-1 p-0.5 rounded-lg bg-white/[0.04] border border-white/[0.05] shrink-0">
              <button
                type="button"
                onClick={() => setViewMode('escala')}
                className={`px-2.5 py-1 rounded text-xs transition-all cursor-pointer font-medium whitespace-nowrap ${
                  viewMode === 'escala'
                    ? 'bg-white/[0.12] text-white font-semibold shadow-xs'
                    : 'text-white/60 hover:text-white hover:bg-white/[0.06]'
                }`}
              >
                Quadro Geral
              </button>

              <button
                type="button"
                onClick={() => setViewMode('personal-calendar')}
                className={`px-2.5 py-1 rounded text-xs transition-all cursor-pointer font-medium whitespace-nowrap ${
                  viewMode === 'personal-calendar'
                    ? 'bg-white/[0.12] text-white font-semibold shadow-xs'
                    : 'text-white/60 hover:text-white hover:bg-white/[0.06]'
                }`}
              >
                Meu Calendário
              </button>

              <button
                type="button"
                onClick={() => setViewMode('agenda')}
                className={`px-2.5 py-1 rounded text-xs transition-all cursor-pointer font-medium whitespace-nowrap ${
                  viewMode === 'agenda'
                    ? 'bg-white/[0.12] text-white font-semibold shadow-xs'
                    : 'text-white/60 hover:text-white hover:bg-white/[0.06]'
                }`}
              >
                Agenda Diária
              </button>
            </div>
          )}
        </div>

        {/* Right Tools, Gestor Command Drawer & User Profile */}
        <div className="flex items-center gap-2 shrink-0">
          
          {/* Venda & Repasse de Plantões PJ */}
          {onOpenMarketplace && (
            <button
              type="button"
              onClick={onOpenMarketplace}
              className="h-8 px-2.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 text-xs font-medium border border-amber-500/25 flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
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

          {/* Share Schedule Action Button */}
          {onOpenShareModal && (
            <button
              type="button"
              onClick={onOpenShareModal}
              className="h-8 w-8 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-white/70 hover:text-white border border-white/[0.08] flex items-center justify-center transition-colors cursor-pointer shrink-0"
              title="Compartilhar Escala com a equipe"
            >
              <Share2 className="w-3.5 h-3.5" />
            </button>
          )}

          {/* GESTOR COMMAND CENTER (Apple Glass Slide-down Drawer) */}
          {isLeaderAuthenticated ? (
            <div className="relative" ref={gestorDrawerRef}>
              {/* Trigger Button: Painel do Gestor */}
              <button
                type="button"
                onClick={() => setIsGestorDrawerOpen(prev => !prev)}
                className={`h-8.5 px-3 rounded-2xl flex items-center gap-2 text-xs font-bold transition-all cursor-pointer backdrop-blur-xl border shadow-md active:scale-98 ${
                  isGestorDrawerOpen
                    ? 'bg-cyan-500/25 text-white border-cyan-400/50 shadow-cyan-500/20 ring-1 ring-cyan-400/30'
                    : 'bg-gradient-to-r from-cyan-500/15 via-teal-500/10 to-emerald-500/15 text-cyan-300 hover:text-white border-cyan-400/30 hover:border-cyan-400/50'
                }`}
                title="Abrir Central de Ferramentas da Liderança"
              >
                <ShieldCheck className="w-4 h-4 text-cyan-400 shrink-0" />
                <span className="hidden sm:inline font-semibold tracking-wide">Painel do Gestor</span>
                <span className="sm:hidden font-semibold">Gestão</span>
                {totalPending > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] font-black bg-rose-500 text-white animate-pulse">
                    {totalPending}
                  </span>
                )}
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isGestorDrawerOpen ? 'rotate-180 text-white' : 'text-cyan-400/80'}`} />
              </button>

              {/* SLIDE-DOWN COMMAND DRAWER (Apple Frosted Glass) */}
              {isGestorDrawerOpen && (
                <div className="absolute top-full right-0 mt-2 w-[92vw] sm:w-[480px] bg-slate-950/95 backdrop-blur-3xl border border-white/15 rounded-3xl p-5 shadow-[0_25px_70px_rgba(0,0,0,0.85)] z-50 animate-in fade-in slide-in-from-top-3 duration-200 space-y-4">
                  {/* Sheen line on top */}
                  <div className="absolute inset-x-0 top-0 h-[1.5px] bg-gradient-to-r from-transparent via-cyan-400/40 to-transparent pointer-events-none rounded-t-3xl" />

                  {/* Header */}
                  <div className="flex items-center justify-between pb-3.5 border-b border-white/10">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-cyan-500/15 border border-cyan-400/30 text-cyan-300 font-bold font-mono text-sm flex items-center justify-center shadow-inner">
                        {displayUser?.name ? displayUser.name.slice(0, 2).toUpperCase() : 'GS'}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-white tracking-tight leading-snug">
                            {displayUser?.name || leaderName || 'Gestor da Escala'}
                          </h4>
                          <span className="text-[10px] font-semibold text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded-full border border-cyan-400/20">
                            Ativo
                          </span>
                        </div>
                        <p className="text-[11px] text-white/50">Central Executiva de Gestão</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsGestorDrawerOpen(false)}
                      className="p-1.5 rounded-xl text-white/40 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Grid de Ferramentas Exclusivas */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    
                    {/* 1. Plantão FDS WhatsApp */}
                    {onOpenWeekendDutyModal && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsGestorDrawerOpen(false);
                          onOpenWeekendDutyModal();
                        }}
                        className="p-3 rounded-2xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/25 hover:border-emerald-400/40 text-left transition-all group cursor-pointer"
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-xs font-bold text-white group-hover:text-emerald-300 flex items-center gap-2">
                            <Send className="w-4 h-4 text-emerald-400" />
                            <span>Plantão FDS (WhatsApp)</span>
                          </span>
                          <span className="text-[10px] text-emerald-400 font-mono font-bold bg-emerald-500/15 px-1.5 py-0.5 rounded-md border border-emerald-500/25">
                            Oficial
                          </span>
                        </div>
                        <p className="text-[11px] text-white/50 group-hover:text-white/70 line-clamp-2">
                          Gerar mensagem pronta para o grupo oficial da escala.
                        </p>
                      </button>
                    )}

                    {/* 2. Feedbacks da Equipe */}
                    <button
                      type="button"
                      onClick={() => {
                        setIsGestorDrawerOpen(false);
                        setActiveModule('gestor_feedbacks');
                      }}
                      className="p-3 rounded-2xl bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/25 hover:border-purple-400/40 text-left transition-all group cursor-pointer"
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-bold text-white group-hover:text-purple-300 flex items-center gap-2">
                          <Notebook className="w-4 h-4 text-purple-400" />
                          <span>Diário de Feedbacks</span>
                        </span>
                        <span className="text-[10px] text-purple-300 font-mono font-bold bg-purple-500/15 px-1.5 py-0.5 rounded-md border border-purple-500/25">
                          Confidencial
                        </span>
                      </div>
                      <p className="text-[11px] text-white/50 group-hover:text-white/70 line-clamp-2">
                        Caderno de observações, elogios e alinhamentos 1:1.
                      </p>
                    </button>

                    {/* 3. Central de Trocas e Pedidos */}
                    {onOpenRequestsCenter && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsGestorDrawerOpen(false);
                          onOpenRequestsCenter();
                        }}
                        className="p-3 rounded-2xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/25 hover:border-amber-400/40 text-left transition-all group cursor-pointer"
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-xs font-bold text-white group-hover:text-amber-300 flex items-center gap-2">
                            <Inbox className="w-4 h-4 text-amber-400" />
                            <span>Pedidos & Trocas</span>
                          </span>
                          {totalPending > 0 ? (
                            <span className="text-[10px] text-amber-300 font-mono font-bold bg-amber-500/20 px-2 py-0.5 rounded-full border border-amber-500/30">
                              {totalPending} novos
                            </span>
                          ) : (
                            <span className="text-[10px] text-white/40 font-mono">0 novos</span>
                          )}
                        </div>
                        <p className="text-[11px] text-white/50 group-hover:text-white/70 line-clamp-2">
                          Aprovar trocas de plantão e pedidos de folga do time.
                        </p>
                      </button>
                    )}

                    {/* 4. Histórico de Auditoria */}
                    {onOpenAuditLog && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsGestorDrawerOpen(false);
                          onOpenAuditLog();
                        }}
                        className="p-3 rounded-2xl bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/25 hover:border-sky-400/40 text-left transition-all group cursor-pointer"
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-xs font-bold text-white group-hover:text-sky-300 flex items-center gap-2">
                            <History className="w-4 h-4 text-sky-400" />
                            <span>Auditoria & Logs</span>
                          </span>
                          <span className="text-[10px] text-sky-300 font-mono font-bold bg-sky-500/15 px-1.5 py-0.5 rounded-md border border-sky-500/25">
                            Logs
                          </span>
                        </div>
                        <p className="text-[11px] text-white/50 group-hover:text-white/70 line-clamp-2">
                          Rastreabilidade de todas as alterações feitas na escala.
                        </p>
                      </button>
                    )}

                    {/* 5. Meu Perfil de Colaborador */}
                    {onOpenProfileModal && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsGestorDrawerOpen(false);
                          onOpenProfileModal();
                        }}
                        className="p-3 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] hover:border-white/20 text-left transition-all group cursor-pointer"
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-xs font-bold text-white group-hover:text-cyan-300 flex items-center gap-2">
                            <UserIcon className="w-4 h-4 text-cyan-400" />
                            <span>Meu Perfil Gestor</span>
                          </span>
                        </div>
                        <p className="text-[11px] text-white/50 group-hover:text-white/70 line-clamp-2">
                          Ver seus dados, telefone, PIX e calendário individual.
                        </p>
                      </button>
                    )}

                    {/* 6. Alterar Senha / PIN */}
                    <button
                      type="button"
                      onClick={() => {
                        setIsGestorDrawerOpen(false);
                        onOpenLeaderAuth();
                      }}
                      className="p-3 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] hover:border-white/20 text-left transition-all group cursor-pointer"
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-bold text-white group-hover:text-cyan-300 flex items-center gap-2">
                          <KeyRound className="w-4 h-4 text-cyan-400" />
                          <span>Segurança & PIN</span>
                        </span>
                      </div>
                      <p className="text-[11px] text-white/50 group-hover:text-white/70 line-clamp-2">
                        Alterar senha mestra ou PIN de acesso da liderança.
                      </p>
                    </button>
                  </div>

                  {/* Footer com Ação de Sair do Modo Gestor */}
                  <div className="pt-3 border-t border-white/10 flex items-center justify-between">
                    <span className="text-[11px] text-emerald-400 flex items-center gap-1.5 font-medium">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Modo Edição Ativo</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setIsGestorDrawerOpen(false);
                        logoutLeader();
                      }}
                      className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/25 transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Sair da Gestão</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <button
              type="button"
              onClick={onOpenLeaderAuth}
              className="h-8 px-2.5 sm:px-3 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-white/70 hover:text-white text-xs font-medium border border-white/[0.08] flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
              title="Clique para acessar como Gestor/Líder da escala"
            >
              <Lock className="w-3.5 h-3.5 text-white/40" />
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
                className="h-8 px-2.5 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 border border-cyan-500/30 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs active:scale-98 shrink-0"
                title="Clique para escolher seu nome na lista, criar seu PIN e entrar no seu perfil"
              >
                <UserIcon className="w-3.5 h-3.5 text-cyan-400" />
                <span className="hidden sm:inline whitespace-nowrap">Meu Perfil</span>
              </button>
            )}

            {/* Profile Name Badge */}
            <button
              type="button"
              onClick={() => {
                if (displayUser && onOpenProfileModal) {
                  onOpenProfileModal();
                } else if (onOpenCollaboratorAuth) {
                  onOpenCollaboratorAuth();
                }
              }}
              className="hidden md:flex flex-col text-right cursor-pointer group hover:opacity-90 max-w-[130px] lg:max-w-[180px] shrink-0"
              title={displayUser ? "Clique para ver ou alterar seu perfil (Nome, WhatsApp, PIN ou Sair)" : "Clique para entrar no seu perfil"}
            >
              {displayUser ? (
                <>
                  <span className="text-xs text-white font-semibold truncate leading-tight group-hover:text-cyan-400 transition-colors">
                    {displayUser.name}
                  </span>
                  <span className="text-[10px] font-mono text-cyan-400 tracking-wider uppercase truncate">
                    {isLeaderAuthenticated ? 'GESTOR DA ESCALA' : authProviderObj ? 'PERFIL ATIVO' : 'PERFIL SELECIONADO'}
                  </span>
                </>
              ) : (
                <>
                  <span className="text-xs text-cyan-300 font-bold truncate leading-tight group-hover:text-white transition-colors">
                    Nenhum Perfil Ativo
                  </span>
                  <span className="text-[10px] font-mono text-white/40 tracking-wider uppercase truncate">
                    Clique para Entrar
                  </span>
                </>
              )}
            </button>

            {/* Profile Avatar / Trigger */}
            <div className="relative group shrink-0">
              <button
                type="button"
                onClick={() => {
                  if (displayUser && onOpenProfileModal) {
                    onOpenProfileModal();
                  } else if (onOpenCollaboratorAuth) {
                    onOpenCollaboratorAuth();
                  }
                }}
                className={`w-8 h-8 rounded-full transition-all flex items-center justify-center font-bold shadow-md cursor-pointer shrink-0 ${
                  displayUser
                    ? 'bg-cyan-400 hover:brightness-110 text-slate-950 ring-2 ring-cyan-400/30'
                    : 'bg-zinc-800 hover:bg-zinc-700 text-cyan-300 border border-cyan-500/30'
                }`}
                title={displayUser ? "Meu Perfil (Editar ou Sair)" : "Entrar no meu perfil"}
              >
                <UserIcon className={`w-4 h-4 ${displayUser ? 'text-slate-950' : 'text-cyan-300'}`} />
              </button>

              {/* Quick logout badge if authenticated */}
              {(authProviderObj || activeProviderObj || isLeaderAuthenticated) && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (isLeaderAuthenticated) logoutLeader();
                    logoutProvider();
                  }}
                  className="hidden group-hover:flex absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-rose-600 text-white items-center justify-center hover:bg-rose-500 cursor-pointer shadow-sm"
                  title="Sair do perfil / Desconectar"
                >
                  <LogOut className="w-2.5 h-2.5 text-white" />
                </button>
              )}
            </div>
          </div>

        </div>

      </div>
    </header>
  );
};
