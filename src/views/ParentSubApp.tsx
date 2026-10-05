import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useApp } from '../lib/store';
import { Student, SchoolClass, Grade, Payment, CommunicationMessage, ParentComplaintMessage, ParentComplaintCategory, OfficialAnnouncement } from '../types';
import { updateDynamicPwaBranding, requestNotificationPermission, sendSystemNotification } from '../lib/pwaHelper';
import { triggerAutoInstall, isDesktopPC } from '../lib/pwaInstallManager';
import { PwaInstallGuideModalProps } from '../components/modals/PwaInstallGuideModal';
import { PrintBulletinModal } from '../components/modals/PrintBulletinModal';
import { PrintReceiptModal } from '../components/modals/PrintReceiptModal';
import { 
  GraduationCap, 
  BookOpen, 
  MessageSquare, 
  CreditCard, 
  Bell, 
  BellRing, 
  Smartphone, 
  Monitor, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  FileText, 
  Printer, 
  UserCheck, 
  Users, 
  Phone, 
  ChevronRight, 
  Award, 
  Shield, 
  ShieldCheck,
  Info,
  Layers,
  Sparkles,
  Search,
  ExternalLink,
  Lock,
  Mic,
  MicOff,
  Square,
  Play,
  Pause,
  Image as ImageIcon,
  Trash2,
  Send,
  Check,
  LogOut,
  RefreshCw,
  X,
  Eye,
  Paperclip,
  Inbox,
  Megaphone,
  Globe,
  Pin,
  Share2,
  Copy,
  Zap,
  ArrowRight
} from 'lucide-react';
import { ParentAdvertisingShowcase } from '../components/ParentAdvertisingShowcase';
import { ParentExamPapersTab } from '../components/ParentExamPapersTab';
import { ParentQuizWeekTab } from '../components/ParentQuizWeekTab';

interface ParentSubAppProps {
  onReturnToPlatform?: () => void;
}

export const ParentSubApp: React.FC<ParentSubAppProps> = ({ onReturnToPlatform }) => {
  const { 
    currentSchool, 
    classes, 
    students, 
    subjects, 
    grades, 
    payments, 
    communications, 
    settings,
    parentComplaints,
    addParentComplaint,
    deleteParentComplaint,
    officialAnnouncements,
    markAnnouncementAsReadByParent,
    parentActivations,
    verifyAndClaimReceiptCode,
    examPapers,
    quizWeeks
  } = useApp();

  // Dynamic PWA branding update with School Name
  useEffect(() => {
    updateDynamicPwaBranding(currentSchool.name, 'PARENT');
  }, [currentSchool.name]);

  // Phone Authentication State
  const authPhoneKey = `PARENT_AUTH_PHONE_${currentSchool.id}`;
  const [authPhone, setAuthPhone] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(authPhoneKey) || '';
    }
    return '';
  });
  const [phoneInput, setPhoneInput] = useState('');
  const [phoneLoginError, setPhoneLoginError] = useState<string | null>(null);

  // Parent Payment & Subscription UI State
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedPaymentPlan, setSelectedPaymentPlan] = useState<'MONTHLY' | 'ANNUAL'>('MONTHLY');
  const [claimReceiptCodeInput, setClaimReceiptCodeInput] = useState('');
  const [claimReceiptFeedback, setClaimReceiptFeedback] = useState<{ success: boolean; message: string } | null>(null);
  const [copiedPaymentLabel, setCopiedPaymentLabel] = useState<string | null>(null);

  // Copy helper
  const handleCopyPaymentText = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedPaymentLabel(label);
    setTimeout(() => setCopiedPaymentLabel(null), 3000);
  };

  // Helper: Normalize phone numbers for matching (e.g. +229 97 22 33 44 => 97223344)
  const cleanDigits = (val: string) => val.replace(/\D/g, '');
  const matchPhone = (phoneA: string, phoneB: string) => {
    const d1 = cleanDigits(phoneA);
    const d2 = cleanDigits(phoneB);
    if (!d1 || !d2) return false;
    if (d1 === d2) return true;
    return d1.endsWith(d2) || d2.endsWith(d1);
  };

  // Find students associated with the authenticated phone number
  const authenticatedChildren = useMemo(() => {
    if (!authPhone) return [];
    return students.filter(s => matchPhone(s.parentPhone, authPhone));
  }, [students, authPhone]);

  // Parent Display Name derived from their children's records
  const authenticatedParentName = useMemo(() => {
    if (authenticatedChildren.length > 0) {
      return authenticatedChildren[0].parentName || 'Parent d’Élève';
    }
    return 'Parent d’Élève';
  }, [authenticatedChildren]);

  // Derived Parent Activation record from store
  const currentParentActivation = useMemo(() => {
    if (!authPhone) return null;
    const cleanAuth = cleanDigits(authPhone);
    return parentActivations.find(a => {
      const cleanA = cleanDigits(a.phone || a.rawPhone || '');
      const match = (cleanA && (cleanA === cleanAuth || cleanA.endsWith(cleanAuth) || cleanAuth.endsWith(cleanA)));
      return match && a.status === 'actif';
    }) || null;
  }, [parentActivations, authPhone]);

  // Is subscription currently active
  const isSubscriptionActive = useMemo(() => {
    if (currentParentActivation) {
      const exp = new Date(currentParentActivation.fin_abonnement);
      exp.setHours(23, 59, 59, 999);
      if (exp > new Date()) return true;
    }
    // Also check student profiles for this parent
    return authenticatedChildren.some(c => {
      if (c.parentSubscriptionStatus === 'actif') {
        if (!c.parentSubscriptionExpiresAt) return true;
        const exp = new Date(c.parentSubscriptionExpiresAt);
        exp.setHours(23, 59, 59, 999);
        return exp > new Date();
      }
      return false;
    });
  }, [currentParentActivation, authenticatedChildren]);

  // WhatsApp payment URL builder (relié au 0143754593)
  const getWhatsAppPaymentUrl = (plan: 'MONTHLY' | 'ANNUAL' = selectedPaymentPlan) => {
    const planText = plan === 'ANNUAL' ? '9 000 FCFA (Abonnement Annuel)' : '1 000 FCFA (Abonnement Mensuel - 30 jours)';
    const studentDetails = authenticatedChildren.map(c => {
      const cl = classes.find(cls => cls.id === c.classId)?.name || '';
      return `${c.firstName} ${c.lastName}${cl ? ` (${cl})` : ''}`;
    }).join(', ');

    const text = 
      `*PAIEMENT ESPACE PARENTS - GESTIONNAIRE SCOLAIRE*\n\n` +
      `Bonjour Monsieur le Promoteur,\n` +
      `Je viens d'effectuer mon paiement manuel pour l'accès à mon Espace Parents de l'école *${currentSchool.name}*.\n\n` +
      `👤 *Nom Parent :* ${authenticatedParentName}\n` +
      `📱 *Numéro du compte :* ${authPhone || phoneInput}\n` +
      `🎓 *Élève(s) :* ${studentDetails || 'Non spécifié'}\n` +
      `🏫 *Établissement :* ${currentSchool.name}\n` +
      `💰 *Formule choisie :* ${planText}\n\n` +
      `📸 *Ci-joint la capture d'écran de mon paiement (effectué via MTN 0167430381 ou 0143754593) pour activation à distance de mon compte.*`;

    return `https://wa.me/2290143754593?text=${encodeURIComponent(text)}`;
  };

  // WhatsApp link for pre-login gate
  const getLoginWhatsAppPaymentUrl = () => {
    const text = 
      `*PAIEMENT ESPACE PARENTS - GESTIONNAIRE SCOLAIRE*\n\n` +
      `Bonjour Monsieur le Promoteur,\n` +
      `Je souhaite souscrire à l'accès Espace Parents pour l'école *${currentSchool.name}* (1 000F / mois ou 9 000F / an).\n\n` +
      `📱 *Mon numéro :* ${phoneInput || 'À préciser'}\n\n` +
      `📸 *Ci-joint la capture de mon paiement pour activation à distance.*`;
    return `https://wa.me/2290143754593?text=${encodeURIComponent(text)}`;
  };

  // Redeem / Claim receipt code
  const handleClaimReceiptCodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!claimReceiptCodeInput.trim()) return;
    const res = verifyAndClaimReceiptCode(claimReceiptCodeInput.trim(), authPhone);
    setClaimReceiptFeedback(res);
    if (res.success) {
      setTimeout(() => {
        setClaimReceiptFeedback(null);
        setClaimReceiptCodeInput('');
        setIsPaymentModalOpen(false);
      }, 2500);
    }
  };

  // Active selected child among authenticated children
  const [activeStudentId, setActiveStudentId] = useState<string>('');

  useEffect(() => {
    if (authenticatedChildren.length > 0) {
      if (!activeStudentId || !authenticatedChildren.some(c => c.id === activeStudentId)) {
        setActiveStudentId(authenticatedChildren[0].id);
      }
    } else {
      setActiveStudentId('');
    }
  }, [authenticatedChildren, activeStudentId]);

  // Handle Login via Phone Number
  const handlePhoneLogin = (inputToTest?: string) => {
    const target = (inputToTest || phoneInput).trim();
    if (!target) {
      setPhoneLoginError("Veuillez saisir votre numéro de téléphone inscrit à l'école.");
      return;
    }

    const matched = students.filter(s => matchPhone(s.parentPhone, target));
    if (matched.length > 0) {
      localStorage.setItem(authPhoneKey, target);
      setAuthPhone(target);
      setPhoneLoginError(null);
      setActiveStudentId(matched[0].id);
    } else {
      setPhoneLoginError(
        `Aucun élève trouvé avec le numéro "${target}" pour l'école ${currentSchool.name}. Vérifiez votre saisie ou utilisez un numéro inscrit.`
      );
    }
  };

  // Handle Logout / Switch Phone
  const handleLogout = () => {
    localStorage.removeItem(authPhoneKey);
    setAuthPhone('');
    setActiveStudentId('');
    setPhoneInput('');
    setPhoneLoginError(null);
  };

  // Distinct phone numbers registered in this school for test convenience
  const registeredParentNumbers = useMemo(() => {
    const map = new Map<string, { phone: string; parentName: string; studentNames: string[] }>();
    students.forEach(s => {
      if (s.parentPhone) {
        const existing = map.get(s.parentPhone);
        if (existing) {
          existing.studentNames.push(`${s.firstName} (${classes.find(c => c.id === s.classId)?.name || 'Classe'})`);
        } else {
          map.set(s.parentPhone, {
            phone: s.parentPhone,
            parentName: s.parentName || 'Parent',
            studentNames: [`${s.firstName} (${classes.find(c => c.id === s.classId)?.name || 'Classe'})`]
          });
        }
      }
    });
    return Array.from(map.values());
  }, [students, classes]);

  // Modals & UI States
  const [activeTab, setActiveTab] = useState<'notes' | 'epreuves' | 'quiz-week' | 'messages' | 'scolarite' | 'dialogue'>('notes');
  const [selectedTrimester, setSelectedTrimester] = useState<number>(settings.currentTrimester || 1);
  const [isInstallModalOpen, setIsInstallModalOpen] = useState(false);
  const isPC = isDesktopPC();

  const handleAppInstall = async () => {
    const res = await triggerAutoInstall();
    if (res.success && res.outcome === 'accepted') return;
    setIsInstallModalOpen(true);
  };
  const [isBulletinModalOpen, setIsBulletinModalOpen] = useState(false);
  const [selectedReceiptForPrint, setSelectedReceiptForPrint] = useState<Payment | null>(null);
  const [isNotificationsEnabled, setIsNotificationsEnabled] = useState<boolean>(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      return Notification.permission === 'granted';
    }
    return false;
  });

  // Active student and their data
  const currentStudent: Student | undefined = useMemo(() => {
    return students.find(s => s.id === activeStudentId);
  }, [students, activeStudentId]);

  const currentStudentClass: SchoolClass | undefined = useMemo(() => {
    if (!currentStudent) return undefined;
    return classes.find(c => c.id === currentStudent.classId);
  }, [classes, currentStudent]);

  // Exam papers count available for current child (Permanent Archives via Direct Route)
  const childExamPapersCount = useMemo(() => {
    if (!currentStudent) return 0;
    const targetClassId = currentStudent.classId;
    const targetClassName = currentStudentClass?.name?.toLowerCase().trim() || '';

    return examPapers.filter(paper => {
      if (paper.isAvailableForStudents === false && !paper.sentToParents) return false;
      const paperClassId = paper.classId;
      const paperClassName = paper.className?.toLowerCase().trim() || '';
      return (paperClassId && paperClassId === targetClassId) || 
             (paperClassName && targetClassName && (
               paperClassName === targetClassName || 
               paperClassName.includes(targetClassName) || 
               targetClassName.includes(paperClassName)
             )) ||
             (paperClassId === 'ALL');
    }).length;
  }, [examPapers, currentStudent, currentStudentClass]);

  const childQuizWeeksCount = useMemo(() => {
    if (!currentStudent || !currentStudent.classId) return 0;
    return quizWeeks.filter(qw => {
      if (qw.schoolId && qw.schoolId !== currentSchool.id) return false;
      return qw.classId === currentStudent.classId;
    }).length;
  }, [quizWeeks, currentStudent, currentSchool.id]);

  const studentGrades = useMemo(() => {
    if (!currentStudent) return [];
    return grades.filter(g => g.studentId === currentStudent.id);
  }, [grades, currentStudent]);

  const filteredGrades = useMemo(() => {
    return studentGrades.filter(g => g.trimester === selectedTrimester);
  }, [studentGrades, selectedTrimester]);

  const studentPayments = useMemo(() => {
    if (!currentStudent) return [];
    return payments.filter(p => p.studentId === currentStudent.id);
  }, [payments, currentStudent]);

  // School communications targeted for parents or class
  const studentMessages = useMemo(() => {
    return communications.filter(m => {
      const isTargeted = m.recipientGroup === 'PARENTS' || m.recipientGroup === 'TOUS';
      const isClassTargeted = m.recipientGroup === 'CLASSE' && currentStudentClass && m.content.includes(currentStudentClass.name);
      return isTargeted || isClassTargeted;
    }).sort((a, b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime());
  }, [communications, currentStudentClass]);

  // Official Announcements & Private Direct Messages from School Box
  const parentOfficialAnnouncements = useMemo(() => {
    return officialAnnouncements.filter(item => {
      // Must belong to this school
      if (item.schoolId && item.schoolId !== currentSchool.id) return false;

      // 1. Public for all parents
      if (item.audience === 'PUBLIC_ALL') return true;

      // 2. Class specific
      if (item.audience === 'PUBLIC_CLASS') {
        if (!currentStudent) return true;
        const matchesClassId = item.targetClassId && item.targetClassId === currentStudent.classId;
        const matchesClassName = item.targetClassName && currentStudentClass && item.targetClassName.toLowerCase().trim() === currentStudentClass.name.toLowerCase().trim();
        return Boolean(matchesClassId || matchesClassName);
      }

      // 3. Private message to a specific parent/student
      if (item.audience === 'PRIVATE_STUDENT') {
        if (!currentStudent) return false;
        if (item.targetStudentId && item.targetStudentId === currentStudent.id) return true;
        if (item.targetStudentRegNumber && currentStudent.registrationNumber && item.targetStudentRegNumber === currentStudent.registrationNumber) return true;
        if (authPhone && item.targetParentPhone && matchPhone(item.targetParentPhone, authPhone)) return true;
        if (authenticatedChildren.some(child => child.id === item.targetStudentId)) return true;
        return false;
      }

      return false;
    }).sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [officialAnnouncements, currentSchool.id, currentStudent, currentStudentClass, authPhone, authenticatedChildren]);

  // Specific private messages targeting the active child or current parent
  const activePrivateAnnouncementsForChild = useMemo(() => {
    return parentOfficialAnnouncements.filter(a => a.audience === 'PRIVATE_STUDENT');
  }, [parentOfficialAnnouncements]);

  const [announcementFilter, setAnnouncementFilter] = useState<'ALL' | 'PRIVATE' | 'PUBLIC' | 'CLASS' | 'ADS'>('ALL');

  const filteredOfficialAnnouncements = useMemo(() => {
    return parentOfficialAnnouncements.filter(a => {
      if (announcementFilter === 'PRIVATE') return a.audience === 'PRIVATE_STUDENT';
      if (announcementFilter === 'PUBLIC') return a.audience === 'PUBLIC_ALL';
      if (announcementFilter === 'CLASS') return a.audience === 'PUBLIC_CLASS';
      if (announcementFilter === 'ADS') {
        return a.isAdBanner || a.category === 'PUBLICITE' || a.category === 'PARTENAIRE' || a.category === 'ACTIVITE' || Boolean(a.photoUrl);
      }
      return true;
    });
  }, [parentOfficialAnnouncements, announcementFilter]);

  // -------------------------------------------------------------
  // AUDIO & COMPLAINTS MESSAGING TO SCHOOL
  // -------------------------------------------------------------
  const [complaintCategory, setComplaintCategory] = useState<ParentComplaintCategory>('ABSENCE');
  const [complaintSubject, setComplaintSubject] = useState('');
  const [complaintMessage, setComplaintMessage] = useState('');
  const [complaintPriority, setComplaintPriority] = useState<'NORMALE' | 'HAUTE' | 'URGENTE'>('NORMALE');
  const [complaintSuccessMessage, setComplaintSuccessMessage] = useState<string | null>(null);

  // Photo Attachment State
  const [attachedPhotoUrl, setAttachedPhotoUrl] = useState<string>('');
  const [attachedPhotoName, setAttachedPhotoName] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Audio Recording State
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [recordedAudioUrl, setRecordedAudioUrl] = useState<string>('');
  const [recordedAudioDuration, setRecordedAudioDuration] = useState<number>(0);
  const [isPlayingRecorded, setIsPlayingRecorded] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<any>(null);
  const recordedAudioElementRef = useRef<HTMLAudioElement | null>(null);

  // Lightbox for photos
  const [activeLightboxPhoto, setActiveLightboxPhoto] = useState<{ url: string; title: string } | null>(null);

  // Audio playback for past complaints
  const [activePlayingComplaintId, setActivePlayingComplaintId] = useState<string | null>(null);
  const complaintAudioPlayerRef = useRef<HTMLAudioElement | null>(null);

  // Start Audio Recording
  const startAudioRecording = async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        alert("L'enregistrement vocal n'est pas pris en charge par votre navigateur actuel.");
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64data = reader.result as string;
          setRecordedAudioUrl(base64data);
          setRecordedAudioDuration(recordingSeconds || 10);
        };
        reader.readAsDataURL(audioBlob);

        // Stop all tracks to release mic
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start(200);
      setIsRecording(true);
      setRecordingSeconds(0);

      recordingTimerRef.current = setInterval(() => {
        setRecordingSeconds(prev => prev + 1);
      }, 1000);
    } catch (err: any) {
      console.warn("Microphone access error:", err);
      // If mic denied or iframe restriction, offer an easy simulation so testing never fails
      const useSim = confirm("Impossible d'accéder au microphone (permission ou navigateur). Souhaitez-vous générer une note vocale audio pour tester l'envoi ?");
      if (useSim) {
        setRecordedAudioUrl("data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=");
        setRecordedAudioDuration(18);
      }
    }
  };

  // Stop Audio Recording
  const stopAudioRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
    }
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
    }
    setIsRecording(false);
  };

  // Cancel Audio Recording
  const cancelAudioRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
    }
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
    }
    setIsRecording(false);
    setRecordedAudioUrl('');
    setRecordingSeconds(0);
    setRecordedAudioDuration(0);
  };

  // Play / Pause Recorded Audio Preview
  const togglePlayRecordedAudio = () => {
    if (!recordedAudioUrl) return;

    if (isPlayingRecorded) {
      if (recordedAudioElementRef.current) {
        recordedAudioElementRef.current.pause();
      }
      setIsPlayingRecorded(false);
    } else {
      const audio = new Audio(recordedAudioUrl);
      audio.onended = () => setIsPlayingRecorded(false);
      audio.play().catch(e => {
        console.error(e);
        setIsPlayingRecorded(false);
      });
      recordedAudioElementRef.current = audio;
      setIsPlayingRecorded(true);
    }
  };

  // Handle Photo Selection
  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check size limit (cap at ~4MB for local storage safety)
    if (file.size > 4 * 1024 * 1024) {
      alert("La photo sélectionnée est trop volumineuse (maximum 4 Mo).");
      return;
    }

    setAttachedPhotoName(file.name);
    const reader = new FileReader();
    reader.onloadend = () => {
      setAttachedPhotoUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Submit Complaint / Audio Note / Photo
  const handleSubmitComplaint = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentStudent) return;

    if (!complaintSubject.trim()) {
      alert("Veuillez préciser l'objet de votre message.");
      return;
    }

    if (!complaintMessage.trim() && !recordedAudioUrl && !attachedPhotoUrl) {
      alert("Veuillez soit enregistrer une note vocale (audio), soit joindre une photo, soit écrire un texte explicatif.");
      return;
    }

    addParentComplaint({
      schoolId: currentSchool.id,
      studentId: currentStudent.id,
      studentName: `${currentStudent.lastName.toUpperCase()} ${currentStudent.firstName}`,
      studentClass: currentStudentClass?.name || '',
      parentName: authenticatedParentName,
      parentPhone: authPhone,
      category: complaintCategory,
      subject: complaintSubject.trim(),
      messageText: complaintMessage.trim(),
      audioUrl: recordedAudioUrl || undefined,
      audioDurationSeconds: recordedAudioDuration || undefined,
      photoUrl: attachedPhotoUrl || undefined,
      photoName: attachedPhotoName || undefined,
      priority: complaintPriority
    });

    // Reset Form
    setComplaintSubject('');
    setComplaintMessage('');
    setRecordedAudioUrl('');
    setRecordedAudioDuration(0);
    setAttachedPhotoUrl('');
    setAttachedPhotoName('');
    if (fileInputRef.current) fileInputRef.current.value = '';

    setComplaintSuccessMessage("Votre message et vos pièces ont été transmis en direct à la Direction de l'école !");
    setTimeout(() => setComplaintSuccessMessage(null), 7000);
  };

  // Filter complaints sent by this parent (for their children)
  const mySentComplaints = useMemo(() => {
    return parentComplaints.filter(c => {
      // Must belong to this school
      if (c.schoolId && c.schoolId !== currentSchool.id) return false;
      // Match phone or student
      const phoneMatches = Boolean(authPhone && matchPhone(c.parentPhone, authPhone));
      const studentMatches = Boolean(
        (currentStudent && c.studentId === currentStudent.id) ||
        authenticatedChildren.some(child => child.id === c.studentId)
      );
      return phoneMatches || studentMatches;
    }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [parentComplaints, currentSchool.id, authPhone, authenticatedChildren, currentStudent]);

  // Play audio for a past complaint
  const togglePlayPastAudio = (id: string, audioUrl?: string) => {
    if (activePlayingComplaintId === id) {
      if (complaintAudioPlayerRef.current) {
        complaintAudioPlayerRef.current.pause();
      }
      setActivePlayingComplaintId(null);
    } else {
      if (complaintAudioPlayerRef.current) {
        complaintAudioPlayerRef.current.pause();
      }
      if (audioUrl) {
        const audio = new Audio(audioUrl);
        audio.onended = () => setActivePlayingComplaintId(null);
        audio.play().catch(() => setActivePlayingComplaintId(null));
        complaintAudioPlayerRef.current = audio;
        setActivePlayingComplaintId(id);
      } else {
        // Synthesize pleasant beep feedback
        setActivePlayingComplaintId(id);
        setTimeout(() => setActivePlayingComplaintId(null), 3000);
      }
    }
  };

  // Calculate tuition stats
  const tuitionFee = currentStudentClass?.tuitionFee || 150000;
  const totalPaid = studentPayments.reduce((acc, p) => acc + (p.amountPaid || 0), 0);
  const remainingBalance = Math.max(0, tuitionFee - totalPaid);
  const isTuitionFullyPaid = remainingBalance <= 0;

  // Calculate student average
  const trimesterAverage = useMemo(() => {
    if (filteredGrades.length === 0) return null;
    let totalPoints = 0;
    let totalCoeff = 0;
    filteredGrades.forEach(g => {
      const coeff = g.coefficient || 1;
      const markOn20 = g.maxMark && g.maxMark !== 20 ? (g.mark / g.maxMark) * 20 : g.mark;
      totalPoints += markOn20 * coeff;
      totalCoeff += coeff;
    });
    return totalCoeff > 0 ? (totalPoints / totalCoeff).toFixed(2) : null;
  }, [filteredGrades]);

  // ----------------------------------------------------------------------------------
  // GATE 1: IF NOT AUTHENTICATED VIA REGISTERED PHONE NUMBER -> DISPLAY PHONE LOGIN GATE
  // ----------------------------------------------------------------------------------
  if (!authPhone || authenticatedChildren.length === 0 || !currentStudent) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between font-sans">
        
        {/* Top Branding Header */}
        <header className="p-4 sm:p-6 bg-slate-900 border-b border-slate-800 shadow-xl flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {currentSchool.logoUrl ? (
              <img 
                src={currentSchool.logoUrl} 
                alt={currentSchool.name} 
                className="w-11 h-11 rounded-2xl object-cover border border-blue-500/40 shadow-sm"
              />
            ) : (
              <div className="w-11 h-11 rounded-2xl bg-blue-600 flex items-center justify-center text-white font-black text-lg">
                {currentSchool.name.slice(0, 2).toUpperCase()}
              </div>
            )}
            <div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-blue-600/30 text-blue-300 border border-blue-500/40 uppercase">
                Portail Famille & Parents
              </span>
              <h1 className="text-base sm:text-lg font-black text-white leading-tight">
                {currentSchool.name}
              </h1>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsInstallModalOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-black flex items-center space-x-1.5 shadow-md cursor-pointer shrink-0"
            >
              <Smartphone className="w-4 h-4" />
              <span className="hidden sm:inline">Ajouter à l'écran</span>
            </button>

            {onReturnToPlatform && (
              <button
                onClick={onReturnToPlatform}
                className="px-2.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold border border-slate-700 cursor-pointer"
              >
                Retour Admin
              </button>
            )}
          </div>
        </header>

        {/* Center Card: Phone Authentication */}
        <main className="flex-1 flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-slate-900/95 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
            
            <div className="text-center space-y-2">
              <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-blue-600/30 to-indigo-600/30 text-blue-400 border border-blue-500/40 flex items-center justify-center mx-auto shadow-inner">
                <Phone className="w-8 h-8" />
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white">
                Connexion Espace Parents
              </h2>
              <p className="text-xs text-slate-400 leading-relaxed max-w-sm mx-auto">
                Connectez-vous avec le <strong>numéro de téléphone</strong> inscrit sur la fiche scolaire de votre enfant à <strong>{currentSchool.name}</strong>.
              </p>
            </div>

            {/* Error Message */}
            {phoneLoginError && (
              <div className="p-3.5 rounded-2xl bg-red-950/60 border border-red-800/80 text-red-200 text-xs flex items-start space-x-2 animate-in fade-in">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <p>{phoneLoginError}</p>
              </div>
            )}

            {/* Form */}
            <form onSubmit={(e) => { e.preventDefault(); handlePhoneLogin(); }} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
                  <span>Numéro de Téléphone Mobile / WhatsApp :</span>
                  <span className="text-[10px] text-blue-400 font-semibold">Inscrit à l'école</span>
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="tel"
                    value={phoneInput}
                    onChange={(e) => {
                      setPhoneInput(e.target.value);
                      if (phoneLoginError) setPhoneLoginError(null);
                    }}
                    placeholder="Ex: +229 97 22 33 44 ou 97223344"
                    className="w-full pl-10 pr-4 py-3.5 rounded-2xl bg-slate-800 border border-slate-700 text-white text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-slate-500"
                    autoFocus
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-4 rounded-2xl font-black text-sm bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white flex items-center justify-center space-x-2 transition-all shadow-lg cursor-pointer active:scale-95"
              >
                <span>Accéder à l'Espace de mes Enfants</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </form>

            {/* Information & WhatsApp Payment Box for Parents */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950/40 border border-emerald-500/30 text-left space-y-3 shadow-lg">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                  <CreditCard className="w-3.5 h-3.5" />
                  Tarif d'accès officiel Espace Parents
                </span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-500/30">
                  Paiement Manuel
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                  <span className="text-[10px] text-slate-400 block font-semibold">Formule Mensuelle</span>
                  <span className="text-sm font-black text-emerald-300">1 000 FCFA</span>
                  <span className="text-[10px] text-slate-400 block">Accès 30 jours</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-900 border border-purple-500/40 relative overflow-hidden">
                  <span className="absolute top-1 right-1 text-[8px] font-black uppercase px-1 py-0.2 rounded bg-purple-600 text-white">
                    -3 000 F
                  </span>
                  <span className="text-[10px] text-purple-300 block font-semibold">Formule Annuelle</span>
                  <span className="text-sm font-black text-purple-300">9 000 FCFA</span>
                  <span className="text-[10px] text-slate-400 block">Toute l'année scolaire</span>
                </div>
              </div>

              <div className="text-[11px] text-slate-300 space-y-1.5 bg-slate-950/80 p-2.5 rounded-xl border border-slate-800">
                <p className="font-bold text-slate-200">Numéros officiels de paiement :</p>
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span>• MTN Mobile Money :</span>
                    <div className="flex items-center gap-1">
                      <strong className="text-amber-300 font-mono">01 67 43 03 81</strong>
                      <button
                        type="button"
                        onClick={() => handleCopyPaymentText('0167430381', 'MTN_LOGIN')}
                        className="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-[10px] text-slate-300 cursor-pointer"
                      >
                        {copiedPaymentLabel === 'MTN_LOGIN' ? 'Copié !' : 'Copier'}
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>• Direct / Moov / Wave :</span>
                    <div className="flex items-center gap-1">
                      <strong className="text-emerald-300 font-mono">01 43 75 45 93</strong>
                      <button
                        type="button"
                        onClick={() => handleCopyPaymentText('0143754593', 'PROMO_LOGIN')}
                        className="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-[10px] text-slate-300 cursor-pointer"
                      >
                        {copiedPaymentLabel === 'PROMO_LOGIN' ? 'Copié !' : 'Copier'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* WhatsApp Button connected to 0143754593 */}
              <a
                href={getLoginWhatsAppPaymentUrl()}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 hover:from-emerald-500 hover:to-teal-400 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-emerald-950/50 transition-all cursor-pointer text-center"
              >
                <MessageSquare className="w-4 h-4 text-white shrink-0" />
                <span>Envoyer capture de paiement par WhatsApp (01 43 75 45 93)</span>
                <ExternalLink className="w-3.5 h-3.5 opacity-80 shrink-0" />
              </a>
            </div>

            {/* Registered Phone Numbers for Direct 1-Click Testing */}
            <div className="pt-2 border-t border-slate-800 space-y-2.5">
              <p className="text-[11px] font-black uppercase text-slate-400 tracking-wider flex items-center space-x-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Comptes Parents Enregistrés dans l'École (Test Rapide) :</span>
              </p>

              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {registeredParentNumbers.map((p, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setPhoneInput(p.phone);
                      handlePhoneLogin(p.phone);
                    }}
                    className="w-full p-2.5 rounded-xl bg-slate-800/80 hover:bg-blue-900/40 border border-slate-700 hover:border-blue-500 text-left transition-all flex items-center justify-between group cursor-pointer"
                  >
                    <div>
                      <p className="text-xs font-black text-white group-hover:text-blue-300">
                        {p.parentName}
                      </p>
                      <p className="text-[10px] text-slate-400">
                        Enfant(s) : {p.studentNames.join(', ')}
                      </p>
                    </div>
                    <span className="px-2 py-1 rounded-lg bg-blue-600/30 text-blue-300 text-[10px] font-mono font-bold shrink-0">
                      {p.phone}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Help Note */}
            <div className="p-3.5 rounded-2xl bg-slate-800/60 border border-slate-700/60 flex items-start space-x-2.5 text-[11px] text-slate-400">
              <Shield className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <p>
                <strong>Authentification Sécurisée :</strong> Vos enfants sont automatiquement reconnus grâce au numéro inscrit dans leur dossier officiel. Vos audios et photos sont transmis en direct à la Direction.
              </p>
            </div>

          </div>
        </main>

        <footer className="p-4 text-center text-xs text-slate-500 border-t border-slate-800">
          Plateforme Officielle • {currentSchool.name} • Année {settings.academicYear}
        </footer>

        <PwaInstallGuideModalProps
          isOpen={isInstallModalOpen}
          onClose={() => setIsInstallModalOpen(false)}
          schoolName={currentSchool.name}
          appTitle="Espace Parents"
        />

      </div>
    );
  }

  // ----------------------------------------------------------------------------------
  // GATE 2: FULL AUTHENTICATED PARENT SUB-APP INTERFACE
  // ----------------------------------------------------------------------------------
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-blue-600 selection:text-white pb-12">
      
      {/* Top Mobile & Header Bar */}
      <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 shadow-md">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          
          <div className="flex items-center space-x-3 overflow-hidden">
            {currentSchool.logoUrl ? (
              <img 
                src={currentSchool.logoUrl} 
                alt={currentSchool.name} 
                className="w-10 h-10 rounded-2xl object-cover border border-blue-500/30 shrink-0"
              />
            ) : (
              <div className="w-10 h-10 rounded-2xl bg-blue-600 flex items-center justify-center text-white font-black shrink-0">
                {currentSchool.name.slice(0, 2).toUpperCase()}
              </div>
            )}
            <div className="truncate">
              <div className="flex items-center space-x-1.5">
                <span className="text-[10px] font-black uppercase text-blue-400 tracking-wider">
                  Espace Parents
                </span>
                <span className="text-[10px] text-slate-400">• {authenticatedParentName}</span>
              </div>
              <h1 className="text-sm sm:text-base font-black text-white truncate leading-tight">
                {currentSchool.name}
              </h1>
            </div>
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            {/* Subscription Status Button */}
            <button
              onClick={() => setIsPaymentModalOpen(true)}
              className={`px-3 py-1.5 rounded-xl text-xs font-black flex items-center space-x-1.5 cursor-pointer transition-all shadow-sm ${
                isSubscriptionActive
                  ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-900/60'
                  : 'bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black shadow-lg animate-pulse'
              }`}
              title="Gérer ou souscrire à l'abonnement Espace Parents"
            >
              {isSubscriptionActive ? (
                <>
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="hidden sm:inline">Abonnement Actif</span>
                  <span className="sm:hidden">Actif</span>
                </>
              ) : (
                <>
                  <Zap className="w-3.5 h-3.5" />
                  <span>Activer (1 000F)</span>
                </>
              )}
            </button>

            {/* Install to Screen Button */}
            <button
              onClick={() => setIsInstallModalOpen(true)}
              className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-black flex items-center space-x-1.5 shadow cursor-pointer"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Installer</span>
            </button>

            {/* Disconnect Phone */}
            <button
              onClick={handleLogout}
              className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-red-950/60 hover:border-red-500/40 text-slate-300 hover:text-red-300 text-xs font-bold border border-slate-700 flex items-center space-x-1 cursor-pointer transition-colors"
              title="Changer de compte parent"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Quitter</span>
            </button>

            {onReturnToPlatform && (
              <button
                onClick={onReturnToPlatform}
                className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold border border-slate-700 cursor-pointer"
              >
                Admin
              </button>
            )}
          </div>

        </div>

        {/* Children Sibling Switcher Bar */}
        <div className="bg-slate-900 border-t border-slate-800/80 px-4 py-2 overflow-x-auto">
          <div className="max-w-4xl mx-auto flex items-center space-x-2">
            <span className="text-[11px] font-bold text-slate-400 shrink-0">
              Enfant(s) de votre foyer :
            </span>
            {authenticatedChildren.map(std => {
              const cl = classes.find(c => c.id === std.classId);
              const isActive = std.id === activeStudentId;
              return (
                <button
                  key={std.id}
                  onClick={() => setActiveStudentId(std.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all flex items-center space-x-1.5 shrink-0 cursor-pointer ${
                    isActive
                      ? 'bg-blue-600 text-white shadow'
                      : 'bg-slate-800 text-slate-400 hover:text-white border border-slate-700'
                  }`}
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>{std.firstName} {std.lastName}</span>
                  <span className="text-[10px] opacity-80">({cl?.name || 'Classe'})</span>
                </button>
              );
            })}
          </div>
        </div>

      </header>

      {/* Main Container */}
      <main className="max-w-4xl mx-auto px-4 py-5 w-full flex-1 space-y-5">

        {/* 1. Subscription Gate or Active Badge */}
        {!isSubscriptionActive ? (
          <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-br from-amber-950/70 via-slate-900 to-slate-950 border-2 border-amber-500/50 shadow-2xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center shrink-0">
                  <Lock className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-[10px] font-black uppercase tracking-wider text-amber-400">
                      Activation Requise
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-red-950 text-red-300 text-[10px] font-bold border border-red-800/60">
                      Accès Restreint
                    </span>
                  </div>
                  <h2 className="text-base sm:text-lg font-black text-white">
                    Souscription Espace Parents : 1 000 FCFA / mois OU 9 000 FCFA / an
                  </h2>
                </div>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Pour accéder aux notes détaillées, bulletins de paie, suivi des absences et échanger en direct avec la Direction de <strong>{currentSchool.name}</strong>, veuillez effectuer votre paiement manuel puis envoyer la capture pour activation à distance.
            </p>

            {/* Plan Choice Selector */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div
                onClick={() => setSelectedPaymentPlan('MONTHLY')}
                className={`p-4 rounded-2xl border-2 transition-all cursor-pointer ${
                  selectedPaymentPlan === 'MONTHLY'
                    ? 'bg-emerald-950/40 border-emerald-500 shadow-lg shadow-emerald-950/50'
                    : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase text-emerald-400">Formule 1 Mois</span>
                  <span className="text-xs font-bold text-slate-400">30 jours</span>
                </div>
                <div className="mt-2">
                  <span className="text-2xl font-black text-white">1 000 FCFA</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Accès complet pendant 30 jours consécutifs.
                </p>
              </div>

              <div
                onClick={() => setSelectedPaymentPlan('ANNUAL')}
                className={`p-4 rounded-2xl border-2 transition-all cursor-pointer relative overflow-hidden ${
                  selectedPaymentPlan === 'ANNUAL'
                    ? 'bg-purple-950/40 border-purple-500 shadow-lg shadow-purple-950/50'
                    : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="absolute top-2 right-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-[9px] font-black uppercase px-2 py-0.5 rounded-full shadow">
                  Économisez 3 000 F
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase text-purple-400">Formule Annuelle</span>
                  <span className="text-xs font-bold text-slate-400">Année scolaire</span>
                </div>
                <div className="mt-2">
                  <span className="text-2xl font-black text-white">9 000 FCFA</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Accès garanti toute l'année scolaire sans interruption.
                </p>
              </div>
            </div>

            {/* Payment Details & Manual Numbers */}
            <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-2.5 text-xs">
              <span className="font-bold text-slate-200 block">
                1. Effectuez votre transfert manuel sur l'un des numéros officiels :
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 block font-semibold">MTN Mobile Money :</span>
                    <span className="text-sm font-mono font-black text-amber-300">01 67 43 03 81</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopyPaymentText('0167430381', 'MTN_CARD')}
                    className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                  >
                    {copiedPaymentLabel === 'MTN_CARD' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedPaymentLabel === 'MTN_CARD' ? 'Copié !' : 'Copier'}</span>
                  </button>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 block font-semibold">Direct / Moov / Wave :</span>
                    <span className="text-sm font-mono font-black text-emerald-300">01 43 75 45 93</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopyPaymentText('0143754593', 'PROMO_CARD')}
                    className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                  >
                    {copiedPaymentLabel === 'PROMO_CARD' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedPaymentLabel === 'PROMO_CARD' ? 'Copié !' : 'Copier'}</span>
                  </button>
                </div>
              </div>

              <span className="font-bold text-slate-200 block pt-1">
                2. Envoyez la capture d'écran de votre transfert pour activation à distance :
              </span>
            </div>

            {/* Big WhatsApp Action Button */}
            <a
              href={getWhatsAppPaymentUrl(selectedPaymentPlan)}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 hover:from-emerald-500 hover:to-teal-400 text-white font-black text-sm sm:text-base flex items-center justify-center gap-3 shadow-xl shadow-emerald-950/60 border border-emerald-400/40 transition-all transform hover:scale-[1.01] active:scale-95 cursor-pointer text-center"
            >
              <MessageSquare className="w-5 h-5 text-white animate-bounce shrink-0" />
              <span>Envoyer la capture de paiement par WhatsApp (01 43 75 45 93)</span>
              <ExternalLink className="w-4 h-4 opacity-80 shrink-0" />
            </a>

            {/* Claim Receipt Code from Promoter */}
            <div className="pt-2 border-t border-slate-800">
              <form onSubmit={handleClaimReceiptCodeSubmit} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <span className="text-[11px] text-slate-400 font-semibold shrink-0">
                  Déjà reçu votre code reçu (5 car.) ?
                </span>
                <input
                  type="text"
                  maxLength={10}
                  value={claimReceiptCodeInput}
                  onChange={(e) => setClaimReceiptCodeInput(e.target.value.toUpperCase())}
                  placeholder="Ex: A7K9P"
                  className="flex-1 px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-mono font-bold uppercase tracking-widest focus:outline-none focus:ring-2 focus:ring-amber-400 placeholder:text-slate-600"
                />
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold text-xs border border-amber-500/30 cursor-pointer"
                >
                  Débloquer mon compte
                </button>
              </form>
              {claimReceiptFeedback && (
                <p className={`text-xs mt-2 font-bold ${claimReceiptFeedback.success ? 'text-emerald-400' : 'text-red-400'}`}>
                  {claimReceiptFeedback.message}
                </p>
              )}
            </div>
          </div>
        ) : (
          <div className="px-4 py-3 rounded-2xl bg-gradient-to-r from-emerald-950/60 via-slate-900 to-slate-900 border border-emerald-500/30 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center space-x-2.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <div>
                <span className="font-black text-white">Espace Parents Actif</span>
                <span className="text-slate-400 text-[11px] ml-2">
                  • Valable jusqu'au {currentParentActivation?.fin_abonnement ? new Date(currentParentActivation.fin_abonnement).toLocaleDateString('fr-FR') : 'Fin de période'}
                </span>
                {currentParentActivation?.code_recu && (
                  <span className="ml-2 font-mono font-bold text-amber-300 bg-slate-800 px-2 py-0.5 rounded text-[10px]">
                    Reçu : {currentParentActivation.code_recu}
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={() => setIsPaymentModalOpen(true)}
              className="text-[11px] text-slate-300 hover:text-white underline font-bold cursor-pointer"
            >
              Renouveler / Détails
            </button>
          </div>
        )}
        
        {/* Active Child Profile Card */}
        <div className="p-5 rounded-3xl bg-gradient-to-r from-blue-900/60 via-indigo-950/70 to-slate-900 border border-blue-800/50 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 rounded-2xl bg-blue-600 text-white font-black text-2xl flex items-center justify-center border-2 border-blue-400/40 shadow shrink-0 overflow-hidden">
              {currentStudent.photoUrl ? (
                <img src={currentStudent.photoUrl} alt={currentStudent.firstName} className="w-full h-full object-cover" />
              ) : (
                <span>{currentStudent.firstName[0]}</span>
              )}
            </div>
            <div>
              <div className="flex items-center space-x-2 flex-wrap">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {currentStudent.status === 'ACTIF' ? 'Élève Inscrit' : currentStudent.status}
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  Matricule : {currentStudent.registrationNumber}
                </span>
              </div>
              <h2 className="text-xl font-black text-white mt-1">
                {currentStudent.lastName.toUpperCase()} {currentStudent.firstName}
              </h2>
              <p className="text-xs text-blue-200 mt-0.5">
                Classe : <strong className="text-white">{currentStudentClass?.name}</strong> • Année Scolaire : {settings.academicYear}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 shrink-0 self-end sm:self-auto">
            <button
              onClick={() => setIsBulletinModalOpen(true)}
              className="px-4 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black flex items-center space-x-2 shadow-lg transition-transform active:scale-95 cursor-pointer"
            >
              <FileText className="w-4 h-4" />
              <span>Bulletin Trimestriel</span>
            </button>
          </div>
        </div>

        {/* URGENT & PRIVATE MESSAGES ALERT BANNER FOR CURRENT PARENT / CHILD */}
        {activePrivateAnnouncementsForChild.length > 0 && (
          <div className="p-4 rounded-3xl bg-gradient-to-r from-amber-950/90 via-amber-900/60 to-slate-900 border-2 border-amber-500/70 shadow-xl shadow-amber-950/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-in fade-in">
            <div className="flex items-start space-x-3.5">
              <div className="p-2.5 rounded-2xl bg-amber-500 text-slate-950 shrink-0 font-black shadow-md shadow-amber-500/30 mt-0.5">
                <Lock className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center space-x-2 flex-wrap">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-400 text-slate-950 uppercase tracking-wider">
                    Message Privé de l'École
                  </span>
                  <span className="text-[11px] text-amber-300 font-bold">
                    Pour {currentStudent?.firstName} {currentStudent?.lastName}
                  </span>
                </div>
                <h4 className="font-black text-sm text-white leading-snug">
                  {activePrivateAnnouncementsForChild[0].title}
                </h4>
                <p className="text-xs text-amber-100/90 line-clamp-2 leading-relaxed">
                  {activePrivateAnnouncementsForChild[0].content}
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                setActiveTab('messages');
                setAnnouncementFilter('PRIVATE');
              }}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black text-xs shrink-0 transition-transform active:scale-95 cursor-pointer shadow-lg flex items-center space-x-1.5 self-end sm:self-auto"
            >
              <span>Consulter le Message</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* ESPACE PUBLICITAIRE & ANNONCES OFFICIELLES (Affiches, Événements, Partenaires & Divers) */}
        <ParentAdvertisingShowcase
          announcements={parentOfficialAnnouncements}
          schoolName={currentSchool.name}
        />

        {/* 6 Core Navigation Tabs */}
        <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 bg-slate-900/90 p-1.5 rounded-2xl border border-slate-800 shadow-sm">
          
          <button
            onClick={() => setActiveTab('notes')}
            className={`py-2.5 rounded-xl font-black text-xs flex items-center justify-center space-x-1.5 transition-all cursor-pointer ${
              activeTab === 'notes'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Notes</span>
          </button>

          {/* TAB: ÉPREUVES & ARCHIVES */}
          <button
            onClick={() => setActiveTab('epreuves')}
            className={`py-2.5 rounded-xl font-black text-xs flex items-center justify-center space-x-1.5 transition-all relative cursor-pointer ${
              activeTab === 'epreuves'
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileText className="w-4 h-4 text-amber-400" />
            <span className="truncate">Épreuves</span>
            {childExamPapersCount > 0 && (
              <span className="px-1.5 py-0.5 rounded-full text-[9px] font-black bg-amber-400 text-slate-950 ml-1 shrink-0">
                {childExamPapersCount}
              </span>
            )}
          </button>

          {/* TAB: QUIZ WEEK */}
          <button
            onClick={() => setActiveTab('quiz-week')}
            className={`py-2.5 rounded-xl font-black text-xs flex items-center justify-center space-x-1.5 transition-all relative cursor-pointer ${
              activeTab === 'quiz-week'
                ? 'bg-gradient-to-r from-amber-500 to-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Zap className="w-4 h-4 text-yellow-300" />
            <span className="truncate">Quiz Week</span>
            {childQuizWeeksCount > 0 && (
              <span className="px-1.5 py-0.5 rounded-full text-[9px] font-black bg-amber-400 text-slate-950 ml-1 shrink-0">
                {childQuizWeeksCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('scolarite')}
            className={`py-2.5 rounded-xl font-black text-xs flex items-center justify-center space-x-1.5 transition-all cursor-pointer ${
              activeTab === 'scolarite'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <CreditCard className="w-4 h-4" />
            <span>Scolarité</span>
          </button>

          <button
            onClick={() => setActiveTab('messages')}
            className={`py-2.5 rounded-xl font-black text-xs flex items-center justify-center space-x-1.5 transition-all relative cursor-pointer ${
              activeTab === 'messages'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Megaphone className="w-4 h-4" />
            <span>Annonces</span>
            {(parentOfficialAnnouncements.length > 0 || studentMessages.length > 0) && (
              <span className={`px-1.5 py-0.2 rounded-full text-[9px] font-black ml-1 ${
                activePrivateAnnouncementsForChild.length > 0
                  ? 'bg-amber-400 text-slate-950 animate-pulse'
                  : 'bg-blue-500 text-white'
              }`}>
                {parentOfficialAnnouncements.length + studentMessages.length}
              </span>
            )}
          </button>

          {/* TAB: AUDIOS & COMPLAINTS */}
          <button
            onClick={() => setActiveTab('dialogue')}
            className={`py-2.5 rounded-xl font-black text-xs flex items-center justify-center space-x-1.5 transition-all relative cursor-pointer ${
              activeTab === 'dialogue'
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Mic className="w-4 h-4 text-emerald-400" />
            <span>Dialogue Direct</span>
            {mySentComplaints.some(c => c.schoolReply) && (
              <span className="px-1.5 py-0.2 rounded-full text-[9px] font-black bg-emerald-500 text-white ml-1">
                Réponse
              </span>
            )}
          </button>

        </div>

        {/* ========================================================================= */}
        {/* TAB: AUDIOS & COMPLAINTS TO SCHOOL (Requested Feature)                    */}
        {/* ========================================================================= */}
        {activeTab === 'dialogue' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            
            {/* Header Description */}
            <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 space-y-2">
              <div className="flex items-center space-x-2 text-blue-400">
                <Mic className="w-5 h-5" />
                <h3 className="text-base font-black text-white">
                  Contacter l'Administration • Envoi d'Audios & Photos
                </h3>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Vous pouvez envoyer directement une <strong>note vocale (audio)</strong> ou joindre une <strong>photo</strong> (ordonnance médicale, mot d'absence, reçu, carnet de santé) à la Direction de <strong>{currentSchool.name}</strong>. Vos messages arrivent instantanément sur la plateforme de l'école.
              </p>
            </div>

            {/* Success alert banner */}
            {complaintSuccessMessage && (
              <div className="p-4 rounded-2xl bg-emerald-950/80 border border-emerald-800 text-emerald-200 text-xs font-bold flex items-center space-x-3 shadow-lg animate-in fade-in">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                <p>{complaintSuccessMessage}</p>
              </div>
            )}

            {/* Composer Form */}
            <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-5">
              
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <h4 className="text-sm font-black text-white flex items-center space-x-2">
                  <Send className="w-4 h-4 text-blue-400" />
                  <span>Nouveau Message / Plainte à l'École</span>
                </h4>
                <span className="text-[11px] text-slate-400">
                  Élève concerné : <strong className="text-white">{currentStudent.firstName}</strong>
                </span>
              </div>

              <form onSubmit={handleSubmitComplaint} className="space-y-5">
                
                {/* Category & Priority Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300">
                      Motif / Catégorie :
                    </label>
                    <select
                      value={complaintCategory}
                      onChange={(e) => setComplaintCategory(e.target.value as ParentComplaintCategory)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="ABSENCE">Justification d'Absence ou Retard</option>
                      <option value="SANTE">Santé, Allergie ou Cantine</option>
                      <option value="FINANCE">Scolarité, Frais ou Paiement</option>
                      <option value="PEDAGOGIE">Pédagogie, Notes ou Devoirs</option>
                      <option value="DISCIPLINE">Discipline ou Incident</option>
                      <option value="QUESTION">Question ou Demande de RDV</option>
                      <option value="AUTRE">Autre Plainte ou Suggestion</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300">
                      Urgence :
                    </label>
                    <select
                      value={complaintPriority}
                      onChange={(e) => setComplaintPriority(e.target.value as any)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="NORMALE">Normale</option>
                      <option value="HAUTE">Haute (Prioritaire)</option>
                      <option value="URGENTE">Urgente (Immédiate)</option>
                    </select>
                  </div>
                </div>

                {/* Subject Title */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">
                    Objet du message : *
                  </label>
                  <input
                    type="text"
                    value={complaintSubject}
                    onChange={(e) => setComplaintSubject(e.target.value)}
                    placeholder="Ex: Fièvre d'Emmanuel ce lundi matin / Ordonnance jointe"
                    required
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-slate-500"
                  />
                </div>

                {/* AUDIO VOICE RECORDING COMPONENT */}
                <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700/80 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-black text-white flex items-center space-x-1.5">
                      <Mic className="w-4 h-4 text-blue-400" />
                      <span>1. Enregistrer une Note Vocale (Audio)</span>
                    </label>
                    {recordedAudioUrl && (
                      <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        Audio Prêt ({recordedAudioDuration}s)
                      </span>
                    )}
                  </div>

                  {!isRecording && !recordedAudioUrl && (
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                      <button
                        type="button"
                        onClick={startAudioRecording}
                        className="px-4 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-xs flex items-center justify-center space-x-2 shadow-md cursor-pointer transition-transform active:scale-95"
                      >
                        <Mic className="w-4 h-4" />
                        <span>Appuyer pour Enregistrer un Audio</span>
                      </button>
                      <p className="text-[11px] text-slate-400">
                        Expliquez votre situation à voix haute au Directeur sans avoir à tout taper.
                      </p>
                    </div>
                  )}

                  {isRecording && (
                    <div className="p-4 rounded-xl bg-red-950/40 border border-red-800/60 flex items-center justify-between gap-4 animate-in fade-in">
                      <div className="flex items-center space-x-3">
                        <span className="w-3.5 h-3.5 rounded-full bg-red-500 animate-ping" />
                        <div>
                          <p className="text-xs font-black text-red-200">
                            Enregistrement en cours... {String(Math.floor(recordingSeconds / 60)).padStart(2, '0')}:{String(recordingSeconds % 60).padStart(2, '0')}
                          </p>
                          <p className="text-[10px] text-red-300/70">
                            Parlez distinctement dans le micro de votre téléphone.
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <button
                          type="button"
                          onClick={cancelAudioRecording}
                          className="px-3 py-1.5 rounded-lg bg-red-950/60 hover:bg-red-900/80 text-red-300 border border-red-800/60 text-xs font-black flex items-center space-x-1 cursor-pointer transition-colors"
                          title="Supprimer ou abandonner l'enregistrement en cours"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-red-400" />
                          <span>Jeter cet audio</span>
                        </button>
                        <button
                          type="button"
                          onClick={stopAudioRecording}
                          className="px-4 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white font-black text-xs flex items-center space-x-1.5 shadow cursor-pointer"
                        >
                          <Square className="w-3.5 h-3.5 fill-white" />
                          <span>Terminer</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {recordedAudioUrl && !isRecording && (
                    <div className="p-3 rounded-xl bg-slate-900 border border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center space-x-3">
                        <button
                          type="button"
                          onClick={togglePlayRecordedAudio}
                          className="w-9 h-9 rounded-xl bg-blue-600 hover:bg-blue-500 text-white flex items-center justify-center shadow cursor-pointer shrink-0"
                        >
                          {isPlayingRecorded ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
                        </button>
                        <div>
                          <p className="text-xs font-black text-white">
                            {isPlayingRecorded ? "Lecture en cours..." : "Écouter votre message vocal"}
                          </p>
                          <p className="text-[10px] text-slate-400">
                            Durée : {recordedAudioDuration} secondes
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                        <button
                          type="button"
                          onClick={() => {
                            if (recordedAudioElementRef.current) {
                              recordedAudioElementRef.current.pause();
                            }
                            setIsPlayingRecorded(false);
                            setRecordedAudioUrl('');
                            setRecordedAudioDuration(0);
                            startAudioRecording();
                          }}
                          className="px-3 py-1.5 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 text-xs font-black flex items-center gap-1.5 cursor-pointer transition-colors"
                          title="Recommencer un nouvel enregistrement vocal"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                          <span>Réenregistrer</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (recordedAudioElementRef.current) {
                              recordedAudioElementRef.current.pause();
                            }
                            setIsPlayingRecorded(false);
                            setRecordedAudioUrl('');
                            setRecordedAudioDuration(0);
                          }}
                          className="px-3 py-1.5 rounded-xl bg-red-600/20 hover:bg-red-600/30 text-red-300 border border-red-500/40 text-xs font-black flex items-center gap-1.5 cursor-pointer transition-colors"
                          title="Supprimer cet audio mal fait"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-red-400" />
                          <span>Supprimer l'audio mal fait</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* PHOTO ATTACHMENT COMPONENT */}
                <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700/80 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-black text-white flex items-center space-x-1.5">
                      <ImageIcon className="w-4 h-4 text-emerald-400" />
                      <span>2. Joindre une Photo / Pièce Justificative</span>
                    </label>
                    {attachedPhotoUrl && (
                      <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        Photo Jointe
                      </span>
                    )}
                  </div>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoSelect}
                    className="hidden"
                    id="parent-photo-input"
                  />

                  {!attachedPhotoUrl ? (
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                      <label
                        htmlFor="parent-photo-input"
                        className="px-4 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 font-black text-xs flex items-center justify-center space-x-2 cursor-pointer transition-colors shadow-sm"
                      >
                        <ImageIcon className="w-4 h-4 text-emerald-400" />
                        <span>Prendre ou Importer une Photo</span>
                      </label>
                      <p className="text-[11px] text-slate-400">
                        Ordonnance médicale, certificat, mot d'absence ou carnet de santé.
                      </p>
                    </div>
                  ) : (
                    <div className="p-3 rounded-xl bg-slate-900 border border-slate-700 flex items-center justify-between gap-3">
                      <div className="flex items-center space-x-3">
                        <img
                          src={attachedPhotoUrl}
                          alt="Pièce"
                          className="w-12 h-12 rounded-lg object-cover border border-slate-600 cursor-pointer"
                          onClick={() => setActiveLightboxPhoto({ url: attachedPhotoUrl, title: attachedPhotoName })}
                        />
                        <div className="truncate max-w-[200px]">
                          <p className="text-xs font-bold text-white truncate">
                            {attachedPhotoName || "Photo_jointe.jpg"}
                          </p>
                          <button
                            type="button"
                            onClick={() => setActiveLightboxPhoto({ url: attachedPhotoUrl, title: attachedPhotoName })}
                            className="text-[10px] text-blue-400 hover:underline"
                          >
                            Agrandir la photo
                          </button>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setAttachedPhotoUrl('');
                          setAttachedPhotoName('');
                          if (fileInputRef.current) fileInputRef.current.value = '';
                        }}
                        className="px-3 py-1.5 rounded-xl bg-red-600/20 hover:bg-red-600/30 text-red-300 border border-red-500/40 text-xs font-black flex items-center gap-1.5 cursor-pointer transition-colors shrink-0"
                        title="Supprimer cette photo"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-red-400" />
                        <span>Supprimer la photo</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Optional Message Text Note */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">
                    Précisions écrites (facultatif si vous avez fait un audio) :
                  </label>
                  <textarea
                    rows={3}
                    value={complaintMessage}
                    onChange={(e) => setComplaintMessage(e.target.value)}
                    placeholder="Écrivez ici toute information complémentaire pour l'équipe pédagogique..."
                    className="w-full p-3 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-slate-500 leading-relaxed"
                  />
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  className="w-full py-4 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-sm flex items-center justify-center space-x-2 shadow-xl cursor-pointer transition-transform active:scale-95"
                >
                  <Send className="w-4 h-4" />
                  <span>Envoyer à la Direction de l'École</span>
                </button>

              </form>
            </div>

            {/* Historic List of Sent Complaints and School Replies */}
            <div className="space-y-4">
              <div className="flex items-center justify-between px-1">
                <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider flex items-center space-x-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Historique de Vos Messages & Réponses Reçues ({mySentComplaints.length})</span>
                </h4>
              </div>

              {mySentComplaints.length === 0 ? (
                <div className="p-8 text-center bg-slate-900 rounded-3xl border border-dashed border-slate-800 space-y-2">
                  <Inbox className="w-8 h-8 text-slate-600 mx-auto" />
                  <p className="text-xs text-slate-400">
                    Vous n'avez envoyé aucun message ou plainte pour l'instant.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {mySentComplaints.map(item => (
                    <div 
                      key={item.id}
                      className="p-5 rounded-3xl bg-slate-900 border border-slate-800 space-y-4 shadow-sm"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-blue-950 text-blue-300 border border-blue-800">
                              {item.category}
                            </span>
                            {item.status === 'RESOLU' ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-950 text-emerald-300 border border-emerald-800 flex items-center space-x-1">
                                <Check className="w-3 h-3" />
                                <span>Traité & Répondu</span>
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-950 text-amber-300 border border-amber-800">
                                Transmis à l'école
                              </span>
                            )}
                          </div>

                          <h5 className="font-black text-sm text-white pt-1">
                            {item.subject}
                          </h5>
                          <p className="text-[10px] text-slate-400">
                            Envoyé pour : <strong>{item.studentName}</strong> • {new Date(item.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>

                        {/* Delete past message / audio button */}
                        <button
                          type="button"
                          onClick={() => {
                            if (confirm(`Voulez-vous supprimer ce message / audio (« ${item.subject} ») ? Il sera également retiré de la boîte de réception de l'école.`)) {
                              deleteParentComplaint(item.id);
                            }
                          }}
                          className="px-2.5 py-1.5 rounded-xl bg-red-950/40 hover:bg-red-900/60 text-red-300 hover:text-red-200 border border-red-800/40 text-[11px] font-bold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
                          title="Supprimer ce message ou cet audio de votre historique et de l'école"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-red-400" />
                          <span className="hidden sm:inline">Supprimer</span>
                        </button>
                      </div>

                      {/* Text Note if exists */}
                      {item.messageText && (
                        <p className="text-xs text-slate-300 bg-slate-800/60 p-3 rounded-xl border border-slate-700/60 leading-relaxed">
                          {item.messageText}
                        </p>
                      )}

                      {/* Audio Note Player if exists */}
                      {(item.audioUrl || item.audioDurationSeconds) && (
                        <div className="p-3 rounded-xl bg-blue-950/40 border border-blue-800/60 flex items-center justify-between gap-3">
                          <div className="flex items-center space-x-2.5">
                            <button
                              type="button"
                              onClick={() => togglePlayPastAudio(item.id, item.audioUrl)}
                              className="w-8 h-8 rounded-lg bg-blue-600 hover:bg-blue-500 text-white flex items-center justify-center shadow cursor-pointer"
                            >
                              {activePlayingComplaintId === item.id ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
                            </button>
                            <div>
                              <p className="text-xs font-bold text-blue-200">
                                {activePlayingComplaintId === item.id ? "Lecture en cours..." : "Note vocale envoyée"}
                              </p>
                              <p className="text-[10px] text-blue-300/70">
                                Durée : {item.audioDurationSeconds ? `${item.audioDurationSeconds}s` : 'Audio'}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Photo Attachment if exists */}
                      {item.photoUrl && (
                        <div className="flex items-center space-x-3 p-2.5 rounded-xl bg-slate-800/50 border border-slate-700/50">
                          <img
                            src={item.photoUrl}
                            alt="Pièce"
                            className="w-12 h-12 rounded-lg object-cover cursor-pointer"
                            onClick={() => setActiveLightboxPhoto({ url: item.photoUrl!, title: item.photoName || item.subject })}
                          />
                          <div className="space-y-0.5">
                            <p className="text-xs font-bold text-white truncate max-w-xs">
                              {item.photoName || "Photo_jointe.jpg"}
                            </p>
                            <button
                              type="button"
                              onClick={() => setActiveLightboxPhoto({ url: item.photoUrl!, title: item.photoName || item.subject })}
                              className="text-[10px] text-blue-400 hover:underline flex items-center space-x-1"
                            >
                              <Eye className="w-3 h-3" />
                              <span>Voir la photo</span>
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Official School Reply */}
                      {item.schoolReply && (
                        <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-800/70 space-y-1.5 animate-in fade-in">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400 flex items-center space-x-1">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Réponse Officielle de l'Établissement ({item.repliedBy || 'Direction'})</span>
                            </span>
                            {item.repliedAt && (
                              <span className="text-[10px] text-emerald-400/70 font-semibold">
                                {new Date(item.repliedAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-emerald-100 font-medium leading-relaxed">
                            {item.schoolReply}
                          </p>
                        </div>
                      )}

                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB: ÉPREUVES & SUJETS DE RÉVISION MIS À DISPOSITION                      */}
        {/* ========================================================================= */}
        {activeTab === 'epreuves' && currentStudent && (
          <ParentExamPapersTab
            student={currentStudent}
            currentClass={currentStudentClass}
            examPapers={examPapers}
            settings={settings}
            currentSchool={currentSchool}
          />
        )}

        {/* ========================================================================= */}
        {/* TAB: QUIZ WEEK-END EXERCICES & CORRIGÉS TYPE                              */}
        {/* ========================================================================= */}
        {activeTab === 'quiz-week' && (
          <ParentQuizWeekTab
            authenticatedChildren={authenticatedChildren}
            selectedChildId={activeStudentId}
            onSelectChild={setActiveStudentId}
          />
        )}

        {/* ========================================================================= */}
        {/* TAB 1: NOTES & ÉVALUATIONS                                                */}
        {/* ========================================================================= */}
        {activeTab === 'notes' && (
          <div className="space-y-5 animate-in fade-in duration-200">
            
            {/* Trimester Switcher & Average */}
            <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center space-x-1 bg-slate-800/90 p-1 rounded-2xl border border-slate-700 w-full sm:w-auto justify-center">
                {[1, 2, 3].map(t => (
                  <button
                    key={t}
                    onClick={() => setSelectedTrimester(t)}
                    className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                      selectedTrimester === t
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Trimestre {t}
                  </button>
                ))}
              </div>

              <div className="flex items-center space-x-3">
                <span className="text-xs text-slate-400 font-bold">Moyenne Estimée :</span>
                {trimesterAverage !== null ? (
                  <span className={`text-xl font-black px-3.5 py-1 rounded-2xl shadow-sm ${
                    parseFloat(trimesterAverage) >= 10 
                      ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/40'
                      : 'bg-red-600/20 text-red-400 border border-red-500/40'
                  }`}>
                    {trimesterAverage} / 20
                  </span>
                ) : (
                  <span className="text-xs text-slate-500 italic">Pas encore de notes</span>
                )}
              </div>
            </div>

            {/* Quick Link to Exam Papers for Revision */}
            {childExamPapersCount > 0 && (
              <div className="p-3.5 rounded-2xl bg-gradient-to-r from-blue-900/40 via-indigo-900/40 to-slate-900 border border-blue-800/40 flex items-center justify-between gap-3">
                <div className="flex items-center space-x-2.5">
                  <div className="p-2 rounded-xl bg-blue-600/30 text-blue-300 shrink-0">
                    <FileText className="w-4 h-4 text-amber-400" />
                  </div>
                  <div>
                    <p className="text-xs font-black text-white">
                      {childExamPapersCount} sujet{childExamPapersCount > 1 ? 's' : ''} d'épreuve & devoirs disponibles pour cette classe
                    </p>
                    <p className="text-[11px] text-slate-400">
                      Entraînez-vous avec les sujets déposés par vos professeurs, téléchargeables en Word (.doc) ou fichier joint.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab('epreuves')}
                  className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-black text-xs shrink-0 shadow flex items-center space-x-1 cursor-pointer transition-all hover:scale-105"
                >
                  <span>Ouvrir les Épreuves</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Grades Table */}
            <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
              <h3 className="text-sm font-black text-white flex items-center space-x-2">
                <Award className="w-4 h-4 text-blue-400" />
                <span>Notes du Trimestre {selectedTrimester}</span>
              </h3>

              {filteredGrades.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-500">
                  Aucune note saisie pour ce trimestre.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {filteredGrades.map(g => {
                    const sbj = subjects.find(s => s.id === g.subjectId);
                    const markOn20 = g.maxMark && g.maxMark !== 20 ? (g.mark / g.maxMark) * 20 : g.mark;
                    const isPassing = markOn20 >= 10;
                    return (
                      <div
                        key={g.id}
                        className="p-3.5 rounded-2xl bg-slate-800/80 border border-slate-700 flex items-center justify-between"
                      >
                        <div>
                          <p className="text-xs font-black text-white">
                            {sbj?.name || 'Matière'}
                          </p>
                          <p className="text-[10px] text-slate-400">
                            {g.examType} • Coeff : {g.coefficient || 1} • {g.date}
                          </p>
                        </div>

                        <div className="text-right">
                          <span className={`text-sm font-black px-2.5 py-1 rounded-xl font-mono ${
                            isPassing
                              ? 'bg-emerald-600/20 text-emerald-300 border border-emerald-500/30'
                              : 'bg-red-600/20 text-red-300 border border-red-500/30'
                          }`}>
                            {g.mark} / {g.maxMark || 20}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: TRACS SCOLARITÉ                                                    */}
        {/* ========================================================================= */}
        {activeTab === 'scolarite' && (
          <div className="space-y-5 animate-in fade-in duration-200">
            
            {/* Financial Summary Card */}
            <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <h3 className="text-sm font-black text-white flex items-center space-x-2">
                  <CreditCard className="w-4 h-4 text-emerald-400" />
                  <span>État Financier de la Scolarité</span>
                </h3>
                <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                  isTuitionFullyPaid
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                }`}>
                  {isTuitionFullyPaid ? 'Scolarité Soldée' : 'Reste à Payer'}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3.5 rounded-2xl bg-slate-800/80 border border-slate-700/80">
                  <p className="text-[10px] font-black uppercase text-slate-400">Total Scolarité</p>
                  <p className="text-base font-black text-white mt-1">
                    {tuitionFee.toLocaleString()} {settings.currency}
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-emerald-950/40 border border-emerald-800/60">
                  <p className="text-[10px] font-black uppercase text-emerald-400">Total Déjà Payé</p>
                  <p className="text-base font-black text-emerald-300 mt-1">
                    {totalPaid.toLocaleString()} {settings.currency}
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-amber-950/40 border border-amber-800/60">
                  <p className="text-[10px] font-black uppercase text-amber-400">Solde Restant</p>
                  <p className="text-base font-black text-amber-300 mt-1">
                    {remainingBalance.toLocaleString()} {settings.currency}
                  </p>
                </div>
              </div>
            </div>

            {/* Payments List */}
            <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
              <h3 className="text-sm font-black text-white">
                Reçus de Paiement Enregistrés ({studentPayments.length})
              </h3>

              {studentPayments.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-500">
                  Aucun versement enregistré pour l'instant.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {studentPayments.map(p => (
                    <div
                      key={p.id}
                      className="p-3.5 rounded-2xl bg-slate-800/80 border border-slate-700 flex items-center justify-between"
                    >
                      <div>
                        <p className="text-xs font-black text-white">
                          Reçu N° {p.receiptNumber}
                        </p>
                        <p className="text-[10px] text-slate-400">
                          {p.paymentType} • {p.date} • {p.paymentMethod}
                        </p>
                      </div>

                      <div className="flex items-center space-x-3">
                        <span className="text-xs font-black text-emerald-400">
                          +{p.amountPaid.toLocaleString()} {settings.currency}
                        </span>
                        <button
                          type="button"
                          onClick={() => setSelectedReceiptForPrint(p)}
                          className="px-2.5 py-1 rounded-lg bg-slate-700 hover:bg-slate-600 text-white text-[11px] font-bold flex items-center space-x-1 cursor-pointer"
                        >
                          <Printer className="w-3 h-3" />
                          <span>Reçu</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: AVIS & ANNONCES OFFICIELLES ÉCOLE (PUBLIQUES ET PRIVÉES)           */}
        {/* ========================================================================= */}
        {activeTab === 'messages' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            
            {/* BOÎTE D'ANNONCES OFFICIELLES & MESSAGES PRIVÉS */}
            <div className="p-5 sm:p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
                <div className="flex items-center space-x-3">
                  <div className="p-3 rounded-2xl bg-blue-600/20 text-blue-400 border border-blue-500/30">
                    <Megaphone className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-white flex items-center space-x-2">
                      <span>Boîte d'Annonces & Circulaires Officielles</span>
                    </h3>
                    <p className="text-xs text-slate-400">
                      Messages et avis officiels diffusés par la Direction de {currentSchool.name}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <span className="px-3 py-1 rounded-full bg-slate-800 text-slate-300 text-xs font-bold border border-slate-700">
                    {parentOfficialAnnouncements.length} annonce(s)
                  </span>
                </div>
              </div>

              {/* Filter Pills */}
              <div className="flex items-center space-x-2 overflow-x-auto pb-1">
                <button
                  type="button"
                  onClick={() => setAnnouncementFilter('ALL')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer shrink-0 ${
                    announcementFilter === 'ALL'
                      ? 'bg-blue-600 text-white shadow'
                      : 'bg-slate-800 text-slate-400 hover:text-white border border-slate-700'
                  }`}
                >
                  Toutes ({parentOfficialAnnouncements.length})
                </button>

                <button
                  type="button"
                  onClick={() => setAnnouncementFilter('PRIVATE')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer shrink-0 flex items-center space-x-1.5 ${
                    announcementFilter === 'PRIVATE'
                      ? 'bg-amber-500 text-slate-950 shadow'
                      : 'bg-slate-800 text-amber-400 hover:bg-slate-700 border border-amber-500/30'
                  }`}
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>Messages Privés ({parentOfficialAnnouncements.filter(a => a.audience === 'PRIVATE_STUDENT').length})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setAnnouncementFilter('PUBLIC')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer shrink-0 flex items-center space-x-1.5 ${
                    announcementFilter === 'PUBLIC'
                      ? 'bg-emerald-600 text-white shadow'
                      : 'bg-slate-800 text-slate-400 hover:text-white border border-slate-700'
                  }`}
                >
                  <Globe className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Publiques ({parentOfficialAnnouncements.filter(a => a.audience === 'PUBLIC_ALL').length})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setAnnouncementFilter('CLASS')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer shrink-0 flex items-center space-x-1.5 ${
                    announcementFilter === 'CLASS'
                      ? 'bg-indigo-600 text-white shadow'
                      : 'bg-slate-800 text-slate-400 hover:text-white border border-slate-700'
                  }`}
                >
                  <Users className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Classe ({parentOfficialAnnouncements.filter(a => a.audience === 'PUBLIC_CLASS').length})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setAnnouncementFilter('ADS')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer shrink-0 flex items-center space-x-1.5 ${
                    announcementFilter === 'ADS'
                      ? 'bg-amber-500 text-slate-950 shadow'
                      : 'bg-slate-800 text-amber-400 hover:bg-slate-700 border border-amber-500/30'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Affiches & Pubs ({parentOfficialAnnouncements.filter(a => a.isAdBanner || a.category === 'PUBLICITE' || a.category === 'PARTENAIRE' || a.category === 'ACTIVITE' || Boolean(a.photoUrl)).length})</span>
                </button>
              </div>

              {/* Announcements Feed */}
              {filteredOfficialAnnouncements.length === 0 ? (
                <div className="p-10 rounded-2xl bg-slate-950/50 border border-slate-800/80 text-center space-y-3">
                  <Megaphone className="w-10 h-10 text-slate-600 mx-auto" />
                  <p className="text-sm font-bold text-slate-300">
                    Aucune annonce officielle dans cette catégorie pour le moment.
                  </p>
                  <p className="text-xs text-slate-500 max-w-md mx-auto">
                    Toutes les circulaires, avis de rentrée, rappels de tranches ou convocations privées envoyés par l'école apparaîtront ici.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredOfficialAnnouncements.map(announcement => {
                    const isPrivate = announcement.audience === 'PRIVATE_STUDENT';
                    const isClass = announcement.audience === 'PUBLIC_CLASS';
                    const hasRead = (announcement.readByParentIds || []).some(
                      id => id === authPhone || id === currentStudent?.id
                    );

                    return (
                      <article
                        key={announcement.id}
                        className={`p-5 rounded-2xl transition-all space-y-3.5 border ${
                          isPrivate
                            ? 'bg-gradient-to-br from-amber-950/40 via-slate-900 to-slate-900 border-amber-500/60 shadow-lg'
                            : announcement.isPinned
                            ? 'bg-slate-800/90 border-blue-500/50 shadow-md'
                            : 'bg-slate-800/60 border-slate-700 hover:border-slate-600'
                        }`}
                      >
                        {/* Header Badges */}
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                            {isPrivate ? (
                              <span className="px-2.5 py-1 rounded-lg text-[10px] font-black bg-amber-500 text-slate-950 flex items-center space-x-1 shadow-xs">
                                <Lock className="w-3 h-3" />
                                <span>MESSAGE PRIVÉ CONFIDENTIEL</span>
                              </span>
                            ) : isClass ? (
                              <span className="px-2.5 py-1 rounded-lg text-[10px] font-black bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center space-x-1">
                                <Users className="w-3 h-3" />
                                <span>CLASSE DE {announcement.targetClassName || currentStudentClass?.name}</span>
                              </span>
                            ) : (
                              <span className="px-2.5 py-1 rounded-lg text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center space-x-1">
                                <Globe className="w-3 h-3" />
                                <span>ANNONCE PUBLIQUE ÉCOLE</span>
                              </span>
                            )}

                            {announcement.priority === 'URGENTE' && (
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-rose-500 text-white animate-pulse">
                                🚨 URGENT
                              </span>
                            )}

                            {announcement.priority === 'IMPORTANTE' && (
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-amber-500/30 text-amber-300 border border-amber-500/40">
                                ⭐ IMPORTANT
                              </span>
                            )}

                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-700 text-slate-300">
                              {announcement.category}
                            </span>

                            {announcement.isPinned && (
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-500/20 text-blue-300 flex items-center space-x-1">
                                <Pin className="w-2.5 h-2.5" />
                                <span>Épinglé</span>
                              </span>
                            )}
                          </div>

                          <span className="text-[11px] text-slate-400 font-mono">
                            {announcement.createdAt ? new Date(announcement.createdAt).toLocaleDateString('fr-FR', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            }) : ''}
                          </span>
                        </div>

                        {/* Private Target Banner */}
                        {isPrivate && (
                          <div className="p-2.5 rounded-xl bg-amber-950/60 border border-amber-700/50 flex items-center justify-between text-xs text-amber-200">
                            <span className="flex items-center space-x-1.5">
                              <Lock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                              <span>
                                Destiné spécialement au parent de : <strong>{announcement.targetStudentName || `${currentStudent?.firstName} ${currentStudent?.lastName}`}</strong>
                              </span>
                            </span>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300">
                              Non visible par les autres parents
                            </span>
                          </div>
                        )}

                        {/* Title & Content */}
                        <div className="space-y-2">
                          <h4 className="text-base font-black text-white leading-snug">
                            {announcement.title}
                          </h4>
                          <div className="text-xs text-slate-200 leading-relaxed whitespace-pre-wrap font-normal">
                            {announcement.content}
                          </div>
                        </div>

                        {/* Attached Photo Display */}
                        {announcement.photoUrl && (
                          <div className="pt-2">
                            <div className="relative rounded-2xl overflow-hidden border border-slate-700 max-w-md group bg-black/40">
                              <img
                                src={announcement.photoUrl}
                                alt={announcement.photoName || announcement.title}
                                className="w-full h-auto max-h-80 object-cover cursor-pointer transition-transform group-hover:scale-[1.02]"
                                onClick={() => setActiveLightboxPhoto({ url: announcement.photoUrl!, title: announcement.title })}
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end justify-between p-3 pointer-events-none">
                                <span className="text-[11px] text-slate-200 font-medium truncate max-w-xs">
                                  {announcement.photoName || 'Affiche / Document joint'}
                                </span>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setActiveLightboxPhoto({ url: announcement.photoUrl!, title: announcement.title });
                                  }}
                                  className="pointer-events-auto px-2.5 py-1 rounded-lg bg-blue-600/90 hover:bg-blue-600 text-white text-[10px] font-bold flex items-center space-x-1 shadow cursor-pointer"
                                >
                                  <Eye className="w-3 h-3" />
                                  <span>Agrandir</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Footer: Author, Actions & Read Acknowledgement */}
                        <div className="pt-3 border-t border-slate-700/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs">
                          <div className="text-slate-400 flex items-center space-x-2 flex-wrap">
                            <span className="flex items-center space-x-1.5">
                              <Shield className="w-3.5 h-3.5 text-blue-400" />
                              <span>Diffusé par : <strong className="text-slate-200">{announcement.sponsorName || announcement.authorName || 'Direction de l’École'}</strong></span>
                            </span>
                            {announcement.adTag && (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300">
                                {announcement.adTag}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center space-x-2 flex-wrap gap-y-2">
                            {/* CTA Link / Button if any */}
                            {announcement.ctaUrl && (
                              <a
                                href={announcement.ctaUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black text-xs transition-transform active:scale-95 flex items-center space-x-1 shadow-md cursor-pointer"
                              >
                                <span>{announcement.ctaText || 'Accéder au Service'}</span>
                                <ExternalLink className="w-3.5 h-3.5" />
                              </a>
                            )}

                            {/* Share button */}
                            <button
                              type="button"
                              onClick={() => {
                                const text = `📢 *${announcement.title}*\n\n${announcement.content}\n\n🏫 *${currentSchool.name}*`;
                                window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
                              }}
                              className="px-2.5 py-1.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white border border-emerald-500/30 text-xs font-bold transition-all flex items-center space-x-1 cursor-pointer"
                              title="Partager sur WhatsApp"
                            >
                              <Share2 className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">Partager</span>
                            </button>

                            {hasRead ? (
                              <div className="flex items-center space-x-1 text-emerald-400 font-bold text-xs">
                                <CheckCircle2 className="w-4 h-4" />
                                <span>Accusé de réception enregistré</span>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => markAnnouncementAsReadByParent(announcement.id, authPhone || currentStudent?.id || '')}
                                className="px-3 py-1.5 rounded-xl bg-slate-700 hover:bg-blue-600 text-slate-200 hover:text-white font-bold text-xs transition-all flex items-center space-x-1.5 cursor-pointer shadow-xs"
                              >
                                <Check className="w-3.5 h-3.5" />
                                <span>J'ai bien pris connaissance</span>
                              </button>
                            )}
                          </div>
                        </div>

                      </article>
                    );
                  })}
                </div>
              )}
            </div>

            {/* COMMUNICATIONS ARCHIVÉES (CIRCULAIRES & SMS SECRÉTARIAT) */}
            {studentMessages.length > 0 && (
              <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <h3 className="text-sm font-black text-white flex items-center space-x-2">
                    <MessageSquare className="w-4 h-4 text-blue-400" />
                    <span>Autres Circulaires & Messages Archivés</span>
                  </h3>
                  <span className="text-[11px] text-slate-400">
                    {studentMessages.length} message(s)
                  </span>
                </div>

                <div className="space-y-3">
                  {studentMessages.map(msg => (
                    <div
                      key={msg.id}
                      className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-blue-400">
                          {msg.senderName}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {msg.sentAt}
                        </span>
                      </div>
                      <h4 className="font-bold text-xs text-white">
                        {msg.subject}
                      </h4>
                      <p className="text-xs text-slate-300 leading-relaxed">
                        {msg.content}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        )}

      </main>

      {/* Lightbox for Photos */}
      {activeLightboxPhoto && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="relative max-w-2xl w-full bg-slate-900 rounded-3xl overflow-hidden border border-slate-800 shadow-2xl p-4 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h4 className="text-sm font-bold text-white truncate max-w-md">
                {activeLightboxPhoto.title}
              </h4>
              <button
                type="button"
                onClick={() => setActiveLightboxPhoto(null)}
                className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="max-h-[75vh] overflow-auto flex items-center justify-center rounded-2xl bg-black">
              <img 
                src={activeLightboxPhoto.url} 
                alt={activeLightboxPhoto.title} 
                className="max-h-[70vh] w-auto object-contain"
              />
            </div>
          </div>
        </div>
      )}

      {/* PWA Install Guide Modal */}
      <PwaInstallGuideModalProps
        isOpen={isInstallModalOpen}
        onClose={() => setIsInstallModalOpen(false)}
        schoolName={currentSchool.name}
        appTitle="Espace Parents"
      />

      {/* Print Bulletin Modal */}
      {isBulletinModalOpen && currentStudent && (
        <PrintBulletinModal
          isOpen={isBulletinModalOpen}
          onClose={() => setIsBulletinModalOpen(false)}
          student={currentStudent}
          classObj={currentStudentClass || classes[0]}
          trimester={selectedTrimester as any}
        />
      )}

      {/* Print Receipt Modal */}
      {selectedReceiptForPrint && currentStudent && (
        <PrintReceiptModal
          isOpen={Boolean(selectedReceiptForPrint)}
          onClose={() => setSelectedReceiptForPrint(null)}
          payment={selectedReceiptForPrint}
          student={currentStudent}
          classObj={currentStudentClass}
        />
      )}

      {/* PARENT PAYMENT & SUBSCRIPTION MODAL */}
      {isPaymentModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in">
          <div className="w-full max-w-xl bg-slate-900 border border-slate-700 rounded-3xl p-6 sm:p-7 shadow-2xl space-y-5 my-8">
            
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-3">
                <div className="w-11 h-11 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0">
                  <CreditCard className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-white">
                    Souscription & Espace Paiement
                  </h3>
                  <p className="text-xs text-slate-400">
                    {currentSchool.name} • Compte : <span className="font-mono text-white">{authPhone}</span>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsPaymentModalOpen(false)}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Current Status Box */}
            <div className={`p-4 rounded-2xl border ${
              isSubscriptionActive 
                ? 'bg-emerald-950/40 border-emerald-500/40' 
                : 'bg-amber-950/40 border-amber-500/40'
            }`}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-300">Statut actuel :</span>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-black uppercase ${
                  isSubscriptionActive 
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' 
                    : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                }`}>
                  {isSubscriptionActive ? '✅ Abonnement Actif' : '⚠️ Non activé / En attente'}
                </span>
              </div>
              {isSubscriptionActive ? (
                <div className="mt-2 text-xs text-slate-300 space-y-1">
                  <p>
                    Expiration : <strong className="text-white">{currentParentActivation?.fin_abonnement ? new Date(currentParentActivation.fin_abonnement).toLocaleDateString('fr-FR') : 'Session courante'}</strong>
                  </p>
                  {currentParentActivation?.code_recu && (
                    <p>
                      Code Reçu unique : <span className="font-mono font-black text-amber-300 bg-slate-800 px-2 py-0.5 rounded">{currentParentActivation.code_recu}</span>
                    </p>
                  )}
                </div>
              ) : (
                <p className="mt-2 text-xs text-amber-200/90 leading-relaxed">
                  Pour débloquer l'accès complet, veuillez effectuer votre paiement manuel puis envoyer la capture d'écran par WhatsApp pour activation à distance.
                </p>
              )}
            </div>

            {/* Plan Selector */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-300 block">
                Sélectionnez votre formule d'abonnement :
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div
                  onClick={() => setSelectedPaymentPlan('MONTHLY')}
                  className={`p-3.5 rounded-2xl border-2 transition-all cursor-pointer ${
                    selectedPaymentPlan === 'MONTHLY'
                      ? 'bg-emerald-950/40 border-emerald-500 shadow-md'
                      : 'bg-slate-800/60 border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-emerald-400">1 Mois</span>
                    <span className="text-slate-400">30 jours</span>
                  </div>
                  <div className="text-xl font-black text-white mt-1">1 000 FCFA</div>
                  <span className="text-[10px] text-slate-400 block mt-0.5">Renouvelable chaque mois</span>
                </div>

                <div
                  onClick={() => setSelectedPaymentPlan('ANNUAL')}
                  className={`p-3.5 rounded-2xl border-2 transition-all cursor-pointer relative ${
                    selectedPaymentPlan === 'ANNUAL'
                      ? 'bg-purple-950/40 border-purple-500 shadow-md'
                      : 'bg-slate-800/60 border-slate-700'
                  }`}
                >
                  <div className="absolute top-2 right-2 px-1.5 py-0.2 bg-purple-600 text-[8px] font-black uppercase text-white rounded">
                    -3 000 F
                  </div>
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-purple-400">1 An</span>
                    <span className="text-slate-400">Année scolaire</span>
                  </div>
                  <div className="text-xl font-black text-white mt-1">9 000 FCFA</div>
                  <span className="text-[10px] text-slate-400 block mt-0.5">Accès illimité toute l'année</span>
                </div>
              </div>
            </div>

            {/* Payment Numbers */}
            <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2.5 text-xs">
              <p className="font-bold text-slate-200">
                Numéros officiels pour effectuer votre transfert :
              </p>
              <div className="space-y-2">
                <div className="p-2 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 block">MTN Mobile Money</span>
                    <span className="text-sm font-mono font-bold text-amber-300">01 67 43 03 81</span>
                  </div>
                  <button
                    onClick={() => handleCopyPaymentText('0167430381', 'MODAL_MTN')}
                    className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold cursor-pointer"
                  >
                    {copiedPaymentLabel === 'MODAL_MTN' ? 'Copié !' : 'Copier'}
                  </button>
                </div>

                <div className="p-2 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 block">Moov / Wave / Direct Promoteur</span>
                    <span className="text-sm font-mono font-bold text-emerald-300">01 43 75 45 93</span>
                  </div>
                  <button
                    onClick={() => handleCopyPaymentText('0143754593', 'MODAL_PROMO')}
                    className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold cursor-pointer"
                  >
                    {copiedPaymentLabel === 'MODAL_PROMO' ? 'Copié !' : 'Copier'}
                  </button>
                </div>
              </div>
            </div>

            {/* Big WhatsApp Action Button */}
            <a
              href={getWhatsAppPaymentUrl(selectedPaymentPlan)}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 hover:from-emerald-500 hover:to-teal-400 text-white font-black text-sm flex items-center justify-center gap-2.5 shadow-xl shadow-emerald-950/60 border border-emerald-400/40 transition-all cursor-pointer text-center"
            >
              <MessageSquare className="w-5 h-5 text-white animate-bounce shrink-0" />
              <span>Envoyer la capture de paiement par WhatsApp (01 43 75 45 93)</span>
              <ExternalLink className="w-4 h-4 opacity-80 shrink-0" />
            </a>

            {/* Claim Receipt Code Field */}
            <div className="pt-2 border-t border-slate-800 space-y-2">
              <label className="text-[11px] text-slate-400 font-semibold block">
                Vous possédez déjà votre code reçu officiel (5 caractères) ?
              </label>
              <form onSubmit={handleClaimReceiptCodeSubmit} className="flex gap-2">
                <input
                  type="text"
                  maxLength={10}
                  value={claimReceiptCodeInput}
                  onChange={(e) => setClaimReceiptCodeInput(e.target.value.toUpperCase())}
                  placeholder="Code Reçu (ex: A7K9P)"
                  className="flex-1 px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs font-mono font-bold uppercase tracking-widest focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold text-xs border border-amber-500/30 cursor-pointer shrink-0"
                >
                  Activer
                </button>
              </form>
              {claimReceiptFeedback && (
                <p className={`text-xs font-bold ${claimReceiptFeedback.success ? 'text-emerald-400' : 'text-red-400'}`}>
                  {claimReceiptFeedback.message}
                </p>
              )}
            </div>

            <div className="pt-1 flex justify-end">
              <button
                onClick={() => setIsPaymentModalOpen(false)}
                className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs cursor-pointer"
              >
                Fermer
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
