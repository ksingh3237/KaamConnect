import { describe, expect, it } from 'vitest';
import { availabilityNotice, availabilityQuery } from './serviceAvailability';

const form = {
  categoryId: 'electrician' as string | null,
  areaId: 12 as number | null,
  coords: null as { lat: number | null; lng: number | null } | null,
  timing: 'IMMEDIATE' as const,
  slotIso: null as string | null,
};

describe('availabilityQuery', () => {
  it('cannot ask without a service or a place', () => {
    expect(availabilityQuery({ ...form, categoryId: null })).toBeNull();
    expect(availabilityQuery({ ...form, areaId: null })).toBeNull();
  });

  it('asks about now for an immediate job, with the exact point only when both coordinates are known', () => {
    expect(availabilityQuery(form)).toEqual({ categoryId: 'electrician', areaId: 12, timing: 'IMMEDIATE' });
    expect(availabilityQuery({ ...form, coords: { lat: 30.7, lng: 76.7 } })).toEqual({
      categoryId: 'electrician',
      areaId: 12,
      lat: 30.7,
      lng: 76.7,
      timing: 'IMMEDIATE',
    });
    expect(availabilityQuery({ ...form, coords: { lat: 30.7, lng: null } })).not.toHaveProperty('lat');
  });

  it('asks about the chosen hour for a later job, and never sends a time with Immediate', () => {
    const iso = '2026-11-18T10:00:00+05:30';
    expect(availabilityQuery({ ...form, timing: 'TOMORROW', slotIso: iso })).toMatchObject({ timing: 'TOMORROW', scheduledFor: iso });
    expect(availabilityQuery({ ...form, slotIso: iso })).not.toHaveProperty('scheduledFor');
  });
});

describe('availabilityNotice', () => {
  it('warns when nobody does it here, and when everybody is off or booked', () => {
    expect(availabilityNotice('NONE')?.title).toBe('Service Unavailable');
    expect(availabilityNotice('ALL_BUSY')?.title).toBe('Currently Temporarily Unavailable');
  });

  it('says nothing when someone is available or before the answer arrives', () => {
    expect(availabilityNotice('AVAILABLE')).toBeNull();
    expect(availabilityNotice(null)).toBeNull();
  });
});
