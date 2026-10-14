import { describe, expect, it } from 'vitest';
import { resolveAuthMode } from './authMode';

describe('resolveAuthMode', () => {
  it('web always uses the development OTP (Firebase has no web build here), whatever is configured', () => {
    for (const isDev of [true, false]) {
      expect(resolveAuthMode('firebase', 'web', isDev)).toBe('otp');
      expect(resolveAuthMode(undefined, 'web', isDev)).toBe('otp');
    }
  });

  it('a release build on a phone ALWAYS uses Firebase, so the development OTP can never ship', () => {
    for (const platform of ['android', 'ios']) {
      for (const configured of [undefined, '', 'otp', 'firebase', 'FIREBASE', 'anything']) {
        expect(resolveAuthMode(configured, platform, false)).toBe('firebase');
      }
    }
  });

  it('a development build uses Firebase only when asked to', () => {
    for (const platform of ['android', 'ios']) {
      expect(resolveAuthMode(undefined, platform, true)).toBe('otp');
      expect(resolveAuthMode('', platform, true)).toBe('otp');
      expect(resolveAuthMode('otp', platform, true)).toBe('otp');
      expect(resolveAuthMode('firebase', platform, true)).toBe('firebase');
    }
  });

  it('tolerates case and surrounding spaces in the setting', () => {
    expect(resolveAuthMode('  Firebase ', 'android', true)).toBe('firebase');
  });
});
