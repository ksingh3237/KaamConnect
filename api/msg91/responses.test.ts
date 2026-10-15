import { describe, expect, it } from 'vitest';
import { ApiError } from '../errors';
import {
  classifyFailure,
  interpretRetry,
  interpretSend,
  interpretVerify,
  interpretWidgetConfig,
  toWidgetIdentifier,
} from './responses';

const JWT = 'aaa.bbb.ccc';
const codeOf = (fn: () => unknown): string | undefined => {
  try {
    fn();
  } catch (e) {
    return e instanceof ApiError ? e.code : 'NOT_API_ERROR';
  }
  return undefined;
};

describe('toWidgetIdentifier', () => {
  it.each([
    ['98765 43210', '919876543210'],
    ['9876543210', '919876543210'],
    ['+91 98765 43210', '919876543210'],
    ['919876543210', '919876543210'],
  ])('formats %s with the country code once and no "+"', (input, expected) => {
    expect(toWidgetIdentifier(input)).toBe(expected);
  });

  it.each(['', '12345', '5876543210', '98765432', '9198765432100', '+1 415 555 0123'])('rejects %s', (input) => {
    expect(toWidgetIdentifier(input)).toBeNull();
  });
});

describe('interpretSend', () => {
  it('returns the request id for a normal send (it arrives in "message")', () => {
    expect(interpretSend({ type: 'success', message: '3463abc' })).toEqual({ kind: 'otpSent', reqId: '3463abc' });
  });

  it('treats invisible success as verified, with no OTP step', () => {
    expect(interpretSend({ type: 'success', 'access-token': JWT, invisibleVerified: true, message: '3463abc' })).toEqual({
      kind: 'verified',
      accessToken: JWT,
    });
  });

  it('treats an access-token on its own as verified too', () => {
    expect(interpretSend({ type: 'success', 'access-token': JWT })).toEqual({ kind: 'verified', accessToken: JWT });
  });

  it('refuses invisible success that carries no usable token', () => {
    expect(codeOf(() => interpretSend({ type: 'success', invisibleVerified: true, message: 'not-a-token' }))).toBe(
      'OTP_PROVIDER_ERROR',
    );
  });

  it('refuses a success with no request id', () => {
    expect(codeOf(() => interpretSend({ type: 'success' }))).toBe('OTP_PROVIDER_ERROR');
    expect(codeOf(() => interpretSend({ type: 'success', message: '  ' }))).toBe('OTP_PROVIDER_ERROR');
  });

  it('refuses errors and empty answers', () => {
    expect(codeOf(() => interpretSend({ type: 'error', message: 'something broke' }))).toBe('OTP_SEND_FAILED');
    expect(codeOf(() => interpretSend(undefined))).toBe('OTP_SEND_FAILED');
    expect(codeOf(() => interpretSend(null))).toBe('OTP_SEND_FAILED');
  });
});

describe('interpretVerify', () => {
  it('returns the access token from the access-token field', () => {
    expect(interpretVerify({ type: 'success', 'access-token': JWT })).toBe(JWT);
  });

  it('accepts a JWT in "message" (the SDK widget does the same)', () => {
    expect(interpretVerify({ type: 'success', message: JWT })).toBe(JWT);
  });

  it('never mistakes plain text for a token', () => {
    expect(codeOf(() => interpretVerify({ type: 'success', message: 'OTP verified success' }))).toBe('OTP_PROVIDER_ERROR');
  });

  it('does not treat a successful SMS send as verification', () => {
    // a send-shaped answer (request id only) has no token
    expect(codeOf(() => interpretVerify({ type: 'success', message: '3463abc' }))).toBe('OTP_PROVIDER_ERROR');
  });

  it.each([
    ['otp not match', 'OTP_INVALID'],
    ['Invalid OTP', 'OTP_INVALID'],
    ['OTP expired', 'OTP_EXPIRED'],
    ['Maximum attempts exceeded', 'OTP_LOCKED'],
    ['something unexpected', 'OTP_INVALID'],
  ])('maps the failure "%s" to %s', (message, expected) => {
    expect(codeOf(() => interpretVerify({ type: 'error', message }))).toBe(expected);
  });
});

describe('interpretRetry', () => {
  it('passes on success', () => {
    expect(() => interpretRetry({ type: 'success', message: 'ok' })).not.toThrow();
  });

  it.each([
    ['Retry limit reached', 'OTP_LIMIT'],
    ['otp request expired', 'OTP_EXPIRED'],
    ['could not send', 'OTP_SEND_FAILED'],
  ])('maps the failure "%s" to %s', (message, expected) => {
    expect(codeOf(() => interpretRetry({ type: 'error', message }))).toBe(expected);
  });
});

describe('classifyFailure', () => {
  it('flags dashboard or token problems as configuration errors', () => {
    expect(classifyFailure({ type: 'error', message: 'Invalid widget token' }, 'send').code).toBe('OTP_CONFIG');
    expect(classifyFailure({ type: 'error', message: 'Mobile Integration not enabled' }, 'send').code).toBe('OTP_CONFIG');
  });

  it('flags a bad number on send', () => {
    expect(classifyFailure({ type: 'error', message: 'Invalid mobile number' }, 'send').code).toBe('OTP_BAD_NUMBER');
  });

  it('keeps the provider text out of the user message path (only the code is used for display)', () => {
    const e = classifyFailure({ type: 'error', message: 'Invalid OTP for 919876543210' }, 'verify');
    expect(e.code).toBe('OTP_INVALID');
  });
});

describe('interpretWidgetConfig', () => {
  const data = (over: Record<string, unknown> = {}) => ({
    status: 'success',
    data: {
      otpLength: 6,
      retryTime: 45,
      retryCount: 3,
      expiryTime: 15,
      mobileIntegration: 1,
      status: { value: '1' },
      verificationType: '1',
      processType: { value: '2' },
      ...over,
    },
  });

  it('reads the OTP length and resend policy from the widget, not from assumptions', () => {
    expect(interpretWidgetConfig(data({ otpLength: 4, retryTime: 30 }))).toEqual({
      otpLength: 4,
      retryTimeSec: 30,
      retryCount: 3,
      expiryMin: 15,
    });
    expect(interpretWidgetConfig(data({ otpLength: 6, retryTime: 45 })).retryTimeSec).toBe(45);
  });

  it('accepts numbers sent as strings', () => {
    expect(interpretWidgetConfig(data({ otpLength: '6', retryTime: '30' })).otpLength).toBe(6);
  });

  it('refuses a widget with Mobile Integration off, before any SMS is attempted', () => {
    expect(codeOf(() => interpretWidgetConfig(data({ mobileIntegration: 0 })))).toBe('OTP_CONFIG');
  });

  it('refuses a disabled, magic-link or email-only widget', () => {
    expect(codeOf(() => interpretWidgetConfig(data({ status: { value: '0' } })))).toBe('OTP_CONFIG');
    expect(codeOf(() => interpretWidgetConfig(data({ verificationType: '2' })))).toBe('OTP_CONFIG');
    expect(codeOf(() => interpretWidgetConfig(data({ processType: { value: '3' } })))).toBe('OTP_CONFIG');
  });

  it('refuses a missing or failed answer', () => {
    expect(codeOf(() => interpretWidgetConfig(undefined))).toBe('OTP_CONFIG');
    expect(codeOf(() => interpretWidgetConfig({ status: 'error' }))).toBe('OTP_CONFIG');
  });

  it('refuses nonsense values rather than guessing a length', () => {
    expect(codeOf(() => interpretWidgetConfig(data({ otpLength: 0 })))).toBe('OTP_PROVIDER_ERROR');
    expect(codeOf(() => interpretWidgetConfig(data({ otpLength: 99 })))).toBe('OTP_PROVIDER_ERROR');
    expect(codeOf(() => interpretWidgetConfig(data({ retryTime: undefined })))).toBe('OTP_PROVIDER_ERROR');
  });
});
