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
import { LeaderAuthModal } from './components/modals/LeaderAuthModal';
import { LeaderRequestsCenterModal } from './components/modals/LeaderRequestsCenterModal';
import { CollaboratorAuthModal } from './components/modals/CollaboratorAuthModal';
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
  const [authModalProvider, setAuthModalProvider] = useState<Provider | null>(null);
  const [shiftModalOpen, setShiftModalOpen] = useState(false);
  const [shiftToEdit, setShiftToEdit] = useState<ShiftAssignment | null>(null);
  const [initialDateForShift, setInitialDateForShift] = useState<string>('');
  const [initialProviderForShift, setInitialProviderForShift] = useState<string>('');

  const [providerModalOpen, setProviderModalOpen] = useState(false);
  const [autoScheduleModalOpen, setAutoScheduleModalOpen] = useState(false);
  const [leaderAuthModalOpen, setLeaderAuthModalOpen] = useState(false);
  const [requestsCenterModalOpen, setRequestsCenterModalOpen] = useState(false);

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
    <div className="min-h-screen bg-[#0B0F19] text-slate-100 flex flex-col font-sans">
      {/* Top Navbar */}
      <Navbar
        onOpenLeaderAuth={() => setLeaderAuthModalOpen(true)}
        onOpenRequestsCenter={() => setRequestsCenterModalOpen(true)}
        onOpenNewShiftModal={handleOpenNewShift}
        onOpenAutoScheduleModal={() => setAutoScheduleModalOpen(true)}
        onOpenProviderModal={() => setProviderModalOpen(true)}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-5 space-y-5">
        {/* Quick "Today" Glance Banner */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-950 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs text-slate-400 font-medium">
                Hoje, {formatFriendlyDate(todayStr, true)}
              </div>
              <div className="text-sm font-bold text-white mt-0.5">
                {role === 'supervisor' ? (
                  <span>
                    {todayShifts.length} {todayShifts.length === 1 ? 'plantonista escalado' : 'plantonistas escalados'} hoje
                  </span>
                ) : myTodayShift && myTodayShiftType ? (
                  <span className="text-emerald-400 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" />
                    Você tem plantão hoje: {myTodayShiftType.startTime} às {myTodayShiftType.endTime} ({myTodayDept?.name})
                  </span>
                ) : (
                  <span className="text-slate-300">
                    Você está de folga hoje.
                  </span>
                )}
              </div>
            </div>
          </div>

          {role === 'supervisor' && (
            <button
              onClick={handleOpenNewShift}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-indigo-300 bg-indigo-950/60 hover:bg-indigo-900/60 border border-indigo-700/50 rounded-xl transition-colors self-start sm:self-auto"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Adicionar Plantão</span>
            </button>
          )}
        </div>

        {/* Month Toolbar with Navigation & Filters */}
        {viewMode !== 'my-schedule' && viewMode !== 'personal-calendar' && (
          <ScheduleToolbar
            onOpenAutoScheduleModal={() => setAutoScheduleModalOpen(true)}
            onOpenProviderModal={() => setProviderModalOpen(true)}
          />
        )}

        {/* Active View */}
        {viewMode === 'escala' && (
          <EscalaGridView
            onAddProvider={() => setProviderModalOpen(true)}
            onOpenCollaboratorAuth={(provider) => setAuthModalProvider(provider)}
          />
        )}

        {viewMode === 'personal-calendar' && (
          (() => {
            if (isLeaderAuthenticated) {
              return (
                <PersonalMonthlyCalendar
                  provider={currentProviderObj}
                  onBackToGrid={() => setViewMode('escala')}
                />
              );
            }
            if (authenticatedProviderId) {
              const myProviderObj = providers.find(p => p.id === authenticatedProviderId);
              if (myProviderObj) {
                return (
                  <PersonalMonthlyCalendar
                    provider={myProviderObj}
                    onBackToGrid={() => setViewMode('escala')}
                  />
                );
              }
            }
            
            // Otherwise, they clicked on "Meu Calendário" but aren't identified yet
            return (
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 max-w-xl mx-auto text-center space-y-6 shadow-2xl animate-in fade-in duration-150">
                <div className="w-16 h-16 bg-indigo-950/85 text-indigo-400 border border-indigo-500/30 rounded-2xl flex items-center justify-center mx-auto shadow-md">
                  <CalendarDays className="w-8 h-8" />
                </div>
                
                <div className="space-y-2">
                  <h2 className="text-xl font-black text-white">Acesse Seu Calendário Mensal</h2>
                  <p className="text-sm text-slate-400 max-w-sm mx-auto leading-relaxed">
                    Selecione seu nome abaixo para definir seu PIN (se for seu primeiro acesso) ou digitar seu PIN pessoal de 4 dígitos.
                  </p>
                </div>
                
                <div className="max-w-xs mx-auto">
                  <label className="block text-xs font-bold text-slate-400 text-left mb-1.5 uppercase tracking-wider">
                    Quem é você?
                  </label>
                  <select
                    onChange={(e) => {
                      const id = e.target.value;
                      if (id) {
                        const selected = providers.find(p => p.id === id);
                        if (selected) {
                          setAuthModalProvider(selected);
                        }
                      }
                    }}
                    value=""
                    className="w-full px-4 py-3 bg-slate-950 border border-slate-700 hover:border-slate-500 rounded-2xl text-white font-bold text-sm focus:outline-none focus:border-indigo-500 transition-colors cursor-pointer"
                  >
                    <option value="" disabled>Selecione seu nome na lista...</option>
                    {providers.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.name} — {p.role}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="pt-4 border-t border-slate-800/80 text-xs text-slate-500">
                  Qualquer pessoa pode ver o <button onClick={() => setViewMode('escala')} className="text-indigo-400 hover:underline font-bold">Quadro Geral da Equipe</button> sem digitar senha.
                </div>
              </div>
            );
          })()
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

      {/* Clean Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/80 py-4 px-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>EscalaPro — Sistema de Visualização e Gestão de Escalas</span>
          <span className="text-slate-600">Sincronização em Tempo Real (Firebase)</span>
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

      {/* Collaborator Authentication Modal */}
      <CollaboratorAuthModal
        isOpen={Boolean(authModalProvider)}
        targetProvider={authModalProvider}
        onClose={() => setAuthModalProvider(null)}
        onSuccess={prov => {
          setActiveProviderId(prov.id);
          setViewMode('personal-calendar');
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
