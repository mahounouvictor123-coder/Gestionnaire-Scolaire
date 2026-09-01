import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, doc, setDoc, getDoc, onSnapshot } from "firebase/firestore";
import {
  getAuth,
  GoogleAuthProvider,
  OAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser
} from "firebase/auth";

import firebaseAppletConfig from "../../firebase-applet-config.json";

// Default Firebase Config provisioned for this project:
export const defaultFirebaseConfig = {
  apiKey: firebaseAppletConfig.apiKey,
  authDomain: firebaseAppletConfig.authDomain,
  projectId: firebaseAppletConfig.projectId,
  storageBucket: firebaseAppletConfig.storageBucket,
  messagingSenderId: firebaseAppletConfig.messagingSenderId,
  appId: firebaseAppletConfig.appId,
  measurementId: firebaseAppletConfig.measurementId || "",
  firestoreDatabaseId: firebaseAppletConfig.firestoreDatabaseId
};

export const getSavedFirebaseConfig = () => {
  try {
    const saved = localStorage.getItem('firebase_custom_config');
    if (saved) {
      const parsed = JSON.parse(saved);
      return { ...defaultFirebaseConfig, ...parsed };
    }
  } catch (e) {
    console.error('Error reading custom firebase config', e);
  }
  return defaultFirebaseConfig;
};

export const saveFirebaseConfig = (config: typeof defaultFirebaseConfig) => {
  try {
    localStorage.setItem('firebase_custom_config', JSON.stringify(config));
  } catch (e) {
    console.error('Error saving custom firebase config', e);
  }
};

const currentConfig = getSavedFirebaseConfig();

export const app = !getApps().length ? initializeApp(currentConfig) : getApp();
export const db = currentConfig.firestoreDatabaseId && currentConfig.firestoreDatabaseId !== '(default)'
  ? getFirestore(app, currentConfig.firestoreDatabaseId)
  : getFirestore(app);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const appleProvider = new OAuthProvider('apple.com');
export type { FirebaseUser };
export { signInWithPopup, signInWithRedirect, getRedirectResult, signOut, onAuthStateChanged };

// User Profile Firestore Helpers
export const sanitizeEmailForDocId = (email: string): string => {
  return (email || '').trim().toLowerCase().replace(/[^a-zA-Z0-9]/g, '_');
};

export const getUserProfileFromFirestore = async (uid: string) => {
  try {
    const userDocRef = doc(db, "users", uid);
    const snap = await getDoc(userDocRef);
    if (snap.exists()) {
      return snap.data();
    }
  } catch (e) {
    console.warn("[Firestore User Profile Read Warning]:", e);
  }
  return null;
};

export const saveUserProfileToFirestore = async (uid: string, profileData: any) => {
  try {
    const userDocRef = doc(db, "users", uid);
    await setDoc(userDocRef, profileData, { merge: true });

    // If email is provided, also dual-save to users_by_email index for multi-device email recognition
    if (profileData?.email) {
      const emailDocId = sanitizeEmailForDocId(profileData.email);
      const emailDocRef = doc(db, "users_by_email", emailDocId);
      await setDoc(emailDocRef, profileData, { merge: true });
    }
  } catch (e) {
    console.warn("[Firestore User Profile Save Warning]:", e);
  }
};

export const getUserDataByEmailFromFirestore = async (email: string) => {
  if (!email) return null;
  try {
    const emailDocId = sanitizeEmailForDocId(email);
    const emailDocRef = doc(db, "users_by_email", emailDocId);
    const snap = await getDoc(emailDocRef);
    if (snap.exists()) {
      return snap.data();
    }
  } catch (e) {
    console.warn("[Firestore User By Email Read Warning]:", e);
  }
  return null;
};

export const saveUserDataByEmailToFirestore = async (email: string, userData: any) => {
  if (!email) return;
  try {
    const emailDocId = sanitizeEmailForDocId(email);
    const emailDocRef = doc(db, "users_by_email", emailDocId);
    await setDoc(emailDocRef, { ...userData, email: email.trim().toLowerCase(), lastSyncAt: new Date().toISOString() }, { merge: true });
  } catch (e) {
    console.warn("[Firestore User By Email Save Warning]:", e);
  }
};

// Cloud Sync Helpers
export const syncToCloud = async (schoolId: string, dataType: string, data: any) => {
  if (!schoolId) return;
  try {
    const docRef = doc(db, "schools", schoolId, "data", dataType);
    await setDoc(docRef, { payload: JSON.stringify(data), updatedAt: new Date().toISOString() }, { merge: true });
  } catch (e) {
    console.warn(`[Firestore Cloud Backup] (${dataType}):`, e);
  }
};

export const loadFromCloud = async (schoolId: string, dataType: string) => {
  if (!schoolId) return null;
  try {
    const docRef = doc(db, "schools", schoolId, "data", dataType);
    const snap = await getDoc(docRef);
    if (snap.exists() && snap.data()?.payload) {
      return JSON.parse(snap.data().payload);
    }
  } catch (e) {
    console.warn(`[Firestore Cloud Restore] (${dataType}):`, e);
  }
  return null;
};

export const subscribeToCloud = (schoolId: string, dataType: string, callback: (data: any) => void) => {
  if (!schoolId) return () => {};
  try {
    const docRef = doc(db, "schools", schoolId, "data", dataType);
    return onSnapshot(docRef, (snap) => {
      if (snap.exists() && snap.data()?.payload) {
        try {
          const parsed = JSON.parse(snap.data().payload);
          callback(parsed);
        } catch (e) {
          console.warn(`[Firestore Parse Error] (${dataType}):`, e);
        }
      }
    }, (err) => {
      console.warn(`[Firestore Listen Warning] (${dataType}):`, err);
    });
  } catch (e) {
    console.warn(`[Firestore Subscribe Error] (${dataType}):`, e);
    return () => {};
  }
};

export const syncSchoolsRegistryToCloud = async (schools: any[]) => {
  try {
    const docRef = doc(db, "system", "schools_registry");
    await setDoc(docRef, { payload: JSON.stringify(schools), updatedAt: new Date().toISOString() }, { merge: true });
  } catch (e) {
    console.warn("[Firestore Registry Backup Error]:", e);
  }
};

export const subscribeToSchoolsRegistry = (callback: (schools: any[]) => void) => {
  try {
    const docRef = doc(db, "system", "schools_registry");
    return onSnapshot(docRef, (snap) => {
      if (snap.exists() && snap.data()?.payload) {
        try {
          const parsed = JSON.parse(snap.data().payload);
          if (Array.isArray(parsed) && parsed.length > 0) {
            callback(parsed);
          }
        } catch (e) {
          console.warn("[Firestore Registry Parse Error]:", e);
        }
      }
    }, (err) => {
      console.warn("[Firestore Registry Listen Warning]:", err);
    });
  } catch (e) {
    return () => {};
  }
};


