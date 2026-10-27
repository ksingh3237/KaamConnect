import { describe, expect, it } from 'vitest';
import { lateNotice, lateState } from './noShow';

const START = Date.parse('2026-10-28T10:00:00Z');
const job = (over: Record<string, unknown> = {}) =>
  ({
    status: 'ASSIGNED',
    booking: { startAt: new Date(START).toISOString(), endAt: new Date(START + 90 * 60_000).toISOString(), confirmedAt: new Date(START - 1000).toISOString() },
    noShowReleaseAt: new Date(START + 30 * 60_000).toISOString(),
    ...over,
  }) as Parameters<typeof lateState>[0];

describe('lateState', () => {
  it('is not late before the promised arrival', () => {
    expect(lateState(job(), START - 1)).toBeNull();
  });

  it('is late from the promised arrival and counts the minutes to the release', () => {
    expect(lateState(job(), START)?.minutesLeft).toBe(30);
    expect(lateState(job(), START + 10 * 60_000 + 1)?.minutesLeft).toBe(20);
    expect(lateState(job(), START + 40 * 60_000)?.minutesLeft).toBe(0);
  });

  it('only applies to an ASSIGNED job that has a booking and a release time', () => {
    expect(lateState(job({ status: 'ARRIVED' }), START + 60_000)).toBeNull();
    expect(lateState(job({ status: 'CANCELLED' }), START + 60_000)).toBeNull();
    expect(lateState(job({ booking: null }), START + 60_000)).toBeNull();
    expect(lateState(job({ noShowReleaseAt: null }), START + 60_000)).toBeNull();
  });
});

describe('lateNotice', () => {
  const state = lateState(job(), START + 60_000)!;

  it('tells the worker it counts as a cancellation, and the customer they may wait or cancel', () => {
    const worker = lateNotice(state, 'worker');
    expect(worker.title).toContain('You are late');
    expect(worker.body).toContain('counts as a cancellation');
    expect(worker.body).toMatch(/\d{1,2}:\d{2}\s?(am|pm)/i);
    const customer = lateNotice(state, 'customer');
    expect(customer.title).toBe('Your worker is running late');
    expect(customer.body).toContain('keep waiting or cancel');
  });
});
