import React, { useState } from 'react';
import {
  Sparkles,
  Bot,
  Send,
  Loader2,
  CheckCircle2,
  AlertCircle,
  GraduationCap,
  CreditCard,
  ShieldCheck,
  Brain,
  MessageSquare,
  ArrowRight,
  UserCheck,
  Search,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  PhoneCall,
  Check
} from 'lucide-react';
import { useApp } from '../lib/store';
import { findStudentByQuery, buildStudentDossier, StudentDossierResult } from '../lib/studentDossierHelper';

interface HomeAIAssistantWidgetProps {
  onNavigate: (view: string) => void;
  onOpenFullAiModal?: () => void;
}

export const HomeAIAssistantWidget: React.FC<HomeAIAssistantWidgetProps> = ({
  onNavigate,
  onOpenFullAiModal
}) => {
  const {
    students,
    classes,
    subjects,
    grades,
    payments,
    attendance,
    teachers,
    settings,
    currentSchool,
    updateSettings,
    updateSchool
  } = useApp();

  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Array<{
    id: string;
    sender: 'user' | 'ai';
    text: string;
    dossier?: StudentDossierResult;
    actions?: any[];
    suggestedFollowUps?: string[];
  }>>([
    {
      id: 'welcome-1',
      sender: 'ai',
      text: `👋 **Bonjour ! Je suis l'Assistante IA d'Accueil & de Renseignement Scolaire.**\n\nPosez-moi n'importe quelle question sur vos élèves (notes, classe, scolarité, discipline), les professeurs ou la gestion de **${currentSchool?.name || settings.schoolName}**.\n\n*Essayez par exemple : « Donne moi les informations sur Marc kapkpo » ou cliquez sur une suggestion ci-dessous.*`,
      suggestedFollowUps: [
        `Donne moi les informations sur Marc kapkpo`,
        `Donne moi les informations sur Marc-Aurèle Diallo`,
        `Quel est le bilan scolaire de Yasmine Kouamé ?`,
        `Vérifier les scolarités impayées et les reçus`
      ]
    }
  ]);

  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const handleSearch = async (customPrompt?: string) => {
    const textToSearch = (customPrompt || query).trim();
    if (!textToSearch || loading) return;

    if (!customPrompt) setQuery('');
    const userMsgId = `user-${Date.now()}`;
    const aiMsgId = `ai-${Date.now()}`;

    setMessages(prev => [...prev, { id: userMsgId, sender: 'user', text: textToSearch }]);
    setLoading(true);

    // 1. Check if a student is matched locally
    const matchedStudent = findStudentByQuery(textToSearch, students);
    let localDossier: StudentDossierResult | undefined = undefined;

    if (matchedStudent) {
      localDossier = buildStudentDossier(
        matchedStudent,
        classes,
        subjects,
        grades,
        payments,
        attendance,
        settings
      );
    }

    try {
      const payload = {
        prompt: textToSearch,
        query: textToSearch,
        currentSchool: currentSchool || {
          id: 'SCH-01',
          name: settings.schoolName,
          motto: settings.schoolMotto,
          city: settings.city,
          phone: settings.phone,
          directorName: settings.directorName
        },
        students: students.map(s => {
          const sClass = classes.find(c => c.id === s.classId);
          return {
            id: s.id,
            firstName: s.firstName,
            lastName: s.lastName,
            registrationNumber: s.registrationNumber,
            gender: s.gender,
            dateOfBirth: s.dateOfBirth,
            placeOfBirth: s.placeOfBirth,
            classId: s.classId,
            className: sClass?.name || s.classId,
            level: sClass?.level || 'Secondaire',
            status: s.status,
            parentName: s.parentName,
            parentPhone: s.parentPhone,
            parentEmail: s.parentEmail,
            address: s.address,
            bloodGroup: s.bloodGroup,
            medicalNotes: s.medicalNotes
          };
        }),
        teachers: teachers.map(t => ({
          id: t.id,
          name: t.name,
          phone: t.phone,
          email: t.email,
          subjectId: t.subjectId,
          subjectName: subjects.find(sb => sb.id === t.subjectId)?.name || 'Général',
          classesAssigned: t.classesAssigned
        })),
        classes: classes.map(c => ({
          id: c.id,
          name: c.name,
          level: c.level,
          tuitionFee: c.tuitionFee,
          studentCount: c.studentCount
        })),
        subjects: subjects.map(sb => ({
          id: sb.id,
          name: sb.name,
          coefficient: sb.coefficient,
          category: sb.category
        })),
        grades: grades.map(g => ({
          id: g.id,
          studentId: g.studentId,
          subjectId: g.subjectId,
          subjectName: subjects.find(sb => sb.id === g.subjectId)?.name || g.subjectId,
          mark: g.mark,
          maxMark: g.maxMark,
          coefficient: g.coefficient,
          examType: g.examType,
          trimester: g.trimester,
          date: g.date
        })),
        payments: payments.map(p => ({
          id: p.id,
          studentId: p.studentId,
          receiptNumber: p.receiptNumber,
          totalFee: p.totalFee,
          amountPaid: p.amountPaid,
          remainingBalance: p.remainingBalance,
          paymentType: p.paymentType,
          paymentMethod: p.paymentMethod,
          date: p.date,
          notes: p.notes
        })),
        attendance: attendance.map(a => ({
          id: a.id,
          entityId: a.entityId,
          studentId: a.entityId,
          status: a.status,
          minutesLate: a.minutesLate,
          reason: a.reason,
          date: a.date
        })),
        settings: {
          schoolName: settings.schoolName,
          schoolMotto: settings.schoolMotto,
          city: settings.city,
          phone: settings.phone,
          academicYear: settings.academicYear,
          currentTrimester: settings.currentTrimester,
          currency: settings.currency
        }
      };

      const res = await fetch('/api/ai/platform-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      let responseText = data.message;
      if (!responseText && localDossier) {
        responseText = localDossier.markdownOutput;
      }

      const followUps = data.suggestedFollowUps && data.suggestedFollowUps.length > 0
        ? data.suggestedFollowUps
        : localDossier
          ? [
              `Envoyer le bulletin de ${localDossier.student.firstName} sur WhatsApp`,
              `Consulter l'historique financier de ${localDossier.student.lastName}`,
              `Voir les autres élèves de la classe ${localDossier.schoolClass?.name || ''}`
            ]
          : [
              `Donne moi les informations sur Marc kapkpo`,
              `Faire le point de la trésorerie scolaire`,
              `Afficher la liste des professeurs`
            ];

      setMessages(prev => [
        ...prev,
        {
          id: aiMsgId,
          sender: 'ai',
          text: responseText || "Voici les informations complètes demandées :",
          dossier: localDossier,
          actions: data.actions,
          suggestedFollowUps: followUps
        }
      ]);
    } catch (err) {
      console.warn("AI Assistant Online Error, using local robust evaluator:", err);
      let responseText = localDossier
        ? localDossier.markdownOutput
        : `J'ai recherché dans la base de données de **${settings.schoolName}** :\n\n• ${students.length} élèves inscrits\n• ${classes.length} classes\n• ${teachers.length} professeurs\n\nPrécisez le nom d'un élève (ex: *Marc Kpakpo*, *Diallo*, *Kouame*) pour afficher son dossier complet.`;

      setMessages(prev => [
        ...prev,
        {
          id: aiMsgId,
          sender: 'ai',
          text: responseText,
          dossier: localDossier,
          suggestedFollowUps: [
            `Donne moi les informations sur Marc kapkpo`,
            `Notes de Marc-Aurèle Diallo`,
            `Situation de Yasmine Kouamé`
          ]
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleOpenWhatsApp = (phone: string, studentName: string, text: string) => {
    const cleanPhone = phone.replace(/[^0-9+]/g, '');
    const encoded = encodeURIComponent(`*POINT SCOLAIRE OFFICIEL - ${settings.schoolName}*\n\nBonjour cher parent d'élève de *${studentName}*,\n\nVoici le point de situation scolaire :\n\n${text.slice(0, 700)}...\n\n_Direction Pédagogique_`);
    window.open(`https://wa.me/${cleanPhone.replace('+', '')}?text=${encoded}`, '_blank');
  };

  return (
    <div className="bg-gradient-to-br from-slate-950 via-purple-950/80 to-slate-900 rounded-3xl p-6 sm:p-8 text-white border border-purple-800/60 shadow-2xl relative overflow-hidden space-y-6">
      <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Header */}
      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-purple-800/40 pb-5">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40 text-xs font-black uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
            <span>Assistante IA Renforcée d'Accueil & Renseignement Élèves</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-3">
            <span>Recherche & Analyse Instantanée des Élèves</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-300">
            Tapez directement le nom d'un élève (ex: <strong className="text-amber-300">« Donne moi les informations sur Marc kapkpo »</strong>) pour obtenir sa classe, ses notes, sa scolarité, sa discipline et son analyse globale.
          </p>
        </div>

        {onOpenFullAiModal && (
          <button
            onClick={onOpenFullAiModal}
            className="px-4 py-2.5 rounded-xl bg-purple-900/60 hover:bg-purple-800/80 border border-purple-700/60 text-purple-200 text-xs font-bold transition-all flex items-center gap-2 self-start md:self-center cursor-pointer shadow-md"
          >
            <Bot className="w-4 h-4 text-purple-400" />
            <span>Ouvrir Console Complète</span>
          </button>
        )}
      </div>

      {/* Quick Suggestions Chips */}
      <div className="relative z-10 flex flex-wrap items-center gap-2">
        <span className="text-xs font-bold text-slate-400 flex items-center gap-1.5 mr-1">
          <Brain className="w-3.5 h-3.5 text-purple-400" /> Suggestions directes :
        </span>
        <button
          onClick={() => handleSearch('Donne moi les informations sur Marc kapkpo')}
          disabled={loading}
          className="px-3 py-1.5 rounded-xl bg-purple-900/40 hover:bg-purple-800/60 border border-purple-700/50 hover:border-amber-400 text-amber-200 hover:text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
        >
          <span>🎯 Donne moi les informations sur Marc kapkpo</span>
        </button>
        <button
          onClick={() => handleSearch('Donne moi les informations sur Marc-Aurèle Diallo')}
          disabled={loading}
          className="px-3 py-1.5 rounded-xl bg-slate-900/60 hover:bg-slate-800 border border-purple-800/40 text-slate-300 hover:text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
        >
          <span>👨‍🎓 Marc-Aurèle Diallo (3ème A)</span>
        </button>
        <button
          onClick={() => handleSearch('Donne moi les informations sur Yasmine Kouamé')}
          disabled={loading}
          className="px-3 py-1.5 rounded-xl bg-slate-900/60 hover:bg-slate-800 border border-purple-800/40 text-slate-300 hover:text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
        >
          <span>👩‍🎓 Yasmine Kouamé (Tle D)</span>
        </button>
        <button
          onClick={() => handleSearch('Fais le bilan global des scolarités et des impayés de l\'école')}
          disabled={loading}
          className="px-3 py-1.5 rounded-xl bg-slate-900/60 hover:bg-slate-800 border border-purple-800/40 text-slate-300 hover:text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
        >
          <span>💰 Bilan scolarités & impayés</span>
        </button>
      </div>

      {/* Interactive Search Bar Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSearch();
        }}
        className="relative z-10 flex items-center gap-2 bg-slate-900/90 border-2 border-purple-600/50 focus-within:border-purple-400 rounded-2xl p-1.5 shadow-xl transition-all"
      >
        <div className="pl-3 text-purple-400">
          <Search className="w-5 h-5" />
        </div>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Ex: « Donne moi les informations sur Marc kapkpo », « Notes de Diallo », « Frais scolaires »..."
          disabled={loading}
          className="flex-1 bg-transparent border-none text-white placeholder:text-slate-400 text-xs sm:text-sm font-medium focus:outline-none px-2 py-2.5"
        />
        <button
          type="submit"
          disabled={!query.trim() || loading}
          className="px-6 py-3 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 disabled:opacity-50 text-white font-black text-xs sm:text-sm flex items-center gap-2 shadow-lg cursor-pointer transition-all shrink-0"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Analyse en cours...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>Rechercher</span>
            </>
          )}
        </button>
      </form>

      {/* Response Cards Log */}
      <div className="relative z-10 space-y-4 max-h-[550px] overflow-y-auto pr-1">
        {messages.map((msg, idx) => (
          <div
            key={msg.id || idx}
            className={`p-5 rounded-2xl border transition-all ${
              msg.sender === 'user'
                ? 'bg-blue-950/60 border-blue-800/60 ml-auto max-w-[85%] text-blue-100'
                : 'bg-slate-900/90 border-purple-800/50 text-slate-200 shadow-xl'
            }`}
          >
            {/* Header of message */}
            <div className="flex items-center justify-between mb-3 border-b border-purple-800/30 pb-2">
              <div className="flex items-center gap-2 text-xs font-black">
                {msg.sender === 'user' ? (
                  <span className="text-blue-300 flex items-center gap-1.5">
                    <UserCheck className="w-4 h-4" /> Votre Demande
                  </span>
                ) : (
                  <span className="text-purple-300 flex items-center gap-1.5">
                    <Bot className="w-4 h-4 text-amber-300" /> Réponse de l'Assistante IA Scolaire
                  </span>
                )}
              </div>

              {msg.sender === 'ai' && (
                <button
                  onClick={() => handleCopy(msg.text, idx)}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-[11px] font-semibold text-slate-300 hover:text-white transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  {copiedIndex === idx ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Copié !</span>
                    </>
                  ) : (
                    <span>Copier le rapport</span>
                  )}
                </button>
              )}
            </div>

            {/* Quick Dossier Key Metrics Bar if a student dossier is present */}
            {msg.dossier && (
              <div className="mb-4 grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3 rounded-xl bg-purple-950/60 border border-purple-700/40 text-xs">
                <div className="p-2 rounded-lg bg-slate-900/80 border border-slate-800">
                  <div className="text-[10px] text-slate-400 font-bold uppercase">🎓 Classe</div>
                  <div className="font-black text-white text-sm mt-0.5">
                    {msg.dossier.schoolClass?.name || msg.dossier.student.classId}
                  </div>
                  <div className="text-[10px] text-purple-300 font-medium">
                    Matricule : {msg.dossier.student.registrationNumber}
                  </div>
                </div>

                <div className="p-2 rounded-lg bg-slate-900/80 border border-slate-800">
                  <div className="text-[10px] text-slate-400 font-bold uppercase">📊 Moyenne Générale</div>
                  <div className="font-black text-emerald-400 text-sm mt-0.5">
                    {msg.dossier.generalAverage}/20
                  </div>
                  <div className="text-[10px] text-emerald-300 font-medium">
                    Statut : {msg.dossier.analysis.academicStatus}
                  </div>
                </div>

                <div className="p-2 rounded-lg bg-slate-900/80 border border-slate-800">
                  <div className="text-[10px] text-slate-400 font-bold uppercase">💰 Scolarité</div>
                  <div className={`font-black text-sm mt-0.5 ${msg.dossier.tuition.isFullyPaid ? 'text-emerald-400' : 'text-amber-400'}`}>
                    {msg.dossier.tuition.amountPaid.toLocaleString('fr-FR')} {settings.currency}
                  </div>
                  <div className="text-[10px] text-slate-300">
                    {msg.dossier.tuition.isFullyPaid ? '🟢 Soldé à 100%' : `Reste: ${msg.dossier.tuition.remainingBalance.toLocaleString('fr-FR')} ${settings.currency}`}
                  </div>
                </div>

                <div className="p-2 rounded-lg bg-slate-900/80 border border-slate-800">
                  <div className="text-[10px] text-slate-400 font-bold uppercase">⚖️ Discipline</div>
                  <div className="font-black text-white text-sm mt-0.5">
                    {msg.dossier.attendanceSummary.absentCount} abs / {msg.dossier.attendanceSummary.lateCount} ret
                  </div>
                  <div className="text-[10px] text-purple-300 font-medium">
                    {msg.dossier.analysis.behaviorStatus === 'EXEMPLAIRE' ? '🌟 Exemplaire' : '✅ Régulier'}
                  </div>
                </div>
              </div>
            )}

            {/* Markdown Text Body */}
            <div className="whitespace-pre-wrap font-sans text-xs sm:text-sm leading-relaxed space-y-2 text-slate-200">
              {msg.text}
            </div>

            {/* Direct Interactive Action Buttons for Student */}
            {msg.dossier && (
              <div className="mt-4 pt-3 border-t border-purple-800/40 flex flex-wrap items-center gap-2">
                <button
                  onClick={() => onNavigate('students')}
                  className="px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md transition-all cursor-pointer"
                >
                  <GraduationCap className="w-4 h-4" />
                  <span>Consulter la fiche dans l'Espace Élèves</span>
                </button>

                <button
                  onClick={() => onNavigate('report-cards')}
                  className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md transition-all cursor-pointer"
                >
                  <Brain className="w-4 h-4" />
                  <span>Voir le Bulletin Trimestriel</span>
                </button>

                {msg.dossier.student.parentPhone && (
                  <button
                    onClick={() => handleOpenWhatsApp(
                      msg.dossier!.student.parentPhone!,
                      `${msg.dossier!.student.firstName} ${msg.dossier!.student.lastName}`,
                      msg.text
                    )}
                    className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md transition-all cursor-pointer"
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span>Envoyer au Parent WhatsApp ({msg.dossier.student.parentPhone})</span>
                  </button>
                )}
              </div>
            )}

            {/* Suggested Follow-ups */}
            {msg.suggestedFollowUps && msg.suggestedFollowUps.length > 0 && (
              <div className="mt-4 pt-3 border-t border-purple-900/50 flex flex-wrap gap-2">
                <span className="text-[11px] font-bold text-slate-400 self-center">Questions suggérées :</span>
                {msg.suggestedFollowUps.map((sug, sIdx) => (
                  <button
                    key={sIdx}
                    onClick={() => handleSearch(sug)}
                    disabled={loading}
                    className="px-2.5 py-1 rounded-lg bg-purple-950/60 hover:bg-purple-900/80 border border-purple-800/40 text-purple-200 hover:text-white text-xs font-medium transition-all text-left cursor-pointer"
                  >
                    👉 {sug}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="p-4 rounded-2xl bg-purple-950/40 border border-purple-800/40 flex items-center gap-3 text-purple-300 font-bold text-xs">
            <Loader2 className="w-5 h-5 animate-spin text-purple-400" />
            <span>L'Assistante IA explore les notes, frais scolaires et assiduité en temps réel...</span>
          </div>
        )}
      </div>
    </div>
  );
};
