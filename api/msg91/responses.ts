// What MSG91 answers, and what each answer means. Pure functions (no React Native, no network) so every case is
// unit-tested. Shapes come from @msg91comm/sendotp-react-native 3.1.0 (README + its own DefaultWidget code); MSG91 does
// not publish a schema for the error bodies, so errors are classified from their text with a safe generic fallback.
import { ApiError } from '../errors';

/** Raw send/retry/verify answer: `{ type: 'success' | 'error', message?, 'access-token'?, invisibleVerified?, code? }`. */
export interface Msg91Response {
  type?: unknown;
  message?: unknown;
  'access-token'?: unknown;
  invisibleVerified?: unknown;
  code?: unknown;
}

export type SendOutcome =
  /** An OTP was sent; `reqId` is needed to verify and retry. */
  | { kind: 'otpSent'; reqId: string }
  /** Invisible OTP verified the number without a code: the access token is already in hand. */
  | { kind: 'verified'; accessToken: string };

/** Per-situation default used when MSG91's text is not recognised. */
type Situation = 'send' | 'retry' | 'verify';

/** "98765 43210", "+91 98765 43210" or "919876543210" become "919876543210": country code, no "+" (the SDK's rule). */
export function toWidgetIdentifier(input: string): string | null {
  const digits = input.replace(/\D/g, '');
  const local = digits.length === 12 && digits.startsWith('91') ? digits.slice(2) : digits;
  // Indian mobile numbers start with 6-9 (the server enforces the same rule)
  return /^[6-9]\d{9}$/.test(local) ? `91${local}` : null;
}

const err = (code: string, message: string, retryAfterSec?: number) => new ApiError(0, code, message, [], undefined, retryAfterSec);

const text = (value: unknown): string => (typeof value === 'string' || typeof value === 'number' ? String(value) : '');

// A JWT has three base64url segments. Used so that a stray text message is never mistaken for a token.
const JWT_SHAPE = /^[\w-]+\.[\w-]+\.[\w-]+$/;

/** The access token of a successful answer: the `access-token` field, else the JWT-shaped `message` (as the SDK does). */
export function accessTokenOf(res: Msg91Response): string | null {
  const direct = text(res['access-token']);
  if (direct) return direct;
  const message = text(res.message);
  return JWT_SHAPE.test(message) ? message : null;
}

/**
 * Turns MSG91's error text into one of our error codes. Order matters: "expired" before "invalid" (an expired code is
 * also invalid), limits before generic failures. Unrecognised text falls back to the situation's default.
 */
export function classifyFailure(res: Msg91Response | null | undefined, situation: Situation): ApiError {
  const message = text(res?.message).toLowerCase();
  if (/expire/.test(message)) return err('OTP_EXPIRED', message);
  if (/(limit|too many|max(imum)? (retry|attempt|resend)|retry (count|limit)|exceed)/.test(message)) {
    return err(situation === 'verify' ? 'OTP_LOCKED' : 'OTP_LIMIT', message);
  }
  if (/(invalid|incorrect|wrong|mismatch|not match|not verified)/.test(message) && situation === 'verify') {
    return err('OTP_INVALID', message);
  }
  if (/(widget|token|authenticat|unauthori|not enabled|mobile integration|ip )/.test(message)) {
    return err('OTP_CONFIG', message);
  }
  if (/(mobile|identifier|number|phone)/.test(message) && situation === 'send') {
    return err('OTP_BAD_NUMBER', message);
  }
  return err(situation === 'verify' ? 'OTP_INVALID' : 'OTP_SEND_FAILED', message);
}

/** The answer to `sendOTP`. Never assumes an OTP was sent just because the call succeeded: invisible success differs. */
export function interpretSend(res: Msg91Response | null | undefined): SendOutcome {
  if (!res || res.type !== 'success') throw classifyFailure(res, 'send');

  // Invisible OTP: the number is already verified and the answer carries the access token. No OTP screen.
  const token = text(res['access-token']);
  if (res.invisibleVerified === true || token) {
    const accessToken = accessTokenOf(res);
    if (accessToken) return { kind: 'verified', accessToken };
    throw err('OTP_PROVIDER_ERROR', 'invisible verification without a token');
  }

  const reqId = text(res.message).trim();
  if (!reqId) throw err('OTP_PROVIDER_ERROR', 'send succeeded without a request id');
  return { kind: 'otpSent', reqId };
}

/** The answer to `verifyOTP`: the access token, which proves nothing until our server has checked it with MSG91. */
export function interpretVerify(res: Msg91Response | null | undefined): string {
  if (!res || res.type !== 'success') throw classifyFailure(res, 'verify');
  const accessToken = accessTokenOf(res);
  if (!accessToken) throw err('OTP_PROVIDER_ERROR', 'verify succeeded without a token');
  return accessToken;
}

/** The answer to `retryOTP`. */
export function interpretRetry(res: Msg91Response | null | undefined): void {
  if (!res || res.type !== 'success') throw classifyFailure(res, 'retry');
}

/** Raw `getWidgetProcess` answer. */
export type WidgetConfigResponse = { status?: unknown; data?: RawWidgetData } | null | undefined;

/** What the app needs from `getWidgetProcess` (raw shape: `{ status: 'success', data: { otpLength, retryTime, ... } }`). */
export interface WidgetSettings {
  otpLength: number;
  /** Seconds between resends, from the widget policy. */
  retryTimeSec: number;
  /** How many resends the widget allows (the server enforces it; this only shapes the screen). */
  retryCount: number;
  /** Minutes an OTP stays valid. */
  expiryMin: number;
}

interface RawWidgetData {
  otpLength?: unknown;
  retryTime?: unknown;
  retryCount?: unknown;
  expiryTime?: unknown;
  mobileIntegration?: unknown;
  status?: { value?: unknown };
  verificationType?: unknown;
  processType?: { value?: unknown };
}

const positiveInt = (value: unknown): number | null => {
  const n = typeof value === 'string' ? Number(value) : value;
  return typeof n === 'number' && Number.isInteger(n) && n > 0 ? n : null;
};

/**
 * Validates the widget configuration before any SMS is attempted, so a dashboard mistake gives a clear message
 * instead of a mystery failure. The OTP length comes from here, never from an assumption.
 */
export function interpretWidgetConfig(res: WidgetConfigResponse): WidgetSettings {
  const data = res?.data;
  if (!res || res.status !== 'success' || !data) throw err('OTP_CONFIG', 'widget configuration unavailable');
  if (data.status?.value === '0') throw err('OTP_CONFIG', 'widget is disabled in the MSG91 dashboard');
  // 1 = enabled for mobile apps. Off by default in the dashboard, and then every mobile call is refused.
  if (data.mobileIntegration !== 1) throw err('OTP_CONFIG', 'Mobile Integration is off for this widget');
  if (data.verificationType === '2') throw err('OTP_CONFIG', 'widget uses magic links, not OTP');
  const processType = data.processType?.value;
  if (processType === '3') throw err('OTP_CONFIG', 'widget is email-only');

  const otpLength = positiveInt(data.otpLength);
  const retryTimeSec = positiveInt(data.retryTime);
  if (!otpLength || otpLength > 10 || !retryTimeSec) throw err('OTP_PROVIDER_ERROR', 'unexpected widget configuration');
  return {
    otpLength,
    retryTimeSec,
    retryCount: positiveInt(data.retryCount) ?? 1,
    expiryMin: positiveInt(data.expiryTime) ?? 15,
  };
}

/** A failure thrown by the SDK call itself (no answer at all) is a network problem; our own timeout is a timeout. */
export function classifyThrown(error: unknown): ApiError {
  if (error instanceof ApiError) return error;
  return new ApiError(0, 'NETWORK', 'The request to the OTP service failed');
}
