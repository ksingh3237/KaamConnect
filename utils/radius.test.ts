import { describe, expect, it } from 'vitest';
import { reconcileScheduledRadius, scheduledRadiusChoices } from './radius';

describe('scheduledRadiusChoices', () => {
  it('offers only radii larger than the live one', () => {
    expect(scheduledRadiusChoices(3)).toEqual([6, 12, 25, 50]);
    expect(scheduledRadiusChoices(6)).toEqual([12, 25, 50]);
    expect(scheduledRadiusChoices(12)).toEqual([25, 50]);
  });
});

describe('reconcileScheduledRadius', () => {
  it('keeps a choice that is still larger and drops one that no longer is', () => {
    expect(reconcileScheduledRadius(25, 12)).toBe(25);
    expect(reconcileScheduledRadius(12, 12)).toBe(null);
    expect(reconcileScheduledRadius(6, 12)).toBe(null);
    expect(reconcileScheduledRadius(null, 6)).toBe(null);
  });
});
