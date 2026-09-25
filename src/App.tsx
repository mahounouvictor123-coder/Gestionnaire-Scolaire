import React, { useState, useEffect } from 'react';
import { AppProvider, useApp, isExplicitlyBlockedSchool } from './lib/store';
import { GoogleAuthGate, useGoogleAuth } from './components/GoogleAuthGate';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { AIAssistantModal } from './components/AIAssistantModal';
import { CreateSchoolModal } from './components/modals/CreateSchoolModal';
import { AuthLoginModal } from './components/modals/AuthLoginModal';
import { RegisterViaCampaignModal } from './components/modals/RegisterViaCampaignModal';
import { SchoolLockGate } from './components/SchoolLockGate';
import { StaffRoleLockGate } from './components/StaffRoleLockGate';
import { AutoUpdateWatcher } from './components/AutoUpdateWatcher';
import { ErrorBoundary } from './components/ErrorBoundary';
import { StaffRoleType } from './types';
import { defaultStaffRolePermissions } from './data/initialData';
import { Lock } from 'lucide-react';

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
import { ParentSubApp } from './views/ParentSubApp';
import { TeacherSubApp } from './views/TeacherSubApp';
import { ParentComplaintsInboxView } from './views/ParentComplaintsInboxView';
import { PromoterSchoolsControlBoxModal } from './components/modals/PromoterSchoolsControlBoxModal';
import { SuperPromoteurControlBoxView } from './views/SuperPromoteurControlBoxView';
import { DirectorQuizWeekSupervisionView } from './views/DirectorQuizWeekSupervisionView';
import { SchoolAccessBarrierScreen } from './components/SchoolAccessBarrierScreen';

const isSuperPromoteurRoute = (): boolean => {
  if (typeof window === 'undefined') return false;
  const path = window.location.pathname.toLowerCase();
  const hash = window.location.hash.toLowerCase();
  const params = new URLSearchParams(window.location.search);
  return (
    path === '/super-promoteur' ||
    path.startsWith('/super-promoteur') ||
    hash === '#/super-promoteur' ||
    hash === '#super-promoteur' ||
    params.get('route') === 'super-promoteur' ||
    params.get('view') === 'super-promoteur' ||
    params.get('page') === 'super-promoteur'
  );
};

function MainApp() {
  const {
    currentSchoolId,
    isSchoolUnlocked,
    isSchoolDeleted,
    isSchoolBlocked,
    isPermanentlyRevokedSchool,
    deletedSchoolIds,
    validateSchoolByPromoter,
    switchSchool,
    unlockSchool,
    currentSchool,
    setCurrentUser,
    settings,
    schools,
    currentUser
  } = useApp();
  const { gmailUser } = useGoogleAuth();
  
  const isPromoter = (currentUser?.email?.toLowerCase().trim() === 'mahounouvictor123@gmail.com') ||
    (gmailUser?.email?.toLowerCase().trim() === 'mahounouvictor123@gmail.com') ||
    (typeof window !== 'undefined' && localStorage.getItem('GESTIONNAIRE_PROMOTER_AUTH') === 'true');

  const [isControlBoxOpen, setIsControlBoxOpen] = useState(false);

  // Security Lock Gate for Staff Role Links (Censeur, Surveillant, Comptable, Secrétaire)
  const [pendingStaffLock, setPendingStaffLock] = useState<{
    schoolId: string;
    role: StaffRoleType;
    staffName?: string;
    directView?: string;
  } | null>(() => {
    if (typeof window === 'undefined') return null;
    const params = new URLSearchParams(window.location.search);
    const schoolId = params.get('school') || params.get('school_id') || params.get('schoolId') || params.get('validate_school_id') || params.get('ecole');
    const roleParam = params.get('role');
    const staffRoles: StaffRoleType[] = ['CENSEUR', 'SURVEILLANT', 'COMPTABLE', 'SECRETAIRE'];
    if (schoolId && roleParam && staffRoles.includes(roleParam as StaffRoleType)) {
      const isVerified = sessionStorage.getItem(`STAFF_VERIFIED_${schoolId}_${roleParam}`) === 'true';
      if (!isVerified) {
        return {
          schoolId,
          role: roleParam as StaffRoleType,
          staffName: params.get('staffName') || params.get('name') || undefined,
          directView: params.get('view') || params.get('directView') || undefined
        };
      }
    }
    return null;
  });

  const handleStaffUnlockSuccess = (staffUser: any) => {
    if (pendingStaffLock) {
      const { schoolId, role, directView } = pendingStaffLock;
      unlockSchool(schoolId, '12345678');
      setCurrentUser(staffUser);
      try {
        localStorage.setItem(`GESTIONNAIRE_SCOLAIRE_USER_${schoolId}`, JSON.stringify(staffUser));
        localStorage.setItem(`GESTIONNAIRE_SCOLAIRE_CURRENT_STAFF_ROLE_${schoolId}`, staffUser.role);
      } catch (e) {
        console.error(e);
      }
      const targetSchool = schools.find(s => s.id === schoolId) || currentSchool;
      const rolePerms = targetSchool.staffRolePermissions || settings.staffRolePermissions || defaultStaffRolePermissions;
      const roleConf = rolePerms?.find(r => r.role === role);
      const allowed = roleConf?.allowedViews || ['dashboard'];
      const targetView = directView && (allowed.includes('*') || allowed.includes(directView))
        ? directView
        : (allowed.includes('*') || allowed.includes('dashboard') ? 'dashboard' : (allowed[0] || 'dashboard'));

      setActiveView(targetView);
      setAutoLoginMsg(`✓ Bienvenue ${staffUser.name} ! Espace ${staffUser.role} déverrouillé avec succès.`);
      setPendingStaffLock(null);
      setTimeout(() => setAutoLoginMsg(null), 8000);
    }
  };

  const handleCancelStaffLock = () => {
    setPendingStaffLock(null);
    if (typeof window !== 'undefined') {
      try {
        const url = new URL(window.location.href);
        url.searchParams.delete('schoolId');
        url.searchParams.delete('school');
        url.searchParams.delete('school_id');
        url.searchParams.delete('ecole');
        url.searchParams.delete('role');
        url.searchParams.delete('code');
        url.searchParams.delete('staffName');
        url.searchParams.delete('name');
        url.searchParams.delete('view');
        url.searchParams.delete('directView');
        window.history.pushState({}, '', url.pathname + (url.search ? url.search : ''));
      } catch (e) {
        console.error(e);
      }
    }
    setActiveView('landing');
  };

  const [activeView, setActiveView] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      if (isSuperPromoteurRoute()) {
        return 'super-promoteur';
      }

      const params = new URLSearchParams(window.location.search);
      const subAppParam = params.get('subapp') || params.get('sub_app') || params.get('app');
      if (subAppParam === 'parent' || subAppParam === 'parents') {
        return 'parent-subapp';
      }
      if (subAppParam === 'teacher' || subAppParam === 'teachers' || subAppParam === 'prof' || subAppParam === 'profs') {
        return 'teacher-subapp';
      }

      const rawSchoolParam = params.get('school') || params.get('school_id') || params.get('schoolId') || params.get('validate_school_id') || params.get('etablissement');
      const codeParam = params.get('code') || params.get('pin');
      const directView = params.get('view');
      if (directView) {
        if (directView === 'parent' || directView === 'parents' || directView === 'parent-subapp') return 'parent-subapp';
        if (directView === 'teacher' || directView === 'teachers' || directView === 'prof' || directView === 'teacher-subapp') return 'teacher-subapp';
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
    // Strict requirement: boîte contrôle école must never appear in the dashboard of a created school
    if (activeView === 'dashboard' || hasCreatedSchool) {
      setIsControlBoxOpen(false);
    }
  }, [activeView, isPromoter, hasCreatedSchool]);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [isCreateSchoolModalOpen, setIsCreateSchoolModalOpen] = useState(false);
  const [isCampaignModalOpen, setIsCampaignModalOpen] = useState(false);
  const [campaignInitialCode, setCampaignInitialCode] = useState<string | undefined>(undefined);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [autoLoginMsg, setAutoLoginMsg] = useState<string | null>(null);
  const [selectedScanClassId, setSelectedScanClassId] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (isSuperPromoteurRoute()) {
      setActiveView('super-promoteur');
      return;
    }

    const handleRoutePop = () => {
      if (isSuperPromoteurRoute()) {
        setActiveView('super-promoteur');
      }
    };
    window.addEventListener('popstate', handleRoutePop);
    window.addEventListener('hashchange', handleRoutePop);

    const params = new URLSearchParams(window.location.search);
    const subAppParam = params.get('subapp') || params.get('sub_app') || params.get('app');
    const rawSchoolParam = params.get('school') || params.get('school_id') || params.get('schoolId') || params.get('validate_school_id') || params.get('etablissement');
    const codeParam = params.get('code') || params.get('pin');

    // STRICT ISOLATION & ACCESS BARRIER:
    // If targeted school is deleted or blocked, refuse automatic authorization/switching!
    if (subAppParam === 'parent' || subAppParam === 'parents') {
      let targetSchoolId = rawSchoolParam;
      if (!targetSchoolId && codeParam) {
        const matchByCode = schools.find(s => s.officialCode === codeParam || (s as any).code === codeParam);
        if (matchByCode) targetSchoolId = matchByCode.id;
      }
      if (targetSchoolId && (isSchoolDeleted(targetSchoolId) || isPermanentlyRevokedSchool(targetSchoolId))) {
        console.warn(`[Access Refused] SubApp Parent pour école supprimée: ${targetSchoolId}`);
        return;
      }
      if (targetSchoolId) {
        switchSchool(targetSchoolId);
      }
      setActiveView('parent-subapp');
      return;
    }

    if (subAppParam === 'teacher' || subAppParam === 'teachers' || subAppParam === 'prof' || subAppParam === 'profs') {
      let targetSchoolId = rawSchoolParam;
      if (!targetSchoolId && codeParam) {
        const matchByCode = schools.find(s => s.officialCode === codeParam || (s as any).code === codeParam);
        if (matchByCode) targetSchoolId = matchByCode.id;
      }
      if (targetSchoolId && (isSchoolDeleted(targetSchoolId) || isPermanentlyRevokedSchool(targetSchoolId))) {
        console.warn(`[Access Refused] SubApp Enseignant pour école supprimée: ${targetSchoolId}`);
        return;
      }
      if (targetSchoolId) {
        switchSchool(targetSchoolId);
      }
      setActiveView('teacher-subapp');
      return;
    }

    const campaignParam = params.get('campaign') || params.get('campagne') || params.get('join_campaign') || params.get('camp');
    if (campaignParam) {
      setCampaignInitialCode(campaignParam);
      setIsCampaignModalOpen(true);
    }
    const pwd = params.get('pwd') || params.get('password') || params.get('key');
    const roleParam = params.get('role');
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
      // PERMANENT SECURITY GUARD: If school is deleted or blocked, invalidate link completely!
      const isTargetDeleted = isSchoolDeleted(schoolId) || isPermanentlyRevokedSchool(schoolId) || (codeParam && isSchoolDeleted(codeParam));
      if (isTargetDeleted) {
        console.warn(`[Access Refused] Tentative d'accès à une école supprimée : ${schoolId}`);
        return; // Invalidate link!
      }

      const existingSchool = schools.find(s => s.id === schoolId || (s as any).officialCode === schoolId);
      const isTargetBlocked = existingSchool && (existingSchool.isBlocked === true || existingSchool.isValidatedByPromoter === false);
      if (isTargetBlocked) {
        console.warn(`[Access Refused] École bloquée par le promoteur : ${schoolId}`);
        return; // Invalidate link!
      }

      validateSchoolByPromoter(schoolId, {
        name: name || undefined,
        city: city || undefined,
        directorName: dir || undefined,
        phone: phone || undefined,
        pwd: pwd || undefined
      });
      // Check if logged in with a specific staff role link (Censeur, Surveillant, Comptable, Secrétaire)
      const isStaffRole = roleParam && (roleParam === 'CENSEUR' || roleParam === 'SURVEILLANT' || roleParam === 'COMPTABLE' || roleParam === 'SECRETAIRE');
      
      if (isStaffRole) {
        switchSchool(schoolId);

        const isVerified = sessionStorage.getItem(`STAFF_VERIFIED_${schoolId}_${roleParam}`) === 'true';
        if (!isVerified) {
          // Mandatory security gate: Do NOT unlock or log in automatically!
          setPendingStaffLock({
            schoolId,
            role: roleParam as StaffRoleType,
            staffName: staffNameParam || undefined,
            directView: directView || undefined
          });
          return;
        }

        // Already verified in this session
        const targetSchool = schools.find(s => s.id === schoolId) || currentSchool;
        const rolePerms = targetSchool.staffRolePermissions || settings.staffRolePermissions || defaultStaffRolePermissions;
        const roleConf = rolePerms?.find(r => r.role === roleParam);

        const assignedName = staffNameParam || sessionStorage.getItem(`STAFF_VERIFIED_NAME_${schoolId}_${roleParam}`) || roleConf?.assignedTo || (
          roleParam === 'CENSEUR' ? 'Censeur des Études' :
          roleParam === 'SURVEILLANT' ? 'Surveillant Général' :
          roleParam === 'COMPTABLE' ? 'Comptable / Économe' :
          'Secrétariat Général'
        );

        unlockSchool(schoolId, '12345678');
        const staffUser = {
          id: `usr-${roleParam.toLowerCase()}-${Date.now()}`,
          name: assignedName,
          email: `${roleParam.toLowerCase()}@${targetSchool.id.toLowerCase()}.educ`,
          role: roleParam as any,
          schoolName: targetSchool.name,
          avatar: roleParam === 'CENSEUR' ? "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150" :
                  roleParam === 'SURVEILLANT' ? "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=150" :
                  roleParam === 'COMPTABLE' ? "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150" :
                  "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=150"
        };
        setCurrentUser(staffUser);
        try {
          localStorage.setItem(`GESTIONNAIRE_SCOLAIRE_USER_${schoolId}`, JSON.stringify(staffUser));
          localStorage.setItem(`GESTIONNAIRE_SCOLAIRE_CURRENT_STAFF_ROLE_${schoolId}`, staffUser.role);
        } catch (e) {
          console.error(e);
        }

        // If directView is specified and authorized, use it, else default to first allowed view or dashboard
        const allowed = roleConf?.allowedViews || ['dashboard'];
        const firstView = allowed.includes('*') ? 'dashboard' : (allowed[0] || 'dashboard');
        setActiveView(directView && (allowed.includes('*') || allowed.includes(directView)) ? directView : firstView);

        setAutoLoginMsg(`🔐 Bienvenue ${assignedName} ! Vous êtes connecté sous le profil cloisonné : ${roleParam} (${targetSchool.name}).`);
      } else {
        switchSchool(schoolId);
        unlockSchool(schoolId, pwd || '12345678');
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

  const isUnlocked = isPromoter || isSchoolUnlocked(currentSchoolId);
  const isSchoolSpecificView = activeView !== 'landing' && activeView !== 'schools-hub' && activeView !== 'promoter-admin' && activeView !== 'super-promoteur';
  const shouldShowLockGate = isSchoolSpecificView && !isUnlocked;

  const renderView = () => {
    // Strict Cloisonnement check for staff roles
    const isStaffRole = currentUser?.role && ['CENSEUR', 'SURVEILLANT', 'COMPTABLE', 'SECRETAIRE'].includes(currentUser.role);
    if (isStaffRole && activeView !== 'dashboard' && activeView !== 'landing' && activeView !== 'home') {
      const staffConfigs = currentSchool?.staffRolePermissions || settings.staffRolePermissions || defaultStaffRolePermissions;
      const conf = staffConfigs.find(s => s.role === currentUser.role) || defaultStaffRolePermissions.find(d => d.role === currentUser.role);
      const isAllowed = conf?.allowedViews?.includes('*') || conf?.allowedViews?.includes(activeView);
      if (!isAllowed) {
        return (
          <div className="min-h-[60vh] flex items-center justify-center p-4">
            <div className="max-w-md w-full p-6 sm:p-8 rounded-3xl bg-slate-900 text-white border-2 border-rose-500/50 shadow-2xl space-y-4 text-center">
              <div className="w-16 h-16 rounded-2xl bg-rose-500/20 text-rose-400 border border-rose-500/40 flex items-center justify-center mx-auto">
                <Lock className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-black text-white">Fenêtre Non Autorisée</h3>
              <p className="text-xs text-slate-300 leading-relaxed font-medium">
                Conformément aux directives de la Direction, l'accès à ce module n'a pas été attribué à votre profil ({currentUser.role}).
              </p>
              <div className="pt-2">
                <button
                  onClick={() => setActiveView('dashboard')}
                  className="px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs shadow-lg transition-all cursor-pointer"
                >
                  Retourner à Mes Modules Autorisés
                </button>
              </div>
            </div>
          </div>
        );
      }
    }

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
          />
        );
      case 'schools-hub':
        if (!isPromoter) {
          return <DashboardView onNavigate={setActiveView} onOpenAiModal={handleOpenAiModal} />;
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
      case 'quiz-week':
      case 'quiz-weeks':
        return <DirectorQuizWeekSupervisionView onNavigate={setActiveView} />;
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
      case 'parent-complaints':
        return <ParentComplaintsInboxView />;
      case 'parent-portal':
        return <ParentPortalView />;
      case 'student-portal':
        return <StudentPortalView />;
      case 'ai-studio':
        return <AIStudioView onOpenAiModal={handleOpenAiModal} />;
      case 'subscriptions':
        return <SubscriptionsView onNavigate={setActiveView} />;
      case 'promoter-admin':
      case 'control-box':
        if (!isPromoter) {
          return <DashboardView onNavigate={setActiveView} onOpenAiModal={handleOpenAiModal} />;
        }
        return <PromoterAdminView onNavigate={setActiveView} />;
      case 'parent-subapp':
      case 'parent-app':
        return <ParentSubApp onReturnToPlatform={() => setActiveView('dashboard')} />;
      case 'teacher-subapp':
      case 'teacher-app':
        return <TeacherSubApp onReturnToPlatform={() => setActiveView('dashboard')} />;
      case 'super-promoteur':
        if (!isPromoter) {
          return <DashboardView onNavigate={setActiveView} onOpenAiModal={handleOpenAiModal} />;
        }
        return <SuperPromoteurControlBoxView onReturnToPlatform={() => setActiveView('dashboard')} />;
      case 'settings':
        return <SettingsView />;
      default:
        return <DashboardView onNavigate={setActiveView} onOpenAiModal={handleOpenAiModal} />;
    }
  };

  // Standalone Isolated Sub-Applications (No Admin Header, No Sidebar, No general platform access)
  const isDedicatedSubAppUrl = typeof window !== 'undefined' && (() => {
    const params = new URLSearchParams(window.location.search);
    const sub = params.get('subapp') || params.get('sub_app') || params.get('app');
    return sub === 'parent' || sub === 'parents' || sub === 'teacher' || sub === 'teachers' || sub === 'prof' || sub === 'profs';
  })();

  const isParentView = activeView === 'parent-subapp' || activeView === 'parent-app' || (
    isDedicatedSubAppUrl && typeof window !== 'undefined' && (
      (new URLSearchParams(window.location.search).get('subapp') || '').startsWith('parent') ||
      (new URLSearchParams(window.location.search).get('sub_app') || '').startsWith('parent') ||
      (new URLSearchParams(window.location.search).get('app') || '').startsWith('parent')
    )
  );

  const isTeacherView = activeView === 'teacher-subapp' || activeView === 'teacher-app' || (
    isDedicatedSubAppUrl && typeof window !== 'undefined' && (
      (new URLSearchParams(window.location.search).get('subapp') || '').startsWith('teacher') ||
      (new URLSearchParams(window.location.search).get('sub_app') || '').startsWith('teacher') ||
      (new URLSearchParams(window.location.search).get('app') || '').startsWith('teacher') ||
      (new URLSearchParams(window.location.search).get('subapp') || '').startsWith('prof') ||
      (new URLSearchParams(window.location.search).get('sub_app') || '').startsWith('prof') ||
      (new URLSearchParams(window.location.search).get('app') || '').startsWith('prof')
    )
  );

  const handleReturnHomeFromBarrier = () => {
    // 1. Clean URL search parameters so reload or back navigation doesn't re-trigger blocked school params
    if (typeof window !== 'undefined') {
      try {
        const cleanUrl = window.location.pathname || '/';
        window.history.replaceState(null, '', cleanUrl);
      } catch (e) {
        console.error(e);
      }
    }

    // 2. Switch to a guaranteed healthy unblocked school (e.g. sch-temple or first unblocked)
    const validSchool = schools.find(s =>
      s.id === 'sch-temple' ||
      (!s.isBlocked && !isExplicitlyBlockedSchool(s) && !isSchoolDeleted(s.id) && !isPermanentlyRevokedSchool(s))
    ) || schools[0];

    if (validSchool) {
      switchSchool(validSchool.id);
      if (typeof window !== 'undefined') {
        localStorage.setItem('GESTIONNAIRE_SCOLAIRE_V3_CURRENT_SCHOOL_ID', validSchool.id);
      }
    }

    // 3. Immediately return to the platform home entrance
    setActiveView('home');
  };

  const handleOpenPromoterSpaceFromBarrier = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('GESTIONNAIRE_PROMOTER_AUTH', 'true');
      try {
        const cleanUrl = window.location.pathname || '/';
        window.history.replaceState(null, '', cleanUrl);
      } catch (e) {
        console.error(e);
      }
    }
    setActiveView('super-promoteur');
  };

  // GLOBAL BARRIER: If a specific school is deleted or blocked, intercept its links
  const targetSchoolBarrier = (() => {
    // CRITICAL: NEVER block general platform views (home entrance, landing, promoter consoles, hub)
    if (
      activeView === 'home' ||
      activeView === 'landing' ||
      activeView === 'schools-hub' ||
      activeView === 'super-promoteur' ||
      activeView === 'promoter-admin'
    ) {
      return null;
    }

    // If the user is promoter, do not block the promoter
    if (isPromoter) {
      return null;
    }

    if (typeof window === 'undefined') return null;
    const params = new URLSearchParams(window.location.search);
    const rawSchool = params.get('school') || params.get('school_id') || params.get('schoolId') || params.get('validate_school_id') || params.get('etablissement');
    const code = params.get('code') || params.get('pin');

    // 1. Check if an explicit link parameter targets a deleted/revoked school
    if (rawSchool && (isSchoolDeleted(rawSchool) || isPermanentlyRevokedSchool(rawSchool))) {
      return { status: 'DELETED' as const, schoolId: rawSchool, schoolName: '' };
    }
    if (code && (isSchoolDeleted(code) || isPermanentlyRevokedSchool(code))) {
      return { status: 'DELETED' as const, schoolId: code, schoolName: '' };
    }

    // 2. Check if an explicit link parameter targets an existing school that is blocked
    if (rawSchool || code) {
      const matched = schools.find(s => 
        (rawSchool && (s.id === rawSchool || (s as any).officialCode === rawSchool)) ||
        (code && ((s as any).officialCode === code || (s as any).code === code))
      );

      if (matched) {
        if (isSchoolDeleted(matched.id) || isPermanentlyRevokedSchool(matched)) {
          return { status: 'DELETED' as const, schoolId: matched.id, schoolName: matched.name };
        }
        if (matched.isBlocked === true || isExplicitlyBlockedSchool(matched)) {
          return {
            status: 'BLOCKED' as const,
            schoolId: matched.id,
            schoolName: matched.name,
            blockReason: matched.blockReason,
            blockedAt: matched.blockedAt
          };
        }
      } else if (rawSchool || code) {
        if (isSchoolDeleted(rawSchool || code || '')) {
          return { status: 'DELETED' as const, schoolId: rawSchool || code || '', schoolName: '' };
        }
      }
    }

    // 3. If accessing dedicated sub-apps or private school dashboard and current school is blocked/deleted:
    if (isDedicatedSubAppUrl || isParentView || isTeacherView || activeView === 'dashboard') {
      if (currentSchool && (isSchoolDeleted(currentSchool.id) || isPermanentlyRevokedSchool(currentSchool))) {
        return { status: 'DELETED' as const, schoolId: currentSchool.id, schoolName: currentSchool.name };
      }
      if (currentSchool && (currentSchool.isBlocked === true || isExplicitlyBlockedSchool(currentSchool))) {
        return {
          status: 'BLOCKED' as const,
          schoolId: currentSchool.id,
          schoolName: currentSchool.name,
          blockReason: currentSchool.blockReason,
          blockedAt: currentSchool.blockedAt
        };
      }
    }

    return null;
  })();

  if (targetSchoolBarrier && (!isPromoter || (activeView !== 'super-promoteur' && activeView !== 'promoter-admin'))) {
    return (
      <SchoolAccessBarrierScreen
        status={targetSchoolBarrier.status}
        schoolName={targetSchoolBarrier.schoolName}
        schoolId={targetSchoolBarrier.schoolId}
        blockReason={targetSchoolBarrier.blockReason}
        blockedAt={targetSchoolBarrier.blockedAt}
        onReturnHome={handleReturnHomeFromBarrier}
        isPromoter={isPromoter}
        onOpenPromoterSpace={handleOpenPromoterSpaceFromBarrier}
      />
    );
  }

  if (isParentView) {
    // Return button is strictly prohibited on dedicated subapp links,
    // only permitted for logged-in Directors testing preview from their dashboard
    const canReturn = !isDedicatedSubAppUrl && (isPromoter || currentUser?.role === 'DIRECTEUR');
    return <ParentSubApp onReturnToPlatform={canReturn ? () => setActiveView('dashboard') : undefined} />;
  }

  if (isTeacherView) {
    const canReturn = !isDedicatedSubAppUrl && (isPromoter || currentUser?.role === 'DIRECTEUR');
    return <TeacherSubApp onReturnToPlatform={canReturn ? () => setActiveView('dashboard') : undefined} />;
  }

  const handleExitSuperPromoteur = () => {
    if (typeof window !== 'undefined') {
      try {
        const url = new URL(window.location.href);
        url.searchParams.delete('route');
        url.searchParams.delete('view');
        url.searchParams.delete('page');
        if (url.pathname.includes('super-promoteur')) {
          url.pathname = '/';
        }
        url.hash = '';
        window.history.pushState({}, '', url.pathname + (url.search ? url.search : ''));
      } catch (e) {
        console.error('Error exiting super-promoteur URL:', e);
      }
    }
    setActiveView('dashboard');
  };

  const isSuperPromoteurView = activeView === 'super-promoteur';

  if (isSuperPromoteurView) {
    return <SuperPromoteurControlBoxView onReturnToPlatform={handleExitSuperPromoteur} />;
  }

  // Mandatory Security Gate: block staff link until their secret code is typed and verified
  if (pendingStaffLock) {
    return (
      <StaffRoleLockGate
        schoolId={pendingStaffLock.schoolId}
        role={pendingStaffLock.role}
        staffName={pendingStaffLock.staffName}
        directView={pendingStaffLock.directView}
        onUnlockSuccess={handleStaffUnlockSuccess}
        onCancelToLanding={handleCancelStaffLock}
      />
    );
  }

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
        onOpenControlBox={(!hasCreatedSchool && activeView !== 'dashboard' && isPromoter) ? () => setIsControlBoxOpen(true) : undefined}
      />

      {/* Main Layout Body */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Sidebar */}
        <Sidebar
          activeView={activeView}
          setActiveView={setActiveView}
          onOpenControlBox={(!hasCreatedSchool && activeView !== 'dashboard' && isPromoter) ? () => setIsControlBoxOpen(true) : undefined}
        />

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
            />
          ) : (
            <ErrorBoundary key={activeView} onReset={() => setActiveView('dashboard')}>
              {renderView()}
            </ErrorBoundary>
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

      {/* Promoter Master Schools Remote Control Box Modal */}
      <PromoterSchoolsControlBoxModal
        isOpen={isControlBoxOpen && !hasCreatedSchool && activeView !== 'dashboard' && isPromoter && !currentSchool?.isUserCreated}
        onClose={() => setIsControlBoxOpen(false)}
        onNavigate={setActiveView}
        onOpenCreateSchoolModal={handleOpenCreateSchoolModal}
      />

    </div>
  );
}

export default function App() {
  return (
    <GoogleAuthGate>
      <AppProvider>
        <MainApp />
      </AppProvider>
    </GoogleAuthGate>
  );
}
