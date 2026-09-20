export type UserRole =
  | 'SUPER_ADMIN'
  | 'DIRECTEUR'
  | 'CENSEUR'
  | 'SURVEILLANT'
  | 'COMPTABLE'
  | 'SECRETAIRE'
  | 'ENSEIGNANT'
  | 'PARENT'
  | 'ELEVE';

export type StaffRoleType = 'DIRECTEUR' | 'CENSEUR' | 'SURVEILLANT' | 'COMPTABLE' | 'SECRETAIRE';

export interface StaffRoleConfig {
  role: StaffRoleType;
  title: string;
  description: string;
  accessCode: string; // e.g. "DIR-8842", "CENS-3021", "COMPT-5510", "SEC-1490" or 4-8 chars code
  allowedViews: string[]; // List of view IDs allowed (e.g. ['dashboard', 'students', 'grades'])
  isEnabled: boolean;
  assignedTo?: string; // Nom et prénom de la personne assignée
  phone?: string; // Numéro de téléphone WhatsApp
  email?: string; // Adresse email officielle
  lastGeneratedAt?: string; // Date de génération du code secret
  notes?: string; // Remarques ou observations
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar: string;
  phone?: string;
  schoolName?: string;
  studentId?: string; // If user is student
  childrenIds?: string[]; // If user is parent
  classId?: string; // If student or main teacher
}

export type SchoolLevel = 'MATERNELLE' | 'PRIMAIRE' | 'COLLEGE' | 'LYCEE' | 'UNIVERSITE' | 'FORMATION';

export interface TuitionTranche {
  id: string;
  name: string;
  amount: number;
  dueDate: string;
  description?: string;
}

export interface SchoolClass {
  id: string;
  name: string;
  level: SchoolLevel;
  stream: string; // Filière / Section ex: "Scientifique", "Littéraire", "Général", "Master CS"
  room: string;
  capacity: number;
  mainTeacherId?: string;
  studentCount: number;
  tuitionFee: number;
  registrationFee?: number;
  tranches?: TuitionTranche[];
}

export interface Student {
  id: string;
  registrationNumber: string; // Matricule ex: "2025-MAT-042"
  firstName: string;
  lastName: string;
  photoUrl: string;
  gender: 'M' | 'F';
  dateOfBirth: string;
  placeOfBirth: string;
  classId: string;
  level: SchoolLevel;
  parentName: string;
  parentPhone: string;
  parentEmail: string;
  address: string;
  status: 'ACTIF' | 'TRANSFERE' | 'ABANDON' | 'EXCLU';
  enrollmentDate: string;
  medicalNotes?: string;
  bloodGroup?: string;
  parentSubscriptionStatus?: 'actif' | 'expire' | 'inactif';
  parentSubscriptionExpiresAt?: string;
  parentLastReceiptCode?: string;
}

export interface Teacher {
  id: string;
  firstName: string;
  lastName: string;
  photoUrl: string;
  email: string;
  phone: string;
  subjects: string[]; // Subject IDs or Names
  classIds: string[];
  salary: number;
  hireDate: string;
  status: 'ACTIF' | 'CONGE' | 'INACTIF';
  qualification: string;
  specialty?: 'PRIMAIRE' | 'SECONDAIRE' | 'MATERNELLE' | 'COLLEGE' | 'LYCEE' | string;
  cycle?: 'MATERNELLE' | 'PRIMAIRE' | 'COLLEGE' | 'LYCEE' | 'SECONDAIRE' | string;
  teacherTitle?: 'MAITRE' | 'MAITRESSE' | 'PROFESSEUR' | string;
  cnssNumber?: string;
}

export interface Subject {
  id: string;
  code: string;
  name: string;
  category: 'LITTERAIRE' | 'SCIENTIFIQUE' | 'TECHNIQUE' | 'LANGUE' | 'DIVERS';
  coefficient: number;
  level: SchoolLevel;
}

export type ExamType = 'INTERRO' | 'DEVOIR' | 'COMPOSITION' | 'TP' | 'PROJET';

export interface Grade {
  id: string;
  studentId: string;
  subjectId: string;
  classId: string;
  trimester: 1 | 2 | 3 | number;
  examType: ExamType;
  mark: number;
  maxMark?: number;
  date: string;
  coefficient: number;
  createdAt?: string; // ISO date string for 3-day modification limit
  updatedAt?: string;
  teacherName?: string;
  teacherId?: string;
  comment?: string;
  isLockedByDeadline?: boolean;
}

export interface ReportCard {
  id: string;
  studentId: string;
  classId: string;
  trimester: 1 | 2 | 3;
  academicYear: string;
  overallAverage: number;
  rank: number;
  totalStudentsInClass: number;
  conduct: string;
  teacherAppreciation: string;
  principalAppreciation: string;
  generatedAt: string;
}

export interface ArchivedReportCard {
  id: string;
  studentId: string;
  studentName: string;
  registrationNumber: string;
  photoUrl?: string;
  classId: string;
  className: string;
  trimester: 1 | 2 | 3;
  academicYear: string;
  overallAverage: number;
  rank: string | number;
  totalStudentsInClass: number;
  mention: string;
  generalAppreciation?: string;
  printedAt: string;
  printedBy?: string;
  qrCodeData?: string;
  schoolName?: string;
  bulletinTemplateName?: string;
}

export interface Payment {
  id: string;
  studentId: string;
  receiptNumber: string;
  amountPaid: number;
  paymentType: 'INSCRIPTION' | 'SCOLARITE' | 'CANTINE' | 'TRANSPORT' | 'EXAMEN';
  paymentMethod: 'ESPECES' | 'CHEQUE' | 'VIREMENT' | 'MOBILE_MONEY';
  date: string;
  trimester: 1 | 2 | 3;
  totalFee: number;
  remainingBalance: number;
  notes?: string;
  recordedBy: string;
}

export interface Expense {
  id: string;
  title: string;
  category: 'SALAIRES' | 'FOURNITURES' | 'MAINTENANCE' | 'EQUIPEMENT' | 'EVENEMENT' | 'FACTURES' | 'AUTRE';
  amount: number;
  date: string;
  recipient: string;
  approvedBy: string;
  notes?: string;
}

export interface AttendanceRecord {
  id: string;
  date: string;
  entityType: 'STUDENT' | 'TEACHER';
  entityId: string; // Student ID or Teacher ID
  classId?: string;
  status: 'PRESENT' | 'ABSENT' | 'RETARD' | 'EXCUSE';
  minutesLate?: number;
  reason?: string;
}

export interface TimetableSlot {
  id: string;
  classId: string;
  dayOfWeek?: 'Lundi' | 'Mardi' | 'Mercredi' | 'Jeudi' | 'Vendredi' | 'Samedi' | string;
  day?: string;
  startTime: string; // ex "08:00" ou "08h00"
  endTime: string;   // ex "10:00" ou "10h00"
  subjectId?: string;
  teacherId?: string;
  room?: string;
  roomNumber?: string;
  customSubject?: string;
  customTeacher?: string;
  notes?: string;
}

export interface AttachedTimetableDocument {
  id: string;
  classId: string; // or 'ALL'
  title: string;
  fileType: 'PDF' | 'IMAGE' | 'EXCEL' | 'WORD' | 'OTHER';
  fileUrl: string;
  fileName: string;
  fileSize?: string;
  uploadedAt: string;
  uploadedBy?: string;
  academicYear?: string;
  notes?: string;
}

export interface Exam {
  id: string;
  title: string;
  subjectId: string;
  classId: string;
  date: string;
  time: string;
  duration?: string;
  durationMinutes?: number;
  room?: string;
  roomNumber?: string;
  coefficient: number;
  trimester?: 1 | 2 | 3 | number;
  examType?: 'DEVOIR' | 'COMPOSITION' | 'EXAMEN_BLANC' | 'INTERRO' | 'EXAMEN_OFFICIEL' | string;
  supervisorName?: string;
  instructions?: string;
}

export interface Homework {
  id: string;
  classId: string;
  subjectId: string;
  teacherId: string;
  title: string;
  description: string;
  assignedDate: string;
  dueDate: string;
}

export interface Book {
  id: string;
  title: string;
  author: string;
  isbn: string;
  category: string;
  totalCopies: number;
  availableCopies: number;
  publishedYear?: string;
  shelfLocation?: string;
  description?: string;
}

export interface BookLoan {
  id: string;
  bookId: string;
  bookTitle?: string;
  studentId: string;
  studentName?: string;
  studentClass?: string;
  loanDate: string;
  dueDate: string;
  returnedDate?: string;
  status: 'EN_COURS' | 'RETOURNE' | 'EN_RETARD';
  notes?: string;
}

export interface CanteenMenuItem {
  id: string;
  day: 'Lundi' | 'Mardi' | 'Mercredi' | 'Jeudi' | 'Vendredi' | 'Samedi' | string;
  dish: string;
  accompaniment?: string;
  dessert?: string;
  drink?: string;
  beverage?: string;
  price?: number;
  allergens?: string;
  notes?: string;
}

export interface CanteenPlan {
  id: string;
  name?: string;
  studentId: string;
  studentName?: string;
  className?: string;
  planType?: 'JOURNALIER' | 'MENSUEL' | 'TRIMESTRIEL' | 'ANNUEL';
  price?: number;
  mealsPerWeek?: number;
  description?: string;
  dietaryRestrictions?: string;
  dietaryNotes?: string;
  status?: 'PAYE' | 'EN_ATTENTE' | 'EXPIRATION' | 'ACTIF' | 'ACTIVE' | 'SUSPENDED' | 'EXPIRED';
  startDate?: string;
  endDate?: string;
  amountPaid?: number;
  mealCountToday?: number;
}

export interface TransportRoute {
  id: string;
  routeName: string;
  busNumber: string;
  driverName: string;
  driverPhone: string;
  capacity: number;
  monthlyFee: number;
  registeredStudentCount: number;
  stops: string[];
}

export interface CommunicationMessage {
  id: string;
  senderName: string;
  recipientGroup: 'PARENTS' | 'ENSEIGNANTS' | 'CLASSE' | 'TOUS';
  channel: 'SMS' | 'WHATSAPP' | 'EMAIL' | 'INTERNAL';
  subject: string;
  content: string;
  sentAt: string;
  deliveryCount: number;
  status: 'LIVRE' | 'EN_COURS' | 'ECHEC';
}

export type ParentComplaintCategory = 
  | 'PLAINTE' 
  | 'SUGGESTION' 
  | 'ABSENCE' 
  | 'QUESTION' 
  | 'URGENCE' 
  | 'SANTE' 
  | 'PEDAGOGIE'
  | 'FINANCE'
  | 'DISCIPLINE'
  | 'AUTRE';

export interface ParentComplaintMessage {
  id: string;
  schoolId: string;
  studentId: string;
  studentName: string;
  studentClass: string;
  parentName: string;
  parentPhone: string;
  category: ParentComplaintCategory;
  subject: string;
  messageText?: string;
  audioUrl?: string; // Audio Base64 / Blob data URL
  audioDurationSeconds?: number;
  photoUrl?: string; // Attached Photo Base64 data URL
  photoName?: string;
  status: 'NOUVEAU' | 'EN_COURS' | 'RESOLU' | 'ARCHIVE';
  priority?: 'NORMALE' | 'HAUTE' | 'URGENTE';
  createdAt: string; // ISO date string
  schoolReply?: string;
  repliedAt?: string;
  repliedBy?: string;
  isReadBySchool: boolean;
}

export interface AdministrativeDocument {
  id: string;
  studentId: string;
  studentName?: string;
  studentBirthDate?: string;
  studentBirthPlace?: string;
  className?: string;
  type: 'CERTIFICAT_SCOLARITE' | 'ATTESTATION_FREQUENTATION' | 'RELEVE_NOTES' | 'CARTE_SCOLAIRE' | 'ATTESTATION_INSCRIPTION' | 'CERTIFICAT_RADIATION' | 'AUTRE';
  documentNumber: string;
  issueDate: string;
  academicYear?: string;
  conductAppraisal?: string;
  notes?: string;
  status?: string;
  reason?: string; // e.g. "Pour servir et valoir ce que de droit"
  directorName?: string;
  observations?: string;
  studentNameOverride?: string;
  classOverride?: string;
  dateOfBirthOverride?: string;
  placeOfBirthOverride?: string;
  customHeaderTitle?: string;
  showStamp?: boolean;
}

export interface BulletinTemplate {
  id: string;
  templateName: string; // e.g. "Modèle Officiel Bénin (Pondéré Coeffs)", "Modèle Lycée (Interro + Devoir + Compo x 2)"
  scannedImageUrl?: string;
  calculationFormula: 'WEIGHTED_COEFFICIENTS' | 'INTERRO_DEVOIR_COMPO' | 'PRIMARY_SIMPLE_AVERAGE' | 'CUSTOM';
  columns: {
    showInterroAverage: boolean;
    showDevoirMark: boolean;
    showCompoMark: boolean;
    showCoefficients: boolean;
    showSubjectRank: boolean;
    showTeacherAppreciation: boolean;
  };
  maxMarkScale: number; // default 20
  honorRollThreshold: number; // default 14
  encouragementThreshold: number; // default 12
  passingThreshold: number; // default 10
  showClassStatistics: boolean;
  showClassRank: boolean;
  headerTitle: string; // e.g. "BULLETIN TRIMESTRIEL DE NOTES"
  directorTitle: string; // e.g. "Le Directeur Général"
  scannedAt?: string;
}

export interface School {
  id: string;
  officialCode?: string;
  name: string;
  motto: string;
  schoolType?: string; // e.g. 'Complexe Scolaire', 'Lycée', 'Collège', 'École Primaire', 'Maternelle'
  logoUrl: string;
  signatureUrl?: string;
  examHeaderUrl?: string; // Scanned official exam header image or custom badge
  bulletinTemplate?: BulletinTemplate; // Scanned bulletin model & calculation formula
  ministryHeader?: string;
  regionalDirection?: string;
  address: string;
  city: string;
  phone: string;
  email: string;
  directorName: string;
  academicYear: string;
  currentTrimester: 1 | 2 | 3;
  currency: string;
  country?: string; // e.g. "Bénin", "Côte d'Ivoire", "Sénégal"
  countryCode?: string; // e.g. "BJ", "CI", "SN"
  countryFlag?: string; // e.g. "🇧🇯", "🇨🇮", "🇸🇳"
  primaryColor?: string;
  accentColor?: string;
  primaryTeachersCount: number;
  secondaryProfessorsCount: number;
  totalStudentsCount: number;
  createdAt: string;
  isDemo?: boolean;
  accessPassword?: string; // 8-character access password
  staffRolePermissions?: StaffRoleConfig[]; // Granular role codes & window permissions configured by director
  isPasswordProtected?: boolean; // Super Admin toggle: true = password required, false = free access granted
  fedapayPublicKey?: string;
  fedapaySecretKey?: string;
  kkiapayPublicKey?: string;
  kkiapaySecretKey?: string;
  mobileMoneyNumber?: string;
  activePaymentGateway?: 'FEDAPAY' | 'KKIAPAY' | 'MOMO_DIRECT';
  enableOnlineTransactions?: boolean;
  dailyAccessPaidUntil?: string; // YYYY-MM-DD date string indicating valid daily access
  lastPaymentPhone?: string;
  lastPaymentDate?: string;
  registrationFeePaid?: boolean;
  isValidatedByPromoter?: boolean; // Whether the school has been officially validated by the promoter
  validationMethod?: 'GMAIL' | 'WHATSAPP'; // Choice of validation channel
  promoterEmail?: string; // Promoter Gmail address for validation
  promoterPhone?: string; // Promoter WhatsApp number (01 43 75 45 93)
  validationToken?: string; // Unique validation token
  validatedAt?: string; // ISO date string of promoter validation
  isBlocked?: boolean; // Whether access has been blocked by promoter
  blockReason?: string; // Motif de blocage à distance
  blockedAt?: string; // Date de blocage à distance
  promoterBroadcastAlert?: string; // Message ou directive urgente du Promoteur
  campaignId?: string; // ID de la campagne d'inscription
  campaignCode?: string; // Code de la campagne (ex: CAMP-RENTREE-2025)
  approvalStatus?: 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED'; // Statut d'autorisation par le promoteur
  registeredViaCampaign?: boolean; // Vrai si inscrite par un lien de campagne
  registrationDate?: string;
  approvedAt?: string;
  approvedBy?: string;
  promoterNotes?: string;
  monthlyActivatedParentsCount?: number;
  totalActivatedParentsCount?: number;
}

export interface RegistrationCampaign {
  id: string;
  code: string; // e.g. "CAMP-RENTREE-2025", "CAMP-OUEME-COTONOU"
  name: string; // e.g. "Campagne Rentrée Scolaire 2025-2026"
  targetRegion: string; // e.g. "Littoral & Atlantique (Cotonou, Calavi)"
  description?: string;
  proposedPlanId?: string; // e.g. "plan-monthly", "plan-annual", "plan-weekly"
  freeTrialDays?: number; // default: 30
  status: 'ACTIVE' | 'PAUSED' | 'ARCHIVED';
  createdAt: string;
  expiresAt?: string;
  registrationsCount: number;
  approvedCount: number;
  welcomeMessage?: string; // Message d'accueil pour les directeurs
  commissionRate?: number; // Taux de commission partenaire (%)
}

export interface PromoterNotification {
  id: string;
  schoolId: string;
  schoolName: string;
  city: string;
  directorName: string;
  phone: string;
  createdAt: string;
  isRead: boolean;
  type: 'NEW_SCHOOL_REGISTERED' | 'ACCESS_REQUEST' | 'CAMPAIGN_REGISTRATION';
  campaignCode?: string;
}

export interface SchoolSettings {
  schoolName: string;
  directorName?: string;
  motto: string;
  logoUrl: string;
  signatureUrl: string;
  examHeaderUrl?: string; // Scanned official exam header image
  bulletinTemplate?: BulletinTemplate; // Scanned bulletin model & calculation formula
  ministryHeader?: string;
  regionalDirection?: string;
  address: string;
  city: string;
  phone: string;
  email: string;
  academicYear: string;
  currentTrimester: 1 | 2 | 3;
  currency: string; // ex "FCFA" or "€" or "$"
  primaryColor: string; // ex "#1e40af"
  accentColor: string;  // ex "#15803d"
  darkMode: boolean;
  enableAiFeatures: boolean;
  smsSenderId: string;
  accessPassword?: string;
  staffRolePermissions?: StaffRoleConfig[];
  fedapayPublicKey?: string;
  fedapaySecretKey?: string;
  kkiapayPublicKey?: string;
  kkiapaySecretKey?: string;
  mobileMoneyNumber?: string;
  activePaymentGateway?: 'FEDAPAY' | 'KKIAPAY' | 'MOMO_DIRECT';
  enableOnlineTransactions?: boolean;
}

export interface ExamPaper {
  id: string;
  title: string;
  classId: string;
  className: string;
  subjectName: string;
  examType: ExamType;
  trimester: number;
  academicYear: string;
  duration: string;
  coefficient: number;
  instructions: string;
  content: string;
  originalImageUrl?: string;
  includeHeader?: boolean;
  createdAt: string;
  createdBy?: string;
  teacherId?: string;
  teacherName?: string;
  teacherPhone?: string;
  schoolId?: string;
  status?: 'EN_ATTENTE' | 'VALIDE' | 'REJETE' | 'IMPRIME' | 'ARCHIVE';
  isArchived?: boolean;
  archivedAt?: string;
  archivedBy?: string;
  submissionNotes?: string;
  schoolFeedback?: string;
  attachedFileUrl?: string; // Word (.docx), PDF or scanned image
  attachedFileName?: string;
  attachedFileType?: 'WORD' | 'PDF' | 'IMAGE';
  numberOfCopiesRequested?: number;
  examDate?: string;
  isAvailableForStudents?: boolean; // When true or undefined, accessible to students & parents in their sub-app
  sentToSchool?: boolean; // Envoyé à l'école / direction / censeur pour tirage papier
  sentToParents?: boolean; // Mis à disposition directe des parents d'élèves et élèves
  parentInstructions?: string; // Consignes et directives spécifiques du professeur pour les parents et élèves
  submissionDeadline?: string; // Date limite de remise ou de révision pour les élèves
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  badge?: string;
  description: string;
  priceMonthly: number;
  priceAnnual: number;
  maxStudents: number | 'UNLIMITED';
  maxTeachers: number | 'UNLIMITED';
  storageLimitGb: number;
  smsIncludedMonthly: number;
  aiScansIncludedMonthly: number;
  features: string[];
  recommended?: boolean;
  color: string;
}

export interface SchoolSubscription {
  id: string;
  planId: string;
  planName: string;
  status: 'ACTIVE' | 'TRIAL' | 'EXPIRED' | 'PENDING';
  billingCycle: 'MONTHLY' | 'ANNUAL';
  startDate: string;
  nextRenewalDate: string;
  amountPaid: number;
  currency: string;
  paymentMethod: 'MOBILE_MONEY' | 'CARTE_BANCAIRE' | 'VIREMENT' | 'ESPECES';
  smsUsedThisMonth: number;
  aiScansUsedThisMonth: number;
  storageUsedGb: number;
}

export interface SubscriptionInvoice {
  id: string;
  invoiceNumber: string;
  date: string;
  planName: string;
  amount: number;
  currency: string;
  period: string;
  paymentMethod: string;
  status: 'PAYÉ' | 'EN_ATTENTE' | 'ANNULÉ';
  pdfUrl?: string;
}

export type AnnouncementAudience = 'PUBLIC_ALL' | 'PUBLIC_CLASS' | 'PRIVATE_STUDENT';

export type AnnouncementCategory = 
  | 'CIRCULAIRE' 
  | 'REUNION' 
  | 'PAIEMENT' 
  | 'DISCIPLINE' 
  | 'EVENEMENT' 
  | 'CONVOCATION' 
  | 'BULLETINS' 
  | 'URGENT' 
  | 'PUBLICITE'
  | 'PARTENAIRE'
  | 'ACTIVITE'
  | 'AUTRE';

export interface OfficialAnnouncement {
  id: string;
  schoolId: string;
  title: string;
  content: string;
  audience: AnnouncementAudience; // 'PUBLIC_ALL' (Tous les parents) | 'PUBLIC_CLASS' (Classe) | 'PRIVATE_STUDENT' (Message privé parent/élève)
  targetClassId?: string;
  targetClassName?: string;
  targetStudentId?: string;
  targetStudentName?: string;
  targetStudentRegNumber?: string;
  targetParentName?: string;
  targetParentPhone?: string;
  photoUrl?: string; // Image / Circulaire / Affiche Publicitaire / Pièce jointe Base64
  photoName?: string;
  priority: 'NORMALE' | 'IMPORTANTE' | 'URGENTE';
  category: AnnouncementCategory;
  authorName: string; // Ex: "Direction de l'Établissement", "Directeur Général", "Le Censeur", "Partenaire Officiel"
  createdAt: string; // ISO string
  isPinned?: boolean;
  readReceipts?: string[]; // studentIds or parentPhones that read the announcement
  
  // Espace Publicitaire & Visuels Divers
  isAdBanner?: boolean; // Marqué comme encart/bannière publicitaire ou affiche visuelle
  adTag?: string; // 'OFFICIEL' | 'SPONSOR' | 'ÉVÉNEMENT' | 'FOURNITURES' | 'SOUTIEN' | 'DIVERS'
  ctaText?: string; // Ex: "Contacter", "En savoir plus", "WhatsApp", "Participer"
  ctaUrl?: string; // Lien web, numéro WhatsApp (https://wa.me/...) ou numéro d'appel (tel:...)
  sponsorName?: string; // Ex: "Librairie Centrale", "Assurance Scolaire Sunu", "Club Robotique"
}

export interface ParentActivationRecord {
  id: string;
  phone: string; // Numéro normalisé sans indicatif/espaces
  rawPhone: string; // Numéro tel que saisi
  parentName: string;
  studentId: string;
  studentName: string;
  className: string;
  schoolId: string;
  schoolName: string;
  status: 'actif' | 'expire';
  activationDate: string; // Date ISO de l'activation
  fin_abonnement: string; // Date ISO d'expiration (+30 jours ou +365 jours)
  receiptCode: string; // Code reçu unique à 5 caractères alphanumériques (ex: A7K9P)
  fee: number; // 1000 FCFA (mensuel) ou 9000 FCFA (annuel)
  promoterCommission: number; // 600 FCFA (60%) ou 5400 FCFA (60%)
  schoolShare: number; // 300 FCFA (30%) ou 2700 FCFA (30%)
  planType?: 'MONTHLY' | 'ANNUAL';
  durationDays?: number;
  monthKey: string; // Ex: "2025-03" (YYYY-MM)
  isPaidToSchool: boolean; // Statut de versement
  paidToSchoolDate?: string;
  notes?: string;
}

export interface DirectorParentActivationNotification {
  id: string;
  schoolId: string;
  type: 'PARENT_ACTIVATED';
  title: string;
  parentName: string;
  parentPhone: string;
  studentName: string;
  className: string;
  receiptCode: string;
  fin_abonnement: string;
  createdAt: string;
  isRead: boolean;
}



