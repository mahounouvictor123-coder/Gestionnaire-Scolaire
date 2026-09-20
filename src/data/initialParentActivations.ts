import { ParentActivationRecord } from '../types';

export const cleanDigits = (val: string): string => val.replace(/\D/g, '');

export const matchPhone = (phoneA: string, phoneB: string): boolean => {
  const d1 = cleanDigits(phoneA);
  const d2 = cleanDigits(phoneB);
  if (!d1 || !d2) return false;
  if (d1 === d2) return true;
  // Match if last 8 digits match (standard phone number length in West Africa)
  if (d1.length >= 8 && d2.length >= 8) {
    return d1.slice(-8) === d2.slice(-8);
  }
  return d1.endsWith(d2) || d2.endsWith(d1);
};

export const generateReceiptCode = (): string => {
  // 5-character alphanumeric uppercase code (e.g. A7K9P)
  // Excludes confusing characters (0, O, 1, I) to ensure maximum readability
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = '';
  for (let i = 0; i < 5; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

export const getCurrentMonthKey = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
};

export const formatMonthLabel = (monthKey: string): string => {
  const [year, month] = monthKey.split('-');
  const monthNames = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ];
  const idx = parseInt(month, 10) - 1;
  return `${monthNames[idx] || month} ${year}`;
};

// Realistic initial activations
const currentMonth = getCurrentMonthKey();
const now = new Date();
const pastDate1 = new Date(now);
pastDate1.setDate(pastDate1.getDate() - 5);
const expiryDate1 = new Date(pastDate1);
expiryDate1.setDate(expiryDate1.getDate() + 30);

const pastDate2 = new Date(now);
pastDate2.setDate(pastDate2.getDate() - 10);
const expiryDate2 = new Date(pastDate2);
expiryDate2.setDate(expiryDate2.getDate() + 30);

export const initialParentActivations: ParentActivationRecord[] = [
  {
    id: "act-demo-1",
    phone: "0899887766",
    rawPhone: "+225 08 99 88 77 66",
    parentName: "Mme Chantal DIALLO",
    studentId: "std-1",
    studentName: "Marc-Aurele DIALLO",
    className: "3ème A",
    schoolId: "sch-temple",
    schoolName: "GESTIONNAIRE SCOLAIRE",
    status: "actif",
    activationDate: pastDate1.toISOString(),
    fin_abonnement: expiryDate1.toISOString().split('T')[0],
    receiptCode: "A7K9P",
    fee: 1000,
    promoterCommission: 600,
    schoolShare: 300,
    monthKey: currentMonth,
    isPaidToSchool: false,
    notes: "Activation à distance 30 jours via Super-Promoteur"
  },
  {
    id: "act-demo-2",
    phone: "0722334455",
    rawPhone: "+225 07 22 33 44 55",
    parentName: "M. Lucien KOUAME",
    studentId: "std-2",
    studentName: "Yasmine KOUAME",
    className: "Terminale D",
    schoolId: "sch-temple",
    schoolName: "GESTIONNAIRE SCOLAIRE",
    status: "actif",
    activationDate: pastDate2.toISOString(),
    fin_abonnement: expiryDate2.toISOString().split('T')[0],
    receiptCode: "R3M8X",
    fee: 1000,
    promoterCommission: 600,
    schoolShare: 300,
    monthKey: currentMonth,
    isPaidToSchool: true,
    paidToSchoolDate: pastDate1.toISOString().split('T')[0],
    notes: "Activation mensuelle renouvelée"
  }
];
