import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  auth,
  googleProvider,
  appleProvider,
  signInWithRedirect,
  getRedirectResult,
  signOut,
  onAuthStateChanged,
  getUserProfileFromFirestore,
  saveUserProfileToFirestore,
  getUserDataByEmailFromFirestore,
  saveUserDataByEmailToFirestore,
  FirebaseUser
} from '../lib/firebase';
import {
  ShieldCheck,
  Lock,
  Building2,
  AlertCircle,
  UserCheck,
  RefreshCw,
  Mail,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  Database
} from 'lucide-react';
import { UserRole } from '../types';

export interface GmailUserSession {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  provider?: 'google' | 'apple' | 'email';
  role: UserRole;
  schoolId?: string;
  verifiedInFirestore?: boolean;
  restoredFromCloud?: boolean;
}

interface GoogleAuthContextType {
  gmailUser: GmailUserSession | null;
  signOutGoogle: () => Promise<void>;
  loginDirectEmail?: (email: string, role?: UserRole, name?: string) => void;
}

const GoogleAuthContext = createContext<GoogleAuthContextType>({
  gmailUser: null,
  signOutGoogle: async () => {},
  loginDirectEmail: () => {}
});

export const useGoogleAuth = () => useContext(GoogleAuthContext);

export const GoogleAuthGate: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [gmailUser, setGmailUser] = useState<GmailUserSession | null>(() => {
    try {
      const saved = localStorage.getItem('GESTIONNAIRE_SCOLAIRE_GMAIL_USER');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [restoredNotice, setRestoredNotice] = useState<string | null>(null);
  
  // Direct Email Login State
  const [directEmail, setDirectEmail] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole>('DIRECTEUR');
  const [customName, setCustomName] = useState('');

  // Helper function to resolve user role and school from Firestore profile
  const processAuthenticatedUser = async (firebaseUser: FirebaseUser) => {
    if (!firebaseUser || !firebaseUser.email) return;

    setLoading(true);
    setErrorMessage('');
    try {
      const uid = firebaseUser.uid;
      const email = firebaseUser.email.trim().toLowerCase();
      const isApple = firebaseUser.providerData?.[0]?.providerId === 'apple.com';

      // 1. Query user profile by UID and by Email in Firestore
      const [dbProfile, emailProfile] = await Promise.all([
        getUserProfileFromFirestore(uid),
        getUserDataByEmailFromFirestore(email)
      ]);

      const isPromoter = email === 'mahounouvictor123@gmail.com';
      let userRole: UserRole = isPromoter ? 'SUPER_ADMIN' : 'DIRECTEUR';

      if (dbProfile?.role) {
        userRole = dbProfile.role as UserRole;
      } else if (emailProfile?.role) {
        userRole = emailProfile.role as UserRole;
      }

      const existingSchoolId = dbProfile?.schoolId || emailProfile?.schoolId || dbProfile?.lastSchoolId || emailProfile?.lastSchoolId;
      const resolvedDisplayName = dbProfile?.displayName || emailProfile?.displayName || firebaseUser.displayName || email.split('@')[0].toUpperCase();

      const session: GmailUserSession = {
        uid,
        email,
        displayName: resolvedDisplayName,
        photoURL: firebaseUser.photoURL || emailProfile?.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(resolvedDisplayName)}&background=059669&color=fff`,
        provider: isApple ? 'apple' : 'google',
        role: userRole,
        schoolId: existingSchoolId,
        verifiedInFirestore: true,
        restoredFromCloud: !!(dbProfile || emailProfile)
      };

      // Save / update both records in Firestore
      const userProfilePayload = {
        uid,
        email,
        displayName: resolvedDisplayName,
        photoURL: session.photoURL,
        role: userRole,
        schoolId: existingSchoolId,
        lastLoginAt: new Date().toISOString()
      };

      await Promise.all([
        saveUserProfileToFirestore(uid, userProfilePayload),
        saveUserDataByEmailToFirestore(email, userProfilePayload)
      ]);

      saveSession(session);

      if (dbProfile || emailProfile) {
        setRestoredNotice(`Compte reconnu : ${email}. Vos données et votre historique ont été récupérés.`);
      }
    } catch (err: any) {
      console.error("Error fetching/verifying user role from Firestore:", err);
      setErrorMessage("Impossible de vérifier votre profil dans Firestore. Connexion locale active.");
    } finally {
      setLoading(false);
    }
  };

  // Check getRedirectResult on mount
  useEffect(() => {
    const handleRedirectResult = async () => {
      try {
        const result = await getRedirectResult(auth);
        if (result && result.user) {
          await processAuthenticatedUser(result.user);
        }
      } catch (error: any) {
        console.error("Firebase Auth Redirect Result Error:", error);
        setErrorMessage("Erreur lors du retour de l'authentification : " + (error?.message || "Veuillez réessayer."));
      }
    };

    handleRedirectResult();
  }, []);

  // Firebase auth state listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        // Re-verify and refresh session with Firestore role
        if (!gmailUser || gmailUser.uid !== firebaseUser.uid) {
          await processAuthenticatedUser(firebaseUser);
        }
      } else {
        if (gmailUser && gmailUser.provider !== 'email') {
          setGmailUser(null);
          localStorage.removeItem('GESTIONNAIRE_SCOLAIRE_GMAIL_USER');
        }
      }
    });

    return () => unsubscribe();
  }, []);

  const saveSession = (session: GmailUserSession) => {
    setGmailUser(session);
    try {
      localStorage.setItem('GESTIONNAIRE_SCOLAIRE_GMAIL_USER', JSON.stringify(session));
    } catch (e) {
      console.error('Error saving auth session', e);
    }
  };

  const signOutGoogle = async () => {
    try {
      await signOut(auth);
    } catch (e) {
      console.warn('Signout warning', e);
    }
    setGmailUser(null);
    localStorage.removeItem('GESTIONNAIRE_SCOLAIRE_GMAIL_USER');
  };

  // Direct Email Login Handler
  const loginDirectEmail = async (emailInput: string, roleInput?: UserRole, nameInput?: string) => {
    const email = emailInput.trim().toLowerCase();
    if (!email || !email.includes('@')) {
      setErrorMessage("Veuillez saisir une adresse email Gmail valide (ex: directeur@gmail.com).");
      return;
    }

    setLoading(true);
    setErrorMessage('');

    try {
      const uid = `usr-${email.replace(/[^a-zA-Z0-9]/g, '_')}`;
      
      const [dbProfile, emailProfile] = await Promise.all([
        getUserProfileFromFirestore(uid),
        getUserDataByEmailFromFirestore(email)
      ]);

      const isPromoter = email === 'mahounouvictor123@gmail.com';
      let finalRole: UserRole = isPromoter ? 'SUPER_ADMIN' : (roleInput || selectedRole || 'DIRECTEUR');

      if (dbProfile?.role) {
        finalRole = dbProfile.role as UserRole;
      } else if (emailProfile?.role) {
        finalRole = emailProfile.role as UserRole;
      }

      const existingSchoolId = dbProfile?.schoolId || emailProfile?.schoolId || dbProfile?.lastSchoolId || emailProfile?.lastSchoolId;
      const resolvedDisplayName = nameInput || customName || dbProfile?.displayName || emailProfile?.displayName || email.split('@')[0].toUpperCase();

      const userProfilePayload = {
        uid,
        email,
        displayName: resolvedDisplayName,
        role: finalRole,
        schoolId: existingSchoolId,
        photoURL: emailProfile?.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(resolvedDisplayName)}&background=059669&color=fff`,
        lastLoginAt: new Date().toISOString()
      };

      await Promise.all([
        saveUserProfileToFirestore(uid, userProfilePayload),
        saveUserDataByEmailToFirestore(email, userProfilePayload)
      ]);

      const session: GmailUserSession = {
        uid,
        email,
        displayName: resolvedDisplayName,
        photoURL: userProfilePayload.photoURL,
        provider: 'email',
        role: finalRole,
        schoolId: existingSchoolId,
        verifiedInFirestore: true,
        restoredFromCloud: !!(dbProfile || emailProfile)
      };

      saveSession(session);

      if (dbProfile || emailProfile) {
        setRestoredNotice(`Compte reconnu : ${email}. Vos données et votre historique ont été récupérés.`);
      }
    } catch (err) {
      console.error("Direct Email login error:", err);
      setErrorMessage("Erreur lors de la connexion email. Veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  };

  const handleDirectEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loginDirectEmail(directEmail, selectedRole, customName);
  };

  const handleGoogleSignInRedirect = async () => {
    setLoading(true);
    setErrorMessage('');
    try {
      await signInWithRedirect(auth, googleProvider);
    } catch (error: any) {
      console.error("Google signInWithRedirect error:", error);
      setErrorMessage("Erreur lors de la redirection Google Auth. Vous pouvez utiliser la connexion directe par email ci-dessous.");
      setLoading(false);
    }
  };

  const handleAppleSignInRedirect = async () => {
    setLoading(true);
    setErrorMessage('');
    try {
      await signInWithRedirect(auth, appleProvider);
    } catch (error: any) {
      console.error("Apple signInWithRedirect error:", error);
      setErrorMessage("Erreur lors de la redirection Apple Auth. Vous pouvez utiliser la connexion directe par email ci-dessous.");
      setLoading(false);
    }
  };

  const handleOpenNewTab = () => {
    window.open(window.location.href, '_blank');
  };

  // If user is authenticated and verified, render application content
  if (gmailUser) {
    return (
      <GoogleAuthContext.Provider value={{ gmailUser, signOutGoogle, loginDirectEmail }}>
        {children}
      </GoogleAuthContext.Provider>
    );
  }

  // Otherwise, render full screen mandatory authentication barrier
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950 text-slate-100 overflow-y-auto">
      {/* Background Effect */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-900/30 via-slate-950 to-black pointer-events-none" />

      <div className="relative w-full max-w-lg bg-slate-900/95 rounded-3xl shadow-2xl border border-slate-800 backdrop-blur-xl p-6 sm:p-8 space-y-6 my-auto">
        
        {/* Top Header Badge */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-black uppercase tracking-wider">
            <ShieldCheck className="h-4 w-4" />
            <span>Portail d'Accès Sécurisé Firebase</span>
          </div>

          <div className="flex justify-center my-2">
            <div className="p-3.5 bg-gradient-to-tr from-emerald-600 to-teal-500 rounded-2xl shadow-lg text-white">
              <Building2 className="h-8 w-8" />
            </div>
          </div>

          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Authentification Utilisateur
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 max-w-md mx-auto leading-relaxed">
            Saisissez votre adresse <strong className="text-emerald-400">Gmail / Email officiel</strong> pour vous connecter directement ou utilisez le bouton Google / Apple.
          </p>
        </div>

        {errorMessage && (
          <div className="p-3.5 bg-rose-950/80 border border-rose-800 text-rose-200 rounded-2xl text-xs font-semibold flex items-start space-x-2">
            <AlertCircle className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Section 1: Connexion Directe par Adresse Email / Gmail */}
        <form onSubmit={handleDirectEmailSubmit} className="space-y-4 p-4 rounded-2xl bg-slate-800/80 border border-slate-700/80">
          <div className="flex items-center space-x-2 text-emerald-400 font-extrabold text-xs uppercase tracking-wider">
            <Mail className="h-4 w-4" />
            <span>Connexion Directe par Adresse Gmail / Email</span>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">
              Votre adresse Email / Gmail *
            </label>
            <input
              type="email"
              required
              value={directEmail}
              onChange={(e) => setDirectEmail(e.target.value)}
              placeholder="ex: directeur.ecole@gmail.com"
              className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-emerald-500 transition-all"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Rôle Utilisateur
              </label>
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value as UserRole)}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-semibold focus:outline-none focus:border-emerald-500"
              >
                <option value="DIRECTEUR">Directeur / Admin</option>
                <option value="SUPER_ADMIN">Promoteur Général</option>
                <option value="SECRETAIRE">Secrétaire</option>
                <option value="COMPTABLE">Comptable</option>
                <option value="ENSEIGNANT">Enseignant</option>
                <option value="PARENT">Parent d'Élève</option>
                <option value="ELEVE">Élève</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Nom d'Affichage (Optionnel)
              </label>
              <input
                type="text"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                placeholder="ex: M. le Directeur"
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-[0.99] text-white font-extrabold text-xs sm:text-sm flex items-center justify-center space-x-2 shadow-lg transition-all cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <span>Accéder à l'application avec cet Email</span>
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </form>

        <div className="relative flex py-1 items-center">
          <div className="flex-grow border-t border-slate-800"></div>
          <span className="flex-shrink mx-4 text-[11px] text-slate-500 font-bold uppercase">Ou via OAuth Firebase</span>
          <div className="flex-grow border-t border-slate-800"></div>
        </div>

        {/* OAuth Redirect Buttons */}
        <div className="space-y-3">
          {/* Google Redirect Button */}
          <button
            type="button"
            onClick={handleGoogleSignInRedirect}
            disabled={loading}
            className="w-full py-3 px-5 rounded-2xl bg-white hover:bg-slate-100 text-slate-900 font-extrabold text-xs sm:text-sm flex items-center justify-center space-x-3 shadow-xl transition-all cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <RefreshCw className="h-5 w-5 animate-spin text-emerald-600" />
            ) : (
              <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
            )}
            <span>Se connecter avec Google (Gmail OAuth Redirect)</span>
          </button>

          {/* Apple Redirect Button */}
          <button
            type="button"
            onClick={handleAppleSignInRedirect}
            disabled={loading}
            className="w-full py-3 px-5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-extrabold text-xs sm:text-sm flex items-center justify-center space-x-3 border border-slate-700 shadow-xl transition-all cursor-pointer disabled:opacity-50"
          >
            <span className="text-lg leading-none"></span>
            <span>Se connecter avec Apple ID</span>
          </button>

          {/* Open New Tab Link if iframe blocks */}
          <div className="pt-1 flex justify-center">
            <button
              type="button"
              onClick={handleOpenNewTab}
              className="text-[11px] text-emerald-400 hover:text-emerald-300 font-extrabold underline flex items-center space-x-1 cursor-pointer py-1 px-2 rounded-lg hover:bg-emerald-950/40 transition-all"
            >
              <span>🚀 Ouvrir l'application dans un nouvel onglet navigateur ↗</span>
            </button>
          </div>
        </div>

        {/* Bottom Security Note */}
        <div className="pt-3 border-t border-slate-800/80 text-center text-[11px] text-slate-400 space-y-1">
          <p className="flex items-center justify-center space-x-1">
            <Lock className="h-3.5 w-3.5 text-emerald-400" />
            <span>Base Firestore Synchronisée & Sécurisée</span>
          </p>
        </div>

      </div>
    </div>
  );
};
