import {
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
  User,
  ArchivedReportCard,
  StaffRoleConfig
} from '../types';

export const defaultStaffRolePermissions: StaffRoleConfig[] = [
  {
    role: 'DIRECTEUR',
    title: 'Directeur Général (Administrateur)',
    description: 'Accès superviseur total à toutes les fenêtres, finances, scolarité, rapports, paramétrages et codes d’accès.',
    accessCode: 'DIR-8842',
    allowedViews: ['*'],
    isEnabled: true,
    assignedTo: 'M. Le Directeur Général',
    phone: '+229 97 00 00 01',
    email: 'directeur@ecole.bj'
  },
  {
    role: 'CENSEUR',
    title: 'Censeur / Directeur des Études',
    description: 'Gestion pédagogique intégrale : Saisie des notes, bulletins QR, discipline, emplois du temps, épreuves IA et examens.',
    accessCode: 'CENS-3021',
    allowedViews: [
      'dashboard',
      'students',
      'scan-roster',
      'classes',
      'subjects',
      'grades',
      'report-cards',
      'attendance',
      'timetable',
      'exams',
      'epreuves',
      'teachers',
      'documents',
      'communication',
      'ai-studio'
    ],
    isEnabled: true,
    assignedTo: 'M. Dieudonné AKPO (Censeur)',
    phone: '+229 97 12 34 56',
    email: 'censeur@ecole.bj'
  },
  {
    role: 'SURVEILLANT',
    title: 'Surveillant Général (Discipline & Présences)',
    description: 'Gestion de la vie scolaire : Pointage des présences, retards, billets d\'entrée/sortie, cartes scolaires, emplois du temps et discipline.',
    accessCode: 'SURV-4410',
    allowedViews: [
      'dashboard',
      'attendance',
      'students',
      'timetable',
      'documents',
      'communication',
      'canteen'
    ],
    isEnabled: true,
    assignedTo: 'M. Rodrigue HOUNGBO (Surveillant Général)',
    phone: '+229 96 23 45 67',
    email: 'surveillant@ecole.bj'
  },
  {
    role: 'COMPTABLE',
    title: 'Comptable / Trésorier',
    description: 'Gestion financière complète : Frais de scolarité, grand livre de caisse, reçus, dépenses, salaires, cantine et transport.',
    accessCode: 'COMPT-5510',
    allowedViews: [
      'dashboard',
      'accounting',
      'payments',
      'students',
      'canteen',
      'transport',
      'communication',
      'subscriptions'
    ],
    isEnabled: true,
    assignedTo: 'Mme Clarisse BASSOLÉ (Comptable)',
    phone: '+229 95 34 56 78',
    email: 'comptable@ecole.bj'
  },
  {
    role: 'SECRETAIRE',
    title: 'Secrétaire Administrative',
    description: 'Administration et accueil : Inscriptions élèves, scan OCR des listes, cartes scolaires, certificats, documents et communications SMS/WhatsApp.',
    accessCode: 'SEC-1490',
    allowedViews: [
      'dashboard',
      'students',
      'scan-roster',
      'classes',
      'documents',
      'timetable',
      'attendance',
      'canteen',
      'transport',
      'communication'
    ],
    isEnabled: true,
    assignedTo: 'Mme Honorine TCHIBOZO (Secrétaire)',
    phone: '+229 94 45 67 89',
    email: 'secretaire@ecole.bj'
  }
];

export const initialSettings: SchoolSettings = {
  schoolName: "GESTIONNAIRE SCOLAIRE",
  motto: "Discipline • Travail • Rigueur",
  logoUrl: "https://images.unsplash.com/photo-1546410531-bb4caa6b424d?auto=format&fit=crop&q=80&w=250",
  signatureUrl: "https://images.unsplash.com/photo-1600132806370-bf17e65e942f?auto=format&fit=crop&q=80&w=200",
  examHeaderUrl: "https://images.unsplash.com/photo-1546410531-bb4caa6b424d?auto=format&fit=crop&q=80&w=250",
  ministryHeader: "RÉPUBLIQUE DU BÉNIN\nMINISTÈRE DE L'ENSEIGNEMENT SECONDAIRE, TECHNIQUE ET DE LA FORMATION PROFESSIONNELLE",
  regionalDirection: "DIRECTION RÉGIONALE DE L'ENSEIGNEMENT SECONDAIRE - LITTORAL",
  address: "BP 474 Cotonou",
  city: "Cotonou, Bénin",
  phone: "96 28 75 45 / 01 96 36 84 99 / 01 53 07 67 51",
  email: "direction@groupe-excellence.bj",
  academicYear: "2025-2026",
  currentTrimester: 1,
  currency: "FCFA",
  primaryColor: "#059669", // Emerald Green
  accentColor: "#1e40af",  // Royal Blue
  darkMode: false,
  enableAiFeatures: true,
  smsSenderId: "EXCELLENCE",
  staffRolePermissions: defaultStaffRolePermissions,
  fedapayPublicKey: "pk_live_feda_xxxxxxxxxxxxxxxxxxxx",
  fedapaySecretKey: "sk_live_feda_xxxxxxxxxxxxxxxxxxxx",
  kkiapayPublicKey: "pk_live_kkia_xxxxxxxxxxxxxxxxxxxx",
  kkiapaySecretKey: "sk_live_kkia_xxxxxxxxxxxxxxxxxxxx",
  mobileMoneyNumber: "+229 01 67 43 03 81",
  activePaymentGateway: "FEDAPAY",
  enableOnlineTransactions: true
};

export const demoUsers: User[] = [
  {
    id: "usr-0",
    name: "M. LE DIRECTEUR",
    email: "directeur@groupe-excellence.bj",
    role: "SUPER_ADMIN",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150",
    phone: "96 28 75 45",
    schoolName: "COMPLEXE SCOLAIRE D'EXCELLENCE"
  },
  {
    id: "usr-1",
    name: "M. LE DIRECTEUR",
    email: "direction@groupe-excellence.bj",
    role: "DIRECTEUR",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150",
    phone: "96 28 75 45",
    schoolName: "COMPLEXE SCOLAIRE D'EXCELLENCE"
  },
  {
    id: "usr-censeur",
    name: "M. Dieudonné AKPO",
    email: "censeur@groupe-excellence.bj",
    role: "CENSEUR",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=150",
    phone: "01 67 43 03 81"
  },
  {
    id: "usr-2",
    name: "Mme Clarisse BASSOLÉ",
    email: "comptable@groupe-excellence.bj",
    role: "COMPTABLE",
    avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=150",
    phone: "01 96 36 84 99"
  },
  {
    id: "usr-3",
    name: "Mme Honorine TCHIBOZO",
    email: "secretaire@groupe-excellence.bj",
    role: "SECRETAIRE",
    avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=150",
    phone: "01 53 07 67 51"
  },
  {
    id: "usr-4",
    name: "M. Paulin MENSAH",
    email: "p.mensah@groupe-excellence.bj",
    role: "ENSEIGNANT",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=150",
    phone: "+229 97 11 22 33"
  },
  {
    id: "usr-5",
    name: "Mme Chantal DIALLO",
    email: "chantal.diallo@gmail.com",
    role: "PARENT",
    avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=150",
    phone: "+229 95 88 77 66",
    childrenIds: ["std-1", "std-4"]
  },
  {
    id: "usr-6",
    name: "Koffi Marc-Aurele DIALLO",
    email: "marc.diallo@eleve.bj",
    role: "ELEVE",
    avatar: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=150",
    studentId: "std-1",
    classId: "cls-3"
  }
];

export const initialClasses: SchoolClass[] = [
  // Maternelle & Primaire
  { id: "cls-mat", name: "Maternelle (Petite, Moyenne & Grande Section)", level: "MATERNELLE", stream: "Maternelle", room: "Bâtiment A1", capacity: 80, studentCount: 60, mainTeacherId: "tch-p1", tuitionFee: 50000 },
  { id: "cls-ci", name: "CI (Cours Initiatique)", level: "PRIMAIRE", stream: "Primaire", room: "Bâtiment A2", capacity: 90, studentCount: 80, mainTeacherId: "tch-p2", tuitionFee: 40000 },
  { id: "cls-cp", name: "CP (Cours Préparatoire)", level: "PRIMAIRE", stream: "Primaire", room: "Bâtiment A3", capacity: 90, studentCount: 80, mainTeacherId: "tch-p3", tuitionFee: 40000 },
  { id: "cls-ce1", name: "CE1 (Cours Élémentaire 1)", level: "PRIMAIRE", stream: "Primaire", room: "Bâtiment B1", capacity: 80, studentCount: 70, mainTeacherId: "tch-p4", tuitionFee: 45000 },
  { id: "cls-ce2", name: "CE2 (Cours Élémentaire 2)", level: "PRIMAIRE", stream: "Primaire", room: "Bâtiment B2", capacity: 80, studentCount: 70, mainTeacherId: "tch-p5", tuitionFee: 45000 },
  { id: "cls-cm1", name: "CM1 (Cours Moyen 1)", level: "PRIMAIRE", stream: "Primaire", room: "Bâtiment B3", capacity: 80, studentCount: 70, mainTeacherId: "tch-p6", tuitionFee: 55000 },
  { id: "cls-cm2", name: "CM2 (Classe d'Examen CEP)", level: "PRIMAIRE", stream: "Primaire Examen", room: "Bâtiment B4", capacity: 80, studentCount: 70, mainTeacherId: "tch-p7", tuitionFee: 60000 },

  // Secondaire 1er Cycle (Collège de 6ème à 3ème)
  { id: "cls-6", name: "6ème (Sixième Générale)", level: "COLLEGE", stream: "Général", room: "Salle C1", capacity: 180, studentCount: 160, mainTeacherId: "tch-s1", tuitionFee: 65000 },
  { id: "cls-5", name: "5ème (Cinquième Générale)", level: "COLLEGE", stream: "Général", room: "Salle C2", capacity: 170, studentCount: 150, mainTeacherId: "tch-s2", tuitionFee: 75000 },
  { id: "cls-4", name: "4ème (Quatrième Générale)", level: "COLLEGE", stream: "Général", room: "Salle C3", capacity: 170, studentCount: 150, mainTeacherId: "tch-s3", tuitionFee: 85000 },
  { id: "cls-3", name: "3ème (Classe d'Examen BEPC)", level: "COLLEGE", stream: "Général Examen", room: "Salle C4", capacity: 160, studentCount: 140, mainTeacherId: "tch-s4", tuitionFee: 100000 },

  // Secondaire 2nd Cycle / Lycée (Seconde)
  { id: "cls-2nde-a", name: "2nde A (Seconde Littéraire & Sciences Humaines)", level: "LYCEE", stream: "Littéraire", room: "Salle L1", capacity: 100, studentCount: 85, mainTeacherId: "tch-s5", tuitionFee: 110000 },
  { id: "cls-2nde-c", name: "2nde C (Seconde Scientifique & Mathématiques)", level: "LYCEE", stream: "Scientifique", room: "Salle L2", capacity: 100, studentCount: 80, mainTeacherId: "tch-s6", tuitionFee: 115000 },
  { id: "cls-2nde-s", name: "2nde S (Seconde Sciences Générales)", level: "LYCEE", stream: "Scientifique", room: "Salle L3", capacity: 90, studentCount: 75, mainTeacherId: "tch-s7", tuitionFee: 115000 },
  { id: "cls-2nde-g2", name: "2nde G2 (Seconde Technique - Gestion & Comptabilité)", level: "LYCEE", stream: "Technique G2", room: "Salle G1", capacity: 90, studentCount: 70, mainTeacherId: "tch-s8", tuitionFee: 120000 },

  // Secondaire 2nd Cycle / Lycée (Première)
  { id: "cls-1ere-a", name: "1ère A (Première Littéraire & Philosophie)", level: "LYCEE", stream: "Littéraire", room: "Salle L4", capacity: 90, studentCount: 75, mainTeacherId: "tch-s8", tuitionFee: 120000 },
  { id: "cls-1ere-c", name: "1ère C (Première Mathématiques & Sciences Physiques)", level: "LYCEE", stream: "Scientifique", room: "Salle L5", capacity: 80, studentCount: 65, mainTeacherId: "tch-s9", tuitionFee: 125000 },
  { id: "cls-1ere-d", name: "1ère D (Première Sciences de la Vie et de la Terre)", level: "LYCEE", stream: "Scientifique", room: "Salle L6", capacity: 90, studentCount: 80, mainTeacherId: "tch-s10", tuitionFee: 125000 },
  { id: "cls-1ere-g2", name: "1ère G2 (Première Technique - Comptabilité & Gestion)", level: "LYCEE", stream: "Technique G2", room: "Salle G2", capacity: 85, studentCount: 70, mainTeacherId: "tch-s11", tuitionFee: 130000 },

  // Secondaire 2nd Cycle / Lycée (Terminale - Classes d'Examen BAC)
  { id: "cls-tle-a", name: "Terminale A (Baccalauréat Série Littéraire A4)", level: "LYCEE", stream: "Bac Littéraire", room: "Salle T1", capacity: 90, studentCount: 75, mainTeacherId: "tch-s11", tuitionFee: 135000 },
  { id: "cls-tle-b", name: "Terminale B (Baccalauréat Économie & Social)", level: "LYCEE", stream: "Bac Économique", room: "Salle T2", capacity: 70, studentCount: 55, mainTeacherId: "tch-s12", tuitionFee: 135000 },
  { id: "cls-tle-c", name: "Terminale C (Baccalauréat Mathématiques & Physiques)", level: "LYCEE", stream: "Bac Scientifique C", room: "Salle T3", capacity: 70, studentCount: 50, mainTeacherId: "tch-s13", tuitionFee: 145000 },
  { id: "cls-tle-d", name: "Terminale D (Baccalauréat Sciences Biologiques & Chimie)", level: "LYCEE", stream: "Bac Scientifique D", room: "Salle T4", capacity: 90, studentCount: 80, mainTeacherId: "tch-s14", tuitionFee: 140000 },
  { id: "cls-tle-g2", name: "Terminale G2 (Baccalauréat Technique - Gestion & Comptabilité)", level: "LYCEE", stream: "Bac Technique G2", room: "Salle G3", capacity: 80, studentCount: 65, mainTeacherId: "tch-s12", tuitionFee: 145000 }
];

export const OFFICIAL_PRIMARY_SUBJECTS: Subject[] = [
  { id: "sbj-prim-ce", code: "CE", name: "Communication Écrite", category: "LITTERAIRE", coefficient: 2, level: "PRIMAIRE" },
  { id: "sbj-prim-lect", code: "LECT", name: "Lecture", category: "LITTERAIRE", coefficient: 2, level: "PRIMAIRE" },
  { id: "sbj-prim-est", code: "EST", name: "EST (Éduc. Scientifique & Technologique)", category: "SCIENTIFIQUE", coefficient: 2, level: "PRIMAIRE" },
  { id: "sbj-prim-es", code: "ES", name: "ES (Éducation Sociale - Hist / Géo / Civisme)", category: "LITTERAIRE", coefficient: 1, level: "PRIMAIRE" },
  { id: "sbj-prim-ea", code: "EA", name: "EA (conte, poésie et chant)", category: "DIVERS", coefficient: 1, level: "PRIMAIRE" },
  { id: "sbj-prim-math", code: "MATH", name: "Mathématiques (Calcul & Géométrie)", category: "SCIENTIFIQUE", coefficient: 3, level: "PRIMAIRE" },
  { id: "sbj-prim-eps", code: "EPS", name: "Sport (Éducation Physique & Sportive)", category: "DIVERS", coefficient: 1, level: "PRIMAIRE" }
];

export const OFFICIAL_MATERNELLE_SUBJECTS: Subject[] = [
  { id: "sbj-mat-eveil", code: "EVEIL", name: "Activités d'Éveil & Motricité", category: "DIVERS", coefficient: 1, level: "MATERNELLE" },
  { id: "sbj-mat-graph", code: "GRAPH", name: "Graphisme & Pré-Écriture", category: "LITTERAIRE", coefficient: 1, level: "MATERNELLE" },
  { id: "sbj-mat-lang", code: "LANG", name: "Langage & Expression Orale", category: "LITTERAIRE", coefficient: 1, level: "MATERNELLE" },
  { id: "sbj-mat-compt", code: "EA", name: "EA (conte, poésie et chant)", category: "DIVERS", coefficient: 1, level: "MATERNELLE" }
];

export const initialSubjects: Subject[] = [
  // 🎒 1. MATIÈRES OFFICIELLES DU PRIMAIRE
  ...OFFICIAL_PRIMARY_SUBJECTS,

  // 🧸 2. MATIÈRES DE LA MATERNELLE
  ...OFFICIAL_MATERNELLE_SUBJECTS,

  // 🏫 3. MATIÈRES DU SECONDAIRE (COLLÈGE & LYCÉE)
  { id: "sbj-1", code: "MATH", name: "Mathématiques", category: "SCIENTIFIQUE", coefficient: 5, level: "LYCEE" },
  { id: "sbj-2", code: "FRAN", name: "Français & Littérature", category: "LITTERAIRE", coefficient: 4, level: "LYCEE" },
  { id: "sbj-3", code: "PC", name: "Physique - Chimie", category: "SCIENTIFIQUE", coefficient: 4, level: "LYCEE" },
  { id: "sbj-4", code: "SVT", name: "Sciences de la Vie et de la Terre", category: "SCIENTIFIQUE", coefficient: 3, level: "LYCEE" },
  { id: "sbj-5", code: "HIST", name: "Histoire - Géographie", category: "LITTERAIRE", coefficient: 3, level: "COLLEGE" },
  { id: "sbj-6", code: "ANG", name: "Langue Anglaise", category: "LANGUE", coefficient: 3, level: "COLLEGE" },
  { id: "sbj-7", code: "PHIL", name: "Philosophie", category: "LITTERAIRE", coefficient: 3, level: "LYCEE" },
  { id: "sbj-8", code: "INFO", name: "Informatique & Algo", category: "TECHNIQUE", coefficient: 3, level: "UNIVERSITE" },
  { id: "sbj-9", code: "EPS", name: "Éducation Physique & Sportive", category: "DIVERS", coefficient: 1, level: "LYCEE" },
  { id: "sbj-cpt", code: "CPT", name: "Comptabilité Générale & Analytique (G2)", category: "TECHNIQUE", coefficient: 6, level: "LYCEE" },
  { id: "sbj-eco", code: "ECO", name: "Économie & Organisation d'Entreprise (G2)", category: "TECHNIQUE", coefficient: 4, level: "LYCEE" },
  { id: "sbj-drt", code: "DRT", name: "Droit Commercial & Fiscalité (G2)", category: "LITTERAIRE", coefficient: 3, level: "LYCEE" },
  { id: "sbj-mat-fin", code: "MFIN", name: "Mathématiques Financières (G2)", category: "SCIENTIFIQUE", coefficient: 4, level: "LYCEE" }
];

export const initialTeachers: Teacher[] = [
  // ---------------- PRIMAIRE & MATERNELLE (MAÎTRES & MAÎTRESSES) ----------------
  { id: "tch-p1", firstName: "Maîtresse Mariam", lastName: "BAH", photoUrl: "https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?auto=format&fit=crop&q=80&w=150", email: "mariam.bah@groupe-excellence.bj", phone: "96 28 75 45", subjects: ["Maternelle", "Éveil", "Graphisme"], classIds: ["cls-mat"], salary: 180000, hireDate: "2018-09-01", status: "ACTIF", qualification: "Maîtresse de Maternelle (Éducatrice Certifiée)" },
  { id: "tch-p2", firstName: "Maître Paulin", lastName: "MENSAH", photoUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=150", email: "paulin.mensah@groupe-excellence.bj", phone: "01 96 36 84 99", subjects: ["CI - Cursus Fondamental"], classIds: ["cls-ci"], salary: 190000, hireDate: "2017-10-01", status: "ACTIF", qualification: "Instituteur Titulaire (Maître de CI)" },
  { id: "tch-p3", firstName: "Maîtresse Aïcha", lastName: "OUEDRAOGO", photoUrl: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&q=80&w=150", email: "aicha.o@groupe-excellence.bj", phone: "01 53 07 67 51", subjects: ["CP - Cursus Fondamental"], classIds: ["cls-cp"], salary: 195000, hireDate: "2019-09-15", status: "ACTIF", qualification: "Institutrice Titulaire (Maîtresse de CP)" },
  { id: "tch-p4", firstName: "Maître Koffi", lastName: "N'GUESSAN", photoUrl: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=150", email: "koffi.n@groupe-excellence.bj", phone: "96 00 11 22", subjects: ["CE1 - Cursus Fondamental"], classIds: ["cls-ce1"], salary: 200000, hireDate: "2016-09-01", status: "ACTIF", qualification: "Instituteur d'État (Maître de CE1)" },
  { id: "tch-p5", firstName: "Maîtresse Fatou", lastName: "KINDO", photoUrl: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=150", email: "fatou.k@groupe-excellence.bj", phone: "96 33 44 55", subjects: ["CE2 - Cursus Fondamental"], classIds: ["cls-ce2"], salary: 205000, hireDate: "2020-01-10", status: "ACTIF", qualification: "Institutrice Titulaire (Maîtresse de CE2)" },
  { id: "tch-p6", firstName: "Maître Ibrahim", lastName: "SAWADOGO", photoUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150", email: "ibrahim.s@groupe-excellence.bj", phone: "96 55 66 77", subjects: ["CM1 - Cursus Fondamental"], classIds: ["cls-cm1"], salary: 215000, hireDate: "2015-09-01", status: "ACTIF", qualification: "Instituteur Titulaire (Maître de CM1)" },
  { id: "tch-p7", firstName: "Maître Marc", lastName: "ADAGBE", photoUrl: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=150", email: "marc.a@groupe-excellence.bj", phone: "96 88 99 00", subjects: ["CM2 - Examen CEP & Entrée en 6ème"], classIds: ["cls-cm2"], salary: 230000, hireDate: "2014-09-01", status: "ACTIF", qualification: "Instituteur Principal (Maître de CM2)" },
  { id: "tch-p8", firstName: "Maîtresse Solange", lastName: "HOUNGBO", photoUrl: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=150", email: "solange.h@groupe-excellence.bj", phone: "96 12 34 56", subjects: ["Initiation Anglais (Primaire)"], classIds: ["cls-ci", "cls-cp", "cls-ce1"], salary: 185000, hireDate: "2021-09-01", status: "ACTIF", qualification: "Maîtresse Spécialiste Langue Anglaise" },

  // ---------------- SECONDAIRE (45 PROFESSEURS DE 6ème à 3ème) ----------------
  ...Array.from({ length: 45 }, (_, index) => {
    const num = index + 1;
    const subjectsList = [
      "Mathématiques", "Français", "Physique - Chimie", "Sciences de la Vie et de la Terre (SVT)", 
      "Histoire - Géographie", "Anglais", "Informatique & Algo", "Éducation Physique & Sportive (EPS)"
    ];
    const subjectName = subjectsList[index % subjectsList.length];
    const levelName = num <= 12 ? "6ème" : num <= 24 ? "5ème" : num <= 36 ? "4ème" : "3ème";
    
    return {
      id: `tch-s${num}`,
      firstName: `Prof. ${["Anicet", "Benoît", "Célestin", "Dieudonné", "Émile", "Florent", "Gérard", "Henri", "Ignace", "Jules"][index % 10]}`,
      lastName: `${["DOSSOU", "SOGLO", "AGBOSSA", "KPADONOU", "HOUESSOU", "TCHIBOZO", "BIOU", "LOKOSSOU", "KOFFI", "N'DAH"][index % 10]} ${num}`,
      photoUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150",
      email: `prof${num}.secondaire@groupe-excellence.bj`,
      phone: `01 96 ${String(10 + num).padStart(2, '0')} ${String(20 + num).padStart(2, '0')}`,
      subjects: [subjectName, `Secondaire ${levelName}`],
      classIds: ["cls-6"],
      salary: 250000 + (index * 2000),
      hireDate: "2020-09-01",
      status: "ACTIF" as const,
      qualification: `Professeur Certifié de ${subjectName}`
    };
  })
];

export const initialStudents: Student[] = [
  {
    id: "std-1",
    registrationNumber: "2025-COL-001",
    firstName: "Marc-Aurele",
    lastName: "DIALLO",
    photoUrl: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=150",
    gender: "M",
    dateOfBirth: "2010-04-12",
    placeOfBirth: "Abidjan",
    classId: "cls-3", // 3ème
    level: "COLLEGE",
    parentName: "Mme Chantal DIALLO",
    parentPhone: "+225 08 99 88 77 66",
    parentEmail: "chantal.diallo@gmail.com",
    address: "Cocody Riviera 3, Villa 142",
    status: "ACTIF",
    enrollmentDate: "2025-09-02",
    bloodGroup: "O+",
    medicalNotes: "Aucune allergie connue"
  },
  {
    id: "std-2",
    registrationNumber: "2025-LYC-014",
    firstName: "Yasmine",
    lastName: "KOUAME",
    photoUrl: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&q=80&w=150",
    gender: "F",
    dateOfBirth: "2008-09-25",
    placeOfBirth: "Yamoussoukro",
    classId: "cls-tle-d", // Terminale D
    level: "LYCEE",
    parentName: "M. Lucien KOUAME",
    parentPhone: "+225 07 22 33 44 55",
    parentEmail: "lucien.kouame@yahoo.fr",
    address: "Deux Plateaux Vallons",
    status: "ACTIF",
    enrollmentDate: "2025-09-01",
    bloodGroup: "A+",
    medicalNotes: "Porte des lunettes"
  },
  {
    id: "std-3",
    registrationNumber: "2025-UNI-008",
    firstName: "Jean-Eudes",
    lastName: "BONY",
    photoUrl: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=150",
    gender: "M",
    dateOfBirth: "2004-11-05",
    placeOfBirth: "Bouaké",
    classId: "cls-tle-c", // Terminale C
    level: "LYCEE",
    parentName: "Mme Marie-Claire BONY",
    parentPhone: "+225 05 66 77 88 99",
    parentEmail: "mc.bony@gmail.com",
    address: "Cité Universitaire Mermoz",
    status: "ACTIF",
    enrollmentDate: "2025-10-01",
    bloodGroup: "B+"
  },
  {
    id: "std-4",
    registrationNumber: "2025-MAT-003",
    firstName: "Inès Sarah",
    lastName: "DIALLO",
    photoUrl: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=150",
    gender: "F",
    dateOfBirth: "2020-06-18",
    placeOfBirth: "Abidjan",
    classId: "cls-mat", // Maternelle
    level: "MATERNELLE",
    parentName: "Mme Chantal DIALLO",
    parentPhone: "+225 08 99 88 77 66",
    parentEmail: "chantal.diallo@gmail.com",
    address: "Cocody Riviera 3, Villa 142",
    status: "ACTIF",
    enrollmentDate: "2025-09-02",
    bloodGroup: "O+"
  },
  {
    id: "std-5",
    registrationNumber: "2025-COL-088",
    firstName: "Franck",
    lastName: "KONAN",
    photoUrl: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80&w=150",
    gender: "M",
    dateOfBirth: "2009-12-01",
    placeOfBirth: "Korhogo",
    classId: "cls-4", // 4ème
    level: "COLLEGE",
    parentName: "M. Gustave KONAN",
    parentPhone: "+225 01 44 55 66 77",
    parentEmail: "g.konan@gmail.com",
    address: "Marcory Zone 4",
    status: "ACTIF",
    enrollmentDate: "2025-09-05",
    bloodGroup: "AB+"
  },
  {
    id: "std-6",
    registrationNumber: "2025-LYC-045",
    firstName: "Boris",
    lastName: "TOSSOU",
    photoUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150",
    gender: "M",
    dateOfBirth: "2007-03-14",
    placeOfBirth: "Cotonou",
    classId: "cls-tle-a", // Terminale A
    level: "LYCEE",
    parentName: "M. Sévérin TOSSOU",
    parentPhone: "+229 97 45 67 89",
    parentEmail: "s.tossou@yahoo.fr",
    address: "Haie Vive, Villa 45",
    status: "ACTIF",
    enrollmentDate: "2025-09-01",
    bloodGroup: "O+"
  },
  {
    id: "std-7",
    registrationNumber: "2025-LYC-072",
    firstName: "Félicité",
    lastName: "AGBALIKA",
    photoUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150",
    gender: "F",
    dateOfBirth: "2008-07-22",
    placeOfBirth: "Porto-Novo",
    classId: "cls-1ere-d", // 1ère D
    level: "LYCEE",
    parentName: "Mme Jeanne AGBALIKA",
    parentPhone: "+229 96 11 22 33",
    parentEmail: "j.agbalika@gmail.com",
    address: "Akpakpa Dodomè",
    status: "ACTIF",
    enrollmentDate: "2025-09-03",
    bloodGroup: "B+"
  },
  {
    id: "std-8",
    registrationNumber: "2025-LYC-104",
    firstName: "Rodrigue",
    lastName: "HOUNNOU",
    photoUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=150",
    gender: "M",
    dateOfBirth: "2009-05-19",
    placeOfBirth: "Parakou",
    classId: "cls-2nde-c", // 2nde C
    level: "LYCEE",
    parentName: "M. Éloi HOUNNOU",
    parentPhone: "+229 95 33 44 55",
    parentEmail: "e.hounnou@gmail.com",
    address: "Fidjrossè Calvaire",
    status: "ACTIF",
    enrollmentDate: "2025-09-04",
    bloodGroup: "A+"
  },
  {
    id: "std-9",
    registrationNumber: "2025-G2-018",
    firstName: "Clarisse",
    lastName: "AGOSSOU",
    photoUrl: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=150",
    gender: "F",
    dateOfBirth: "2007-11-20",
    placeOfBirth: "Cotonou",
    classId: "cls-tle-g2", // Terminale G2
    level: "LYCEE",
    parentName: "M. Sylvain AGOSSOU",
    parentPhone: "+229 97 12 34 56",
    parentEmail: "s.agossou@compta-expert.bj",
    address: "Cadjehoun, Rue des Ambassades",
    status: "ACTIF",
    enrollmentDate: "2025-09-02",
    bloodGroup: "O+"
  },
  {
    id: "std-10",
    registrationNumber: "2025-COL-099",
    firstName: "Marc",
    lastName: "KPAKPO",
    photoUrl: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=150",
    gender: "M",
    dateOfBirth: "2010-06-14",
    placeOfBirth: "Cotonou",
    classId: "cls-3", // 3ème
    level: "COLLEGE",
    parentName: "M. Sylvain KPAKPO",
    parentPhone: "+229 97 65 43 21",
    parentEmail: "sylvain.kpakpo@gmail.com",
    address: "Cotonou, Quartier Cadjehoun",
    status: "ACTIF",
    enrollmentDate: "2025-09-02",
    bloodGroup: "O+",
    medicalNotes: "Apte à toutes les activités physiques et sportives"
  },
  // 🎒 ÉLÈVES DU PRIMAIRE (CM2, CE2, CP)
  {
    id: "std-prim-1",
    registrationNumber: "2025-PRIM-001",
    firstName: "Emmanuel",
    lastName: "SOSSOU",
    photoUrl: "https://images.unsplash.com/photo-1543610892-0b1f7e6d8ac1?auto=format&fit=crop&q=80&w=150",
    gender: "M",
    dateOfBirth: "2014-03-10",
    placeOfBirth: "Cotonou",
    classId: "cls-cm2", // CM2
    level: "PRIMAIRE",
    parentName: "M. Théophile SOSSOU",
    parentPhone: "+229 97 11 22 44",
    parentEmail: "theophile.sossou@gmail.com",
    address: "Cotonou, Menontin",
    status: "ACTIF",
    enrollmentDate: "2025-09-02",
    bloodGroup: "O+"
  },
  {
    id: "std-prim-2",
    registrationNumber: "2025-PRIM-002",
    firstName: "Grâce",
    lastName: "HOUNGBO",
    photoUrl: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=150",
    gender: "F",
    dateOfBirth: "2014-08-22",
    placeOfBirth: "Porto-Novo",
    classId: "cls-cm2", // CM2
    level: "PRIMAIRE",
    parentName: "Mme Pauline HOUNGBO",
    parentPhone: "+229 96 33 55 77",
    parentEmail: "pauline.h@gmail.com",
    address: "Agla, Cotonou",
    status: "ACTIF",
    enrollmentDate: "2025-09-02",
    bloodGroup: "A+"
  },
  {
    id: "std-prim-3",
    registrationNumber: "2025-PRIM-003",
    firstName: "Moïse",
    lastName: "ADJANOHOUN",
    photoUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150",
    gender: "M",
    dateOfBirth: "2016-05-14",
    placeOfBirth: "Cotonou",
    classId: "cls-ce2", // CE2
    level: "PRIMAIRE",
    parentName: "M. Victor ADJANOHOUN",
    parentPhone: "+229 95 88 99 00",
    parentEmail: "v.adjanohoun@gmail.com",
    address: "Godomey, Abomey-Calavi",
    status: "ACTIF",
    enrollmentDate: "2025-09-03",
    bloodGroup: "B+"
  }
];

export const initialGrades: Grade[] = [
  // 🎒 NOTES DES ÉLÈVES DU PRIMAIRE (Matières : CE, Lecture, EST, ES, EA, Mathématiques, Sport)
  // Emmanuel SOSSOU (std-prim-1) - CM2
  { id: "grd-p1", studentId: "std-prim-1", subjectId: "sbj-prim-ce", classId: "cls-cm2", trimester: 1, examType: "COMPOSITION", mark: 17.5, maxMark: 20, date: "2025-11-20", coefficient: 2 },
  { id: "grd-p2", studentId: "std-prim-1", subjectId: "sbj-prim-lect", classId: "cls-cm2", trimester: 1, examType: "COMPOSITION", mark: 18.0, maxMark: 20, date: "2025-11-21", coefficient: 2 },
  { id: "grd-p3", studentId: "std-prim-1", subjectId: "sbj-prim-est", classId: "cls-cm2", trimester: 1, examType: "COMPOSITION", mark: 16.0, maxMark: 20, date: "2025-11-22", coefficient: 2 },
  { id: "grd-p4", studentId: "std-prim-1", subjectId: "sbj-prim-es", classId: "cls-cm2", trimester: 1, examType: "COMPOSITION", mark: 15.5, maxMark: 20, date: "2025-11-23", coefficient: 1 },
  { id: "grd-p5", studentId: "std-prim-1", subjectId: "sbj-prim-ea", classId: "cls-cm2", trimester: 1, examType: "COMPOSITION", mark: 17.0, maxMark: 20, date: "2025-11-24", coefficient: 1 },
  { id: "grd-p6", studentId: "std-prim-1", subjectId: "sbj-prim-math", classId: "cls-cm2", trimester: 1, examType: "COMPOSITION", mark: 19.0, maxMark: 20, date: "2025-11-25", coefficient: 3 },
  { id: "grd-p7", studentId: "std-prim-1", subjectId: "sbj-prim-eps", classId: "cls-cm2", trimester: 1, examType: "COMPOSITION", mark: 16.5, maxMark: 20, date: "2025-11-26", coefficient: 1 },

  // Grâce HOUNGBO (std-prim-2) - CM2
  { id: "grd-p8", studentId: "std-prim-2", subjectId: "sbj-prim-ce", classId: "cls-cm2", trimester: 1, examType: "COMPOSITION", mark: 15.0, maxMark: 20, date: "2025-11-20", coefficient: 2 },
  { id: "grd-p9", studentId: "std-prim-2", subjectId: "sbj-prim-lect", classId: "cls-cm2", trimester: 1, examType: "COMPOSITION", mark: 16.5, maxMark: 20, date: "2025-11-21", coefficient: 2 },
  { id: "grd-p10", studentId: "std-prim-2", subjectId: "sbj-prim-est", classId: "cls-cm2", trimester: 1, examType: "COMPOSITION", mark: 14.5, maxMark: 20, date: "2025-11-22", coefficient: 2 },
  { id: "grd-p11", studentId: "std-prim-2", subjectId: "sbj-prim-es", classId: "cls-cm2", trimester: 1, examType: "COMPOSITION", mark: 16.0, maxMark: 20, date: "2025-11-23", coefficient: 1 },
  { id: "grd-p12", studentId: "std-prim-2", subjectId: "sbj-prim-ea", classId: "cls-cm2", trimester: 1, examType: "COMPOSITION", mark: 18.0, maxMark: 20, date: "2025-11-24", coefficient: 1 },
  { id: "grd-p13", studentId: "std-prim-2", subjectId: "sbj-prim-math", classId: "cls-cm2", trimester: 1, examType: "COMPOSITION", mark: 15.5, maxMark: 20, date: "2025-11-25", coefficient: 3 },
  { id: "grd-p14", studentId: "std-prim-2", subjectId: "sbj-prim-eps", classId: "cls-cm2", trimester: 1, examType: "COMPOSITION", mark: 17.0, maxMark: 20, date: "2025-11-26", coefficient: 1 },

  // Student Marc-Aurele DIALLO (std-1) - 3ème
  { id: "grd-1", studentId: "std-1", subjectId: "sbj-1", classId: "cls-3", trimester: 1, examType: "DEVOIR", mark: 16.5, maxMark: 20, date: "2025-10-15", coefficient: 2 },
  { id: "grd-2", studentId: "std-1", subjectId: "sbj-1", classId: "cls-3", trimester: 1, examType: "COMPOSITION", mark: 17, maxMark: 20, date: "2025-11-20", coefficient: 3 },
  { id: "grd-3", studentId: "std-1", subjectId: "sbj-2", classId: "cls-3", trimester: 1, examType: "DEVOIR", mark: 14, maxMark: 20, date: "2025-10-18", coefficient: 2 },
  { id: "grd-4", studentId: "std-1", subjectId: "sbj-2", classId: "cls-3", trimester: 1, examType: "COMPOSITION", mark: 15, maxMark: 20, date: "2025-11-22", coefficient: 3 },
  { id: "grd-5", studentId: "std-1", subjectId: "sbj-6", classId: "cls-3", trimester: 1, examType: "COMPOSITION", mark: 18, maxMark: 20, date: "2025-11-25", coefficient: 2 },
  
  // Student Yasmine KOUAME (std-2) - Terminale D
  { id: "grd-6", studentId: "std-2", subjectId: "sbj-1", classId: "cls-tle-d", trimester: 1, examType: "COMPOSITION", mark: 18.5, maxMark: 20, date: "2025-11-20", coefficient: 5 },
  { id: "grd-7", studentId: "std-2", subjectId: "sbj-3", classId: "cls-tle-d", trimester: 1, examType: "COMPOSITION", mark: 17.5, maxMark: 20, date: "2025-11-21", coefficient: 4 },
  { id: "grd-8", studentId: "std-2", subjectId: "sbj-4", classId: "cls-tle-d", trimester: 1, examType: "DEVOIR", mark: 16, maxMark: 20, date: "2025-10-14", coefficient: 3 },
  { id: "grd-8b", studentId: "std-2", subjectId: "sbj-7", classId: "cls-tle-d", trimester: 1, examType: "COMPOSITION", mark: 15.0, maxMark: 20, date: "2025-11-23", coefficient: 3 },

  // Student Franck KONAN (std-5) - 4ème
  { id: "grd-9", studentId: "std-5", subjectId: "sbj-1", classId: "cls-4", trimester: 1, examType: "DEVOIR", mark: 7.5, maxMark: 20, date: "2025-10-15", coefficient: 2 },
  { id: "grd-10", studentId: "std-5", subjectId: "sbj-1", classId: "cls-4", trimester: 1, examType: "COMPOSITION", mark: 8.0, maxMark: 20, date: "2025-11-20", coefficient: 3 },
  { id: "grd-11", studentId: "std-5", subjectId: "sbj-2", classId: "cls-4", trimester: 1, examType: "COMPOSITION", mark: 9.5, maxMark: 20, date: "2025-11-22", coefficient: 3 },

  // Student Boris TOSSOU (std-6) - Terminale A
  { id: "grd-12", studentId: "std-6", subjectId: "sbj-2", classId: "cls-tle-a", trimester: 1, examType: "COMPOSITION", mark: 17.0, maxMark: 20, date: "2025-11-20", coefficient: 5 },
  { id: "grd-13", studentId: "std-6", subjectId: "sbj-7", classId: "cls-tle-a", trimester: 1, examType: "COMPOSITION", mark: 16.5, maxMark: 20, date: "2025-11-21", coefficient: 4 },
  { id: "grd-14", studentId: "std-6", subjectId: "sbj-6", classId: "cls-tle-a", trimester: 1, examType: "DEVOIR", mark: 15.0, maxMark: 20, date: "2025-10-14", coefficient: 3 },

  // Student Félicité AGBALIKA (std-7) - 1ère D
  { id: "grd-15", studentId: "std-7", subjectId: "sbj-4", classId: "cls-1ere-d", trimester: 1, examType: "COMPOSITION", mark: 16.0, maxMark: 20, date: "2025-11-20", coefficient: 4 },
  { id: "grd-16", studentId: "std-7", subjectId: "sbj-3", classId: "cls-1ere-d", trimester: 1, examType: "DEVOIR", mark: 14.5, maxMark: 20, date: "2025-10-16", coefficient: 4 },

  // Student Rodrigue HOUNNOU (std-8) - 2nde C
  { id: "grd-17", studentId: "std-8", subjectId: "sbj-1", classId: "cls-2nde-c", trimester: 1, examType: "COMPOSITION", mark: 18.0, maxMark: 20, date: "2025-11-20", coefficient: 5 },
  { id: "grd-18", studentId: "std-8", subjectId: "sbj-3", classId: "cls-2nde-c", trimester: 1, examType: "COMPOSITION", mark: 15.5, maxMark: 20, date: "2025-11-22", coefficient: 4 },

  // Student Clarisse AGOSSOU (std-9) - Terminale G2
  { id: "grd-19", studentId: "std-9", subjectId: "sbj-cpt", classId: "cls-tle-g2", trimester: 1, examType: "COMPOSITION", mark: 19.0, maxMark: 20, date: "2025-11-20", coefficient: 6 },
  { id: "grd-20", studentId: "std-9", subjectId: "sbj-eco", classId: "cls-tle-g2", trimester: 1, examType: "COMPOSITION", mark: 17.0, maxMark: 20, date: "2025-11-21", coefficient: 4 },
  { id: "grd-21", studentId: "std-9", subjectId: "sbj-mat-fin", classId: "cls-tle-g2", trimester: 1, examType: "DEVOIR", mark: 18.5, maxMark: 20, date: "2025-10-18", coefficient: 4 },
  { id: "grd-22", studentId: "std-9", subjectId: "sbj-drt", classId: "cls-tle-g2", trimester: 1, examType: "COMPOSITION", mark: 16.0, maxMark: 20, date: "2025-11-24", coefficient: 3 },

  // Student Marc KPAKPO (std-10) - 3ème
  { id: "grd-23", studentId: "std-10", subjectId: "sbj-1", classId: "cls-3", trimester: 1, examType: "DEVOIR", mark: 15.5, maxMark: 20, date: "2025-10-15", coefficient: 2 },
  { id: "grd-24", studentId: "std-10", subjectId: "sbj-1", classId: "cls-3", trimester: 1, examType: "COMPOSITION", mark: 16.0, maxMark: 20, date: "2025-11-20", coefficient: 3 },
  { id: "grd-25", studentId: "std-10", subjectId: "sbj-2", classId: "cls-3", trimester: 1, examType: "DEVOIR", mark: 14.0, maxMark: 20, date: "2025-10-18", coefficient: 2 },
  { id: "grd-26", studentId: "std-10", subjectId: "sbj-2", classId: "cls-3", trimester: 1, examType: "COMPOSITION", mark: 14.5, maxMark: 20, date: "2025-11-22", coefficient: 3 },
  { id: "grd-27", studentId: "std-10", subjectId: "sbj-3", classId: "cls-3", trimester: 1, examType: "COMPOSITION", mark: 15.0, maxMark: 20, date: "2025-11-23", coefficient: 3 },
  { id: "grd-28", studentId: "std-10", subjectId: "sbj-4", classId: "cls-3", trimester: 1, examType: "DEVOIR", mark: 16.0, maxMark: 20, date: "2025-10-22", coefficient: 2 },
  { id: "grd-29", studentId: "std-10", subjectId: "sbj-6", classId: "cls-3", trimester: 1, examType: "COMPOSITION", mark: 17.0, maxMark: 20, date: "2025-11-25", coefficient: 2 },
  { id: "grd-30", studentId: "std-10", subjectId: "sbj-5", classId: "cls-3", trimester: 1, examType: "COMPOSITION", mark: 13.5, maxMark: 20, date: "2025-11-26", coefficient: 2 }
];

export const initialPayments: Payment[] = [
  {
    id: "pym-101",
    studentId: "std-1",
    receiptNumber: "REC-2025-00142",
    amountPaid: 300000,
    totalFee: 450000,
    remainingBalance: 150000,
    paymentType: "SCOLARITE",
    paymentMethod: "MOBILE_MONEY",
    date: "2025-09-10",
    trimester: 1,
    recordedBy: "Mme Clarisse BASSOLÉ",
    notes: "Acompte Tronc 1 via Wave/Orange Money"
  },
  {
    id: "pym-102",
    studentId: "std-2",
    receiptNumber: "REC-2025-00189",
    amountPaid: 580000,
    totalFee: 580000,
    remainingBalance: 0,
    paymentType: "SCOLARITE",
    paymentMethod: "VIREMENT",
    date: "2025-09-02",
    trimester: 1,
    recordedBy: "Mme Clarisse BASSOLÉ",
    notes: "Solde annuel total versé par virement bancaire"
  },
  {
    id: "pym-103",
    studentId: "std-4",
    receiptNumber: "REC-2025-00204",
    amountPaid: 250000,
    totalFee: 250000,
    remainingBalance: 0,
    paymentType: "SCOLARITE",
    paymentMethod: "ESPECES",
    date: "2025-09-05",
    trimester: 1,
    recordedBy: "Mme Clarisse BASSOLÉ",
    notes: "Paiement intégral Maternelle"
  },
  {
    id: "pym-104",
    studentId: "std-6",
    receiptNumber: "REC-2025-00235",
    amountPaid: 135000,
    totalFee: 135000,
    remainingBalance: 0,
    paymentType: "SCOLARITE",
    paymentMethod: "VIREMENT",
    date: "2025-09-08",
    trimester: 1,
    recordedBy: "Mme Clarisse BASSOLÉ",
    notes: "Solde annuel complet Terminale A"
  },
  {
    id: "pym-105",
    studentId: "std-7",
    receiptNumber: "REC-2025-00278",
    amountPaid: 75000,
    totalFee: 125000,
    remainingBalance: 50000,
    paymentType: "SCOLARITE",
    paymentMethod: "MOBILE_MONEY",
    date: "2025-09-12",
    trimester: 1,
    recordedBy: "Mme Clarisse BASSOLÉ",
    notes: "Acompte 1ère Tranche 1ère D"
  },
  {
    id: "pym-106",
    studentId: "std-8",
    receiptNumber: "REC-2025-00312",
    amountPaid: 60000,
    totalFee: 115000,
    remainingBalance: 55000,
    paymentType: "SCOLARITE",
    paymentMethod: "ESPECES",
    date: "2025-09-15",
    trimester: 1,
    recordedBy: "Mme Clarisse BASSOLÉ",
    notes: "Acompte 2nde C"
  },
  {
    id: "pym-107",
    studentId: "std-9",
    receiptNumber: "REC-2025-00340",
    amountPaid: 145000,
    totalFee: 145000,
    remainingBalance: 0,
    paymentType: "SCOLARITE",
    paymentMethod: "VIREMENT",
    date: "2025-09-10",
    trimester: 1,
    recordedBy: "Mme Clarisse BASSOLÉ",
    notes: "Solde annuel complet Terminale G2 (Comptabilité & Gestion)"
  },
  {
    id: "pym-108",
    studentId: "std-10",
    receiptNumber: "REC-2025-00360",
    amountPaid: 75000,
    totalFee: 100000,
    remainingBalance: 25000,
    paymentType: "SCOLARITE",
    paymentMethod: "MOBILE_MONEY",
    date: "2025-09-14",
    trimester: 1,
    recordedBy: "Mme Clarisse BASSOLÉ",
    notes: "Acompte 1ère Tranche Scolarité 3ème (Reste: 25.000 FCFA)"
  }
];

export const initialExpenses: Expense[] = [
  { id: "exp-1", title: "Achat Fournitures & Craies Blanches/Couleur", category: "FOURNITURES", amount: 185000, date: "2025-10-02", recipient: "Papeterie Centrale", approvedBy: "Dr. Amadou KOUASSI" },
  { id: "exp-2", title: "Paiement Salaires Enseignants Octobre", category: "SALAIRES", amount: 12450000, date: "2025-10-30", recipient: "Virement Collectif BANQUE", approvedBy: "Dr. Amadou KOUASSI" },
  { id: "exp-3", title: "Maintenance Climatiseurs Amphi B", category: "MAINTENANCE", amount: 240000, date: "2025-11-12", recipient: "ProFroid Ivoir", approvedBy: "Mme Clarisse BASSOLÉ" },
  { id: "exp-4", title: "Facture Électricité & Eau Établissement", category: "FACTURES", amount: 480000, date: "2025-11-15", recipient: "CIE / SODECI", approvedBy: "Dr. Amadou KOUASSI" }
];

export const initialAttendance: AttendanceRecord[] = [
  { id: "att-1", date: "2025-11-24", entityType: "STUDENT", entityId: "std-1", classId: "cls-3", status: "PRESENT" },
  { id: "att-2", date: "2025-11-24", entityType: "STUDENT", entityId: "std-5", classId: "cls-4", status: "RETARD", minutesLate: 15, reason: "Embouteillage" },
  { id: "att-3", date: "2025-11-24", entityType: "STUDENT", entityId: "std-2", classId: "cls-5", status: "PRESENT" },
  { id: "att-4", date: "2025-11-25", entityType: "STUDENT", entityId: "std-5", classId: "cls-4", status: "ABSENT", reason: "Maladie (Mot de passe parent fourni)" },
  { id: "att-5", date: "2025-11-25", entityType: "TEACHER", entityId: "tch-2", status: "PRESENT" },
  { id: "att-6", date: "2025-11-24", entityType: "STUDENT", entityId: "std-10", classId: "cls-3", status: "PRESENT" },
  { id: "att-7", date: "2025-11-25", entityType: "STUDENT", entityId: "std-10", classId: "cls-3", status: "RETARD", minutesLate: 10, reason: "Panne de transport (justifiée)" }
];

export const initialTimetable: TimetableSlot[] = [
  { id: "tbl-1", classId: "cls-3", dayOfWeek: "Lundi", startTime: "08:00", endTime: "10:00", subjectId: "sbj-1", teacherId: "tch-2", room: "Salle C3" },
  { id: "tbl-2", classId: "cls-3", dayOfWeek: "Lundi", startTime: "10:15", endTime: "12:15", subjectId: "sbj-2", teacherId: "tch-3", room: "Salle C3" },
  { id: "tbl-3", classId: "cls-3", dayOfWeek: "Mardi", startTime: "08:00", endTime: "10:00", subjectId: "sbj-5", teacherId: "tch-4", room: "Salle C3" },
  { id: "tbl-4", classId: "cls-3", dayOfWeek: "Mardi", startTime: "10:15", endTime: "12:15", subjectId: "sbj-6", teacherId: "tch-3", room: "Lab Langues" },
  { id: "tbl-5", classId: "cls-5", dayOfWeek: "Lundi", startTime: "08:00", endTime: "11:00", subjectId: "sbj-1", teacherId: "tch-2", room: "Salle L12" },
  { id: "tbl-6", classId: "cls-5", dayOfWeek: "Lundi", startTime: "11:15", endTime: "13:00", subjectId: "sbj-3", teacherId: "tch-2", room: "Lab Physique" }
];

export const initialExams: Exam[] = [
  { id: "exm-1", title: "Examen Blanc Régional Tronc 1", subjectId: "sbj-1", classId: "cls-3", date: "2025-12-10", time: "08:00", duration: "3 heures", room: "Grande Salle Amphi A", coefficient: 4, supervisorName: "M. Paulin MENSAH" },
  { id: "exm-2", title: "Composition Nationale de Français", subjectId: "sbj-2", classId: "cls-3", date: "2025-12-12", time: "08:00", duration: "4 heures", room: "Grande Salle Amphi A", coefficient: 4, supervisorName: "Mme Aïcha OUEDRAOGO" },
  { id: "exm-3", title: "Bac Blanc Physique-Chimie", subjectId: "sbj-3", classId: "cls-5", date: "2025-12-15", time: "08:00", duration: "4 heures", room: "Salle L12", coefficient: 5, supervisorName: "M. Paulin MENSAH" }
];

export const initialHomework: Homework[] = [
  { id: "hwk-1", classId: "cls-3", subjectId: "sbj-1", teacherId: "tch-2", title: "Exercices d'Algorithmique & Équations du 2nd degré", description: "Faire les exercices N° 12, 14 et 18 de la page 45 du Manuel CIAM 3ème.", assignedDate: "2025-11-20", dueDate: "2025-11-27" },
  { id: "hwk-2", classId: "cls-3", subjectId: "sbj-2", teacherId: "tch-3", title: "Commentaire composé - Texte de Léopold Sédar Senghor", description: "Rédiger l'introduction et le premier axe d'analyse du poème 'Femme Noire'.", assignedDate: "2025-11-22", dueDate: "2025-11-29" }
];

export const initialBooks: Book[] = [
  { id: "bk-1", title: "L'Aventure Ambiguë", author: "Cheikh Hamidou Kane", isbn: "978-2266023340", category: "Littérature Africaine", totalCopies: 15, availableCopies: 11, publishedYear: "1961", shelfLocation: "Rayon A-12" },
  { id: "bk-2", title: "Mathématiques CIAM 3ème", author: "Collectif EDICEF", isbn: "978-2841295500", category: "Manuel Scolaire", totalCopies: 40, availableCopies: 32, publishedYear: "2018", shelfLocation: "Rayon M-04" },
  { id: "bk-3", title: "Physique Chimie Terminale S", author: "Hachette Éducation", isbn: "978-2011254880", category: "Sciences", totalCopies: 25, availableCopies: 19, publishedYear: "2020", shelfLocation: "Rayon S-08" },
  { id: "bk-4", title: "Le Rouge et le Noir", author: "Stendhal", isbn: "978-2070413110", category: "Littérature Classique", totalCopies: 10, availableCopies: 8, publishedYear: "1830", shelfLocation: "Rayon L-02" }
];

export const initialBookLoans: BookLoan[] = [
  { id: "ln-1", bookId: "bk-1", studentId: "std-1", loanDate: "2025-11-10", dueDate: "2025-11-24", status: "EN_RETARD", notes: "Rappel envoyé par SMS" },
  { id: "ln-2", bookId: "bk-2", studentId: "std-2", loanDate: "2025-11-18", dueDate: "2025-12-02", status: "EN_COURS", notes: "Préparation examen" },
  { id: "ln-3", bookId: "bk-3", studentId: "std-4", loanDate: "2025-11-05", dueDate: "2025-11-19", returnedDate: "2025-11-18", status: "RETOURNE" }
];

export const initialCanteenMenus: CanteenMenuItem[] = [
  { id: "menu-1", day: "Lundi", dish: "Riz au Gras avec Poulet Braisé & Salade fraîche", dessert: "Fruits de saison (Oranges douces)", drink: "Eau minérale & Jus de Bissap", price: 1000 },
  { id: "menu-2", day: "Mardi", dish: "Attiéké Poisson Carpe braisée & Alloco", dessert: "Yaourt nature sucré", drink: "Jus de Gingembre doux", price: 1000 },
  { id: "menu-3", day: "Mercredi", dish: "Ragoût de Pommes de terre à la viande de bœuf & Petits pois", dessert: "Bananes & Gâteau maison", drink: "Eau fraîche", price: 1000 },
  { id: "menu-4", day: "Jeudi", dish: "Placali / Igname pilée Sauce Gombo & Viande fumée", dessert: "Salade de fruits tropicaux", drink: "Jus de Tamarin", price: 1000 },
  { id: "menu-5", day: "Vendredi", dish: "Riz Blanc Sauce Tomate Graine au Poisson frais", dessert: "Papaye & Mangue découpée", drink: "Jus de Baobab", price: 1000 },
  { id: "menu-6", day: "Samedi", dish: "Spaghetti Bolognaise spéciale cantine scolaire", dessert: "Biscuits & Pomme", drink: "Eau minérale", price: 800 }
];

export const initialCanteenPlans: CanteenPlan[] = [
  { id: "cnt-1", studentId: "std-1", planType: "TRIMESTRIEL", status: "ACTIF", dietaryNotes: "Sans arachide", amountPaid: 45000, startDate: "2025-09-15", endDate: "2025-12-15" },
  { id: "cnt-2", studentId: "std-4", planType: "TRIMESTRIEL", status: "ACTIF", dietaryNotes: "Aucune allergie", amountPaid: 45000, startDate: "2025-09-15", endDate: "2025-12-15" },
  { id: "cnt-3", studentId: "std-5", planType: "MENSUEL", status: "EN_ATTENTE", dietaryNotes: "Végétarien le vendredi", amountPaid: 15000, startDate: "2025-11-01", endDate: "2025-11-30" },
  { id: "cnt-4", studentId: "std-prim-1", planType: "TRIMESTRIEL", status: "ACTIF", dietaryNotes: "Menu enfant adapté", amountPaid: 35000, startDate: "2025-09-15", endDate: "2025-12-15" }
];

export const initialAdministrativeDocuments: AdministrativeDocument[] = [
  {
    id: "doc-cert-1",
    studentId: "std-1",
    type: "CERTIFICAT_SCOLARITE",
    documentNumber: "CERT-2025-0012",
    issueDate: "2025-10-15",
    academicYear: "2025-2026",
    reason: "Pour servir et valoir ce que de droit (Dossier de Passeport & Démarches administratives)",
    directorName: "Dr. Amadou KOUASSI",
    observations: "Élève assidu(e) et régulier(ère) aux cours.",
    showStamp: true
  },
  {
    id: "doc-cert-2",
    studentId: "std-4",
    type: "CERTIFICAT_SCOLARITE",
    documentNumber: "CERT-2025-0018",
    issueDate: "2025-10-22",
    academicYear: "2025-2026",
    reason: "Dossier d'Allocations Familiales et Prise en Charge",
    directorName: "Dr. Amadou KOUASSI",
    observations: "Inscrit(e) régulièrement en classe d'examen.",
    showStamp: true
  },
  {
    id: "doc-attest-1",
    studentId: "std-2",
    type: "ATTESTATION_FREQUENTATION",
    documentNumber: "ATT-2025-0005",
    issueDate: "2025-11-05",
    academicYear: "2025-2026",
    reason: "Attestation de Fréquentation Régulière",
    directorName: "Dr. Amadou KOUASSI",
    observations: "Fréquente assidûment les cours depuis la rentrée scolaire.",
    showStamp: true
  }
];

export const initialTransportRoutes: TransportRoute[] = [
  { id: "trp-1", routeName: "Ligne 1 - Cocody / Deux Plateaux / Riviera", busNumber: "BUS-01 (Toyota Coaster)", driverName: "M. Bakary SANE", driverPhone: "+225 07 44 55 66", capacity: 30, monthlyFee: 35000, registeredStudentCount: 26, stops: ["Riviera 2", "Riviera 3", "Deux Plateaux Vallons", "Cocody Centre", "École"] },
  { id: "trp-2", routeName: "Ligne 2 - Marcory / Koumassi / Zone 4", busNumber: "BUS-02 (Isuzu)", driverName: "M. Traoré ALASSANE", driverPhone: "+225 05 33 22 11", capacity: 35, monthlyFee: 40000, registeredStudentCount: 31, stops: ["Zone 4 C", "Marcory Résidentiel", "Koumassi Remblais", "École"] }
];

export const initialCommunications: CommunicationMessage[] = [
  { id: "msg-1", senderName: "Direction Générale", recipientGroup: "TOUS", channel: "SMS", subject: "Rappel Réunion Parents-Professeurs", content: "Chers parents, la réunion du 1er trimestre aura lieu ce samedi à 09h00 en Amphi A.", sentAt: "2025-11-20 14:30", deliveryCount: 380, status: "LIVRE" },
  { id: "msg-2", senderName: "Service Comptabilité", recipientGroup: "PARENTS", channel: "WHATSAPP", subject: "Avis de Recouvrement 1er Trimestre", content: "Chers parents, nous vous prions de bien vouloir régulariser le solde de scolarité avant le 05 Décembre.", sentAt: "2025-11-22 10:15", deliveryCount: 145, status: "LIVRE" }
];

export const initialExamPapers = [
  {
    id: "ex-paper-1",
    title: "DEVOIR SURVEILLÉ N°1 DU PREMIER TRIMESTRE",
    classId: "cls-3",
    className: "3ème A",
    subjectName: "Mathématiques",
    examType: "DEVOIR" as const,
    trimester: 1,
    academicYear: "2025-2026",
    duration: "02 Heures",
    coefficient: 3,
    instructions: "L'usage de la calculatrice non programmable est autorisé. Les deux exercices et le problème sont obligatoires.",
    content: `EXERCICE 1 : CALCUL NUMÉRIQUE & RACINES CARRÉES (6 points)
1) Simplifier les expressions sous forme a√b :
   a) A = √(17 - 12√2) + √(8 + √48) - 3
   b) B = √(x² + 16) pour x = 3
   c) C = 9 - √27 + √(52 - 30√3)
2) Résoudre dans ℝ l'équation : (3x + 1)² - 25 = 0

EXERCICE 2 : GÉOMÉTRIE DANS LE PLAN (6 points)
Soit le triangle rectangle ABC représenté ci-dessous :

<svg viewBox="0 0 320 180" width="100%" max-width="320" xmlns="http://www.w3.org/2000/svg" class="my-3"><rect width="320" height="180" fill="#f8fafc" rx="8" stroke="#cbd5e1"/><path d="M40 140 L280 140 L40 30 Z" fill="none" stroke="#0f172a" stroke-width="2"/><rect x="40" y="125" width="15" height="15" fill="none" stroke="#0f172a" stroke-width="1.5"/><circle cx="40" cy="140" r="3" fill="#0f172a"/><circle cx="280" cy="140" r="3" fill="#0f172a"/><circle cx="40" cy="30" r="3" fill="#0f172a"/><text x="25" y="155" font-weight="bold" font-size="12">A (90°)</text><text x="285" y="155" font-weight="bold" font-size="12">B</text><text x="35" y="20" font-weight="bold" font-size="12">C</text><text x="135" y="155" font-size="11" fill="#475569">AB = 4 cm</text><text x="10" y="90" font-size="11" fill="#475569">AC = 3 cm</text></svg>

1) Calculer la longueur de l'hypoténuse BC = √(AB² + AC²).
2) Déterminer cos(∠ABC) et sin(∠ABC).

[--- PAGE 2 / VERSO ---]

PROBLÈME : SITUATION COMPLEXE (8 points)
Un entrepreneur souhaite construire une clôture rectangulaire autour d'un terrain. La longueur L dépasse la largeur l de 15 mètres, et le périmètre total est égal à 110 mètres.
1) Écrire le système d'équations traduisant cette situation.
2) Déterminer les dimensions L et l du terrain.
3) Calculer l'aire totale du terrain en mètres carrés.`,
    createdAt: "2025-11-10"
  },
  {
    id: "ex-paper-2",
    title: "COMPOSITION DU PREMIER TRIMESTRE",
    classId: "cls-5",
    className: "Terminales C & D",
    subjectName: "Physique-Chimie et Technologie (PCT)",
    examType: "COMPOSITION" as const,
    trimester: 1,
    academicYear: "2025-2026",
    duration: "03 Heures",
    coefficient: 4,
    instructions: "Rédiger avec soin. Les schémas doivent être annotés au crayon.",
    content: `CHIMIE : CINETIQUE ET SOLUTIONS AQUEUSES (8 points)
On mélange un volume V1 = 50 mL d'une solution de thiosulfate de sodium de concentration C1 = 0,2 mol/L avec un volume V2 = 50 mL d'acide chlorhydrique de concentration C2 = 0,4 mol/L.
1) Écrire l'équation-bilan de la réaction d'oxydoréduction.
2) Dresser le tableau d'avancement de la réaction.
3) Calculer la masse de soufre solide formé à l'état final.

PHYSIQUE : MÉCANIQUE DU POINT (12 points)
Un solide (S) de masse m = 500 g glisse sur une piste inclinée d'un angle α = 30° par rapport à l'horizontale.
1) Faire le bilan des forces appliquées au solide.
2) En appliquant le théorème de l'énergie cinétique, déterminer la vitesse du solide au bas de la piste.`,
    createdAt: "2025-12-15"
  },
  {
    id: "ex-paper-3",
    title: "BEPC BLANC RÉGIONAL - ÉPREUVE DE SVT",
    classId: "cls-3",
    className: "3ème A",
    subjectName: "Sciences de la Vie et de la Terre (SVT)",
    examType: "EXAMEN_BLANC" as const,
    trimester: 2,
    academicYear: "2024-2025",
    duration: "02 Heures",
    coefficient: 2,
    instructions: "L'usage de la calculatrice est interdit. Réponses claires et précises exigées.",
    content: `PARTIE I : RESTITUTION SÉCURISÉE DES CONNAISSANCES (8 points)
1) Définir : Réflexe inné, Synapse, Immunité acquise.
2) Expliquer le rôle du pancréas dans la régulation de la glycémie sanguine.

PARTIE II : RÉSOLUTION DE PROBLÈME / SITUATION COMPLEXE (12 points)
Monsieur KANON, agriculteur à Djougou, observe une baisse de rendement de sa maïsiculture...`,
    createdAt: "2025-03-10"
  },
  {
    id: "ex-paper-4",
    title: "BAC BLANC NATIONAL - ÉPREUVE DE FRANÇAIS",
    classId: "cls-5",
    className: "Terminales C & D",
    subjectName: "Français & Littérature",
    examType: "EXAMEN_BLANC" as const,
    trimester: 2,
    academicYear: "2023-2024",
    duration: "04 Heures",
    coefficient: 3,
    instructions: "Le candidat traitera au choix l'un des trois sujets suivants (Contraction, Dissertaion, Commentaire).",
    content: `SUJET I : CONTRACTION DE TEXTE ET ESSAI
Résumé du texte de Léopold Sédar Senghor sur la Négritude et la Civilisation de l'Universel...

SUJET II : DISSERTATION LITTÉRAIRE
« La littérature africaine contemporaine doit-elle obligatoirement être engagée ? »`,
    createdAt: "2024-04-12"
  }
];

export const initialArchivedReportCards: ArchivedReportCard[] = [
  {
    id: "arc-2024-1",
    studentId: "std-1",
    studentName: "KOUANDÉ Marc",
    registrationNumber: "2023-MAT-001",
    photoUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200",
    classId: "cls-3",
    className: "3ème A",
    trimester: 1,
    academicYear: "2023-2024",
    overallAverage: 16.85,
    rank: "1er",
    totalStudentsInClass: 38,
    mention: "EXCELLENT",
    generalAppreciation: "Élève exemplaire, félicitations du conseil de classe.",
    printedAt: "2023-12-20T10:15:00Z",
    printedBy: "Directeur Général",
    bulletinTemplateName: "Modèle National Bénin (Coefficienté)"
  },
  {
    id: "arc-2024-2",
    studentId: "std-2",
    studentName: "SOSSOU Chimène",
    registrationNumber: "2023-MAT-002",
    photoUrl: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=200",
    classId: "cls-3",
    className: "3ème A",
    trimester: 1,
    academicYear: "2023-2024",
    overallAverage: 15.40,
    rank: "2ème",
    totalStudentsInClass: 38,
    mention: "TRÈS BIEN",
    generalAppreciation: "Très bon trimestre. Continuez ainsi.",
    printedAt: "2023-12-20T10:20:00Z",
    printedBy: "Directeur Général",
    bulletinTemplateName: "Modèle National Bénin (Coefficienté)"
  },
  {
    id: "arc-2025-1",
    studentId: "std-1",
    studentName: "KOUANDÉ Marc",
    registrationNumber: "2024-MAT-001",
    photoUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200",
    classId: "cls-3",
    className: "3ème A",
    trimester: 3,
    academicYear: "2024-2025",
    overallAverage: 17.20,
    rank: "1er",
    totalStudentsInClass: 40,
    mention: "EXCELLENT",
    generalAppreciation: "Admis en classe supérieure avec les félicitations du jury.",
    printedAt: "2025-06-25T14:30:00Z",
    printedBy: "Secrétariat Général",
    bulletinTemplateName: "Modèle National Bénin (Coefficienté)"
  }
];

export const initialSubscriptionPlans = [
  {
    id: "plan-daily",
    name: "Pass Quotidien",
    badge: "24 Heures",
    description: "Accès complet pendant 24 heures (1 jour) pour saisies et opérations ponctuelles.",
    priceMonthly: 250,
    priceAnnual: 250,
    maxStudents: "UNLIMITED" as const,
    maxTeachers: "UNLIMITED" as const,
    storageLimitGb: 100,
    smsIncludedMonthly: 1000,
    aiScansIncludedMonthly: 100,
    color: "slate",
    features: [
      "Accès complet à tous les modules",
      "Élèves & Enseignants ILLIMITÉS",
      "Saisie des notes & Bulletins QR Code",
      "Scolarité, Caisses & Discipline",
      "Paiement unique : 250 FCFA / 24H"
    ]
  },
  {
    id: "plan-weekly",
    name: "Pass Hebdomadaire",
    badge: "7 Jours",
    description: "Accès complet pendant 1 semaine (7 jours consécutifs) sans interruption.",
    priceMonthly: 1250,
    priceAnnual: 1250,
    maxStudents: "UNLIMITED" as const,
    maxTeachers: "UNLIMITED" as const,
    storageLimitGb: 100,
    smsIncludedMonthly: 2000,
    aiScansIncludedMonthly: 300,
    color: "blue",
    features: [
      "Accès complet à tous les modules",
      "Élèves & Enseignants ILLIMITÉS",
      "Scan OCR IA des listes d'élèves & Note",
      "Cartes scolaires scannables QR",
      "Paiement unique : 1 250 FCFA / 7 Jours"
    ]
  },
  {
    id: "plan-monthly",
    name: "Pass Mensuel",
    badge: "Plus Populaire",
    recommended: true,
    description: "Accès illimité pendant 1 mois (30 jours) pour tout l'établissement.",
    priceMonthly: 5000,
    priceAnnual: 5000,
    maxStudents: "UNLIMITED" as const,
    maxTeachers: "UNLIMITED" as const,
    storageLimitGb: 250,
    smsIncludedMonthly: 5000,
    aiScansIncludedMonthly: 1000,
    color: "emerald",
    features: [
      "Toutes les fonctionnalités de la plateforme",
      "Élèves & Enseignants ILLIMITÉS",
      "Conseil de classe automatique & Rangings",
      "Espaces Parents & Élèves sur mobile",
      "Relances automatiques SMS & WhatsApp",
      "Paiement unique : 5 000 FCFA / 30 Jours"
    ]
  },
  {
    id: "plan-annual",
    name: "Pass Annuel VIP",
    badge: "Économique (1 An)",
    description: "Accès illimité pendant toute l'année scolaire (365 jours consécutifs).",
    priceMonthly: 50000,
    priceAnnual: 50000,
    maxStudents: "UNLIMITED" as const,
    maxTeachers: "UNLIMITED" as const,
    storageLimitGb: 500,
    smsIncludedMonthly: 20000,
    aiScansIncludedMonthly: 5000,
    color: "indigo",
    features: [
      "Accès illimité 365 jours sur toute l'année",
      "Élèves, Enseignants & Salles ILLIMITÉS",
      "Exportation Excel / PDF / Word complète",
      "Support prioritaire 7j/7 & Ligne VIP",
      "Inclus 1 semaine offerte à l'inscription",
      "Paiement unique : 50 000 FCFA / An"
    ]
  }
];

export const initialSchoolSubscription = {
  id: "sub-temple-2025",
  planId: "plan-annual",
  planName: "Pass Annuel VIP (365 Jours)",
  status: "ACTIVE" as const,
  billingCycle: "ANNUAL" as const,
  startDate: "2025-09-01",
  nextRenewalDate: "2026-09-01",
  amountPaid: 50000,
  currency: "FCFA",
  paymentMethod: "MOBILE_MONEY" as const,
  smsUsedThisMonth: 840,
  aiScansUsedThisMonth: 125,
  storageUsedGb: 8.4
};

export const initialSubscriptionInvoices = [
  {
    id: "inv-2025-001",
    invoiceNumber: "FACT-TEMPLE-2025-01",
    date: "2025-09-01",
    planName: "Pass Annuel VIP (365 Jours)",
    amount: 50000,
    currency: "FCFA",
    period: "Septembre 2025 - Août 2026",
    paymentMethod: "MTN MoMo (01 67 43 03 81)",
    status: "PAYÉ" as const
  },
  {
    id: "inv-2024-001",
    invoiceNumber: "FACT-TEMPLE-2024-01",
    date: "2024-09-01",
    planName: "Pass Mensuel (30 Jours)",
    amount: 5000,
    currency: "FCFA",
    period: "Août 2024 - Septembre 2024",
    paymentMethod: "Moov Money",
    status: "PAYÉ" as const
  }
];

export const initialRegistrationCampaigns = [
  {
    id: "camp-rentree-2025",
    code: "CAMP-RENTREE-2025",
    name: "Campagne Grande Rentrée Scolaire 2025-2026",
    targetRegion: "Littoral & Atlantique (Cotonou, Abomey-Calavi)",
    description: "Campagne officielle de rentrée pour les écoles primaires et secondaires privées avec 30 jours d'accès complet offert.",
    proposedPlanId: "plan-monthly",
    freeTrialDays: 30,
    status: "ACTIVE" as const,
    createdAt: "2025-08-01",
    expiresAt: "2025-11-30",
    registrationsCount: 4,
    approvedCount: 3,
    welcomeMessage: "Bienvenue dans le Réseau Scolaire ! Votre établissement bénéficie d'une offre spéciale de rentrée de 30 jours gratuits après autorisation du Promoteur.",
    commissionRate: 15
  },
  {
    id: "camp-partenaires-oueme",
    code: "PARTENAIRES-OUEME",
    name: "Partenariat Établissements Ouémé & Plateau",
    targetRegion: "Ouémé (Porto-Novo, Sèmè-Kpodji, Akpro-Missérété)",
    description: "Offre réservée aux complexes scolaires et lycées du département de l'Ouémé.",
    proposedPlanId: "plan-annual",
    freeTrialDays: 30,
    status: "ACTIVE" as const,
    createdAt: "2025-08-10",
    expiresAt: "2025-12-31",
    registrationsCount: 2,
    approvedCount: 1,
    welcomeMessage: "Offre d'adhésion officielle pour les écoles de Porto-Novo et environs. Démarrez votre gestion scolaire sans frais.",
    commissionRate: 20
  },
  {
    id: "camp-decouverte-nationale",
    code: "DECOUVERTE-SCOLAIRE",
    name: "Campagne Nationale Découverte & Numérisation",
    targetRegion: "National (Bénin & Afrique Francophone)",
    description: "Lien d'inscription direct pour toute école souhaitant numériser ses bulletins, notes, épreuves et finances.",
    proposedPlanId: "plan-weekly",
    freeTrialDays: 14,
    status: "ACTIVE" as const,
    createdAt: "2025-08-15",
    expiresAt: "2026-06-30",
    registrationsCount: 3,
    approvedCount: 2,
    welcomeMessage: "Rejoignez la plateforme de gestion scolaire de référence. Votre inscription sera examinée et validée rapidement par le promoteur.",
    commissionRate: 10
  }
];


