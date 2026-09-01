import React from 'react';
import { useApp } from '../lib/store';
import { SchoolLogo } from '../components/SchoolLogo';
import { defaultStaffRolePermissions } from '../data/initialData';
import { getTeacherCategory } from './TeachersView';
import {
  Users,
  GraduationCap,
  Building2,
  Wallet,
  CreditCard,
  TrendingUp,
  UserCheck,
  AlertTriangle,
  Sparkles,
  ArrowUpRight,
  BookOpen,
  Calendar,
  CheckCircle2,
  Clock,
  ShieldCheck,
  FileText,
  ScanLine,
  ClipboardList,
  Settings,
  ArrowRight,
  Award,
  Zap,
  Phone,
  KeyRound,
  Lock,
  CalendarCheck,
  FileCheck
} from 'lucide-react';

interface DashboardViewProps {
  onNavigate: (view: string) => void;
  onOpenAiModal: () => void;
  onOpenDailyAccessModal?: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onNavigate,
  onOpenAiModal,
  onOpenDailyAccessModal
}) => {
  const { students, teachers, classes, payments, expenses, settings, currentUser, currentSchool } = useApp();
  const [selectedCycle, setSelectedCycle] = React.useState<'ALL' | 'PRIMAIRE' | 'SECONDAIRE'>('ALL');

  // Cycle specific data filtering
  const primaryClassesList = classes.filter(c => c.level === 'PRIMAIRE' || c.level === 'MATERNELLE');
  const secondaryClassesList = classes.filter(c => c.level === 'COLLEGE' || c.level === 'LYCEE');

  const primaryTeachersList = teachers.filter(t => {
    const cat = getTeacherCategory(t);
    return cat === 'PRIMAIRE' || cat === 'MATERNELLE';
  });
  const secondaryProfessorsList = teachers.filter(t => {
    const cat = getTeacherCategory(t);
    return cat === 'COLLEGE' || cat === 'LYCEE';
  });

  const primaryStudentsList = students.filter(s => s.level === 'PRIMAIRE' || s.level === 'MATERNELLE');
  const secondaryStudentsList = students.filter(s => s.level === 'COLLEGE' || s.level === 'LYCEE' || s.level === 'UNIVERSITE' || s.level === 'FORMATION');

  // Metrics depending on active cycle
  const displayStudentsCount = selectedCycle === 'PRIMAIRE' 
    ? primaryStudentsList.length 
    : selectedCycle === 'SECONDAIRE' 
    ? secondaryStudentsList.length 
    : students.length;

  const displayTeachersCount = selectedCycle === 'PRIMAIRE'
    ? primaryTeachersList.length
    : selectedCycle === 'SECONDAIRE'
    ? secondaryProfessorsList.length
    : teachers.length;

  const displayClassesCount = selectedCycle === 'PRIMAIRE'
    ? primaryClassesList.length
    : selectedCycle === 'SECONDAIRE'
    ? secondaryClassesList.length
    : classes.length;

  const totalStudents = students.length;
  const totalTeachers = teachers.length;
  const totalClasses = classes.length;

  const totalRevenue = payments.reduce((acc, p) => acc + p.amountPaid, 0);
  const totalUnpaid = payments.reduce((acc, p) => acc + p.remainingBalance, 0);
  const totalExpenses = expenses.reduce((acc, e) => acc + e.amount, 0);
  const netCash = totalRevenue - totalExpenses;

  // Breakdown by level
  const levelCounts = {
    MATERNELLE: students.filter(s => s.level === 'MATERNELLE').length,
    PRIMAIRE: students.filter(s => s.level === 'PRIMAIRE').length,
    COLLEGE: students.filter(s => s.level === 'COLLEGE').length,
    LYCEE: students.filter(s => s.level === 'LYCEE').length,
    UNIVERSITE: students.filter(s => s.level === 'UNIVERSITE').length,
    FORMATION: students.filter(s => s.level === 'FORMATION').length
  };

  // Retrieve staff role config for current user
  const staffConfigs = currentSchool?.staffRolePermissions || settings.staffRolePermissions || defaultStaffRolePermissions;
  const currentStaffConfig = staffConfigs.find(s => s.role === currentUser?.role);
  const isStaffRestricted = currentUser?.role && ['CENSEUR', 'SURVEILLANT', 'COMPTABLE', 'SECRETAIRE'].includes(currentUser.role);
  const allowedViewsList = currentStaffConfig?.allowedViews?.includes('*')
    ? ['dashboard', 'students', 'scan-roster', 'classes', 'subjects', 'grades', 'report-cards', 'attendance', 'timetable', 'exams', 'epreuves', 'teachers', 'documents', 'communication', 'accounting', 'payments', 'canteen', 'transport', 'library']
    : (currentStaffConfig?.allowedViews || []);

  const isViewAllowed = (viewKey: string) => {
    if (!isStaffRestricted) return true;
    if (currentStaffConfig?.allowedViews?.includes('*')) return true;
    return allowedViewsList.includes(viewKey);
  };

  return (
    <div className="space-y-6">
      
      {/* Welcome Hero Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-900 via-teal-900 to-blue-900 p-6 sm:p-8 text-white shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-start sm:items-center space-x-4">
            <div className="p-2.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 shrink-0 hidden sm:block shadow-inner">
              <SchoolLogo variant="badge" size="lg" />
            </div>

            <div>
              <div className="flex items-center space-x-2 mb-1 flex-wrap gap-1">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-400 text-slate-950 uppercase tracking-wider">
                  ÉTABLISSEMENT ACTIF
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/30 border border-emerald-400/40 text-emerald-200">
                  {currentUser?.role === 'CENSEUR' ? '🎓 Espace Censeur / Dir. Études' :
                   currentUser?.role === 'SURVEILLANT' ? '👮 Espace Surveillant Général' :
                   currentUser?.role === 'COMPTABLE' ? '💰 Espace Comptable / Économe' :
                   currentUser?.role === 'SECRETAIRE' ? '📋 Espace Secrétariat' :
                   `👑 Dir. ${settings.directorName || currentSchool.directorName || 'Général'}`}
                </span>
                <span className="text-xs text-emerald-200 font-bold">
                  • {settings.city || currentSchool.city} ({settings.academicYear || '2025-2026'})
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-white uppercase drop-shadow-md">
                {settings.schoolName || currentSchool.name}
              </h1>
              <p className="mt-1 text-xs sm:text-sm text-emerald-100 max-w-xl font-bold flex flex-wrap items-center gap-1.5">
                <span className="bg-white/10 px-2 py-0.5 rounded-md">
                  {currentUser?.name || 'Tableau de Bord Officiel'}
                </span>
                <span>•</span>
                <span className="text-amber-300 italic">« {settings.motto || 'Discipline • Travail • Rigueur'} »</span>
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            {onOpenDailyAccessModal && (
              <button
                onClick={onOpenDailyAccessModal}
                className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 via-amber-500 to-orange-500 hover:from-amber-300 hover:to-orange-400 text-slate-950 font-black text-xs sm:text-sm shadow-xl transition-all hover:scale-105"
              >
                <Zap className="h-4 w-4 fill-slate-950" />
                <span>Valider mon accès à 250f</span>
              </button>
            )}

            <button
              onClick={onOpenAiModal}
              className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-white/90 hover:bg-white text-emerald-950 font-extrabold text-xs sm:text-sm shadow-lg transition-all hover:scale-105"
            >
              <Sparkles className="h-4 w-4 text-emerald-600 animate-pulse" />
              <span>Assistant IA & Rapports</span>
            </button>
          </div>
        </div>

        {/* Daily Subscription Quick Access Status Bar */}
        <div className="mt-5 pt-4 border-t border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center space-x-2">
            <span className="px-2 py-0.5 rounded bg-amber-400/20 text-amber-300 border border-amber-400/30 font-black text-[11px]">
              250 FCFA / jour
            </span>
            <span className="text-emerald-100 font-medium">
              Numéro Dépôt Mobile Money : <strong className="text-white font-mono font-bold">0167430381</strong>
            </span>
          </div>

          {currentSchool?.dailyAccessPaidUntil && (
            <div className="flex items-center space-x-1.5 text-emerald-200 font-bold text-[11px]">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
              <span>
                Accès actif jusqu'au :{' '}
                <span className="text-white font-black">
                  {new Date(currentSchool.dailyAccessPaidUntil).toLocaleDateString('fr-FR', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric'
                  })}
                </span>
              </span>
            </div>
          )}
        </div>

        {/* Decorative subtle background pattern */}
        <div className="absolute -right-10 -bottom-10 h-64 w-64 rounded-full bg-white/5 blur-2xl pointer-events-none" />
      </div>

      {/* STAFF RESTRICTED ROLE BANNER & AUTHORIZED MODULES */}
      {isStaffRestricted && currentStaffConfig && (
        <div className="p-5 rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white border-2 border-indigo-500/50 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-indigo-800/60">
            <div className="flex items-center space-x-3">
              <div className="p-3 rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-600/30">
                <KeyRound className="h-6 w-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/30 text-emerald-200 border border-emerald-400/40 text-[10px] font-black uppercase">
                    Espace Déverrouillé par Code
                  </span>
                  <span className="text-xs text-indigo-300 font-mono font-bold">
                    Code : {currentStaffConfig.accessCode}
                  </span>
                </div>
                <h3 className="text-lg font-black text-white mt-0.5">
                  {currentStaffConfig.title} • {currentUser?.name}
                </h3>
              </div>
            </div>

            <div className="text-right text-xs">
              <span className="text-indigo-300 font-bold block">Autorisations Direction :</span>
              <span className="font-extrabold text-white text-sm">
                {allowedViewsList.length} fenêtres accessibles
              </span>
            </div>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed font-medium">
            Conformément aux réglages définis par le Directeur Général, votre tableau de bord vous donne un accès direct et réservé aux modules ci-dessous :
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
            {isViewAllowed('grades') && (
              <button
                onClick={() => onNavigate('grades')}
                className="p-3 rounded-xl bg-indigo-900/60 hover:bg-indigo-800 border border-indigo-700/60 text-left transition-all flex items-center justify-between group cursor-pointer"
              >
                <div className="flex items-center space-x-2 truncate">
                  <ClipboardList className="h-4 w-4 text-cyan-400 shrink-0" />
                  <span className="font-extrabold text-xs text-white truncate">Saisie des Notes</span>
                </div>
                <ArrowRight className="h-3.5 w-3.5 text-indigo-400 group-hover:translate-x-1 transition-transform shrink-0" />
              </button>
            )}

            {isViewAllowed('report-cards') && (
              <button
                onClick={() => onNavigate('report-cards')}
                className="p-3 rounded-xl bg-indigo-900/60 hover:bg-indigo-800 border border-indigo-700/60 text-left transition-all flex items-center justify-between group cursor-pointer"
              >
                <div className="flex items-center space-x-2 truncate">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span className="font-extrabold text-xs text-white truncate">Bulletins QR</span>
                </div>
                <ArrowRight className="h-3.5 w-3.5 text-indigo-400 group-hover:translate-x-1 transition-transform shrink-0" />
              </button>
            )}

            {isViewAllowed('attendance') && (
              <button
                onClick={() => onNavigate('attendance')}
                className="p-3 rounded-xl bg-indigo-900/60 hover:bg-indigo-800 border border-indigo-700/60 text-left transition-all flex items-center justify-between group cursor-pointer"
              >
                <div className="flex items-center space-x-2 truncate">
                  <CalendarCheck className="h-4 w-4 text-purple-400 shrink-0" />
                  <span className="font-extrabold text-xs text-white truncate">Présences & Retards</span>
                </div>
                <ArrowRight className="h-3.5 w-3.5 text-indigo-400 group-hover:translate-x-1 transition-transform shrink-0" />
              </button>
            )}

            {isViewAllowed('students') && (
              <button
                onClick={() => onNavigate('students')}
                className="p-3 rounded-xl bg-indigo-900/60 hover:bg-indigo-800 border border-indigo-700/60 text-left transition-all flex items-center justify-between group cursor-pointer"
              >
                <div className="flex items-center space-x-2 truncate">
                  <Users className="h-4 w-4 text-blue-400 shrink-0" />
                  <span className="font-extrabold text-xs text-white truncate">Inscriptions & Fiches</span>
                </div>
                <ArrowRight className="h-3.5 w-3.5 text-indigo-400 group-hover:translate-x-1 transition-transform shrink-0" />
              </button>
            )}

            {isViewAllowed('scan-roster') && (
              <button
                onClick={() => onNavigate('scan-roster')}
                className="p-3 rounded-xl bg-indigo-900/60 hover:bg-indigo-800 border border-indigo-700/60 text-left transition-all flex items-center justify-between group cursor-pointer"
              >
                <div className="flex items-center space-x-2 truncate">
                  <ScanLine className="h-4 w-4 text-teal-400 shrink-0" />
                  <span className="font-extrabold text-xs text-white truncate">Scan OCR Listes</span>
                </div>
                <ArrowRight className="h-3.5 w-3.5 text-indigo-400 group-hover:translate-x-1 transition-transform shrink-0" />
              </button>
            )}

            {isViewAllowed('accounting') && (
              <button
                onClick={() => onNavigate('accounting')}
                className="p-3 rounded-xl bg-indigo-900/60 hover:bg-indigo-800 border border-indigo-700/60 text-left transition-all flex items-center justify-between group cursor-pointer"
              >
                <div className="flex items-center space-x-2 truncate">
                  <Wallet className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span className="font-extrabold text-xs text-white truncate">Comptabilité & Caisse</span>
                </div>
                <ArrowRight className="h-3.5 w-3.5 text-indigo-400 group-hover:translate-x-1 transition-transform shrink-0" />
              </button>
            )}

            {isViewAllowed('payments') && (
              <button
                onClick={() => onNavigate('payments')}
                className="p-3 rounded-xl bg-indigo-900/60 hover:bg-indigo-800 border border-indigo-700/60 text-left transition-all flex items-center justify-between group cursor-pointer"
              >
                <div className="flex items-center space-x-2 truncate">
                  <CreditCard className="h-4 w-4 text-amber-400 shrink-0" />
                  <span className="font-extrabold text-xs text-white truncate">Frais Scolarité</span>
                </div>
                <ArrowRight className="h-3.5 w-3.5 text-indigo-400 group-hover:translate-x-1 transition-transform shrink-0" />
              </button>
            )}

            {isViewAllowed('timetable') && (
              <button
                onClick={() => onNavigate('timetable')}
                className="p-3 rounded-xl bg-indigo-900/60 hover:bg-indigo-800 border border-indigo-700/60 text-left transition-all flex items-center justify-between group cursor-pointer"
              >
                <div className="flex items-center space-x-2 truncate">
                  <Calendar className="h-4 w-4 text-orange-400 shrink-0" />
                  <span className="font-extrabold text-xs text-white truncate">Emplois du Temps</span>
                </div>
                <ArrowRight className="h-3.5 w-3.5 text-indigo-400 group-hover:translate-x-1 transition-transform shrink-0" />
              </button>
            )}

            {isViewAllowed('exams') && (
              <button
                onClick={() => onNavigate('exams')}
                className="p-3 rounded-xl bg-indigo-900/60 hover:bg-indigo-800 border border-indigo-700/60 text-left transition-all flex items-center justify-between group cursor-pointer"
              >
                <div className="flex items-center space-x-2 truncate">
                  <Award className="h-4 w-4 text-yellow-400 shrink-0" />
                  <span className="font-extrabold text-xs text-white truncate">Examens & Conseils</span>
                </div>
                <ArrowRight className="h-3.5 w-3.5 text-indigo-400 group-hover:translate-x-1 transition-transform shrink-0" />
              </button>
            )}

            {isViewAllowed('epreuves') && (
              <button
                onClick={() => onNavigate('epreuves')}
                className="p-3 rounded-xl bg-indigo-900/60 hover:bg-indigo-800 border border-indigo-700/60 text-left transition-all flex items-center justify-between group cursor-pointer"
              >
                <div className="flex items-center space-x-2 truncate">
                  <FileText className="h-4 w-4 text-blue-300 shrink-0" />
                  <span className="font-extrabold text-xs text-white truncate">Épreuves Word IA</span>
                </div>
                <ArrowRight className="h-3.5 w-3.5 text-indigo-400 group-hover:translate-x-1 transition-transform shrink-0" />
              </button>
            )}

            {isViewAllowed('documents') && (
              <button
                onClick={() => onNavigate('documents')}
                className="p-3 rounded-xl bg-indigo-900/60 hover:bg-indigo-800 border border-indigo-700/60 text-left transition-all flex items-center justify-between group cursor-pointer"
              >
                <div className="flex items-center space-x-2 truncate">
                  <FileCheck className="h-4 w-4 text-indigo-300 shrink-0" />
                  <span className="font-extrabold text-xs text-white truncate">Documents & Cartes</span>
                </div>
                <ArrowRight className="h-3.5 w-3.5 text-indigo-400 group-hover:translate-x-1 transition-transform shrink-0" />
              </button>
            )}

            {isViewAllowed('communication') && (
              <button
                onClick={() => onNavigate('communication')}
                className="p-3 rounded-xl bg-indigo-900/60 hover:bg-indigo-800 border border-indigo-700/60 text-left transition-all flex items-center justify-between group cursor-pointer"
              >
                <div className="flex items-center space-x-2 truncate">
                  <Phone className="h-4 w-4 text-emerald-300 shrink-0" />
                  <span className="font-extrabold text-xs text-white truncate">SMS & WhatsApp</span>
                </div>
                <ArrowRight className="h-3.5 w-3.5 text-indigo-400 group-hover:translate-x-1 transition-transform shrink-0" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* DUAL WORKSPACES SELECTION HUB: ESPACE DIRECTION & ESPACE SECRÉTARIAT (Visible for Director) */}
      {!isStaffRestricted && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* ESPACE DIRECTION CARD */}
          <div className="bg-gradient-to-br from-slate-900 to-indigo-950 text-white rounded-2xl p-6 border border-indigo-700/60 shadow-lg space-y-4 relative overflow-hidden group">
            <div className="flex items-center justify-between border-b border-indigo-800/60 pb-3">
              <div className="flex items-center space-x-3">
                <div className="p-3 rounded-xl bg-indigo-600 text-white shadow-md shadow-indigo-600/30">
                  <ShieldCheck className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-white tracking-wide">ESPACE DIRECTION</h3>
                  <p className="text-[11px] text-indigo-300 font-bold uppercase">Pilotage, Finances & Stratégie</p>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-indigo-500/20 text-indigo-200 border border-indigo-500/40 text-[10px] font-black uppercase">
                Accès Maître Total
              </span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed font-medium">
              Supervisez la trésorerie, la comptabilité des caisses, les enseignants, la discipline générale et générez vos rapports avec l'IA Gemini.
            </p>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                onClick={() => onNavigate('accounting')}
                className="p-2.5 rounded-xl bg-indigo-900/60 hover:bg-indigo-800 border border-indigo-700/50 text-left transition-all flex items-center justify-between group/btn cursor-pointer"
              >
                <div className="flex items-center space-x-2 truncate">
                  <Wallet className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span className="font-extrabold text-white truncate">Comptabilité</span>
                </div>
                <ArrowRight className="h-3.5 w-3.5 text-indigo-400 group-hover/btn:translate-x-1 transition-transform shrink-0" />
              </button>

              <button
                onClick={() => onNavigate('teachers')}
                className="p-2.5 rounded-xl bg-indigo-900/60 hover:bg-indigo-800 border border-indigo-700/50 text-left transition-all flex items-center justify-between group/btn cursor-pointer"
              >
                <div className="flex items-center space-x-2 truncate">
                  <GraduationCap className="h-4 w-4 text-blue-400 shrink-0" />
                  <span className="font-extrabold text-white truncate">Enseignants</span>
                </div>
                <ArrowRight className="h-3.5 w-3.5 text-indigo-400 group-hover/btn:translate-x-1 transition-transform shrink-0" />
              </button>

              <button
                onClick={() => onNavigate('exams')}
                className="p-2.5 rounded-xl bg-indigo-900/60 hover:bg-indigo-800 border border-indigo-700/50 text-left transition-all flex items-center justify-between group/btn cursor-pointer"
              >
                <div className="flex items-center space-x-2 truncate">
                  <Award className="h-4 w-4 text-amber-400 shrink-0" />
                  <span className="font-extrabold text-white truncate">Conseil Classe</span>
                </div>
                <ArrowRight className="h-3.5 w-3.5 text-indigo-400 group-hover/btn:translate-x-1 transition-transform shrink-0" />
              </button>

              <button
                onClick={() => onNavigate('ai-studio')}
                className="p-2.5 rounded-xl bg-indigo-900/60 hover:bg-indigo-800 border border-indigo-700/50 text-left transition-all flex items-center justify-between group/btn cursor-pointer"
              >
                <div className="flex items-center space-x-2 truncate">
                  <Sparkles className="h-4 w-4 text-purple-400 shrink-0" />
                  <span className="font-extrabold text-white truncate">IA Gemini Pro</span>
                </div>
                <ArrowRight className="h-3.5 w-3.5 text-indigo-400 group-hover/btn:translate-x-1 transition-transform shrink-0" />
              </button>
            </div>
          </div>

          {/* ESPACE SECRÉTARIAT CARD */}
          <div className="bg-gradient-to-br from-slate-900 to-emerald-950 text-white rounded-2xl p-6 border border-emerald-700/60 shadow-lg space-y-4 relative overflow-hidden group">
            <div className="flex items-center justify-between border-b border-emerald-800/60 pb-3">
              <div className="flex items-center space-x-3">
                <div className="p-3 rounded-xl bg-emerald-600 text-white shadow-md shadow-emerald-600/30">
                  <FileText className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-white tracking-wide">ESPACE SECRÉTARIAT</h3>
                  <p className="text-[11px] text-emerald-300 font-bold uppercase">Inscriptions, Notes & Dossiers</p>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-200 border border-emerald-500/40 text-[10px] font-black uppercase">
                Scolarité
              </span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed font-medium">
              Gérez les dossiers des élèves, numérisez les listes de classe par OCR, saisissez les notes et imprimez les bulletins QR Code.
            </p>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                onClick={() => onNavigate('students')}
                className="p-2.5 rounded-xl bg-emerald-900/60 hover:bg-emerald-800 border border-emerald-700/50 text-left transition-all flex items-center justify-between group/btn cursor-pointer"
              >
                <div className="flex items-center space-x-2 truncate">
                  <Users className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span className="font-extrabold text-white truncate">Élèves & Inscrits</span>
                </div>
                <ArrowRight className="h-3.5 w-3.5 text-emerald-400 group-hover/btn:translate-x-1 transition-transform shrink-0" />
              </button>

              <button
                onClick={() => onNavigate('scan-roster')}
                className="p-2.5 rounded-xl bg-emerald-900/60 hover:bg-emerald-800 border border-emerald-700/50 text-left transition-all flex items-center justify-between group/btn cursor-pointer"
              >
                <div className="flex items-center space-x-2 truncate">
                  <ScanLine className="h-4 w-4 text-blue-400 shrink-0" />
                  <span className="font-extrabold text-white truncate">Scan OCR Listes</span>
                </div>
                <ArrowRight className="h-3.5 w-3.5 text-emerald-400 group-hover/btn:translate-x-1 transition-transform shrink-0" />
              </button>

              <button
                onClick={() => onNavigate('grades')}
                className="p-2.5 rounded-xl bg-emerald-900/60 hover:bg-emerald-800 border border-emerald-700/50 text-left transition-all flex items-center justify-between group/btn cursor-pointer"
              >
                <div className="flex items-center space-x-2 truncate">
                  <ClipboardList className="h-4 w-4 text-amber-400 shrink-0" />
                  <span className="font-extrabold text-white truncate">Saisie des Notes</span>
                </div>
                <ArrowRight className="h-3.5 w-3.5 text-emerald-400 group-hover/btn:translate-x-1 transition-transform shrink-0" />
              </button>

              <button
                onClick={() => onNavigate('report-cards')}
                className="p-2.5 rounded-xl bg-emerald-900/60 hover:bg-emerald-800 border border-emerald-700/50 text-left transition-all flex items-center justify-between group/btn cursor-pointer"
              >
                <div className="flex items-center space-x-2 truncate">
                  <CheckCircle2 className="h-4 w-4 text-teal-400 shrink-0" />
                  <span className="font-extrabold text-white truncate">Bulletins QR Code</span>
                </div>
                <ArrowRight className="h-3.5 w-3.5 text-emerald-400 group-hover/btn:translate-x-1 transition-transform shrink-0" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DIRECTOR STAFF ACCESS CODES BANNER (Visible for Director & Super Admin) */}
      {(currentUser?.role === 'DIRECTEUR' || currentUser?.role === 'SUPER_ADMIN') && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-900/90 via-indigo-900/90 to-purple-900/90 text-white border border-blue-500/40 shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-blue-500/30 border border-blue-400/40 shrink-0">
              <ShieldCheck className="h-5 w-5 text-blue-300" />
            </div>
            <div>
              <h4 className="font-extrabold text-sm text-white">Cloisonnement des Rôles & Codes d'Accès Équipe</h4>
              <p className="text-xs text-blue-200">
                Vous avez le contrôle total : définissez les codes confidentiels et cochez les fenêtres visibles pour le Censeur, le Surveillant, le Comptable et le Secrétaire.
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigate('settings')}
            className="px-4 py-2 rounded-xl bg-white text-blue-900 font-extrabold text-xs hover:bg-blue-50 shadow-md transition-all shrink-0 flex items-center space-x-1.5 cursor-pointer"
          >
            <span>Gérer les Codes & Rôles</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Official School Prospectus & Autorisations Header Banner */}
      <div className="p-5 rounded-2xl bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1 text-xs">
          <div className="flex items-center space-x-2 text-emerald-900 dark:text-emerald-200 font-extrabold text-sm">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>Autorisations Ministérielles d'Ouverture :</span>
          </div>
          <p className="text-slate-600 dark:text-slate-300 font-medium">
            <span className="font-bold text-slate-800 dark:text-slate-100">Maternelle & Primaire :</span> N° 209/MEMP/DC/SGM/DPP/DEPEMP/SP du 23/10/2012
            <span className="mx-2">|</span>
            <span className="font-bold text-slate-800 dark:text-slate-100">Secondaire :</span> N° 417/MESFTPRIJ/DC/SGM/DESG/DEP/DPP/SGSI/SA du 05/12/2014
          </p>
          <p className="text-slate-500 text-[11px]">
            Contacts Direction : {settings.phone || 'Non renseigné'} — Email : {settings.email || 'Non renseigné'} — Adresse : {settings.address || ''} {settings.city || ''}
          </p>
        </div>

        <div className="flex items-center space-x-2 shrink-0 text-xs">
          <span className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-emerald-300 font-extrabold text-emerald-800 dark:text-emerald-300 shadow-xs">
            Anglais dès Maternelle
          </span>
          <span className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-blue-300 font-extrabold text-blue-800 dark:text-blue-300 shadow-xs">
            Informatique dès 6ème
          </span>
        </div>
      </div>

      {/* CYCLE SEPARATION SELECTOR BAR */}
      <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="flex items-center space-x-2">
          <span className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Niveau Actif :
          </span>
          <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200">
            {selectedCycle === 'PRIMAIRE' ? '🎒 Cours Primaire & Maternelle' :
             selectedCycle === 'SECONDAIRE' ? '🏫 Cours Secondaire (Collège & Lycée)' :
             '🏛️ Tout le Complexe Scolaire'}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => setSelectedCycle('ALL')}
            className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
              selectedCycle === 'ALL'
                ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-md scale-102'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            🏛️ Vue Globale
          </button>

          <button
            onClick={() => setSelectedCycle('PRIMAIRE')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center space-x-1.5 ${
              selectedCycle === 'PRIMAIRE'
                ? 'bg-emerald-600 text-white shadow-md scale-102 ring-2 ring-emerald-500/30'
                : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100'
            }`}
          >
            <span>🎒</span>
            <span>Cours Maternelle & Primaire</span>
            <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-700/40 text-emerald-100">
              {primaryClassesList.length} cl.
            </span>
          </button>

          <button
            onClick={() => setSelectedCycle('SECONDAIRE')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center space-x-1.5 ${
              selectedCycle === 'SECONDAIRE'
                ? 'bg-blue-600 text-white shadow-md scale-102 ring-2 ring-blue-500/30'
                : 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 hover:bg-blue-100'
            }`}
          >
            <span>🏫</span>
            <span>Cours Secondaire</span>
            <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-blue-700/40 text-blue-100">
              {secondaryClassesList.length} cl.
            </span>
          </button>
        </div>
      </div>

      {/* DEDICATED CYCLE ADMINISTRATION ORGANIGRAMME */}
      {selectedCycle === 'PRIMAIRE' && (
        <div className="p-6 rounded-3xl bg-gradient-to-r from-emerald-950 via-teal-950 to-slate-900 text-white border-2 border-emerald-500/60 shadow-xl space-y-5 animate-in fade-in duration-300">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-emerald-800/60">
            <div className="flex items-center space-x-3">
              <div className="p-3 rounded-2xl bg-emerald-600 text-white shadow-lg shadow-emerald-600/30">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <div>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-400/20 text-emerald-300 border border-emerald-400/40 text-[10px] font-black uppercase">
                  Organigramme Officiel
                </span>
                <h3 className="text-xl font-black text-white mt-0.5">
                  Administration du Cours Maternelle & Primaire
                </h3>
              </div>
            </div>

            <div className="text-xs text-emerald-200 font-bold bg-emerald-900/50 px-3 py-1.5 rounded-xl border border-emerald-700/60">
              Classes : CI, CP, CE1, CE2, CM1, CM2 & Maternelle
            </div>
          </div>

          <p className="text-xs text-emerald-100 leading-relaxed font-medium">
            Conformément à l'organisation scolaire primaire, les rôles administratifs et pédagogiques sont strictement configurés :
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* 1. Directeur */}
            <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-emerald-500/40 space-y-2">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 rounded-xl bg-amber-400 text-slate-950 font-black">
                  👔
                </div>
                <div>
                  <span className="text-[10px] font-black text-amber-300 uppercase tracking-wider block">
                    Direction d'École
                  </span>
                  <h4 className="font-black text-sm text-white">Directeur / Directrice</h4>
                </div>
              </div>
              <p className="text-xs text-slate-200 font-medium">
                Responsable légal, pilotage pédagogique, relations avec l'inspection primaire et les parents.
              </p>
              <div className="pt-1 text-[11px] font-bold text-emerald-300">
                Titulaire : {settings.directorName || currentSchool.directorName || 'M. Paul KOUANDÉ'}
              </div>
            </div>

            {/* 2. Secrétaire */}
            <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-emerald-500/40 space-y-2">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 rounded-xl bg-teal-400 text-slate-950 font-black">
                  📑
                </div>
                <div>
                  <span className="text-[10px] font-black text-teal-300 uppercase tracking-wider block">
                    Secrétariat Primaire
                  </span>
                  <h4 className="font-black text-sm text-white">Secrétaire d'École</h4>
                </div>
              </div>
              <p className="text-xs text-slate-200 font-medium">
                Inscriptions des écoliers, gestion des dossiers scolaires, certificats de scolarité, registres matricules.
              </p>
              <div className="pt-1 text-[11px] font-bold text-teal-300">
                Service : Secrétariat & Accueil des Familles
              </div>
            </div>

            {/* 3. Maîtres et Maîtresses */}
            <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-emerald-500/40 space-y-2">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 rounded-xl bg-emerald-400 text-slate-950 font-black">
                  🎒
                </div>
                <div>
                  <span className="text-[10px] font-black text-emerald-300 uppercase tracking-wider block">
                    Corps Enseignant Primaire
                  </span>
                  <h4 className="font-black text-sm text-white">Maître ou Maîtresse</h4>
                </div>
              </div>
              <p className="text-xs text-slate-200 font-medium">
                Instituteurs et maîtresses titulaires responsables chacun d'une classe unique (Français, Mathématiques, Éveil, EST).
              </p>
              <div className="pt-1 text-[11px] font-bold text-emerald-300">
                Effectif : {primaryTeachersList.length} Maîtres(ses) pour {primaryClassesList.length} classes
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedCycle === 'SECONDAIRE' && (
        <div className="p-6 rounded-3xl bg-gradient-to-r from-blue-950 via-indigo-950 to-slate-900 text-white border-2 border-blue-500/60 shadow-xl space-y-5 animate-in fade-in duration-300">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-blue-800/60">
            <div className="flex items-center space-x-3">
              <div className="p-3 rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-600/30">
                <GraduationCap className="h-6 w-6" />
              </div>
              <div>
                <span className="px-2.5 py-0.5 rounded-full bg-blue-400/20 text-blue-300 border border-blue-400/40 text-[10px] font-black uppercase">
                  Organigramme Officiel
                </span>
                <h3 className="text-xl font-black text-white mt-0.5">
                  Administration du Cours Secondaire (Collège & Lycée)
                </h3>
              </div>
            </div>

            <div className="text-xs text-blue-200 font-bold bg-blue-900/50 px-3 py-1.5 rounded-xl border border-blue-700/60">
              Classes : 6ème à 3ème (Collège) & 2nde à Tle (Lycée)
            </div>
          </div>

          <p className="text-xs text-blue-100 leading-relaxed font-medium">
            Organisation hiérarchique officielle du Secondaire avec direction générale, études, surveillance et professeurs :
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {/* Proviseur / Directeur */}
            <div className="p-3.5 rounded-2xl bg-white/10 backdrop-blur-md border border-blue-500/40 space-y-1.5">
              <span className="text-[10px] font-black text-amber-300 uppercase tracking-wider block">Direction</span>
              <h4 className="font-black text-sm text-white">Proviseur / Dir. Général</h4>
              <p className="text-xs text-slate-200">Gouvernance, conformité ministérielle et autorisations d'ouverture.</p>
            </div>

            {/* Censeur */}
            <div className="p-3.5 rounded-2xl bg-white/10 backdrop-blur-md border border-blue-500/40 space-y-1.5">
              <span className="text-[10px] font-black text-cyan-300 uppercase tracking-wider block">Pédagogie & Études</span>
              <h4 className="font-black text-sm text-white">Censeur (Dir. Études)</h4>
              <p className="text-xs text-slate-200">Emplois du temps, coordination des professeurs et suivi des programmes.</p>
            </div>

            {/* Surveillant Général */}
            <div className="p-3.5 rounded-2xl bg-white/10 backdrop-blur-md border border-blue-500/40 space-y-1.5">
              <span className="text-[10px] font-black text-orange-300 uppercase tracking-wider block">Discipline</span>
              <h4 className="font-black text-sm text-white">Surveillant Général</h4>
              <p className="text-xs text-slate-200">Contrôle des présences, retards, discipline et sécurité des élèves.</p>
            </div>

            {/* Professeurs */}
            <div className="p-3.5 rounded-2xl bg-white/10 backdrop-blur-md border border-blue-500/40 space-y-1.5">
              <span className="text-[10px] font-black text-emerald-300 uppercase tracking-wider block">Corps Professoral</span>
              <h4 className="font-black text-sm text-white">Professeurs de Matière</h4>
              <p className="text-xs text-slate-200">{secondaryProfessorsList.length} Professeurs spécialisés (Maths, PC, SVT, Français, etc.).</p>
            </div>
          </div>
        </div>
      )}

      {selectedCycle === 'ALL' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Primaire Summary Banner */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-950 via-teal-950 to-slate-900 text-white border border-emerald-600/50 shadow-md space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <span className="text-2xl">🎒</span>
                <div>
                  <h4 className="font-black text-sm text-white">COURS MATERNELLE & PRIMAIRE</h4>
                  <p className="text-[11px] text-emerald-300 font-bold">Administration & Maîtres(ses)</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedCycle('PRIMAIRE')}
                className="px-3 py-1 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black transition-all cursor-pointer"
              >
                Explorer le Primaire →
              </button>
            </div>
            <div className="p-3 rounded-xl bg-white/10 text-xs text-slate-200 space-y-1 font-medium">
              <div>• 👔 <strong>Directeur / Directrice :</strong> {settings.directorName || 'Paul KOUANDÉ'}</div>
              <div>• 📑 <strong>Secrétaire d'École :</strong> Service scolarité et dossiers</div>
              <div>• 🎒 <strong>Maîtres ou Maîtresses :</strong> {primaryTeachersList.length} instituteurs pour {primaryClassesList.length} classes</div>
            </div>
          </div>

          {/* Secondaire Summary Banner */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-blue-950 via-indigo-950 to-slate-900 text-white border border-blue-600/50 shadow-md space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <span className="text-2xl">🏫</span>
                <div>
                  <h4 className="font-black text-sm text-white">COURS SECONDAIRE (COLLÈGE & LYCÉE)</h4>
                  <p className="text-[11px] text-blue-300 font-bold">Direction, Censure & Professeurs</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedCycle('SECONDAIRE')}
                className="px-3 py-1 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-black transition-all cursor-pointer"
              >
                Explorer le Secondaire →
              </button>
            </div>
            <div className="p-3 rounded-xl bg-white/10 text-xs text-slate-200 space-y-1 font-medium">
              <div>• 👔 <strong>Direction & Censure :</strong> Proviseur & Censeur (Dir. Études)</div>
              <div>• 📋 <strong>Surveillant Général :</strong> Surveillance & Assiduité</div>
              <div>• 👨‍🏫 <strong>Professeurs :</strong> {secondaryProfessorsList.length} professeurs de spécialité ({secondaryClassesList.length} classes)</div>
            </div>
          </div>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Total Students */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                {selectedCycle === 'PRIMAIRE' ? 'Écoliers Primaire' : selectedCycle === 'SECONDAIRE' ? 'Élèves Secondaire' : 'Total Élèves'}
              </p>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1">{displayStudentsCount}</h3>
              <p className="text-[11px] text-emerald-600 font-bold mt-1 flex items-center space-x-1">
                <TrendingUp className="h-3 w-3" />
                <span>
                  {selectedCycle === 'PRIMAIRE' ? 'Inscrits en Primaire/Maternelle' : selectedCycle === 'SECONDAIRE' ? 'Inscrits au Secondaire' : "+12% d'inscrits cette année"}
                </span>
              </p>
            </div>
            <div className="p-3 rounded-2xl bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
              <Users className="h-6 w-6" />
            </div>
          </div>
        </div>

        {/* Total Teachers / Maitres */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                {selectedCycle === 'PRIMAIRE' ? 'Maîtres & Maîtresses' : selectedCycle === 'SECONDAIRE' ? 'Professeurs' : 'Enseignants'}
              </p>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1">{displayTeachersCount}</h3>
              <p className="text-[11px] text-slate-500 font-medium mt-1">
                {selectedCycle === 'PRIMAIRE' ? 'Instituteurs & Éducatrices' : selectedCycle === 'SECONDAIRE' ? 'Professeurs par matière' : 'Corps enseignant'}
              </p>
            </div>
            <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400">
              <GraduationCap className="h-6 w-6" />
            </div>
          </div>
        </div>

        {/* Total Classes */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                {selectedCycle === 'PRIMAIRE' ? 'Classes Primaire' : selectedCycle === 'SECONDAIRE' ? 'Classes Secondaire' : 'Classes & Salles'}
              </p>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1">{displayClassesCount}</h3>
              <p className="text-[11px] text-slate-500 font-medium mt-1">
                {selectedCycle === 'PRIMAIRE' ? 'Maternelle au CM2' : selectedCycle === 'SECONDAIRE' ? '6ème à la Terminale' : 'Maternelle à la Terminale'}
              </p>
            </div>
            <div className="p-3 rounded-2xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
              <Building2 className="h-6 w-6" />
            </div>
          </div>
        </div>

        {/* Recettes de la Scolarité */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Recettes Perçues</p>
              <h3 className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-1 truncate">
                {totalRevenue.toLocaleString()} {settings.currency}
              </h3>
              <p className="text-[11px] text-amber-600 font-bold mt-1">
                Impayés: {totalUnpaid.toLocaleString()} {settings.currency}
              </p>
            </div>
            <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400">
              <CreditCard className="h-6 w-6" />
            </div>
          </div>
        </div>

      </div>

      {/* Middle Grid: Enrollment Breakdown & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Enrollment per Level */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-sm">Effectifs par Niveau d'Enseignement</h3>
              <p className="text-xs text-slate-500">Répartition des {totalStudents} élèves inscrits</p>
            </div>
            <button
              onClick={() => onNavigate('students')}
              className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center space-x-1"
            >
              <span>Voir tout le dossier</span>
              <ArrowUpRight className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Student & Staff Official Figures Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            
            {/* Student Effectifs */}
            <div className="p-4 rounded-xl bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider">
                  Effectif Élèves Réel
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-600 text-white">
                  {totalStudents} Élèves
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 pt-1">
                <div className="p-2.5 rounded-lg bg-white/80 dark:bg-slate-900/80 border border-emerald-100 dark:border-emerald-900">
                  <p className="text-[10px] text-slate-500 font-bold">Maternelle & Primaire</p>
                  <p className="text-xl font-black text-emerald-700 dark:text-emerald-400">
                    {levelCounts.MATERNELLE + levelCounts.PRIMAIRE} Élèves
                  </p>
                  <p className="text-[9px] text-slate-400 font-medium">Petits, Grands à CM2</p>
                </div>
                <div className="p-2.5 rounded-lg bg-white/80 dark:bg-slate-900/80 border border-emerald-100 dark:border-emerald-900">
                  <p className="text-[10px] text-slate-500 font-bold">Secondaire / Autre</p>
                  <p className="text-xl font-black text-blue-700 dark:text-blue-400">
                    {levelCounts.COLLEGE + levelCounts.LYCEE + levelCounts.UNIVERSITE + levelCounts.FORMATION} Élèves
                  </p>
                  <p className="text-[9px] text-slate-400 font-medium">Collège, Lycée & Pro</p>
                </div>
              </div>
            </div>

            {/* Staff & Teachers Effectifs */}
            <div className="p-4 rounded-xl bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold text-blue-800 dark:text-blue-300 uppercase tracking-wider">
                  Corps Professoral Officiel
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-600 text-white">
                  {totalTeachers} Enseignants
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 pt-1">
                <div className="p-2.5 rounded-lg bg-white/80 dark:bg-slate-900/80 border border-blue-100 dark:border-blue-900">
                  <p className="text-[10px] text-slate-500 font-bold">Enseignants Primaire</p>
                  <p className="text-xl font-black text-emerald-700 dark:text-emerald-400">
                    {teachers.filter(t => t.specialty === 'PRIMAIRE' || t.qualification?.toLowerCase().includes('primaire')).length}
                  </p>
                  <p className="text-[9px] text-slate-400 font-medium">Permanents qualifiés</p>
                </div>
                <div className="p-2.5 rounded-lg bg-white/80 dark:bg-slate-900/80 border border-blue-100 dark:border-blue-900">
                  <p className="text-[10px] text-slate-500 font-bold">Professeurs Secondaire</p>
                  <p className="text-xl font-black text-blue-700 dark:text-blue-400">
                    {teachers.filter(t => t.specialty !== 'PRIMAIRE' && !t.qualification?.toLowerCase().includes('primaire')).length}
                  </p>
                  <p className="text-[9px] text-slate-400 font-medium">Professeurs de matières</p>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Quick Shortcuts */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
          <h3 className="font-bold text-slate-900 dark:text-white text-sm pb-2 border-b border-slate-100 dark:border-slate-800">
            Raccourcis Rapides
          </h3>

          <div className="space-y-2 text-xs">
            <button
              onClick={() => onNavigate('students')}
              className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-950/50 text-slate-800 dark:text-slate-200 font-bold flex items-center justify-between transition-colors border border-slate-200 dark:border-slate-700"
            >
              <div className="flex items-center space-x-2">
                <Users className="h-4 w-4 text-blue-600" />
                <span>Inscrire un Nouvel Élève</span>
              </div>
              <ArrowUpRight className="h-3.5 w-3.5 text-slate-400" />
            </button>

            <button
              onClick={() => onNavigate('payments')}
              className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 text-slate-800 dark:text-slate-200 font-bold flex items-center justify-between transition-colors border border-slate-200 dark:border-slate-700"
            >
              <div className="flex items-center space-x-2">
                <CreditCard className="h-4 w-4 text-emerald-600" />
                <span>Encaisser Frais de Scolarité</span>
              </div>
              <ArrowUpRight className="h-3.5 w-3.5 text-slate-400" />
            </button>

            <button
              onClick={() => onNavigate('report-cards')}
              className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-purple-50 dark:hover:bg-purple-950/50 text-slate-800 dark:text-slate-200 font-bold flex items-center justify-between transition-colors border border-slate-200 dark:border-slate-700"
            >
              <div className="flex items-center space-x-2">
                <BookOpen className="h-4 w-4 text-purple-600" />
                <span>Générer Bulletins Trimestriels</span>
              </div>
              <ArrowUpRight className="h-3.5 w-3.5 text-slate-400" />
            </button>

            <button
              onClick={() => onNavigate('documents')}
              className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-amber-50 dark:hover:bg-amber-950/50 text-slate-800 dark:text-slate-200 font-bold flex items-center justify-between transition-colors border border-slate-200 dark:border-slate-700"
            >
              <div className="flex items-center space-x-2">
                <UserCheck className="h-4 w-4 text-amber-600" />
                <span>Imprimer Cartes & Certificats</span>
              </div>
              <ArrowUpRight className="h-3.5 w-3.5 text-slate-400" />
            </button>
          </div>
        </div>

      </div>

      {/* Recent Payments Table */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div>
            <h3 className="font-bold text-slate-900 dark:text-white text-sm">Derniers Encaissements Reçus</h3>
            <p className="text-xs text-slate-500">Historique récent des versements scolaires</p>
          </div>
          <button
            onClick={() => onNavigate('payments')}
            className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline"
          >
            Voir toute la comptabilité
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left text-slate-700 dark:text-slate-300">
            <thead className="bg-slate-50 dark:bg-slate-800/60 uppercase text-[10px] text-slate-500 font-bold">
              <tr>
                <th className="p-3">N° Reçu</th>
                <th className="p-3">Élève</th>
                <th className="p-3">Type</th>
                <th className="p-3">Mode</th>
                <th className="p-3">Montant Versé</th>
                <th className="p-3">Solde Restant</th>
                <th className="p-3">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {payments.slice(0, 5).map(p => {
                const std = students.find(s => s.id === p.studentId);
                return (
                  <tr key={p.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                    <td className="p-3 font-bold text-blue-600">{p.receiptNumber}</td>
                    <td className="p-3 font-bold text-slate-900 dark:text-white">
                      {std ? `${std.lastName} ${std.firstName}` : 'N/A'}
                    </td>
                    <td className="p-3">{p.paymentType}</td>
                    <td className="p-3">{p.paymentMethod}</td>
                    <td className="p-3 font-black text-emerald-600">
                      {p.amountPaid.toLocaleString()} {settings.currency}
                    </td>
                    <td className="p-3 font-bold text-amber-600">
                      {p.remainingBalance.toLocaleString()} {settings.currency}
                    </td>
                    <td className="p-3 text-slate-500">{p.date}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
