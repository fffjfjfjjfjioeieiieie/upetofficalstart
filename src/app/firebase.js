import { getApps, initializeApp } from 'firebase/app';
import {
  browserLocalPersistence,
  getAuth,
  setPersistence,
} from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Firebase web identifiers are public client configuration, not credentials.
// The fallbacks match .env.example so Firebase Hosting previews keep the same
// Auth/Firestore project as production even when Vite has no injected env file.
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyDkA5ewgcWc1tJmr-lYxGDsA1rEcVJhtHY',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'upet-c480b.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'upet-c480b',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:364926948757:web:caae6d8fbbae0cfe39929c',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'upet-c480b.firebasestorage.app',
};

export const firebaseConfigured = [firebaseConfig.apiKey, firebaseConfig.authDomain, firebaseConfig.projectId, firebaseConfig.appId].every(
  (value) => typeof value === 'string' && value.trim().length > 0,
);

const firebaseApp = firebaseConfigured
  ? (getApps()[0] ?? initializeApp(firebaseConfig))
  : null;

export const auth = firebaseApp ? getAuth(firebaseApp) : null;
export const firestore = firebaseApp ? getFirestore(firebaseApp) : null;
export const persistAuthLocally = () => {
  if (!auth) return Promise.reject(new Error('Firebase Authentication is not configured.'));
  return setPersistence(auth, browserLocalPersistence);
};
