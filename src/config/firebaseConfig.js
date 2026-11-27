import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  initializeAuth,
  getAuth,
  getReactNativePersistence,
} from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || '',
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || '',
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || '',
};

/**
 * Returns true when real Firebase credentials are configured via EXPO_PUBLIC_FIREBASE_*.
 */
export function isFirebaseConfigured() {
  return Boolean(
    firebaseConfig.apiKey &&
      firebaseConfig.projectId &&
      firebaseConfig.appId &&
      !firebaseConfig.apiKey.includes('YOUR_')
  );
}

let firebaseApp = null;
let firebaseAuth = null;

/**
 * Lazily initializes and returns `{ app, auth }` when Firebase is configured.
 * Returns `{ app: null, auth: null }` in unconfigured local/offline environments.
 */
export function getFirebaseAuthInstance() {
  if (!isFirebaseConfigured()) {
    return { app: null, auth: null };
  }

  if (firebaseAuth) {
    return { app: firebaseApp, auth: firebaseAuth };
  }

  firebaseApp = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

  try {
    firebaseAuth = initializeAuth(firebaseApp, {
      persistence: getReactNativePersistence(AsyncStorage),
    });
  } catch (_) {
    firebaseAuth = getAuth(firebaseApp);
  }

  return { app: firebaseApp, auth: firebaseAuth };
}
