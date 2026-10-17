import { describe, expect, it } from 'vitest';
import { jobIdOf, notificationSide, notificationTarget } from './notificationRoutes';

describe('notificationTarget', () => {
  const data = { jobId: 'job-1' };

  it('sends a new quote to the offers comparison with the job active', () => {
    expect(notificationTarget('NEW_QUOTE', data)).toEqual({ side: 'customer', href: '/compare-offers', jobId: 'job-1' });
  });

  it('sends en-route and arrived to tracking', () => {
    expect(notificationTarget('WORKER_EN_ROUTE', data)?.href).toBe('/tracking');
    expect(notificationTarget('WORKER_ARRIVED', data)?.href).toBe('/tracking');
  });

  it('sends bill, completion and booking to job progress', () => {
    for (const type of ['BILL_CREATED', 'WORK_COMPLETED', 'BOOKING_CONFIRMED']) {
      expect(notificationTarget(type, data)?.href).toBe('/job-progress');
    }
  });

  it('opens a lead by id for workers without touching the active job', () => {
    expect(notificationTarget('NEW_LEAD', data)).toEqual({
      side: 'worker',
      href: { pathname: '/lead-offer', params: { id: 'job-1' } },
      jobId: null,
    });
    expect(notificationTarget('DIRECT_REQUEST', data)?.side).toBe('worker');
  });

  it('returns null for an unknown type or a missing job', () => {
    expect(notificationTarget('SOMETHING_NEW', data)).toBeNull();
    expect(notificationTarget('NEW_QUOTE', {})).toBeNull();
    expect(notificationTarget('NEW_QUOTE', { jobId: 7 })).toBeNull();
    expect(notificationTarget('NEW_QUOTE', null)).toBeNull();
  });
});

describe('notificationSide / jobIdOf', () => {
  it('puts worker-facing types on the worker side and the rest on the customer side', () => {
    expect(notificationSide('BOOKING_CONFIRMED')).toBe('worker');
    expect(notificationSide('NEW_LEAD')).toBe('worker');
    expect(notificationSide('BILL_CREATED')).toBe('customer');
  });

  it('only accepts a non-empty string job id', () => {
    expect(jobIdOf({ jobId: 'a' })).toBe('a');
    expect(jobIdOf({ jobId: '' })).toBeNull();
    expect(jobIdOf(undefined)).toBeNull();
  });
});
