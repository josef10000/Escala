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
import { MobileScheduleView } from './components/views/MobileScheduleView';
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

  return (
    <div className="min-h-screen bg-[#0c121c] text-slate-100 flex flex-col font-sans">
      
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
        />

        {/* Main Container */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 py-3 space-y-3">
          {/* Compact Month Toolbar with Navigation & Filters */}
          {viewMode !== 'my-schedule' && viewMode !== 'personal-calendar' && (
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
            />
          )}

          {viewMode === 'personal-calendar' && (
            <PersonalMonthlyCalendar
              provider={currentProviderObj}
              onBackToGrid={() => setViewMode('escala')}
              onOpenPrintModal={() => setPrintModalOpen(true)}
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

      {/* Clean SaaS Deep Dark Footer */}
      <footer className="border-t border-[#1e2a3a] bg-[#0c121c]/95 backdrop-blur-xs py-3 px-6 text-center text-xs text-slate-400">
        <div className="max-w-7xl mx-auto flex items-center justify-between text-xs">
          <span className="font-semibold text-slate-300">EscalaPro • Gestão Humanizada de Escalas</span>
          <span className="text-cyan-400 font-semibold flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.8)]" />
            Nuvem Conectada
          </span>
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
