import { initializeApp, getApps, type FirebaseOptions } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';

function firebaseConfig(): FirebaseOptions | null {
  const apiKey = import.meta.env.VITE_FIREBASE_API_KEY?.trim();
  const authDomain = import.meta.env.VITE_FIREBASE_AUTH_DOMAIN?.trim();
  const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID?.trim();

  if (!apiKey || !authDomain || !projectId) {
    return null;
  }

  return {
    apiKey,
    authDomain,
    projectId,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET?.trim() || undefined,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID?.trim() || undefined,
    appId: import.meta.env.VITE_FIREBASE_APP_ID?.trim() || undefined,
  };
}

export function isFirebaseConfigured(): boolean {
  return firebaseConfig() !== null;
}

export function isFirebasePhoneTesting(): boolean {
  return import.meta.env.VITE_FIREBASE_PHONE_TESTING === '1';
}

export function getFirebaseAuth(): Auth {
  const config = firebaseConfig();
  if (!config) {
    throw new Error('Firebase is not configured. Add VITE_FIREBASE_* variables.');
  }

  const app = getApps().length > 0 ? getApps()[0] : initializeApp(config);
  const auth = getAuth(app);

  if (isFirebasePhoneTesting()) {
    auth.settings.appVerificationDisabledForTesting = true;
  }

  return auth;
}
