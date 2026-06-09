import { initializeApp } from 'firebase/app';
import { getFirestore, enableMultiTabIndexedDbPersistence, clearIndexedDbPersistence, terminate } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';

// Configuration is primarily loaded from environment variables (important for GitHub/Hostinger).
// Set these in your environment (.env file) or as Secrets in GitHub Actions.
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "",
  firestoreDatabaseId: import.meta.env.VITE_FIREBASE_FIRESTORE_DATABASE_ID || "(default)",
};

// Check if config is missing and warn the user
if (!firebaseConfig.apiKey) {
  console.warn("[Firebase] API Key is missing. Please set VITE_FIREBASE_API_KEY in your environment variables.");
}

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

export function handleQuotaExceeded() {
  if (localStorage.getItem("firestore_quota_exceeded") !== "true") {
    localStorage.setItem("firestore_quota_exceeded", "true");
  }
  terminate(db)
    .then(() => {
      return clearIndexedDbPersistence(db);
    })
    .then(() => {
      console.log("[Firebase] Successfully terminated Firestore and cleared offline IndexedDB persistence due to quota limit.");
    })
    .catch((err) => {
      console.warn("[Firebase] Failed to terminate or clear offline persistence on quota exceed invocation:", err);
    });
}

if (localStorage.getItem("firestore_quota_exceeded") === "true") {
  // Clear persistence and disable network connection immediately to stop retry noise
  // We must terminate the active DB instance before we can successfully clear IndexedDB persistence
  terminate(db)
    .then(() => {
      return clearIndexedDbPersistence(db);
    })
    .then(() => {
      console.log("[Firebase] Successfully terminated Firestore and cleared offline IndexedDB persistence due to quota limit.");
    })
    .catch((err) => {
      console.warn("[Firebase] Failed to terminate or clear offline persistence:", err);
    });
} else {
  enableMultiTabIndexedDbPersistence(db).catch((err) => {
    if (err.code == 'failed-precondition') {
      console.warn('Multiple tabs open, and multi-tab is unsupported in this browser.');
    } else if (err.code == 'unimplemented') {
      console.warn('The browser does not support persistence');
    }
  });
}

export const auth = getAuth();
export const storage = getStorage(app);
