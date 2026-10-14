import { describe, expect, it, vi } from 'vitest';
import { ApiError } from './errors';
import { createFirebasePhoneFlow, FIREBASE_RESEND_SEC } from './firebasePhone';
import type { PhoneAuth } from './phoneAuthTypes';
import type { VerifyResult } from './types';

const SESSION: VerifyResult = {
  accessToken: 'a',
  refreshToken: 'r',
  expiresIn: 900,
  isNewUser: true,
  user: { id: 'u1', phone: '+919876543210', language: 'en', hasCustomerProfile: false, hasWorkerProfile: false },
};

const firebaseError = (code: string) => Object.assign(new Error(code), { code });

function setup(overrides: Partial<PhoneAuth> = {}, exchange = vi.fn(async () => SESSION)) {
  const phoneAuth: PhoneAuth = {
    sendCode: vi.fn(async () => {}),
    confirm: vi.fn(async () => 'firebase-id-token'),
    onAutoVerified: vi.fn(() => () => {}),
    signOut: vi.fn(async () => {}),
    ...overrides,
  };
  return { phoneAuth, exchange, flow: createFirebasePhoneFlow({ phoneAuth, exchange }) };
}

describe('requestCode', () => {
  it('sends the SMS to the E.164 number, however the person typed it, and reports the resend pause', async () => {
    const { flow, phoneAuth } = setup();
    for (const typed of ['98765 43210', '9876543210', '+919876543210']) {
      await expect(flow.requestCode(typed)).resolves.toEqual({ resendAfterSec: FIREBASE_RESEND_SEC, expiresInSec: 0 });
      expect(phoneAuth.sendCode).toHaveBeenLastCalledWith('+919876543210');
    }
  });

  it('turns Firebase failures into ApiError with the app codes', async () => {
    for (const [code, expected] of [
      ['auth/invalid-phone-number', 'PHONE_INVALID'],
      ['auth/too-many-requests', 'TOO_MANY_REQUESTS'],
      ['auth/network-request-failed', 'NETWORK'],
      ['auth/quota-exceeded', 'PHONE_AUTH_QUOTA'],
    ] as const) {
      const { flow } = setup({ sendCode: vi.fn(async () => Promise.reject(firebaseError(code))) });
      const error = await flow.requestCode('9876543210').catch((e) => e);
      expect(error).toBeInstanceOf(ApiError);
      expect(error.code).toBe(expected);
    }
  });
});

describe('signIn', () => {
  it('confirms the code, trades the Firebase token for our session, then signs Firebase out', async () => {
    const { flow, phoneAuth, exchange } = setup();
    await expect(flow.signIn('123456')).resolves.toBe(SESSION);
    expect(phoneAuth.confirm).toHaveBeenCalledWith('123456');
    expect(exchange).toHaveBeenCalledWith('firebase-id-token');
    expect(phoneAuth.signOut).toHaveBeenCalledTimes(1);
  });

  it('never calls our server when Firebase rejects the code, and keeps the pending verification for another try', async () => {
    const { flow, phoneAuth, exchange } = setup({ confirm: vi.fn(async () => Promise.reject(firebaseError('auth/invalid-verification-code'))) });
    const error = await flow.signIn('000000').catch((e) => e);
    expect(error.code).toBe('OTP_INVALID');
    expect(exchange).not.toHaveBeenCalled();
    expect(phoneAuth.signOut).not.toHaveBeenCalled();
  });

  it('works with no typed code after Android verified the number by itself', async () => {
    const { flow, phoneAuth } = setup();
    await flow.signIn('');
    expect(phoneAuth.confirm).toHaveBeenCalledWith('');
  });

  it('after a stale or rejected token it signs Firebase out so the next attempt must request a new SMS', async () => {
    for (const code of ['FIREBASE_TOKEN_STALE', 'FIREBASE_TOKEN_INVALID']) {
      const { flow, phoneAuth } = setup({}, vi.fn(async () => Promise.reject(new ApiError(401, code, 'x'))));
      const error = await flow.signIn('123456').catch((e) => e);
      expect(error.code).toBe(code);
      expect(phoneAuth.signOut).toHaveBeenCalledTimes(1);
    }
  });

  it('after a network failure it KEEPS the Firebase sign-in, so a retry does not spend another SMS', async () => {
    const { flow, phoneAuth } = setup({}, vi.fn(async () => Promise.reject(new ApiError(0, 'NETWORK', 'offline'))));
    const error = await flow.signIn('123456').catch((e) => e);
    expect(error.code).toBe('NETWORK');
    expect(phoneAuth.signOut).not.toHaveBeenCalled();
  });

  it('keeps other server refusals as they are (disabled account, unsupported number, rate limit)', async () => {
    for (const [status, code] of [[403, 'ACCOUNT_DISABLED'], [422, 'PHONE_NOT_SUPPORTED'], [429, 'TOO_MANY_REQUESTS'], [503, 'FIREBASE_UNAVAILABLE']] as const) {
      const { flow, phoneAuth } = setup({}, vi.fn(async () => Promise.reject(new ApiError(status, code, 'x'))));
      const error = await flow.signIn('123456').catch((e) => e);
      expect(error.code).toBe(code);
      expect(phoneAuth.signOut).not.toHaveBeenCalled();
    }
  });
});

describe('proveOwnership and finish (account deletion)', () => {
  it('returns the Firebase ID token and does NOT sign out (the person may need to press Delete again)', async () => {
    const { flow, phoneAuth, exchange } = setup();
    await expect(flow.proveOwnership('123456')).resolves.toBe('firebase-id-token');
    expect(phoneAuth.signOut).not.toHaveBeenCalled();
    expect(exchange).not.toHaveBeenCalled(); // deletion sends the token to DELETE /me, not to the login route
  });

  it('maps a wrong code to the app error', async () => {
    const { flow } = setup({ confirm: vi.fn(async () => Promise.reject(firebaseError('auth/code-expired'))) });
    const error = await flow.proveOwnership('123456').catch((e) => e);
    expect(error.code).toBe('OTP_INVALID');
  });

  it('finish signs Firebase out', async () => {
    const { flow, phoneAuth } = setup();
    await flow.finish();
    expect(phoneAuth.signOut).toHaveBeenCalledTimes(1);
  });
});

describe('onAutoVerified', () => {
  it('passes the callback to Firebase and returns its unsubscribe function', () => {
    const unsubscribe = vi.fn();
    const { flow, phoneAuth } = setup({ onAutoVerified: vi.fn(() => unsubscribe) });
    const callback = vi.fn();
    const stop = flow.onAutoVerified(callback);
    expect(phoneAuth.onAutoVerified).toHaveBeenCalledWith(callback);
    stop();
    expect(unsubscribe).toHaveBeenCalled();
  });
});
