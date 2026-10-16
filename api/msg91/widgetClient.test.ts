import { describe, expect, it, vi } from 'vitest';
import { ApiError } from '../errors';
import { createWidgetClient, type OtpWidgetSdk } from './widgetClient';

const JWT = 'aaa.bbb.ccc';
const CONFIG = {
  status: 'success',
  data: { otpLength: 6, retryTime: 30, retryCount: 3, expiryTime: 15, mobileIntegration: 1, status: { value: '1' }, verificationType: '1', processType: { value: '2' } },
};

function fakeSdk(over: Partial<OtpWidgetSdk> = {}) {
  const sdk = {
    initializeWidget: vi.fn().mockResolvedValue(undefined),
    getWidgetProcess: vi.fn().mockResolvedValue(CONFIG),
    sendOTP: vi.fn().mockResolvedValue({ type: 'success', message: 'req-1' }),
    retryOTP: vi.fn().mockResolvedValue({ type: 'success', message: 'ok' }),
    verifyOTP: vi.fn().mockResolvedValue({ type: 'success', 'access-token': JWT }),
    ...over,
  };
  return sdk as typeof sdk & OtpWidgetSdk;
}
const make = (sdk: OtpWidgetSdk, timeoutMs = 1000) => createWidgetClient(sdk, { widgetId: 'w', tokenAuth: 't', timeoutMs });
const fails = async (p: Promise<unknown>) => {
  try {
    await p;
  } catch (e) {
    return e instanceof ApiError ? e.code : 'NOT_API_ERROR';
  }
  return 'NO_ERROR';
};

describe('widget client: sending', () => {
  it('initialises once, loads settings, sends to the number with country code and no "+"', async () => {
    const sdk = fakeSdk();
    const client = make(sdk);

    const { settings, outcome } = await client.start('98765 43210');
    await client.start('98765 43210');

    expect(sdk.initializeWidget).toHaveBeenCalledTimes(1);
    expect(sdk.initializeWidget).toHaveBeenCalledWith('w', 't');
    expect(sdk.getWidgetProcess).toHaveBeenCalledTimes(1);
    expect(sdk.sendOTP).toHaveBeenCalledWith({ identifier: '919876543210' });
    expect(settings).toMatchObject({ otpLength: 6, retryTimeSec: 30 });
    expect(outcome).toEqual({ kind: 'otpSent', reqId: 'req-1' });
    expect(client.hasRequest()).toBe(true);
  });

  it('shares one request between rapid duplicate taps (one SMS, not two)', async () => {
    const sdk = fakeSdk();
    const client = make(sdk);
    await Promise.all([client.start('9876543210'), client.start('9876543210'), client.start('9876543210')]);
    expect(sdk.sendOTP).toHaveBeenCalledTimes(1);
  });

  it('sends nothing for an invalid number', async () => {
    const sdk = fakeSdk();
    expect(await fails(make(sdk).start('12345'))).toBe('OTP_BAD_NUMBER');
    expect(sdk.sendOTP).not.toHaveBeenCalled();
  });

  it('sends nothing when the widget is misconfigured (Mobile Integration off)', async () => {
    const sdk = fakeSdk({ getWidgetProcess: vi.fn().mockResolvedValue({ ...CONFIG, data: { ...CONFIG.data, mobileIntegration: 0 } }) });
    expect(await fails(make(sdk).start('9876543210'))).toBe('OTP_CONFIG');
    expect(sdk.sendOTP).not.toHaveBeenCalled();
  });

  it('invisible OTP: returns the token and keeps no request to verify', async () => {
    const sdk = fakeSdk({ sendOTP: vi.fn().mockResolvedValue({ type: 'success', 'access-token': JWT, invisibleVerified: true, message: 'req-1' }) });
    const client = make(sdk);
    const { outcome } = await client.start('9876543210');
    expect(outcome).toEqual({ kind: 'verified', accessToken: JWT });
    expect(client.hasRequest()).toBe(false);
  });

  it('reports a network failure as NETWORK and a hang as TIMEOUT', async () => {
    expect(await fails(make(fakeSdk({ sendOTP: vi.fn().mockRejectedValue(new TypeError('Network request failed')) })).start('9876543210'))).toBe('NETWORK');

    vi.useFakeTimers();
    try {
      const hang = make(fakeSdk({ sendOTP: vi.fn().mockReturnValue(new Promise(() => {})) }), 500).start('9876543210');
      const result = fails(hang);
      await vi.advanceTimersByTimeAsync(600);
      expect(await result).toBe('TIMEOUT');
    } finally {
      vi.useRealTimers();
    }
  });

  it('reports SDK initialisation failure rather than hanging', async () => {
    const sdk = fakeSdk({ initializeWidget: vi.fn().mockRejectedValue(new Error('native module missing')) });
    // initialiseWidget rejects before any request: surfaces as a failure, nothing is sent
    await expect(make(sdk).start('9876543210')).rejects.toBeTruthy();
    expect(sdk.sendOTP).not.toHaveBeenCalled();
  });
});

describe('widget client: verify and retry', () => {
  const started = async (sdk = fakeSdk()) => {
    const client = make(sdk);
    await client.start('9876543210');
    return { client, sdk };
  };

  it('verifies with the request id and the typed code, returning the access token', async () => {
    const { client, sdk } = await started();
    expect(await client.verify('123456')).toBe(JWT);
    expect(sdk.verifyOTP).toHaveBeenCalledWith({ reqId: 'req-1', otp: '123456' });
  });

  it('keeps the request after a wrong code so the person can try again', async () => {
    const sdk = fakeSdk({ verifyOTP: vi.fn().mockResolvedValueOnce({ type: 'error', message: 'otp not match' }).mockResolvedValue({ type: 'success', 'access-token': JWT }) });
    const { client } = await started(sdk);
    expect(await fails(client.verify('000000'))).toBe('OTP_INVALID');
    expect(client.hasRequest()).toBe(true);
    expect(await client.verify('123456')).toBe(JWT);
  });

  it('spends the request id on success: a replay needs a new request', async () => {
    const { client, sdk } = await started();
    await client.verify('123456');
    expect(client.hasRequest()).toBe(false);
    expect(await fails(client.verify('123456'))).toBe('OTP_SESSION_LOST');
    expect(sdk.verifyOTP).toHaveBeenCalledTimes(1);
  });

  it('does not verify twice for duplicate taps', async () => {
    const { client, sdk } = await started();
    await Promise.all([client.verify('123456'), client.verify('123456')]);
    expect(sdk.verifyOTP).toHaveBeenCalledTimes(1);
  });

  it('refuses to verify or retry with no request (killed app, finished flow)', async () => {
    const client = make(fakeSdk());
    expect(await fails(client.verify('123456'))).toBe('OTP_SESSION_LOST');
    expect(await fails(client.retry())).toBe('OTP_SESSION_LOST');
  });

  it('retries on the same request id and passes server limits through', async () => {
    const sdk = fakeSdk({ retryOTP: vi.fn().mockResolvedValueOnce({ type: 'success' }).mockResolvedValue({ type: 'error', message: 'Retry limit reached' }) });
    const { client } = await started(sdk);
    await client.retry();
    expect(sdk.retryOTP).toHaveBeenCalledWith({ reqId: 'req-1' });
    expect(await fails(client.retry())).toBe('OTP_LIMIT');
  });

  it('starting again forgets the previous request', async () => {
    const sdk = fakeSdk({ sendOTP: vi.fn().mockResolvedValueOnce({ type: 'success', message: 'req-1' }).mockResolvedValueOnce({ type: 'success', message: 'req-2' }) });
    const { client } = await started(sdk);
    await client.start('9876543210');
    await client.verify('123456');
    expect(sdk.verifyOTP).toHaveBeenCalledWith({ reqId: 'req-2', otp: '123456' });
  });

  it('a failed new send leaves no stale request behind', async () => {
    const sdk = fakeSdk({ sendOTP: vi.fn().mockResolvedValueOnce({ type: 'success', message: 'req-1' }).mockResolvedValueOnce({ type: 'error', message: 'nope' }) });
    const { client } = await started(sdk);
    expect(await fails(client.start('9876543210'))).toBe('OTP_SEND_FAILED');
    expect(client.hasRequest()).toBe(false);
  });
});
