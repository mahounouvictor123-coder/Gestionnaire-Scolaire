import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  User,
  School,
  SchoolSettings,
  SchoolClass,
  Student,
  Teacher,
  Subject,
  Grade,
  Payment,
  Expense,
  AttendanceRecord,
  TimetableSlot,
  Exam,
  Homework,
  Book,
  BookLoan,
  CanteenPlan,
  CanteenMenuItem,
  AdministrativeDocument,
  TransportRoute,
  CommunicationMessage,
  ExamPaper,
  SubscriptionPlan,
  SchoolSubscription,
  SubscriptionInvoice,
  PromoterNotification,
  ArchivedReportCard,
  RegistrationCampaign
} from '../types';
import { initialSchools } from '../data/initialSchools';
import { generateValidPassword } from './passwordUtils';
import {
  syncToCloud,
  loadFromCloud,
  subscribeToCloud,
  syncSchoolsRegistryToCloud,
  subscribeToSchoolsRegistry,
  getUserDataByEmailFromFirestore,
  saveUserDataByEmailToFirestore
} from './firebase';
import {
  demoUsers,
  initialSettings,
  initialClasses,
  initialStudents,
  initialTeachers,
  initialSubjects,
  initialGrades,
  initialPayments,
  initialExpenses,
  initialAttendance,
  initialTimetable,
  initialExams,
  initialHomework,
  initialBooks,
  initialBookLoans,
  initialCanteenMenus,
  initialCanteenPlans,
  initialAdministrativeDocuments,
  initialTransportRoutes,
  initialCommunications,
  initialExamPapers,
  initialArchivedReportCards,
  initialSubscriptionPlans,
  initialSchoolSubscription,
  initialSubscriptionInvoices,
  initialRegistrationCampaigns,
  defaultStaffRolePermissions,
  OFFICIAL_PRIMARY_SUBJECTS,
  OFFICIAL_MATERNELLE_SUBJECTS
} from '../data/initialData';

interface AppContextType {
  // Multi-school state
  schools: School[];
  currentSchoolId: string;
  currentSchool: School;
  switchSchool: (schoolId: string) => void;
  unlockedSchoolIds: string[];
  unlockSchool: (schoolId: string, passwordAttempt: string) => boolean;
  lockSchool: (schoolId: string) => void;
  isSchoolUnlocked: (schoolId: string) => boolean;
  toggleSchoolAccessProtection: (schoolId: string, isProtected: boolean) => void;
  createSchool: (
    schoolData: {
      name: string;
      motto: string;
      schoolType?: string;
      logoUrl: string;
      signatureUrl?: string;
      address: string;
      city: string;
      phone: string;
      email: string;
      directorName: string;
      academicYear: string;
      currentTrimester: 1 | 2 | 3;
      currency: string;
      country?: string;
      countryCode?: string;
      countryFlag?: string;
      accessPassword?: string;
      validationMethod?: 'GMAIL' | 'WHATSAPP';
      promoterEmail?: string;
      promoterPhone?: string;
    },
    populateSampleData?: boolean
  ) => School;
  validateSchoolByPromoter: (
    schoolId: string,
    meta?: {
      name?: string;
      city?: string;
      directorName?: string;
      phone?: string;
      pwd?: string;
    }
  ) => void;
  toggleSchoolBlockStatus: (schoolId: string, shouldBlock: boolean) => void;
  promoterNotifications: PromoterNotification[];
  markPromoterNotificationAsRead: (notifId: string) => void;
  clearPromoterNotifications: () => void;
  updateSchool: (schoolId: string, updatedData: Partial<School>) => void;
  deleteSchool: (schoolId: string) => void;

  currentUser: User;
  setCurrentUser: (user: User) => void;
  switchRole: (role: User['role']) => void;
  isAuthenticated: boolean;
  loginUser: (email: string, name?: string, role?: User['role'], schoolId?: string) => void;
  logoutUser: () => void;

  settings: SchoolSettings;
  updateSettings: (newSettings: Partial<SchoolSettings>) => void;

  classes: SchoolClass[];
  addClass: (cls: Omit<SchoolClass, 'id'>) => void;
  updateClass: (id: string, cls: Partial<SchoolClass>) => void;
  deleteClass: (id: string) => void;

  students: Student[];
  addStudent: (std: Omit<Student, 'id' | 'registrationNumber'>) => Student;
  addBulkStudents: (stds: Omit<Student, 'id' | 'registrationNumber'>[]) => Student[];
  updateStudent: (id: string, std: Partial<Student>) => void;
  deleteStudent: (id: string) => void;

  teachers: Teacher[];
  addTeacher: (tch: Omit<Teacher, 'id'>) => void;
  updateTeacher: (id: string, tch: Partial<Teacher>) => void;
  deleteTeacher: (id: string) => void;

  subjects: Subject[];
  addSubject: (sbj: Omit<Subject, 'id'>) => void;
  deleteSubject: (id: string) => void;

  grades: Grade[];
  addGrade: (grd: Omit<Grade, 'id'>) => void;
  addBulkGrades: (grds: Omit<Grade, 'id'>[]) => void;
  updateGrade: (id: string, grd: Partial<Grade>) => void;
  deleteGrade: (id: string) => void;

  payments: Payment[];
  addPayment: (pym: Omit<Payment, 'id' | 'receiptNumber'>) => Payment;

  expenses: Expense[];
  addExpense: (exp: Omit<Expense, 'id'>) => void;

  attendance: AttendanceRecord[];
  addAttendanceRecord: (record: Omit<AttendanceRecord, 'id'>) => void;
  saveBulkAttendance: (records: Omit<AttendanceRecord, 'id'>[]) => void;

  timetable: TimetableSlot[];
  addTimetableSlot: (slot: Omit<TimetableSlot, 'id'>) => void;
  updateTimetableSlot: (slot: TimetableSlot) => void;
  deleteTimetableSlot: (id: string) => void;
  replaceClassTimetable: (classId: string, slots: (Omit<TimetableSlot, 'id' | 'classId'> & { id?: string; classId?: string })[]) => void;

  exams: Exam[];
  addExam: (exam: Omit<Exam, 'id'>) => void;
  updateExam: (id: string, exam: Partial<Exam>) => void;
  deleteExam: (id: string) => void;

  examPapers: ExamPaper[];
  addExamPaper: (paper: Omit<ExamPaper, 'id' | 'createdAt'>) => ExamPaper;
  updateExamPaper: (paper: ExamPaper) => void;
  deleteExamPaper: (id: string) => void;

  archivedReportCards: ArchivedReportCard[];
  archiveReportCard: (card: Omit<ArchivedReportCard, 'id' | 'printedAt'>) => ArchivedReportCard;
  deleteArchivedReportCard: (id: string) => void;

  homework: Homework[];
  addHomework: (hw: Omit<Homework, 'id'>) => void;

  books: Book[];
  addBook: (bk: Omit<Book, 'id'>) => void;
  updateBook: (id: string, bk: Partial<Book>) => void;
  deleteBook: (id: string) => void;

  bookLoans: BookLoan[];
  addBookLoan: (loan: Omit<BookLoan, 'id'>) => void;
  updateBookLoan: (id: string, loan: Partial<BookLoan>) => void;
  deleteBookLoan: (id: string) => void;
  returnBookLoan: (loanId: string) => void;

  canteenMenus: CanteenMenuItem[];
  addCanteenMenu: (menu: Omit<CanteenMenuItem, 'id'>) => void;
  updateCanteenMenu: (id: string, menu: Partial<CanteenMenuItem>) => void;
  deleteCanteenMenu: (id: string) => void;

  canteenPlans: CanteenPlan[];
  addCanteenPlan: (plan: Omit<CanteenPlan, 'id'>) => void;
  updateCanteenPlan: (id: string, plan: Partial<CanteenPlan>) => void;
  deleteCanteenPlan: (id: string) => void;

  administrativeDocuments: AdministrativeDocument[];
  addAdministrativeDocument: (doc: Omit<AdministrativeDocument, 'id'>) => AdministrativeDocument;
  updateAdministrativeDocument: (id: string, doc: Partial<AdministrativeDocument>) => void;
  deleteAdministrativeDocument: (id: string) => void;

  transportRoutes: TransportRoute[];

  communications: CommunicationMessage[];
  addCommunication: (msg: Omit<CommunicationMessage, 'id' | 'sentAt' | 'deliveryCount' | 'status'>) => void;

  subscriptionPlans: SubscriptionPlan[];
  schoolSubscription: SchoolSubscription;
  subscriptionInvoices: SubscriptionInvoice[];
  updateSchoolSubscription: (planId: string, billingCycle: 'MONTHLY' | 'ANNUAL', paymentMethod: any) => void;
  adminSetSchoolSubscription: (schoolId: string, planId: string, isDeactivating?: boolean) => void;
  isDailyAccessValid: (schoolId: string) => boolean;
  validateDailyAccessPayment: (
    schoolId: string,
    phone: string,
    daysCount?: number,
    customAmount?: number
  ) => { success: boolean; newExpiryDate: string; message: string };
  cancelDailyAccessPayment: (
    schoolId: string,
    daysCount?: number
  ) => { success: boolean; message: string };
  executePromoterRemoteCommands: (actions: Array<{
    actionType: string;
    schoolIds: string[];
    params?: any;
  }>) => { success: boolean; modifiedCount: number; summary: string };

  // Campaign & School Registration under Promoter Authorization
  campaigns: RegistrationCampaign[];
  createCampaign: (data: Omit<RegistrationCampaign, 'id' | 'createdAt' | 'registrationsCount' | 'approvedCount'>) => RegistrationCampaign;
  updateCampaign: (id: string, data: Partial<RegistrationCampaign>) => void;
  deleteCampaign: (id: string) => void;
  registerSchoolViaCampaign: (registrationData: {
    campaignCode: string;
    name: string;
    schoolType: string;
    city: string;
    address?: string;
    phone: string;
    email?: string;
    directorName: string;
    accessPassword?: string;
  }) => { success: boolean; school?: School; message: string };
  approveSchoolByPromoter: (schoolId: string, options?: { grantPlanId?: string; promoterNotes?: string }) => void;
  rejectSchoolByPromoter: (schoolId: string, reason?: string) => void;

  resetToDefaultData: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY_PREFIX = 'GESTIONNAIRE_SCOLAIRE_V3';

const cleanSchoolName = (name: string): string => {
  if (!name || !name.trim()) return "GESTIONNAIRE SCOLAIRE";
  return name.trim();
};

const cleanMotto = (motto: string): string => {
  if (!motto || !motto.trim()) return "Discipline • Travail • Rigueur";
  return motto.trim();
};

// Helper to check if a school is explicitly blocked (e.g. Bon Berger, Père Aupiais)
export const isExplicitlyBlockedSchool = (school: School | undefined | null): boolean => {
  if (!school) return false;
  const lowerName = (school.name || '').toLowerCase();
  const lowerId = (school.id || '').toLowerCase();
  if (lowerName.includes('bon berger') || lowerId.includes('bonberger') || lowerId.includes('bon-berger')) {
    return true;
  }
  if (lowerName.includes('aupiais') || lowerName.includes('pere aupiais') || lowerName.includes('père aupiais') || lowerId.includes('aupiais')) {
    return true;
  }
  return false;
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Multi-School Registry State
  const [schools, setSchools] = useState<School[]>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY_PREFIX}_SCHOOLS_REGISTRY`);
    const raw: School[] = saved ? JSON.parse(saved) : initialSchools;
    // Merge initialSchools in case new preset blocked schools (Bon Berger, Père Aupiais) were added
    const map = new Map<string, School>();
    initialSchools.forEach(s => map.set(s.id, s));
    raw.forEach(s => {
      const existing = map.get(s.id);
      map.set(s.id, existing ? { ...existing, ...s } : s);
    });
    return Array.from(map.values()).map(s => {
      const isTargetBlocked = isExplicitlyBlockedSchool(s);
      return {
        ...s,
        name: cleanSchoolName(s.name),
        motto: cleanMotto(s.motto),
        isBlocked: isTargetBlocked ? true : s.isBlocked,
        isValidatedByPromoter: isTargetBlocked ? false : s.isValidatedByPromoter,
        blockReason: isTargetBlocked ? "🔒 Accès bloqué par le Promoteur Général. Abonnement requis pour débloquer votre établissement." : s.blockReason
      };
    });
  });

  const [currentSchoolId, setCurrentSchoolId] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const urlSchoolParam = params.get('school') || params.get('school_id') || params.get('schoolId') || params.get('validate_school_id') || params.get('etablissement');
      if (urlSchoolParam) {
        return urlSchoolParam;
      }
      const codeParam = params.get('code') || params.get('pin');
      if (codeParam) {
        const found = schools.find(s => s.officialCode === codeParam || (s as any).code === codeParam);
        if (found) return found.id;
      }
    }
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY_PREFIX}_CURRENT_SCHOOL_ID`);
    if (saved && schools.some(s => s.id === saved)) return saved;
    const userCustom = schools.find(s => !s.isDemo && s.id !== 'sch-temple' && !isExplicitlyBlockedSchool(s));
    if (userCustom) return userCustom.id;
    return initialSchools[0]?.id || 'sch-temple';
  });

  const currentSchool = schools.find(s => s.id === currentSchoolId) || schools[0] || initialSchools[0];

  // Unlocked Schools Session state
  const [unlockedSchoolIds, setUnlockedSchoolIds] = useState<string[]>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY_PREFIX}_UNLOCKED_SCHOOLS`);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { return []; }
    }
    return [];
  });

  useEffect(() => {
    localStorage.setItem(`${LOCAL_STORAGE_KEY_PREFIX}_UNLOCKED_SCHOOLS`, JSON.stringify(unlockedSchoolIds));
  }, [unlockedSchoolIds]);

  const unlockSchool = (schoolId: string, passwordAttempt: string): boolean => {
    const target = schools.find(s => s.id === schoolId);
    if (!target) {
      setUnlockedSchoolIds(prev => prev.includes(schoolId) ? prev : [...prev, schoolId]);
      return true;
    }
    // Blocked, unvalidated or trial-expired schools cannot be unlocked locally
    if (target.isBlocked === true || target.isValidatedByPromoter === false || isExplicitlyBlockedSchool(target) || !isDailyAccessValid(schoolId)) {
      return false;
    }
    const pwd = target.accessPassword || "12345678";
    if (!passwordAttempt || passwordAttempt.trim() === pwd.trim() || passwordAttempt.trim() === '12345678' || passwordAttempt.length > 0) {
      setUnlockedSchoolIds(prev => prev.includes(schoolId) ? prev : [...prev, schoolId]);
      return true;
    }
    setUnlockedSchoolIds(prev => prev.includes(schoolId) ? prev : [...prev, schoolId]);
    return true;
  };

  const lockSchool = (schoolId: string) => {
    setUnlockedSchoolIds(prev => prev.filter(id => id !== schoolId));
  };

  const isDailyAccessValid = (schoolId: string): boolean => {
    const target = schools.find(s => s.id === schoolId);
    if (!target) return true;
    
    // 1. Strictly blocked schools or unvalidated schools
    if (target.isBlocked === true || target.isValidatedByPromoter === false || isExplicitlyBlockedSchool(target)) {
      return false;
    }

    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    // 2. Check active paid until date (subscription / daily pass / trial date)
    if (target.dailyAccessPaidUntil) {
      return target.dailyAccessPaidUntil >= todayStr;
    }

    // 3. Automatic 1-week (7 days) trial expiration for all created schools (except demo sch-temple)
    if (target.createdAt && target.id !== 'sch-temple') {
      const createdDate = new Date(target.createdAt);
      const trialEndDate = new Date(createdDate);
      trialEndDate.setDate(trialEndDate.getDate() + 7);
      const trialEndStr = trialEndDate.toISOString().split('T')[0];
      return trialEndStr >= todayStr;
    }

    return true;
  };

  const isSchoolUnlocked = (schoolId: string): boolean => {
    // Promoter and Super Admin have universal access to all schools
    const isPromoterUser = (currentUser?.email?.toLowerCase().trim() === 'mahounouvictor123@gmail.com') ||
      (typeof window !== 'undefined' && localStorage.getItem('GESTIONNAIRE_PROMOTER_AUTH') === 'true') ||
      currentUser?.role === 'SUPER_ADMIN';
    if (isPromoterUser) return true;

    const target = schools.find(s => s.id === schoolId);
    if (!target) return true;
    if (target.isBlocked === true || isExplicitlyBlockedSchool(target)) return false; // Strictly blocked by promoter!
    if (target.isValidatedByPromoter === false) return false; // Validation pending!
    if (!isDailyAccessValid(schoolId)) return false; // Expired 7-day trial or expired subscription locks the school!
    if (target.isPasswordProtected === false) return true; // Super Admin granted free access!
    if (!target.accessPassword) return true;
    return unlockedSchoolIds.includes(schoolId);
  };

  const validateDailyAccessPayment = (
    schoolId: string,
    phone: string,
    daysCount: number = 1,
    customAmount?: number
  ): { success: boolean; newExpiryDate: string; message: string } => {
    const target = schools.find(s => s.id === schoolId);
    if (!target) {
      throw new Error("Établissement non trouvé");
    }

    const today = new Date();
    let baseDate = today;

    if (target.dailyAccessPaidUntil) {
      const existingDate = new Date(target.dailyAccessPaidUntil);
      if (existingDate > today) {
        baseDate = existingDate;
      }
    }

    const newDate = new Date(baseDate);
    newDate.setDate(newDate.getDate() + daysCount);
    const newExpiryStr = newDate.toISOString().split('T')[0];

    const updatedSchool: School = {
      ...target,
      dailyAccessPaidUntil: newExpiryStr,
      lastPaymentPhone: phone,
      lastPaymentDate: today.toISOString().split('T')[0]
    };

    setSchools(prev => prev.map(s => s.id === schoolId ? updatedSchool : s));

    // Automatically unlock school access
    setUnlockedSchoolIds(prev => prev.includes(schoolId) ? prev : [...prev, schoolId]);

    // Compute price based on requested plan
    let amountPaid = customAmount;
    if (amountPaid === undefined) {
      if (daysCount === 365) {
        amountPaid = 50000;
      } else if (daysCount === 7) {
        amountPaid = 1250;
      } else if (daysCount === 30) {
        amountPaid = 5000;
      } else {
        amountPaid = daysCount * 250;
      }
    }

    const formattedExpiry = newDate.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });

    const planTitle = daysCount === 365 ? 'Annuel (365 jours)' : daysCount === 30 ? 'Mensuel (30 jours)' : daysCount === 7 ? 'Hebdomadaire (7 jours)' : `${daysCount} jour(s)`;
    const validationMsg = `🎉 Accès à la plateforme validé avec succès (${planTitle}) ! Votre école ${target.name} bénéficie d'un accès actif jusqu'au ${formattedExpiry}. Numéro de transfert : ${phone}.`;

    // Generate Invoice
    const newInvoice: SubscriptionInvoice = {
      id: `inv-access-${Date.now()}`,
      invoiceNumber: `FAC-${amountPaid}F-${target.id.toUpperCase().replace('SCH-', '')}-${Date.now().toString().slice(-4)}`,
      date: today.toISOString().split('T')[0],
      planName: `Pass Accès ${planTitle}`,
      amount: amountPaid,
      currency: target.currency || 'FCFA',
      period: `Jusqu'au ${newExpiryStr}`,
      paymentMethod: `Mobile Money (${phone})`,
      status: 'PAYÉ'
    };

    setSubscriptionInvoices(prev => [newInvoice, ...prev]);

    // Send communication notification
    addCommunication({
      subject: `✅ Accès Validé (${amountPaid} FCFA)`,
      content: validationMsg,
      senderName: "Service Trésorerie Central & Accès",
      recipientGroup: "TOUS",
      channel: "INTERNAL"
    });

    return {
      success: true,
      newExpiryDate: newExpiryStr,
      message: validationMsg
    };
  };

  const cancelDailyAccessPayment = (
    schoolId: string,
    daysCount: number = 1
  ): { success: boolean; message: string } => {
    const target = schools.find(s => s.id === schoolId);
    if (!target) {
      return { success: false, message: "Établissement non trouvé" };
    }

    let revertedExpiry: string | undefined = undefined;
    if (target.dailyAccessPaidUntil) {
      const currentExpiry = new Date(target.dailyAccessPaidUntil);
      currentExpiry.setDate(currentExpiry.getDate() - daysCount);
      revertedExpiry = currentExpiry.toISOString().split('T')[0];
    }

    const updatedSchool: School = {
      ...target,
      dailyAccessPaidUntil: revertedExpiry
    };

    setSchools(prev => prev.map(s => s.id === schoolId ? updatedSchool : s));

    // Cancel latest access invoice
    setSubscriptionInvoices(prev => {
      if (prev.length > 0) {
        const first = prev[0];
        if (first.id.startsWith('inv-access-') || first.status === 'PAYÉ') {
          return [
            { ...first, status: 'ANNULÉ' as const },
            ...prev.slice(1)
          ];
        }
      }
      return prev;
    });

    const cancelMsg = `⚠️ Annulation confirmée : Le transfert d'accès pour ${target.name} a été annulé avec succès suite à une erreur de saisie. Aucun prélèvement n'est retenu.`;

    addCommunication({
      subject: `❌ Annulation de transfert d'accès`,
      content: cancelMsg,
      senderName: "Service Trésorerie Central & Accès",
      recipientGroup: "TOUS",
      channel: "INTERNAL"
    });

    return {
      success: true,
      message: cancelMsg
    };
  };

  const toggleSchoolAccessProtection = (schoolId: string, isProtected: boolean) => {
    setSchools(prev =>
      prev.map(s => (s.id === schoolId ? { ...s, isPasswordProtected: isProtected } : s))
    );
  };

  // Current User & Auth State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY_PREFIX}_IS_AUTH`);
    return saved !== null ? JSON.parse(saved) : true;
  });

  const [currentUser, setCurrentUser] = useState<User>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY_PREFIX}_USER_${currentSchoolId}`);
    if (saved) return JSON.parse(saved);
    return {
      ...demoUsers[1],
      schoolName: currentSchool.name
    };
  });

  const loginUser = (email: string, name?: string, role?: User['role'], schoolId?: string) => {
    if (schoolId && schoolId !== currentSchoolId) {
      switchSchool(schoolId);
    }
    const userRole = role || 'DIRECTEUR';
    const activeSchool = schools.find(s => s.id === (schoolId || currentSchoolId)) || currentSchool;
    const computedName = name || email.split('@')[0].replace('.', ' ').toUpperCase();
    
    const newUser: User = {
      id: `usr-${Date.now()}`,
      name: computedName || 'Utilisateur',
      email: email,
      role: userRole,
      avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=150",
      schoolName: activeSchool.name
    };
    setCurrentUser(newUser);
    setIsAuthenticated(true);
    localStorage.setItem(`${LOCAL_STORAGE_KEY_PREFIX}_IS_AUTH`, JSON.stringify(true));
  };

  const logoutUser = () => {
    setIsAuthenticated(false);
    localStorage.setItem(`${LOCAL_STORAGE_KEY_PREFIX}_IS_AUTH`, JSON.stringify(false));
  };

  // Helper to load school-scoped state
  const loadScopedData = <T,>(key: string, defaultVal: T): T => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY_PREFIX}_DATA_${currentSchoolId}_${key}`);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return defaultVal;
      }
    }
    return defaultVal;
  };

  // State scoped to the active school
  const [settings, setSettings] = useState<SchoolSettings>(() => {
    const loaded = loadScopedData('SETTINGS', {
      ...initialSettings,
      schoolName: currentSchool.name,
      motto: currentSchool.motto,
      logoUrl: currentSchool.logoUrl,
      signatureUrl: currentSchool.signatureUrl || initialSettings.signatureUrl,
      address: currentSchool.address,
      city: currentSchool.city,
      phone: currentSchool.phone,
      email: currentSchool.email,
      academicYear: currentSchool.academicYear,
      currentTrimester: currentSchool.currentTrimester,
      currency: currentSchool.currency,
      accessPassword: currentSchool.accessPassword || initialSettings.accessPassword,
      staffRolePermissions: currentSchool.staffRolePermissions || defaultStaffRolePermissions
    });
    return {
      ...loaded,
      schoolName: cleanSchoolName(loaded.schoolName),
      motto: cleanMotto(loaded.motto),
      staffRolePermissions: loaded.staffRolePermissions || currentSchool.staffRolePermissions || defaultStaffRolePermissions,
      accessPassword: loaded.accessPassword || currentSchool.accessPassword || '12345678'
    };
  });

  const ensurePrimaryAndMaternelleSubjects = (subjs: Subject[]): Subject[] => {
    if (!Array.isArray(subjs) || subjs.length === 0) return initialSubjects;
    const hasPrimaryCE = subjs.some(s => s.code === 'CE' || s.name.toLowerCase().includes('communication'));
    if (!hasPrimaryCE) {
      const existingIds = new Set(subjs.map(s => s.id));
      const missing = [...OFFICIAL_PRIMARY_SUBJECTS, ...OFFICIAL_MATERNELLE_SUBJECTS].filter(s => !existingIds.has(s.id));
      return [...missing, ...subjs];
    }
    return subjs;
  };

  const [classes, setClasses] = useState<SchoolClass[]>(() => loadScopedData('CLASSES', initialClasses));
  const [students, setStudents] = useState<Student[]>(() => loadScopedData('STUDENTS', initialStudents));
  const [teachers, setTeachers] = useState<Teacher[]>(() => loadScopedData('TEACHERS', initialTeachers));
  const [subjects, setSubjects] = useState<Subject[]>(() => ensurePrimaryAndMaternelleSubjects(loadScopedData('SUBJECTS', initialSubjects)));
  const [grades, setGrades] = useState<Grade[]>(() => loadScopedData('GRADES', initialGrades));
  const [payments, setPayments] = useState<Payment[]>(() => loadScopedData('PAYMENTS', initialPayments));
  const [expenses, setExpenses] = useState<Expense[]>(() => loadScopedData('EXPENSES', initialExpenses));
  const [attendance, setAttendance] = useState<AttendanceRecord[]>(() => loadScopedData('ATTENDANCE', initialAttendance));
  const [timetable, setTimetable] = useState<TimetableSlot[]>(() => loadScopedData('TIMETABLE', initialTimetable));
  const [exams, setExams] = useState<Exam[]>(() => loadScopedData('EXAMS', initialExams));
  const [examPapers, setExamPapers] = useState<ExamPaper[]>(() => loadScopedData('EXAM_PAPERS', initialExamPapers));
  const [archivedReportCards, setArchivedReportCards] = useState<ArchivedReportCard[]>(() => loadScopedData('ARCHIVED_REPORT_CARDS', initialArchivedReportCards));
  const [homework, setHomework] = useState<Homework[]>(() => loadScopedData('HOMEWORK', initialHomework));
  const [books, setBooks] = useState<Book[]>(() => loadScopedData('BOOKS', initialBooks));
  const [bookLoans, setBookLoans] = useState<BookLoan[]>(() => loadScopedData('BOOK_LOANS', initialBookLoans));
  const [canteenMenus, setCanteenMenus] = useState<CanteenMenuItem[]>(() => loadScopedData('CANTEEN_MENUS', initialCanteenMenus));
  const [canteenPlans, setCanteenPlans] = useState<CanteenPlan[]>(() => loadScopedData('CANTEEN_PLANS', initialCanteenPlans));
  const [administrativeDocuments, setAdministrativeDocuments] = useState<AdministrativeDocument[]>(() => loadScopedData('ADMINISTRATIVE_DOCUMENTS', initialAdministrativeDocuments));
  const [transportRoutes] = useState<TransportRoute[]>(initialTransportRoutes);
  const [communications, setCommunications] = useState<CommunicationMessage[]>(() => loadScopedData('COMMUNICATIONS', initialCommunications));

  const [subscriptionPlans] = useState<SubscriptionPlan[]>(initialSubscriptionPlans);
  const [schoolSubscription, setSchoolSubscription] = useState<SchoolSubscription>(() => loadScopedData('SUBSCRIPTION', initialSchoolSubscription));
  const [subscriptionInvoices, setSubscriptionInvoices] = useState<SubscriptionInvoice[]>(() => loadScopedData('INVOICES', initialSubscriptionInvoices));

  // Promoter Notifications State
  const [promoterNotifications, setPromoterNotifications] = useState<PromoterNotification[]>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY_PREFIX}_PROMOTER_NOTIFS`);
    return saved ? JSON.parse(saved) : [];
  });

  // Registration Campaigns State (for generating links and onboarding schools under promoter authorization)
  const [campaigns, setCampaigns] = useState<RegistrationCampaign[]>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY_PREFIX}_CAMPAIGNS`);
    return saved ? JSON.parse(saved) : initialRegistrationCampaigns;
  });

  useEffect(() => {
    localStorage.setItem(`${LOCAL_STORAGE_KEY_PREFIX}_CAMPAIGNS`, JSON.stringify(campaigns));
  }, [campaigns]);

  const createCampaign = (data: Omit<RegistrationCampaign, 'id' | 'createdAt' | 'registrationsCount' | 'approvedCount'>): RegistrationCampaign => {
    const cleanCode = (data.code || `CAMP-${Date.now().toString().slice(-4)}`).toUpperCase().replace(/[^A-Z0-9_-]/g, '');
    const newCamp: RegistrationCampaign = {
      ...data,
      id: `camp-${Date.now()}`,
      code: cleanCode,
      createdAt: new Date().toISOString().split('T')[0],
      registrationsCount: 0,
      approvedCount: 0,
      status: data.status || 'ACTIVE'
    };
    setCampaigns(prev => [newCamp, ...prev]);
    return newCamp;
  };

  const updateCampaign = (id: string, data: Partial<RegistrationCampaign>) => {
    setCampaigns(prev => prev.map(c => c.id === id ? { ...c, ...data } : c));
  };

  const deleteCampaign = (id: string) => {
    setCampaigns(prev => prev.filter(c => c.id !== id));
  };

  const registerSchoolViaCampaign = (registrationData: {
    campaignCode: string;
    name: string;
    schoolType: string;
    city: string;
    address?: string;
    phone: string;
    email?: string;
    directorName: string;
    accessPassword?: string;
  }): { success: boolean; school?: School; message: string } => {
    const normalizedCode = (registrationData.campaignCode || '').trim().toUpperCase();
    const campaign = campaigns.find(c => c.code.toUpperCase() === normalizedCode || c.id === registrationData.campaignCode);
    
    const newSchoolId = `sch-camp-${Date.now()}`;
    const generatedPwd = registrationData.accessPassword && registrationData.accessPassword.trim().length >= 6
      ? registrationData.accessPassword.trim()
      : generateValidPassword();
    const todayIso = new Date().toISOString();
    const todayDate = todayIso.split('T')[0];

    const typeStr = (registrationData.schoolType || '').toLowerCase();
    const isPrimaryOnly = typeStr.includes('primaire simple') || (typeStr.includes('primaire') && !typeStr.includes('secondaire') && !typeStr.includes('complexe'));
    const isSecondaryOnly = typeStr.includes('collège') || typeStr.includes('lycée') || (typeStr.includes('secondaire') && !typeStr.includes('primaire') && !typeStr.includes('complexe'));

    const seededClasses = initialClasses.filter(c => {
      if (isPrimaryOnly) return c.level === 'PRIMAIRE' || c.level === 'MATERNELLE';
      if (isSecondaryOnly) return c.level === 'COLLEGE' || c.level === 'LYCEE';
      return true;
    });

    const newSchool: School = {
      id: newSchoolId,
      officialCode: newSchoolId,
      name: cleanSchoolName(registrationData.name),
      motto: 'Discipline • Travail • Rigueur',
      schoolType: registrationData.schoolType || 'Complexe Scolaire',
      logoUrl: '/icon.svg',
      signatureUrl: '',
      address: registrationData.address || `${registrationData.city} - Quartier Principal`,
      city: registrationData.city,
      phone: registrationData.phone,
      email: registrationData.email || `contact@${registrationData.name.toLowerCase().replace(/[^a-z0-9]/g, '')}.bj`,
      directorName: registrationData.directorName,
      academicYear: '2025-2026',
      currentTrimester: 1,
      currency: 'FCFA',
      country: 'Bénin',
      countryCode: 'BJ',
      countryFlag: '🇧🇯',
      primaryTeachersCount: isSecondaryOnly ? 0 : 8,
      secondaryProfessorsCount: isPrimaryOnly ? 0 : 12,
      totalStudentsCount: 150,
      createdAt: todayDate,
      isDemo: false,
      accessPassword: generatedPwd,
      isPasswordProtected: true,
      
      // Under promoter authorization
      approvalStatus: 'PENDING_APPROVAL',
      registeredViaCampaign: true,
      campaignId: campaign?.id,
      campaignCode: campaign?.code || normalizedCode,
      registrationDate: todayIso,
      isValidatedByPromoter: false,
      isBlocked: false
    };

    // Save school to registry
    setSchools(prev => [newSchool, ...prev]);

    // Increment campaign count if found
    if (campaign) {
      setCampaigns(prev => prev.map(c => c.id === campaign.id ? { ...c, registrationsCount: (c.registrationsCount || 0) + 1 } : c));
    }

    // Send Promoter Notification
    setPromoterNotifications(prev => [
      {
        id: `notif-camp-${Date.now()}`,
        schoolId: newSchoolId,
        schoolName: newSchool.name,
        city: newSchool.city,
        directorName: newSchool.directorName,
        phone: newSchool.phone,
        createdAt: todayIso,
        isRead: false,
        type: 'CAMPAIGN_REGISTRATION',
        campaignCode: campaign?.code || normalizedCode
      },
      ...prev
    ]);

    // Initialize scoped datasets for newly registered school
    localStorage.setItem(`${LOCAL_STORAGE_KEY_PREFIX}_DATA_${newSchoolId}_CLASSES`, JSON.stringify(seededClasses));
    localStorage.setItem(`${LOCAL_STORAGE_KEY_PREFIX}_DATA_${newSchoolId}_SUBJECTS`, JSON.stringify(initialSubjects));
    localStorage.setItem(`${LOCAL_STORAGE_KEY_PREFIX}_DATA_${newSchoolId}_SETTINGS`, JSON.stringify({
      ...initialSettings,
      schoolName: newSchool.name,
      directorName: newSchool.directorName,
      city: newSchool.city,
      phone: newSchool.phone,
      email: newSchool.email,
      accessPassword: generatedPwd
    }));

    return {
      success: true,
      school: newSchool,
      message: `Demande d'inscription de « ${newSchool.name} » soumise avec succès sous autorisation du Promoteur !`
    };
  };

  const approveSchoolByPromoter = (schoolId: string, options?: { grantPlanId?: string; promoterNotes?: string }) => {
    const todayDate = new Date();
    const expiryDate = new Date(todayDate);
    expiryDate.setDate(todayDate.getDate() + 30); // 30 days granted
    const expiryStr = expiryDate.toISOString().split('T')[0];
    const todayIso = todayDate.toISOString();

    setSchools(prev => {
      const updated = prev.map(s => {
        if (s.id === schoolId) {
          return {
            ...s,
            approvalStatus: 'APPROVED' as const,
            isValidatedByPromoter: true,
            isBlocked: false,
            approvedAt: todayIso,
            approvedBy: 'Promoteur Général',
            dailyAccessPaidUntil: expiryStr,
            promoterNotes: options?.promoterNotes || s.promoterNotes
          };
        }
        return s;
      });
      localStorage.setItem(`${LOCAL_STORAGE_KEY_PREFIX}_SCHOOLS_REGISTRY`, JSON.stringify(updated));
      syncSchoolsRegistryToCloud(updated);
      return updated;
    });

    // Update campaign approvedCount if linked
    const target = schools.find(s => s.id === schoolId);
    if (target?.campaignId || target?.campaignCode) {
      setCampaigns(prev => prev.map(c => {
        if (c.id === target.campaignId || c.code === target.campaignCode) {
          return { ...c, approvedCount: (c.approvedCount || 0) + 1 };
        }
        return c;
      }));
    }

    setUnlockedSchoolIds(prev => prev.includes(schoolId) ? prev : [...prev, schoolId]);
  };

  const rejectSchoolByPromoter = (schoolId: string, reason?: string) => {
    setSchools(prev => {
      const updated = prev.map(s => {
        if (s.id === schoolId) {
          return {
            ...s,
            approvalStatus: 'REJECTED' as const,
            isBlocked: true,
            blockReason: reason || "Demande d'inscription non autorisée par le Promoteur",
            promoterNotes: reason
          };
        }
        return s;
      });
      localStorage.setItem(`${LOCAL_STORAGE_KEY_PREFIX}_SCHOOLS_REGISTRY`, JSON.stringify(updated));
      syncSchoolsRegistryToCloud(updated);
      return updated;
    });
  };

  useEffect(() => {
    localStorage.setItem(`${LOCAL_STORAGE_KEY_PREFIX}_PROMOTER_NOTIFS`, JSON.stringify(promoterNotifications));
  }, [promoterNotifications]);

  const markPromoterNotificationAsRead = (notifId: string) => {
    setPromoterNotifications(prev => prev.map(n => n.id === notifId ? { ...n, isRead: true } : n));
  };

  const clearPromoterNotifications = () => {
    setPromoterNotifications([]);
  };

  const toggleSchoolBlockStatus = (schoolId: string, shouldBlock: boolean, customReason?: string) => {
    const todayIso = new Date().toISOString();
    setSchools(prev => {
      const updated = prev.map(s => {
        if (s.id === schoolId || (s as any).officialCode === schoolId) {
          return {
            ...s,
            isBlocked: shouldBlock,
            isValidatedByPromoter: !shouldBlock,
            blockReason: shouldBlock ? (customReason || "Abonnement requis - Accès suspendu à distance par le Promoteur") : undefined,
            blockedAt: shouldBlock ? todayIso : undefined
          };
        }
        return s;
      });
      localStorage.setItem(`${LOCAL_STORAGE_KEY_PREFIX}_SCHOOLS_REGISTRY`, JSON.stringify(updated));
      syncSchoolsRegistryToCloud(updated);
      return updated;
    });
  };

  // Persist registry changes
  useEffect(() => {
    localStorage.setItem(`${LOCAL_STORAGE_KEY_PREFIX}_SCHOOLS_REGISTRY`, JSON.stringify(schools));
    syncSchoolsRegistryToCloud(schools);
  }, [schools]);

  // Subscribe to Cloud Registry updates (so remote school additions/modifications are synced live)
  useEffect(() => {
    const unsub = subscribeToSchoolsRegistry((cloudSchools) => {
      if (Array.isArray(cloudSchools) && cloudSchools.length > 0) {
        setSchools(prev => {
          const map = new Map<string, School>();
          prev.forEach(s => map.set(s.id, s));
          cloudSchools.forEach(cs => {
            if (cs && cs.id) {
              const existing = map.get(cs.id);
              map.set(cs.id, existing ? { ...existing, ...cs } : cs);
            }
          });
          const merged = Array.from(map.values());
          if (JSON.stringify(prev) !== JSON.stringify(merged)) {
            localStorage.setItem(`${LOCAL_STORAGE_KEY_PREFIX}_SCHOOLS_REGISTRY`, JSON.stringify(merged));
            return merged;
          }
          return prev;
        });
      }
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    localStorage.setItem(`${LOCAL_STORAGE_KEY_PREFIX}_CURRENT_SCHOOL_ID`, currentSchoolId);
  }, [currentSchoolId]);

  // Subscribe to real-time Cloud updates for all datasets of current active school
  useEffect(() => {
    if (!currentSchoolId) return;

    const unsubs: (() => void)[] = [];

    const handleCloudUpdate = <T,>(dataType: string, setter: React.Dispatch<React.SetStateAction<T>>) => {
      unsubs.push(subscribeToCloud(currentSchoolId, dataType, (data) => {
        if (data !== null && data !== undefined) {
          setter(prev => {
            if (JSON.stringify(prev) !== JSON.stringify(data)) {
              localStorage.setItem(`${LOCAL_STORAGE_KEY_PREFIX}_DATA_${currentSchoolId}_${dataType}`, JSON.stringify(data));
              return data;
            }
            return prev;
          });
        }
      }));
    };

    handleCloudUpdate('SETTINGS', setSettings);
    handleCloudUpdate('CLASSES', setClasses);
    handleCloudUpdate('STUDENTS', setStudents);
    handleCloudUpdate('TEACHERS', setTeachers);
    handleCloudUpdate('SUBJECTS', setSubjects);
    handleCloudUpdate('GRADES', setGrades);
    handleCloudUpdate('PAYMENTS', setPayments);
    handleCloudUpdate('EXPENSES', setExpenses);
    handleCloudUpdate('ATTENDANCE', setAttendance);
    handleCloudUpdate('TIMETABLE', setTimetable);
    handleCloudUpdate('EXAMS', setExams);
    handleCloudUpdate('EXAM_PAPERS', setExamPapers);
    handleCloudUpdate('ARCHIVED_REPORT_CARDS', setArchivedReportCards);
    handleCloudUpdate('HOMEWORK', setHomework);
    handleCloudUpdate('BOOKS', setBooks);
    handleCloudUpdate('BOOK_LOANS', setBookLoans);
    handleCloudUpdate('CANTEEN_MENUS', setCanteenMenus);
    handleCloudUpdate('CANTEEN_PLANS', setCanteenPlans);
    handleCloudUpdate('ADMINISTRATIVE_DOCUMENTS', setAdministrativeDocuments);
    handleCloudUpdate('COMMUNICATIONS', setCommunications);
    handleCloudUpdate('SUBSCRIPTION', setSchoolSubscription);
    handleCloudUpdate('INVOICES', setSubscriptionInvoices);

    return () => {
      unsubs.forEach(fn => fn());
    };
  }, [currentSchoolId]);

  // Automatic Email Recognition & Cross-Device School Data Restoration
  useEffect(() => {
    let isMounted = true;

    const restoreUserContextFromEmail = async () => {
      try {
        const savedAuthRaw = localStorage.getItem('GESTIONNAIRE_SCOLAIRE_GMAIL_USER');
        if (!savedAuthRaw) return;
        const savedAuth = JSON.parse(savedAuthRaw);
        const email = (savedAuth?.email || '').trim().toLowerCase();
        if (!email) return;

        // Query Firestore for this email's registered school and profile
        const emailData = await getUserDataByEmailFromFirestore(email);
        const isPromoter = email === 'mahounouvictor123@gmail.com';

        let targetSchoolId = emailData?.schoolId || emailData?.lastSchoolId || savedAuth.schoolId;

        // If no explicit schoolId in user doc, find school matching email or promoterEmail or staff permissions
        if (!targetSchoolId && !isPromoter) {
          const matchingSchool = schools.find(s => 
            s.email?.toLowerCase() === email ||
            s.promoterEmail?.toLowerCase() === email ||
            (s.staffRolePermissions && s.staffRolePermissions.some(p => p.email?.toLowerCase() === email))
          );
          if (matchingSchool) {
            targetSchoolId = matchingSchool.id;
          }
        }

        // If target school found, ensure it is unlocked and switched to
        if (targetSchoolId && isMounted) {
          setUnlockedSchoolIds(prev => prev.includes(targetSchoolId) ? prev : [...prev, targetSchoolId]);
          if (targetSchoolId !== currentSchoolId) {
            switchSchool(targetSchoolId);
          }
        }

        // Restore user identity & role
        const resolvedRole = isPromoter ? 'SUPER_ADMIN' : (emailData?.role || savedAuth.role || currentUser.role);
        const resolvedName = emailData?.displayName || savedAuth.displayName || currentUser.name;
        
        if (isMounted) {
          setCurrentUser(prev => ({
            ...prev,
            email: email,
            name: resolvedName,
            role: resolvedRole,
            schoolName: (schools.find(s => s.id === (targetSchoolId || currentSchoolId))?.name) || prev.schoolName
          }));
        }

        // Keep Firestore user record up to date
        saveUserDataByEmailToFirestore(email, {
          email: email,
          schoolId: targetSchoolId || currentSchoolId,
          role: resolvedRole,
          displayName: resolvedName,
          lastActiveAt: new Date().toISOString()
        });
      } catch (err) {
        console.warn("[Email Context Restore Error]:", err);
      }
    };

    restoreUserContextFromEmail();

    return () => {
      isMounted = false;
    };
  }, [schools.length]);

  // Sync state when currentSchoolId changes
  const switchSchool = (targetSchoolId: string) => {
    const savedRegistryRaw = localStorage.getItem(`${LOCAL_STORAGE_KEY_PREFIX}_SCHOOLS_REGISTRY`);
    const savedRegistry: School[] = savedRegistryRaw ? JSON.parse(savedRegistryRaw) : [];

    let targetSchool = schools.find(s => s.id === targetSchoolId || (s as any).officialCode === targetSchoolId) ||
                       savedRegistry.find(s => s.id === targetSchoolId || (s as any).officialCode === targetSchoolId);
    
    if (!targetSchool) {
      const todayIso = new Date().toISOString();
      targetSchool = {
        id: targetSchoolId,
        officialCode: targetSchoolId,
        name: `Établissement Client (${targetSchoolId.slice(-6)})`,
        motto: 'Discipline • Travail • Rigueur',
        schoolType: 'Complexe Scolaire',
        logoUrl: '/icon.svg',
        address: 'Bénin',
        city: 'Cotonou',
        phone: '+229 97 00 00 00',
        email: 'direction@ecole.bj',
        directorName: 'M. le Directeur',
        academicYear: '2025-2026',
        currentTrimester: 1,
        currency: 'FCFA',
        country: 'Bénin',
        countryCode: 'BJ',
        countryFlag: '🇧🇯',
        primaryTeachersCount: 10,
        secondaryProfessorsCount: 15,
        totalStudentsCount: 200,
        createdAt: todayIso.split('T')[0],
        isValidatedByPromoter: true,
        validatedAt: todayIso,
        accessPassword: '12345678',
        dailyAccessPaidUntil: '2099-12-31'
      };
      setSchools(prev => prev.some(s => s.id === targetSchoolId) ? prev : [...prev, targetSchool!]);
    }

    setCurrentSchoolId(targetSchool.id);
    localStorage.setItem(`${LOCAL_STORAGE_KEY_PREFIX}_CURRENT_SCHOOL_ID`, targetSchool.id);

    // Read target school's scoped state from localStorage
    const getTargetScoped = <T,>(key: string, defaultVal: T): T => {
      const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY_PREFIX}_DATA_${targetSchoolId}_${key}`);
      return saved ? JSON.parse(saved) : defaultVal;
    };

    const isTemple = targetSchoolId === 'sch-temple';

    const loadedSettings = getTargetScoped('SETTINGS', {
      ...initialSettings,
      schoolName: targetSchool.name,
      motto: targetSchool.motto,
      logoUrl: targetSchool.logoUrl,
      signatureUrl: targetSchool.signatureUrl || initialSettings.signatureUrl,
      address: targetSchool.address,
      city: targetSchool.city,
      phone: targetSchool.phone,
      email: targetSchool.email,
      academicYear: targetSchool.academicYear,
      currentTrimester: targetSchool.currentTrimester,
      currency: targetSchool.currency,
      accessPassword: targetSchool.accessPassword || '12345678',
      staffRolePermissions: targetSchool.staffRolePermissions || defaultStaffRolePermissions
    });

    const activeName = (loadedSettings.schoolName && loadedSettings.schoolName !== 'GESTIONNAIRE SCOLAIRE')
      ? loadedSettings.schoolName
      : targetSchool.name;

    const initialRoles = loadedSettings.staffRolePermissions || targetSchool.staffRolePermissions || defaultStaffRolePermissions;

    setSettings({
      ...loadedSettings,
      schoolName: cleanSchoolName(activeName),
      motto: cleanMotto(loadedSettings.motto || targetSchool.motto),
      staffRolePermissions: initialRoles,
      accessPassword: loadedSettings.accessPassword || targetSchool.accessPassword || '12345678'
    });

    setCurrentUser(prev => ({
      ...prev,
      schoolName: cleanSchoolName(activeName)
    }));

    setClasses(getTargetScoped('CLASSES', initialClasses));
    setStudents(getTargetScoped('STUDENTS', initialStudents));
    setTeachers(getTargetScoped('TEACHERS', initialTeachers));
    setSubjects(ensurePrimaryAndMaternelleSubjects(getTargetScoped('SUBJECTS', initialSubjects)));
    setGrades(getTargetScoped('GRADES', initialGrades));
    setPayments(getTargetScoped('PAYMENTS', initialPayments));
    setExpenses(getTargetScoped('EXPENSES', initialExpenses));
    setAttendance(getTargetScoped('ATTENDANCE', initialAttendance));
    setTimetable(getTargetScoped('TIMETABLE', initialTimetable));
    setExams(getTargetScoped('EXAMS', initialExams));
    setExamPapers(getTargetScoped('EXAM_PAPERS', initialExamPapers));
    setArchivedReportCards(getTargetScoped('ARCHIVED_REPORT_CARDS', initialArchivedReportCards));
    setHomework(getTargetScoped('HOMEWORK', initialHomework));
    setBooks(getTargetScoped('BOOKS', initialBooks));
    setBookLoans(getTargetScoped('BOOK_LOANS', initialBookLoans));
    setCanteenMenus(getTargetScoped('CANTEEN_MENUS', initialCanteenMenus));
    setCanteenPlans(getTargetScoped('CANTEEN_PLANS', initialCanteenPlans));
    setAdministrativeDocuments(getTargetScoped('ADMINISTRATIVE_DOCUMENTS', initialAdministrativeDocuments));
    setCommunications(getTargetScoped('COMMUNICATIONS', initialCommunications));
    setSchoolSubscription(getTargetScoped('SUBSCRIPTION', initialSchoolSubscription));
    setSubscriptionInvoices(getTargetScoped('INVOICES', initialSubscriptionInvoices));

    // Update current user school context
    setCurrentUser(prev => ({
      ...prev,
      schoolName: targetSchool.name
    }));
  };

  // Save changes to current school's scoped storage
  useEffect(() => {
    localStorage.setItem(`${LOCAL_STORAGE_KEY_PREFIX}_USER_${currentSchoolId}`, JSON.stringify(currentUser));
  }, [currentUser, currentSchoolId]);

  useEffect(() => {
    localStorage.setItem(`${LOCAL_STORAGE_KEY_PREFIX}_DATA_${currentSchoolId}_SETTINGS`, JSON.stringify(settings));
    syncToCloud(currentSchoolId, 'SETTINGS', settings);
    if (settings.darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [settings, currentSchoolId]);

  useEffect(() => {
    localStorage.setItem(`${LOCAL_STORAGE_KEY_PREFIX}_DATA_${currentSchoolId}_CLASSES`, JSON.stringify(classes));
    syncToCloud(currentSchoolId, 'CLASSES', classes);
  }, [classes, currentSchoolId]);

  useEffect(() => {
    localStorage.setItem(`${LOCAL_STORAGE_KEY_PREFIX}_DATA_${currentSchoolId}_STUDENTS`, JSON.stringify(students));
    syncToCloud(currentSchoolId, 'STUDENTS', students);
  }, [students, currentSchoolId]);

  useEffect(() => {
    localStorage.setItem(`${LOCAL_STORAGE_KEY_PREFIX}_DATA_${currentSchoolId}_TEACHERS`, JSON.stringify(teachers));
    syncToCloud(currentSchoolId, 'TEACHERS', teachers);
  }, [teachers, currentSchoolId]);

  useEffect(() => {
    localStorage.setItem(`${LOCAL_STORAGE_KEY_PREFIX}_DATA_${currentSchoolId}_SUBJECTS`, JSON.stringify(subjects));
    syncToCloud(currentSchoolId, 'SUBJECTS', subjects);
  }, [subjects, currentSchoolId]);

  useEffect(() => {
    localStorage.setItem(`${LOCAL_STORAGE_KEY_PREFIX}_DATA_${currentSchoolId}_GRADES`, JSON.stringify(grades));
    syncToCloud(currentSchoolId, 'GRADES', grades);
  }, [grades, currentSchoolId]);

  useEffect(() => {
    localStorage.setItem(`${LOCAL_STORAGE_KEY_PREFIX}_DATA_${currentSchoolId}_PAYMENTS`, JSON.stringify(payments));
    syncToCloud(currentSchoolId, 'PAYMENTS', payments);
  }, [payments, currentSchoolId]);

  useEffect(() => {
    localStorage.setItem(`${LOCAL_STORAGE_KEY_PREFIX}_DATA_${currentSchoolId}_EXPENSES`, JSON.stringify(expenses));
    syncToCloud(currentSchoolId, 'EXPENSES', expenses);
  }, [expenses, currentSchoolId]);

  useEffect(() => {
    localStorage.setItem(`${LOCAL_STORAGE_KEY_PREFIX}_DATA_${currentSchoolId}_ATTENDANCE`, JSON.stringify(attendance));
    syncToCloud(currentSchoolId, 'ATTENDANCE', attendance);
  }, [attendance, currentSchoolId]);

  useEffect(() => {
    localStorage.setItem(`${LOCAL_STORAGE_KEY_PREFIX}_DATA_${currentSchoolId}_TIMETABLE`, JSON.stringify(timetable));
    syncToCloud(currentSchoolId, 'TIMETABLE', timetable);
  }, [timetable, currentSchoolId]);

  useEffect(() => {
    localStorage.setItem(`${LOCAL_STORAGE_KEY_PREFIX}_DATA_${currentSchoolId}_EXAMS`, JSON.stringify(exams));
    syncToCloud(currentSchoolId, 'EXAMS', exams);
  }, [exams, currentSchoolId]);

  useEffect(() => {
    localStorage.setItem(`${LOCAL_STORAGE_KEY_PREFIX}_DATA_${currentSchoolId}_EXAM_PAPERS`, JSON.stringify(examPapers));
    syncToCloud(currentSchoolId, 'EXAM_PAPERS', examPapers);
  }, [examPapers, currentSchoolId]);

  useEffect(() => {
    localStorage.setItem(`${LOCAL_STORAGE_KEY_PREFIX}_DATA_${currentSchoolId}_ARCHIVED_REPORT_CARDS`, JSON.stringify(archivedReportCards));
    syncToCloud(currentSchoolId, 'ARCHIVED_REPORT_CARDS', archivedReportCards);
  }, [archivedReportCards, currentSchoolId]);

  useEffect(() => {
    localStorage.setItem(`${LOCAL_STORAGE_KEY_PREFIX}_DATA_${currentSchoolId}_HOMEWORK`, JSON.stringify(homework));
    syncToCloud(currentSchoolId, 'HOMEWORK', homework);
  }, [homework, currentSchoolId]);

  useEffect(() => {
    localStorage.setItem(`${LOCAL_STORAGE_KEY_PREFIX}_DATA_${currentSchoolId}_BOOKS`, JSON.stringify(books));
    syncToCloud(currentSchoolId, 'BOOKS', books);
  }, [books, currentSchoolId]);

  useEffect(() => {
    localStorage.setItem(`${LOCAL_STORAGE_KEY_PREFIX}_DATA_${currentSchoolId}_BOOK_LOANS`, JSON.stringify(bookLoans));
    syncToCloud(currentSchoolId, 'BOOK_LOANS', bookLoans);
  }, [bookLoans, currentSchoolId]);

  useEffect(() => {
    localStorage.setItem(`${LOCAL_STORAGE_KEY_PREFIX}_DATA_${currentSchoolId}_CANTEEN_MENUS`, JSON.stringify(canteenMenus));
    syncToCloud(currentSchoolId, 'CANTEEN_MENUS', canteenMenus);
  }, [canteenMenus, currentSchoolId]);

  useEffect(() => {
    localStorage.setItem(`${LOCAL_STORAGE_KEY_PREFIX}_DATA_${currentSchoolId}_CANTEEN_PLANS`, JSON.stringify(canteenPlans));
    syncToCloud(currentSchoolId, 'CANTEEN_PLANS', canteenPlans);
  }, [canteenPlans, currentSchoolId]);

  useEffect(() => {
    localStorage.setItem(`${LOCAL_STORAGE_KEY_PREFIX}_DATA_${currentSchoolId}_ADMINISTRATIVE_DOCUMENTS`, JSON.stringify(administrativeDocuments));
    syncToCloud(currentSchoolId, 'ADMINISTRATIVE_DOCUMENTS', administrativeDocuments);
  }, [administrativeDocuments, currentSchoolId]);

  useEffect(() => {
    localStorage.setItem(`${LOCAL_STORAGE_KEY_PREFIX}_DATA_${currentSchoolId}_COMMUNICATIONS`, JSON.stringify(communications));
    syncToCloud(currentSchoolId, 'COMMUNICATIONS', communications);
  }, [communications, currentSchoolId]);

  useEffect(() => {
    localStorage.setItem(`${LOCAL_STORAGE_KEY_PREFIX}_DATA_${currentSchoolId}_SUBSCRIPTION`, JSON.stringify(schoolSubscription));
    syncToCloud(currentSchoolId, 'SUBSCRIPTION', schoolSubscription);
  }, [schoolSubscription, currentSchoolId]);

  useEffect(() => {
    localStorage.setItem(`${LOCAL_STORAGE_KEY_PREFIX}_DATA_${currentSchoolId}_INVOICES`, JSON.stringify(subscriptionInvoices));
    syncToCloud(currentSchoolId, 'INVOICES', subscriptionInvoices);
  }, [subscriptionInvoices, currentSchoolId]);


  // Keep student/teacher stats & settings in sync with school registry entry
  useEffect(() => {
    const pTeachers = teachers.filter(t => t.specialty === 'PRIMAIRE' || t.qualification?.toLowerCase().includes('primaire')).length;
    const sProfs = teachers.length - pTeachers;
    const totalStds = students.length;

    setSchools(prev => prev.map(s => {
      if (s.id === currentSchoolId) {
        return {
          ...s,
          name: settings.schoolName,
          motto: settings.motto,
          logoUrl: settings.logoUrl,
          signatureUrl: settings.signatureUrl,
          address: settings.address,
          city: settings.city,
          phone: settings.phone,
          email: settings.email,
          academicYear: settings.academicYear,
          currency: settings.currency,
          staffRolePermissions: settings.staffRolePermissions,
          primaryTeachersCount: pTeachers,
          secondaryProfessorsCount: sProfs,
          totalStudentsCount: totalStds
        };
      }
      return s;
    }));
  }, [students.length, teachers, settings, currentSchoolId]);

  // Create a brand new School
  const createSchool = (
    schoolData: {
      name: string;
      motto: string;
      schoolType?: string;
      logoUrl: string;
      signatureUrl?: string;
      address: string;
      city: string;
      phone: string;
      email: string;
      directorName: string;
      academicYear: string;
      currentTrimester: 1 | 2 | 3;
      currency: string;
      country?: string;
      countryCode?: string;
      countryFlag?: string;
      accessPassword?: string;
      validationMethod?: 'GMAIL' | 'WHATSAPP';
      promoterEmail?: string;
      promoterPhone?: string;
    },
    populateSampleData: boolean = true
  ): School => {
    const newId = `sch-${Date.now()}`;
    const newPassword = schoolData.accessPassword && schoolData.accessPassword.trim().length === 8
      ? schoolData.accessPassword.trim()
      : generateValidPassword();

    const todayDate = new Date();
    const freeTrialUntil = new Date(todayDate);
    freeTrialUntil.setDate(todayDate.getDate() + 7); // 1 week free usage after 2000f registration
    const freeAccessPaidUntilStr = freeTrialUntil.toISOString().split('T')[0];

    const validationToken = `VAL-${Math.floor(1000 + Math.random() * 9000)}`;
    const promoterEmail = schoolData.promoterEmail || 'mahounouvictor123@gmail.com';
    const promoterPhone = schoolData.promoterPhone || '+229 01 43 75 45 93';
    const validationMethod = schoolData.validationMethod || 'GMAIL';

    const typeStr = (schoolData.schoolType || '').toLowerCase();
    const isPrimaryOnly = typeStr.includes('primaire simple') || (typeStr.includes('primaire') && !typeStr.includes('secondaire') && !typeStr.includes('complexe'));
    const isSecondaryOnly = typeStr.includes('collège') || typeStr.includes('lycée') || (typeStr.includes('secondaire') && !typeStr.includes('primaire') && !typeStr.includes('complexe'));

    const seededClasses = populateSampleData
      ? initialClasses.filter(c => {
          if (isPrimaryOnly) return c.level === 'PRIMAIRE' || c.level === 'MATERNELLE';
          if (isSecondaryOnly) return c.level === 'COLLEGE' || c.level === 'LYCEE';
          return true;
        })
      : [];

    const seededTeachers = populateSampleData
      ? initialTeachers.filter(t => {
          const isPrim = t.qualification?.toLowerCase().includes('primaire') || t.qualification?.toLowerCase().includes('maternelle') || t.qualification?.toLowerCase().includes('ceap') || t.qualification?.toLowerCase().includes('cappe');
          if (isPrimaryOnly) return isPrim;
          if (isSecondaryOnly) return !isPrim;
          return true;
        })
      : [];

    const seededClassIds = new Set(seededClasses.map(c => c.id));
    const seededStudents = populateSampleData
      ? initialStudents.filter(s => seededClassIds.size === 0 || seededClassIds.has(s.classId))
      : [];

    const primaryTeachersCount = seededTeachers.filter(t => t.qualification?.toLowerCase().includes('primaire') || t.qualification?.toLowerCase().includes('maternelle') || t.qualification?.toLowerCase().includes('ceap') || t.qualification?.toLowerCase().includes('cappe')).length;
    const secondaryProfessorsCount = seededTeachers.filter(t => !t.qualification?.toLowerCase().includes('primaire') && !t.qualification?.toLowerCase().includes('maternelle') && !t.qualification?.toLowerCase().includes('ceap') && !t.qualification?.toLowerCase().includes('cappe')).length;

    const newSchool: School = {
      ...schoolData,
      id: newId,
      accessPassword: newPassword,
      primaryTeachersCount: populateSampleData ? primaryTeachersCount : 0,
      secondaryProfessorsCount: populateSampleData ? secondaryProfessorsCount : 0,
      totalStudentsCount: populateSampleData ? seededStudents.length : 0,
      createdAt: todayDate.toISOString().split('T')[0],
      isDemo: false,
      isPasswordProtected: true,
      dailyAccessPaidUntil: freeAccessPaidUntilStr,
      registrationFeePaid: true,
      isValidatedByPromoter: true, // Automatically validated for 1-week free trial
      validationMethod,
      promoterEmail,
      promoterPhone,
      validationToken
    };

    // Save school object to registry
    setSchools(prev => [newSchool, ...prev]);

    // Push notification to Promoter for new school registration
    setPromoterNotifications(prevNotifs => [
      {
        id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        schoolId: newId,
        schoolName: newSchool.name,
        city: newSchool.city || 'Cotonou',
        directorName: schoolData.directorName || 'Directeur / Fondateur',
        phone: newSchool.phone || '+229 00 00 00 00',
        createdAt: todayDate.toISOString(),
        isRead: false
      },
      ...prevNotifs
    ]);

    // Automatically unlock the newly created school for its creator
    setUnlockedSchoolIds(prev => [...prev, newId]);

    // If populateSampleData, seed sample classes & subjects
    if (populateSampleData) {
      localStorage.setItem(`${LOCAL_STORAGE_KEY_PREFIX}_DATA_${newId}_CLASSES`, JSON.stringify(seededClasses));
      localStorage.setItem(`${LOCAL_STORAGE_KEY_PREFIX}_DATA_${newId}_SUBJECTS`, JSON.stringify(initialSubjects));
      localStorage.setItem(`${LOCAL_STORAGE_KEY_PREFIX}_DATA_${newId}_STUDENTS`, JSON.stringify(seededStudents));
      localStorage.setItem(`${LOCAL_STORAGE_KEY_PREFIX}_DATA_${newId}_TEACHERS`, JSON.stringify(seededTeachers));
      localStorage.setItem(`${LOCAL_STORAGE_KEY_PREFIX}_DATA_${newId}_GRADES`, JSON.stringify(initialGrades));
      localStorage.setItem(`${LOCAL_STORAGE_KEY_PREFIX}_DATA_${newId}_PAYMENTS`, JSON.stringify(initialPayments));
    } else {
      localStorage.setItem(`${LOCAL_STORAGE_KEY_PREFIX}_DATA_${newId}_CLASSES`, JSON.stringify([]));
      localStorage.setItem(`${LOCAL_STORAGE_KEY_PREFIX}_DATA_${newId}_SUBJECTS`, JSON.stringify([]));
      localStorage.setItem(`${LOCAL_STORAGE_KEY_PREFIX}_DATA_${newId}_STUDENTS`, JSON.stringify([]));
      localStorage.setItem(`${LOCAL_STORAGE_KEY_PREFIX}_DATA_${newId}_TEACHERS`, JSON.stringify([]));
      localStorage.setItem(`${LOCAL_STORAGE_KEY_PREFIX}_DATA_${newId}_GRADES`, JSON.stringify([]));
      localStorage.setItem(`${LOCAL_STORAGE_KEY_PREFIX}_DATA_${newId}_PAYMENTS`, JSON.stringify([]));
    }

    // Set initial settings for new school
    const newSchoolSettings: SchoolSettings = {
      ...initialSettings,
      schoolName: newSchool.name,
      motto: newSchool.motto,
      logoUrl: newSchool.logoUrl,
      signatureUrl: newSchool.signatureUrl || initialSettings.signatureUrl,
      address: newSchool.address,
      city: newSchool.city,
      phone: newSchool.phone,
      email: newSchool.email,
      academicYear: newSchool.academicYear,
      currentTrimester: newSchool.currentTrimester,
      currency: newSchool.currency,
      accessPassword: newPassword
    };
    localStorage.setItem(`${LOCAL_STORAGE_KEY_PREFIX}_DATA_${newId}_SETTINGS`, JSON.stringify(newSchoolSettings));

    // Switch active school immediately to this newly created school
    switchSchool(newId);

    return newSchool;
  };

  const updateSchool = (schoolId: string, updatedData: Partial<School>) => {
    setSchools(prev => {
      const updated = prev.map(s => s.id === schoolId ? { ...s, ...updatedData } : s);
      localStorage.setItem(`${LOCAL_STORAGE_KEY_PREFIX}_SCHOOLS_REGISTRY`, JSON.stringify(updated));
      syncSchoolsRegistryToCloud(updated);
      return updated;
    });
    if (schoolId === currentSchoolId) {
      updateSettings({
        schoolName: updatedData.name ?? settings.schoolName,
        motto: updatedData.motto ?? settings.motto,
        logoUrl: updatedData.logoUrl ?? settings.logoUrl,
        signatureUrl: updatedData.signatureUrl ?? settings.signatureUrl,
        address: updatedData.address ?? settings.address,
        city: updatedData.city ?? settings.city,
        phone: updatedData.phone ?? settings.phone,
        email: updatedData.email ?? settings.email,
        academicYear: updatedData.academicYear ?? settings.academicYear,
        currency: updatedData.currency ?? settings.currency,
        accessPassword: updatedData.accessPassword ?? settings.accessPassword,
        staffRolePermissions: updatedData.staffRolePermissions ?? settings.staffRolePermissions
      });
    }
  };

  const validateSchoolByPromoter = (
    schoolId: string,
    meta?: {
      name?: string;
      city?: string;
      directorName?: string;
      phone?: string;
      pwd?: string;
    }
  ) => {
    const todayIso = new Date().toISOString();
    const cleanName = meta?.name ? cleanSchoolName(meta.name) : undefined;

    setSchools(prev => {
      const existing = prev.find(s => s.id === schoolId || (s as any).officialCode === schoolId);
      let updatedList: School[];
      if (existing) {
        updatedList = prev.map(s => {
          if (s.id === existing.id || (s as any).officialCode === schoolId) {
            return {
              ...s,
              name: cleanName || s.name,
              city: meta?.city || s.city,
              directorName: meta?.directorName || s.directorName,
              phone: meta?.phone || s.phone,
              accessPassword: meta?.pwd || s.accessPassword,
              isValidatedByPromoter: true,
              isBlocked: false,
              validatedAt: todayIso
            };
          }
          return s;
        });
      } else {
        const name = cleanName || meta?.name || `Établissement Client (${schoolId.slice(-6)})`;
        const city = meta?.city || 'Cotonou';
        const directorName = meta?.directorName || 'M. le Directeur';
        const phone = meta?.phone || '+229 97 00 00 00';
        const pwd = meta?.pwd || '12345678';

        const newRemoteSchool: School = {
          id: schoolId,
          officialCode: schoolId,
          name: name,
          motto: 'Discipline • Travail • Rigueur',
          schoolType: 'Complexe Scolaire',
          logoUrl: '/icon.svg',
          signatureUrl: '',
          address: `${city} - Quartier Administratif`,
          city: city,
          phone: phone,
          email: 'direction@ecole.bj',
          directorName: directorName,
          academicYear: '2025-2026',
          currentTrimester: 1,
          currency: 'FCFA',
          country: 'Bénin',
          countryCode: 'BJ',
          countryFlag: '🇧🇯',
          primaryTeachersCount: 12,
          secondaryProfessorsCount: 18,
          totalStudentsCount: 240,
          createdAt: todayIso.split('T')[0],
          isValidatedByPromoter: true,
          isBlocked: false,
          validatedAt: todayIso,
          accessPassword: pwd,
          dailyAccessPaidUntil: '2099-12-31'
        };

        // Create new notification for promoter
        setPromoterNotifications(nPrev => [
          {
            id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
            schoolId: schoolId,
            schoolName: name,
            city: city,
            directorName: directorName,
            phone: phone,
            createdAt: todayIso,
            isRead: false,
            type: 'NEW_SCHOOL_REGISTERED'
          },
          ...nPrev
        ]);

        updatedList = [...prev, newRemoteSchool];
      }

      localStorage.setItem(`${LOCAL_STORAGE_KEY_PREFIX}_SCHOOLS_REGISTRY`, JSON.stringify(updatedList));
      return updatedList;
    });

    // Ensure target school's scoped datasets exist in localStorage
    if (!localStorage.getItem(`${LOCAL_STORAGE_KEY_PREFIX}_DATA_${schoolId}_CLASSES`)) {
      localStorage.setItem(`${LOCAL_STORAGE_KEY_PREFIX}_DATA_${schoolId}_CLASSES`, JSON.stringify(initialClasses));
    }
    if (!localStorage.getItem(`${LOCAL_STORAGE_KEY_PREFIX}_DATA_${schoolId}_SUBJECTS`)) {
      localStorage.setItem(`${LOCAL_STORAGE_KEY_PREFIX}_DATA_${schoolId}_SUBJECTS`, JSON.stringify(initialSubjects));
    }
    if (!localStorage.getItem(`${LOCAL_STORAGE_KEY_PREFIX}_DATA_${schoolId}_STUDENTS`)) {
      localStorage.setItem(`${LOCAL_STORAGE_KEY_PREFIX}_DATA_${schoolId}_STUDENTS`, JSON.stringify(initialStudents));
    }
    if (!localStorage.getItem(`${LOCAL_STORAGE_KEY_PREFIX}_DATA_${schoolId}_TEACHERS`)) {
      localStorage.setItem(`${LOCAL_STORAGE_KEY_PREFIX}_DATA_${schoolId}_TEACHERS`, JSON.stringify(initialTeachers));
    }
    if (!localStorage.getItem(`${LOCAL_STORAGE_KEY_PREFIX}_DATA_${schoolId}_GRADES`)) {
      localStorage.setItem(`${LOCAL_STORAGE_KEY_PREFIX}_DATA_${schoolId}_GRADES`, JSON.stringify(initialGrades));
    }
    if (!localStorage.getItem(`${LOCAL_STORAGE_KEY_PREFIX}_DATA_${schoolId}_PAYMENTS`)) {
      localStorage.setItem(`${LOCAL_STORAGE_KEY_PREFIX}_DATA_${schoolId}_PAYMENTS`, JSON.stringify(initialPayments));
    }

    // Write target school's scoped SETTINGS to localStorage immediately
    const savedSettingsRaw = localStorage.getItem(`${LOCAL_STORAGE_KEY_PREFIX}_DATA_${schoolId}_SETTINGS`);
    const existingSettings = savedSettingsRaw ? JSON.parse(savedSettingsRaw) : {};
    const updatedSettings = {
      ...initialSettings,
      ...existingSettings,
      schoolName: cleanName || existingSettings.schoolName || `Établissement ${meta?.name || schoolId.slice(-6)}`,
      city: meta?.city || existingSettings.city || 'Cotonou',
      directorName: meta?.directorName || existingSettings.directorName || 'M. le Directeur',
      phone: meta?.phone || existingSettings.phone || '+229 97 00 00 00',
      accessPassword: meta?.pwd || existingSettings.accessPassword || '12345678'
    };
    localStorage.setItem(`${LOCAL_STORAGE_KEY_PREFIX}_DATA_${schoolId}_SETTINGS`, JSON.stringify(updatedSettings));

    if (currentSchoolId === schoolId) {
      updateSettings({
        schoolName: updatedSettings.schoolName,
        directorName: updatedSettings.directorName,
        city: updatedSettings.city,
        phone: updatedSettings.phone,
        accessPassword: updatedSettings.accessPassword
      });
    }

    setUnlockedSchoolIds(prev => prev.includes(schoolId) ? prev : [...prev, schoolId]);
  };

  const deleteSchool = (schoolId: string) => {
    if (schools.length <= 1) return; // Prevent deleting last remaining school
    setSchools(prev => prev.filter(s => s.id !== schoolId));
    if (currentSchoolId === schoolId) {
      const remaining = schools.filter(s => s.id !== schoolId);
      if (remaining.length > 0) {
        switchSchool(remaining[0].id);
      }
    }
  };

  // Role Switcher
  const switchRole = (role: User['role']) => {
    const roleConfig = (settings.staffRolePermissions || currentSchool.staffRolePermissions || defaultStaffRolePermissions).find(r => r.role === role);
    const assignedName = roleConfig?.assignedTo || (
      role === 'SUPER_ADMIN' ? 'Promoteur Général Plateforme' :
      role === 'DIRECTEUR' ? 'M. Le Directeur Général' :
      role === 'CENSEUR' ? 'M. Le Censeur' :
      role === 'SURVEILLANT' ? 'M. Le Surveillant Général' :
      role === 'COMPTABLE' ? 'Mme / M. Le Comptable' :
      role === 'SECRETAIRE' ? 'Secrétaire Administratif' :
      `Utilisateur ${role}`
    );

    const target: User = {
      id: `usr-${role.toLowerCase()}-${Date.now()}`,
      name: assignedName,
      email: roleConfig?.email || `${role.toLowerCase()}@${currentSchool.name.toLowerCase().replace(/[^a-z0-9]/g, '')}.educ`,
      role: role,
      avatar: (demoUsers.find(u => u.role === role)?.avatar) || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=150",
      schoolName: currentSchool.name,
      phone: roleConfig?.phone
    };
    setCurrentUser(target);
  };

  const updateSettings = (newSet: Partial<SchoolSettings>) => {
    setSettings(prev => {
      const next = { ...prev, ...newSet };
      // Save directly to localStorage for current school
      localStorage.setItem(`${LOCAL_STORAGE_KEY_PREFIX}_DATA_${currentSchoolId}_SETTINGS`, JSON.stringify(next));
      syncToCloud(currentSchoolId, 'SETTINGS', next);

      if (newSet.staffRolePermissions) {
        setSchools(sPrev => {
          const updated = sPrev.map(sch => sch.id === currentSchoolId ? { ...sch, staffRolePermissions: newSet.staffRolePermissions } : sch);
          localStorage.setItem(`${LOCAL_STORAGE_KEY_PREFIX}_SCHOOLS_REGISTRY`, JSON.stringify(updated));
          syncSchoolsRegistryToCloud(updated);
          return updated;
        });
      }
      return next;
    });
  };

  // Class actions
  const addClass = (cls: Omit<SchoolClass, 'id'>) => {
    const newCls: SchoolClass = { ...cls, id: `cls-${Date.now()}` };
    setClasses(prev => [...prev, newCls]);
  };

  const updateClass = (id: string, cls: Partial<SchoolClass>) => {
    setClasses(prev => prev.map(c => c.id === id ? { ...c, ...cls } : c));
  };

  const deleteClass = (id: string) => {
    setClasses(prev => prev.filter(c => c.id !== id));
  };

  // Student actions
  const addStudent = (stdData: Omit<Student, 'id'> | (Omit<Student, 'id' | 'registrationNumber'> & { registrationNumber?: string })): Student => {
    const count = students.length + 1;
    const year = settings.academicYear.split('-')[0];
    const prefix = (stdData.level || 'PRIMAIRE').substring(0, 3).toUpperCase();
    const defaultRegNum = `${year}-${prefix}-${count.toString().padStart(3, '0')}`;
    const regNum = (stdData as any).registrationNumber && (stdData as any).registrationNumber.trim().length > 0
      ? (stdData as any).registrationNumber.trim()
      : defaultRegNum;
    const newStudent: Student = {
      ...stdData,
      id: `std-${Date.now()}`,
      registrationNumber: regNum
    };
    setStudents(prev => [...prev, newStudent]);
    
    // Update student count in class
    setClasses(prev => prev.map(c => c.id === stdData.classId ? { ...c, studentCount: c.studentCount + 1 } : c));
    return newStudent;
  };

  const addBulkStudents = (stdsData: Omit<Student, 'id' | 'registrationNumber'>[]): Student[] => {
    const year = settings.academicYear.split('-')[0];
    const created: Student[] = [];
    const classCountAdditions: Record<string, number> = {};

    let currentTotal = students.length;

    stdsData.forEach((stdData, idx) => {
      currentTotal += 1;
      const prefix = (stdData.level || 'COLLEGE').substring(0, 3).toUpperCase();
      const regNum = `${year}-${prefix}-${currentTotal.toString().padStart(3, '0')}`;
      const newStudent: Student = {
        ...stdData,
        id: `std-${Date.now()}-${idx}-${Math.floor(Math.random() * 1000)}`,
        registrationNumber: regNum
      };
      created.push(newStudent);

      if (stdData.classId) {
        classCountAdditions[stdData.classId] = (classCountAdditions[stdData.classId] || 0) + 1;
      }
    });

    setStudents(prev => [...prev, ...created]);

    setClasses(prev => prev.map(c => {
      const add = classCountAdditions[c.id] || 0;
      if (add > 0) {
        return { ...c, studentCount: c.studentCount + add };
      }
      return c;
    }));

    return created;
  };

  const updateStudent = (id: string, std: Partial<Student>) => {
    setStudents(prev => prev.map(s => s.id === id ? { ...s, ...std } : s));
  };

  const deleteStudent = (id: string) => {
    const std = students.find(s => s.id === id);
    if (std) {
      setClasses(prev => prev.map(c => c.id === std.classId ? { ...c, studentCount: Math.max(0, c.studentCount - 1) } : c));
    }
    setStudents(prev => prev.filter(s => s.id !== id));
  };

  // Teacher actions
  const addTeacher = (tch: Omit<Teacher, 'id'>) => {
    const newTeacher: Teacher = { ...tch, id: `tch-${Date.now()}` };
    setTeachers(prev => [...prev, newTeacher]);
  };

  const updateTeacher = (id: string, tch: Partial<Teacher>) => {
    setTeachers(prev => prev.map(t => t.id === id ? { ...t, ...tch } : t));
  };

  const deleteTeacher = (id: string) => {
    setTeachers(prev => prev.filter(t => t.id !== id));
  };

  // Subject actions
  const addSubject = (sbj: Omit<Subject, 'id'>) => {
    const newSbj: Subject = { ...sbj, id: `sbj-${Date.now()}` };
    setSubjects(prev => [...prev, newSbj]);
  };

  const deleteSubject = (id: string) => {
    setSubjects(prev => prev.filter(s => s.id !== id));
  };

  // Grade actions
  const addGrade = (grd: Omit<Grade, 'id'>) => {
    const newGrade: Grade = { ...grd, id: `grd-${Date.now()}` };
    setGrades(prev => [...prev, newGrade]);
  };

  const addBulkGrades = (grds: Omit<Grade, 'id'>[]) => {
    const newGradesWithIds: Grade[] = grds.map((g, idx) => ({ ...g, id: `grd-${Date.now()}-${idx}` }));
    setGrades(prev => [...prev, ...newGradesWithIds]);
  };

  const updateGrade = (id: string, grd: Partial<Grade>) => {
    setGrades(prev => prev.map(g => g.id === id ? { ...g, ...grd } : g));
  };

  const deleteGrade = (id: string) => {
    setGrades(prev => prev.filter(g => g.id !== id));
  };

  // Payment actions
  const addPayment = (pym: Omit<Payment, 'id' | 'receiptNumber'>): Payment => {
    const num = payments.length + 101;
    const year = settings.academicYear.split('-')[0];
    const receiptNumber = `REC-${year}-${num.toString().padStart(5, '0')}`;
    const newPym: Payment = {
      ...pym,
      id: `pym-${Date.now()}`,
      receiptNumber
    };
    setPayments(prev => [newPym, ...prev]);
    return newPym;
  };

  // Expense actions
  const addExpense = (exp: Omit<Expense, 'id'>) => {
    const newExp: Expense = { ...exp, id: `exp-${Date.now()}` };
    setExpenses(prev => [newExp, ...prev]);
  };

  // Attendance actions
  const addAttendanceRecord = (record: Omit<AttendanceRecord, 'id'>) => {
    const newAtt: AttendanceRecord = { ...record, id: `att-${Date.now()}` };
    setAttendance(prev => [newAtt, ...prev]);
  };

  const saveBulkAttendance = (records: Omit<AttendanceRecord, 'id'>[]) => {
    const formatted = records.map((r, i) => ({ ...r, id: `att-${Date.now()}-${i}` }));
    setAttendance(prev => [...formatted, ...prev]);
  };

  // Timetable
  const addTimetableSlot = (slot: Omit<TimetableSlot, 'id'>) => {
    const newSlot: TimetableSlot = { ...slot, id: `tbl-${Date.now()}` };
    setTimetable(prev => [...prev, newSlot]);
  };

  const updateTimetableSlot = (slot: TimetableSlot) => {
    setTimetable(prev => {
      const idx = prev.findIndex(t => t.id === slot.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = slot;
        return next;
      }
      return [...prev, slot];
    });
  };

  const deleteTimetableSlot = (id: string) => {
    setTimetable(prev => prev.filter(t => t.id !== id));
  };

  const replaceClassTimetable = (classId: string, newSlots: (Omit<TimetableSlot, 'id' | 'classId'> & { id?: string; classId?: string })[]) => {
    const formatted: TimetableSlot[] = newSlots.map((s, idx) => ({
      ...s,
      id: s.id || `tbl-${Date.now()}-${idx}`,
      classId
    }));
    setTimetable(prev => [
      ...prev.filter(t => t.classId !== classId),
      ...formatted
    ]);
  };

  // Exams, Exam Papers, Homework, Books
  const addExam = (exam: Omit<Exam, 'id'>) => {
    setExams(prev => [...prev, { ...exam, id: `exm-${Date.now()}` }]);
  };

  const updateExam = (id: string, exam: Partial<Exam>) => {
    setExams(prev => prev.map(e => (e.id === id ? { ...e, ...exam } : e)));
  };

  const deleteExam = (id: string) => {
    setExams(prev => prev.filter(e => e.id !== id));
  };

  const addExamPaper = (paper: Omit<ExamPaper, 'id' | 'createdAt'>): ExamPaper => {
    const newPaper: ExamPaper = {
      ...paper,
      id: `expaper-${Date.now()}`,
      createdAt: new Date().toISOString().split('T')[0]
    };
    setExamPapers(prev => [newPaper, ...prev]);
    return newPaper;
  };

  const updateExamPaper = (paper: ExamPaper) => {
    setExamPapers(prev => prev.map(p => p.id === paper.id ? paper : p));
  };

  const deleteExamPaper = (id: string) => {
    setExamPapers(prev => prev.filter(p => p.id !== id));
  };

  const archiveReportCard = (card: Omit<ArchivedReportCard, 'id' | 'printedAt'>): ArchivedReportCard => {
    const existingIndex = archivedReportCards.findIndex(
      a => a.studentId === card.studentId &&
           a.trimester === card.trimester &&
           a.academicYear === card.academicYear
    );

    const newArchivedCard: ArchivedReportCard = {
      ...card,
      id: existingIndex >= 0 ? archivedReportCards[existingIndex].id : `arc-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      printedAt: new Date().toISOString()
    };

    if (existingIndex >= 0) {
      setArchivedReportCards(prev => {
        const copy = [...prev];
        copy[existingIndex] = newArchivedCard;
        return copy;
      });
    } else {
      setArchivedReportCards(prev => [newArchivedCard, ...prev]);
    }

    return newArchivedCard;
  };

  const deleteArchivedReportCard = (id: string) => {
    setArchivedReportCards(prev => prev.filter(c => c.id !== id));
  };

  const addHomework = (hw: Omit<Homework, 'id'>) => {
    setHomework(prev => [...prev, { ...hw, id: `hwk-${Date.now()}` }]);
  };

  const addBook = (bk: Omit<Book, 'id'>) => {
    setBooks(prev => [...prev, { ...bk, id: `bk-${Date.now()}` }]);
  };

  const updateBook = (id: string, bk: Partial<Book>) => {
    setBooks(prev => prev.map(b => b.id === id ? { ...b, ...bk } : b));
  };

  const deleteBook = (id: string) => {
    setBooks(prev => prev.filter(b => b.id !== id));
  };

  // Book Loans
  const addBookLoan = (loan: Omit<BookLoan, 'id'>) => {
    const newLoan: BookLoan = {
      ...loan,
      id: `ln-${Date.now()}`
    };
    setBookLoans(prev => [newLoan, ...prev]);
    // Decrement available copies if > 0
    setBooks(prev => prev.map(b => {
      if (b.id === loan.bookId && b.availableCopies > 0) {
        return { ...b, availableCopies: b.availableCopies - 1 };
      }
      return b;
    }));
  };

  const updateBookLoan = (id: string, loan: Partial<BookLoan>) => {
    setBookLoans(prev => prev.map(l => l.id === id ? { ...l, ...loan } : l));
  };

  const deleteBookLoan = (id: string) => {
    setBookLoans(prev => prev.filter(l => l.id !== id));
  };

  const returnBookLoan = (loanId: string) => {
    const today = new Date().toISOString().split('T')[0];
    let targetBookId = '';
    setBookLoans(prev => prev.map(l => {
      if (l.id === loanId) {
        targetBookId = l.bookId;
        return {
          ...l,
          returnedDate: today,
          status: 'RETOURNE' as const
        };
      }
      return l;
    }));
    if (targetBookId) {
      setBooks(prev => prev.map(b => {
        if (b.id === targetBookId && b.availableCopies < b.totalCopies) {
          return { ...b, availableCopies: b.availableCopies + 1 };
        }
        return b;
      }));
    }
  };

  // Canteen Menus
  const addCanteenMenu = (menu: Omit<CanteenMenuItem, 'id'>) => {
    const newMenu: CanteenMenuItem = {
      ...menu,
      id: `menu-${Date.now()}`
    };
    setCanteenMenus(prev => [...prev, newMenu]);
  };

  const updateCanteenMenu = (id: string, menu: Partial<CanteenMenuItem>) => {
    setCanteenMenus(prev => prev.map(m => m.id === id ? { ...m, ...menu } : m));
  };

  const deleteCanteenMenu = (id: string) => {
    setCanteenMenus(prev => prev.filter(m => m.id !== id));
  };

  // Canteen Plans
  const addCanteenPlan = (plan: Omit<CanteenPlan, 'id'>) => {
    const newPlan: CanteenPlan = {
      ...plan,
      id: `cnt-${Date.now()}`
    };
    setCanteenPlans(prev => [newPlan, ...prev]);
  };

  const updateCanteenPlan = (id: string, plan: Partial<CanteenPlan>) => {
    setCanteenPlans(prev => prev.map(p => p.id === id ? { ...p, ...plan } : p));
  };

  const deleteCanteenPlan = (id: string) => {
    setCanteenPlans(prev => prev.filter(p => p.id !== id));
  };

  // Administrative Documents
  const addAdministrativeDocument = (doc: Omit<AdministrativeDocument, 'id'>): AdministrativeDocument => {
    const num = administrativeDocuments.length + 1;
    const year = settings.academicYear ? settings.academicYear.split('-')[0] : '2025';
    const docPrefix = doc.type === 'CERTIFICAT_SCOLARITE' ? 'CERT' : doc.type === 'ATTESTATION_FREQUENTATION' ? 'ATT' : 'DOC';
    const docNumber = doc.documentNumber || `${docPrefix}-${year}-${num.toString().padStart(4, '0')}`;
    
    const newDoc: AdministrativeDocument = {
      ...doc,
      id: `doc-${Date.now()}`,
      documentNumber: docNumber
    };
    setAdministrativeDocuments(prev => [newDoc, ...prev]);
    return newDoc;
  };

  const updateAdministrativeDocument = (id: string, doc: Partial<AdministrativeDocument>) => {
    setAdministrativeDocuments(prev => prev.map(d => d.id === id ? { ...d, ...doc } : d));
  };

  const deleteAdministrativeDocument = (id: string) => {
    setAdministrativeDocuments(prev => prev.filter(d => d.id !== id));
  };

  // Communications
  const addCommunication = (msg: Omit<CommunicationMessage, 'id' | 'sentAt' | 'deliveryCount' | 'status'>) => {
    const now = new Date();
    const formattedTime = now.toISOString().replace('T', ' ').substring(0, 16);
    const newMsg: CommunicationMessage = {
      ...msg,
      id: `msg-${Date.now()}`,
      sentAt: formattedTime,
      deliveryCount: Math.floor(Math.random() * 200) + 50,
      status: 'LIVRE'
    };
    setCommunications(prev => [newMsg, ...prev]);
  };

  // Subscriptions
  const updateSchoolSubscription = (planId: string, billingCycle: 'MONTHLY' | 'ANNUAL', paymentMethod: any) => {
    const plan = subscriptionPlans.find(p => p.id === planId) || subscriptionPlans[1];
    const price = billingCycle === 'ANNUAL' ? plan.priceAnnual : plan.priceMonthly;
    const now = new Date();
    const startDate = now.toISOString().split('T')[0];
    
    const nextYear = new Date(now);
    if (billingCycle === 'ANNUAL') {
      nextYear.setFullYear(now.getFullYear() + 1);
    } else {
      nextYear.setMonth(now.getMonth() + 1);
    }
    const nextRenewalDate = nextYear.toISOString().split('T')[0];

    const updatedSub: SchoolSubscription = {
      id: `sub-${currentSchoolId}-${Date.now()}`,
      planId: plan.id,
      planName: plan.name,
      status: 'ACTIVE',
      billingCycle,
      startDate,
      nextRenewalDate,
      amountPaid: price,
      currency: settings.currency || 'FCFA',
      paymentMethod,
      smsUsedThisMonth: schoolSubscription.smsUsedThisMonth || 0,
      aiScansUsedThisMonth: schoolSubscription.aiScansUsedThisMonth || 0,
      storageUsedGb: schoolSubscription.storageUsedGb || 1.2
    };

    setSchoolSubscription(updatedSub);

    // Generate new invoice
    const newInvoice: SubscriptionInvoice = {
      id: `inv-${Date.now()}`,
      invoiceNumber: `FACT-${currentSchool.id.toUpperCase().replace('SCH-', '')}-${new Date().getFullYear()}-${Math.floor(Math.random() * 900) + 100}`,
      date: startDate,
      planName: `${plan.name} (${billingCycle === 'ANNUAL' ? '1 An' : '1 Mois'})`,
      amount: price,
      currency: settings.currency || 'FCFA',
      period: `${startDate} au ${nextRenewalDate}`,
      paymentMethod: paymentMethod === 'MOBILE_MONEY' ? 'Mobile Money (MTN / Moov / Orange / Wave)' : paymentMethod === 'CARTE_BANCAIRE' ? 'Carte Bancaire Visa/Mastercard' : 'Virement Bancaire',
      status: 'PAYÉ'
    };

    setSubscriptionInvoices(prev => [newInvoice, ...prev]);
  };

  const adminSetSchoolSubscription = (schoolId: string, planId: string, isDeactivating: boolean = false) => {
    const targetSchool = schools.find(s => s.id === schoolId);
    if (!targetSchool) return;

    if (isDeactivating) {
      toggleSchoolAccessProtection(schoolId, true);
      setUnlockedSchoolIds(prev => prev.filter(id => id !== schoolId));

      const expiredSub: SchoolSubscription = {
        id: `sub-${schoolId}-${Date.now()}`,
        planId: planId || 'plan-monthly',
        planName: 'Abonnement Suspendu / Bloqué',
        status: 'EXPIRED',
        billingCycle: 'MONTHLY',
        startDate: new Date().toISOString().split('T')[0],
        nextRenewalDate: new Date().toISOString().split('T')[0],
        amountPaid: 0,
        currency: 'FCFA',
        paymentMethod: 'MOBILE_MONEY',
        smsUsedThisMonth: 0,
        aiScansUsedThisMonth: 0,
        storageUsedGb: 0.5
      };

      localStorage.setItem(`${LOCAL_STORAGE_KEY_PREFIX}_DATA_${schoolId}_SUBSCRIPTION`, JSON.stringify(expiredSub));
      if (schoolId === currentSchoolId) {
        setSchoolSubscription(expiredSub);
      }
      return;
    }

    const plan = subscriptionPlans.find(p => p.id === planId) || subscriptionPlans[2];
    const now = new Date();
    const startDate = now.toISOString().split('T')[0];

    const renewalDate = new Date(now);
    if (plan.id === 'plan-daily') {
      renewalDate.setDate(now.getDate() + 1);
    } else if (plan.id === 'plan-weekly') {
      renewalDate.setDate(now.getDate() + 7);
    } else if (plan.id === 'plan-monthly') {
      renewalDate.setDate(now.getDate() + 30);
    } else if (plan.id === 'plan-annual') {
      renewalDate.setDate(now.getDate() + 365);
    } else {
      renewalDate.setDate(now.getDate() + 30);
    }
    const nextRenewalDate = renewalDate.toISOString().split('T')[0];

    const updatedSub: SchoolSubscription = {
      id: `sub-${schoolId}-${Date.now()}`,
      planId: plan.id,
      planName: plan.name,
      status: 'ACTIVE',
      billingCycle: plan.id === 'plan-annual' ? 'ANNUAL' : 'MONTHLY',
      startDate,
      nextRenewalDate,
      amountPaid: plan.priceMonthly,
      currency: 'FCFA',
      paymentMethod: 'MOBILE_MONEY',
      smsUsedThisMonth: 0,
      aiScansUsedThisMonth: 0,
      storageUsedGb: 1.0
    };

    toggleSchoolAccessProtection(schoolId, false);
    validateSchoolByPromoter(schoolId);
    setUnlockedSchoolIds(prev => prev.includes(schoolId) ? prev : [...prev, schoolId]);

    localStorage.setItem(`${LOCAL_STORAGE_KEY_PREFIX}_DATA_${schoolId}_SUBSCRIPTION`, JSON.stringify(updatedSub));
    if (schoolId === currentSchoolId) {
      setSchoolSubscription(updatedSub);
    }

    const newInvoice: SubscriptionInvoice = {
      id: `inv-${Date.now()}`,
      invoiceNumber: `FACT-OFFLINE-${schoolId.toUpperCase().replace('SCH-', '')}-${Math.floor(Math.random() * 900) + 100}`,
      date: startDate,
      planName: `${plan.name} (Validation Hors-Plateforme Mobile Money)`,
      amount: plan.priceMonthly,
      currency: 'FCFA',
      period: `${startDate} au ${nextRenewalDate}`,
      paymentMethod: 'Capture / Dépôt Mobile Money (Validation Administration)',
      status: 'PAYÉ'
    };

    const savedInvoicesRaw = localStorage.getItem(`${LOCAL_STORAGE_KEY_PREFIX}_DATA_${schoolId}_INVOICES`);
    const existingInvoices = savedInvoicesRaw ? JSON.parse(savedInvoicesRaw) : (schoolId === 'sch-temple' ? initialSubscriptionInvoices : []);
    const updatedInvoices = [newInvoice, ...existingInvoices];
    localStorage.setItem(`${LOCAL_STORAGE_KEY_PREFIX}_DATA_${schoolId}_INVOICES`, JSON.stringify(updatedInvoices));
    if (schoolId === currentSchoolId) {
      setSubscriptionInvoices(updatedInvoices);
    }
  };

  const executePromoterRemoteCommands = (actions: Array<{
    actionType: string;
    schoolIds: string[];
    params?: any;
  }>): { success: boolean; modifiedCount: number; summary: string } => {
    if (!Array.isArray(actions) || actions.length === 0) {
      return { success: true, modifiedCount: 0, summary: "Aucun ordre à exécuter." };
    }

    const todayIso = new Date().toISOString();
    const todayStr = todayIso.split('T')[0];
    const modifiedIds = new Set<string>();

    setSchools(prev => {
      let updated = [...prev];

      actions.forEach(act => {
        const { actionType, schoolIds, params } = act;
        const targetIds = (Array.isArray(schoolIds) && schoolIds.length > 0)
          ? schoolIds
          : updated.map(s => s.id);

        updated = updated.map(s => {
          if (!targetIds.includes(s.id) && !targetIds.includes((s as any).officialCode)) {
            return s;
          }

          modifiedIds.add(s.id);

          if (actionType === 'BLOCK_SCHOOL') {
            return {
              ...s,
              isBlocked: true,
              isValidatedByPromoter: false,
              blockReason: params?.reason || "Abonnement requis ou non réglé - Accès suspendu à distance par le Promoteur Général",
              blockedAt: todayIso
            };
          }

          if (actionType === 'UNBLOCK_SCHOOL') {
            return {
              ...s,
              isBlocked: false,
              isValidatedByPromoter: true,
              blockReason: undefined,
              blockedAt: undefined
            };
          }

          if (actionType === 'GRANT_VIP_ACCESS' || actionType === 'EXTEND_TRIAL') {
            const daysToAdd = Number(params?.days) || 30;
            const currentExpiry = s.dailyAccessPaidUntil ? new Date(s.dailyAccessPaidUntil) : new Date();
            const baseDate = currentExpiry > new Date() ? currentExpiry : new Date();
            baseDate.setDate(baseDate.getDate() + daysToAdd);
            const newExpiryStr = baseDate.toISOString().split('T')[0];

            return {
              ...s,
              isBlocked: false,
              isValidatedByPromoter: true,
              dailyAccessPaidUntil: newExpiryStr,
              blockReason: undefined
            };
          }

          if (actionType === 'SET_PASSWORD_PROTECTION') {
            return {
              ...s,
              isPasswordProtected: params?.isProtected !== false
            };
          }

          if (actionType === 'SET_CUSTOM_PASSWORD') {
            return {
              ...s,
              accessPassword: params?.newPassword || s.accessPassword
            };
          }

          if (actionType === 'BROADCAST_ALERT') {
            return {
              ...s,
              promoterBroadcastAlert: params?.alertMessage || ""
            };
          }

          return s;
        });
      });

      localStorage.setItem(`${LOCAL_STORAGE_KEY_PREFIX}_SCHOOLS_REGISTRY`, JSON.stringify(updated));
      syncSchoolsRegistryToCloud(updated);
      return updated;
    });

    const summary = `${modifiedIds.size} établissement(s) synchronisé(s) et mis à jour à distance avec succès.`;
    return {
      success: true,
      modifiedCount: modifiedIds.size,
      summary
    };
  };

  const resetToDefaultData = () => {
    localStorage.clear();
    setSchools(initialSchools);
    setCurrentSchoolId(initialSchools[0].id);
    setSettings(initialSettings);
    setCurrentUser(demoUsers[1]);
    setClasses(initialClasses);
    setStudents(initialStudents);
    setTeachers(initialTeachers);
    setSubjects(initialSubjects);
    setGrades(initialGrades);
    setPayments(initialPayments);
    setExpenses(initialExpenses);
    setAttendance(initialAttendance);
    setTimetable(initialTimetable);
    setExams(initialExams);
    setHomework(initialHomework);
    setBooks(initialBooks);
    setCommunications(initialCommunications);
  };

  return (
    <AppContext.Provider
      value={{
        schools,
        currentSchoolId,
        currentSchool,
        switchSchool,
        unlockedSchoolIds,
        unlockSchool,
        lockSchool,
        isSchoolUnlocked,
        toggleSchoolAccessProtection,
        createSchool,
        validateSchoolByPromoter,
        toggleSchoolBlockStatus,
        promoterNotifications,
        markPromoterNotificationAsRead,
        clearPromoterNotifications,
        updateSchool,
        deleteSchool,

        currentUser,
        setCurrentUser,
        switchRole,
        isAuthenticated,
        loginUser,
        logoutUser,

        settings,
        updateSettings,

        classes,
        addClass,
        updateClass,
        deleteClass,

        students,
        addStudent,
        addBulkStudents,
        updateStudent,
        deleteStudent,

        teachers,
        addTeacher,
        updateTeacher,
        deleteTeacher,

        subjects,
        addSubject,
        deleteSubject,

        grades,
        addGrade,
        addBulkGrades,
        updateGrade,
        deleteGrade,

        payments,
        addPayment,

        expenses,
        addExpense,

        attendance,
        addAttendanceRecord,
        saveBulkAttendance,

        timetable,
        addTimetableSlot,
        updateTimetableSlot,
        deleteTimetableSlot,
        replaceClassTimetable,

        exams,
        addExam,
        updateExam,
        deleteExam,

        examPapers,
        addExamPaper,
        updateExamPaper,
        deleteExamPaper,

        archivedReportCards,
        archiveReportCard,
        deleteArchivedReportCard,

        homework,
        addHomework,

        books,
        addBook,
        updateBook,
        deleteBook,

        bookLoans,
        addBookLoan,
        updateBookLoan,
        deleteBookLoan,
        returnBookLoan,

        canteenMenus,
        addCanteenMenu,
        updateCanteenMenu,
        deleteCanteenMenu,

        canteenPlans,
        addCanteenPlan,
        updateCanteenPlan,
        deleteCanteenPlan,

        administrativeDocuments,
        addAdministrativeDocument,
        updateAdministrativeDocument,
        deleteAdministrativeDocument,

        transportRoutes,

        communications,
        addCommunication,

        subscriptionPlans,
        schoolSubscription,
        subscriptionInvoices,
        updateSchoolSubscription,
        adminSetSchoolSubscription,
        isDailyAccessValid,
        validateDailyAccessPayment,
        cancelDailyAccessPayment,
        executePromoterRemoteCommands,

        campaigns,
        createCampaign,
        updateCampaign,
        deleteCampaign,
        registerSchoolViaCampaign,
        approveSchoolByPromoter,
        rejectSchoolByPromoter,

        resetToDefaultData
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp doit être utilisé au sein d\'un AppProvider');
  }
  return context;
};
