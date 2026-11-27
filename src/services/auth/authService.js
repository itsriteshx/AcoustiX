import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
  updateProfile,
  onAuthStateChanged,
} from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getFirebaseAuthInstance, isFirebaseConfigured } from '../../config/firebaseConfig';
import { validateAuthInput } from './authValidation';

const LOCAL_SESSION_KEY = '@acoustitape_local_user';
const localListeners = new Set();

function notifyLocalListeners(user) {
  for (const cb of localListeners) {
    try {
      cb(user);
    } catch (_) {}
  }
}

function mapFirebaseUser(fbUser) {
  if (!fbUser) return null;
  return {
    uid: fbUser.uid,
    email: fbUser.email || '',
    displayName: fbUser.displayName || (fbUser.email ? fbUser.email.split('@')[0] : 'Acoustic Engineer'),
    provider: 'firebase',
  };
}

/**
 * Subscribes to authentication state changes (Firebase Auth or local demo session).
 *
 * @param {Function} callback - Receives `user | null`.
 * @returns {Function} Unsubscribe function.
 */
export function subscribeAuthState(callback) {
  const { auth } = getFirebaseAuthInstance();
  if (auth) {
    return onAuthStateChanged(auth, (fbUser) => {
      callback(mapFirebaseUser(fbUser));
    });
  }

  localListeners.add(callback);
  AsyncStorage.getItem(LOCAL_SESSION_KEY)
    .then((raw) => {
      callback(raw ? JSON.parse(raw) : null);
    })
    .catch(() => callback(null));

  return () => {
    localListeners.delete(callback);
  };
}

/**
 * Signs in an existing user with Email & Password.
 */
export async function signInWithEmail(email, password) {
  const check = validateAuthInput(email, password, { isSignUp: false });
  if (!check.isValid) {
    throw new Error(check.error);
  }

  const cleanEmail = email.trim().toLowerCase();
  const { auth } = getFirebaseAuthInstance();

  if (auth) {
    const cred = await signInWithEmailAndPassword(auth, cleanEmail, password);
    return mapFirebaseUser(cred.user);
  }

  // Local fallback session when Firebase .env keys are not yet configured
  const localUser = {
    uid: 'local-' + Date.now(),
    email: cleanEmail,
    displayName: cleanEmail.split('@')[0],
    provider: 'local-demo',
  };
  await AsyncStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify(localUser));
  notifyLocalListeners(localUser);
  return localUser;
}

/**
 * Registers a new user with Email, Password & Display Name.
 */
export async function signUpWithEmail(email, password, displayName) {
  const check = validateAuthInput(email, password, { isSignUp: true, displayName });
  if (!check.isValid) {
    throw new Error(check.error);
  }

  const cleanEmail = email.trim().toLowerCase();
  const cleanName = displayName.trim();
  const { auth } = getFirebaseAuthInstance();

  if (auth) {
    const cred = await createUserWithEmailAndPassword(auth, cleanEmail, password);
    await updateProfile(cred.user, { displayName: cleanName });
    return {
      uid: cred.user.uid,
      email: cred.user.email || cleanEmail,
      displayName: cleanName,
      provider: 'firebase',
    };
  }

  const localUser = {
    uid: 'local-' + Date.now(),
    email: cleanEmail,
    displayName: cleanName,
    provider: 'local-demo',
  };
  await AsyncStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify(localUser));
  notifyLocalListeners(localUser);
  return localUser;
}

/**
 * Sends a Firebase password reset email.
 */
export async function sendPasswordReset(email) {
  const cleanEmail = (email || '').trim().toLowerCase();
  if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
    throw new Error('Enter a valid email address first.');
  }

  const { auth } = getFirebaseAuthInstance();
  if (!auth) {
    throw new Error('Password reset requires live Firebase keys in .env.');
  }

  await sendPasswordResetEmail(auth, cleanEmail);
  return true;
}

/**
 * Signs out the active user.
 */
export async function signOutUser() {
  const { auth } = getFirebaseAuthInstance();
  if (auth) {
    await signOut(auth);
  }
  await AsyncStorage.removeItem(LOCAL_SESSION_KEY);
  notifyLocalListeners(null);
}

export { isFirebaseConfigured };
