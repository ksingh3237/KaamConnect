import { describe, expect, it } from 'vitest';
import { jobStep } from './jobStep';

describe('jobStep', () => {
  it('sends the worker to the arrival code when the job is theirs, and to the bill once the code is accepted', () => {
    expect(jobStep('ASSIGNED', 'worker')).toEqual({ section: 'arrival', level: 'loud' });
    expect(jobStep('ARRIVED', 'worker')).toEqual({ section: 'bill', level: 'soft' });
  });

  it('buzzes hard for the two waits that hold someone up: the cost approval and the finished bill', () => {
    expect(jobStep('IN_PROGRESS', 'worker')?.level).toBe('loud');
    expect(jobStep('WORK_COMPLETED', 'customer')).toEqual({ section: 'actions', level: 'loud' });
  });

  it('puts the customer on the action they own: approve the cost on arrival, pay when the work is done', () => {
    expect(jobStep('ARRIVED', 'customer')).toEqual({ section: 'actions', level: 'loud' });
    expect(jobStep('IN_PROGRESS', 'customer')?.section).toBe('photos');
  });

  it('shows both sides the cancellation notice, and nothing for a request still waiting for a worker', () => {
    expect(jobStep('CANCELLED', 'worker')?.section).toBe('cancelled');
    expect(jobStep('CANCELLED', 'customer')?.section).toBe('cancelled');
    expect(jobStep('OPEN', 'customer')).toBeNull();
    expect(jobStep('OPEN', 'worker')).toBeNull();
  });

  it('does not scroll the customer anywhere just because a worker accepted - the map above is the news', () => {
    expect(jobStep('ASSIGNED', 'customer')).toEqual({ section: null, level: 'loud' });
  });
});
