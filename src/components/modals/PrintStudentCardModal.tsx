import React, { useState, useEffect } from 'react';
import { useApp } from '../../lib/store';
import { Student, SchoolClass } from '../../types';
import { StudentPhotoPicker, getDefaultAvatar } from '../StudentPhotoPicker';
import { 
  X, 
  Printer, 
  ShieldCheck, 
  QrCode, 
  Edit3, 
  Check, 
  Sparkles, 
  Palette, 
  Eye, 
  UserCheck,
  Heart,
  FileBadge
} from 'lucide-react';

interface PrintStudentCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: Student;
  classObj?: SchoolClass;
}

export const PrintStudentCardModal: React.FC<PrintStudentCardModalProps> = ({
  isOpen,
  onClose,
  student,
  classObj
}) => {
  const { settings, updateStudent } = useApp();

  // Mode: View & Print vs Live Edit
  const [isEditing, setIsEditing] = useState(false);

  // Editable Student Fields
  const [lastName, setLastName] = useState('');
  const [firstName, setFirstName] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [placeOfBirth, setPlaceOfBirth] = useState('');
  const [gender, setGender] = useState<'M' | 'F'>('M');
  const [bloodGroup, setBloodGroup] = useState('O+');
  const [registrationNumber, setRegistrationNumber] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [medicalNotes, setMedicalNotes] = useState('');
  const [parentName, setParentName] = useState('');
  const [parentPhone, setParentPhone] = useState('');
  const [address, setAddress] = useState('');

  // Card Theme Options
  const [cardTheme, setCardTheme] = useState<'indigo' | 'emerald' | 'blue' | 'purple' | 'amber'>('indigo');
  const [showQrCode, setShowQrCode] = useState(true);
  const [showBloodGroup, setShowBloodGroup] = useState(true);
  const [activeSide, setActiveSide] = useState<'BOTH' | 'FRONT' | 'BACK'>('BOTH');
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (student) {
      setLastName(student.lastName || '');
      setFirstName(student.firstName || '');
      setDateOfBirth(student.dateOfBirth || '');
      setPlaceOfBirth(student.placeOfBirth || '');
      setGender(student.gender || 'M');
      setBloodGroup(student.bloodGroup || 'O+');
      setRegistrationNumber(student.registrationNumber || '');
      setPhotoUrl(student.photoUrl || getDefaultAvatar(student.gender));
      setMedicalNotes(student.medicalNotes || '');
      setParentName(student.parentName || '');
      setParentPhone(student.parentPhone || '');
      setAddress(student.address || '');
      setIsEditing(false);
      setSaveSuccess(false);
    }
  }, [student]);

  // Escape key handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !student) return null;

  const handleSaveStudentModifications = () => {
    if (!lastName.trim() || !firstName.trim()) {
      alert("Le nom et le prénom de l'élève sont obligatoires.");
      return;
    }

    updateStudent(student.id, {
      lastName: lastName.trim().toUpperCase(),
      firstName: firstName.trim(),
      dateOfBirth: dateOfBirth.trim(),
      placeOfBirth: placeOfBirth.trim(),
      gender,
      bloodGroup: bloodGroup.trim(),
      registrationNumber: registrationNumber.trim(),
      photoUrl: photoUrl || getDefaultAvatar(gender),
      medicalNotes: medicalNotes.trim(),
      parentName: parentName.trim(),
      parentPhone: parentPhone.trim(),
      address: address.trim()
    });

    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
      setIsEditing(false);
    }, 800);
  };

  // Card Background Themes
  const getCardThemeClasses = () => {
    switch (cardTheme) {
      case 'emerald':
        return 'from-emerald-900 via-teal-900 to-slate-900 border-emerald-400 text-white';
      case 'blue':
        return 'from-blue-950 via-sky-900 to-indigo-950 border-sky-400 text-white';
      case 'purple':
        return 'from-purple-950 via-indigo-950 to-slate-900 border-purple-400 text-white';
      case 'amber':
        return 'from-amber-950 via-yellow-950 to-slate-900 border-amber-400 text-white';
      case 'indigo':
      default:
        return 'from-blue-900 via-indigo-900 to-slate-900 border-amber-400 text-white';
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-md overflow-y-auto animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-4xl my-auto overflow-hidden flex flex-col transition-all max-h-[94vh]">
        
        {/* Header Bar */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white flex items-center justify-between print:hidden shrink-0">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-2xl bg-white/10 text-amber-300 border border-white/20">
              <FileBadge className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-black text-base sm:text-lg flex items-center space-x-2">
                <span>Carte Scolaire de l'Élève</span>
                <span className="px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 text-[10px] font-black uppercase">
                  {student.level}
                </span>
              </h3>
              <p className="text-xs text-blue-200">
                Informations de l'enfant priorisées • Impression Recto/Verso & Personnalisation
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* Toggle Edit Button */}
            <button
              type="button"
              onClick={() => setIsEditing(!isEditing)}
              className={`px-3.5 py-2 rounded-xl font-bold text-xs flex items-center space-x-1.5 transition-all cursor-pointer shadow-sm ${
                isEditing
                  ? 'bg-amber-400 text-slate-950 hover:bg-amber-300'
                  : 'bg-white/10 hover:bg-white/20 text-white border border-white/20'
              }`}
            >
              <Edit3 className="h-4 w-4" />
              <span>{isEditing ? 'Mode Aperçu Carte' : '✏️ Modifier la Carte'}</span>
            </button>

            {/* Print Button */}
            <button
              type="button"
              onClick={() => window.print()}
              className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs rounded-xl flex items-center space-x-1.5 shadow-md hover:scale-105 transition-transform cursor-pointer"
            >
              <Printer className="h-4 w-4" />
              <span>Imprimer Carte</span>
            </button>

            <button 
              type="button"
              onClick={onClose} 
              className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              title="Fermer (Échap)"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Customization Bar (Colors, Display Filters) */}
        <div className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs print:hidden shrink-0">
          
          <div className="flex items-center space-x-2">
            <span className="font-bold text-slate-500 dark:text-slate-400 flex items-center space-x-1">
              <Palette className="h-3.5 w-3.5 text-indigo-500" />
              <span>Thème de la carte :</span>
            </span>
            <div className="flex items-center space-x-1.5">
              {[
                { id: 'indigo', label: 'Indigo', bg: 'bg-indigo-700' },
                { id: 'blue', label: 'Bleu Roi', bg: 'bg-blue-800' },
                { id: 'emerald', label: 'Émeraude', bg: 'bg-emerald-700' },
                { id: 'purple', label: 'Violet', bg: 'bg-purple-800' },
                { id: 'amber', label: 'Doré', bg: 'bg-amber-700' }
              ].map(theme => (
                <button
                  key={theme.id}
                  type="button"
                  onClick={() => setCardTheme(theme.id as any)}
                  className={`w-6 h-6 rounded-full ${theme.bg} transition-all cursor-pointer ${
                    cardTheme === theme.id ? 'ring-2 ring-offset-2 ring-indigo-500 scale-110' : 'opacity-70 hover:opacity-100'
                  }`}
                  title={theme.label}
                />
              ))}
            </div>
          </div>

          <div className="flex items-center space-x-3 text-[11px] font-bold text-slate-600 dark:text-slate-300">
            <label className="flex items-center space-x-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={showBloodGroup}
                onChange={e => setShowBloodGroup(e.target.checked)}
                className="rounded text-indigo-600"
              />
              <span>Groupe Sanguin</span>
            </label>

            <label className="flex items-center space-x-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={showQrCode}
                onChange={e => setShowQrCode(e.target.checked)}
                className="rounded text-indigo-600"
              />
              <span>Code QR</span>
            </label>

            <div className="flex rounded-lg bg-slate-200 dark:bg-slate-700 p-0.5">
              <button
                type="button"
                onClick={() => setActiveSide('BOTH')}
                className={`px-2 py-1 rounded-md text-[10px] font-black ${activeSide === 'BOTH' ? 'bg-white dark:bg-slate-900 shadow-xs' : ''}`}
              >
                Recto + Verso
              </button>
              <button
                type="button"
                onClick={() => setActiveSide('FRONT')}
                className={`px-2 py-1 rounded-md text-[10px] font-black ${activeSide === 'FRONT' ? 'bg-white dark:bg-slate-900 shadow-xs' : ''}`}
              >
                Recto seul
              </button>
              <button
                type="button"
                onClick={() => setActiveSide('BACK')}
                className={`px-2 py-1 rounded-md text-[10px] font-black ${activeSide === 'BACK' ? 'bg-white dark:bg-slate-900 shadow-xs' : ''}`}
              >
                Verso seul
              </button>
            </div>
          </div>

        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-6">

          {/* ========================================================================= */}
          {/* LIVE EDIT ACCORDION / FORM */}
          {/* ========================================================================= */}
          {isEditing && (
            <div className="p-4 sm:p-5 rounded-3xl bg-amber-50/70 dark:bg-amber-950/30 border-2 border-amber-300 dark:border-amber-700/60 space-y-4 animate-in fade-in">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 text-amber-950 dark:text-amber-200">
                  <Sparkles className="h-5 w-5 text-amber-600" />
                  <h4 className="font-black text-sm">Modification Directe des Informations de la Carte</h4>
                </div>
                {saveSuccess && (
                  <span className="px-3 py-1 rounded-full bg-emerald-600 text-white font-black text-xs flex items-center space-x-1 animate-in zoom-in">
                    <Check className="h-3.5 w-3.5" />
                    <span>Modifications enregistrées !</span>
                  </span>
                )}
              </div>

              {/* Photo Selector & Basic Info Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
                
                {/* Photo Picker */}
                <div className="p-3 bg-white dark:bg-slate-900 rounded-2xl border border-amber-200 dark:border-slate-800 flex flex-col items-center">
                  <label className="block text-[11px] font-black uppercase text-slate-700 dark:text-slate-300 mb-2">
                    Photo d'Identité
                  </label>
                  <StudentPhotoPicker
                    photoUrl={photoUrl}
                    onChange={setPhotoUrl}
                    gender={gender}
                    studentName={`${lastName} ${firstName}`}
                    compact={true}
                  />
                </div>

                {/* Main Child Details */}
                <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-black uppercase text-slate-700 dark:text-slate-300 mb-1">
                      Nom de Famille de l'Enfant *
                    </label>
                    <input
                      type="text"
                      value={lastName}
                      onChange={e => setLastName(e.target.value.toUpperCase())}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-black text-xs uppercase"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black uppercase text-slate-700 dark:text-slate-300 mb-1">
                      Prénom(s) de l'Enfant *
                    </label>
                    <input
                      type="text"
                      value={firstName}
                      onChange={e => setFirstName(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-extrabold text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black uppercase text-slate-700 dark:text-slate-300 mb-1">
                      N° Matricule Scolaire
                    </label>
                    <input
                      type="text"
                      value={registrationNumber}
                      onChange={e => setRegistrationNumber(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-amber-600 dark:text-amber-400 font-mono font-black text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black uppercase text-slate-700 dark:text-slate-300 mb-1">
                      Sexe (Genre)
                    </label>
                    <select
                      value={gender}
                      onChange={e => setGender(e.target.value as 'M' | 'F')}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold text-xs"
                    >
                      <option value="M">Masculin (Garçon)</option>
                      <option value="F">Féminin (Fille)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black uppercase text-slate-700 dark:text-slate-300 mb-1">
                      Date de Naissance
                    </label>
                    <input
                      type="date"
                      value={dateOfBirth}
                      onChange={e => setDateOfBirth(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black uppercase text-slate-700 dark:text-slate-300 mb-1">
                      Lieu de Naissance
                    </label>
                    <input
                      type="text"
                      value={placeOfBirth}
                      onChange={e => setPlaceOfBirth(e.target.value)}
                      placeholder="ex: Cotonou"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black uppercase text-slate-700 dark:text-slate-300 mb-1">
                      Groupe Sanguin
                    </label>
                    <select
                      value={bloodGroup}
                      onChange={e => setBloodGroup(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-rose-600 dark:text-rose-400 font-black text-xs"
                    >
                      <option value="O+">O+</option>
                      <option value="A+">A+</option>
                      <option value="B+">B+</option>
                      <option value="AB+">AB+</option>
                      <option value="O-">O-</option>
                      <option value="A-">A-</option>
                      <option value="B-">B-</option>
                      <option value="AB-">AB-</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black uppercase text-slate-700 dark:text-slate-300 mb-1">
                      Notes Médicales / Allergies
                    </label>
                    <input
                      type="text"
                      value={medicalNotes}
                      onChange={e => setMedicalNotes(e.target.value)}
                      placeholder="ex: RAS ou Asthme léger"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium text-xs"
                    />
                  </div>
                </div>

              </div>

              {/* Secondary Parent & Address Details */}
              <div className="p-3 bg-white/70 dark:bg-slate-900/70 rounded-2xl border border-slate-200 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-1">Parent / Tuteur (Secondaire)</label>
                  <input
                    type="text"
                    value={parentName}
                    onChange={e => setParentName(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-1">Téléphone d'Urgence Parent</label>
                  <input
                    type="tel"
                    value={parentPhone}
                    onChange={e => setParentPhone(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-emerald-600 font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-1">Adresse Domicile</label>
                  <input
                    type="text"
                    value={address}
                    onChange={e => setAddress(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Save changes button */}
              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs cursor-pointer"
                >
                  Fermer l'édition
                </button>
                <button
                  type="button"
                  onClick={handleSaveStudentModifications}
                  className="px-6 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs flex items-center space-x-1.5 shadow-md cursor-pointer"
                >
                  <Check className="h-4 w-4" />
                  <span>Enregistrer sur la Carte et le Dossier</span>
                </button>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* PRINTABLE CARD DESIGN: RECTO (FRONT) & VERSO (BACK) */}
          {/* Prioritizing CHILD details in high contrast */}
          {/* ========================================================================= */}
          <div className="flex flex-col items-center justify-center space-y-6 print:space-y-4 print:p-0">

            {/* RECTO / FRONT CARD */}
            {(activeSide === 'BOTH' || activeSide === 'FRONT') && (
              <div className="space-y-1.5 text-center">
                <span className="text-[11px] font-black uppercase text-slate-400 print:hidden tracking-wider">
                  ▲ FACE AVANT (RECTO) • Informations de l'Enfant Priorisées
                </span>

                <div className={`w-[390px] h-[245px] sm:w-[420px] sm:h-[260px] mx-auto bg-gradient-to-br ${getCardThemeClasses()} rounded-2xl shadow-2xl p-4 relative overflow-hidden border-2 flex flex-col justify-between print:shadow-none print:m-0`}>
                  
                  {/* Background Watermark Pattern */}
                  <div className="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]" />

                  {/* Top School Header */}
                  <div className="flex items-center space-x-3 border-b border-white/20 pb-2 relative z-10">
                    <img 
                      src={settings.logoUrl || '/icon.svg'} 
                      alt="Logo" 
                      className="h-11 w-11 object-cover rounded-xl ring-2 ring-white/40 shadow-sm shrink-0 bg-white" 
                    />
                    <div className="text-left flex-1 min-w-0">
                      <h3 className="font-black text-xs sm:text-sm uppercase tracking-tight leading-tight truncate text-white">
                        {settings.schoolName}
                      </h3>
                      <p className="text-[9px] text-amber-300 font-semibold truncate leading-tight">
                        {settings.motto}
                      </p>
                      <div className="flex items-center justify-between text-[8px] text-blue-200 uppercase tracking-wider font-extrabold mt-0.5">
                        <span>CARTE SCOLAIRE D'IDENTITÉ</span>
                        <span className="text-amber-300">{settings.academicYear}</span>
                      </div>
                    </div>
                  </div>

                  {/* Body: Photo & High-Priority Child Information */}
                  <div className="flex items-center space-x-3.5 my-1 relative z-10 flex-1">
                    
                    {/* Student Photo */}
                    <div className="relative shrink-0">
                      <img
                        src={photoUrl || getDefaultAvatar(gender)}
                        alt={firstName}
                        className="h-28 w-24 object-cover rounded-xl ring-2 ring-amber-400 shadow-lg bg-slate-800"
                      />
                      {showBloodGroup && (
                        <span className="absolute -bottom-1 -right-1 px-1.5 py-0.5 rounded-md bg-rose-600 text-white font-black text-[9px] shadow-sm border border-white/80">
                          {bloodGroup || 'O+'}
                        </span>
                      )}
                    </div>

                    {/* Child Details */}
                    <div className="space-y-1 text-left flex-1 min-w-0">
                      
                      {/* Name of Child (Prominent) */}
                      <div>
                        <span className="text-[8px] text-blue-200 uppercase font-black tracking-widest block leading-none">
                          Élève
                        </span>
                        <p className="font-black text-white text-sm sm:text-base tracking-tight truncate leading-tight uppercase">
                          {lastName}
                        </p>
                        <p className="font-extrabold text-amber-300 text-xs sm:text-sm truncate leading-tight">
                          {firstName}
                        </p>
                      </div>

                      {/* Class & Reg Number Grid */}
                      <div className="grid grid-cols-2 gap-1.5 pt-0.5">
                        <div className="bg-white/10 rounded-lg p-1 px-1.5 border border-white/10">
                          <span className="text-[7.5px] text-blue-200 uppercase font-bold block leading-none">Matricule</span>
                          <span className="font-mono font-black text-amber-300 text-[11px] leading-tight block truncate">
                            {registrationNumber}
                          </span>
                        </div>
                        <div className="bg-white/10 rounded-lg p-1 px-1.5 border border-white/10">
                          <span className="text-[7.5px] text-blue-200 uppercase font-bold block leading-none">Classe / Cycle</span>
                          <span className="font-black text-white text-[11px] leading-tight block truncate">
                            {classObj?.name || student.level}
                          </span>
                        </div>
                      </div>

                      {/* Birth Date & Place & Gender */}
                      <div className="text-[9.5px] text-slate-200 pt-0.5">
                        <span className="font-semibold">Né(e) le : </span>
                        <span className="font-bold text-white">{dateOfBirth || 'Non renseigné'}</span>
                        {placeOfBirth && (
                          <span className="text-slate-300"> à <strong className="text-white">{placeOfBirth}</strong></span>
                        )}
                        <span className="ml-1.5 px-1 py-0.2 rounded bg-white/20 font-black text-[9px]">
                          {gender === 'F' ? 'Fille (F)' : 'Garçon (M)'}
                        </span>
                      </div>

                    </div>
                  </div>

                  {/* Bottom Verification Seal */}
                  <div className="flex items-center justify-between border-t border-white/20 pt-1 text-[8px] text-blue-200 relative z-10">
                    <span className="flex items-center space-x-1 font-bold text-emerald-300">
                      <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
                      <span>Document Scolaire Officiel</span>
                    </span>
                    <span className="font-mono font-bold text-amber-300">
                      Année Scolaire {settings.academicYear}
                    </span>
                  </div>

                </div>
              </div>
            )}

            {/* VERSO / BACK CARD */}
            {(activeSide === 'BOTH' || activeSide === 'BACK') && (
              <div className="space-y-1.5 text-center">
                <span className="text-[11px] font-black uppercase text-slate-400 print:hidden tracking-wider">
                  ▼ FACE ARRIÈRE (VERSO) • Sécurité, Secours & Contact Parent
                </span>

                <div className="w-[390px] h-[245px] sm:w-[420px] sm:h-[260px] mx-auto bg-white rounded-2xl shadow-xl p-4 text-slate-900 relative overflow-hidden border-2 border-slate-300 flex flex-col justify-between print:shadow-none print:m-0 text-left">
                  
                  {/* Top Safety Banner */}
                  <div className="border-b border-slate-200 pb-1.5 flex items-center justify-between">
                    <p className="text-[9px] font-black text-indigo-900 uppercase tracking-wider flex items-center space-x-1">
                      <ShieldCheck className="h-3.5 w-3.5 text-indigo-600" />
                      <span>Règles d'Usage & Contacts d'Urgence</span>
                    </p>
                    <span className="text-[8px] font-bold text-slate-400">
                      Carte strictement personnelle
                    </span>
                  </div>

                  {/* Child Medical Notes & Parent Emergency Block */}
                  <div className="text-[10px] space-y-2 text-slate-700 flex-1 my-2">
                    
                    {/* Parent & Emergency Contacts */}
                    <div className="p-2 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                      <p className="text-[9px] font-black uppercase text-slate-500">Contact des Parents / Tuteur légal</p>
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold text-slate-900">{parentName || `Parent de ${lastName}`}</span>
                        <span className="font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 font-mono">
                          {parentPhone || 'Non renseigné'}
                        </span>
                      </div>
                      {address && (
                        <p className="text-[9px] text-slate-500 truncate">
                          <span className="font-bold">Adresse Domicile :</span> {address}
                        </p>
                      )}
                    </div>

                    {/* Medical / Health info if available */}
                    {medicalNotes && (
                      <div className="p-1.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-900 text-[9px] flex items-center space-x-1.5">
                        <Heart className="h-3.5 w-3.5 text-rose-500 shrink-0" />
                        <span><strong>Médical :</strong> {medicalNotes}</span>
                      </div>
                    )}

                    <p className="text-[8.5px] text-slate-500 leading-tight">
                      Cette carte atteste de l'inscription régulière de l'élève à l'établissement. En cas de perte, merci de la rapporter à la direction : <strong>{settings.phone}</strong>.
                    </p>

                  </div>

                  {/* Footer Seal & Signature */}
                  <div className="flex items-center justify-between pt-1.5 border-t border-slate-200">
                    {showQrCode ? (
                      <div className="flex items-center space-x-2">
                        <QrCode className="h-11 w-11 text-slate-900 shrink-0" />
                        <div className="text-[7.5px] text-slate-500 leading-tight">
                          <p className="font-bold text-slate-800">Scan de Contrôle</p>
                          <p>Portail & Évaluations</p>
                        </div>
                      </div>
                    ) : <div />}

                    <div className="text-right">
                      <p className="text-[8px] font-black text-slate-600 uppercase">Le Directeur de l'Établissement</p>
                      {settings.signatureUrl ? (
                        <img src={settings.signatureUrl} alt="Signature" className="h-8 object-contain ml-auto" />
                      ) : (
                        <div className="h-8 flex items-center justify-end">
                          <span className="text-[9px] font-serif italic font-bold text-slate-700">Cachet & Signature</span>
                        </div>
                      )}
                    </div>
                  </div>

                </div>
              </div>
            )}

          </div>

        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between print:hidden shrink-0">
          <div className="text-xs text-slate-500 dark:text-slate-400">
            Astuce : Cliquez sur <strong>✏️ Modifier la Carte</strong> pour changer la photo, corriger le nom ou le matricule instantanément.
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 text-slate-800 dark:text-white font-bold text-xs cursor-pointer"
          >
            Fermer
          </button>
        </div>

      </div>
    </div>
  );
};
