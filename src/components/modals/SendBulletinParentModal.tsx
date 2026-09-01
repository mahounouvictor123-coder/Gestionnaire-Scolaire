import React, { useState, useEffect } from 'react';
import { useApp } from '../../lib/store';
import { Student, SchoolClass } from '../../types';
import {
  X,
  Send,
  MessageCircle,
  Smartphone,
  Copy,
  CheckCircle2,
  ExternalLink,
  Sparkles,
  Award,
  BookOpen,
  Share2,
  Users,
  ShieldCheck,
  PhoneCall,
  Check
} from 'lucide-react';
import {
  buildStudentBulletinAccessUrl,
  formatWhatsAppBulletinMessage,
  formatSmsBulletinMessage
} from '../../lib/urlUtils';

interface SendBulletinParentModalProps {
  isOpen: boolean;
  onClose: () => void;
  student?: Student;
  classObj?: SchoolClass;
  trimester?: 1 | 2 | 3;
  studentAverage?: number;
  studentRank?: string | number;
  totalStudentsInClass?: number;
  studentMention?: string;
  studentAppreciation?: string;
}

export const SendBulletinParentModal: React.FC<SendBulletinParentModalProps> = ({
  isOpen,
  onClose,
  student,
  classObj,
  trimester = 1,
  studentAverage = 14.5,
  studentRank = 1,
  totalStudentsInClass = 30,
  studentMention = 'BIEN',
  studentAppreciation = 'Très bon travail ce trimestre. Poursuivez vos efforts !'
}) => {
  const { currentSchool, settings, addCommunication, students, classes } = useApp();

  const [mode, setMode] = useState<'SINGLE' | 'BULK_CLASS'>('SINGLE');
  const [selectedTrimester, setSelectedTrimester] = useState<1 | 2 | 3>(trimester);
  const [channel, setChannel] = useState<'WHATSAPP' | 'SMS'>('WHATSAPP');
  const [parentPhone, setParentPhone] = useState<string>('');
  const [countryCode, setCountryCode] = useState<string>('+229');
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedMessage, setCopiedMessage] = useState(false);
  const [sentSuccess, setSentSuccess] = useState(false);

  // Bulk mode states
  const targetClass = classObj || (student ? classes.find(c => c.id === student.classId) : classes[0]);
  const classStudents = student && !classObj
    ? [student]
    : students.filter(s => s.classId === targetClass?.id);

  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);

  useEffect(() => {
    if (student) {
      const rawPhone = student.parentPhone || student.phone || '';
      setParentPhone(rawPhone);
    }
    setSelectedTrimester(trimester);
  }, [student, trimester]);

  useEffect(() => {
    if (classStudents.length > 0) {
      setSelectedStudentIds(classStudents.map(s => s.id));
    }
  }, [classStudents.length, targetClass?.id]);

  // Escape key handler for smooth exit
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const currentStudent = student || classStudents[0];
  const activeClassName = targetClass?.name || 'Classe';

  // Construct official public bulletin link
  const bulletinUrl = currentStudent
    ? buildStudentBulletinAccessUrl(
        currentSchool.id,
        currentStudent.id,
        selectedTrimester,
        currentStudent.registrationNumber
      )
    : '';

  // Clean phone number
  const cleanPhone = (phone: string) => {
    let clean = phone.replace(/[^0-9+]/g, '');
    if (clean.startsWith('00')) {
      clean = '+' + clean.substring(2);
    }
    if (!clean.startsWith('+')) {
      clean = countryCode + clean.replace(/^0+/, '');
    }
    return clean.replace('+', '');
  };

  const currentFormattedWhatsApp = formatWhatsAppBulletinMessage({
    schoolName: settings.schoolName || currentSchool.name,
    studentName: currentStudent ? `${currentStudent.firstName} ${currentStudent.lastName}` : 'Élève',
    className: activeClassName,
    trimester: selectedTrimester,
    academicYear: settings.academicYear || '2025-2026',
    average: studentAverage,
    rank: studentRank,
    totalStudents: totalStudentsInClass || classStudents.length,
    mention: studentMention,
    appreciation: studentAppreciation,
    bulletinUrl
  });

  const currentFormattedSms = formatSmsBulletinMessage({
    schoolName: settings.schoolName || currentSchool.name,
    studentName: currentStudent ? `${currentStudent.firstName} ${currentStudent.lastName}` : 'Élève',
    className: activeClassName,
    trimester: selectedTrimester,
    average: studentAverage,
    rank: studentRank,
    totalStudents: totalStudentsInClass || classStudents.length,
    bulletinUrl
  });

  const handleCopyLink = () => {
    navigator.clipboard.writeText(bulletinUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleCopyMessage = () => {
    const textToCopy = channel === 'WHATSAPP' ? currentFormattedWhatsApp : currentFormattedSms;
    navigator.clipboard.writeText(textToCopy);
    setCopiedMessage(true);
    setTimeout(() => setCopiedMessage(false), 2500);
  };

  const handleSendSingleWhatsApp = () => {
    const targetDigits = cleanPhone(parentPhone);
    const encodedText = encodeURIComponent(currentFormattedWhatsApp);
    const waLink = `https://api.whatsapp.com/send?phone=${targetDigits}&text=${encodedText}`;

    // Record in communications store
    if (currentStudent) {
      addCommunication({
        subject: `Bulletin ${selectedTrimester}e Trimestre - ${currentStudent.firstName} ${currentStudent.lastName}`,
        content: currentFormattedWhatsApp,
        senderName: "Direction des Études & Bulletins",
        recipientGroup: "PARENTS",
        channel: "WHATSAPP"
      });
    }

    setSentSuccess(true);
    setTimeout(() => setSentSuccess(false), 3000);

    // Open WhatsApp
    window.open(waLink, '_blank');
  };

  const handleSendSingleSms = () => {
    const targetDigits = cleanPhone(parentPhone);
    const encodedText = encodeURIComponent(currentFormattedSms);
    const smsLink = `sms:+${targetDigits}?body=${encodedText}`;

    if (currentStudent) {
      addCommunication({
        subject: `Bulletin ${selectedTrimester}e Trimestre (SMS) - ${currentStudent.firstName} ${currentStudent.lastName}`,
        content: currentFormattedSms,
        senderName: "Direction des Études & Bulletins",
        recipientGroup: "PARENTS",
        channel: "SMS"
      });
    }

    setSentSuccess(true);
    setTimeout(() => setSentSuccess(false), 3000);

    window.open(smsLink, '_blank');
  };

  const handleBulkDispatch = () => {
    const selectedList = classStudents.filter(s => selectedStudentIds.includes(s.id));
    selectedList.forEach(s => {
      const sUrl = buildStudentBulletinAccessUrl(
        currentSchool.id,
        s.id,
        selectedTrimester,
        s.registrationNumber
      );
      const msg = channel === 'WHATSAPP'
        ? formatWhatsAppBulletinMessage({
            schoolName: settings.schoolName || currentSchool.name,
            studentName: `${s.firstName} ${s.lastName}`,
            className: activeClassName,
            trimester: selectedTrimester,
            academicYear: settings.academicYear || '2025-2026',
            average: studentAverage,
            rank: studentRank,
            totalStudents: classStudents.length,
            mention: studentMention,
            bulletinUrl: sUrl
          })
        : formatSmsBulletinMessage({
            schoolName: settings.schoolName || currentSchool.name,
            studentName: `${s.firstName} ${s.lastName}`,
            className: activeClassName,
            trimester: selectedTrimester,
            average: studentAverage,
            rank: studentRank,
            totalStudents: classStudents.length,
            bulletinUrl: sUrl
          });

      addCommunication({
        subject: `Envoi Bulletin ${selectedTrimester}e Trimestre - ${s.firstName} ${s.lastName}`,
        content: msg,
        senderName: "Secrétariat & Bulletins Numériques",
        recipientGroup: "PARENTS",
        channel: channel
      });
    });

    setSentSuccess(true);
    setTimeout(() => {
      setSentSuccess(false);
      onClose();
    }, 2000);
  };

  return (
    <div 
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm overflow-y-auto backdrop-enter"
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-slate-900 rounded-2xl max-w-2xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden my-6 modal-enter"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-700 p-5 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-white/20 rounded-xl backdrop-blur-md">
              <MessageCircle className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Envoi du Bulletin aux Parents</h2>
              <p className="text-xs text-emerald-100">
                Transmettez les notes et le lien officiel du bulletin sécurisé par WhatsApp ou SMS
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tab switcher: Single vs Bulk */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 p-2 gap-2">
          <button
            type="button"
            onClick={() => setMode('SINGLE')}
            className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center space-x-2 ${
              mode === 'SINGLE'
                ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-sm border border-slate-200 dark:border-slate-700'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Smartphone className="h-4 w-4" />
            <span>Envoi Individuel ({currentStudent ? `${currentStudent.firstName} ${currentStudent.lastName}` : 'Élève'})</span>
          </button>
          <button
            type="button"
            onClick={() => setMode('BULK_CLASS')}
            className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center space-x-2 ${
              mode === 'BULK_CLASS'
                ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-sm border border-slate-200 dark:border-slate-700'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Users className="h-4 w-4" />
            <span>Envoi Groupé ({targetClass?.name || 'Toute la classe'} - {classStudents.length} élèves)</span>
          </button>
        </div>

        <div className="p-6 space-y-5">
          {sentSuccess && (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 rounded-xl flex items-center space-x-2 text-sm font-medium animate-fade-in">
              <CheckCircle2 className="h-5 w-5 flex-shrink-0" />
              <span>Opération réussie ! Le bulletin et le lien d'accès ont été transmis et enregistrés.</span>
            </div>
          )}

          {/* Controls: Channel & Trimester */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                Canal de Communication
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setChannel('WHATSAPP')}
                  className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center space-x-2 transition-all ${
                    channel === 'WHATSAPP'
                      ? 'bg-emerald-500 text-white border-emerald-500 shadow-md shadow-emerald-500/20'
                      : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <MessageCircle className="h-4 w-4" />
                  <span>WhatsApp</span>
                </button>
                <button
                  type="button"
                  onClick={() => setChannel('SMS')}
                  className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center space-x-2 transition-all ${
                    channel === 'SMS'
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-600/20'
                      : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <Smartphone className="h-4 w-4" />
                  <span>SMS Direct</span>
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                Trimestre Concerné
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {[1, 2, 3].map(t => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setSelectedTrimester(t as 1 | 2 | 3)}
                    className={`py-2 text-xs font-bold rounded-lg border transition-all ${
                      selectedTrimester === t
                        ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 border-transparent shadow'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-transparent hover:bg-slate-200'
                    }`}
                  >
                    {t}er Trimestre
                  </button>
                ))}
              </div>
            </div>
          </div>

          {mode === 'SINGLE' ? (
            <>
              {/* Single Student Info Card */}
              {currentStudent && (
                <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-4 border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex items-center space-x-3">
                    <img
                      src={currentStudent.photoUrl || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=150"}
                      alt={currentStudent.firstName}
                      className="h-12 w-12 rounded-full object-cover border-2 border-emerald-500 flex-shrink-0"
                    />
                    <div>
                      <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                        {currentStudent.firstName} {currentStudent.lastName}
                      </h3>
                      <p className="text-xs text-slate-500">
                        Classe : <span className="font-semibold text-slate-700 dark:text-slate-300">{activeClassName}</span> | Matricule : <span className="font-mono">{currentStudent.registrationNumber}</span>
                      </p>
                      <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold mt-0.5">
                        Moyenne : {typeof studentAverage === 'number' ? studentAverage.toFixed(2) : studentAverage}/20 • Rang : {studentRank}e • Mention : {studentMention}
                      </p>
                    </div>
                  </div>

                  <div className="w-full sm:w-auto">
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                      Numéro WhatsApp / Téléphone Parent
                    </label>
                    <div className="flex items-center space-x-1">
                      <select
                        value={countryCode}
                        onChange={e => setCountryCode(e.target.value)}
                        className="text-xs py-1.5 px-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg"
                      >
                        <option value="+229">🇧🇯 +229</option>
                        <option value="+225">🇨🇮 +225</option>
                        <option value="+228">🇹🇬 +228</option>
                        <option value="+221">🇸🇳 +221</option>
                        <option value="+226">🇧🇫 +226</option>
                        <option value="+227">🇳🇪 +227</option>
                        <option value="+237">🇨🇲 +237</option>
                        <option value="+242">🇨🇬 +242</option>
                        <option value="+243">🇨🇩 +243</option>
                        <option value="+33">🇫🇷 +33</option>
                      </select>
                      <input
                        type="text"
                        value={parentPhone}
                        onChange={e => setParentPhone(e.target.value)}
                        placeholder="Ex: 97 12 34 56"
                        className="text-xs py-1.5 px-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg w-32 focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Message Preview Box */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center space-x-1.5">
                    <span>Aperçu du message {channel}</span>
                    <span className="text-[10px] px-1.5 py-0.5 bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded font-normal">
                      Lien public sécurisé inclus
                    </span>
                  </span>
                  <div className="flex space-x-2">
                    <button
                      type="button"
                      onClick={handleCopyLink}
                      className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline flex items-center space-x-1 font-semibold"
                    >
                      {copiedLink ? <Check className="h-3.5 w-3.5" /> : <Share2 className="h-3.5 w-3.5" />}
                      <span>{copiedLink ? 'Lien copié !' : 'Copier Lien'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleCopyMessage}
                      className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline flex items-center space-x-1 font-semibold"
                    >
                      {copiedMessage ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                      <span>{copiedMessage ? 'Message copié !' : 'Copier Message'}</span>
                    </button>
                  </div>
                </div>

                <div className="bg-slate-100 dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800 font-mono text-xs text-slate-800 dark:text-slate-200 whitespace-pre-wrap max-h-48 overflow-y-auto leading-relaxed">
                  {channel === 'WHATSAPP' ? currentFormattedWhatsApp : currentFormattedSms}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                {channel === 'WHATSAPP' ? (
                  <button
                    type="button"
                    onClick={handleSendSingleWhatsApp}
                    className="flex-1 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-lg shadow-emerald-600/30 flex items-center justify-center space-x-2 transition-all transform active:scale-95"
                  >
                    <MessageCircle className="h-5 w-5" />
                    <span>Envoyer sur WhatsApp ({parentPhone || 'Parent'})</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleSendSingleSms}
                    className="flex-1 py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-600/30 flex items-center justify-center space-x-2 transition-all transform active:scale-95"
                  >
                    <Smartphone className="h-5 w-5" />
                    <span>Envoyer par SMS Direct ({parentPhone || 'Parent'})</span>
                  </button>
                )}
                <a
                  href={bulletinUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="py-3 px-4 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold rounded-xl flex items-center justify-center space-x-2 transition-colors"
                >
                  <ExternalLink className="h-4 w-4" />
                  <span>Tester le Lien</span>
                </a>
              </div>
            </>
          ) : (
            <>
              {/* Bulk Class Sending */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    Sélectionnez les élèves de la classe <strong className="text-slate-900 dark:text-white">{activeClassName}</strong> ({classStudents.length} élèves) à qui envoyer le bulletin :
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      if (selectedStudentIds.length === classStudents.length) {
                        setSelectedStudentIds([]);
                      } else {
                        setSelectedStudentIds(classStudents.map(s => s.id));
                      }
                    }}
                    className="text-xs text-indigo-600 dark:text-indigo-400 font-bold hover:underline"
                  >
                    {selectedStudentIds.length === classStudents.length ? 'Tout décocher' : 'Tout cocher'}
                  </button>
                </div>

                <div className="max-h-60 overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800 bg-slate-50 dark:bg-slate-950">
                  {classStudents.map((std, idx) => {
                    const isChecked = selectedStudentIds.includes(std.id);
                    const sUrl = buildStudentBulletinAccessUrl(currentSchool.id, std.id, selectedTrimester, std.registrationNumber);
                    const phone = std.parentPhone || std.phone || 'Non renseigné';

                    return (
                      <div key={std.id} className="p-2.5 flex items-center justify-between hover:bg-white dark:hover:bg-slate-900 transition-colors">
                        <label className="flex items-center space-x-3 cursor-pointer flex-1">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {
                              setSelectedStudentIds(prev =>
                                prev.includes(std.id) ? prev.filter(i => i !== std.id) : [...prev, std.id]
                              );
                            }}
                            className="rounded text-emerald-600 focus:ring-emerald-500 h-4 w-4"
                          />
                          <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                            {idx + 1}. {std.firstName} {std.lastName}
                          </span>
                          <span className="text-[11px] text-slate-500 font-mono">
                            ({phone})
                          </span>
                        </label>

                        <div className="flex items-center space-x-2">
                          <a
                            href={
                              channel === 'WHATSAPP'
                                ? `https://api.whatsapp.com/send?phone=${cleanPhone(phone)}&text=${encodeURIComponent(
                                    formatWhatsAppBulletinMessage({
                                      schoolName: settings.schoolName || currentSchool.name,
                                      studentName: `${std.firstName} ${std.lastName}`,
                                      className: activeClassName,
                                      trimester: selectedTrimester,
                                      academicYear: settings.academicYear || '2025-2026',
                                      average: studentAverage,
                                      rank: idx + 1,
                                      totalStudents: classStudents.length,
                                      bulletinUrl: sUrl
                                    })
                                  )}`
                                : `sms:+${cleanPhone(phone)}?body=${encodeURIComponent(
                                    formatSmsBulletinMessage({
                                      schoolName: settings.schoolName || currentSchool.name,
                                      studentName: `${std.firstName} ${std.lastName}`,
                                      className: activeClassName,
                                      trimester: selectedTrimester,
                                      average: studentAverage,
                                      rank: idx + 1,
                                      totalStudents: classStudents.length,
                                      bulletinUrl: sUrl
                                    })
                                  )}`
                            }
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1 px-2 text-[11px] bg-emerald-100 hover:bg-emerald-200 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 rounded font-semibold flex items-center space-x-1"
                          >
                            <Send className="h-3 w-3" />
                            <span>1-Clic</span>
                          </a>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="pt-2 flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-500">
                    {selectedStudentIds.length} élève(s) sélectionné(s)
                  </span>
                  <button
                    type="button"
                    onClick={handleBulkDispatch}
                    disabled={selectedStudentIds.length === 0}
                    className="py-2.5 px-5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs rounded-xl shadow-md disabled:opacity-50 flex items-center space-x-2"
                  >
                    <Send className="h-4 w-4" />
                    <span>Diffuser les {selectedStudentIds.length} Bulletins ({channel})</span>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
