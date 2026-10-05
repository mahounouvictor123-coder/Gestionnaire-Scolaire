import { initializeApp, getApps, getApp } from "firebase/app";
import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDoc, 
  onSnapshot, 
  collection, 
  getDocs, 
  deleteDoc 
} from "firebase/firestore";
import {
  getAuth,
  GoogleAuthProvider,
  OAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  signInAnonymously,
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

// Auto anonymous auth helper so all staff members have a valid Firebase session
export const ensureFirebaseAuthSession = async () => {
  try {
    if (!auth.currentUser) {
      await signInAnonymously(auth);
    }
  } catch (e) {
    // If anonymous auth is not enabled on the project, the relaxed firestore.rules and server sync still handle everything
  }
};

// Start anonymous auth check on module load
if (typeof window !== 'undefined') {
  setTimeout(() => {
    ensureFirebaseAuthSession().catch(() => {});
  }, 100);
}

// Cloud & Real-Time Sync Helpers
export const syncToCloud = async (schoolId: string, dataType: string, data: any) => {
  if (!schoolId) return;
  const timestamp = new Date().toISOString();

  // 1. Primary Cloud Persistence: Firestore
  try {
    const docRef = doc(db, "schools", schoolId, "data", dataType);
    await setDoc(docRef, { payload: JSON.stringify(data), updatedAt: timestamp }, { merge: true });
  } catch (e) {
    console.warn(`[Firestore Cloud Backup] (${dataType}):`, e);
  }

  // 2. Instant Same-Browser Inter-Tab Sync via BroadcastChannel
  try {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      const bc = new BroadcastChannel('edumanage_realtime_sync');
      bc.postMessage({ schoolId, dataType, payload: data, updatedAt: timestamp });
      bc.close();
    }
  } catch (e) {}
};

export const loadFromCloud = async (schoolId: string, dataType: string) => {
  if (!schoolId) return null;

  // 1. Attempt Firestore
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
  let isCleanedUp = false;
  const cleanups: (() => void)[] = [];

  // 1. Firestore Real-Time Listener (onSnapshot)
  try {
    const docRef = doc(db, "schools", schoolId, "data", dataType);
    const unsub = onSnapshot(docRef, (snap) => {
      if (isCleanedUp) return;
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
    cleanups.push(unsub);
  } catch (e) {
    console.warn(`[Firestore Subscribe Error] (${dataType}):`, e);
  }

  // 2. BroadcastChannel Listener (Tabs on same device/session)
  try {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      const bc = new BroadcastChannel('edumanage_realtime_sync');
      const handleBcMessage = (event: MessageEvent) => {
        if (isCleanedUp) return;
        const msg = event.data;
        if (msg && msg.schoolId === schoolId && msg.dataType === dataType && msg.payload !== undefined) {
          callback(msg.payload);
        }
      };
      bc.addEventListener('message', handleBcMessage);
      cleanups.push(() => {
        bc.removeEventListener('message', handleBcMessage);
        bc.close();
      });
    }
  } catch (e) {}

  return () => {
    isCleanedUp = true;
    cleanups.forEach(fn => fn());
  };
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
          if (Array.isArray(parsed)) {
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

export const syncDeletedSchoolsToCloud = async (deletedIds: string[]) => {
  try {
    const docRef = doc(db, "system", "deleted_schools");
    await setDoc(docRef, { payload: JSON.stringify(deletedIds), updatedAt: new Date().toISOString() }, { merge: true });
  } catch (e) {
    console.warn("[Firestore Deleted Schools Backup Error]:", e);
  }
};

export const subscribeToDeletedSchools = (callback: (deletedIds: string[]) => void) => {
  try {
    const docRef = doc(db, "system", "deleted_schools");
    return onSnapshot(docRef, (snap) => {
      if (snap.exists() && snap.data()?.payload) {
        try {
          const parsed = JSON.parse(snap.data().payload);
          if (Array.isArray(parsed)) {
            callback(parsed);
          }
        } catch (e) {
          console.warn("[Firestore Deleted Schools Parse Error]:", e);
        }
      }
    }, (err) => {
      console.warn("[Firestore Deleted Schools Listen Warning]:", err);
    });
  } catch (e) {
    return () => {};
  }
};

// ==========================================
// DEDICATED TEACHER EXAM PAPERS CLOUD SYNC
// (Ensures exam papers uploaded by teachers from their app
// appear instantly on the main platform with zero 1MB overflow)
// ==========================================

export const syncExamPaperToCloud = async (schoolId: string, paper: any) => {
  if (!schoolId || !paper?.id) return;
  const timestamp = new Date().toISOString();

  // 1. Direct document write to dedicated subcollection
  try {
    const docRef = doc(db, "schools", schoolId, "exam_papers", paper.id);
    await setDoc(docRef, { ...paper, updatedAt: timestamp }, { merge: true });
  } catch (e) {
    console.warn(`[Firestore Exam Paper Sync Error] (${paper.id}):`, e);
  }

  // 2. BroadcastChannel immediate local tab propagation
  try {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      const bc = new BroadcastChannel('edumanage_realtime_sync');
      bc.postMessage({ schoolId, dataType: 'EXAM_PAPER_SINGLE', payload: paper, updatedAt: timestamp });
      bc.close();
    }
  } catch (e) {}
};

export const deleteExamPaperFromCloud = async (schoolId: string, paperId: string) => {
  if (!schoolId || !paperId) return;
  try {
    const docRef = doc(db, "schools", schoolId, "exam_papers", paperId);
    await deleteDoc(docRef);
  } catch (e) {
    console.warn(`[Firestore Exam Paper Delete Error] (${paperId}):`, e);
  }

  try {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      const bc = new BroadcastChannel('edumanage_realtime_sync');
      bc.postMessage({ schoolId, dataType: 'EXAM_PAPER_DELETED', payload: { id: paperId }, updatedAt: new Date().toISOString() });
      bc.close();
    }
  } catch (e) {}
};

export const loadExamPapersFromCloud = async (schoolId: string): Promise<any[]> => {
  if (!schoolId) return [];
  const papersMap = new Map<string, any>();

  // A. Load from dedicated subcollection (primary, high reliability)
  try {
    const colRef = collection(db, "schools", schoolId, "exam_papers");
    const snap = await getDocs(colRef);
    snap.forEach((d) => {
      const data = d.data();
      if (data && (data.id || d.id)) {
        papersMap.set(data.id || d.id, { id: d.id, ...data });
      }
    });
  } catch (e) {
    console.warn("[Firestore loadExamPapers subcollection error]:", e);
  }

  // B. Load from legacy aggregate document (fallback/merge)
  try {
    const legacyDocRef = doc(db, "schools", schoolId, "data", "EXAM_PAPERS");
    const legacySnap = await getDoc(legacyDocRef);
    if (legacySnap.exists() && legacySnap.data()?.payload) {
      const legacyPapers = JSON.parse(legacySnap.data().payload);
      if (Array.isArray(legacyPapers)) {
        legacyPapers.forEach((p: any) => {
          if (p && p.id && !papersMap.has(p.id)) {
            papersMap.set(p.id, p);
          }
        });
      }
    }
  } catch (e) {
    console.warn("[Firestore loadExamPapers legacy error]:", e);
  }

  return Array.from(papersMap.values());
};

export const subscribeToExamPapers = (schoolId: string, callback: (papers: any[]) => void) => {
  if (!schoolId) return () => {};
  let isCleanedUp = false;
  const cleanups: (() => void)[] = [];
  const papersMap = new Map<string, any>();

  const emitMerged = () => {
    if (isCleanedUp) return;
    const sorted = Array.from(papersMap.values()).sort((a, b) => {
      const dateA = a.createdAt || a.updatedAt || '';
      const dateB = b.createdAt || b.updatedAt || '';
      return dateB.localeCompare(dateA);
    });
    callback(sorted);
  };

  // 1. Listen to individual exam_papers subcollection
  try {
    const colRef = collection(db, "schools", schoolId, "exam_papers");
    const unsubCol = onSnapshot(colRef, (snap) => {
      if (isCleanedUp) return;
      snap.docChanges().forEach((change) => {
        const id = change.doc.id;
        if (change.type === 'removed') {
          papersMap.delete(id);
        } else {
          papersMap.set(id, { id, ...change.doc.data() });
        }
      });
      emitMerged();
    }, (err) => {
      console.warn("[Firestore Exam Papers Listener Warning]:", err);
    });
    cleanups.push(unsubCol);
  } catch (e) {
    console.warn("[Firestore Exam Papers Sub Error]:", e);
  }

  // 2. Listen to aggregate EXAM_PAPERS document
  try {
    const aggDocRef = doc(db, "schools", schoolId, "data", "EXAM_PAPERS");
    const unsubAgg = onSnapshot(aggDocRef, (snap) => {
      if (isCleanedUp) return;
      if (snap.exists() && snap.data()?.payload) {
        try {
          const arr = JSON.parse(snap.data().payload);
          if (Array.isArray(arr)) {
            arr.forEach((p: any) => {
              if (p?.id && !papersMap.has(p.id)) {
                papersMap.set(p.id, p);
              }
            });
            emitMerged();
          }
        } catch (e) {}
      }
    }, () => {});
    cleanups.push(unsubAgg);
  } catch (e) {}

  // 3. BroadcastChannel listener (instant same-device sync between teacher sub-app and main platform)
  try {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      const bc = new BroadcastChannel('edumanage_realtime_sync');
      const handleBc = (evt: MessageEvent) => {
        if (isCleanedUp) return;
        const msg = evt.data;
        if (msg && msg.schoolId === schoolId) {
          if (msg.dataType === 'EXAM_PAPER_SINGLE' && msg.payload?.id) {
            papersMap.set(msg.payload.id, msg.payload);
            emitMerged();
          } else if (msg.dataType === 'EXAM_PAPER_DELETED' && msg.payload?.id) {
            papersMap.delete(msg.payload.id);
            emitMerged();
          } else if (msg.dataType === 'EXAM_PAPERS' && Array.isArray(msg.payload)) {
            msg.payload.forEach((p: any) => {
              if (p?.id) papersMap.set(p.id, p);
            });
            emitMerged();
          }
        }
      };
      bc.addEventListener('message', handleBc);
      cleanups.push(() => {
        bc.removeEventListener('message', handleBc);
        bc.close();
      });
    }
  } catch (e) {}

  return () => {
    isCleanedUp = true;
    cleanups.forEach(fn => fn());
  };
};



