import test from 'node:test';
import assert from 'node:assert/strict';

import { validateAuthInput } from '../src/services/auth/authValidation.js';

test('validateAuthInput: rejects invalid email and short password', () => {
  const badEmail = validateAuthInput('not-an-email', 'secret123');
  assert.equal(badEmail.isValid, false);
  assert.match(badEmail.error, /valid email/i);

  const shortPass = validateAuthInput('user@example.com', '123');
  assert.equal(shortPass.isValid, false);
  assert.match(shortPass.error, /at least 6/i);
});

test('validateAuthInput: validates displayName on sign up and accepts valid inputs', () => {
  const missingName = validateAuthInput('user@example.com', 'secret123', {
    isSignUp: true,
    displayName: 'A',
  });
  assert.equal(missingName.isValid, false);
  assert.match(missingName.error, /name/i);

  const valid = validateAuthInput('ritesh@acoustix.dev', 'secret123', {
    isSignUp: true,
    displayName: 'Ritesh Kumar',
  });
  assert.equal(valid.isValid, true);
  assert.equal(valid.error, null);
});
