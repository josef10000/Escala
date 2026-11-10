import React, { useState } from 'react';
import { ScheduleProvider, useSchedule } from './context/ScheduleContext';
import { Navbar } from './components/Navbar';
import { ScheduleToolbar } from './components/ScheduleToolbar';
import { EscalaGridView } from './components/views/EscalaGridView';
import { PersonalMonthlyCalendar } from './components/views/PersonalMonthlyCalendar';
import { MonthCalendarView } from './components/views/MonthCalendarView';
import { AgendaView } from './components/views/AgendaView';
import { MyScheduleView } from './components/views/MyScheduleView';
import { ShiftModal } from './components/modals/ShiftModal';
import { ProviderManagementModal } from './components/modals/ProviderManagementModal';
import { AutoScheduleModal } from './components/modals/AutoScheduleModal';
import { CloneMonthModal } from './components/modals/CloneMonthModal';
import { WhatsAppExportModal } from './components/modals/WhatsAppExportModal';
import { LeaderAuthModal } from './components/modals/LeaderAuthModal';
import { LeaderRequestsCenterModal } from './components/modals/LeaderRequestsCenterModal';
import { CollaboratorAuthModal } from './components/modals/CollaboratorAuthModal';
import { QuickSwapModal } from './components/modals/QuickSwapModal';
import { PrintExportModal } from './components/modals/PrintExportModal';
import { AbsenceBatchModal } from './components/modals/AbsenceBatchModal';
import { TeamBalanceModal } from './components/modals/TeamBalanceModal';
import { AttendanceIncidentModal } from './components/modals/AttendanceIncidentModal';
import { ExecutiveMonthlyReportModal } from './components/modals/ExecutiveMonthlyReportModal';
import { ShiftSaleModal } from './components/modals/ShiftSaleModal';
import { ShiftMarketplaceModal } from './components/modals/ShiftMarketplaceModal';
import { CollaboratorProfileModal } from './components/modals/CollaboratorProfileModal';
import { ImportScheduleModal } from './components/modals/ImportScheduleModal';
import { AnnouncementsModal } from './components/modals/AnnouncementsModal';
import { AuditLogModal } from './components/modals/AuditLogModal';
import { OperationalKpiModal } from './components/modals/OperationalKpiModal';
import { MobileScheduleView } from './components/views/MobileScheduleView';
import { PrestadoresRegionalModule } from './features/prestadores_regional/PrestadoresRegionalModule';
import { Provider, ShiftAssignment } from './types';
import { Calendar, Clock, CheckCircle2, AlertCircle, Plus, CalendarDays } from 'lucide-react';
import { formatFriendlyDate } from './utils/dateUtils';

function ScheduleAppContent() {
  const {
    viewMode,
    setViewMode,
    role,
    activeProviderId,
    setActiveProviderId,
    providers,
    assignments,
    shiftTypes,
    departments,
    authenticatedProviderId,
    isLeaderAuthenticated,
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
  const [kpiModalOpen, setKpiModalOpen] = useState(false);
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

  const currentProviderObj = providers.find(p => p.id === activeProviderId) || providers[0];

  // Today's summary
  const todayStr = new Date().toISOString().split('T')[0];
  const todayShifts = assignments.filter(a => a.date === todayStr);
  const myTodayShift = todayShifts.find(a => a.providerId === activeProviderId);
  const myTodayShiftType = myTodayShift ? shiftTypes.find(s => s.id === myTodayShift.shiftTypeId) : null;
  const myTodayDept = myTodayShift ? departments.find(d => d.id === myTodayShift.departmentId) : null;

  if (activeModule !== 'escala') {
    return (
      <div className="min-h-screen bg-[#090A0F] text-[#e3e1e9] flex flex-col font-sans selection:bg-[#00d2d3] selection:text-[#003731]">
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
          onOpenKpiModal={() => setKpiModalOpen(true)}
          onOpenExecutiveReportModal={() => setExecutiveReportModalOpen(true)}
        />
        <div className="pt-16 flex-1 flex flex-col overflow-hidden">
          <PrestadoresRegionalModule
            initialTab={
              activeModule === 'pontos_fixos'
                ? 'regras'
                : 'prestadores'
            }
            onNavigateToEscala={() => setActiveModule('escala')}
            onTabChange={(tab) => {
              if (tab === 'prestadores') setActiveModule('prestadores_regional');
              else if (tab === 'regras') setActiveModule('pontos_fixos');
            }}
          />
        </div>

        {/* Global Modals for Navbar */}
        <LeaderAuthModal
          isOpen={leaderAuthModalOpen}
          onClose={() => setLeaderAuthModalOpen(false)}
        />
        <CollaboratorProfileModal
          isOpen={profileModalOpen}
          onClose={() => setProfileModalOpen(false)}
        />
        <CollaboratorAuthModal
          isOpen={collaboratorAuthOpen}
          onClose={() => {
            setCollaboratorAuthOpen(false);
            setAuthModalProvider(null);
          }}
          targetProvider={authModalProvider}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#090A0F] text-[#e3e1e9] flex flex-col font-sans selection:bg-[#00d2d3] selection:text-[#003731]">
      
      {/* 📱 MOBILE VIEW (Matches exact design on mobile screens < 768px - without profile tab) */}
      <div className="md:hidden flex-1">
        <MobileScheduleView
          onRequestSwap={() => setQuickSwapModalOpen(true)}
          onNotifyAbsence={() => setAbsenceModalOpen(true)}
          onOpenRequestsCenter={() => setRequestsCenterModalOpen(true)}
          onOpenCollaboratorAuth={prov => {
            setAuthModalProvider(prov || null);
            setCollaboratorAuthOpen(true);
          }}
        />
      </div>

      {/* 🖥️ DESKTOP VIEW (Spreadsheet & Dashboard on screens >= 768px) */}
      <div className="hidden md:flex flex-col flex-1">
        {/* Top Navbar */}
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
          onOpenKpiModal={() => setKpiModalOpen(true)}
          onOpenExecutiveReportModal={() => setExecutiveReportModalOpen(true)}
        />

        {/* Main Container */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 pt-20 pb-10 space-y-4">
          {/* Compact Month Toolbar with Navigation & Filters only on calendar & agenda */}
          {viewMode !== 'my-schedule' && viewMode !== 'personal-calendar' && viewMode !== 'escala' && (
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

          {/* Active View */}
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

          {viewMode === 'personal-calendar' && (
            <PersonalMonthlyCalendar
              provider={currentProviderObj}
              onBackToGrid={() => setViewMode('escala')}
              onOpenPrintModal={() => setPrintModalOpen(true)}
              onOpenMarketplace={() => setMarketplaceModalOpen(true)}
              onOpenSellModal={handleOpenSellModal}
            />
          )}

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
        </main>
      </div>

      {/* Obsidian Shift Deep Footer */}
      <footer className="border-t border-white/[0.08] bg-[#090A0F]/95 backdrop-blur-md py-4 px-6 text-xs text-zinc-400">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-xs">
          <span className="font-medium text-zinc-400">
            © 2025 EscalaPro • Gestão Humanizada de Escalas • <span className="font-mono text-zinc-500">v2.4.1 (build 940)</span>
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

      {/* Modals */}
      <LeaderAuthModal
        isOpen={leaderAuthModalOpen}
        onClose={() => setLeaderAuthModalOpen(false)}
      />

      <LeaderRequestsCenterModal
        isOpen={requestsCenterModalOpen}
        onClose={() => setRequestsCenterModalOpen(false)}
      />

      <ShiftModal
        isOpen={shiftModalOpen}
        onClose={() => setShiftModalOpen(false)}
        shiftToEdit={shiftToEdit}
        initialDate={initialDateForShift}
        initialProviderId={initialProviderForShift}
      />

      <ProviderManagementModal
        isOpen={providerModalOpen}
        onClose={() => setProviderModalOpen(false)}
      />

      <AutoScheduleModal
        isOpen={autoScheduleModalOpen}
        onClose={() => setAutoScheduleModalOpen(false)}
      />

      <CloneMonthModal
        isOpen={cloneModalOpen}
        onClose={() => setCloneModalOpen(false)}
      />

      <WhatsAppExportModal
        isOpen={whatsAppModalOpen}
        onClose={() => setWhatsAppModalOpen(false)}
      />

      <QuickSwapModal
        isOpen={quickSwapModalOpen}
        onClose={() => setQuickSwapModalOpen(false)}
      />

      <PrintExportModal
        isOpen={printModalOpen}
        onClose={() => setPrintModalOpen(false)}
      />

      <AbsenceBatchModal
        isOpen={absenceModalOpen}
        onClose={() => setAbsenceModalOpen(false)}
      />

      <TeamBalanceModal
        isOpen={balanceModalOpen}
        onClose={() => setBalanceModalOpen(false)}
      />

      <AttendanceIncidentModal
        isOpen={incidentModalOpen}
        onClose={() => setIncidentModalOpen(false)}
      />

      <ExecutiveMonthlyReportModal
        isOpen={executiveReportModalOpen}
        onClose={() => setExecutiveReportModalOpen(false)}
        onOpenIncidentModal={() => {
          setExecutiveReportModalOpen(false);
          setIncidentModalOpen(true);
        }}
      />

      {/* Collaborator Authentication Modal */}
      <CollaboratorAuthModal
        isOpen={collaboratorAuthOpen || Boolean(authModalProvider)}
        targetProvider={authModalProvider}
        onClose={() => {
          setCollaboratorAuthOpen(false);
          setAuthModalProvider(null);
        }}
        onSuccess={prov => {
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

      {/* Venda & Repasse de Plantões PJ - Marketplace Modal */}
      <ShiftMarketplaceModal
        isOpen={marketplaceModalOpen}
        onClose={() => setMarketplaceModalOpen(false)}
        onOpenSellModal={() => setShiftSaleModalOpen(true)}
      />

      {/* Venda de Plantão - Anunciar Modal */}
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

      {/* Perfil do Prestador - WhatsApp e PIN Modal */}
      <CollaboratorProfileModal
        isOpen={profileModalOpen}
        onClose={() => setProfileModalOpen(false)}
        onOpenCollaboratorAuth={() => setCollaboratorAuthOpen(true)}
      />

      {/* Montador e Importador de Escala Inteligente (IA / Foto / WhatsApp / Zerar) */}
      <ImportScheduleModal
        isOpen={importScheduleModalOpen}
        onClose={() => setImportScheduleModalOpen(false)}
      />

      {/* Mural de Avisos & Comunicados */}
      <AnnouncementsModal
        isOpen={announcementsOpen}
        onClose={() => setAnnouncementsOpen(false)}
      />

      {/* Histórico de Auditoria */}
      <AuditLogModal
        isOpen={auditLogOpen}
        onClose={() => setAuditLogOpen(false)}
      />

      {/* Indicadores Operacionais & KPIs */}
      <OperationalKpiModal
        isOpen={kpiModalOpen}
        onClose={() => setKpiModalOpen(false)}
      />
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
