import { describe, expect, it } from 'vitest';
import { toE164 } from './phone';

describe('toE164', () => {
  it('turns the ways people type an Indian mobile number into E.164', () => {
    for (const typed of ['98765 43210', '9876543210', '+919876543210', '+91 98765 43210', '98765-43210']) {
      expect(toE164(typed)).toBe('+919876543210');
    }
  });

  it('does not invent a country code for other lengths (the server and Firebase then refuse them)', () => {
    expect(toE164('919876543210')).toBe('+919876543210');
    expect(toE164('12345')).toBe('+12345');
  });
});
