import React, { Suspense, lazy, useState } from 'react';
import { ScheduleProvider, useSchedule } from './context/ScheduleContext';
import { Navbar } from './components/Navbar';
import { Provider, ShiftAssignment } from './types';

// Lazy-loaded Views & Operational Modules (Code Splitting for fast 4G/Mobile initial load)
const ScheduleToolbar = lazy(() =>
  import('./components/ScheduleToolbar').then((m) => ({ default: m.ScheduleToolbar }))
);
const EscalaGridView = lazy(() =>
  import('./components/views/EscalaGridView').then((m) => ({ default: m.EscalaGridView }))
);
const PersonalMonthlyCalendar = lazy(() =>
  import('./components/views/PersonalMonthlyCalendar').then((m) => ({
    default: m.PersonalMonthlyCalendar,
  }))
);
const MonthCalendarView = lazy(() =>
  import('./components/views/MonthCalendarView').then((m) => ({ default: m.MonthCalendarView }))
);
const AgendaView = lazy(() =>
  import('./components/views/AgendaView').then((m) => ({ default: m.AgendaView }))
);
const MyScheduleView = lazy(() =>
  import('./components/views/MyScheduleView').then((m) => ({ default: m.MyScheduleView }))
);
const MobileScheduleView = lazy(() =>
  import('./components/views/MobileScheduleView').then((m) => ({ default: m.MobileScheduleView }))
);
const GestorFeedbacksPage = lazy(() =>
  import('./components/views/GestorFeedbacksPage').then((m) => ({
    default: m.GestorFeedbacksPage,
  }))
);
const PrestadoresRegionalModule = lazy(() =>
  import('./features/prestadores_regional/PrestadoresRegionalModule').then((m) => ({
    default: m.PrestadoresRegionalModule,
  }))
);
const CentralInteligenciaModule = lazy(() =>
  import('./features/central_inteligencia/CentralInteligenciaModule').then((m) => ({
    default: m.CentralInteligenciaModule,
  }))
);

// Lazy-loaded Modals (Downloaded only when opened)
const ShiftModal = lazy(() =>
  import('./components/modals/ShiftModal').then((m) => ({ default: m.ShiftModal }))
);
const ProviderManagementModal = lazy(() =>
  import('./components/modals/ProviderManagementModal').then((m) => ({
    default: m.ProviderManagementModal,
  }))
);
const AutoScheduleModal = lazy(() =>
  import('./components/modals/AutoScheduleModal').then((m) => ({ default: m.AutoScheduleModal }))
);
const CloneMonthModal = lazy(() =>
  import('./components/modals/CloneMonthModal').then((m) => ({ default: m.CloneMonthModal }))
);
const WhatsAppExportModal = lazy(() =>
  import('./components/modals/WhatsAppExportModal').then((m) => ({
    default: m.WhatsAppExportModal,
  }))
);
const LeaderAuthModal = lazy(() =>
  import('./components/modals/LeaderAuthModal').then((m) => ({ default: m.LeaderAuthModal }))
);
const LeaderRequestsCenterModal = lazy(() =>
  import('./components/modals/LeaderRequestsCenterModal').then((m) => ({
    default: m.LeaderRequestsCenterModal,
  }))
);
const CollaboratorAuthModal = lazy(() =>
  import('./components/modals/CollaboratorAuthModal').then((m) => ({
    default: m.CollaboratorAuthModal,
  }))
);
const QuickSwapModal = lazy(() =>
  import('./components/modals/QuickSwapModal').then((m) => ({ default: m.QuickSwapModal }))
);
const PrintExportModal = lazy(() =>
  import('./components/modals/PrintExportModal').then((m) => ({ default: m.PrintExportModal }))
);
const AbsenceBatchModal = lazy(() =>
  import('./components/modals/AbsenceBatchModal').then((m) => ({ default: m.AbsenceBatchModal }))
);
const TeamBalanceModal = lazy(() =>
  import('./components/modals/TeamBalanceModal').then((m) => ({ default: m.TeamBalanceModal }))
);
const AttendanceIncidentModal = lazy(() =>
  import('./components/modals/AttendanceIncidentModal').then((m) => ({
    default: m.AttendanceIncidentModal,
  }))
);
const ExecutiveMonthlyReportModal = lazy(() =>
  import('./components/modals/ExecutiveMonthlyReportModal').then((m) => ({
    default: m.ExecutiveMonthlyReportModal,
  }))
);
const ShiftSaleModal = lazy(() =>
  import('./components/modals/ShiftSaleModal').then((m) => ({ default: m.ShiftSaleModal }))
);
const ShiftMarketplaceModal = lazy(() =>
  import('./components/modals/ShiftMarketplaceModal').then((m) => ({
    default: m.ShiftMarketplaceModal,
  }))
);
const CollaboratorProfileModal = lazy(() =>
  import('./components/modals/CollaboratorProfileModal').then((m) => ({
    default: m.CollaboratorProfileModal,
  }))
);
const ImportScheduleModal = lazy(() =>
  import('./components/modals/ImportScheduleModal').then((m) => ({
    default: m.ImportScheduleModal,
  }))
);
const AnnouncementsModal = lazy(() =>
  import('./components/modals/AnnouncementsModal').then((m) => ({ default: m.AnnouncementsModal }))
);
const AuditLogModal = lazy(() =>
  import('./components/modals/AuditLogModal').then((m) => ({ default: m.AuditLogModal }))
);
const WeekendDutyModal = lazy(() =>
  import('./components/modals/WeekendDutyModal').then((m) => ({ default: m.WeekendDutyModal }))
);

function ModuleLoadingFallback() {
  return (
    <div className="flex-1 flex items-center justify-center p-8 bg-[#090A0F]">
      <div className="flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-[#0e1016] border border-white/[0.08] text-xs font-medium text-zinc-300">
        <span className="w-2.5 h-2.5 rounded-full bg-[#00d2d3] animate-pulse" />
        <span>Carregando módulo...</span>
      </div>
    </div>
  );
}

function ScheduleAppContent() {
  const {
    viewMode,
    setViewMode,
    activeProviderId,
    setActiveProviderId,
    providers,
    authenticatedProviderId,
    activeModule,
    setActiveModule,
  } = useSchedule();

  // Modals state
  const [collaboratorAuthOpen, setCollaboratorAuthOpen] = useState(false);
  const [authModalProvider, setAuthModalProvider] = useState<Provider | null>(null);
  const [shiftModalOpen, setShiftModalOpen] = useState(false);
  const [shiftToEdit, setShiftToEdit] = useState<ShiftAssignment | null>(null);
  const [initialDateForShift, setInitialDateForShift] = useState<string>('');
  const [initialProviderForShift, setInitialProviderForShift] = useState<string>('');

  const [providerModalOpen, setProviderModalOpen] = useState(false);
  const [autoScheduleModalOpen, setAutoScheduleModalOpen] = useState(false);
  const [cloneModalOpen, setCloneModalOpen] = useState(false);
  const [whatsAppModalOpen, setWhatsAppModalOpen] = useState(false);
  const [leaderAuthModalOpen, setLeaderAuthModalOpen] = useState(false);
  const [requestsCenterModalOpen, setRequestsCenterModalOpen] = useState(false);
  const [quickSwapModalOpen, setQuickSwapModalOpen] = useState(false);
  const [printModalOpen, setPrintModalOpen] = useState(false);
  const [absenceModalOpen, setAbsenceModalOpen] = useState(false);
  const [balanceModalOpen, setBalanceModalOpen] = useState(false);
  const [executiveReportModalOpen, setExecutiveReportModalOpen] = useState(false);
  const [incidentModalOpen, setIncidentModalOpen] = useState(false);

  // Venda & Repasse de Plantões & Perfil
  const [marketplaceModalOpen, setMarketplaceModalOpen] = useState(false);
  const [shiftSaleModalOpen, setShiftSaleModalOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [importScheduleModalOpen, setImportScheduleModalOpen] = useState(false);
  const [announcementsOpen, setAnnouncementsOpen] = useState(false);
  const [auditLogOpen, setAuditLogOpen] = useState(false);
  const [weekendDutyModalOpen, setWeekendDutyModalOpen] = useState(false);
  const [saleModalDefaultDate, setSaleModalDefaultDate] = useState<string>('');
  const [saleModalDefaultProviderId, setSaleModalDefaultProviderId] = useState<string>('');

  const handleOpenSellModal = (date?: string, providerId?: string) => {
    setSaleModalDefaultDate(date || '');
    setSaleModalDefaultProviderId(providerId || '');
    setShiftSaleModalOpen(true);
  };

  // Handlers
  const handleOpenNewShift = () => {
    setShiftToEdit(null);
    setInitialDateForShift(new Date().toISOString().split('T')[0]);
    setInitialProviderForShift('');
    setShiftModalOpen(true);
  };

  const handleAddShiftOnDate = (dateStr: string) => {
    setShiftToEdit(null);
    setInitialDateForShift(dateStr);
    setInitialProviderForShift('');
    setShiftModalOpen(true);
  };

  const handleSelectShift = (shift: ShiftAssignment) => {
    setShiftToEdit(shift);
    setShiftModalOpen(true);
  };

  const activeUserProvId = authenticatedProviderId || activeProviderId;
  const currentProviderObj = activeUserProvId
    ? providers.find((p) => p.id === activeUserProvId) || null
    : null;

  return (
    <div
      className={`${
        activeModule === 'central_inteligencia' ? 'h-screen overflow-hidden' : 'min-h-screen'
      } bg-[#090A0F] text-[#e3e1e9] flex flex-col font-sans selection:bg-[#00d2d3] selection:text-[#003731]`}
    >
      {/* Global Unified Navbar (Always visible on Mobile & Desktop across ALL modules) */}
      <Navbar
        onOpenLeaderAuth={() => setLeaderAuthModalOpen(true)}
        onOpenRequestsCenter={() => setRequestsCenterModalOpen(true)}
        onOpenNewShiftModal={handleOpenNewShift}
        onOpenAutoScheduleModal={() => setAutoScheduleModalOpen(true)}
        onOpenProviderModal={() => setProviderModalOpen(true)}
        onOpenShareModal={() => setWhatsAppModalOpen(true)}
        onOpenCollaboratorAuth={() => {
          setAuthModalProvider(null);
          setCollaboratorAuthOpen(true);
        }}
        onOpenMarketplace={() => setMarketplaceModalOpen(true)}
        onOpenProfileModal={() => setProfileModalOpen(true)}
        onOpenImportModal={() => setImportScheduleModalOpen(true)}
        onOpenAnnouncements={() => setAnnouncementsOpen(true)}
        onOpenAuditLog={() => setAuditLogOpen(true)}
        onOpenWeekendDutyModal={() => setWeekendDutyModalOpen(true)}
        onOpenExecutiveReportModal={() => setExecutiveReportModalOpen(true)}
      />

      {activeModule !== 'escala' ? (
        <div className="pt-[98px] md:pt-16 flex-1 flex flex-col min-h-0 overflow-hidden">
          <Suspense fallback={<ModuleLoadingFallback />}>
            {activeModule === 'gestor_feedbacks' ? (
              <GestorFeedbacksPage />
            ) : activeModule === 'central_inteligencia' ? (
              <CentralInteligenciaModule />
            ) : (
              <PrestadoresRegionalModule
                initialTab={activeModule === 'pontos_fixos' ? 'regras' : 'prestadores'}
                onNavigateToEscala={() => setActiveModule('escala')}
                onTabChange={(tab) => {
                  if (tab === 'prestadores') setActiveModule('prestadores_regional');
                  else if (tab === 'regras') setActiveModule('pontos_fixos');
                }}
              />
            )}
          </Suspense>
        </div>
      ) : (
        <>
          {/* 📱 MOBILE ESCALA VIEW (< 768px) — Plugged into the same unified Navbar shell */}
          <div className="md:hidden pt-[98px] flex-1 flex flex-col bg-[#090A0F]">
            <Suspense fallback={<ModuleLoadingFallback />}>
              <MobileScheduleView
                onRequestSwap={() => setQuickSwapModalOpen(true)}
                onNotifyAbsence={() => setAbsenceModalOpen(true)}
                onOpenRequestsCenter={() => setRequestsCenterModalOpen(true)}
                onOpenCollaboratorAuth={(prov) => {
                  setAuthModalProvider(prov || null);
                  setCollaboratorAuthOpen(true);
                }}
                onOpenLeaderAuth={() => setLeaderAuthModalOpen(true)}
                onOpenMarketplace={() => setMarketplaceModalOpen(true)}
                onOpenFeedbacks={() => setActiveModule('gestor_feedbacks')}
              />
            </Suspense>
          </div>

          {/* 🖥️ DESKTOP ESCALA VIEW (>= 768px) */}
          <div className="hidden md:flex flex-col flex-1">
            <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 pt-20 pb-10 space-y-4">
              <Suspense fallback={<ModuleLoadingFallback />}>
                {viewMode !== 'my-schedule' &&
                  viewMode !== 'personal-calendar' &&
                  viewMode !== 'escala' && (
                    <ScheduleToolbar
                      onOpenLeaderAuth={() => setLeaderAuthModalOpen(true)}
                      onOpenAutoScheduleModal={() => setAutoScheduleModalOpen(true)}
                      onOpenProviderModal={() => setProviderModalOpen(true)}
                      onOpenCloneModal={() => setCloneModalOpen(true)}
                      onOpenWhatsAppModal={() => setWhatsAppModalOpen(true)}
                      onOpenQuickSwapModal={() => setQuickSwapModalOpen(true)}
                      onOpenPrintModal={() => setPrintModalOpen(true)}
                      onOpenBalanceModal={() => setBalanceModalOpen(true)}
                      onOpenExecutiveReportModal={() => setExecutiveReportModalOpen(true)}
                      onOpenIncidentModal={() => setIncidentModalOpen(true)}
                    />
                  )}

                {viewMode === 'escala' && (
                  <EscalaGridView
                    onAddProvider={() => setProviderModalOpen(true)}
                    onOpenCollaboratorAuth={(provider) => setAuthModalProvider(provider)}
                    onOpenPrintModal={() => setPrintModalOpen(true)}
                    onOpenMarketplace={() => setMarketplaceModalOpen(true)}
                    onOpenSellModal={handleOpenSellModal}
                    onOpenLeaderAuth={() => setLeaderAuthModalOpen(true)}
                  />
                )}

                {viewMode === 'personal-calendar' &&
                  (currentProviderObj ? (
                    <PersonalMonthlyCalendar
                      provider={currentProviderObj}
                      onBackToGrid={() => setViewMode('escala')}
                      onOpenPrintModal={() => setPrintModalOpen(true)}
                      onOpenMarketplace={() => setMarketplaceModalOpen(true)}
                      onOpenSellModal={handleOpenSellModal}
                    />
                  ) : (
                    <div className="bg-[#12141A] border border-white/[0.08] rounded-2xl p-8 text-center max-w-lg mx-auto my-8 space-y-3">
                      <h3 className="text-base font-bold text-white">Nenhum Perfil Selecionado</h3>
                      <p className="text-xs text-zinc-400">
                        Selecione o seu nome na lista e insira seu PIN para visualizar seu calendário
                        pessoal.
                      </p>
                      <button
                        onClick={() => setCollaboratorAuthOpen(true)}
                        className="px-4 py-2 bg-[#00d2d3] text-[#003731] font-bold text-xs rounded-xl hover:bg-[#57f1db] transition-all cursor-pointer shadow-sm"
                      >
                        + Entrar no Meu Perfil
                      </button>
                    </div>
                  ))}

                {viewMode === 'calendar' && (
                  <MonthCalendarView
                    onSelectShift={handleSelectShift}
                    onAddShiftDate={handleAddShiftOnDate}
                  />
                )}

                {viewMode === 'agenda' && (
                  <AgendaView
                    onSelectShift={handleSelectShift}
                    onAddShiftDate={handleAddShiftOnDate}
                  />
                )}

                {viewMode === 'my-schedule' && (
                  <MyScheduleView
                    onRequestSwapForShift={handleSelectShift}
                    onOpenShiftDetail={handleSelectShift}
                    onPrint={() => window.print()}
                  />
                )}
              </Suspense>
            </main>

            {/* Obsidian Shift Deep Footer (Desktop) */}
            <footer className="border-t border-white/[0.08] bg-[#090A0F]/95 backdrop-blur-md py-4 px-6 text-xs text-zinc-400">
              <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-xs">
                <span className="font-medium text-zinc-400">
                  © 2026 OminiHub • Gestão Humanizada de Escalas •{' '}
                  <span className="font-mono text-zinc-500">v2.5.0 (build 950)</span>
                </span>
                <div className="flex items-center gap-3 text-zinc-400 font-medium">
                  <span>Plantões Auditados</span>
                  <span className="text-zinc-600">•</span>
                  <span>Conformidade Médica</span>
                  <span className="text-zinc-600">•</span>
                  <span className="text-zinc-300">Suporte 24/7</span>
                </div>
              </div>
            </footer>
          </div>
        </>
      )}

      {/* Lazy-Loaded Global Modals (Loaded on demand only when opened) */}
      <Suspense fallback={null}>
        {leaderAuthModalOpen && (
          <LeaderAuthModal
            isOpen={leaderAuthModalOpen}
            onClose={() => setLeaderAuthModalOpen(false)}
          />
        )}

        {requestsCenterModalOpen && (
          <LeaderRequestsCenterModal
            isOpen={requestsCenterModalOpen}
            onClose={() => setRequestsCenterModalOpen(false)}
          />
        )}

        {shiftModalOpen && (
          <ShiftModal
            isOpen={shiftModalOpen}
            onClose={() => setShiftModalOpen(false)}
            shiftToEdit={shiftToEdit}
            initialDate={initialDateForShift}
            initialProviderId={initialProviderForShift}
          />
        )}

        {providerModalOpen && (
          <ProviderManagementModal
            isOpen={providerModalOpen}
            onClose={() => setProviderModalOpen(false)}
          />
        )}

        {autoScheduleModalOpen && (
          <AutoScheduleModal
            isOpen={autoScheduleModalOpen}
            onClose={() => setAutoScheduleModalOpen(false)}
          />
        )}

        {cloneModalOpen && (
          <CloneMonthModal isOpen={cloneModalOpen} onClose={() => setCloneModalOpen(false)} />
        )}

        {whatsAppModalOpen && (
          <WhatsAppExportModal
            isOpen={whatsAppModalOpen}
            onClose={() => setWhatsAppModalOpen(false)}
          />
        )}

        {quickSwapModalOpen && (
          <QuickSwapModal
            isOpen={quickSwapModalOpen}
            onClose={() => setQuickSwapModalOpen(false)}
          />
        )}

        {printModalOpen && (
          <PrintExportModal isOpen={printModalOpen} onClose={() => setPrintModalOpen(false)} />
        )}

        {absenceModalOpen && (
          <AbsenceBatchModal isOpen={absenceModalOpen} onClose={() => setAbsenceModalOpen(false)} />
        )}

        {balanceModalOpen && (
          <TeamBalanceModal isOpen={balanceModalOpen} onClose={() => setBalanceModalOpen(false)} />
        )}

        {incidentModalOpen && (
          <AttendanceIncidentModal
            isOpen={incidentModalOpen}
            onClose={() => setIncidentModalOpen(false)}
          />
        )}

        {executiveReportModalOpen && (
          <ExecutiveMonthlyReportModal
            isOpen={executiveReportModalOpen}
            onClose={() => setExecutiveReportModalOpen(false)}
            onOpenIncidentModal={() => {
              setExecutiveReportModalOpen(false);
              setIncidentModalOpen(true);
            }}
          />
        )}

        {(collaboratorAuthOpen || Boolean(authModalProvider)) && (
          <CollaboratorAuthModal
            isOpen={collaboratorAuthOpen || Boolean(authModalProvider)}
            targetProvider={authModalProvider}
            onClose={() => {
              setCollaboratorAuthOpen(false);
              setAuthModalProvider(null);
            }}
            onSuccess={(prov) => {
              setActiveProviderId(prov.id);
              setViewMode('personal-calendar');
              setCollaboratorAuthOpen(false);
              setAuthModalProvider(null);
            }}
            onOpenLeaderAuth={() => {
              setCollaboratorAuthOpen(false);
              setLeaderAuthModalOpen(true);
            }}
          />
        )}

        {marketplaceModalOpen && (
          <ShiftMarketplaceModal
            isOpen={marketplaceModalOpen}
            onClose={() => setMarketplaceModalOpen(false)}
            onOpenSellModal={() => setShiftSaleModalOpen(true)}
          />
        )}

        {shiftSaleModalOpen && (
          <ShiftSaleModal
            isOpen={shiftSaleModalOpen}
            onClose={() => setShiftSaleModalOpen(false)}
            defaultDate={saleModalDefaultDate}
            defaultProviderId={saleModalDefaultProviderId}
            onOfferCreated={() => {
              setShiftSaleModalOpen(false);
              setMarketplaceModalOpen(true);
            }}
          />
        )}

        {profileModalOpen && (
          <CollaboratorProfileModal
            isOpen={profileModalOpen}
            onClose={() => setProfileModalOpen(false)}
            onOpenCollaboratorAuth={() => setCollaboratorAuthOpen(true)}
          />
        )}

        {importScheduleModalOpen && (
          <ImportScheduleModal
            isOpen={importScheduleModalOpen}
            onClose={() => setImportScheduleModalOpen(false)}
          />
        )}

        {announcementsOpen && (
          <AnnouncementsModal
            isOpen={announcementsOpen}
            onClose={() => setAnnouncementsOpen(false)}
          />
        )}

        {auditLogOpen && (
          <AuditLogModal isOpen={auditLogOpen} onClose={() => setAuditLogOpen(false)} />
        )}

        {weekendDutyModalOpen && (
          <WeekendDutyModal
            isOpen={weekendDutyModalOpen}
            onClose={() => setWeekendDutyModalOpen(false)}
          />
        )}
      </Suspense>
    </div>
  );
}

export default function App() {
  return (
    <ScheduleProvider>
      <ScheduleAppContent />
    </ScheduleProvider>
  );
}
