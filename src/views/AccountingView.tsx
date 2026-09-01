import React, { useState, useMemo } from 'react';
import { useApp } from '../lib/store';
import { Student, Payment, SchoolClass } from '../types';
import { AIReminderModal } from '../components/modals/AIReminderModal';
import { SendPaymentRemindersModal } from '../components/modals/SendPaymentRemindersModal';
import { AddPaymentModal } from '../components/modals/AddPaymentModal';
import { PrintReceiptModal } from '../components/modals/PrintReceiptModal';
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  Plus,
  DollarSign,
  Calendar,
  Bell,
  Sparkles,
  MessageCircle,
  Search,
  Filter,
  AlertTriangle,
  CheckCircle2,
  Send,
  Users,
  ShieldAlert,
  ArrowRight,
  GraduationCap,
  Layers,
  Printer,
  ChevronRight,
  Eye,
  CreditCard,
  Phone,
  BarChart3,
  PieChart,
  HelpCircle,
  FileSpreadsheet,
  CheckCircle,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Zap
} from 'lucide-react';

interface AccountingViewProps {
  onNavigate?: (view: string) => void;
}

export const AccountingView: React.FC<AccountingViewProps> = ({ onNavigate }) => {
  const { payments, expenses, students, classes, addExpense, settings, currentSchool, addPayment } = useApp();

  // Active Main Tab: 'CLASSES' (Étude par classe), 'TRANCHES' (Relances tranches), 'TRESO' (Trésorerie globale)
  const [activeTab, setActiveTab] = useState<'CLASSES' | 'TRANCHES' | 'TRESO'>('CLASSES');

  // Selected Class for In-depth Case Study in 'CLASSES' tab
  const [selectedClassIdForStudy, setSelectedClassIdForStudy] = useState<string>('ALL');
  const [classStudyStudentFilter, setClassStudyStudentFilter] = useState<'ALL' | 'UNPAID' | 'PARTIAL' | 'PAID'>('ALL');
  const [classStudySearch, setClassStudySearch] = useState<string>('');

  // Modals State
  const [showAddPaymentModal, setShowAddPaymentModal] = useState<boolean>(false);
  const [paymentStudentId, setPaymentStudentId] = useState<string | undefined>(undefined);
  const [selectedPaymentForReceipt, setSelectedPaymentForReceipt] = useState<Payment | null>(null);

  // Expenses State
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<'SALAIRES' | 'FOURNITURES' | 'EAU_ELECTRICITE' | 'CARBURANT' | 'MAINTENANCE' | 'AUTRES'>('SALAIRES');
  const [amount, setAmount] = useState('250000');

  // Tranche Configuration & Filters
  const [selectedTranche, setSelectedTranche] = useState<1 | 2 | 3>(1);
  const [tranche1Amount, setTranche1Amount] = useState<number>(30000);
  const [tranche2Amount, setTranche2Amount] = useState<number>(30000);
  const [tranche3Amount, setTranche3Amount] = useState<number>(20000);
  const [trancheClassFilter, setTrancheClassFilter] = useState<string>('ALL');

  const tranche1DueDate = "30 Novembre";
  const tranche2DueDate = "28 Février";
  const tranche3DueDate = "31 Mai";

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'UNPAID_ONLY' | 'PAID_ONLY'>('UNPAID_ONLY');

  // Single AI Reminder Modal State
  const [selectedStudentForAI, setSelectedStudentForAI] = useState<{
    student: Student;
    trancheName: string;
    trancheAmountDue: number;
    amountPaid: number;
    remainingBalance: number;
    dueDate: string;
  } | null>(null);

  // Batch Reminders Modal
  const [showBatchRemindersModal, setShowBatchRemindersModal] = useState(false);

  // ----------------------------------------------------
  // Financial Calculations & Class-by-Class Accounting Engine
  // ----------------------------------------------------
  const totalIncome = payments.reduce((acc, p) => acc + p.amountPaid, 0);
  const totalExpense = expenses.reduce((acc, e) => acc + e.amount, 0);
  const netCash = totalIncome - totalExpense;

  // Student Payments Map
  const studentPaymentsMap = useMemo(() => {
    const map: { [studentId: string]: number } = {};
    payments.forEach(p => {
      map[p.studentId] = (map[p.studentId] || 0) + p.amountPaid;
    });
    return map;
  }, [payments]);

  // Comprehensive Class-by-Class Accounting Statistics
  const classAccountingStats = useMemo(() => {
    return classes.map(cls => {
      const classStudents = students.filter(s => s.classId === cls.id);
      const studentCount = classStudents.length;
      const unitTuition = cls.tuitionFee || 450000;
      const totalExpectedTuition = studentCount * unitTuition;

      let totalCollected = 0;
      let fullyPaidCount = 0;
      let partialPaidCount = 0;
      let unpaidCount = 0;

      const studentDetails = classStudents.map(std => {
        const paidSoFar = studentPaymentsMap[std.id] || 0;
        const remaining = Math.max(0, unitTuition - paidSoFar);
        const recoveryRate = unitTuition > 0 ? Math.min(100, Math.round((paidSoFar / unitTuition) * 100)) : 0;
        
        let status: 'PAID' | 'PARTIAL' | 'UNPAID' = 'UNPAID';
        if (paidSoFar >= unitTuition) {
          status = 'PAID';
          fullyPaidCount++;
        } else if (paidSoFar > 0) {
          status = 'PARTIAL';
          partialPaidCount++;
        } else {
          status = 'UNPAID';
          unpaidCount++;
        }

        totalCollected += paidSoFar;

        // Tranches breakdown for this student
        const t1Target = tranche1Amount;
        const t2Target = tranche1Amount + tranche2Amount;
        const t3Target = tranche1Amount + tranche2Amount + tranche3Amount;

        const t1Remaining = Math.max(0, t1Target - paidSoFar);
        const t2Remaining = Math.max(0, t2Target - paidSoFar);
        const t3Remaining = Math.max(0, t3Target - paidSoFar);

        // Get student's payments list
        const studentPayments = payments.filter(p => p.studentId === std.id);
        const lastPayment = studentPayments.length > 0 ? studentPayments[studentPayments.length - 1] : null;

        return {
          student: std,
          unitTuition,
          paidSoFar,
          remaining,
          recoveryRate,
          status,
          t1Remaining,
          t2Remaining,
          t3Remaining,
          studentPayments,
          lastPayment
        };
      });

      const totalRemaining = Math.max(0, totalExpectedTuition - totalCollected);
      const classRecoveryRate = totalExpectedTuition > 0 ? Math.min(100, Math.round((totalCollected / totalExpectedTuition) * 100)) : 0;

      // Class Tranche totals
      const classT1Due = studentCount * tranche1Amount;
      const classT2Due = studentCount * (tranche1Amount + tranche2Amount);
      const classT3Due = studentCount * (tranche1Amount + tranche2Amount + tranche3Amount);

      return {
        classObj: cls,
        studentCount,
        unitTuition,
        totalExpectedTuition,
        totalCollected,
        totalRemaining,
        classRecoveryRate,
        fullyPaidCount,
        partialPaidCount,
        unpaidCount,
        studentDetails
      };
    });
  }, [classes, students, studentPaymentsMap, payments, tranche1Amount, tranche2Amount, tranche3Amount]);

  // Overall Global Summary across all classes
  const globalClassSummary = useMemo(() => {
    const totalStudents = students.length;
    const totalExpected = classAccountingStats.reduce((acc, c) => acc + c.totalExpectedTuition, 0);
    const totalCollected = classAccountingStats.reduce((acc, c) => acc + c.totalCollected, 0);
    const totalRemaining = Math.max(0, totalExpected - totalCollected);
    const globalRate = totalExpected > 0 ? Math.min(100, Math.round((totalCollected / totalExpected) * 100)) : 0;
    const totalFullyPaid = classAccountingStats.reduce((acc, c) => acc + c.fullyPaidCount, 0);
    const totalDebtors = totalStudents - totalFullyPaid;

    return {
      totalStudents,
      totalExpected,
      totalCollected,
      totalRemaining,
      globalRate,
      totalFullyPaid,
      totalDebtors
    };
  }, [students, classAccountingStats]);

  // Active Class Study Selected Details
  const activeClassStudy = useMemo(() => {
    if (selectedClassIdForStudy === 'ALL') return null;
    return classAccountingStats.find(c => c.classObj.id === selectedClassIdForStudy) || null;
  }, [classAccountingStats, selectedClassIdForStudy]);

  // Filtered Students for the Class Study View
  const filteredClassStudyStudents = useMemo(() => {
    let list = activeClassStudy ? activeClassStudy.studentDetails : classAccountingStats.flatMap(c => c.studentDetails);

    if (classStudyStudentFilter === 'PAID') {
      list = list.filter(item => item.status === 'PAID');
    } else if (classStudyStudentFilter === 'PARTIAL') {
      list = list.filter(item => item.status === 'PARTIAL');
    } else if (classStudyStudentFilter === 'UNPAID') {
      list = list.filter(item => item.status === 'UNPAID' || item.status === 'PARTIAL');
    }

    if (classStudySearch.trim()) {
      const searchLow = classStudySearch.toLowerCase();
      list = list.filter(item => {
        const s = item.student;
        return (
          s.firstName.toLowerCase().includes(searchLow) ||
          s.lastName.toLowerCase().includes(searchLow) ||
          s.registrationNumber.toLowerCase().includes(searchLow) ||
          s.parentName.toLowerCase().includes(searchLow) ||
          s.parentPhone.includes(searchLow)
        );
      });
    }

    return list;
  }, [activeClassStudy, classAccountingStats, classStudyStudentFilter, classStudySearch]);

  // Add Expense Handler
  const handleAddExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description) return;

    addExpense({
      category,
      amount: parseFloat(amount) || 0,
      description,
      date: new Date().toISOString().split('T')[0],
      recordedBy: "Comptabilité"
    });

    setDescription('');
    setShowAddExpense(false);
  };

  // Student Payment Analysis per Tranche with Class Filter
  const currentTrancheAmount = selectedTranche === 1 ? tranche1Amount : selectedTranche === 2 ? tranche2Amount : tranche3Amount;
  const currentTrancheName = selectedTranche === 1 ? "1ère Tranche (Sept. - Nov.)" : selectedTranche === 2 ? "2ème Tranche (Déc. - Fév.)" : "3ème Tranche (Mars - Mai)";
  const currentTrancheDueDate = selectedTranche === 1 ? tranche1DueDate : selectedTranche === 2 ? tranche2DueDate : tranche3DueDate;

  const studentAnalysis = students.map(std => {
    const totalPaidSoFar = studentPaymentsMap[std.id] || 0;
    
    // Evaluate status for the selected tranche
    let trancheTarget = currentTrancheAmount;
    if (selectedTranche === 2) trancheTarget = tranche1Amount + tranche2Amount;
    if (selectedTranche === 3) trancheTarget = tranche1Amount + tranche2Amount + tranche3Amount;

    const remainingForTranche = Math.max(0, trancheTarget - totalPaidSoFar);
    const isTranchePaid = remainingForTranche === 0;

    return {
      student: std,
      classId: std.classId,
      className: classes.find(c => c.id === std.classId)?.name || 'N/A',
      totalPaidSoFar,
      currentTrancheAmount,
      remainingForTranche,
      isTranchePaid
    };
  });

  const filteredStudentAnalysis = studentAnalysis.filter(item => {
    // Class filter
    if (trancheClassFilter !== 'ALL' && item.classId !== trancheClassFilter) {
      return false;
    }

    const std = item.student;
    const searchLow = searchTerm.toLowerCase();
    const matchesSearch =
      std.firstName.toLowerCase().includes(searchLow) ||
      std.lastName.toLowerCase().includes(searchLow) ||
      std.parentName.toLowerCase().includes(searchLow) ||
      std.parentPhone.includes(searchLow) ||
      item.className.toLowerCase().includes(searchLow);

    if (!matchesSearch) return false;

    if (statusFilter === 'UNPAID_ONLY') return item.remainingForTranche > 0;
    if (statusFilter === 'PAID_ONLY') return item.isTranchePaid;
    return true;
  });

  const totalDebtorsCount = studentAnalysis.filter(s => s.remainingForTranche > 0).length;
  const totalUnpaidForTranche = studentAnalysis.reduce((acc, s) => acc + s.remainingForTranche, 0);

  // Helper to open payment modal for specific student
  const handleOpenEncaissement = (studentId: string) => {
    setPaymentStudentId(studentId);
    setShowAddPaymentModal(true);
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center space-x-2">
            <div className="p-2.5 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <Wallet className="h-6 w-6" />
            </div>
            <div>
              <span>Comptabilité & Caisse de Scolarité</span>
              <p className="text-xs font-normal text-slate-500 dark:text-slate-400 mt-0.5">
                {currentSchool?.name || settings.schoolName} • Analyse comptable classe par classe, encaissements et trésorerie
              </p>
            </div>
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          {onNavigate && (
            <button
              type="button"
              onClick={() => onNavigate('subscriptions')}
              className="px-3.5 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-500/30 font-black text-xs flex items-center space-x-1.5 shadow-sm cursor-pointer transition-all"
            >
              <Zap className="h-4 w-4 text-amber-500" />
              <span>Licence & Abonnements</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              setPaymentStudentId(undefined);
              setShowAddPaymentModal(true);
            }}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs shadow-md shadow-emerald-600/20 flex items-center space-x-1.5 cursor-pointer transition-all hover:scale-105"
          >
            <Plus className="h-4 w-4" />
            <span>Encaisser un Versement (Par Classe)</span>
          </button>

          {/* Main Tab Switchers */}
          <div className="flex items-center p-1.5 bg-slate-100 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shrink-0">
            
            <button
              onClick={() => setActiveTab('CLASSES')}
              className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all flex items-center space-x-2 ${
                activeTab === 'CLASSES'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Layers className="h-4 w-4" />
              <span>📊 Étude par Classe</span>
            </button>

            <button
              onClick={() => setActiveTab('TRANCHES')}
              className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all flex items-center space-x-2 ${
                activeTab === 'TRANCHES'
                  ? 'bg-amber-500 text-white shadow-md shadow-amber-500/30'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Bell className="h-4 w-4" />
              <span>🔔 Relance Tranches</span>
              {totalDebtorsCount > 0 && (
                <span className="px-1.5 py-0.5 rounded-full bg-white text-amber-900 text-[10px] font-black">
                  {totalDebtorsCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('TRESO')}
              className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all flex items-center space-x-2 ${
                activeTab === 'TRESO'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <DollarSign className="h-4 w-4" />
              <span>💰 Trésorerie & Dépenses</span>
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: ÉTUDE COMPTABLE PAR CLASSE (CAS COMPTABLE DE CHAQUE CLASSE)       */}
      {/* ========================================================================= */}
      {activeTab === 'CLASSES' && (
        <div className="space-y-6 animate-in fade-in">
          
          {/* Top KPI Cards for Global Overview */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
              <p className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Classes Actives</p>
              <p className="text-xl font-black text-slate-900 dark:text-white mt-1 flex items-center space-x-1.5">
                <Layers className="h-5 w-5 text-indigo-500" />
                <span>{classes.length} classes</span>
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">{globalClassSummary.totalStudents} élèves inscrits</p>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
              <p className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Total Attendu (Scolarités)</p>
              <p className="text-xl font-black text-slate-900 dark:text-white mt-1">
                {globalClassSummary.totalExpected.toLocaleString()} <span className="text-xs text-slate-400 font-bold">{settings.currency}</span>
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">Budget annuel global</p>
            </div>

            <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 shadow-sm">
              <p className="text-[10px] font-black uppercase text-emerald-800 dark:text-emerald-400 tracking-wider flex items-center space-x-1">
                <ArrowDownRight className="h-3.5 w-3.5 text-emerald-600" />
                <span>Total Encaissé Caisse</span>
              </p>
              <p className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
                +{globalClassSummary.totalCollected.toLocaleString()} <span className="text-xs font-bold">{settings.currency}</span>
              </p>
              <p className="text-[11px] text-emerald-700 dark:text-emerald-500 font-bold mt-0.5">
                {globalClassSummary.totalFullyPaid} élèves soldés à 100%
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 shadow-sm">
              <p className="text-[10px] font-black uppercase text-rose-800 dark:text-rose-400 tracking-wider flex items-center space-x-1">
                <AlertTriangle className="h-3.5 w-3.5 text-rose-600" />
                <span>Total Créances Restantes</span>
              </p>
              <p className="text-xl font-black text-rose-600 dark:text-rose-400 mt-1">
                -{globalClassSummary.totalRemaining.toLocaleString()} <span className="text-xs font-bold">{settings.currency}</span>
              </p>
              <p className="text-[11px] text-rose-700 dark:text-rose-500 font-bold mt-0.5">
                {globalClassSummary.totalDebtors} élèves avec solde dû
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900 text-white shadow-lg col-span-2 lg:col-span-1 flex flex-col justify-between">
              <div>
                <p className="text-[10px] font-black uppercase text-amber-400 tracking-wider">Taux de Recouvrement</p>
                <div className="flex items-baseline space-x-2 mt-1">
                  <span className="text-2xl font-black text-amber-300">{globalClassSummary.globalRate}%</span>
                  <span className="text-xs text-slate-400">de l'école</span>
                </div>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-2 mt-2 overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-500 ${
                    globalClassSummary.globalRate >= 75 ? 'bg-emerald-500' : globalClassSummary.globalRate >= 45 ? 'bg-amber-500' : 'bg-rose-500'
                  }`}
                  style={{ width: `${globalClassSummary.globalRate}%` }}
                />
              </div>
            </div>
          </div>

          {/* Action Bar & Class Selector Tabs */}
          <div className="p-4 rounded-3xl bg-slate-900 text-white shadow-xl space-y-3">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <Layers className="h-5 w-5 text-amber-400" />
                <h3 className="font-black text-sm uppercase tracking-wide">
                  Sélectionnez une Classe pour Étudier son Cas Comptable :
                </h3>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setShowBatchRemindersModal(true)}
                  className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs flex items-center space-x-1.5 transition-all cursor-pointer"
                >
                  <Bell className="h-3.5 w-3.5" />
                  <span>Relance Scolarité Tous Débiteurs</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setPaymentStudentId(undefined);
                    setShowAddPaymentModal(true);
                  }}
                  className="px-3.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black text-xs flex items-center space-x-1.5 transition-all cursor-pointer"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Nouvel Encaissement</span>
                </button>
              </div>
            </div>

            {/* Horizontal Class Selector Badges */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
              <button
                type="button"
                onClick={() => setSelectedClassIdForStudy('ALL')}
                className={`px-4 py-2 rounded-xl text-xs font-black shrink-0 transition-all flex items-center space-x-2 ${
                  selectedClassIdForStudy === 'ALL'
                    ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 shadow-lg shadow-amber-500/20'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                <span>🌍 Vue d'Ensemble (Toutes les {classes.length} classes)</span>
              </button>

              {classAccountingStats.map(stat => (
                <button
                  key={stat.classObj.id}
                  type="button"
                  onClick={() => setSelectedClassIdForStudy(stat.classObj.id)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-extrabold shrink-0 transition-all flex items-center space-x-2 ${
                    selectedClassIdForStudy === stat.classObj.id
                      ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20 ring-2 ring-emerald-400'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  <span className="font-black">{stat.classObj.name}</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                    stat.classRecoveryRate >= 75 
                      ? 'bg-emerald-950/80 text-emerald-300' 
                      : stat.classRecoveryRate >= 45 
                      ? 'bg-amber-950/80 text-amber-300' 
                      : 'bg-rose-950/80 text-rose-300'
                  }`}>
                    {stat.classRecoveryRate}%
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* TABLE COMPARATIF DES CLASSES (VUE D'ENSEMBLE) */}
          {selectedClassIdForStudy === 'ALL' ? (
            <div className="space-y-4">
              
              <div className="flex items-center justify-between">
                <h3 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center space-x-2">
                  <BarChart3 className="h-4 w-4 text-emerald-600" />
                  <span>Tableau Comparatif & Bilan Comptable de Chaque Classe</span>
                </h3>
                <span className="text-xs text-slate-500">
                  Cliquez sur <strong className="text-emerald-600">"Étudier le Cas"</strong> pour ouvrir le registre nominatif d'une classe.
                </span>
              </div>

              <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left text-slate-700 dark:text-slate-300">
                    <thead className="bg-slate-100/80 dark:bg-slate-800/80 uppercase text-[10px] text-slate-500 font-black border-b border-slate-200 dark:border-slate-800">
                      <tr>
                        <th className="p-3.5">Classe & Niveau</th>
                        <th className="p-3.5 text-center">Effectif Élèves</th>
                        <th className="p-3.5 text-center">Soldés / Débiteurs</th>
                        <th className="p-3.5 text-right">Tarif Scolarité</th>
                        <th className="p-3.5 text-right">Total Attendu</th>
                        <th className="p-3.5 text-right">Total Encaissé Caisse</th>
                        <th className="p-3.5 text-right">Reste à Percevoir</th>
                        <th className="p-3.5 text-center">Taux Recouvrement</th>
                        <th className="p-3.5 text-center">Action Comptable</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                      {classAccountingStats.length === 0 ? (
                        <tr>
                          <td colSpan={9} className="p-8 text-center text-slate-400">
                            Aucune classe enregistrée dans cet établissement pour le moment.
                          </td>
                        </tr>
                      ) : (
                        classAccountingStats.map(stat => (
                          <tr key={stat.classObj.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                            
                            {/* Class Name & Section */}
                            <td className="p-3.5">
                              <div className="flex items-center space-x-2">
                                <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 font-black text-xs border border-indigo-200 dark:border-indigo-800">
                                  {stat.classObj.name}
                                </div>
                                <div>
                                  <p className="font-black text-slate-900 dark:text-white">{stat.classObj.name}</p>
                                  <p className="text-[10px] text-slate-400">Niveau : {stat.classObj.level || 'Général'}</p>
                                </div>
                              </div>
                            </td>

                            {/* Student Count */}
                            <td className="p-3.5 text-center">
                              <span className="font-extrabold text-slate-900 dark:text-white px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800">
                                {stat.studentCount} élèves
                              </span>
                            </td>

                            {/* Paid vs Debtor Count */}
                            <td className="p-3.5 text-center">
                              <div className="flex items-center justify-center space-x-1.5 text-[11px] font-bold">
                                <span className="text-emerald-600 dark:text-emerald-400">{stat.fullyPaidCount} soldés</span>
                                <span className="text-slate-300">/</span>
                                <span className="text-rose-600 dark:text-rose-400">{stat.studentCount - stat.fullyPaidCount} débiteurs</span>
                              </div>
                            </td>

                            {/* Unit Tuition */}
                            <td className="p-3.5 text-right font-mono font-bold text-slate-700 dark:text-slate-300">
                              {stat.unitTuition.toLocaleString()} {settings.currency}
                            </td>

                            {/* Expected */}
                            <td className="p-3.5 text-right font-mono font-black text-slate-900 dark:text-white">
                              {stat.totalExpectedTuition.toLocaleString()} {settings.currency}
                            </td>

                            {/* Collected */}
                            <td className="p-3.5 text-right font-mono font-black text-emerald-600 dark:text-emerald-400">
                              +{stat.totalCollected.toLocaleString()} {settings.currency}
                            </td>

                            {/* Remaining */}
                            <td className="p-3.5 text-right font-mono font-black text-rose-600 dark:text-rose-400">
                              {stat.totalRemaining > 0 ? `-${stat.totalRemaining.toLocaleString()} ${settings.currency}` : '0 FCFA'}
                            </td>

                            {/* Recovery Progress Bar */}
                            <td className="p-3.5 text-center">
                              <div className="w-28 mx-auto space-y-1">
                                <div className="flex items-center justify-between text-[10px] font-bold">
                                  <span className={stat.classRecoveryRate >= 75 ? 'text-emerald-600' : stat.classRecoveryRate >= 45 ? 'text-amber-600' : 'text-rose-600'}>
                                    {stat.classRecoveryRate}%
                                  </span>
                                  <span className="text-slate-400">{stat.studentCount} él.</span>
                                </div>
                                <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                                  <div
                                    className={`h-full rounded-full transition-all ${
                                      stat.classRecoveryRate >= 75 ? 'bg-emerald-500' : stat.classRecoveryRate >= 45 ? 'bg-amber-500' : 'bg-rose-500'
                                    }`}
                                    style={{ width: `${stat.classRecoveryRate}%` }}
                                  />
                                </div>
                              </div>
                            </td>

                            {/* Actions */}
                            <td className="p-3.5 text-center">
                              <button
                                type="button"
                                onClick={() => setSelectedClassIdForStudy(stat.classObj.id)}
                                className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[11px] flex items-center space-x-1 shadow-sm transition-all mx-auto cursor-pointer"
                              >
                                <span>Étudier le Cas</span>
                                <ArrowRight className="h-3.5 w-3.5" />
                              </button>
                            </td>

                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          ) : (
            /* DOSSIER & FICHE COMPTABLE DE LA CLASSE SÉLECTIONNÉE */
            activeClassStudy && (
              <div className="space-y-6">
                
                {/* Specific Class Header Card */}
                <div className="p-6 rounded-3xl bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white shadow-xl space-y-5">
                  <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-700/60 pb-4">
                    <div className="flex items-center space-x-3">
                      <div className="p-3 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        <GraduationCap className="h-7 w-7" />
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <h3 className="text-2xl font-black text-white">{activeClassStudy.classObj.name}</h3>
                          <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-extrabold text-xs border border-indigo-500/30">
                            Niveau {activeClassStudy.classObj.level || 'Général'}
                          </span>
                        </div>
                        <p className="text-xs text-slate-300 mt-0.5">
                          Dossier comptable complet de la classe • Effectif : <strong>{activeClassStudy.studentCount} élèves</strong>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        type="button"
                        onClick={() => setSelectedClassIdForStudy('ALL')}
                        className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs flex items-center space-x-1.5 transition-all cursor-pointer"
                      >
                        <ChevronRight className="h-4 w-4 rotate-180" />
                        <span>Retour aux Classes</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          const debtors = activeClassStudy.studentDetails.filter(s => s.remaining > 0);
                          if (debtors.length === 0) {
                            alert("Félicitations ! Tous les élèves de cette classe sont à jour de scolarité.");
                            return;
                          }
                          setShowBatchRemindersModal(true);
                        }}
                        className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs flex items-center space-x-1.5 shadow-md transition-all cursor-pointer"
                      >
                        <Bell className="h-4 w-4" />
                        <span>Relancer Débiteurs ({activeClassStudy.studentCount - activeClassStudy.fullyPaidCount})</span>
                      </button>
                    </div>
                  </div>

                  {/* Financial KPI Grid for this Class */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    
                    <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-1">
                      <span className="text-[10px] uppercase font-bold text-slate-400">Tarif Unitaire / Élève</span>
                      <p className="text-base font-black text-white">
                        {activeClassStudy.unitTuition.toLocaleString()} {settings.currency}
                      </p>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-1">
                      <span className="text-[10px] uppercase font-bold text-slate-400">Total Attendu Classe</span>
                      <p className="text-base font-black text-white">
                        {activeClassStudy.totalExpectedTuition.toLocaleString()} {settings.currency}
                      </p>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 space-y-1">
                      <span className="text-[10px] uppercase font-bold text-emerald-400">Encaissé Réel en Caisse</span>
                      <p className="text-base font-black text-emerald-400">
                        +{activeClassStudy.totalCollected.toLocaleString()} {settings.currency}
                      </p>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 space-y-1">
                      <span className="text-[10px] uppercase font-bold text-rose-400">Créance Restante</span>
                      <p className="text-base font-black text-rose-400">
                        -{activeClassStudy.totalRemaining.toLocaleString()} {settings.currency}
                      </p>
                    </div>

                  </div>

                  {/* Progress bar */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center text-xs font-bold">
                      <span className="text-slate-300">Progression du Recouvrement ({activeClassStudy.fullyPaidCount}/{activeClassStudy.studentCount} élèves totalement en règle)</span>
                      <span className="text-amber-400 font-black text-sm">{activeClassStudy.classRecoveryRate}% collecté</span>
                    </div>
                    <div className="w-full bg-slate-800 rounded-full h-3 overflow-hidden border border-slate-700">
                      <div
                        className={`h-full rounded-full transition-all ${
                          activeClassStudy.classRecoveryRate >= 75 ? 'bg-emerald-500' : activeClassStudy.classRecoveryRate >= 45 ? 'bg-amber-500' : 'bg-rose-500'
                        }`}
                        style={{ width: `${activeClassStudy.classRecoveryRate}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Filters & Search for Students of this Class */}
                <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                  <div className="flex items-center space-x-2 w-full sm:w-auto flex-1">
                    <Search className="h-4 w-4 text-slate-400 shrink-0" />
                    <input
                      type="text"
                      value={classStudySearch}
                      onChange={e => setClassStudySearch(e.target.value)}
                      placeholder={`Rechercher un élève ou parent dans ${activeClassStudy.classObj.name}...`}
                      className="w-full bg-transparent border-none focus:outline-none text-slate-900 dark:text-white placeholder-slate-400"
                    />
                  </div>

                  <div className="flex items-center space-x-2 shrink-0">
                    <Filter className="h-4 w-4 text-slate-400" />
                    
                    <button
                      type="button"
                      onClick={() => setClassStudyStudentFilter('ALL')}
                      className={`px-3 py-1.5 rounded-xl font-extrabold transition-all ${
                        classStudyStudentFilter === 'ALL'
                          ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      Tous ({activeClassStudy.studentCount})
                    </button>

                    <button
                      type="button"
                      onClick={() => setClassStudyStudentFilter('UNPAID')}
                      className={`px-3 py-1.5 rounded-xl font-extrabold transition-all ${
                        classStudyStudentFilter === 'UNPAID'
                          ? 'bg-rose-600 text-white shadow-sm'
                          : 'bg-rose-50 dark:bg-rose-950 text-rose-700 dark:text-rose-300'
                      }`}
                    >
                      ⚠️ Débiteurs ({activeClassStudy.studentCount - activeClassStudy.fullyPaidCount})
                    </button>

                    <button
                      type="button"
                      onClick={() => setClassStudyStudentFilter('PAID')}
                      className={`px-3 py-1.5 rounded-xl font-extrabold transition-all ${
                        classStudyStudentFilter === 'PAID'
                          ? 'bg-emerald-600 text-white shadow-sm'
                          : 'bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                      }`}
                    >
                      ✅ À Jour ({activeClassStudy.fullyPaidCount})
                    </button>
                  </div>
                </div>

                {/* NOMINATIVE LIST OF STUDENTS FOR THIS CLASS */}
                <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                  <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                    <h4 className="font-black text-xs sm:text-sm text-slate-900 dark:text-white flex items-center space-x-2">
                      <Users className="h-4 w-4 text-emerald-600" />
                      <span>Situation Individuelle des Élèves : {activeClassStudy.classObj.name}</span>
                    </h4>
                    <span className="text-[11px] font-bold text-slate-500">
                      {filteredClassStudyStudents.length} élève(s) affiché(s)
                    </span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left text-slate-700 dark:text-slate-300">
                      <thead className="bg-slate-100/70 dark:bg-slate-800 uppercase text-[10px] text-slate-500 font-black border-b border-slate-200 dark:border-slate-800">
                        <tr>
                          <th className="p-3.5">Matricule & Élève</th>
                          <th className="p-3.5">Parent & Contact</th>
                          <th className="p-3.5 text-right">Scolarité Exigée</th>
                          <th className="p-3.5 text-right">Déjà Versé</th>
                          <th className="p-3.5 text-right">Reste à Payer</th>
                          <th className="p-3.5 text-center">Statut</th>
                          <th className="p-3.5 text-center">Dernier Reçu</th>
                          <th className="p-3.5 text-center">Actions Caisse</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                        {filteredClassStudyStudents.length === 0 ? (
                          <tr>
                            <td colSpan={8} className="p-8 text-center text-slate-400">
                              Aucun élève ne correspond aux critères de filtre pour cette classe.
                            </td>
                          </tr>
                        ) : (
                          filteredClassStudyStudents.map(item => {
                            const std = item.student;
                            return (
                              <tr key={std.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                                
                                {/* Student Info */}
                                <td className="p-3.5">
                                  <p className="font-black text-slate-900 dark:text-white">
                                    {std.lastName} {std.firstName}
                                  </p>
                                  <p className="text-[10px] font-mono text-slate-400">
                                    Matricule : {std.registrationNumber}
                                  </p>
                                </td>

                                {/* Parent & Phone */}
                                <td className="p-3.5">
                                  <p className="font-bold text-slate-800 dark:text-slate-200">{std.parentName}</p>
                                  <a 
                                    href={`tel:${std.parentPhone}`}
                                    className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 flex items-center space-x-1 hover:underline"
                                  >
                                    <Phone className="h-3 w-3" />
                                    <span>{std.parentPhone}</span>
                                  </a>
                                </td>

                                {/* Total Fee */}
                                <td className="p-3.5 text-right font-mono font-bold text-slate-700 dark:text-slate-300">
                                  {item.unitTuition.toLocaleString()} {settings.currency}
                                </td>

                                {/* Paid */}
                                <td className="p-3.5 text-right font-mono font-black text-emerald-600 dark:text-emerald-400">
                                  {item.paidSoFar.toLocaleString()} {settings.currency}
                                </td>

                                {/* Remaining */}
                                <td className="p-3.5 text-right font-mono font-black">
                                  {item.remaining > 0 ? (
                                    <span className="text-rose-600 dark:text-rose-400">
                                      -{item.remaining.toLocaleString()} {settings.currency}
                                    </span>
                                  ) : (
                                    <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                                      0 {settings.currency}
                                    </span>
                                  )}
                                </td>

                                {/* Status */}
                                <td className="p-3.5 text-center">
                                  {item.status === 'PAID' ? (
                                    <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-black text-[10px] border border-emerald-300">
                                      <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                                      <span>Soldé (100%)</span>
                                    </span>
                                  ) : item.status === 'PARTIAL' ? (
                                    <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 font-black text-[10px] border border-amber-300">
                                      <Clock className="h-3 w-3 text-amber-600" />
                                      <span>Partiel ({item.recoveryRate}%)</span>
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 font-black text-[10px] border border-rose-300">
                                      <AlertTriangle className="h-3 w-3 text-rose-600" />
                                      <span>Non Payé (0%)</span>
                                    </span>
                                  )}
                                </td>

                                {/* Last Receipt / Payment */}
                                <td className="p-3.5 text-center">
                                  {item.lastPayment ? (
                                    <button
                                      type="button"
                                      onClick={() => setSelectedPaymentForReceipt(item.lastPayment)}
                                      className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-mono text-[10px] flex items-center space-x-1 mx-auto transition-all"
                                      title="Voir le reçu de caisse"
                                    >
                                      <Printer className="h-3 w-3 text-emerald-500" />
                                      <span>{item.lastPayment.receiptNumber}</span>
                                    </button>
                                  ) : (
                                    <span className="text-[10px] text-slate-400 italic">Aucun versement</span>
                                  )}
                                </td>

                                {/* Action Buttons */}
                                <td className="p-3.5 text-center">
                                  <div className="flex items-center justify-center space-x-1.5">
                                    
                                    {/* Encaissement Button */}
                                    <button
                                      type="button"
                                      onClick={() => handleOpenEncaissement(std.id)}
                                      className="px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[10px] flex items-center space-x-1 shadow-sm transition-all cursor-pointer"
                                      title="Encaisser un versement pour cet élève"
                                    >
                                      <CreditCard className="h-3 w-3" />
                                      <span>Encaisser</span>
                                    </button>

                                    {/* AI Reminder */}
                                    {item.remaining > 0 && (
                                      <button
                                        type="button"
                                        onClick={() =>
                                          setSelectedStudentForAI({
                                            student: std,
                                            trancheName: "Scolarité Globale",
                                            trancheAmountDue: item.unitTuition,
                                            amountPaid: item.paidSoFar,
                                            remainingBalance: item.remaining,
                                            dueDate: "Immédiate"
                                          })
                                        }
                                        className="px-2 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-[10px] flex items-center space-x-1 shadow-sm transition-all cursor-pointer"
                                        title="Générer une relance IA"
                                      >
                                        <Sparkles className="h-3 w-3" />
                                        <span>Relance IA</span>
                                      </button>
                                    )}

                                    {/* Direct WhatsApp */}
                                    {item.remaining > 0 && (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const cleanPhone = std.parentPhone.replace(/[^0-9]/g, '');
                                          const msg = encodeURIComponent(
                                            `RAPPEL SCOLARITÉ - ${currentSchool?.name || settings.schoolName}\nCher parent de ${std.firstName} ${std.lastName} (${activeClassStudy.classObj.name}), sur une scolarité totale de ${item.unitTuition.toLocaleString()} F, votre versement actuel est de ${item.paidSoFar.toLocaleString()} F. Il reste un solde débiteur de ${item.remaining.toLocaleString()} F. Merci de régulariser à la caisse de l'école ou par Mobile Money.`
                                          );
                                          window.open(`https://wa.me/${cleanPhone}?text=${msg}`, '_blank');
                                        }}
                                        className="p-1.5 rounded-xl bg-emerald-100 text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 transition-colors cursor-pointer"
                                        title="Envoyer message WhatsApp direct"
                                      >
                                        <MessageCircle className="h-3.5 w-3.5" />
                                      </button>
                                    )}

                                  </div>
                                </td>

                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

              </div>
            )
          )}

        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: SUIVI TRANCHES & RELANCES IA (AVEC FILTRE DE CLASSE)               */}
      {/* ========================================================================= */}
      {activeTab === 'TRANCHES' && (
        <div className="space-y-6 animate-in fade-in">
          
          {/* Tranches Definition & Configuration Banner */}
          <div className="p-5 rounded-3xl bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-slate-900/10 border border-amber-500/20 shadow-sm space-y-4">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 border-b border-amber-500/20 pb-3">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center space-x-2">
                  <Sparkles className="h-5 w-5 text-amber-500" />
                  <span>Configuration des Tranches & Échéancier de Scolarité</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Définissez les montants exigibles pour chaque tranche. L'IA calcule automatiquement les soldes et relance les parents avec précision.
                </p>
              </div>

              <button
                onClick={() => setShowBatchRemindersModal(true)}
                className="px-4 py-2.5 rounded-2xl bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-xs flex items-center space-x-2 shadow-lg shadow-amber-600/20 transition-all shrink-0 cursor-pointer"
              >
                <Bell className="h-4 w-4" />
                <span>🚀 Relancer Tous les Parents ({totalDebtorsCount})</span>
              </button>
            </div>

            {/* Tranche Amount Selectors */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              
              <div
                onClick={() => setSelectedTranche(1)}
                className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                  selectedTranche === 1
                    ? 'bg-amber-500 text-white border-amber-600 shadow-md ring-2 ring-amber-400'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-extrabold text-xs uppercase">1ère Tranche</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${selectedTranche === 1 ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
                    Sept. - Nov.
                  </span>
                </div>
                <div className="flex items-center space-x-1">
                  <input
                    type="number"
                    value={tranche1Amount}
                    onChange={e => setTranche1Amount(Number(e.target.value) || 0)}
                    onClick={e => e.stopPropagation()}
                    className={`w-28 font-black text-sm bg-transparent border-b focus:outline-none ${selectedTranche === 1 ? 'border-white text-white' : 'border-slate-300 text-amber-600'}`}
                  />
                  <span className="text-xs font-bold">{settings.currency}</span>
                </div>
                <p className={`text-[10px] mt-1 ${selectedTranche === 1 ? 'text-amber-100' : 'text-slate-400'}`}>
                  Échéance : {tranche1DueDate}
                </p>
              </div>

              <div
                onClick={() => setSelectedTranche(2)}
                className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                  selectedTranche === 2
                    ? 'bg-amber-500 text-white border-amber-600 shadow-md ring-2 ring-amber-400'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-extrabold text-xs uppercase">2ème Tranche</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${selectedTranche === 2 ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
                    Déc. - Fév.
                  </span>
                </div>
                <div className="flex items-center space-x-1">
                  <input
                    type="number"
                    value={tranche2Amount}
                    onChange={e => setTranche2Amount(Number(e.target.value) || 0)}
                    onClick={e => e.stopPropagation()}
                    className={`w-28 font-black text-sm bg-transparent border-b focus:outline-none ${selectedTranche === 2 ? 'border-white text-white' : 'border-slate-300 text-amber-600'}`}
                  />
                  <span className="text-xs font-bold">{settings.currency}</span>
                </div>
                <p className={`text-[10px] mt-1 ${selectedTranche === 2 ? 'text-amber-100' : 'text-slate-400'}`}>
                  Échéance : {tranche2DueDate}
                </p>
              </div>

              <div
                onClick={() => setSelectedTranche(3)}
                className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                  selectedTranche === 3
                    ? 'bg-amber-500 text-white border-amber-600 shadow-md ring-2 ring-amber-400'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-extrabold text-xs uppercase">3ème Tranche</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${selectedTranche === 3 ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
                    Mars - Mai
                  </span>
                </div>
                <div className="flex items-center space-x-1">
                  <input
                    type="number"
                    value={tranche3Amount}
                    onChange={e => setTranche3Amount(Number(e.target.value) || 0)}
                    onClick={e => e.stopPropagation()}
                    className={`w-28 font-black text-sm bg-transparent border-b focus:outline-none ${selectedTranche === 3 ? 'border-white text-white' : 'border-slate-300 text-amber-600'}`}
                  />
                  <span className="text-xs font-bold">{settings.currency}</span>
                </div>
                <p className={`text-[10px] mt-1 ${selectedTranche === 3 ? 'text-amber-100' : 'text-slate-400'}`}>
                  Échéance : {tranche3DueDate}
                </p>
              </div>

            </div>
          </div>

          {/* Metric Overview Cards for Active Tranche */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
              <p className="text-[10px] font-extrabold text-slate-500 uppercase">Tranche Sélectionnée</p>
              <p className="text-lg font-black text-amber-600 mt-0.5 truncate">{currentTrancheName}</p>
              <p className="text-[10px] text-slate-400">Target : {currentTrancheAmount.toLocaleString()} {settings.currency}</p>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
              <p className="text-[10px] font-extrabold text-slate-500 uppercase">Parents en Retard</p>
              <p className="text-2xl font-black text-rose-600 mt-0.5">{totalDebtorsCount} <span className="text-xs font-medium text-slate-400">/ {students.length} élèves</span></p>
              <p className="text-[10px] text-rose-500 font-bold">À relancer par l'IA</p>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
              <p className="text-[10px] font-extrabold text-slate-500 uppercase">Créances Restantes (Tranche)</p>
              <p className="text-2xl font-black text-rose-600 mt-0.5">
                {totalUnpaidForTranche.toLocaleString()} <span className="text-xs font-normal text-slate-500">{settings.currency}</span>
              </p>
              <p className="text-[10px] text-slate-400">Montant total manquant</p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900 text-white shadow-xl flex items-center justify-between">
              <div>
                <p className="text-[10px] font-extrabold text-amber-400 uppercase">Action Prioritaire IA</p>
                <p className="text-xs font-extrabold mt-0.5">Envoi SMS & WhatsApp</p>
                <p className="text-[10px] text-slate-400">Message personnalisé avec solde</p>
              </div>
              <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                <Sparkles className="h-5 w-5" />
              </div>
            </div>
          </div>

          {/* Search & Filter Tools WITH CLASS FILTER */}
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
            
            {/* Search Input */}
            <div className="flex items-center space-x-2 w-full md:w-auto flex-1">
              <Search className="h-4 w-4 text-slate-400 shrink-0" />
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Rechercher un élève, classe, nom de parent, téléphone..."
                className="w-full bg-transparent border-none focus:outline-none text-slate-900 dark:text-white placeholder-slate-400"
              />
            </div>

            {/* Class Filter Dropdown */}
            <div className="flex items-center space-x-2 shrink-0">
              <Layers className="h-4 w-4 text-slate-400" />
              <select
                value={trancheClassFilter}
                onChange={e => setTrancheClassFilter(e.target.value)}
                className="px-3 py-1.5 rounded-xl font-bold bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 outline-none"
              >
                <option value="ALL">Toutes les Classes ({classes.length})</option>
                {classes.map(cls => (
                  <option key={cls.id} value={cls.id}>
                    {cls.name} ({students.filter(s => s.classId === cls.id).length} él.)
                  </option>
                ))}
              </select>
            </div>

            {/* Status Filter Buttons */}
            <div className="flex items-center space-x-1.5 shrink-0">
              <button
                onClick={() => setStatusFilter('UNPAID_ONLY')}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
                  statusFilter === 'UNPAID_ONLY'
                    ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300 border border-rose-300'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                ⚠️ Retard
              </button>

              <button
                onClick={() => setStatusFilter('PAID_ONLY')}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
                  statusFilter === 'PAID_ONLY'
                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                ✅ À Jour
              </button>

              <button
                onClick={() => setStatusFilter('ALL')}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
                  statusFilter === 'ALL'
                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border border-blue-300'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                Tous ({students.length})
              </button>
            </div>
          </div>

          {/* Students Tranche Status Table */}
          <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <h3 className="font-extrabold text-xs sm:text-sm text-slate-900 dark:text-white flex items-center space-x-2">
                <span>Élèves & État d'Avancement : {currentTrancheName}</span>
              </h3>
              <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-2.5 py-1 rounded-full border border-amber-200 dark:border-amber-900/40">
                Limite : {currentTrancheDueDate}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left text-slate-700 dark:text-slate-300">
                <thead className="bg-slate-100/70 dark:bg-slate-800 uppercase text-[10px] text-slate-500 font-bold border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="p-3">Élève & Classe</th>
                    <th className="p-3">Parent & Contact</th>
                    <th className="p-3 text-right">Total Versé</th>
                    <th className="p-3 text-center">Statut Tranche</th>
                    <th className="p-3 text-right">Reste Dû</th>
                    <th className="p-3 text-center">Action Relance IA</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                  {filteredStudentAnalysis.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-400 font-medium">
                        Aucun élève trouvé pour les critères de recherche sélectionnés.
                      </td>
                    </tr>
                  ) : (
                    filteredStudentAnalysis.map(item => {
                      const std = item.student;
                      return (
                        <tr key={std.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                          <td className="p-3">
                            <p className="font-extrabold text-slate-900 dark:text-white">
                              {std.lastName} {std.firstName}
                            </p>
                            <p className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400">Classe : {item.className}</p>
                          </td>

                          <td className="p-3">
                            <p className="font-bold text-slate-800 dark:text-slate-200">{std.parentName}</p>
                            <p className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400">{std.parentPhone}</p>
                          </td>

                          <td className="p-3 text-right font-black text-slate-900 dark:text-white">
                            {item.totalPaidSoFar.toLocaleString()} {settings.currency}
                          </td>

                          <td className="p-3 text-center">
                            {item.isTranchePaid ? (
                              <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-extrabold text-[10px] border border-emerald-300">
                                <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                                <span>À Jour ({currentTrancheAmount.toLocaleString()} F)</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 font-extrabold text-[10px] border border-rose-300">
                                <AlertTriangle className="h-3 w-3 text-rose-600" />
                                <span>
                                  Incomplet ({item.totalPaidSoFar.toLocaleString()} / {currentTrancheAmount.toLocaleString()} F)
                                </span>
                              </span>
                            )}
                          </td>

                          <td className="p-3 text-right">
                            {item.remainingForTranche > 0 ? (
                              <span className="font-black text-rose-600 text-xs">
                                -{item.remainingForTranche.toLocaleString()} {settings.currency}
                              </span>
                            ) : (
                              <span className="font-bold text-emerald-600 text-xs">0 {settings.currency}</span>
                            )}
                          </td>

                          <td className="p-3 text-center">
                            {item.remainingForTranche > 0 ? (
                              <div className="flex items-center justify-center space-x-1.5">
                                <button
                                  onClick={() =>
                                    setSelectedStudentForAI({
                                      student: std,
                                      trancheName: currentTrancheName,
                                      trancheAmountDue: currentTrancheAmount,
                                      amountPaid: item.totalPaidSoFar,
                                      remainingBalance: item.remainingForTranche,
                                      dueDate: currentTrancheDueDate
                                    })
                                  }
                                  className="px-2.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-[11px] flex items-center space-x-1 shadow-sm transition-all cursor-pointer"
                                  title="Générer un message personnalisé via IA"
                                >
                                  <Sparkles className="h-3.5 w-3.5" />
                                  <span>Relance IA</span>
                                </button>

                                <button
                                  onClick={() => {
                                    const cleanPhone = std.parentPhone.replace(/[^0-9]/g, '');
                                    const msg = encodeURIComponent(
                                      `RAPPEL SCOLARITÉ - ${currentSchool?.name || settings.schoolName}\nCher parent de ${std.firstName} (${item.className}), au titre de la ${currentTrancheName} (${currentTrancheAmount.toLocaleString()} F), votre versement est de ${item.totalPaidSoFar.toLocaleString()} F. Il reste un solde de ${item.remainingForTranche.toLocaleString()} F à payer avant le ${currentTrancheDueDate}. Merci de régulariser à la caisse ou via Mobile Money.`
                                    );
                                    window.open(`https://wa.me/${cleanPhone}?text=${msg}`, '_blank');
                                  }}
                                  className="p-1.5 rounded-xl bg-emerald-100 text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 transition-colors cursor-pointer"
                                  title="Envoyer directement sur WhatsApp"
                                >
                                  <MessageCircle className="h-4 w-4" />
                                </button>
                              </div>
                            ) : (
                              <span className="text-[10px] text-slate-400 italic">Aucune relance requise</span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: TRÉSORERIE & DÉPENSES & BILAN CAISSE                              */}
      {/* ========================================================================= */}
      {activeTab === 'TRESO' && (
        <div className="space-y-6 animate-in fade-in">
          
          {/* Action Header Button */}
          <div className="flex justify-between items-center">
            <h3 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center space-x-2">
              <DollarSign className="h-4 w-4 text-emerald-600" />
              <span>Livre de Caisse & Trésorerie Générale</span>
            </h3>
            <button
              onClick={() => setShowAddExpense(!showAddExpense)}
              className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs sm:text-sm flex items-center space-x-2 shadow-md transition-all cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>Saisir une Dépense / Décaissement</span>
            </button>
          </div>

          {/* Cash summary */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
              <p className="text-xs font-bold text-slate-500 uppercase">Recettes Totales Collectées</p>
              <p className="text-2xl font-black text-emerald-600 mt-1">
                +{totalIncome.toLocaleString()} {settings.currency}
              </p>
              <p className="text-[11px] text-slate-400 mt-1">{payments.length} reçus de caisse émis</p>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
              <p className="text-xs font-bold text-slate-500 uppercase">Dépenses & Charges Enregistrées</p>
              <p className="text-2xl font-black text-rose-600 mt-1">
                -{totalExpense.toLocaleString()} {settings.currency}
              </p>
              <p className="text-[11px] text-slate-400 mt-1">{expenses.length} décaissements enregistrés</p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900 text-white shadow-xl">
              <p className="text-xs font-bold text-blue-300 uppercase">Solde Net de Caisse Actuel</p>
              <p className="text-2xl font-black text-amber-300 mt-1">
                {netCash.toLocaleString()} {settings.currency}
              </p>
              <p className="text-[11px] text-slate-400 mt-1">Disponible en caisse</p>
            </div>
          </div>

          {/* Ventilation des Recettes par Classe */}
          <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
            <h4 className="font-black text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center space-x-2">
              <Layers className="h-4 w-4 text-emerald-600" />
              <span>Ventilation des Encaissements de Scolarité par Classe</span>
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {classAccountingStats.map(c => (
                <div key={c.classObj.id} className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="font-black text-xs text-slate-900 dark:text-white">{c.classObj.name}</span>
                    <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">{c.classRecoveryRate}%</span>
                  </div>
                  <p className="text-sm font-black text-emerald-600 dark:text-emerald-400">
                    +{c.totalCollected.toLocaleString()} {settings.currency}
                  </p>
                  <p className="text-[10px] text-slate-400">
                    sur {c.totalExpectedTuition.toLocaleString()} F attendus
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Add Expense Form */}
          {showAddExpense && (
            <form onSubmit={handleAddExpense} className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-lg space-y-4 text-xs animate-in fade-in">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white border-b pb-2">Nouvelle Dépense / Décaissement</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <input
                  type="text"
                  required
                  placeholder="Libellé de la dépense (ex: Facture Électricité CIE)"
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
                <select
                  value={category}
                  onChange={e => setCategory(e.target.value as any)}
                  className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold"
                >
                  <option value="SALAIRES">Salaires & Honoraires</option>
                  <option value="FOURNITURES">Fournitures de Bureau & Pédagogiques</option>
                  <option value="EAU_ELECTRICITE">Eau, Électricité & Télécoms</option>
                  <option value="CARBURANT">Carburant Bus & Entretien</option>
                  <option value="MAINTENANCE">Maintenance & Bâtiments</option>
                  <option value="AUTRES">Autres Charges</option>
                </select>
                <input
                  type="number"
                  required
                  placeholder="Montant (FCFA)"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold text-rose-600"
                />
              </div>
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowAddExpense(false)}
                  className="px-3 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-rose-600 text-white font-bold shadow"
                >
                  Valider la Dépense
                </button>
              </div>
            </form>
          )}

          {/* Expenses Table */}
          <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <h3 className="p-4 font-bold text-sm text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800">
              Journal des Décaissements Enregistrés
            </h3>
            <table className="w-full text-xs text-left text-slate-700 dark:text-slate-300">
              <thead className="bg-slate-50 dark:bg-slate-800/80 uppercase text-[10px] text-slate-500 font-bold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="p-3">Catégorie</th>
                  <th className="p-3">Description</th>
                  <th className="p-3 text-right">Montant</th>
                  <th className="p-3">Auteur</th>
                  <th className="p-3">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                {expenses.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-6 text-center text-slate-400">
                      Aucune dépense enregistrée pour le moment.
                    </td>
                  </tr>
                ) : (
                  expenses.map(exp => (
                    <tr key={exp.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                      <td className="p-3 font-bold text-rose-600">{exp.category}</td>
                      <td className="p-3 font-semibold text-slate-900 dark:text-white">{exp.description}</td>
                      <td className="p-3 text-right font-black text-rose-600 text-sm">
                        -{exp.amount.toLocaleString()} {settings.currency}
                      </td>
                      <td className="p-3 text-slate-500">{exp.recordedBy}</td>
                      <td className="p-3 text-slate-500">{exp.date}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

        </div>
      )}

      {/* Individual AI Reminder Modal */}
      {selectedStudentForAI && (
        <AIReminderModal
          isOpen={!!selectedStudentForAI}
          onClose={() => setSelectedStudentForAI(null)}
          student={selectedStudentForAI.student}
          trancheName={selectedStudentForAI.trancheName}
          trancheAmountDue={selectedStudentForAI.trancheAmountDue}
          amountPaid={selectedStudentForAI.amountPaid}
          remainingBalance={selectedStudentForAI.remainingBalance}
          dueDate={selectedStudentForAI.dueDate}
        />
      )}

      {/* Batch Reminders Modal */}
      <SendPaymentRemindersModal
        isOpen={showBatchRemindersModal}
        onClose={() => setShowBatchRemindersModal(false)}
      />

      {/* Add Payment Modal (Direct Cashier Encaissement) */}
      <AddPaymentModal
        isOpen={showAddPaymentModal}
        onClose={() => {
          setShowAddPaymentModal(false);
          setPaymentStudentId(undefined);
        }}
        initialStudentId={paymentStudentId}
        initialClassId={selectedClassIdForStudy !== 'ALL' ? selectedClassIdForStudy : undefined}
      />

      {/* Print Receipt Modal */}
      {selectedPaymentForReceipt && (
        <PrintReceiptModal
          isOpen={!!selectedPaymentForReceipt}
          onClose={() => setSelectedPaymentForReceipt(null)}
          payment={selectedPaymentForReceipt}
          student={students.find(s => s.id === selectedPaymentForReceipt.studentId) || {
            id: selectedPaymentForReceipt.studentId,
            firstName: 'Élève',
            lastName: 'Inscrit',
            registrationNumber: 'MAT-000',
            classId: '',
            gender: 'M',
            dateOfBirth: '2010-01-01',
            parentName: 'Parent',
            parentPhone: '+229 00000000',
            photoUrl: '',
            address: '',
            enrollmentDate: '2025-09-01',
            status: 'ACTIVE'
          }}
        />
      )}

    </div>
  );
};

