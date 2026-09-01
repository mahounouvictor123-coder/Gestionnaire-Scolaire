import React, { useState, useMemo } from 'react';
import { useApp } from '../../lib/store';
import { 
  X, 
  CreditCard, 
  DollarSign, 
  School, 
  User, 
  Search, 
  CheckCircle2, 
  AlertCircle, 
  Layers, 
  Sparkles,
  ChevronRight,
  ArrowRight,
  GraduationCap
} from 'lucide-react';

interface AddPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialStudentId?: string;
  initialClassId?: string;
}

export const AddPaymentModal: React.FC<AddPaymentModalProps> = ({ 
  isOpen, 
  onClose, 
  initialStudentId,
  initialClassId 
}) => {
  const { students, classes, settings, addPayment, currentUser, payments } = useApp();

  const [selectedLevelFilter, setSelectedLevelFilter] = useState<'ALL' | 'MATERNELLE' | 'PRIMAIRE' | 'COLLEGE' | 'LYCEE' | 'G2'>('ALL');
  const [selectedClassId, setSelectedClassId] = useState<string>('ALL');
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [studentSearchTerm, setStudentSearchTerm] = useState<string>('');

  const [paymentType, setPaymentType] = useState<'INSCRIPTION' | 'SCOLARITE' | 'CANTINE' | 'TRANSPORT' | 'EXAMEN'>('SCOLARITE');
  const [paymentMethod, setPaymentMethod] = useState<'ESPECES' | 'CHEQUE' | 'VIREMENT' | 'MOBILE_MONEY'>('MOBILE_MONEY');
  const [amountPaid, setAmountPaid] = useState('150000');
  const [trimester, setTrimester] = useState<1 | 2 | 3>(1);
  const [notes, setNotes] = useState('Versement scolarité reçu à la caisse');

  // Initialize selection when modal opens
  React.useEffect(() => {
    if (!isOpen) return;

    if (initialStudentId) {
      const initStudent = students.find(s => s.id === initialStudentId);
      if (initStudent) {
        setSelectedClassId(initStudent.classId);
        setSelectedStudentId(initStudent.id);
      } else {
        setSelectedStudentId(initialStudentId);
      }
    } else if (initialClassId) {
      setSelectedClassId(initialClassId);
      const classStudents = students.filter(s => s.classId === initialClassId);
      if (classStudents.length > 0) {
        setSelectedStudentId(classStudents[0].id);
      } else {
        setSelectedStudentId('');
      }
    } else {
      if (classes.length > 0) {
        // Default to first class with students or first class
        const firstWithStudents = classes.find(c => students.some(s => s.classId === c.id)) || classes[0];
        setSelectedClassId(firstWithStudents.id);
        const classStds = students.filter(s => s.classId === firstWithStudents.id);
        setSelectedStudentId(classStds[0]?.id || students[0]?.id || '');
      }
    }
  }, [initialStudentId, initialClassId, isOpen, students, classes]);

  // Filter classes by level
  const filteredClasses = useMemo(() => {
    if (selectedLevelFilter === 'ALL') return classes;
    if (selectedLevelFilter === 'G2') {
      return classes.filter(c => 
        c.name.toLowerCase().includes('g2') || 
        (c.stream && c.stream.toLowerCase().includes('g2'))
      );
    }
    return classes.filter(c => c.level === selectedLevelFilter);
  }, [classes, selectedLevelFilter]);

  // Students in selected class
  const classStudents = useMemo(() => {
    let list = selectedClassId === 'ALL' 
      ? students 
      : students.filter(s => s.classId === selectedClassId);

    if (studentSearchTerm.trim()) {
      const search = studentSearchTerm.toLowerCase();
      list = list.filter(s => 
        s.firstName.toLowerCase().includes(search) ||
        s.lastName.toLowerCase().includes(search) ||
        s.registrationNumber.toLowerCase().includes(search) ||
        s.parentPhone.includes(search)
      );
    }
    return list;
  }, [students, selectedClassId, studentSearchTerm]);

  // Helper to get student balance and payments
  const getStudentBalanceInfo = (studentId: string) => {
    const student = students.find(s => s.id === studentId);
    if (!student) return { totalFee: 450000, paid: 0, remaining: 450000, status: 'UNPAID' };

    const cls = classes.find(c => c.id === student.classId);
    const totalFee = cls?.tuitionFee || 450000;
    const stdPayments = payments.filter(p => p.studentId === studentId);
    const paid = stdPayments.reduce((acc, p) => acc + p.amountPaid, 0);
    const remaining = Math.max(0, totalFee - paid);

    let status: 'PAID' | 'PARTIAL' | 'UNPAID' = 'UNPAID';
    if (paid >= totalFee) status = 'PAID';
    else if (paid > 0) status = 'PARTIAL';

    return { totalFee, paid, remaining, status };
  };

  const selectedStudent = students.find(s => s.id === selectedStudentId);
  const selectedStudentClass = classes.find(c => c.id === selectedStudent?.classId);
  const studentBalance = selectedStudent ? getStudentBalanceInfo(selectedStudent.id) : null;

  const totalTuition = studentBalance ? studentBalance.totalFee : (selectedStudentClass?.tuitionFee || 450000);
  const numAmount = parseFloat(amountPaid) || 0;
  const remBalance = studentBalance ? Math.max(0, studentBalance.remaining - numAmount) : Math.max(0, totalTuition - numAmount);

  // When changing class
  const handleSelectClass = (clsId: string) => {
    setSelectedClassId(clsId);
    const stds = clsId === 'ALL' ? students : students.filter(s => s.classId === clsId);
    if (stds.length > 0) {
      setSelectedStudentId(stds[0].id);
      const bal = getStudentBalanceInfo(stds[0].id);
      if (bal.remaining > 0) {
        setAmountPaid(bal.remaining.toString());
      }
    } else {
      setSelectedStudentId('');
    }
  };

  // When selecting student
  const handleSelectStudent = (std: any) => {
    setSelectedStudentId(std.id);
    const bal = getStudentBalanceInfo(std.id);
    if (bal.remaining > 0) {
      setAmountPaid(bal.remaining.toString());
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent || numAmount <= 0) {
      alert("Veuillez choisir un élève et saisir un montant valide.");
      return;
    }

    addPayment({
      studentId: selectedStudent.id,
      amountPaid: numAmount,
      totalFee: totalTuition,
      remainingBalance: remBalance,
      paymentType,
      paymentMethod,
      date: new Date().toISOString().split('T')[0],
      trimester,
      notes,
      recordedBy: currentUser.name || "Caisse & Comptabilité"
    });

    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-md overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-4xl my-6 overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Modal Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-emerald-800 via-teal-900 to-slate-900 text-white flex items-center justify-between shrink-0 shadow-md">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-2xl bg-white/10 border border-white/20 text-amber-300">
              <CreditCard className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-black text-base sm:text-lg tracking-tight">Guichet Caisse & Encaissement Scolarité</h3>
                <span className="px-2 py-0.5 rounded-md bg-emerald-500/30 text-emerald-300 text-[10px] font-black uppercase">
                  Direct
                </span>
              </div>
              <p className="text-xs text-slate-300 font-medium">
                Étape 1 : Choisir la classe &bull; Étape 2 : Choisir l'élève &bull; Étape 3 : Encaisser
              </p>
            </div>
          </div>
          <button 
            type="button"
            onClick={onClose} 
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-all cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Content - 2 Columns on Desktop */}
        <div className="grid grid-cols-1 lg:grid-cols-12 flex-1 overflow-hidden">
          
          {/* LEFT PANEL: Step 1 (Classes) & Step 2 (Students in Class) */}
          <div className="lg:col-span-7 p-4 sm:p-5 bg-slate-50 dark:bg-slate-950/60 border-b lg:border-b-0 lg:border-r border-slate-200 dark:border-slate-800 overflow-y-auto space-y-4">
            
            {/* STEP 1: CLASS PICKER */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-black uppercase tracking-wider text-slate-900 dark:text-white flex items-center space-x-1.5">
                  <span className="flex items-center justify-center w-5 h-5 rounded-full bg-emerald-600 text-white text-[10px] font-black">1</span>
                  <span>Choisir la Classe</span>
                </label>

                {/* Level Quick Filter Chips */}
                <div className="flex items-center gap-1 overflow-x-auto text-[10px] font-black">
                  {(['ALL', 'MATERNELLE', 'PRIMAIRE', 'COLLEGE', 'LYCEE', 'G2'] as const).map(lvl => (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => setSelectedLevelFilter(lvl)}
                      className={`px-2 py-1 rounded-lg transition-all cursor-pointer ${
                        selectedLevelFilter === lvl
                          ? 'bg-emerald-600 text-white shadow-sm'
                          : 'bg-slate-200/80 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      {lvl === 'ALL' ? 'Toutes' : lvl === 'G2' ? 'Série G2' : lvl.charAt(0) + lvl.slice(1).toLowerCase()}
                    </button>
                  ))}
                </div>
              </div>

              {/* Class Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-36 overflow-y-auto p-1 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-inner">
                <button
                  type="button"
                  onClick={() => handleSelectClass('ALL')}
                  className={`p-2 rounded-xl text-left border transition-all cursor-pointer flex flex-col justify-between ${
                    selectedClassId === 'ALL'
                      ? 'bg-emerald-500/10 border-emerald-500 text-emerald-900 dark:text-emerald-300 font-black shadow-sm ring-2 ring-emerald-500/30'
                      : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs font-black">
                    <span className="truncate">Toutes classes</span>
                    <span className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-[10px]">{students.length}</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-medium">Vue Globale</span>
                </button>

                {filteredClasses.map(c => {
                  const count = students.filter(s => s.classId === c.id).length;
                  const isSelected = selectedClassId === c.id;
                  const isG2 = c.name.toLowerCase().includes('g2') || (c.stream && c.stream.toLowerCase().includes('g2'));
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => handleSelectClass(c.id)}
                      className={`p-2 rounded-xl text-left border transition-all cursor-pointer flex flex-col justify-between ${
                        isSelected
                          ? 'bg-emerald-600 text-white border-emerald-600 font-black shadow-md ring-2 ring-emerald-400/40'
                          : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between text-xs font-black">
                        <span className="truncate">{c.name.split('(')[0].trim()}</span>
                        {isG2 && (
                          <span className={`px-1 rounded text-[9px] font-black ${isSelected ? 'bg-amber-400 text-slate-950' : 'bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300'}`}>
                            G2
                          </span>
                        )}
                      </div>
                      <div className="flex items-center justify-between text-[10px] mt-1 opacity-90">
                        <span>{c.level}</span>
                        <span className={`px-1.5 py-0.2 rounded font-bold ${isSelected ? 'bg-black/20 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
                          {count} élève(s)
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* STEP 2: STUDENTS IN SELECTED CLASS */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-black uppercase tracking-wider text-slate-900 dark:text-white flex items-center space-x-1.5">
                  <span className="flex items-center justify-center w-5 h-5 rounded-full bg-blue-600 text-white text-[10px] font-black">2</span>
                  <span>Choisir l'Élève ({classStudents.length})</span>
                </label>

                {/* Search within class */}
                <div className="w-44 relative">
                  <Search className="h-3.5 w-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Filtrer élève..."
                    value={studentSearchTerm}
                    onChange={e => setStudentSearchTerm(e.target.value)}
                    className="w-full pl-8 pr-2.5 py-1 text-[11px] rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Students Roster in Class */}
              <div className="space-y-1.5 max-h-56 overflow-y-auto p-1 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-inner">
                {classStudents.length === 0 ? (
                  <div className="p-6 text-center text-slate-400">
                    <User className="h-8 w-8 mx-auto mb-1 opacity-40" />
                    <p className="text-xs font-bold">Aucun élève trouvé dans cette classe.</p>
                  </div>
                ) : (
                  classStudents.map(std => {
                    const isSelected = selectedStudentId === std.id;
                    const bal = getStudentBalanceInfo(std.id);
                    const stdClass = classes.find(c => c.id === std.classId);

                    return (
                      <div
                        key={std.id}
                        onClick={() => handleSelectStudent(std)}
                        className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-2 ${
                          isSelected
                            ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-500 ring-2 ring-blue-500/20 shadow-sm'
                            : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                        }`}
                      >
                        <div className="flex items-center space-x-2.5 min-w-0">
                          {std.photoUrl ? (
                            <img
                              src={std.photoUrl}
                              alt=""
                              className="w-8 h-8 rounded-full object-cover border border-slate-300 dark:border-slate-700 shrink-0"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-black text-xs flex items-center justify-center shrink-0">
                              {std.firstName[0]}{std.lastName[0]}
                            </div>
                          )}

                          <div className="min-w-0">
                            <div className="flex items-center space-x-1.5">
                              <span className="font-black text-xs text-slate-900 dark:text-white truncate">
                                {std.lastName} {std.firstName}
                              </span>
                              <span className="text-[10px] text-slate-400 font-mono">
                                ({std.registrationNumber})
                              </span>
                            </div>
                            <div className="text-[10px] text-slate-500 flex items-center space-x-2">
                              <span>Classe: <strong className="text-slate-700 dark:text-slate-300">{stdClass?.name.split('(')[0] || 'N/A'}</strong></span>
                              <span>•</span>
                              <span>Tél: {std.parentPhone}</span>
                            </div>
                          </div>
                        </div>

                        {/* Balance Badge */}
                        <div className="text-right shrink-0">
                          <div className="text-xs font-black">
                            {bal.status === 'PAID' ? (
                              <span className="text-emerald-600 dark:text-emerald-400 flex items-center justify-end space-x-1">
                                <CheckCircle2 className="h-3.5 w-3.5" />
                                <span>Soldé</span>
                              </span>
                            ) : (
                              <span className="text-amber-600 dark:text-amber-400">
                                Reste: {bal.remaining.toLocaleString()} {settings.currency}
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-slate-400">
                            Versé: {bal.paid.toLocaleString()} / {bal.totalFee.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

          </div>

          {/* RIGHT PANEL: Step 3 (Payment Form & Confirmation) */}
          <div className="lg:col-span-5 p-4 sm:p-5 flex flex-col justify-between overflow-y-auto bg-white dark:bg-slate-900">
            <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
              
              <div className="flex items-center space-x-2 border-b border-slate-200 dark:border-slate-800 pb-2">
                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-purple-600 text-white text-[10px] font-black">3</span>
                <h4 className="font-black text-xs uppercase tracking-wider text-slate-900 dark:text-white">
                  Détails du Versement
                </h4>
              </div>

              {/* Selected Student Recap Card */}
              {selectedStudent ? (
                <div className="p-3 rounded-2xl bg-gradient-to-r from-slate-900 to-indigo-950 text-white space-y-1.5 shadow-md">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-bold text-amber-400 tracking-wider">Élève Bénéficiaire</span>
                    <span className="px-2 py-0.5 rounded-full bg-white/10 text-[10px] font-mono text-slate-200">
                      {selectedStudent.registrationNumber}
                    </span>
                  </div>
                  <h4 className="font-black text-sm text-white">
                    {selectedStudent.lastName} {selectedStudent.firstName}
                  </h4>
                  <div className="flex items-center justify-between text-[11px] text-slate-300 pt-1 border-t border-white/10">
                    <span>Classe: <strong>{selectedStudentClass?.name || 'Général'}</strong></span>
                    <span>Scolarité: <strong className="text-emerald-400">{totalTuition.toLocaleString()} {settings.currency}</strong></span>
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200 text-center font-bold">
                  Veuillez d'abord sélectionner un élève à gauche.
                </div>
              )}

              {/* Form Inputs */}
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block font-black text-[11px] text-slate-700 dark:text-slate-300 mb-1">
                    Nature du Versement
                  </label>
                  <select
                    value={paymentType}
                    onChange={e => setPaymentType(e.target.value as any)}
                    className="w-full px-2.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold text-xs focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="SCOLARITE">Frais de Scolarité</option>
                    <option value="INSCRIPTION">Inscription / Réinscription</option>
                    <option value="CANTINE">Service Cantine</option>
                    <option value="TRANSPORT">Service Transport</option>
                    <option value="EXAMEN">Frais d'Examen</option>
                  </select>
                </div>

                <div>
                  <label className="block font-black text-[11px] text-slate-700 dark:text-slate-300 mb-1">
                    Trimestre
                  </label>
                  <select
                    value={trimester}
                    onChange={e => setTrimester(parseInt(e.target.value) as 1 | 2 | 3)}
                    className="w-full px-2.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold text-xs focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value={1}>1er Trimestre</option>
                    <option value={2}>2ème Trimestre</option>
                    <option value={3}>3ème Trimestre</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block font-black text-[11px] text-slate-700 dark:text-slate-300 mb-1">
                    Mode de Paiement
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={e => setPaymentMethod(e.target.value as any)}
                    className="w-full px-2.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold text-xs focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="MOBILE_MONEY">KKiaPay / Mobile Money (MTN, Moov, Celtiis)</option>
                    <option value="ESPECES">Espèces (Caisse Directe)</option>
                    <option value="VIREMENT">Virement Bancaire</option>
                    <option value="CHEQUE">Chèque</option>
                  </select>
                </div>

                <div>
                  <label className="block font-black text-[11px] text-slate-700 dark:text-slate-300 mb-1">
                    Montant Versé ({settings.currency}) *
                  </label>
                  <input
                    type="number"
                    step="1000"
                    required
                    value={amountPaid}
                    onChange={e => setAmountPaid(e.target.value)}
                    className="w-full px-2.5 py-2 rounded-xl border border-emerald-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-black text-sm text-emerald-600 focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Calculation Preview */}
              <div className="p-3 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-1">
                <div className="flex justify-between font-bold text-slate-500 dark:text-slate-400 text-[11px]">
                  <span>Total Annuel Fixé :</span>
                  <span>{totalTuition.toLocaleString()} {settings.currency}</span>
                </div>
                <div className="flex justify-between font-bold text-slate-500 dark:text-slate-400 text-[11px]">
                  <span>Déjà Versé :</span>
                  <span>{(studentBalance?.paid || 0).toLocaleString()} {settings.currency}</span>
                </div>
                <div className="flex justify-between font-black text-xs pt-1 border-t border-slate-200 dark:border-slate-700">
                  <span className="text-slate-900 dark:text-white">Reste Après ce Versement :</span>
                  <span className={remBalance === 0 ? 'text-emerald-600 font-extrabold' : 'text-amber-600 font-extrabold'}>
                    {remBalance.toLocaleString()} {settings.currency}
                  </span>
                </div>
              </div>

              <div>
                <label className="block font-black text-[11px] text-slate-700 dark:text-slate-300 mb-1">
                  Observations / Référence reçu
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-medium"
                />
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 text-slate-700 dark:text-slate-300 font-bold transition-all cursor-pointer"
                >
                  Fermer
                </button>
                <button
                  type="submit"
                  disabled={!selectedStudent || numAmount <= 0}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black shadow-lg shadow-emerald-600/20 flex items-center space-x-1.5 transition-all cursor-pointer disabled:opacity-50"
                >
                  <CreditCard className="h-4 w-4" />
                  <span>Valider & Éditer le Reçu</span>
                </button>
              </div>

            </form>
          </div>

        </div>

      </div>
    </div>
  );
};

