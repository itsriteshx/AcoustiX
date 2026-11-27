/**
 * Pure JavaScript input validation helpers for Firebase Auth forms.
 */

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Validates email, password, and optional display name for Sign In / Sign Up.
 *
 * @param {string} email
 * @param {string} password
 * @param {{ isSignUp?: boolean, displayName?: string }} [options]
 * @returns {{ isValid: boolean, error: string | null }}
 */
export function validateAuthInput(email, password, options = {}) {
  const cleanEmail = (email || '').trim();
  const cleanPass = password || '';
  const { isSignUp = false, displayName = '' } = options;

  if (!cleanEmail || !EMAIL_REGEX.test(cleanEmail)) {
    return { isValid: false, error: 'Please enter a valid email address.' };
  }

  if (cleanPass.length < 6) {
    return { isValid: false, error: 'Password must be at least 6 characters.' };
  }

  if (isSignUp && displayName.trim().length < 2) {
    return { isValid: false, error: 'Please enter your name (at least 2 characters).' };
  }

  return { isValid: true, error: null };
}
