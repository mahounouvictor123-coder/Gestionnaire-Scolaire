import React, { useState, useEffect } from 'react';
import { AppProvider, useApp } from './lib/store';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { AIAssistantModal } from './components/AIAssistantModal';
import { CreateSchoolModal } from './components/modals/CreateSchoolModal';
import { AuthLoginModal } from './components/modals/AuthLoginModal';
import { DailyAccessPaymentModal } from './components/modals/DailyAccessPaymentModal';
import { RegisterViaCampaignModal } from './components/modals/RegisterViaCampaignModal';
import { SchoolLockGate } from './components/SchoolLockGate';
import { AutoUpdateWatcher } from './components/AutoUpdateWatcher';

// Views
import { HomeLandingView } from './views/HomeLandingView';
import { DashboardView } from './views/DashboardView';
import { MultiSchoolHubView } from './views/MultiSchoolHubView';
import { StudentsView } from './views/StudentsView';
import { TeachersView } from './views/TeachersView';
import { ClassesView } from './views/ClassesView';
import { SubjectsView } from './views/SubjectsView';
import { GradesView } from './views/GradesView';
import { ReportCardsView } from './views/ReportCardsView';
import { PaymentsView } from './views/PaymentsView';
import { AccountingView } from './views/AccountingView';
import { AttendanceView } from './views/AttendanceView';
import { TimetableView } from './views/TimetableView';
import { ExamsView } from './views/ExamsView';
import { LibraryView } from './views/LibraryView';
import { CanteenView } from './views/CanteenView';
import { TransportView } from './views/TransportView';
import { DocumentsView } from './views/DocumentsView';
import { CommunicationView } from './views/CommunicationView';
import { ParentPortalView } from './views/ParentPortalView';
import { StudentPortalView } from './views/StudentPortalView';
import { ScanRosterView } from './views/ScanRosterView';
import { EspaceEpreuvesView } from './views/EspaceEpreuvesView';
import { SubscriptionsView } from './views/SubscriptionsView';
import { AIStudioView } from './views/AIStudioView';
import { SettingsView } from './views/SettingsView';
import { PromoterAdminView } from './views/PromoterAdminView';
import { KkiapayView } from './views/KkiapayView';

function MainApp() {
  const { currentSchoolId, isSchoolUnlocked, validateSchoolByPromoter, switchSchool, unlockSchool, currentSchool, setCurrentUser, settings, schools, currentUser } = useApp();
  
  const isPromoter = (currentUser?.email?.toLowerCase().trim() === 'mahounouvictor123@gmail.com') ||
    (typeof window !== 'undefined' && localStorage.getItem('GESTIONNAIRE_PROMOTER_AUTH') === 'true');

  const [activeView, setActiveView] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const rawSchoolParam = params.get('school') || params.get('school_id') || params.get('schoolId') || params.get('validate_school_id') || params.get('etablissement');
      const codeParam = params.get('code') || params.get('pin');
      const directView = params.get('view');
      if (directView) {
        if (directView === 'promoter-admin' || directView === 'schools-hub') {
          const isStoredPromoter = localStorage.getItem('GESTIONNAIRE_PROMOTER_AUTH') === 'true';
          return isStoredPromoter ? directView : 'dashboard';
        }
        return directView;
      }
      if (rawSchoolParam || codeParam) return 'dashboard';
    }
    // Default to the official school entrance / home view
    return 'home';
  });

  // Strict guard: non-promoters cannot access promoter admin or multi-school network hub
  useEffect(() => {
    if ((activeView === 'promoter-admin' || activeView === 'schools-hub') && !isPromoter) {
      setActiveView('dashboard');
    }
  }, [activeView, isPromoter]);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [isCreateSchoolModalOpen, setIsCreateSchoolModalOpen] = useState(false);
  const [isCampaignModalOpen, setIsCampaignModalOpen] = useState(false);
  const [campaignInitialCode, setCampaignInitialCode] = useState<string | undefined>(undefined);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isDailyAccessModalOpen, setIsDailyAccessModalOpen] = useState(false);
  const [autoLoginMsg, setAutoLoginMsg] = useState<string | null>(null);
  const [selectedScanClassId, setSelectedScanClassId] = useState<string | undefined>(undefined);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const campaignParam = params.get('campaign') || params.get('campagne') || params.get('join_campaign') || params.get('camp');
    if (campaignParam) {
      setCampaignInitialCode(campaignParam);
      setIsCampaignModalOpen(true);
    }

    const rawSchoolParam = params.get('school') || params.get('school_id') || params.get('schoolId') || params.get('validate_school_id') || params.get('etablissement');
    const pwd = params.get('pwd') || params.get('password') || params.get('key');
    const roleParam = params.get('role');
    const codeParam = params.get('code') || params.get('pin');
    const staffNameParam = params.get('staff_name') || params.get('staffName') || params.get('name');
    const name = params.get('name') || params.get('school_name');
    const city = params.get('city');
    const dir = params.get('dir') || params.get('director');
    const phone = params.get('phone');
    const directView = params.get('view');

    // Find school by ID or by official code
    let schoolId = rawSchoolParam;
    if (!schoolId && codeParam) {
      const matchByCode = schools.find(s => s.officialCode === codeParam || (s as any).code === codeParam);
      if (matchByCode) {
        schoolId = matchByCode.id;
      }
    }

    if (schoolId) {
      validateSchoolByPromoter(schoolId, {
        name: name || undefined,
        city: city || undefined,
        directorName: dir || undefined,
        phone: phone || undefined,
        pwd: pwd || undefined
      });
      switchSchool(schoolId);
      unlockSchool(schoolId, pwd || '12345678');

      // Check if logged in with a specific staff role link
      if (roleParam && (roleParam === 'CENSEUR' || roleParam === 'SURVEILLANT' || roleParam === 'COMPTABLE' || roleParam === 'SECRETAIRE' || roleParam === 'DIRECTEUR')) {
        const targetSchool = schools.find(s => s.id === schoolId) || currentSchool;
        const rolePerms = targetSchool.staffRolePermissions || settings.staffRolePermissions;
        const roleConf = rolePerms?.find(r => r.role === roleParam);

        const assignedName = staffNameParam || roleConf?.assignedTo || (
          roleParam === 'CENSEUR' ? 'Censeur des Études' :
          roleParam === 'SURVEILLANT' ? 'Surveillant Général' :
          roleParam === 'COMPTABLE' ? 'Comptable / Économe' :
          roleParam === 'SECRETAIRE' ? 'Secrétariat Général' :
          'Direction'
        );

        setCurrentUser({
          id: `usr-${roleParam.toLowerCase()}-${Date.now()}`,
          name: assignedName,
          email: `${roleParam.toLowerCase()}@${targetSchool.id.toLowerCase()}.educ`,
          role: roleParam as any,
          schoolName: targetSchool.name,
          avatar: roleParam === 'CENSEUR' ? "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150" :
                  roleParam === 'SURVEILLANT' ? "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=150" :
                  roleParam === 'COMPTABLE' ? "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150" :
                  roleParam === 'SECRETAIRE' ? "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=150" :
                  "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=150"
        });

        // If directView is specified and authorized, use it, else default to first allowed view or dashboard
        const allowed = roleConf?.allowedViews || ['dashboard'];
        const firstView = allowed.includes('*') ? 'dashboard' : (allowed[0] || 'dashboard');
        setActiveView(directView && (allowed.includes('*') || allowed.includes(directView)) ? directView : firstView);

        setAutoLoginMsg(`🔐 Bienvenue ${assignedName} ! Vous êtes connecté sous le profil cloisonné : ${roleParam} (${targetSchool.name}).`);
      } else {
        setAutoLoginMsg(`🎉 Connexion automatique réussie ! Vous êtes connecté à votre établissement.`);
        setActiveView(directView || 'dashboard');
      }

      setTimeout(() => setAutoLoginMsg(null), 10000);
    }
  }, []);

  const handleOpenAiModal = () => setIsAiModalOpen(true);
  const handleCloseAiModal = () => setIsAiModalOpen(false);

  const handleOpenCreateSchoolModal = () => setIsCreateSchoolModalOpen(true);
  const handleCloseCreateSchoolModal = () => setIsCreateSchoolModalOpen(false);

  const handleOpenLoginModal = () => setIsLoginModalOpen(true);
  const handleCloseLoginModal = () => setIsLoginModalOpen(false);

  const handleOpenDailyAccessModal = () => setIsDailyAccessModalOpen(true);
  const handleCloseDailyAccessModal = () => setIsDailyAccessModalOpen(false);

  const isUnlocked = isPromoter || isSchoolUnlocked(currentSchoolId);
  const isSchoolSpecificView = activeView !== 'landing' && activeView !== 'schools-hub' && activeView !== 'promoter-admin';
  const shouldShowLockGate = isSchoolSpecificView && !isUnlocked;

  const renderView = () => {
    switch (activeView) {
      case 'landing':
        return (
          <HomeLandingView
            onNavigate={setActiveView}
            onOpenCreateSchoolModal={handleOpenCreateSchoolModal}
            onOpenCampaignModal={() => setIsCampaignModalOpen(true)}
            onOpenAiModal={handleOpenAiModal}
          />
        );
      case 'dashboard':
        return (
          <DashboardView
            onNavigate={setActiveView}
            onOpenAiModal={handleOpenAiModal}
            onOpenDailyAccessModal={handleOpenDailyAccessModal}
          />
        );
      case 'schools-hub':
        if (!isPromoter) {
          return <DashboardView onNavigate={setActiveView} onOpenAiModal={handleOpenAiModal} onOpenDailyAccessModal={handleOpenDailyAccessModal} />;
        }
        return (
          <MultiSchoolHubView
            onNavigate={setActiveView}
            onOpenCreateSchoolModal={handleOpenCreateSchoolModal}
          />
        );
      case 'students':
        return (
          <StudentsView
            onNavigateToScanRoster={(classId) => {
              if (classId) setSelectedScanClassId(classId);
              setActiveView('scan-roster');
            }}
          />
        );
      case 'scan-roster':
        return (
          <ScanRosterView
            initialClassId={selectedScanClassId}
            onNavigateToStudents={() => setActiveView('students')}
          />
        );
      case 'teachers':
        return <TeachersView />;
      case 'classes':
        return (
          <ClassesView
            onNavigateToScanRoster={(classId) => {
              if (classId) setSelectedScanClassId(classId);
              setActiveView('scan-roster');
            }}
          />
        );
      case 'subjects':
        return <SubjectsView />;
      case 'grades':
        return <GradesView />;
      case 'report-cards':
        return <ReportCardsView onNavigate={setActiveView} />;
      case 'payments':
        return <PaymentsView onNavigate={setActiveView} />;
      case 'kkiapay':
        return <KkiapayView />;
      case 'accounting':
        return <AccountingView onNavigate={setActiveView} />;
      case 'attendance':
        return <AttendanceView />;
      case 'timetable':
        return <TimetableView />;
      case 'exams':
        return <ExamsView onNavigate={setActiveView} />;
      case 'epreuves':
        return <EspaceEpreuvesView onNavigate={setActiveView} />;
      case 'library':
        return <LibraryView />;
      case 'canteen':
        return <CanteenView />;
      case 'transport':
        return <TransportView />;
      case 'documents':
        return <DocumentsView />;
      case 'communication':
        return <CommunicationView />;
      case 'parent-portal':
        return <ParentPortalView />;
      case 'student-portal':
        return <StudentPortalView />;
      case 'ai-studio':
        return <AIStudioView onOpenAiModal={handleOpenAiModal} />;
      case 'subscriptions':
        return <SubscriptionsView onNavigate={setActiveView} />;
      case 'promoter-admin':
        if (!isPromoter) {
          return <DashboardView onNavigate={setActiveView} onOpenAiModal={handleOpenAiModal} />;
        }
        return <PromoterAdminView onNavigate={setActiveView} />;
      case 'settings':
        return <SettingsView />;
      default:
        return <DashboardView onNavigate={setActiveView} onOpenAiModal={handleOpenAiModal} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors duration-200">
      
      {/* Live Auto-Update Watcher across all schools */}
      <AutoUpdateWatcher />

      {/* Fixed Header */}
      <Header
        activeView={activeView}
        onNavigate={setActiveView}
        onOpenAiModal={handleOpenAiModal}
        onOpenCreateSchoolModal={handleOpenCreateSchoolModal}
        onOpenCampaignModal={() => setIsCampaignModalOpen(true)}
        onOpenLoginModal={handleOpenLoginModal}
      />

      {/* Main Layout Body */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Sidebar */}
        <Sidebar activeView={activeView} setActiveView={setActiveView} />

        {/* Content Canvas */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto max-w-7xl mx-auto w-full">
          {autoLoginMsg && (
            <div className="mb-4 p-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold text-xs sm:text-sm flex items-center justify-between shadow-lg animate-in slide-in-from-top-3">
              <div className="flex items-center space-x-2">
                <span>{autoLoginMsg}</span>
              </div>
              <button onClick={() => setAutoLoginMsg(null)} className="text-white/80 hover:text-white font-bold text-xs cursor-pointer">
                ✕
              </button>
            </div>
          )}
          {shouldShowLockGate ? (
            <SchoolLockGate
              activeView={activeView}
              onNavigate={setActiveView}
              onOpenCreateSchoolModal={handleOpenCreateSchoolModal}
              onOpenDailyAccessModal={handleOpenDailyAccessModal}
            />
          ) : (
            renderView()
          )}
        </main>

      </div>

      {/* AI Assistant Modal */}
      <AIAssistantModal
        isOpen={isAiModalOpen}
        onClose={handleCloseAiModal}
        onNavigate={setActiveView}
      />

      {/* Create School Modal */}
      <CreateSchoolModal
        isOpen={isCreateSchoolModalOpen}
        onClose={handleCloseCreateSchoolModal}
      />

      {/* Register Via Campaign Link Modal */}
      <RegisterViaCampaignModal
        isOpen={isCampaignModalOpen}
        onClose={() => setIsCampaignModalOpen(false)}
        initialCampaignCode={campaignInitialCode}
      />

      {/* Auth & Login Portal Modal */}
      <AuthLoginModal
        isOpen={isLoginModalOpen}
        onClose={handleCloseLoginModal}
        onOpenCreateSchoolModal={handleOpenCreateSchoolModal}
      />

      {/* Daily Access 250 FCFA Payment Modal */}
      <DailyAccessPaymentModal
        isOpen={isDailyAccessModalOpen}
        onClose={handleCloseDailyAccessModal}
      />

    </div>
  );
}

import { GoogleAuthGate } from './components/GoogleAuthGate';

export default function App() {
  return (
    <GoogleAuthGate>
      <AppProvider>
        <MainApp />
      </AppProvider>
    </GoogleAuthGate>
  );
}
