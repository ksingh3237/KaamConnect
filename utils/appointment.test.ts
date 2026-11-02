import { describe, expect, it } from 'vitest';
import { EARLY_ARRIVAL_MIN, arrivalOpensAt, defaultSlot, hourLabel, isBooked, slotsFor } from './appointment';

const ist = (local: string) => Date.parse(`${local}+05:30`);

describe('slotsFor', () => {
  it('Afternoon offers 12 PM to 7 PM today, only the ones at least 30 minutes away', () => {
    expect(slotsFor('AFTERNOON', ist('2026-11-02T09:00:00')).map((s) => s.hour)).toEqual([12, 13, 14, 15, 16, 17, 18, 19]);
    expect(slotsFor('AFTERNOON', ist('2026-11-02T15:40:00')).map((s) => s.hour)).toEqual([17, 18, 19]);
    expect(slotsFor('AFTERNOON', ist('2026-11-02T18:30:00')).map((s) => s.hour)).toEqual([19]);
    // The evening: nothing left, so the Afternoon choice is hidden (the server refuses it as well)
    expect(slotsFor('AFTERNOON', ist('2026-11-02T18:31:00'))).toEqual([]);
    expect(slotsFor('AFTERNOON', ist('2026-11-02T20:45:00'))).toEqual([]);
  });

  it('Tomorrow is the next IST day, 8 AM to 8 PM, sent with the +05:30 offset', () => {
    const slots = slotsFor('TOMORROW', ist('2026-11-02T23:50:00'));
    expect(slots.map((s) => s.hour)).toEqual([8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20]);
    expect(slots[2]).toMatchObject({ iso: '2026-11-03T10:00:00+05:30', at: ist('2026-11-03T10:00:00') });
    // Just after midnight IST (still the previous day in UTC) "tomorrow" is the day after
    expect(slotsFor('TOMORROW', ist('2026-11-03T00:10:00'))[0]!.iso).toBe('2026-11-04T08:00:00+05:30');
  });

  it('Immediate has no slots', () => {
    expect(slotsFor('IMMEDIATE', ist('2026-11-02T10:00:00'))).toEqual([]);
  });
});

describe('defaultSlot', () => {
  it('is 2 PM this afternoon, or the first one left; 10 AM tomorrow; none in the evening', () => {
    expect(defaultSlot('AFTERNOON', ist('2026-11-02T09:00:00'))!.hour).toBe(14);
    expect(defaultSlot('AFTERNOON', ist('2026-11-02T15:00:00'))!.hour).toBe(16);
    expect(defaultSlot('TOMORROW', ist('2026-11-02T21:00:00'))!.iso).toBe('2026-11-03T10:00:00+05:30');
    expect(defaultSlot('AFTERNOON', ist('2026-11-02T20:00:00'))).toBeNull();
  });
});

describe('hourLabel', () => {
  it('writes a 12-hour clock', () => {
    expect([8, 11, 12, 14, 20].map(hourLabel)).toEqual(['8 AM', '11 AM', '12 PM', '2 PM', '8 PM']);
  });
});

describe('isBooked / arrivalOpensAt', () => {
  const at10 = '2026-11-03T10:00:00+05:30';

  it('an accepted job for tomorrow is booked, not on the way, until an hour before', () => {
    expect(EARLY_ARRIVAL_MIN).toBe(60);
    expect(arrivalOpensAt(at10)).toBe(ist('2026-11-03T09:00:00'));
    expect(isBooked({ status: 'ASSIGNED', scheduledFor: at10 }, ist('2026-11-02T20:40:00'))).toBe(true);
    expect(isBooked({ status: 'ASSIGNED', scheduledFor: at10 }, ist('2026-11-03T08:59:00'))).toBe(true);
    expect(isBooked({ status: 'ASSIGNED', scheduledFor: at10 }, ist('2026-11-03T09:00:00'))).toBe(false);
  });

  it('never for an "as soon as possible" job, nor once the worker has arrived', () => {
    expect(isBooked({ status: 'ASSIGNED', scheduledFor: null }, ist('2026-11-02T20:40:00'))).toBe(false);
    expect(isBooked({ status: 'ARRIVED', scheduledFor: at10 }, ist('2026-11-02T20:40:00'))).toBe(false);
    expect(arrivalOpensAt(null)).toBeNull();
  });
});
