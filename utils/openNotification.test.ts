import { beforeEach, describe, expect, it, vi } from 'vitest';

const push = vi.hoisted(() => vi.fn());
const session = vi.hoisted(() => ({ me: null as { customer: object | null; worker: object | null } | null }));
const store = vi.hoisted(() => ({
  role: 'customer' as 'customer' | 'worker',
  activeJobId: null as string | null,
  setRole: vi.fn(),
  setActiveJobId: vi.fn(),
}));

vi.mock('expo-router', () => ({ router: { push } }));
vi.mock('../store/useSession', () => ({ useSession: { getState: () => session } }));
vi.mock('../store/useStore', () => ({ useStore: { getState: () => store } }));

import { openNotification } from './openNotification';

const both = { customer: {}, worker: {} };

beforeEach(() => {
  vi.clearAllMocks();
  session.me = both;
  store.role = 'customer';
});

describe('openNotification', () => {
  it('opens the offers comparison for a new quote, with that job active', () => {
    expect(openNotification('NEW_QUOTE', { type: 'NEW_QUOTE', jobId: 'j1' })).toBe(true);
    expect(store.setActiveJobId).toHaveBeenCalledWith('j1');
    expect(store.setRole).not.toHaveBeenCalled(); // already on the customer side
    expect(push).toHaveBeenCalledWith('/compare-offers');
  });

  it('switches a two-sided account to the side the notification belongs to', () => {
    store.role = 'customer';
    openNotification('BOOKING_CONFIRMED', { jobId: 'j2' });
    expect(store.setRole).toHaveBeenCalledWith('worker');
    expect(push).toHaveBeenCalledWith('/job-progress');
  });

  it('opens a lead by id without making it the active job', () => {
    openNotification('NEW_LEAD', { jobId: 'j3' });
    expect(push).toHaveBeenCalledWith({ pathname: '/lead-offer', params: { id: 'j3' } });
    expect(store.setActiveJobId).not.toHaveBeenCalled();
  });

  it('sends en-route and arrived to tracking', () => {
    openNotification('WORKER_EN_ROUTE', { jobId: 'j4' });
    openNotification('WORKER_ARRIVED', { jobId: 'j4' });
    expect(push.mock.calls).toEqual([['/tracking'], ['/tracking']]);
  });

  it('goes nowhere for a worker-only account tapping a customer notification, and the other way round', () => {
    session.me = { customer: null, worker: {} };
    expect(openNotification('NEW_QUOTE', { jobId: 'j5' })).toBe(false);
    session.me = { customer: {}, worker: null };
    expect(openNotification('NEW_LEAD', { jobId: 'j5' })).toBe(false);
    expect(push).not.toHaveBeenCalled();
    expect(store.setRole).not.toHaveBeenCalled();
    expect(store.setActiveJobId).not.toHaveBeenCalled();
  });

  it('goes nowhere when signed out, for an unknown type, or without a job', () => {
    session.me = null;
    expect(openNotification('NEW_QUOTE', { jobId: 'j6' })).toBe(false);
    session.me = both;
    expect(openNotification('FROM_THE_FUTURE', { jobId: 'j6' })).toBe(false);
    expect(openNotification('NEW_QUOTE', {})).toBe(false);
    expect(openNotification('NEW_QUOTE', undefined)).toBe(false);
    expect(push).not.toHaveBeenCalled();
  });
});
