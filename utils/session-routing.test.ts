import { describe, expect, it } from 'vitest';
import { resolveRole } from './session-routing';

describe('resolveRole (which side reopens after a restart)', () => {
  it('keeps the remembered side when that profile exists', () => {
    expect(resolveRole('worker', true, true)).toBe('worker');
    expect(resolveRole('customer', true, true)).toBe('customer');
  });
  it('never opens a side the person has no profile for', () => {
    expect(resolveRole('customer', false, true)).toBe('worker');
    expect(resolveRole(null, false, true)).toBe('worker');
    expect(resolveRole('worker', true, false)).toBe('customer');
  });
  it('defaults to customer, and keeps the remembered side while setup is unfinished', () => {
    expect(resolveRole(null, true, false)).toBe('customer');
    expect(resolveRole(null, false, false)).toBe('customer');
    expect(resolveRole('worker', false, false)).toBe('worker');
  });
});
