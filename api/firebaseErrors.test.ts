import { describe, expect, it } from 'vitest';
import { ApiError, userMessage } from './errors';
import { EXCHANGE_NEEDS_NEW_CODE, firebaseCodeOf, toPhoneAuthError } from './firebaseErrors';

const firebaseError = (code: string) => Object.assign(new Error(`[${code}] something with +919876543210`), { code });

describe('toPhoneAuthError', () => {
  const table: [string, number, string][] = [
    ['auth/invalid-phone-number', 422, 'PHONE_INVALID'],
    ['auth/missing-phone-number', 422, 'PHONE_INVALID'],
    ['auth/invalid-verification-code', 401, 'OTP_INVALID'],
    ['auth/missing-verification-code', 401, 'OTP_INVALID'],
    ['auth/invalid-verification-id', 401, 'OTP_INVALID'],
    ['auth/code-expired', 401, 'OTP_INVALID'],
    ['auth/session-expired', 401, 'OTP_INVALID'],
    ['auth/too-many-requests', 429, 'TOO_MANY_REQUESTS'],
    ['auth/quota-exceeded', 503, 'PHONE_AUTH_QUOTA'],
    ['auth/network-request-failed', 0, 'NETWORK'],
    ['auth/user-disabled', 403, 'ACCOUNT_DISABLED'],
    ['auth/app-not-authorized', 503, 'PHONE_AUTH_UNAVAILABLE'],
    ['auth/captcha-check-failed', 503, 'PHONE_AUTH_UNAVAILABLE'],
    ['auth/invalid-app-credential', 503, 'PHONE_AUTH_UNAVAILABLE'],
    ['auth/missing-client-identifier', 503, 'PHONE_AUTH_UNAVAILABLE'],
    ['auth/operation-not-allowed', 503, 'PHONE_AUTH_UNAVAILABLE'],
    ['auth/billing-not-enabled', 503, 'PHONE_AUTH_BILLING'],
    ['auth/internal-error', 503, 'PHONE_AUTH_UNAVAILABLE'],
  ];

  it.each(table)('%s -> %i %s', (code, status, appCode) => {
    const mapped = toPhoneAuthError(firebaseError(code));
    expect(mapped).toBeInstanceOf(ApiError);
    expect(mapped.status).toBe(status);
    expect(mapped.code).toBe(appCode);
  });

  it('every mapped error has text the person can read (never the raw Firebase message)', () => {
    for (const [code] of table) {
      const text = userMessage(toPhoneAuthError(firebaseError(code)));
      expect(text.length).toBeGreaterThan(10);
      expect(text).not.toContain('auth/');
      expect(text).not.toContain('9876543210');
    }
  });

  it('an unknown Firebase code becomes a generic failure that keeps only the code for support, not the message', () => {
    const mapped = toPhoneAuthError(firebaseError('auth/something-new'));
    expect(mapped.code).toBe('PHONE_AUTH_FAILED');
    expect(mapped.message).toBe('auth/something-new');
    expect(mapped.message).not.toContain('9876543210');
  });

  it('never shows a Firebase code (auth/...) or brackets to the person, even for an unrecognised error', () => {
    for (const code of ['auth/some-new-code', 'auth/billing-not-enabled', 'auth/unknown']) {
      const text = userMessage(toPhoneAuthError(firebaseError(code)));
      expect(text).not.toContain('auth/');
      expect(text).not.toContain('[');
      expect(text).not.toContain('9876543210');
    }
    expect(userMessage(toPhoneAuthError(new Error('boom')))).not.toContain('[');
  });

  it('recognises the free-plan (billing) refusal however Firebase spells it, and says what to do', () => {
    for (const error of [
      firebaseError('auth/billing-not-enabled'),
      firebaseError('auth/billing-not-enabled-for-project'),
      Object.assign(new Error('[auth/internal-error] BILLING_NOT_ENABLED'), { code: 'auth/internal-error' }),
      new Error('BILLING_NOT_ENABLED'),
    ]) {
      const mapped = toPhoneAuthError(error);
      expect(mapped.code).toBe('PHONE_AUTH_BILLING');
      expect(userMessage(mapped)).toContain('Blaze');
    }
  });

  it('anything that is not an object with a code is a generic failure', () => {
    for (const value of [undefined, null, 'boom', 42, new Error('plain'), {}, { code: 7 }]) {
      expect(toPhoneAuthError(value).code).toBe('PHONE_AUTH_FAILED');
    }
  });

  it('passes our own server errors through untouched', () => {
    const fromServer = new ApiError(401, 'FIREBASE_TOKEN_STALE', 'old', [], 'req-1');
    expect(toPhoneAuthError(fromServer)).toBe(fromServer);
  });
});

describe('firebaseCodeOf', () => {
  it('reads a string code only', () => {
    expect(firebaseCodeOf({ code: 'auth/x' })).toBe('auth/x');
    expect(firebaseCodeOf({ code: 5 })).toBeUndefined();
    expect(firebaseCodeOf(null)).toBeUndefined();
    expect(firebaseCodeOf('auth/x')).toBeUndefined();
  });
});

describe('server answers that need a new SMS', () => {
  it('are exactly the stale and rejected-token answers', () => {
    expect([...EXCHANGE_NEEDS_NEW_CODE].sort()).toEqual(['FIREBASE_TOKEN_INVALID', 'FIREBASE_TOKEN_STALE']);
  });
});

describe('texts for the new server codes', () => {
  it('exist for every code the backend can answer on the Firebase routes', () => {
    for (const code of [
      'FIREBASE_TOKEN_INVALID',
      'FIREBASE_TOKEN_STALE',
      'FIREBASE_UNAVAILABLE',
      'FIREBASE_AUTH_NOT_CONFIGURED',
      'PHONE_NOT_SUPPORTED',
      'PHONE_MISMATCH',
      'LEGACY_OTP_DISABLED',
    ]) {
      const text = userMessage(new ApiError(401, code, 'raw server text'));
      expect(text, code).not.toBe('raw server text');
      expect(text, code).toMatch(/ \/ /); // English / Hindi, like the other messages
    }
  });
});
