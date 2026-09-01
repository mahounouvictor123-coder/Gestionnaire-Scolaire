import React, { useState, useEffect } from 'react';
import { useApp } from '../../lib/store';
import { Student, SchoolLevel } from '../../types';
import { StudentPhotoPicker, getDefaultAvatar } from '../StudentPhotoPicker';
import {
  X,
  UserCheck,
  Save,
  ChevronUp,
  ChevronDown,
  Trash2,
  CheckCircle2,
  Sparkles,
  CreditCard,
  FileCheck2
} from 'lucide-react';

interface EditStudentModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: Student | null;
  onOpenCard?: (student: Student) => void;
  onOpenBulletin?: (student: Student) => void;
}

export const EditStudentModal: React.FC<EditStudentModalProps> = ({
  isOpen,
  onClose,
  student,
  onOpenCard,
  onOpenBulletin
}) => {
  const { classes, updateStudent, deleteStudent } = useApp();

  const [lastName, setLastName] = useState('');
  const [firstName, setFirstName] = useState('');
  const [classId, setClassId] = useState('');
  const [level, setLevel] = useState<SchoolLevel>('PRIMAIRE');
  const [gender, setGender] = useState<'M' | 'F'>('M');
  const [parentPhone, setParentPhone] = useState('');
  const [parentName, setParentName] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [placeOfBirth, setPlaceOfBirth] = useState('');
  const [parentEmail, setParentEmail] = useState('');
  const [address, setAddress] = useState('');
  const [bloodGroup, setBloodGroup] = useState('O+');
  const [photoUrl, setPhotoUrl] = useState('');
  const [status, setStatus] = useState<'ACTIF' | 'TRANSFERE' | 'ABANDON' | 'EXCLU'>('ACTIF');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (student) {
      setLastName(student.lastName);
      setFirstName(student.firstName);
      setClassId(student.classId);
      setLevel(student.level);
      setGender(student.gender);
      setParentPhone(student.parentPhone);
      setParentName(student.parentName);
      setDateOfBirth(student.dateOfBirth);
      setPlaceOfBirth(student.placeOfBirth);
      setParentEmail(student.parentEmail || '');
      setAddress(student.address || '');
      setBloodGroup(student.bloodGroup || 'O+');
      setPhotoUrl(student.photoUrl || getDefaultAvatar(student.gender));
      setStatus(student.status || 'ACTIF');
    }
  }, [student]);

  if (!isOpen || !student) return null;

  const currentClassObj = classes.find(c => c.id === classId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!lastName.trim() || !firstName.trim() || !parentPhone.trim()) {
      alert("Veuillez renseigner le nom, prénom et numéro du parent.");
      return;
    }

    const updatedData: Partial<Student> = {
      lastName: lastName.trim().toUpperCase(),
      firstName: firstName.trim(),
      classId,
      level: currentClassObj?.level || level,
      gender,
      parentPhone: parentPhone.trim(),
      parentName: parentName.trim() || `M./Mme ${lastName.toUpperCase()}`,
      dateOfBirth,
      placeOfBirth: placeOfBirth || 'Cotonou',
      parentEmail: parentEmail.trim(),
      address: address.trim() || 'Résidence Principale',
      bloodGroup,
      photoUrl: photoUrl || getDefaultAvatar(gender),
      status
    };

    updateStudent(student.id, updatedData);
    setSuccessMessage("✅ Dossier et photo de l'élève mis à jour avec succès !");
    setTimeout(() => {
      setSuccessMessage(null);
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-md overflow-y-auto animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-2xl overflow-hidden my-auto flex flex-col max-h-[94vh]">
        
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white flex items-center justify-between border-b border-indigo-700/50 shrink-0">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-2xl bg-white/10 text-amber-300 border border-white/20">
              <UserCheck className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-black text-base sm:text-lg">
                Modifier le Dossier & la Photo de l'Élève
              </h3>
              <p className="text-xs text-blue-200">
                Matricule : <span className="font-mono font-bold text-amber-300">{student.registrationNumber}</span> • {student.lastName} {student.firstName}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Success Alert */}
        {successMessage && (
          <div className="p-3 bg-emerald-100 dark:bg-emerald-950/60 border-b border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 text-xs font-bold flex items-center space-x-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-5">
          
          {/* PHOTO MANAGEMENT COMPONENT */}
          <div className="space-y-2">
            <label className="block text-xs font-black uppercase text-slate-700 dark:text-slate-300">
              1. Photo d'Identité de l'Élève (Prendre ou Importer)
            </label>
            <StudentPhotoPicker
              photoUrl={photoUrl}
              onChange={(newUrl) => setPhotoUrl(newUrl)}
              gender={gender}
              studentName={`${firstName} ${lastName}`}
            />
          </div>

          {/* ACADEMIC & IDENTITY FIELDS */}
          <div className="space-y-3 pt-2 border-t border-slate-200 dark:border-slate-800">
            <label className="block text-xs font-black uppercase text-slate-700 dark:text-slate-300">
              2. Informations Civiles & Affectation
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {/* Nom */}
              <div>
                <label className="block text-[11px] font-black uppercase text-slate-600 dark:text-slate-400 mb-1">
                  Nom de Famille (Majuscules) *
                </label>
                <input
                  type="text"
                  required
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value.toUpperCase())}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-black text-xs uppercase"
                />
              </div>

              {/* Prénom */}
              <div>
                <label className="block text-[11px] font-black uppercase text-slate-600 dark:text-slate-400 mb-1">
                  Prénom(s) *
                </label>
                <input
                  type="text"
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-extrabold text-xs"
                />
              </div>

              {/* Classe */}
              <div>
                <label className="block text-[11px] font-black uppercase text-slate-600 dark:text-slate-400 mb-1">
                  Classe d'Affectation *
                </label>
                <select
                  value={classId}
                  onChange={(e) => {
                    setClassId(e.target.value);
                    const selected = classes.find(c => c.id === e.target.value);
                    if (selected) setLevel(selected.level);
                  }}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-black text-xs cursor-pointer"
                >
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.level})
                    </option>
                  ))}
                </select>
              </div>

              {/* Sexe */}
              <div>
                <label className="block text-[11px] font-black uppercase text-slate-600 dark:text-slate-400 mb-1">
                  Sexe (Genre) *
                </label>
                <select
                  value={gender}
                  onChange={(e) => {
                    const newGender = e.target.value as 'M' | 'F';
                    setGender(newGender);
                  }}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold text-xs cursor-pointer"
                >
                  <option value="M">Masculin (Garçon)</option>
                  <option value="F">Féminin (Fille)</option>
                </select>
              </div>

              {/* Téléphone Parent */}
              <div>
                <label className="block text-[11px] font-black uppercase text-slate-600 dark:text-slate-400 mb-1">
                  Téléphone Parent / Tuteur *
                </label>
                <input
                  type="tel"
                  required
                  value={parentPhone}
                  onChange={(e) => setParentPhone(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-black text-xs text-emerald-600"
                />
              </div>

              {/* Statut Élève */}
              <div>
                <label className="block text-[11px] font-black uppercase text-slate-600 dark:text-slate-400 mb-1">
                  Statut de l'Élève *
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold text-xs cursor-pointer"
                >
                  <option value="ACTIF">ACTIF (Inscrit régulier)</option>
                  <option value="TRANSFERE">TRANSFERÉ</option>
                  <option value="ABANDON">ABANDON</option>
                  <option value="EXCLU">EXCLU</option>
                </select>
              </div>
            </div>
          </div>

          {/* ADVANCED ACCORDION */}
          <div className="pt-1">
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="text-xs font-bold text-slate-500 hover:text-slate-700 dark:text-slate-400 flex items-center space-x-1 cursor-pointer"
            >
              <span>⚙️ Autres détails (Date & Lieu de naissance, Email, Groupe sanguin...)</span>
              {showAdvanced ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            </button>

            {showAdvanced && (
              <div className="mt-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs animate-in fade-in">
                <div>
                  <label className="block font-bold text-slate-600 dark:text-slate-400 mb-1">Nom du Parent/Tuteur</label>
                  <input
                    type="text"
                    value={parentName}
                    onChange={(e) => setParentName(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-600 dark:text-slate-400 mb-1">Date de Naissance</label>
                  <input
                    type="date"
                    value={dateOfBirth}
                    onChange={(e) => setDateOfBirth(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-600 dark:text-slate-400 mb-1">Lieu de Naissance</label>
                  <input
                    type="text"
                    value={placeOfBirth}
                    onChange={(e) => setPlaceOfBirth(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-600 dark:text-slate-400 mb-1">Groupe Sanguin</label>
                  <select
                    value={bloodGroup}
                    onChange={(e) => setBloodGroup(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-bold"
                  >
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-600 dark:text-slate-400 mb-1">Email du Parent</label>
                  <input
                    type="email"
                    value={parentEmail}
                    onChange={(e) => setParentEmail(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-600 dark:text-slate-400 mb-1">Adresse de Résidence</label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Quick Doc Actions */}
          <div className="p-3 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800 flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs font-bold text-indigo-900 dark:text-indigo-300">
              Documents officiels avec la photo :
            </span>
            <div className="flex items-center space-x-2">
              {onOpenCard && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenCard(student);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center space-x-1.5 cursor-pointer shadow-sm"
                >
                  <CreditCard className="h-3.5 w-3.5" />
                  <span>Imprimer Carte Scolaire</span>
                </button>
              )}
              {onOpenBulletin && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenBulletin(student);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center space-x-1.5 cursor-pointer shadow-sm"
                >
                  <FileCheck2 className="h-3.5 w-3.5" />
                  <span>Voir Bulletin</span>
                </button>
              )}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <button
              type="button"
              onClick={() => {
                if (confirm(`Supprimer définitivement l'élève ${student.firstName} ${student.lastName} ?`)) {
                  deleteStudent(student.id);
                  onClose();
                }
              }}
              className="px-3.5 py-2 rounded-xl text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs font-bold flex items-center space-x-1 cursor-pointer transition-colors"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Supprimer l'élève</span>
            </button>

            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-bold text-xs cursor-pointer"
              >
                Fermer
              </button>

              <button
                type="submit"
                className="px-6 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-xs uppercase tracking-wider shadow-md flex items-center space-x-1.5 cursor-pointer transition-all transform hover:scale-[1.01]"
              >
                <Save className="h-4 w-4" />
                <span>Enregistrer Modifications</span>
              </button>
            </div>
          </div>

        </form>
      </div>
    </div>
  );
};
