import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../lib/store';
import {
  EducMasterConfig,
  EducMasterCustomLink,
  EducMasterTransmissionLog
} from '../types';
import {
  getClassSection,
  getCleanStudentNames,
  getStudentRepeaterStatus
} from '../lib/schoolUtils';
import { calculateClassRanks } from '../lib/gradingUtils';
import {
  Globe,
  ExternalLink,
  Copy,
  Check,
  Save,
  ClipboardPaste,
  Download,
  FileSpreadsheet,
  Users,
  BarChart3,
  Plus,
  Trash2,
  AlertCircle,
  BookOpen,
  GraduationCap,
  Link2,
  History
} from 'lucide-react';

interface EducMasterViewProps {
  onNavigate?: (view: string) => void;
}

export function normalizeEducMasterUrl(raw: string): {
  valid: boolean;
  url: string;
  error?: string;
} {
  const trimmed = (raw || '').trim();
  if (!trimmed) {
    return { valid: true, url: '' };
  }

  const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;

  try {
    const parsed = new URL(withProtocol);
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
      return {
        valid: false,
        url: trimmed,
        error: 'Le lien doit commencer par https:// ou http://.'
      };
    }
    if (!parsed.hostname || !parsed.hostname.includes('.')) {
      return {
        valid: false,
        url: trimmed,
        error: 'Adresse invalide. Exemple attendu : https://educmaster.bj/...'
      };
    }
    return { valid: true, url: parsed.toString() };
  } catch {
    return {
      valid: false,
      url: trimmed,
      error: 'Format de lien invalide. Vérifiez l’adresse copiée depuis EducMaster.'
    };
  }
}

function escapeCsvCell(value: string | number | undefined | null): string {
  const text = String(value ?? '').replace(/"/g, '""');
  return `"${text}"`;
}

function downloadCsvFile(filename: string, headers: string[], rows: (string | number)[][]) {
  const lines = [
    headers.map(escapeCsvCell).join(';'),
    ...rows.map(row => row.map(escapeCsvCell).join(';'))
  ];
  const csvContent = '\uFEFF' + lines.join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function formatFrenchDateTime(iso?: string): string {
  if (!iso) return '—';
  const dt = new Date(iso);
  if (Number.isNaN(dt.getTime())) return iso;
  return dt.toLocaleString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export const EducMasterView: React.FC<EducMasterViewProps> = ({ onNavigate }) => {
  const {
    settings,
    currentSchool,
    currentUser,
    classes,
    students,
    subjects,
    grades,
    updateSettings
  } = useApp();

  const savedConfig: EducMasterConfig = useMemo(() => {
    const src = settings.educMaster || currentSchool?.educMaster;
    return {
      primaire: {
        portalUrl: src?.primaire?.portalUrl || '',
        schoolCode: src?.primaire?.schoolCode || '',
        accountEmail: src?.primaire?.accountEmail || '',
        notes: src?.primaire?.notes || '',
        updatedAt: src?.primaire?.updatedAt
      },
      college: {
        portalUrl: src?.college?.portalUrl || '',
        schoolCode: src?.college?.schoolCode || '',
        accountEmail: src?.college?.accountEmail || '',
        notes: src?.college?.notes || '',
        updatedAt: src?.college?.updatedAt
      },
      customLinks: Array.isArray(src?.customLinks) ? src.customLinks : [],
      transmissionLogs: Array.isArray(src?.transmissionLogs) ? src.transmissionLogs : []
    };
  }, [settings.educMaster, currentSchool?.educMaster]);

  // Draft form states for Primaire and Collège
  const [primaireUrl, setPrimaireUrl] = useState(savedConfig.primaire.portalUrl);
  const [primaireCode, setPrimaireCode] = useState(savedConfig.primaire.schoolCode || '');
  const [primaireEmail, setPrimaireEmail] = useState(savedConfig.primaire.accountEmail || '');
  const [primaireNotes, setPrimaireNotes] = useState(savedConfig.primaire.notes || '');

  const [collegeUrl, setCollegeUrl] = useState(savedConfig.college.portalUrl);
  const [collegeCode, setCollegeCode] = useState(savedConfig.college.schoolCode || '');
  const [collegeEmail, setCollegeEmail] = useState(savedConfig.college.accountEmail || '');
  const [collegeNotes, setCollegeNotes] = useState(savedConfig.college.notes || '');

  // Extra custom links form
  const [newLinkLabel, setNewLinkLabel] = useState('');
  const [newLinkCycle, setNewLinkCycle] = useState<'PRIMAIRE' | 'COLLEGE' | 'AUTRE'>('COLLEGE');
  const [newLinkUrl, setNewLinkUrl] = useState('');

  // Report export controls
  const [exportCycle, setExportCycle] = useState<'PRIMAIRE' | 'COLLEGE'>('COLLEGE');
  const [exportClassId, setExportClassId] = useState<string>('ALL');
  const [exportTrimester, setExportTrimester] = useState<1 | 2 | 3>(settings.currentTrimester || 1);

  // UI feedback
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
  const [primaireError, setPrimaireError] = useState<string | null>(null);
  const [collegeError, setCollegeError] = useState<string | null>(null);
  const [customLinkError, setCustomLinkError] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [confirmClearLogs, setConfirmClearLogs] = useState(false);

  // Synchronize drafts when active school or cloud settings change
  useEffect(() => {
    setPrimaireUrl(savedConfig.primaire.portalUrl);
    setPrimaireCode(savedConfig.primaire.schoolCode || '');
    setPrimaireEmail(savedConfig.primaire.accountEmail || '');
    setPrimaireNotes(savedConfig.primaire.notes || '');

    setCollegeUrl(savedConfig.college.portalUrl);
    setCollegeCode(savedConfig.college.schoolCode || '');
    setCollegeEmail(savedConfig.college.accountEmail || '');
    setCollegeNotes(savedConfig.college.notes || '');

    setPrimaireError(null);
    setCollegeError(null);
  }, [currentSchool?.id, savedConfig]);

  const showFeedback = (type: 'success' | 'error' | 'info', message: string) => {
    setFeedback({ type, message });
    setTimeout(() => {
      setFeedback(prev => (prev?.message === message ? null : prev));
    }, 6000);
  };

  // Partition classes and students by EducMaster cycle (Primaire/Maternelle vs Collège/Lycée)
  const primaryClasses = useMemo(
    () => classes.filter(c => {
      const sec = getClassSection(c);
      return sec === 'PRIMAIRE' || sec === 'MATERNELLE';
    }),
    [classes]
  );

  const collegeClasses = useMemo(
    () => classes.filter(c => {
      const sec = getClassSection(c);
      return sec === 'COLLEGE' || sec === 'LYCEE';
    }),
    [classes]
  );

  const primaryClassIds = useMemo(() => new Set(primaryClasses.map(c => c.id)), [primaryClasses]);
  const collegeClassIds = useMemo(() => new Set(collegeClasses.map(c => c.id)), [collegeClasses]);

  const primaryStudents = useMemo(
    () =>
      students.filter(s => {
        if (primaryClassIds.has(s.classId)) return true;
        const sec = getClassSection(s);
        return sec === 'PRIMAIRE' || sec === 'MATERNELLE';
      }),
    [students, primaryClassIds]
  );

  const collegeStudents = useMemo(
    () =>
      students.filter(s => {
        if (collegeClassIds.has(s.classId)) return true;
        const sec = getClassSection(s);
        return sec === 'COLLEGE' || sec === 'LYCEE';
      }),
    [students, collegeClassIds]
  );

  const primaryGradesCount = useMemo(() => {
    const ids = new Set(primaryStudents.map(s => s.id));
    return grades.filter(g => ids.has(g.studentId) && Number(g.trimester) === Number(settings.currentTrimester)).length;
  }, [grades, primaryStudents, settings.currentTrimester]);

  const collegeGradesCount = useMemo(() => {
    const ids = new Set(collegeStudents.map(s => s.id));
    return grades.filter(g => ids.has(g.studentId) && Number(g.trimester) === Number(settings.currentTrimester)).length;
  }, [grades, collegeStudents, settings.currentTrimester]);

  const hasUnsavedPrimaire =
    primaireUrl.trim() !== (savedConfig.primaire.portalUrl || '').trim() ||
    primaireCode.trim() !== (savedConfig.primaire.schoolCode || '').trim() ||
    primaireEmail.trim() !== (savedConfig.primaire.accountEmail || '').trim() ||
    primaireNotes.trim() !== (savedConfig.primaire.notes || '').trim();

  const hasUnsavedCollege =
    collegeUrl.trim() !== (savedConfig.college.portalUrl || '').trim() ||
    collegeCode.trim() !== (savedConfig.college.schoolCode || '').trim() ||
    collegeEmail.trim() !== (savedConfig.college.accountEmail || '').trim() ||
    collegeNotes.trim() !== (savedConfig.college.notes || '').trim();

  const persistEducMasterConfig = (next: EducMasterConfig) => {
    updateSettings({ educMaster: next });
  };

  const handleSaveCycle = (cycle: 'PRIMAIRE' | 'COLLEGE') => {
    const rawUrl = cycle === 'PRIMAIRE' ? primaireUrl : collegeUrl;
    const normalized = normalizeEducMasterUrl(rawUrl);

    if (!normalized.valid) {
      if (cycle === 'PRIMAIRE') setPrimaireError(normalized.error || 'Lien invalide.');
      else setCollegeError(normalized.error || 'Lien invalide.');
      return;
    }

    const nowIso = new Date().toISOString();
    const nextConfig: EducMasterConfig = {
      ...savedConfig,
      primaire:
        cycle === 'PRIMAIRE'
          ? {
              portalUrl: normalized.url,
              schoolCode: primaireCode.trim().toUpperCase(),
              accountEmail: primaireEmail.trim(),
              notes: primaireNotes.trim(),
              updatedAt: nowIso
            }
          : savedConfig.primaire,
      college:
        cycle === 'COLLEGE'
          ? {
              portalUrl: normalized.url,
              schoolCode: collegeCode.trim().toUpperCase(),
              accountEmail: collegeEmail.trim(),
              notes: collegeNotes.trim(),
              updatedAt: nowIso
            }
          : savedConfig.college
    };

    if (cycle === 'PRIMAIRE') {
      setPrimaireUrl(normalized.url);
      setPrimaireError(null);
    } else {
      setCollegeUrl(normalized.url);
      setCollegeError(null);
    }

    persistEducMasterConfig(nextConfig);
    showFeedback(
      'success',
      cycle === 'PRIMAIRE'
        ? 'Lien EducMaster Primaire enregistré pour cet établissement.'
        : 'Lien EducMaster Collège enregistré pour cet établissement.'
    );
  };

  const handleSaveAllLinks = () => {
    const primCheck = normalizeEducMasterUrl(primaireUrl);
    const colCheck = normalizeEducMasterUrl(collegeUrl);

    setPrimaireError(primCheck.valid ? null : primCheck.error || 'Lien invalide.');
    setCollegeError(colCheck.valid ? null : colCheck.error || 'Lien invalide.');

    if (!primCheck.valid || !colCheck.valid) {
      showFeedback('error', 'Corrigez le format du lien avant d’enregistrer.');
      return;
    }

    const nowIso = new Date().toISOString();
    const nextConfig: EducMasterConfig = {
      ...savedConfig,
      primaire: {
        portalUrl: primCheck.url,
        schoolCode: primaireCode.trim().toUpperCase(),
        accountEmail: primaireEmail.trim(),
        notes: primaireNotes.trim(),
        updatedAt: nowIso
      },
      college: {
        portalUrl: colCheck.url,
        schoolCode: collegeCode.trim().toUpperCase(),
        accountEmail: collegeEmail.trim(),
        notes: collegeNotes.trim(),
        updatedAt: nowIso
      }
    };

    setPrimaireUrl(primCheck.url);
    setCollegeUrl(colCheck.url);
    persistEducMasterConfig(nextConfig);
    showFeedback('success', 'Les liens EducMaster Primaire et Collège ont été enregistrés.');
  };

  const handlePasteFromClipboard = async (target: 'PRIMAIRE' | 'COLLEGE' | 'CUSTOM') => {
    try {
      if (!navigator.clipboard || !navigator.clipboard.readText) {
        showFeedback('info', 'Utilisez Ctrl+V (ou appui long > Coller) directement dans le champ lien.');
        return;
      }
      const text = (await navigator.clipboard.readText()).trim();
      if (!text) {
        showFeedback('info', 'Votre presse-papiers est vide. Copiez d’abord votre lien EducMaster.');
        return;
      }
      if (target === 'PRIMAIRE') {
        setPrimaireUrl(text);
        setPrimaireError(null);
      } else if (target === 'COLLEGE') {
        setCollegeUrl(text);
        setCollegeError(null);
      } else {
        setNewLinkUrl(text);
        setCustomLinkError(null);
      }
      showFeedback('info', 'Lien collé. Cliquez sur « Enregistrer » pour le sauvegarder.');
    } catch {
      showFeedback('info', 'Autorisation presse-papiers refusée : collez directement avec Ctrl+V dans le champ.');
    }
  };

  const handleCopyText = async (text: string, key: string) => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(prev => (prev === key ? null : prev)), 2000);
    } catch {
      showFeedback('info', 'Impossible de copier automatiquement. Sélectionnez le lien manuellement.');
    }
  };

  const handleAddCustomLink = (e: React.FormEvent) => {
    e.preventDefault();
    const label = newLinkLabel.trim();
    if (!label) {
      setCustomLinkError('Indiquez un intitulé pour ce lien (ex: EducMaster Lycée, Examens BEPC).');
      return;
    }
    const urlCheck = normalizeEducMasterUrl(newLinkUrl);
    if (!urlCheck.valid || !urlCheck.url) {
      setCustomLinkError(urlCheck.error || 'Veuillez coller un lien EducMaster valide.');
      return;
    }

    const created: EducMasterCustomLink = {
      id: `em-link-${Date.now()}`,
      label,
      cycle: newLinkCycle,
      url: urlCheck.url,
      createdAt: new Date().toISOString()
    };

    const nextConfig: EducMasterConfig = {
      ...savedConfig,
      customLinks: [created, ...(savedConfig.customLinks || [])]
    };

    persistEducMasterConfig(nextConfig);
    setNewLinkLabel('');
    setNewLinkUrl('');
    setCustomLinkError(null);
    showFeedback('success', `Lien « ${label} » ajouté à votre espace EducMaster.`);
  };

  const handleDeleteCustomLink = (id: string) => {
    const nextConfig: EducMasterConfig = {
      ...savedConfig,
      customLinks: (savedConfig.customLinks || []).filter(l => l.id !== id)
    };
    persistEducMasterConfig(nextConfig);
    showFeedback('info', 'Lien complémentaire supprimé.');
  };

  const appendTransmissionLog = (entry: Omit<EducMasterTransmissionLog, 'id' | 'exportedAt' | 'exportedBy'>) => {
    const newLog: EducMasterTransmissionLog = {
      ...entry,
      id: `em-log-${Date.now()}`,
      exportedAt: new Date().toISOString(),
      exportedBy: currentUser?.name || currentUser?.email || 'Direction'
    };
    const nextLogs = [newLog, ...(savedConfig.transmissionLogs || [])].slice(0, 40);
    persistEducMasterConfig({
      ...savedConfig,
      transmissionLogs: nextLogs
    });
  };

  // Filtered classes & students for Export section
  const activeExportClasses = exportCycle === 'PRIMAIRE' ? primaryClasses : collegeClasses;
  const selectedExportClasses = useMemo(() => {
    if (exportClassId === 'ALL') return activeExportClasses;
    return activeExportClasses.filter(c => c.id === exportClassId);
  }, [activeExportClasses, exportClassId]);

  const selectedExportStudents = useMemo(() => {
    const classIdSet = new Set(selectedExportClasses.map(c => c.id));
    if (exportClassId === 'ALL') {
      return exportCycle === 'PRIMAIRE' ? primaryStudents : collegeStudents;
    }
    return students.filter(s => classIdSet.has(s.classId));
  }, [exportClassId, exportCycle, primaryStudents, collegeStudents, selectedExportClasses, students]);

  useEffect(() => {
    setExportClassId('ALL');
  }, [exportCycle]);

  const schoolSlug = (settings.schoolName || currentSchool?.name || 'Ecole')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '_')
    .replace(/^_|_$/g, '');

  const handleExportStudentsCsv = () => {
    if (selectedExportStudents.length === 0) {
      showFeedback('error', 'Aucun élève inscrit dans cette sélection pour générer le fichier.');
      return;
    }

    const headers = [
      'Matricule EducMaster',
      'Nom',
      'Prénoms',
      'Sexe',
      'Date de naissance',
      'Lieu de naissance',
      'Classe',
      'Niveau',
      'Redoublant',
      'Statut',
      'Parent / Tuteur',
      'Téléphone Parent'
    ];

    const rows = [...selectedExportStudents]
      .sort((a, b) => {
        const clsA = classes.find(c => c.id === a.classId)?.name || '';
        const clsB = classes.find(c => c.id === b.classId)?.name || '';
        return clsA.localeCompare(clsB, 'fr') || a.lastName.localeCompare(b.lastName, 'fr');
      })
      .map(s => {
        const cls = classes.find(c => c.id === s.classId);
        const clean = getCleanStudentNames(s);
        return [
          s.registrationNumber || '',
          clean.lastName.toUpperCase(),
          clean.firstName,
          s.gender,
          s.dateOfBirth || '',
          s.placeOfBirth || '',
          cls?.name || s.classId,
          cls?.level || s.level,
          getStudentRepeaterStatus(s) ? 'OUI' : 'NON',
          s.status || 'ACTIF',
          s.parentName || '',
          s.parentPhone || ''
        ];
      });

    const cycleTag = exportCycle === 'PRIMAIRE' ? 'Primaire' : 'College';
    const fileName = `EducMaster_Eleves_${cycleTag}_${schoolSlug}_${settings.academicYear}.csv`;
    downloadCsvFile(fileName, headers, rows);

    const targetClassLabel =
      exportClassId === 'ALL'
        ? `Toutes les classes (${activeExportClasses.length})`
        : classes.find(c => c.id === exportClassId)?.name || exportClassId;

    appendTransmissionLog({
      cycle: exportCycle,
      reportType: 'LISTE_ELEVES',
      className: targetClassLabel,
      recordCount: rows.length
    });
    showFeedback(
      'success',
      `Fichier EducMaster téléchargé (${rows.length} élève${rows.length > 1 ? 's' : ''}). Vous pouvez maintenant le déposer sur votre portail EducMaster.`
    );
  };

  const handleExportTrimesterGradesCsv = () => {
    if (selectedExportStudents.length === 0) {
      showFeedback('error', 'Aucun élève dans cette sélection pour exporter les moyennes.');
      return;
    }

    const headers = [
      'Matricule EducMaster',
      'Nom',
      'Prénoms',
      'Sexe',
      'Classe',
      'Trimestre',
      'Moyenne Générale (/20)',
      'Rang',
      'Mention',
      'Appréciation'
    ];

    const rows: (string | number)[][] = [];
    const classesToProcess = selectedExportClasses.length > 0 ? selectedExportClasses : activeExportClasses;

    classesToProcess.forEach(cls => {
      const clsStudents = selectedExportStudents.filter(s => s.classId === cls.id);
      if (clsStudents.length === 0) return;

      const summary = calculateClassRanks(
        clsStudents,
        grades,
        subjects,
        exportTrimester,
        settings.bulletinTemplate,
        cls
      );

      summary.rankings.forEach(r => {
        const clean = getCleanStudentNames(r.student);
        rows.push([
          r.student.registrationNumber || '',
          clean.lastName.toUpperCase(),
          clean.firstName,
          r.student.gender,
          cls.name,
          `Trimestre ${exportTrimester}`,
          r.overallAverage.toFixed(2),
          r.rank,
          r.mention,
          r.generalAppreciation
        ]);
      });
    });

    if (rows.length === 0) {
      showFeedback('error', 'Aucune donnée de classement disponible pour les classes sélectionnées.');
      return;
    }

    const cycleTag = exportCycle === 'PRIMAIRE' ? 'Primaire' : 'College';
    const fileName = `EducMaster_Moyennes_T${exportTrimester}_${cycleTag}_${schoolSlug}_${settings.academicYear}.csv`;
    downloadCsvFile(fileName, headers, rows);

    const targetClassLabel =
      exportClassId === 'ALL'
        ? `Toutes les classes (${classesToProcess.length})`
        : classes.find(c => c.id === exportClassId)?.name || exportClassId;

    appendTransmissionLog({
      cycle: exportCycle,
      reportType: 'NOTES_TRIMESTRE',
      trimester: exportTrimester,
      className: targetClassLabel,
      recordCount: rows.length
    });
    showFeedback(
      'success',
      `Relevé des moyennes du Trimestre ${exportTrimester} exporté (${rows.length} élève${rows.length > 1 ? 's' : ''}).`
    );
  };

  const handleExportSummaryCsv = () => {
    const classesToProcess = selectedExportClasses.length > 0 ? selectedExportClasses : activeExportClasses;
    if (classesToProcess.length === 0) {
      showFeedback('error', 'Aucune classe trouvée dans ce cycle pour générer la synthèse.');
      return;
    }

    const headers = [
      'Classe',
      'Niveau',
      'Effectif Total',
      'Garçons',
      'Filles',
      'Avec Matricule',
      `Moyenne Classe (T${exportTrimester})`,
      `Admis >= 10 (T${exportTrimester})`,
      `Taux de Réussite % (T${exportTrimester})`
    ];

    const rows: (string | number)[][] = classesToProcess.map(cls => {
      const clsStudents = students.filter(s => s.classId === cls.id);
      const boys = clsStudents.filter(s => s.gender === 'M').length;
      const girls = clsStudents.filter(s => s.gender === 'F').length;
      const withMat = clsStudents.filter(s => (s.registrationNumber || '').trim().length > 0).length;
      const summary = calculateClassRanks(
        clsStudents,
        grades,
        subjects,
        exportTrimester,
        settings.bulletinTemplate,
        cls
      );

      return [
        cls.name,
        cls.level,
        clsStudents.length,
        boys,
        girls,
        withMat,
        summary.classAverage.toFixed(2),
        summary.passedCount,
        summary.passRate.toFixed(1)
      ];
    });

    const cycleTag = exportCycle === 'PRIMAIRE' ? 'Primaire' : 'College';
    const fileName = `EducMaster_Synthese_Effectifs_T${exportTrimester}_${cycleTag}_${schoolSlug}_${settings.academicYear}.csv`;
    downloadCsvFile(fileName, headers, rows);

    appendTransmissionLog({
      cycle: exportCycle,
      reportType: 'SYNTHESE_EFFECTIFS',
      trimester: exportTrimester,
      className: `${classesToProcess.length} classe(s)`,
      recordCount: rows.length
    });
    showFeedback('success', `Synthèse des effectifs exportée pour ${rows.length} classe(s).`);
  };

  const handleClearLogs = () => {
    persistEducMasterConfig({
      ...savedConfig,
      transmissionLogs: []
    });
    setConfirmClearLogs(false);
    showFeedback('info', 'Journal des exports EducMaster vidé.');
  };

  const activeExportPortalUrl =
    exportCycle === 'PRIMAIRE' ? savedConfig.primaire.portalUrl : savedConfig.college.portalUrl;

  const reportTypeLabel = (type: EducMasterTransmissionLog['reportType']) => {
    switch (type) {
      case 'LISTE_ELEVES':
        return 'Liste des élèves & matricules';
      case 'NOTES_TRIMESTRE':
        return 'Moyennes & rangs trimestriels';
      case 'SYNTHESE_EFFECTIFS':
        return 'Synthèse des effectifs par classe';
    }
  };

  const configuredCount =
    (savedConfig.primaire.portalUrl ? 1 : 0) + (savedConfig.college.portalUrl ? 1 : 0);

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
        <div className="space-y-1.5 max-w-3xl">
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <span>République du Bénin</span>
            <span aria-hidden="true">·</span>
            <span>Passerelle officielle EducMaster</span>
            <span aria-hidden="true">·</span>
            <span className="tabular-nums">Année {settings.academicYear}</span>
            <span aria-hidden="true">·</span>
            <span className="tabular-nums font-medium text-slate-700 dark:text-slate-300">
              {configuredCount}/2 portails configurés
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            Espace EducMaster
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
            Reliez votre établissement <strong className="font-semibold text-slate-900 dark:text-slate-100">{settings.schoolName}</strong> à vos portails officiels EducMaster Primaire et Collège. Collez vos liens d’accès une seule fois, exportez vos fichiers conformes et ouvrez directement votre espace gouvernemental pour transmettre vos rapports.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {(hasUnsavedPrimaire || hasUnsavedCollege) && (
            <button
              type="button"
              onClick={handleSaveAllLinks}
              className="px-4 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold flex items-center gap-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Save className="h-4 w-4" />
              <span>Enregistrer tous les liens</span>
            </button>
          )}
          {onNavigate && (
            <button
              type="button"
              onClick={() => onNavigate('report-cards')}
              className="px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-sm font-medium flex items-center gap-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <FileSpreadsheet className="h-4 w-4" />
              <span>Bulletins & Notes</span>
            </button>
          )}
        </div>
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <div
          role="status"
          className={`px-4 py-3 rounded-lg border text-sm flex items-center justify-between gap-3 ${
            feedback.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
              : feedback.type === 'error'
              ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200'
              : 'bg-slate-100 dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {feedback.type === 'error' ? (
              <AlertCircle className="h-4 w-4 shrink-0" />
            ) : (
              <Check className="h-4 w-4 shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="text-xs font-medium underline opacity-80 hover:opacity-100 cursor-pointer shrink-0"
          >
            Fermer
          </button>
        </div>
      )}

      {/* Primary Two-Column Portal Link Workspace: EducMaster Primaire & EducMaster Collège */}
      <section aria-labelledby="educmaster-portals-heading" className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
          <h2 id="educmaster-portals-heading" className="text-base font-semibold text-slate-900 dark:text-white">
            01. Liens officiels des portails EducMaster
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Sauvegardés automatiquement dans le dossier de votre établissement (local et Cloud)
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
          {/* PANEL 1: EDUCMASTER PRIMAIRE */}
          <div className="flex flex-col justify-between bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 space-y-5">
            <div className="space-y-5">
              {/* Card Header */}
              <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                    <span>MEMP · Enseignement Maternel et Primaire</span>
                    <span aria-hidden="true">·</span>
                    <span
                      className={
                        savedConfig.primaire.portalUrl
                          ? 'text-emerald-700 dark:text-emerald-400 font-medium'
                          : 'text-amber-700 dark:text-amber-400 font-medium'
                      }
                    >
                      {savedConfig.primaire.portalUrl ? 'Lien connecté' : 'Lien à renseigner'}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <BookOpen className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span>EducMaster Primaire</span>
                  </h3>
                </div>
              </div>

              {/* URL Paste Field */}
              <div className="space-y-2">
                <label
                  htmlFor="educmaster-primaire-url"
                  className="block text-sm font-medium text-slate-700 dark:text-slate-300"
                >
                  Lien EducMaster Primaire de l’école
                </label>
                <div className="flex items-stretch gap-2">
                  <input
                    id="educmaster-primaire-url"
                    type="url"
                    value={primaireUrl}
                    onChange={e => {
                      setPrimaireUrl(e.target.value);
                      if (primaireError) setPrimaireError(null);
                    }}
                    placeholder="https://educmaster.bj/primaire/mon-ecole..."
                    className="flex-1 min-w-0 px-3.5 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-sm font-mono focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600"
                  />
                  <button
                    type="button"
                    onClick={() => handlePasteFromClipboard('PRIMAIRE')}
                    className="px-3.5 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-medium flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
                    title="Coller le lien depuis le presse-papiers"
                  >
                    <ClipboardPaste className="h-4 w-4" />
                    <span>Coller</span>
                  </button>
                </div>
                {primaireError && (
                  <p className="text-xs text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
                    <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                    <span>{primaireError}</span>
                  </p>
                )}
              </div>

              {/* Optional School Metadata for Primaire */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label
                    htmlFor="educmaster-primaire-code"
                    className="block text-xs font-medium text-slate-600 dark:text-slate-400"
                  >
                    Code établissement (optionnel)
                  </label>
                  <input
                    id="educmaster-primaire-code"
                    type="text"
                    value={primaireCode}
                    onChange={e => setPrimaireCode(e.target.value)}
                    placeholder="Ex: EM-PRIM-042"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-sm font-mono uppercase focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  />
                </div>
                <div className="space-y-1.5">
                  <label
                    htmlFor="educmaster-primaire-email"
                    className="block text-xs font-medium text-slate-600 dark:text-slate-400"
                  >
                    Identifiant / Email du compte (mémo)
                  </label>
                  <input
                    id="educmaster-primaire-email"
                    type="text"
                    value={primaireEmail}
                    onChange={e => setPrimaireEmail(e.target.value)}
                    placeholder="directeur.primaire@ecole.bj"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="educmaster-primaire-notes"
                  className="block text-xs font-medium text-slate-600 dark:text-slate-400"
                >
                  Consignes ou échéances de dépôt (optionnel)
                </label>
                <input
                  id="educmaster-primaire-notes"
                  type="text"
                  value={primaireNotes}
                  onChange={e => setPrimaireNotes(e.target.value)}
                  placeholder="Ex: Envoyer les effectifs et notes avant le 15 de fin de trimestre"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600"
                />
              </div>

              {/* Live Cycle Figures */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 grid grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Classes</p>
                  <p className="text-lg font-semibold text-slate-900 dark:text-white tabular-nums">
                    {primaryClasses.length}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Élèves inscrits</p>
                  <p className="text-lg font-semibold text-slate-900 dark:text-white tabular-nums">
                    {primaryStudents.length}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Notes T{settings.currentTrimester}</p>
                  <p className="text-lg font-semibold text-slate-900 dark:text-white tabular-nums">
                    {primaryGradesCount}
                  </p>
                </div>
              </div>
            </div>

            {/* Action Bar */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2.5">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleSaveCycle('PRIMAIRE')}
                  className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <Save className="h-4 w-4" />
                  <span>Enregistrer</span>
                </button>
                {savedConfig.primaire.portalUrl && (
                  <button
                    type="button"
                    onClick={() => handleCopyText(savedConfig.primaire.portalUrl, 'primaire')}
                    className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-sm font-medium flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    {copiedKey === 'primaire' ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
                    <span>{copiedKey === 'primaire' ? 'Copié' : 'Copier'}</span>
                  </button>
                )}
              </div>

              {savedConfig.primaire.portalUrl ? (
                <a
                  href={savedConfig.primaire.portalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 rounded-lg bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-white text-white dark:text-slate-900 text-sm font-semibold flex items-center gap-2 transition-colors whitespace-nowrap shrink-0"
                >
                  <span>Ouvrir EducMaster Primaire</span>
                  <ExternalLink className="h-4 w-4" />
                </a>
              ) : (
                <span className="text-xs text-slate-400 dark:text-slate-500">
                  Enregistrez un lien pour activer l’accès direct
                </span>
              )}
            </div>
          </div>

          {/* PANEL 2: EDUCMASTER COLLÈGE */}
          <div className="flex flex-col justify-between bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 space-y-5">
            <div className="space-y-5">
              {/* Card Header */}
              <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                    <span>MESTFP · Enseignement Secondaire (Collège & Lycée)</span>
                    <span aria-hidden="true">·</span>
                    <span
                      className={
                        savedConfig.college.portalUrl
                          ? 'text-emerald-700 dark:text-emerald-400 font-medium'
                          : 'text-amber-700 dark:text-amber-400 font-medium'
                      }
                    >
                      {savedConfig.college.portalUrl ? 'Lien connecté' : 'Lien à renseigner'}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <GraduationCap className="h-5 w-5 text-blue-600 dark:text-blue-400 shrink-0" />
                    <span>EducMaster Collège</span>
                  </h3>
                </div>
              </div>

              {/* URL Paste Field */}
              <div className="space-y-2">
                <label
                  htmlFor="educmaster-college-url"
                  className="block text-sm font-medium text-slate-700 dark:text-slate-300"
                >
                  Lien EducMaster Collège de l’école
                </label>
                <div className="flex items-stretch gap-2">
                  <input
                    id="educmaster-college-url"
                    type="url"
                    value={collegeUrl}
                    onChange={e => {
                      setCollegeUrl(e.target.value);
                      if (collegeError) setCollegeError(null);
                    }}
                    placeholder="https://educmaster.bj/secondaire/mon-college..."
                    className="flex-1 min-w-0 px-3.5 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
                  />
                  <button
                    type="button"
                    onClick={() => handlePasteFromClipboard('COLLEGE')}
                    className="px-3.5 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-medium flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
                    title="Coller le lien depuis le presse-papiers"
                  >
                    <ClipboardPaste className="h-4 w-4" />
                    <span>Coller</span>
                  </button>
                </div>
                {collegeError && (
                  <p className="text-xs text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
                    <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                    <span>{collegeError}</span>
                  </p>
                )}
              </div>

              {/* Optional School Metadata for Collège */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label
                    htmlFor="educmaster-college-code"
                    className="block text-xs font-medium text-slate-600 dark:text-slate-400"
                  >
                    Code établissement (optionnel)
                  </label>
                  <input
                    id="educmaster-college-code"
                    type="text"
                    value={collegeCode}
                    onChange={e => setCollegeCode(e.target.value)}
                    placeholder="Ex: EM-COL-108"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-sm font-mono uppercase focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
                <div className="space-y-1.5">
                  <label
                    htmlFor="educmaster-college-email"
                    className="block text-xs font-medium text-slate-600 dark:text-slate-400"
                  >
                    Identifiant / Email du compte (mémo)
                  </label>
                  <input
                    id="educmaster-college-email"
                    type="text"
                    value={collegeEmail}
                    onChange={e => setCollegeEmail(e.target.value)}
                    placeholder="censeur.college@ecole.bj"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="educmaster-college-notes"
                  className="block text-xs font-medium text-slate-600 dark:text-slate-400"
                >
                  Consignes ou échéances de dépôt (optionnel)
                </label>
                <input
                  id="educmaster-college-notes"
                  type="text"
                  value={collegeNotes}
                  onChange={e => setCollegeNotes(e.target.value)}
                  placeholder="Ex: Transmettre les moyennes trimestrielles et listes 6e à 3e"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              {/* Live Cycle Figures */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 grid grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Classes</p>
                  <p className="text-lg font-semibold text-slate-900 dark:text-white tabular-nums">
                    {collegeClasses.length}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Élèves inscrits</p>
                  <p className="text-lg font-semibold text-slate-900 dark:text-white tabular-nums">
                    {collegeStudents.length}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Notes T{settings.currentTrimester}</p>
                  <p className="text-lg font-semibold text-slate-900 dark:text-white tabular-nums">
                    {collegeGradesCount}
                  </p>
                </div>
              </div>
            </div>

            {/* Action Bar */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2.5">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleSaveCycle('COLLEGE')}
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <Save className="h-4 w-4" />
                  <span>Enregistrer</span>
                </button>
                {savedConfig.college.portalUrl && (
                  <button
                    type="button"
                    onClick={() => handleCopyText(savedConfig.college.portalUrl, 'college')}
                    className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-sm font-medium flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    {copiedKey === 'college' ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
                    <span>{copiedKey === 'college' ? 'Copié' : 'Copier'}</span>
                  </button>
                )}
              </div>

              {savedConfig.college.portalUrl ? (
                <a
                  href={savedConfig.college.portalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 rounded-lg bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-white text-white dark:text-slate-900 text-sm font-semibold flex items-center gap-2 transition-colors whitespace-nowrap shrink-0"
                >
                  <span>Ouvrir EducMaster Collège</span>
                  <ExternalLink className="h-4 w-4" />
                </a>
              ) : (
                <span className="text-xs text-slate-400 dark:text-slate-500">
                  Enregistrez un lien pour activer l’accès direct
                </span>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Section 02: Preparation & Export of Reports for EducMaster */}
      <section aria-labelledby="educmaster-export-heading" className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-slate-100 dark:border-slate-800">
          <div className="space-y-1">
            <h2 id="educmaster-export-heading" className="text-base font-semibold text-slate-900 dark:text-white">
              02. Préparer et exporter vos rapports vers EducMaster
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Générez des fichiers Excel/CSV prêts à importer sur EducMaster, puis ouvrez votre portail pour déposer le rapport.
            </p>
          </div>

          {/* Interactive Cycle Segmented Control */}
          <div className="inline-flex items-center p-1 rounded-lg bg-slate-100 dark:bg-slate-800 self-start md:self-auto">
            <button
              type="button"
              onClick={() => setExportCycle('PRIMAIRE')}
              className={`px-3.5 py-1.5 rounded-md text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer ${
                exportCycle === 'PRIMAIRE'
                  ? 'bg-white dark:bg-slate-950 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Primaire ({primaryStudents.length})
            </button>
            <button
              type="button"
              onClick={() => setExportCycle('COLLEGE')}
              className={`px-3.5 py-1.5 rounded-md text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer ${
                exportCycle === 'COLLEGE'
                  ? 'bg-white dark:bg-slate-950 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Collège & Lycée ({collegeStudents.length})
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div className="space-y-1.5">
            <label htmlFor="export-class-select" className="block text-xs font-medium text-slate-600 dark:text-slate-400">
              Classe concernée
            </label>
            <select
              id="export-class-select"
              value={exportClassId}
              onChange={e => setExportClassId(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 cursor-pointer"
            >
              <option value="ALL">
                Toutes les classes du cycle ({activeExportClasses.length} classes · {exportCycle === 'PRIMAIRE' ? primaryStudents.length : collegeStudents.length} élèves)
              </option>
              {activeExportClasses.map(c => {
                const count = students.filter(s => s.classId === c.id).length;
                return (
                  <option key={c.id} value={c.id}>
                    {c.name} ({count} élève{count > 1 ? 's' : ''})
                  </option>
                );
              })}
            </select>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="export-trimester-select" className="block text-xs font-medium text-slate-600 dark:text-slate-400">
              Trimestre du rapport
            </label>
            <select
              id="export-trimester-select"
              value={exportTrimester}
              onChange={e => setExportTrimester(Number(e.target.value) as 1 | 2 | 3)}
              className="w-full px-3 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 cursor-pointer"
            >
              <option value={1}>1er Trimestre</option>
              <option value={2}>2ème Trimestre</option>
              <option value={3}>3ème Trimestre</option>
            </select>
          </div>

          <div className="flex items-center md:justify-end">
            {activeExportPortalUrl ? (
              <a
                href={activeExportPortalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full md:w-auto px-4 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold flex items-center justify-center gap-2 transition-colors whitespace-nowrap"
              >
                <Globe className="h-4 w-4" />
                <span>Déposer sur EducMaster {exportCycle === 'PRIMAIRE' ? 'Primaire' : 'Collège'}</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            ) : (
              <span className="text-xs text-amber-700 dark:text-amber-400">
                Collez et enregistrez d’abord le lien EducMaster {exportCycle === 'PRIMAIRE' ? 'Primaire' : 'Collège'} ci-dessus.
              </span>
            )}
          </div>
        </div>

        {/* Three Export Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          <div className="p-4 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/60 flex flex-col justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
                <Users className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>Liste des élèves & matricules</span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Exporte les matricules, noms, prénoms, sexe, dates de naissance, statut redoublant et contacts parents ({selectedExportStudents.length} élève{selectedExportStudents.length > 1 ? 's' : ''}).
              </p>
            </div>
            <button
              type="button"
              onClick={handleExportStudentsCsv}
              className="w-full px-3.5 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-900 dark:text-white text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Télécharger CSV Élèves</span>
            </button>
          </div>

          <div className="p-4 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/60 flex flex-col justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
                <FileSpreadsheet className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0" />
                <span>Relevé des moyennes T{exportTrimester}</span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Exporte pour chaque élève sa moyenne générale sur 20, son rang, sa mention et la décision calculée pour le trimestre {exportTrimester}.
              </p>
            </div>
            <button
              type="button"
              onClick={handleExportTrimesterGradesCsv}
              className="w-full px-3.5 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-900 dark:text-white text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Télécharger CSV Moyennes</span>
            </button>
          </div>

          <div className="p-4 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/60 flex flex-col justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
                <BarChart3 className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
                <span>Synthèse statistique par classe</span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Récapitulatif garçons/filles, nombre de matricules renseignés, moyenne de classe et taux de réussite par classe.
              </p>
            </div>
            <button
              type="button"
              onClick={handleExportSummaryCsv}
              className="w-full px-3.5 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-900 dark:text-white text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Télécharger CSV Synthèse</span>
            </button>
          </div>
        </div>
      </section>

      {/* Section 03: Additional EducMaster Links & Export Log */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Additional Custom Links (5 cols) */}
        <section
          aria-labelledby="educmaster-extra-links-heading"
          className="lg:col-span-5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 space-y-5"
        >
          <div className="space-y-1 pb-4 border-b border-slate-100 dark:border-slate-800">
            <h2 id="educmaster-extra-links-heading" className="text-base font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <Link2 className="h-4 w-4 text-slate-500" />
              <span>03. Liens complémentaires EducMaster</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Ajoutez d’autres liens utiles (annexe, Lycée, examens CEP/BEPC/BAC, statistiques départementales).
            </p>
          </div>

          <form onSubmit={handleAddCustomLink} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <input
                type="text"
                value={newLinkLabel}
                onChange={e => {
                  setNewLinkLabel(e.target.value);
                  if (customLinkError) setCustomLinkError(null);
                }}
                placeholder="Ex: Portail Examens BEPC"
                className="sm:col-span-2 px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
              <select
                value={newLinkCycle}
                onChange={e => setNewLinkCycle(e.target.value as 'PRIMAIRE' | 'COLLEGE' | 'AUTRE')}
                className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 cursor-pointer"
              >
                <option value="PRIMAIRE">Primaire</option>
                <option value="COLLEGE">Collège</option>
                <option value="AUTRE">Autre</option>
              </select>
            </div>

            <div className="flex items-stretch gap-2">
              <input
                type="url"
                value={newLinkUrl}
                onChange={e => {
                  setNewLinkUrl(e.target.value);
                  if (customLinkError) setCustomLinkError(null);
                }}
                placeholder="https://educmaster.bj/..."
                className="flex-1 min-w-0 px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
              <button
                type="button"
                onClick={() => handlePasteFromClipboard('CUSTOM')}
                className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-medium shrink-0 cursor-pointer"
                title="Coller"
              >
                <ClipboardPaste className="h-4 w-4" />
              </button>
              <button
                type="submit"
                className="px-3.5 py-2 rounded-lg bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-white text-white dark:text-slate-900 text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Ajouter</span>
              </button>
            </div>

            {customLinkError && (
              <p className="text-xs text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                <span>{customLinkError}</span>
              </p>
            )}
          </form>

          {/* Saved Custom Links List */}
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {(savedConfig.customLinks || []).length === 0 ? (
              <p className="py-4 text-xs text-slate-500 dark:text-slate-400">
                Aucun lien complémentaire enregistré pour le moment.
              </p>
            ) : (
              (savedConfig.customLinks || []).map(link => (
                <div key={link.id} className="py-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                      <span className="font-semibold text-sm text-slate-900 dark:text-white truncate">
                        {link.label}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>{link.cycle === 'PRIMAIRE' ? 'Primaire' : link.cycle === 'COLLEGE' ? 'Collège' : 'Autre'}</span>
                    </div>
                    <p className="text-xs font-mono text-slate-500 dark:text-slate-400 truncate mt-0.5">
                      {link.url}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleCopyText(link.url, link.id)}
                      className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 cursor-pointer"
                      title="Copier le lien"
                    >
                      {copiedKey === link.id ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                    </button>
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200"
                      title="Ouvrir le lien"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                    <button
                      type="button"
                      onClick={() => handleDeleteCustomLink(link.id)}
                      className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-rose-50 dark:hover:bg-rose-950/50 text-slate-500 hover:text-rose-600 cursor-pointer"
                      title="Supprimer ce lien"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        {/* Export & Transmission History Table (7 cols) */}
        <section
          aria-labelledby="educmaster-history-heading"
          className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 space-y-4"
        >
          <div className="flex items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="space-y-1">
              <h2 id="educmaster-history-heading" className="text-base font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                <History className="h-4 w-4 text-slate-500" />
                <span>04. Journal des rapports préparés pour EducMaster</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Suivi des fichiers générés depuis la plateforme pour dépôt sur EducMaster.
              </p>
            </div>

            {(savedConfig.transmissionLogs || []).length > 0 && (
              confirmClearLogs ? (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleClearLogs}
                    className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-medium cursor-pointer"
                  >
                    Confirmer
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmClearLogs(false)}
                    className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs font-medium cursor-pointer"
                  >
                    Annuler
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmClearLogs(true)}
                  className="text-xs font-medium text-slate-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 cursor-pointer whitespace-nowrap"
                >
                  Vider le journal
                </button>
              )
            )}
          </div>

          {(savedConfig.transmissionLogs || []).length === 0 ? (
            <div className="py-10 text-center space-y-2">
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Aucun rapport exporté pour EducMaster pour le moment
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                Chaque export CSV de liste d’élèves, de moyennes trimestrielles ou de synthèse des effectifs apparaîtra automatiquement ici avec la date et l’effectif.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400">
                  <tr>
                    <th className="py-2.5 pr-3 font-medium">Date</th>
                    <th className="py-2.5 px-3 font-medium">Cycle</th>
                    <th className="py-2.5 px-3 font-medium">Rapport</th>
                    <th className="py-2.5 px-3 font-medium">Périmètre</th>
                    <th className="py-2.5 pl-3 font-medium text-right">Lignes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                  {(savedConfig.transmissionLogs || []).map(log => (
                    <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-2.5 pr-3 text-slate-600 dark:text-slate-400 font-mono tabular-nums whitespace-nowrap">
                        {formatFrenchDateTime(log.exportedAt)}
                      </td>
                      <td className="py-2.5 px-3 font-medium text-slate-900 dark:text-white whitespace-nowrap">
                        {log.cycle === 'PRIMAIRE' ? 'Primaire' : 'Collège'}
                      </td>
                      <td className="py-2.5 px-3 text-slate-700 dark:text-slate-300">
                        {reportTypeLabel(log.reportType)}
                        {log.trimester ? ` · T${log.trimester}` : ''}
                      </td>
                      <td className="py-2.5 px-3 text-slate-500 dark:text-slate-400">
                        {log.className || '—'}
                      </td>
                      <td className="py-2.5 pl-3 text-right font-mono tabular-nums font-medium text-slate-900 dark:text-white">
                        {log.recordCount}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};
