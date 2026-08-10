import { initializeApp, setLogLevel } from 'firebase/app';
import { getFirestore, enableMultiTabIndexedDbPersistence, clearIndexedDbPersistence, terminate } from 'firebase/firestore';

// Silence benign internal SDK debug/warning messages (like millisecond clock skew logs)
setLogLevel('error');
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';

// Configuration is primarily loaded from environment variables (important for GitHub/Hostinger).
// Set these in your environment (.env file) or as Secrets in GitHub Actions.
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyBBd_dAZKW9vRcC5y09cpqcdQk8kySAlA0",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "gen-lang-client-0568439716.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "gen-lang-client-0568439716",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "gen-lang-client-0568439716.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "701773395834",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:701773395834:web:c627d4e5d9de0e79edc8c3",
  firestoreDatabaseId: "ai-studio-15655e8c-18ff-4359-b057-60febe5dddfc",
};

// Check if config is missing and warn the user
if (!firebaseConfig.apiKey) {
  console.warn("[Firebase] API Key is missing. Please set VITE_FIREBASE_API_KEY in your environment variables.");
}

const app = initializeApp(firebaseConfig);
// Initialize Firestore with the specific database ID from environment or fallback
const dbId = firebaseConfig.firestoreDatabaseId;
console.log(`[Firebase] Initializing Firestore using Database ID: "${dbId || '(default)'}"`);
export const db = getFirestore(app, dbId);

function getSafeStorageItem(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch (e) {
    return null;
  }
}

function setSafeStorageItem(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch (e) {}
}

export function handleQuotaExceeded() {
  if (getSafeStorageItem("firestore_quota_exceeded") !== "true") {
    setSafeStorageItem("firestore_quota_exceeded", "true");
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

if (getSafeStorageItem("firestore_quota_exceeded") === "true") {
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

// Test connection on boot to verify configuration
import { doc, getDocFromServer } from 'firebase/firestore';
async function testConnection() {
  try {
    const testDoc = await getDocFromServer(doc(db, 'portfolio', 'main'));
    console.log("[Firebase] Connection verified. Document exists:", testDoc.exists());
  } catch (error: any) {
    console.error("[Firebase] Connection test failed. This usually indicates an incorrect database ID or restricted rules:", error);
    if (error?.message?.includes('database') || error?.message?.includes('not found')) {
       console.warn("[Firebase] CRITICAL: The database ID might be incorrect. Ensure it matches your AI Studio project settings.");
    }
  }
}
testConnection();
