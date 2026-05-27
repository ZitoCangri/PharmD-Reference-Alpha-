/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  signInWithPopup, 
  signOut, 
  GoogleAuthProvider, 
  onAuthStateChanged,
  User
} from "firebase/auth";
import { 
  getFirestore, 
  collection, 
  doc, 
  getDoc,
  getDocs, 
  setDoc, 
  deleteDoc, 
  query, 
  orderBy, 
  serverTimestamp,
  getDocFromServer,
  Timestamp,
  writeBatch
} from "firebase/firestore";
import firebaseConfig from "../firebase-applet-config.json";

// Check if credentials are mock/sandbox
export const IS_SANDBOX_MODE = !firebaseConfig.apiKey || firebaseConfig.apiKey.includes("mock_api_key_for_typescript_build");

let appInstance;
let dbInstance: any;
let authInstance: any;

if (!IS_SANDBOX_MODE) {
  try {
    appInstance = initializeApp(firebaseConfig);
    dbInstance = getFirestore(appInstance, firebaseConfig.firestoreDatabaseId);
    authInstance = getAuth(appInstance);

    // Validate connection to Firestore as requested in SKILL.md
    const testConnection = async () => {
      try {
        await getDocFromServer(doc(dbInstance, "test", "connection"));
      } catch (error) {
        if (error instanceof Error && error.message.includes("the client is offline")) {
          console.error("Please check your Firebase configuration or network.");
        }
      }
    };
    testConnection();
  } catch (err) {
    console.warn("Real Firebase init failed, falling back to Sandbox.", err);
  }
}

// Export instances or fallback mocks
export const db = dbInstance;
export const auth = authInstance;

export enum OperationType {
  CREATE = "create",
  UPDATE = "update",
  DELETE = "delete",
  LIST = "list",
  GET = "get",
  WRITE = "write",
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const currentAuth = !IS_SANDBOX_MODE ? getAuth() : null;
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: currentAuth?.currentUser?.uid,
      email: currentAuth?.currentUser?.email,
      emailVerified: currentAuth?.currentUser?.emailVerified,
      isAnonymous: currentAuth?.currentUser?.isAnonymous,
      tenantId: currentAuth?.currentUser?.tenantId,
      providerInfo: currentAuth?.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error("Firestore Error: ", JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Authentication wrappers
export const loginWithGoogle = async () => {
  if (IS_SANDBOX_MODE) {
    // Sandbox credentials login bypass
    return {
      uid: "sandbox-physician-101",
      email: "sandbox.physician@pharmpro.clinic",
      displayName: "Dr. Alexander Fleming",
      emailVerified: true,
      photoURL: "https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=100&h=100&fit=crop&crop=faces"
    };
  }
  const provider = new GoogleAuthProvider();
  const result = await signInWithPopup(authInstance, provider);
  return result.user;
};

export const logoutUser = async () => {
  if (IS_SANDBOX_MODE) return;
  await signOut(authInstance);
};

// Types for data collections
export interface SavedMonographData {
  id: string; // docId
  rxcui: string;
  drugName: string;
  savedAt: string; // ISO string
}

export interface SearchHistoryData {
  id: string; // docId
  query: string;
  searchedAt: string; // ISO string
}

// LOCALSTORAGE KEYS FOR SANDBOX BACKEND
const LOCAL_SAVED_MONOGRAPHS = "sandbox_saved_monographs";
const LOCAL_SEARCH_HISTORY = "sandbox_search_history";

// Saved Monographs API helpers
export const saveDrugMonographToProfile = async (userId: string, rxcui: string, drugName: string): Promise<SavedMonographData> => {
  const docId = `mono_${rxcui.replace(/\D/g, "") || Date.now()}`;
  const nowStr = new Date().toISOString();

  if (IS_SANDBOX_MODE) {
    const list = JSON.parse(localStorage.getItem(LOCAL_SAVED_MONOGRAPHS) || "[]") as SavedMonographData[];
    if (list.some(m => m.rxcui === rxcui)) {
      return list.find(m => m.rxcui === rxcui)!;
    }
    const newItem: SavedMonographData = { id: docId, rxcui, drugName, savedAt: nowStr };
    list.unshift(newItem);
    localStorage.setItem(LOCAL_SAVED_MONOGRAPHS, JSON.stringify(list));
    return newItem;
  }

  const path = `users/${userId}/savedMonographs/${docId}`;
  try {
    const docRef = doc(db, "users", userId, "savedMonographs", docId);
    await setDoc(docRef, {
      rxcui,
      drugName,
      savedAt: serverTimestamp()
    });
    return { id: docId, rxcui, drugName, savedAt: nowStr };
  } catch (error) {
    return handleFirestoreError(error, OperationType.WRITE, path);
  }
};

export const fetchSavedMonographsFromProfile = async (userId: string): Promise<SavedMonographData[]> => {
  if (IS_SANDBOX_MODE) {
    return JSON.parse(localStorage.getItem(LOCAL_SAVED_MONOGRAPHS) || "[]") as SavedMonographData[];
  }

  const path = `users/${userId}/savedMonographs`;
  try {
    const q = query(collection(db, "users", userId, "savedMonographs"), orderBy("savedAt", "desc"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => {
      const data = d.data();
      let dateIso = new Date().toISOString();
      if (data.savedAt instanceof Timestamp) {
        dateIso = data.savedAt.toDate().toISOString();
      }
      return {
        id: d.id,
        rxcui: data.rxcui,
        drugName: data.drugName,
        savedAt: dateIso
      };
    });
  } catch (error) {
    return handleFirestoreError(error, OperationType.GET, path);
  }
};

export const removeSavedMonographFromProfile = async (userId: string, monographDocId: string): Promise<void> => {
  if (IS_SANDBOX_MODE) {
    const list = JSON.parse(localStorage.getItem(LOCAL_SAVED_MONOGRAPHS) || "[]") as SavedMonographData[];
    const filtered = list.filter(m => m.id !== monographDocId);
    localStorage.setItem(LOCAL_SAVED_MONOGRAPHS, JSON.stringify(filtered));
    return;
  }

  const path = `users/${userId}/savedMonographs/${monographDocId}`;
  try {
    const docRef = doc(db, "users", userId, "savedMonographs", monographDocId);
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
};

// Search History API helpers
export const saveSearchHistoryToProfile = async (userId: string, queryText: string): Promise<SearchHistoryData> => {
  const docId = `hist_${Date.now()}`;
  const nowStr = new Date().toISOString();

  if (IS_SANDBOX_MODE) {
    const list = JSON.parse(localStorage.getItem(LOCAL_SEARCH_HISTORY) || "[]") as SearchHistoryData[];
    // Remove if duplicates exist to keep most recent
    const filtered = list.filter(h => h.query.toLowerCase() !== queryText.toLowerCase());
    const newItem: SearchHistoryData = { id: docId, query: queryText, searchedAt: nowStr };
    const updated = [newItem, ...filtered].slice(0, 10);
    localStorage.setItem(LOCAL_SEARCH_HISTORY, JSON.stringify(updated));
    return newItem;
  }

  const path = `users/${userId}/searchHistory/${docId}`;
  try {
    // Also remove potential old history if we want to deduplicate? Firestore standard creation has no unique bounds easily without lookups,
    // but we can look up or just write it as standard log list. Let's do standard write.
    const docRef = doc(db, "users", userId, "searchHistory", docId);
    await setDoc(docRef, {
      query: queryText,
      searchedAt: serverTimestamp()
    });
    return { id: docId, query: queryText, searchedAt: nowStr };
  } catch (error) {
    return handleFirestoreError(error, OperationType.WRITE, path);
  }
};

export const fetchSearchHistoryFromProfile = async (userId: string): Promise<SearchHistoryData[]> => {
  if (IS_SANDBOX_MODE) {
    return JSON.parse(localStorage.getItem(LOCAL_SEARCH_HISTORY) || "[]") as SearchHistoryData[];
  }

  const path = `users/${userId}/searchHistory`;
  try {
    const q = query(collection(db, "users", userId, "searchHistory"), orderBy("searchedAt", "desc"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => {
      const data = d.data();
      let dateIso = new Date().toISOString();
      if (data.searchedAt instanceof Timestamp) {
        dateIso = data.searchedAt.toDate().toISOString();
      }
      return {
        id: d.id,
        query: data.query,
        searchedAt: dateIso
      };
    });
  } catch (error) {
    return handleFirestoreError(error, OperationType.GET, path);
  }
};

export const removeSearchHistoryItemFromProfile = async (userId: string, historyDocId: string): Promise<void> => {
  if (IS_SANDBOX_MODE) {
    const list = JSON.parse(localStorage.getItem(LOCAL_SEARCH_HISTORY) || "[]") as SearchHistoryData[];
    const filtered = list.filter(h => h.id !== historyDocId);
    localStorage.setItem(LOCAL_SEARCH_HISTORY, JSON.stringify(filtered));
    return;
  }

  const path = `users/${userId}/searchHistory/${historyDocId}`;
  try {
    const docRef = doc(db, "users", userId, "searchHistory", historyDocId);
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
};

export const clearSearchHistoryFromProfile = async (userId: string): Promise<void> => {
  if (IS_SANDBOX_MODE) {
    localStorage.removeItem(LOCAL_SEARCH_HISTORY);
    return;
  }

  const path = `users/${userId}/searchHistory`;
  try {
    const q = query(collection(db, "users", userId, "searchHistory"));
    const snapshot = await getDocs(q);
    // Delete in batches of 100 for safety
    if (snapshot.size === 0) return;
    const batch = writeBatch(db);
    snapshot.docs.forEach(d => {
      batch.delete(d.ref);
    });
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
};

// Subscriber hook for auth
export const subscribeToAuthChanges = (callback: (user: any | null) => void) => {
  if (IS_SANDBOX_MODE) {
    // Check if user is saved in sandbox storage
    const stored = localStorage.getItem("sandbox_user_profile");
    if (stored) {
      callback(JSON.parse(stored));
    } else {
      callback(null);
    }
    
    // Return unsubscribe callback
    return () => {};
  }
  return onAuthStateChanged(authInstance, (user) => {
    callback(user);
  });
};
