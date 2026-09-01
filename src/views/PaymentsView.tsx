import React, { useState } from 'react';
import { useApp } from '../lib/store';
import { Payment, Student } from '../types';
import { AddPaymentModal } from '../components/modals/AddPaymentModal';
import { PrintReceiptModal } from '../components/modals/PrintReceiptModal';
import { SendPaymentRemindersModal } from '../components/modals/SendPaymentRemindersModal';
import { AddStudentModal } from '../components/modals/AddStudentModal';
import { 
  CreditCard, 
  Plus, 
  Printer, 
  Search, 
  Bell, 
  Filter, 
  UserCheck, 
  Phone, 
  DollarSign, 
  Layers, 
  UserPlus, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Send,
  Zap
} from 'lucide-react';

interface PaymentsViewProps {
  onNavigate?: (view: string) => void;
}

export const PaymentsView: React.FC<PaymentsViewProps> = ({ onNavigate }) => {
  const { payments, students, classes, settings } = useApp();

  const [activeTab, setActiveTab] = useState<'CLASS_STUDENTS' | 'RECEIPTS_LOG'>('CLASS_STUDENTS');
  const [selectedClassId, setSelectedClassId] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [studentForPayment, setStudentForPayment] = useState<string | undefined>(undefined);
  const [showRemindersModal, setShowRemindersModal] = useState(false);
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [selectedPaymentForReceipt, setSelectedPaymentForReceipt] = useState<Payment | null>(null);

  // Filter students by selected class and search
  const filteredStudents = students.filter(std => {
    const matchesClass = selectedClassId === 'ALL' || std.classId === selectedClassId;
    const searchLow = searchTerm.toLowerCase();
    const matchesSearch = 
      std.firstName.toLowerCase().includes(searchLow) ||
      std.lastName.toLowerCase().includes(searchLow) ||
      std.parentPhone.includes(searchLow) ||
      std.registrationNumber.toLowerCase().includes(searchLow);
    return matchesClass && matchesSearch;
  });

  // Filter payments for receipt tab
  const filteredPayments = payments.filter(p => {
    const std = students.find(s => s.id === p.studentId);
    const searchLow = searchTerm.toLowerCase();
    const matchesClass = selectedClassId === 'ALL' || (std && std.classId === selectedClassId);
    const matchesSearch = 
      p.receiptNumber.toLowerCase().includes(searchLow) ||
      (std && (std.firstName.toLowerCase().includes(searchLow) || std.lastName.toLowerCase().includes(searchLow)));
    return matchesClass && matchesSearch;
  });

  // Calculate totals
  const totalCollectedInSchool = payments.reduce((acc, p) => acc + p.amountPaid, 0);

  // Get selected class details
  const selectedClassObj = classes.find(c => c.id === selectedClassId);

  // Helper to calculate student's payment balance
  const getStudentPaymentStats = (std: Student) => {
    const cls = classes.find(c => c.id === std.classId);
    const totalTuition = cls?.tuitionFee || 450000;
    const stdPayments = payments.filter(p => p.studentId === std.id);
    const paid = stdPayments.reduce((acc, p) => acc + p.amountPaid, 0);
    const balance = Math.max(0, totalTuition - paid);
    
    let status: 'PAID' | 'PARTIAL' | 'UNPAID' = 'UNPAID';
    if (paid >= totalTuition) status = 'PAID';
    else if (paid > 0) status = 'PARTIAL';

    return { totalTuition, paid, balance, status };
  };

  const handleOpenPaymentForStudent = (studentId: string) => {
    setStudentForPayment(studentId);
    setShowAddModal(true);
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <div className="flex items-center space-x-2">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
              <CreditCard className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">
                Comptabilité & Caisse de Scolarité
              </h2>
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400">
                Choix des classes & Suivi individuel des versements
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          {onNavigate && (
            <button
              type="button"
              onClick={() => onNavigate('subscriptions')}
              className="px-3.5 py-2.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-500/30 font-black text-xs flex items-center space-x-2 shadow-sm cursor-pointer transition-all"
            >
              <Zap className="h-4 w-4 text-amber-500" />
              <span>Licence & Abonnements</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setShowAddStudentModal(true)}
            className="px-3.5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs flex items-center space-x-2 shadow-sm cursor-pointer transition-all"
          >
            <UserPlus className="h-4 w-4" />
            <span>Inscrire Élève (5 infos)</span>
          </button>

          <button
            type="button"
            onClick={() => setShowRemindersModal(true)}
            className="px-3.5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-black text-xs flex items-center space-x-2 shadow-sm cursor-pointer transition-all"
          >
            <Bell className="h-4 w-4" />
            <span>Rappels SMS Parents</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setStudentForPayment(undefined);
              setShowAddModal(true);
            }}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs sm:text-sm flex items-center space-x-2 shadow-lg shadow-emerald-600/20 cursor-pointer transition-all transform hover:scale-[1.01]"
          >
            <Plus className="h-4 w-4" />
            <span>Encaisser Paiement</span>
          </button>
        </div>
      </div>

      {/* Class Selection Toolbar */}
      <div className="p-4 rounded-2xl bg-slate-900 text-white shadow-lg space-y-3">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-2">
            <Layers className="h-5 w-5 text-amber-400" />
            <span className="font-black text-sm uppercase tracking-wide">Choisir une Classe / Niveau :</span>
          </div>
          
          <div className="text-xs text-slate-300 font-bold flex items-center space-x-3">
            <span>Élèves affichés : <strong className="text-emerald-400">{filteredStudents.length}</strong></span>
            <span>•</span>
            <span>Total Caisse École : <strong className="text-emerald-400">{totalCollectedInSchool.toLocaleString()} {settings.currency}</strong></span>
          </div>
        </div>

        {/* Scrollable Class Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <button
            type="button"
            onClick={() => setSelectedClassId('ALL')}
            className={`px-4 py-2 rounded-xl text-xs font-black shrink-0 transition-all cursor-pointer flex items-center space-x-1.5 ${
              selectedClassId === 'ALL'
                ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-400/20 scale-[1.02]'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <span>🏫 Toutes les Classes</span>
            <span className="ml-1.5 px-2 py-0.5 rounded-full bg-slate-950/30 text-[10px]">
              {students.length}
            </span>
          </button>

          {classes.map(cls => {
            const classStudentCount = students.filter(s => s.classId === cls.id).length;
            const isSelected = selectedClassId === cls.id;
            return (
              <button
                key={cls.id}
                type="button"
                onClick={() => setSelectedClassId(cls.id)}
                className={`px-4 py-2 rounded-xl text-xs font-black shrink-0 transition-all cursor-pointer flex items-center space-x-1.5 ${
                  isSelected
                    ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20 scale-[1.02]'
                    : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <span>{cls.name}</span>
                <span className={`ml-1 px-2 py-0.5 rounded-full text-[10px] ${isSelected ? 'bg-slate-950/30 text-slate-950 font-bold' : 'bg-slate-900 text-slate-400'}`}>
                  {classStudentCount}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main View Tabs & Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Navigation Tabs */}
        <div className="flex items-center space-x-1 p-1 rounded-xl bg-slate-200/80 dark:bg-slate-800/80 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setActiveTab('CLASS_STUDENTS')}
            className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-xs font-black transition-all cursor-pointer flex items-center justify-center space-x-2 ${
              activeTab === 'CLASS_STUDENTS'
                ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <UserCheck className="h-4 w-4" />
            <span>Suivi des Élèves ({selectedClassObj ? selectedClassObj.name : 'Toutes Classes'})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('RECEIPTS_LOG')}
            className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-xs font-black transition-all cursor-pointer flex items-center justify-center space-x-2 ${
              activeTab === 'RECEIPTS_LOG'
                ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Printer className="h-4 w-4" />
            <span>Historique Reçus de Caisse</span>
          </button>
        </div>

        {/* Search Field */}
        <div className="w-full sm:w-72 relative">
          <Search className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Rechercher élève, parent, reçu..."
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
          />
        </div>
      </div>

      {/* TAB 1: Class Student Register View */}
      {activeTab === 'CLASS_STUDENTS' && (
        <div className="space-y-4">
          
          {/* Active Class Info Banner */}
          {selectedClassObj && (
            <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-md">
              <div>
                <span className="text-[10px] uppercase font-bold text-emerald-400 tracking-widest">Classe sélectionnée</span>
                <h3 className="text-lg font-black">{selectedClassObj.name} — Level {selectedClassObj.level}</h3>
                <p className="text-xs text-slate-300">
                  Frais de scolarité fixés : <strong className="text-amber-300">{selectedClassObj.tuitionFee.toLocaleString()} {settings.currency}</strong> par élève.
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setShowAddStudentModal(true)}
                  className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs flex items-center space-x-1.5 transition-colors cursor-pointer border border-white/20"
                >
                  <UserPlus className="h-3.5 w-3.5 text-emerald-400" />
                  <span>Ajouter Élève dans {selectedClassObj.name}</span>
                </button>
              </div>
            </div>
          )}

          {/* Student Cards List */}
          {filteredStudents.length === 0 ? (
            <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
              <UserCheck className="h-10 w-10 text-slate-400 mx-auto" />
              <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                Aucun élève trouvé dans cette classe.
              </p>
              <button
                onClick={() => setShowAddStudentModal(true)}
                className="px-4 py-2 rounded-xl bg-blue-600 text-white font-bold text-xs"
              >
                Inscrire un premier élève
              </button>
            </div>
          ) : (
            <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left text-slate-700 dark:text-slate-300">
                  <thead className="bg-slate-100 dark:bg-slate-800/80 uppercase text-[10px] text-slate-600 dark:text-slate-400 font-black border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="p-3.5">Élève & Matricule</th>
                      <th className="p-3.5">Classe</th>
                      <th className="p-3.5">Sexe</th>
                      <th className="p-3.5">Téléphone Parent</th>
                      <th className="p-3.5 text-right">Scolarité Due</th>
                      <th className="p-3.5 text-right">Déjà Versé</th>
                      <th className="p-3.5 text-right">Reste à Payer</th>
                      <th className="p-3.5 text-center">Statut Caisse</th>
                      <th className="p-3.5 text-center">Action Caisse</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                    {filteredStudents.map(std => {
                      const cls = classes.find(c => c.id === std.classId);
                      const { totalTuition, paid, balance, status } = getStudentPaymentStats(std);

                      return (
                        <tr key={std.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors">
                          {/* Student identity */}
                          <td className="p-3.5">
                            <div className="flex items-center space-x-3">
                              <img
                                src={std.photoUrl}
                                alt={std.firstName}
                                className="h-9 w-9 rounded-full object-cover border border-slate-200 dark:border-slate-700 shrink-0"
                              />
                              <div>
                                <p className="font-black text-slate-900 dark:text-white uppercase text-xs">
                                  {std.lastName} {std.firstName}
                                </p>
                                <p className="text-[10px] font-mono text-slate-400">
                                  Matricule: {std.registrationNumber}
                                </p>
                              </div>
                            </div>
                          </td>

                          {/* Class */}
                          <td className="p-3.5 font-bold text-slate-800 dark:text-slate-200">
                            <span className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-black">
                              {cls?.name || 'Non affecté'}
                            </span>
                          </td>

                          {/* Gender */}
                          <td className="p-3.5 font-bold">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                              std.gender === 'M' 
                                ? 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300' 
                                : 'bg-pink-100 text-pink-700 dark:bg-pink-950 dark:text-pink-300'
                            }`}>
                              {std.gender === 'M' ? '👨 Garçon' : '👩 Fille'}
                            </span>
                          </td>

                          {/* Parent phone */}
                          <td className="p-3.5">
                            <a 
                              href={`tel:${std.parentPhone}`}
                              className="font-extrabold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center space-x-1"
                            >
                              <Phone className="h-3 w-3 shrink-0" />
                              <span>{std.parentPhone}</span>
                            </a>
                            <p className="text-[10px] text-slate-400">{std.parentName}</p>
                          </td>

                          {/* Total Tuition */}
                          <td className="p-3.5 text-right font-black text-slate-900 dark:text-white">
                            {totalTuition.toLocaleString()} {settings.currency}
                          </td>

                          {/* Paid */}
                          <td className="p-3.5 text-right font-black text-emerald-600 dark:text-emerald-400">
                            {paid.toLocaleString()} {settings.currency}
                          </td>

                          {/* Balance */}
                          <td className={`p-3.5 text-right font-black ${
                            balance === 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                          }`}>
                            {balance.toLocaleString()} {settings.currency}
                          </td>

                          {/* Status badge */}
                          <td className="p-3.5 text-center">
                            {status === 'PAID' && (
                              <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 text-[10px] font-black">
                                <CheckCircle2 className="h-3 w-3" />
                                <span>RÉGLÉ (100%)</span>
                              </span>
                            )}
                            {status === 'PARTIAL' && (
                              <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 text-[10px] font-black">
                                <Clock className="h-3 w-3" />
                                <span>ACOMPTE VERSÉ</span>
                              </span>
                            )}
                            {status === 'UNPAID' && (
                              <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 text-[10px] font-black">
                                <AlertCircle className="h-3 w-3" />
                                <span>NON PAYÉ (0%)</span>
                              </span>
                            )}
                          </td>

                          {/* Quick Payment Action */}
                          <td className="p-3.5 text-center">
                            <button
                              type="button"
                              onClick={() => handleOpenPaymentForStudent(std.id)}
                              className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs shadow-sm flex items-center justify-center space-x-1.5 mx-auto cursor-pointer transition-transform active:scale-95"
                            >
                              <DollarSign className="h-3.5 w-3.5" />
                              <span>Encaisser</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>
      )}

      {/* TAB 2: Receipts Log Table */}
      {activeTab === 'RECEIPTS_LOG' && (
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <table className="w-full text-xs text-left text-slate-700 dark:text-slate-300">
            <thead className="bg-slate-100 dark:bg-slate-800/80 uppercase text-[10px] text-slate-600 dark:text-slate-400 font-black border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="p-3.5">N° Reçu</th>
                <th className="p-3.5">Élève</th>
                <th className="p-3.5">Classe</th>
                <th className="p-3.5">Motif</th>
                <th className="p-3.5">Mode</th>
                <th className="p-3.5 text-right">Montant Versé</th>
                <th className="p-3.5 text-right">Solde Dû</th>
                <th className="p-3.5">Date</th>
                <th className="p-3.5 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-slate-400">
                    Aucun reçu de paiement trouvé.
                  </td>
                </tr>
              ) : (
                filteredPayments.map(p => {
                  const std = students.find(s => s.id === p.studentId);
                  const cls = classes.find(c => c.id === std?.classId);
                  return (
                    <tr key={p.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                      <td className="p-3.5 font-black text-blue-600">{p.receiptNumber}</td>
                      <td className="p-3.5 font-extrabold text-slate-900 dark:text-white uppercase">
                        {std ? `${std.lastName} ${std.firstName}` : 'Élève Inconnu'}
                      </td>
                      <td className="p-3.5 font-bold text-slate-500">
                        {cls?.name || 'N/A'}
                      </td>
                      <td className="p-3.5 font-semibold">{p.paymentType}</td>
                      <td className="p-3.5 font-medium">{p.paymentMethod}</td>
                      <td className="p-3.5 text-right font-black text-emerald-600 text-sm">
                        {p.amountPaid.toLocaleString()} {settings.currency}
                      </td>
                      <td className={`p-3.5 text-right font-bold ${p.remainingBalance === 0 ? 'text-emerald-600' : 'text-amber-600'}`}>
                        {p.remainingBalance.toLocaleString()} {settings.currency}
                      </td>
                      <td className="p-3.5 text-slate-500">{p.date}</td>
                      <td className="p-3.5 text-center">
                        <button
                          type="button"
                          onClick={() => setSelectedPaymentForReceipt(p)}
                          className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 hover:bg-emerald-100 transition-colors cursor-pointer"
                          title="Imprimer le Reçu"
                        >
                          <Printer className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Modals */}
      <AddPaymentModal
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          setStudentForPayment(undefined);
        }}
        initialStudentId={studentForPayment}
        initialClassId={selectedClassId !== 'ALL' ? selectedClassId : undefined}
      />

      <AddStudentModal
        isOpen={showAddStudentModal}
        onClose={() => setShowAddStudentModal(false)}
        initialClassId={selectedClassId !== 'ALL' ? selectedClassId : undefined}
      />

      <SendPaymentRemindersModal
        isOpen={showRemindersModal}
        onClose={() => setShowRemindersModal(false)}
      />

      {selectedPaymentForReceipt && (
        <PrintReceiptModal
          isOpen={!!selectedPaymentForReceipt}
          onClose={() => setSelectedPaymentForReceipt(null)}
          payment={selectedPaymentForReceipt}
          student={students.find(s => s.id === selectedPaymentForReceipt.studentId) || students[0]}
        />
      )}

    </div>
  );
};

