import React, { useState } from 'react';
import { useApp } from '../lib/store';
import { Teacher, SchoolClass, Subject } from '../types';
import { 
  GraduationCap, 
  UserPlus, 
  LogIn, 
  Phone, 
  BookOpen, 
  CheckCircle2, 
  Sparkles, 
  AlertCircle,
  ArrowRight,
  UserCheck,
  Building,
  Smartphone
} from 'lucide-react';

interface TeacherAuthGateProps {
  onSelectTeacher: (teacherId: string) => void;
  onReturnToPlatform?: () => void;
}

export const TeacherAuthGate: React.FC<TeacherAuthGateProps> = ({
  onSelectTeacher,
  onReturnToPlatform
}) => {
  const { currentSchool, teachers, addTeacher, subjects, addSubject, classes, settings } = useApp();

  // Mode: 'REGISTER' (s'inscrire) or 'LOGIN' (se connecter)
  const [authMode, setAuthMode] = useState<'REGISTER' | 'LOGIN'>('REGISTER');

  // Registration Form State
  const [lastName, setLastName] = useState('');
  const [firstName, setFirstName] = useState('');
  const [subjectName, setSubjectName] = useState('');
  const [customSubject, setCustomSubject] = useState('');
  const [phone, setPhone] = useState('');
  const [selectedClassIds, setSelectedClassIds] = useState<string[]>([]);
  const [cycle, setCycle] = useState<'PRIMAIRE' | 'COLLEGE' | 'LYCEE'>('COLLEGE');
  const [teacherTitle, setTeacherTitle] = useState<'PROFESSEUR' | 'MAITRE' | 'MAITRESSE'>('PROFESSEUR');
  const [regError, setRegError] = useState<string | null>(null);

  // Login Form State
  const [loginPhone, setLoginPhone] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);

  // Helper: toggle class selection
  const toggleClassId = (classId: string) => {
    setSelectedClassIds(prev => 
      prev.includes(classId) ? prev.filter(id => id !== classId) : [...prev, classId]
    );
  };

  // Submit Registration
  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setRegError(null);

    const cleanLastName = lastName.trim().toUpperCase();
    const cleanFirstName = firstName.trim();
    const finalSubject = (subjectName === 'OTHER' ? customSubject.trim() : subjectName).trim();
    const cleanPhone = phone.trim();

    if (!cleanLastName || !cleanFirstName) {
      setRegError("Veuillez renseigner votre nom et prénom.");
      return;
    }

    if (!finalSubject) {
      setRegError("Veuillez indiquer votre matière enseignée.");
      return;
    }

    if (!cleanPhone || cleanPhone.length < 6) {
      setRegError("Veuillez renseigner un numéro de téléphone valide (WhatsApp / Appel).");
      return;
    }

    // Check if phone already registered in this school
    const existing = teachers.find(t => 
      t.phone.replace(/[^0-9]/g, '').endsWith(cleanPhone.replace(/[^0-9]/g, '').slice(-8))
    );

    if (existing) {
      // Already registered! Automatically log in
      onSelectTeacher(existing.id);
      return;
    }

    // Auto-create subject if it does not exist
    const subjectExists = subjects.some(s => s.name.toLowerCase() === finalSubject.toLowerCase());
    if (!subjectExists) {
      addSubject({
        code: finalSubject.substring(0, 4).toUpperCase(),
        name: finalSubject,
        category: 'DIVERS',
        coefficient: 2
      });
    }

    // Create Teacher in centralized store
    const newTeacher = addTeacher({
      lastName: cleanLastName,
      firstName: cleanFirstName,
      photoUrl: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=150",
      email: `${cleanLastName.toLowerCase()}.${cleanFirstName.toLowerCase().replace(/[^a-z0-9]/g, '')}@${currentSchool.name.toLowerCase().replace(/[^a-z0-9]/g, '')}.educ`,
      phone: cleanPhone,
      subjects: [finalSubject],
      classIds: selectedClassIds.length > 0 ? selectedClassIds : (classes[0] ? [classes[0].id] : []),
      salary: 0,
      hireDate: new Date().toISOString().split('T')[0],
      status: 'ACTIF',
      qualification: `Professeur de ${finalSubject}`,
      specialty: cycle,
      cycle: cycle,
      teacherTitle: teacherTitle
    });

    // Successfully created and selected!
    onSelectTeacher(newTeacher.id);
  };

  // Submit Login with Phone
  const handlePhoneLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);

    const cleanInput = loginPhone.replace(/[^0-9]/g, '');
    if (!cleanInput || cleanInput.length < 6) {
      setLoginError("Veuillez saisir un numéro de téléphone valide.");
      return;
    }

    const matchedTeacher = teachers.find(t => {
      const tDigits = t.phone.replace(/[^0-9]/g, '');
      return tDigits.includes(cleanInput) || cleanInput.includes(tDigits.slice(-8));
    });

    if (matchedTeacher) {
      onSelectTeacher(matchedTeacher.id);
    } else {
      setLoginError("Aucun professeur trouvé avec ce numéro. Si vous êtes nouveau, veuillez utiliser l'onglet « S'inscrire ».");
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4 sm:p-6 font-sans">
      
      {/* Container Box */}
      <div className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden">
        
        {/* Header Banner */}
        <div className="p-6 sm:p-8 bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-900 border-b border-indigo-900/40 relative">
          <div className="flex items-center space-x-4">
            {currentSchool.logoUrl ? (
              <img 
                src={currentSchool.logoUrl} 
                alt={currentSchool.name} 
                className="w-14 h-14 rounded-2xl object-cover border-2 border-indigo-500/40 shadow-lg shrink-0"
              />
            ) : (
              <div className="w-14 h-14 rounded-2xl bg-indigo-600 flex items-center justify-center text-white font-black text-xl shadow-lg shrink-0">
                <GraduationCap className="w-8 h-8" />
              </div>
            )}

            <div>
              <div className="flex items-center space-x-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500 text-slate-950">
                  Espace Officiel
                </span>
                <span className="text-xs text-indigo-300 font-bold">Année {currentSchool.academicYear || settings.academicYear || '2025-2026'}</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-white mt-1 leading-tight uppercase">
                {currentSchool.name}
              </h1>
              <p className="text-xs text-indigo-300 mt-0.5 font-medium">
                Application Dédiée aux Enseignants & Professeurs
              </p>
            </div>
          </div>

          {/* Quick Exit / Admin Return */}
          {onReturnToPlatform && (
            <button
              onClick={onReturnToPlatform}
              className="absolute top-4 right-4 px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white text-[11px] font-bold border border-slate-700/60 transition-all cursor-pointer"
            >
              Retour Admin
            </button>
          )}
        </div>

        {/* Auth Mode Toggle Tabs */}
        <div className="p-4 bg-slate-900/60 border-b border-slate-800">
          <div className="grid grid-cols-2 gap-2 bg-slate-950 p-1.5 rounded-2xl border border-slate-800">
            <button
              type="button"
              onClick={() => { setAuthMode('REGISTER'); setRegError(null); }}
              className={`py-2.5 px-4 rounded-xl font-black text-xs sm:text-sm flex items-center justify-center space-x-2 transition-all cursor-pointer ${
                authMode === 'REGISTER'
                  ? 'bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-lg'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <UserPlus className="w-4 h-4" />
              <span>S'inscrire (Nouveau)</span>
            </button>

            <button
              type="button"
              onClick={() => { setAuthMode('LOGIN'); setLoginError(null); }}
              className={`py-2.5 px-4 rounded-xl font-black text-xs sm:text-sm flex items-center justify-center space-x-2 transition-all cursor-pointer ${
                authMode === 'LOGIN'
                  ? 'bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-lg'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <LogIn className="w-4 h-4" />
              <span>Se Connecter (Déjà Inscrit)</span>
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 sm:p-8">

          {/* TAB 1: REGISTRATION FORM */}
          {authMode === 'REGISTER' && (
            <form onSubmit={handleRegister} className="space-y-4">
              
              <div className="p-3.5 rounded-2xl bg-indigo-950/40 border border-indigo-800/40 text-xs text-indigo-200 flex items-start space-x-3">
                <Sparkles className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  Renseignez votre <strong>Nom, Prénom, Matière</strong> et <strong>Numéro de Téléphone</strong> pour vous inscrire et déposer vos épreuves et notes directement auprès de l'école.
                </p>
              </div>

              {regError && (
                <div className="p-3.5 rounded-2xl bg-red-950/60 border border-red-800 text-xs text-red-200 flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                  <span>{regError}</span>
                </div>
              )}

              {/* Civilite & Cycle */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">Titre / Civilité :</label>
                  <select
                    value={teacherTitle}
                    onChange={(e: any) => setTeacherTitle(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs font-bold focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="PROFESSEUR">M. / Mme le Professeur</option>
                    <option value="MAITRE">Maître (Primaire)</option>
                    <option value="MAITRESSE">Maîtresse (Primaire)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">Cycle d'Enseignement :</label>
                  <select
                    value={cycle}
                    onChange={(e: any) => setCycle(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs font-bold focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="COLLEGE">Collège (6ème à 3ème)</option>
                    <option value="LYCEE">Lycée (2nde à Tle)</option>
                    <option value="PRIMAIRE">Enseignement Primaire</option>
                  </select>
                </div>
              </div>

              {/* Nom & Prenom */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">
                    Nom de Famille <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: ADANHOUNME"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs font-bold uppercase placeholder:text-slate-600 focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">
                    Prénom(s) <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Jean-Baptiste"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs font-bold placeholder:text-slate-600 focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Matière Enseignée */}
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  Matière Enseignée <span className="text-red-400">*</span>
                </label>
                <div className="space-y-2">
                  <select
                    value={subjectName}
                    onChange={(e) => setSubjectName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs font-bold focus:ring-2 focus:ring-indigo-500"
                    required
                  >
                    <option value="">-- Choisir votre matière dans l'école --</option>
                    {subjects.map(s => (
                      <option key={s.id} value={s.name}>
                        {s.name} ({s.category})
                      </option>
                    ))}
                    <option value="Mathématiques">Mathématiques</option>
                    <option value="Français">Français / Lettres</option>
                    <option value="Sciences Physiques et Chimie (PCT)">Sciences Physiques et Chimie (PCT)</option>
                    <option value="Sciences de la Vie et de la Terre (SVT)">Sciences de la Vie et de la Terre (SVT)</option>
                    <option value="Anglais">Anglais</option>
                    <option value="Histoire-Géographie">Histoire-Géographie</option>
                    <option value="Philosophie">Philosophie</option>
                    <option value="Allemand">Allemand</option>
                    <option value="Espagnol">Espagnol</option>
                    <option value="Éducation Physique et Sportive (EPS)">Éducation Physique et Sportive (EPS)</option>
                    <option value="Informatique">Informatique & TIC</option>
                    <option value="OTHER">Autre matière (saisir manuellement)...</option>
                  </select>

                  {subjectName === 'OTHER' && (
                    <input
                      type="text"
                      placeholder="Nom de votre matière personnalisée..."
                      value={customSubject}
                      onChange={(e) => setCustomSubject(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-indigo-600 text-white text-xs font-bold placeholder:text-slate-600"
                      required
                    />
                  )}
                </div>
              </div>

              {/* Numéro de Téléphone */}
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  Numéro de Téléphone (WhatsApp / Appel) <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                  <input
                    type="tel"
                    required
                    placeholder="Ex: 0167430381 ou +229 97 00 11 22"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs font-bold font-mono placeholder:text-slate-600 focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Ce numéro vous permettra de vous reconnecter instantanément à tout moment.
                </p>
              </div>

              {/* Classes enseignées (optionnel mais utile) */}
              {classes.length > 0 && (
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1.5">
                    Classes où vous intervenez :
                  </label>
                  <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto p-2 rounded-xl bg-slate-950 border border-slate-800">
                    {classes.map(c => {
                      const isSelected = selectedClassIds.includes(c.id);
                      return (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => toggleClassId(c.id)}
                          className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-indigo-600 text-white shadow'
                              : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                          }`}
                        >
                          {isSelected ? '✓ ' : '+ '}
                          {c.name}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-600 hover:from-emerald-500 hover:to-indigo-500 text-white font-black text-sm shadow-xl flex items-center justify-center space-x-2 transition-all hover:scale-[1.01] cursor-pointer"
              >
                <UserCheck className="w-5 h-5" />
                <span>Enregistrer mon Inscription & Accéder</span>
              </button>

            </form>
          )}

          {/* TAB 2: LOGIN FORM (PHONE OR SELECT) */}
          {authMode === 'LOGIN' && (
            <div className="space-y-5">
              
              <form onSubmit={handlePhoneLogin} className="space-y-4">
                <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-slate-300 flex items-start space-x-3">
                  <Smartphone className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
                  <p className="leading-relaxed">
                    Saisissez le <strong>numéro de téléphone</strong> enregistré lors de votre inscription pour accéder immédiatement à votre compte professeur.
                  </p>
                </div>

                {loginError && (
                  <div className="p-3.5 rounded-2xl bg-red-950/60 border border-red-800 text-xs text-red-200 flex items-center space-x-2">
                    <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                    <span>{loginError}</span>
                  </div>
                )}

                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">
                    Numéro de Téléphone Enseignant :
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                    <input
                      type="tel"
                      required
                      placeholder="Ex: 0167430381 ou 97223344"
                      value={loginPhone}
                      onChange={(e) => setLoginPhone(e.target.value)}
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs font-bold font-mono placeholder:text-slate-600 focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-black text-sm shadow-xl flex items-center justify-center space-x-2 transition-all cursor-pointer"
                >
                  <LogIn className="w-5 h-5" />
                  <span>Se Connecter à mon Espace</span>
                </button>
              </form>

              {/* Quick Select from existing registered teachers in school */}
              {teachers.length > 0 && (
                <div className="pt-4 border-t border-slate-800 space-y-2">
                  <span className="text-[11px] font-black uppercase text-slate-400 tracking-wider block">
                    Ou choisissez votre nom dans la liste ({teachers.length} enseignants) :
                  </span>
                  
                  <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                    {teachers.map(t => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => onSelectTeacher(t.id)}
                        className="w-full p-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-indigo-600/50 flex items-center justify-between text-left transition-all group cursor-pointer"
                      >
                        <div className="truncate">
                          <span className="font-extrabold text-xs text-white group-hover:text-indigo-300 block truncate">
                            {t.lastName.toUpperCase()} {t.firstName}
                          </span>
                          <span className="text-[10px] text-slate-400 flex items-center space-x-2">
                            <span>{t.subjects[0] || 'Enseignant'}</span>
                            {t.phone && <span>• 📞 {t.phone}</span>}
                          </span>
                        </div>
                        <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-indigo-400 group-hover:translate-x-1 transition-transform shrink-0" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

            </div>
          )}

        </div>

      </div>
    </div>
  );
};
