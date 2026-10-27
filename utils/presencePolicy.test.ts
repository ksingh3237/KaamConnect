import { describe, expect, it } from 'vitest';
import { isPresenceDue, PRESENCE_INTERVAL_MS, PRESENCE_MIN_GAP_MS } from './presencePolicy';

describe('isPresenceDue', () => {
  it('is due when nothing was ever sent', () => {
    expect(isPresenceDue(null, 1_000, PRESENCE_MIN_GAP_MS)).toBe(true);
  });

  it('waits out the gap and is due exactly when it has passed', () => {
    const sent = 1_000_000;
    expect(isPresenceDue(sent, sent + PRESENCE_MIN_GAP_MS - 1, PRESENCE_MIN_GAP_MS)).toBe(false);
    expect(isPresenceDue(sent, sent + PRESENCE_MIN_GAP_MS, PRESENCE_MIN_GAP_MS)).toBe(true);
  });

  it('refreshes well inside the 30 minutes the server trusts a fix for', () => {
    expect(PRESENCE_INTERVAL_MS).toBeLessThan(30 * 60 * 1000 / 2);
    expect(PRESENCE_MIN_GAP_MS).toBeLessThan(PRESENCE_INTERVAL_MS);
  });
});
