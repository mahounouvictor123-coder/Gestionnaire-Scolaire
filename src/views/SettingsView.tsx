import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../lib/store';
import { validateSchoolPassword } from '../lib/passwordUtils';
import { SchoolLogo } from '../components/SchoolLogo';
import { StaffAccessCodeManager } from '../components/StaffAccessCodeManager';
import { StaffRoleConfig } from '../types';
import { defaultStaffRolePermissions } from '../data/initialData';
import {
  Settings,
  Save,
  Building,
  CheckCircle2,
  Upload,
  Image,
  PenTool,
  FileCheck,
  ShieldCheck,
  Building2,
  ArrowRight,
  Lock,
  KeyRound,
  Users,
  Edit2,
  Trash2,
  AlertTriangle,
  X
} from 'lucide-react';

export const SettingsView: React.FC = () => {
  const { settings, updateSettings, currentSchool, updateSchool, deleteSchool, schools, currentUser } = useApp();
  const isPromoter = currentUser?.role === 'SUPER_ADMIN';

  const [activeTab, setActiveTab] = useState<'STAFF_CODES' | 'IDENTITY'>('STAFF_CODES');

  const [schoolName, setSchoolName] = useState(currentSchool?.name || settings.schoolName);
  const [motto, setMotto] = useState(currentSchool?.motto || settings.motto);
  const [academicYear, setAcademicYear] = useState(settings.academicYear);
  const [address, setAddress] = useState(currentSchool?.address || settings.address);
  const [city, setCity] = useState(currentSchool?.city || settings.city || 'Abidjan - Cotonou - Dakar');
  const [phone, setPhone] = useState(currentSchool?.phone || settings.phone);
  const [email, setEmail] = useState(currentSchool?.email || settings.email);
  const [currency, setCurrency] = useState(settings.currency);
  const [logoUrl, setLogoUrl] = useState(currentSchool?.logoUrl || settings.logoUrl);
  const [signatureUrl, setSignatureUrl] = useState(currentSchool?.signatureUrl || settings.signatureUrl);
  const [accessPassword, setAccessPassword] = useState(settings.accessPassword || currentSchool?.accessPassword || '12345678');
  const [confirmAccessPassword, setConfirmAccessPassword] = useState(settings.accessPassword || currentSchool?.accessPassword || '12345678');

  // Deletion modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  const [staffRoles, setStaffRoles] = useState<StaffRoleConfig[]>(() => {
    return currentSchool?.staffRolePermissions || settings.staffRolePermissions || defaultStaffRolePermissions;
  });

  // Sync state whenever active school changes
  useEffect(() => {
    if (currentSchool) {
      setSchoolName(currentSchool.name);
      setMotto(currentSchool.motto);
      setAddress(currentSchool.address);
      setCity(currentSchool.city);
      setPhone(currentSchool.phone);
      setEmail(currentSchool.email);
      setLogoUrl(currentSchool.logoUrl);
      if (currentSchool.signatureUrl) setSignatureUrl(currentSchool.signatureUrl);
      if (currentSchool.accessPassword) {
        setAccessPassword(currentSchool.accessPassword);
        setConfirmAccessPassword(currentSchool.accessPassword);
      }
      if (currentSchool.staffRolePermissions) {
        setStaffRoles(currentSchool.staffRolePermissions);
      }
    }
  }, [currentSchool?.id, currentSchool?.name]);

  const [pwdError, setPwdError] = useState('');
  const [savedSuccess, setSavedSuccess] = useState(false);

  const logoInputRef = useRef<HTMLInputElement>(null);
  const signatureInputRef = useRef<HTMLInputElement>(null);

  const handleLogoFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setLogoUrl(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSignatureFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setSignatureUrl(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setPwdError('');

    const valErr = validateSchoolPassword(accessPassword);
    if (valErr) {
      setPwdError(valErr);
      setActiveTab('IDENTITY');
      return;
    }

    if (accessPassword.trim() !== confirmAccessPassword.trim()) {
      setPwdError('La confirmation du mot de passe ne correspond pas au mot de passe saisi.');
      setActiveTab('IDENTITY');
      return;
    }

    const trimmedName = schoolName.trim();
    if (!trimmedName) {
      alert('Veuillez saisir un nom d\'établissement valide.');
      return;
    }

    updateSettings({
      schoolName: trimmedName,
      motto,
      academicYear,
      address,
      city,
      phone,
      email,
      currency,
      logoUrl,
      signatureUrl,
      accessPassword: accessPassword.trim(),
      staffRolePermissions: staffRoles
    });

    updateSchool(currentSchool.id, {
      name: trimmedName,
      motto,
      academicYear,
      address,
      city,
      phone,
      email,
      currency,
      logoUrl,
      signatureUrl,
      accessPassword: accessPassword.trim(),
      staffRolePermissions: staffRoles
    });

    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 5000);
  };

  const handleDeleteSchool = () => {
    if (schools.length <= 1) {
      alert('Impossible de supprimer le seul établissement actif du système. Veuillez d\'abord ajouter une autre école.');
      return;
    }

    if (deleteConfirmText.trim().toLowerCase() !== currentSchool.name.trim().toLowerCase()) {
      alert('Le nom saisi ne correspond pas exactement au nom de l\'école à supprimer.');
      return;
    }

    deleteSchool(currentSchool.id);
    setShowDeleteModal(false);
    setDeleteConfirmText('');
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center space-x-2">
            <Building className="h-6 w-6 text-blue-600" />
            <span>Paramètres & Administration de l'Établissement</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Configurez l'identité de l'école (nom, logo, signature) et gérez les codes d'accès de votre équipe.
          </p>
        </div>

        {savedSuccess && (
          <span className="p-2.5 px-4 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 font-extrabold text-xs flex items-center space-x-2 animate-in zoom-in-95">
            <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
            <span>Nom de l'école et paramètres enregistrés avec succès !</span>
          </span>
        )}
      </div>

      {/* Tabs Selector */}
      <div className="flex flex-wrap items-center gap-2 p-1.5 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 max-w-xl">
        <button
          type="button"
          onClick={() => setActiveTab('STAFF_CODES')}
          className={`flex-1 min-w-[200px] py-2.5 px-4 rounded-xl font-extrabold text-xs flex items-center justify-center space-x-2 transition-all cursor-pointer ${
            activeTab === 'STAFF_CODES'
              ? 'bg-blue-600 text-white shadow-md'
              : 'text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <KeyRound className="h-4 w-4" />
          <span>Codes d'Accès Équipe & Rôles</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('IDENTITY')}
          className={`flex-1 min-w-[200px] py-2.5 px-4 rounded-xl font-extrabold text-xs flex items-center justify-center space-x-2 transition-all cursor-pointer ${
            activeTab === 'IDENTITY'
              ? 'bg-blue-600 text-white shadow-md'
              : 'text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Building2 className="h-4 w-4" />
          <span>Nom de l'École, Logo & Fiche</span>
        </button>
      </div>

      {/* TAB 1: Staff Roles & Access Code Manager */}
      {activeTab === 'STAFF_CODES' && (
        <StaffAccessCodeManager
          staffRoles={staffRoles}
          onChangeStaffRoles={setStaffRoles}
          onSave={() => handleSubmit()}
        />
      )}

      {/* TAB 2: School Identity, Logo, Signature & General Info */}
      {activeTab === 'IDENTITY' && (
        <>
          {/* Identity Showcase Card */}
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
            <SchoolLogo variant="full" />
            <div className="space-y-2 text-xs text-slate-600 dark:text-slate-300 max-w-md">
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">Authentification des Documents Scolaires</h3>
              <p>
                Le nom <strong className="text-slate-900 dark:text-white">« {currentSchool?.name || settings.schoolName} »</strong>, le logo et la signature scannée ci-dessous sont apposés automatiquement sur tous les <strong className="text-slate-900 dark:text-white">reçus de paiement</strong>, <strong className="text-slate-900 dark:text-white">bulletins trimestriels</strong>, <strong className="text-slate-900 dark:text-white">certificats de scolarité</strong> et <strong className="text-slate-900 dark:text-white">cartes d'identité scolaires</strong>.
              </p>
            </div>
          </div>

          {/* Quick Customization Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Logo Upload Box */}
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex items-center space-x-2">
                <Image className="h-5 w-5 text-blue-600" />
                <h3 className="font-extrabold text-slate-900 dark:text-white text-sm">Logo Officiel de l'Établissement</h3>
              </div>

              <div className="flex items-center space-x-4">
                <div className="w-20 h-20 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-center overflow-hidden shrink-0">
                  {logoUrl ? (
                    <img src={logoUrl} alt="Logo" className="w-full h-full object-contain p-1" />
                  ) : (
                    <span className="text-[10px] text-slate-400 font-bold">Sans Logo</span>
                  )}
                </div>

                <div className="space-y-2 flex-1">
                  <input
                    type="file"
                    ref={logoInputRef}
                    onChange={handleLogoFileUpload}
                    accept="image/*"
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => logoInputRef.current?.click()}
                    className="w-full py-2 px-3 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-bold text-xs flex items-center justify-center space-x-1.5 border border-blue-200 dark:border-blue-800 hover:bg-blue-100 transition-colors cursor-pointer"
                  >
                    <Upload className="h-4 w-4" />
                    <span>Parcourir & Importer Logo</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 text-xs mb-1">Ou Coller l'URL de l'image du Logo</label>
                <input
                  type="text"
                  value={logoUrl}
                  onChange={e => setLogoUrl(e.target.value)}
                  className="w-full p-2.5 rounded-xl border bg-slate-50 dark:bg-slate-800 font-medium text-xs text-slate-900 dark:text-white"
                  placeholder="https://..."
                />
              </div>
            </div>

            {/* Signature Upload Box */}
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex items-center space-x-2">
                <PenTool className="h-5 w-5 text-emerald-600" />
                <h3 className="font-extrabold text-slate-900 dark:text-white text-sm">Signature Scannée du Directeur</h3>
              </div>

              <div className="flex items-center space-x-4">
                <div className="w-28 h-20 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 flex items-center justify-center overflow-hidden shrink-0">
                  {signatureUrl ? (
                    <img src={signatureUrl} alt="Signature" className="w-full h-full object-contain p-1" />
                  ) : (
                    <span className="text-[10px] text-slate-400 font-bold">Sans Signature</span>
                  )}
                </div>

                <div className="space-y-2 flex-1">
                  <input
                    type="file"
                    ref={signatureInputRef}
                    onChange={handleSignatureFileUpload}
                    accept="image/*"
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => signatureInputRef.current?.click()}
                    className="w-full py-2 px-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 font-bold text-xs flex items-center justify-center space-x-1.5 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 transition-colors cursor-pointer"
                  >
                    <Upload className="h-4 w-4" />
                    <span>Parcourir & Importer Signature</span>
                  </button>
                </div>
              </div>

              {/* Preset Signatures */}
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 space-y-2">
                <label className="block font-bold text-slate-700 dark:text-slate-300 text-[11px]">
                  Ou Choisir un Modèle de Signature Type :
                </label>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setSignatureUrl('https://images.unsplash.com/photo-1600132806370-bf17e65e942f?auto=format&fit=crop&q=80&w=200')}
                    className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-slate-800 dark:text-slate-200 font-bold text-xs hover:border-emerald-500 cursor-pointer"
                  >
                    🖋️ Modèle Encre Bleue
                  </button>
                  <button
                    type="button"
                    onClick={() => setSignatureUrl('https://images.unsplash.com/photo-1599566150163-29194dcaad36?auto=format&fit=crop&q=80&w=200')}
                    className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-slate-800 dark:text-slate-200 font-bold text-xs hover:border-emerald-500 cursor-pointer"
                  >
                    🖋️ Modèle Manuscrit
                  </button>
                  <button
                    type="button"
                    onClick={() => setSignatureUrl('https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200')}
                    className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-slate-800 dark:text-slate-200 font-bold text-xs hover:border-emerald-500 cursor-pointer"
                  >
                    🖋️ Modèle Officiel Direction
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 text-xs mb-1">Ou Coller l'URL de l'image de la Signature</label>
                <input
                  type="text"
                  value={signatureUrl}
                  onChange={e => setSignatureUrl(e.target.value)}
                  className="w-full p-2.5 rounded-xl border bg-slate-50 dark:bg-slate-800 font-medium text-xs text-slate-900 dark:text-white"
                  placeholder="https://..."
                />
              </div>
            </div>

          </div>

          {/* Main Registration Form - Includes School Name Modification */}
          <form onSubmit={handleSubmit} className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center space-x-2">
                <FileCheck className="h-4 w-4 text-blue-600" />
                <span>Modification du Nom & Fiche Officielle de l'Établissement</span>
              </h3>
              <span className="text-[11px] font-bold text-slate-400">
                ID École : {currentSchool?.id}
              </span>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Highlighted School Name Field */}
              <div className="sm:col-span-2 p-4 rounded-xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block font-black text-blue-950 dark:text-blue-200 text-xs">
                    ✏️ Nom Officiel de l'Établissement Scolaire (Modifiable) *
                  </label>
                  <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400">
                    Modifie instantanément tous les en-têtes et documents
                  </span>
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    required
                    value={schoolName}
                    onChange={e => setSchoolName(e.target.value)}
                    placeholder="Ex: GROUPE SCOLAIRE L'EXCELLENCE"
                    className="flex-1 px-4 py-3 rounded-xl bg-white dark:bg-slate-900 border border-blue-300 dark:border-blue-700 font-black text-sm text-slate-900 dark:text-white shadow-sm outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="submit"
                    className="px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs flex items-center space-x-1.5 shadow-md transition-all cursor-pointer shrink-0"
                  >
                    <Save className="h-4 w-4" />
                    <span>Sauvegarder le Nom</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Devise de l'École (Motto)</label>
                <input
                  type="text"
                  value={motto}
                  onChange={e => setMotto(e.target.value)}
                  placeholder="Ex: Travail - Discipline - Succès"
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Année Scolaire Active</label>
                <input
                  type="text"
                  value={academicYear}
                  onChange={e => setAcademicYear(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-blue-600"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Unité Monétaire (Devise)</label>
                <input
                  type="text"
                  value={currency}
                  onChange={e => setCurrency(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Adresse Géographique</label>
                <input
                  type="text"
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Ville & Pays</label>
                <input
                  type="text"
                  value={city}
                  onChange={e => setCity(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Téléphone Contact Officiel</label>
                <input
                  type="text"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Email Officiel</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>

              <div className="sm:col-span-2 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-emerald-200 dark:border-emerald-800/80 space-y-3">
                <div className="flex items-center space-x-2 text-emerald-700 dark:text-emerald-400 font-extrabold">
                  <ShieldCheck className="h-5 w-5" />
                  <span>🔐 Protection Principale du Tableau de Bord de cet Établissement (8 Caractères)</span>
                </div>
                <p className="text-slate-600 dark:text-slate-300 text-[11px]">
                  Définissez ou modifiez le mot de passe confidentiel principal à 8 caractères exigé pour déverrouiller l'accès global à cette école.
                </p>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-md">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Nouveau mot de passe (8 car.) *
                    </label>
                    <input
                      type="text"
                      maxLength={8}
                      required
                      value={accessPassword}
                      onChange={e => {
                        setAccessPassword(e.target.value);
                        if (e.target.value.length === 8 && e.target.value === confirmAccessPassword) setPwdError('');
                      }}
                      placeholder="Ex: 12345678"
                      className="w-full px-3.5 py-2 text-sm font-mono tracking-widest font-bold rounded-xl bg-white dark:bg-slate-900 border border-emerald-300 dark:border-emerald-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Confirmer le mot de passe *
                    </label>
                    <input
                      type="text"
                      maxLength={8}
                      required
                      value={confirmAccessPassword}
                      onChange={e => {
                        setConfirmAccessPassword(e.target.value);
                        if (e.target.value === accessPassword) setPwdError('');
                      }}
                      placeholder="Ex: 12345678"
                      className="w-full px-3.5 py-2 text-sm font-mono tracking-widest font-bold rounded-xl bg-white dark:bg-slate-900 border border-emerald-300 dark:border-emerald-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                {pwdError ? (
                  <p className="text-xs text-rose-600 dark:text-rose-400 font-bold mt-1">⚠️ {pwdError}</p>
                ) : (
                  <p className="text-[10px] text-slate-400 font-bold mt-1">Saisissez deux fois le même mot de passe à 8 caractères.</p>
                )}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <button
                type="submit"
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-xl text-xs flex items-center space-x-2 shadow-lg ml-auto transition-all cursor-pointer"
              >
                <Save className="h-4 w-4" />
                <span>Enregistrer Toute la Fiche Établissement</span>
              </button>
            </div>

          </form>

          {/* Danger Zone: Delete School Option */}
          <div className="p-6 rounded-2xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/60 shadow-sm space-y-3">
            <div className="flex items-center space-x-2 text-rose-700 dark:text-rose-400 font-black text-sm">
              <AlertTriangle className="h-5 w-5" />
              <span>Zone de Suppression de l'Établissement</span>
            </div>
            
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Vous pouvez supprimer définitivement cet établissement scolaire <strong className="text-slate-900 dark:text-white">« {currentSchool?.name} »</strong> ({schools.length} écoles actuellement enregistrées dans le hub).
            </p>

            <div className="pt-2 flex items-center justify-between">
              <span className="text-[11px] font-bold text-rose-600 dark:text-rose-400">
                {schools.length <= 1 ? '⚠️ Au moins 1 établissement doit être conservé' : 'Action sécurisée par confirmation'}
              </span>

              <button
                type="button"
                onClick={() => setShowDeleteModal(true)}
                disabled={schools.length <= 1}
                className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-black text-xs flex items-center space-x-2 transition-all cursor-pointer shadow-md"
              >
                <Trash2 className="h-4 w-4" />
                <span>Supprimer cet Établissement</span>
              </button>
            </div>
          </div>
        </>
      )}

      {/* Delete School Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 space-y-4 border border-rose-200 dark:border-rose-900 shadow-2xl text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center space-x-2 text-rose-600">
                <AlertTriangle className="h-5 w-5" />
                <h3 className="font-black text-sm text-slate-900 dark:text-white">
                  Confirmation de Suppression de l'École
                </h3>
              </div>
              <button
                onClick={() => { setShowDeleteModal(false); setDeleteConfirmText(''); }}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-slate-600 dark:text-slate-300">
              <p className="leading-relaxed">
                Êtes-vous certain de vouloir supprimer l'école <strong className="text-slate-900 dark:text-white">« {currentSchool?.name} »</strong> ?
              </p>
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300 text-[11px] font-bold">
                Pour confirmer la suppression, veuillez retaper le nom exact de l'école ci-dessous :
                <span className="block mt-1 font-mono text-xs text-rose-950 dark:text-rose-100 font-black">{currentSchool?.name}</span>
              </div>

              <input
                type="text"
                value={deleteConfirmText}
                onChange={e => setDeleteConfirmText(e.target.value)}
                placeholder="Tapez le nom de l'école ici..."
                className="w-full p-2.5 rounded-xl border border-rose-300 dark:border-rose-700 bg-white dark:bg-slate-800 font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>

            <div className="pt-3 flex space-x-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => { setShowDeleteModal(false); setDeleteConfirmText(''); }}
                className="w-1/2 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 font-bold text-slate-700 dark:text-slate-300 cursor-pointer"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleDeleteSchool}
                disabled={deleteConfirmText.trim().toLowerCase() !== currentSchool?.name.trim().toLowerCase()}
                className="w-1/2 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-50 disabled:cursor-not-allowed font-extrabold text-white shadow-md cursor-pointer flex items-center justify-center space-x-1"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Confirmer Suppression</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
