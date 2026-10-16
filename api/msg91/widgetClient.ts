// One MSG91 OTP session at a time: send, retry, verify. Wraps the official SDK (OTPWidget) behind a small typed
// surface so screens never see `any`, and so the flow is testable with a fake SDK.
//
// What is kept in memory: the request id MSG91 returned and the widget settings. Never persisted, never logged.
// The OTP itself is passed straight through and not retained here.
import { ApiError } from '../errors';
import {
  classifyThrown,
  interpretRetry,
  interpretSend,
  interpretVerify,
  interpretWidgetConfig,
  toWidgetIdentifier,
  type Msg91Response,
  type SendOutcome,
  type WidgetConfigResponse,
  type WidgetSettings,
} from './responses';

/** The part of `OTPWidget` this app uses (signatures verified against @msg91comm/sendotp-react-native 3.1.0). */
export interface OtpWidgetSdk {
  initializeWidget(widgetId: string, tokenAuth: string): Promise<void>;
  sendOTP(body: { identifier: string }): Promise<Msg91Response | undefined>;
  retryOTP(body: { reqId: string; retryChannel?: number }): Promise<Msg91Response | undefined>;
  verifyOTP(body: { reqId: string; otp: string }): Promise<Msg91Response | undefined>;
  getWidgetProcess(): Promise<WidgetConfigResponse>;
}

export interface WidgetClientOptions {
  widgetId: string;
  tokenAuth: string;
  timeoutMs: number;
}

export type StartResult = { settings: WidgetSettings; outcome: SendOutcome };

function withTimeout<T>(work: Promise<T>, ms: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout>;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new ApiError(0, 'TIMEOUT', 'The OTP service took too long to answer')), ms);
  });
  return Promise.race([work, timeout]).finally(() => clearTimeout(timer));
}

export function createWidgetClient(sdk: OtpWidgetSdk, options: WidgetClientOptions) {
  let initialised = false;
  let settings: WidgetSettings | null = null;
  let reqId: string | null = null;
  // Calls already running, by name: a second tap while one is in flight shares it instead of sending a second SMS.
  const inFlight = new Map<string, Promise<unknown>>();

  const once = <T>(key: string, run: () => Promise<T>): Promise<T> => {
    const running = inFlight.get(key);
    if (running) return running as Promise<T>;
    const promise = run().finally(() => inFlight.delete(key));
    inFlight.set(key, promise);
    return promise;
  };

  const call = async <T>(work: () => Promise<T>): Promise<T> => {
    try {
      return await withTimeout(work(), options.timeoutMs);
    } catch (error) {
      throw classifyThrown(error);
    }
  };

  const ensureReady = async (): Promise<WidgetSettings> => {
    if (!initialised) {
      await sdk.initializeWidget(options.widgetId, options.tokenAuth);
      initialised = true;
    }
    if (!settings) settings = interpretWidgetConfig(await call(() => sdk.getWidgetProcess()));
    return settings;
  };

  return {
    /** Widget settings once loaded (OTP length, resend interval); null before the first `start`. */
    settings: (): WidgetSettings | null => settings,
    /** True while there is an OTP request that can be verified or retried. */
    hasRequest: (): boolean => reqId !== null,

    /** Checks the widget configuration, then asks MSG91 to send an OTP (or verify invisibly). */
    start: (phone: string): Promise<StartResult> =>
      once('start', async () => {
        const identifier = toWidgetIdentifier(phone);
        if (!identifier) throw new ApiError(0, 'OTP_BAD_NUMBER', 'not an Indian mobile number');
        reqId = null;
        const ready = await ensureReady();
        const outcome = interpretSend(await call(() => sdk.sendOTP({ identifier })));
        if (outcome.kind === 'otpSent') reqId = outcome.reqId;
        return { settings: ready, outcome };
      }),

    /** Asks MSG91 to send the code again (default channel). */
    retry: (): Promise<void> =>
      once('retry', async () => {
        if (!reqId) throw new ApiError(0, 'OTP_SESSION_LOST', 'no OTP request to retry');
        const current = reqId;
        interpretRetry(await call(() => sdk.retryOTP({ reqId: current })));
      }),

    /** Checks the code with MSG91 and returns the access token (which our server must still verify). */
    verify: (otp: string): Promise<string> =>
      once('verify', async () => {
        if (!reqId) throw new ApiError(0, 'OTP_SESSION_LOST', 'no OTP request to verify');
        const current = reqId;
        const token = interpretVerify(await call(() => sdk.verifyOTP({ reqId: current, otp })));
        reqId = null; // a request id is single use: the token below replaces it
        return token;
      }),

    /** Forget the current request (leaving the OTP screen, or after sign-in). */
    reset: (): void => {
      reqId = null;
    },
  };
}

export type WidgetClient = ReturnType<typeof createWidgetClient>;
