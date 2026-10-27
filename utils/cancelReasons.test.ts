import { describe, expect, it } from 'vitest';
import type { CancelActor, CancelStage } from '../api/types';
import { backOutWarning, cancelCopy, cancelledHeadline, cancelledMessage, cancelledReason, consequence, labelOfCode, needsNote, reasonsFor, visitFeeNotice } from './cancelReasons';

const ACTORS: CancelActor[] = ['CUSTOMER', 'WORKER'];
const STAGES: CancelStage[] = ['OPEN', 'ASSIGNED', 'ARRIVED'];

describe('reasonsFor', () => {
  it('offers a worker nothing before they are assigned (they cannot cancel a job they do not have)', () => {
    expect(reasonsFor('WORKER', 'OPEN')).toEqual([]);
  });

  it('offers every other stage at least two reasons, always ending with OTHER, never repeating one', () => {
    for (const actor of ACTORS)
      for (const stage of STAGES) {
        if (actor === 'WORKER' && stage === 'OPEN') continue;
        const codes = reasonsFor(actor, stage).map((r) => r.code);
        expect(codes.length).toBeGreaterThanOrEqual(3);
        expect(codes[codes.length - 1]).toBe('OTHER');
        expect(new Set(codes).size).toBe(codes.length);
      }
  });

  it('only offers a worker worker-side codes and a customer customer-side codes', () => {
    const workerOnly = ['VEHICLE_PROBLEM', 'PERSONAL_EMERGENCY', 'DOUBLE_BOOKED', 'TOO_FAR', 'CANT_DO_WORK', 'CUSTOMER_UNREACHABLE', 'WRONG_ADDRESS', 'CUSTOMER_ASKED', 'PRICE_DISAGREEMENT', 'UNSAFE_LOCATION'];
    const customerOnly = ['CHANGED_MIND', 'FOUND_ANOTHER', 'WORKER_LATE', 'WORKER_UNREACHABLE', 'POSTED_BY_MISTAKE', 'PRICE_TOO_HIGH'];
    for (const stage of STAGES) {
      for (const r of reasonsFor('WORKER', stage)) expect([...workerOnly, 'OTHER']).toContain(r.code);
      for (const r of reasonsFor('CUSTOMER', stage)) expect([...customerOnly, 'OTHER']).toContain(r.code);
    }
  });

  it('offers the on-site reasons only once the worker is on site', () => {
    expect(reasonsFor('WORKER', 'ASSIGNED').map((r) => r.code)).not.toContain('CANT_DO_WORK');
    expect(reasonsFor('WORKER', 'ARRIVED').map((r) => r.code)).toContain('CANT_DO_WORK');
    expect(reasonsFor('CUSTOMER', 'ARRIVED').map((r) => r.code)).toContain('PRICE_TOO_HIGH');
    expect(reasonsFor('CUSTOMER', 'OPEN').map((r) => r.code)).not.toContain('PRICE_TOO_HIGH');
  });

  it('gives every reason a readable label, in English and Hindi', () => {
    for (const actor of ACTORS)
      for (const stage of STAGES)
        for (const r of reasonsFor(actor, stage)) {
          expect(r.label).toContain(' / ');
          expect(labelOfCode(r.code)).toBe(r.label);
        }
    expect(labelOfCode('FROM_A_NEWER_SERVER')).toBe('FROM_A_NEWER_SERVER');
  });
});

describe('needsNote', () => {
  it('is only the OTHER reason', () => {
    expect(needsNote('OTHER')).toBe(true);
    expect(needsNote('TOO_FAR')).toBe(false);
    expect(needsNote(null)).toBe(false);
  });
});

describe('cancelCopy', () => {
  it('words the customer declining the cost with the visit fee owed to the worker', () => {
    const copy = cancelCopy('CUSTOMER', 'ARRIVED', 250);
    expect(copy.title).toMatch(/Decline the cost/);
    expect(copy.intro).toContain('₹250');
    expect(copy.intro).toContain('payable to them directly');
  });

  it('does not invent an amount when the fee is unknown', () => {
    expect(cancelCopy('CUSTOMER', 'ARRIVED').intro).toContain('the visit fee');
    expect(cancelCopy('CUSTOMER', 'ARRIVED', 0).intro).not.toContain('₹');
  });

  it('has distinct wording for every stage and side that can cancel', () => {
    const titles = new Set<string>();
    for (const actor of ACTORS)
      for (const stage of STAGES) {
        if (actor === 'WORKER' && stage === 'OPEN') continue;
        const copy = cancelCopy(actor, stage);
        expect(copy.intro.length).toBeGreaterThan(20);
        expect(copy.confirmLabel.length).toBeGreaterThan(3);
        titles.add(copy.title);
      }
    // worker ASSIGNED/ARRIVED + customer OPEN/ASSIGNED/ARRIVED
    expect(titles.size).toBe(5);
  });
});

describe('consequence', () => {
  it('says nothing until a reason is chosen, and nothing to a customer', () => {
    expect(consequence('WORKER', 'ASSIGNED', null)).toBeNull();
    expect(consequence('CUSTOMER', 'ARRIVED', 'PRICE_TOO_HIGH', 250)).toBeNull();
  });

  it('tells a worker a fault reason re-opens the request and counts against them', () => {
    const text = consequence('WORKER', 'ASSIGNED', 'VEHICLE_PROBLEM');
    expect(text).toContain('goes back to other workers');
    expect(text).toContain('counts as a cancellation on your record');
  });

  it('tells a worker a customer-side reason closes the job and does not count', () => {
    const text = consequence('WORKER', 'ASSIGNED', 'CUSTOMER_UNREACHABLE');
    expect(text).toContain('The job is closed');
    expect(text).toContain('does not count against you');
  });

  it('on site: the visit fee is owed only when the worker is not the one at fault', () => {
    expect(consequence('WORKER', 'ARRIVED', 'CANT_DO_WORK', 250)).toContain('No visit fee is due');
    expect(consequence('WORKER', 'ARRIVED', 'PRICE_DISAGREEMENT', 250)).toContain('₹250 is payable to you directly');
  });
});

describe('backOutWarning', () => {
  const summary = { windowDays: 30, warnAt: 3, recent: 3, warn: true };
  it('warns only once the server says so', () => {
    expect(backOutWarning(summary)).toContain('cancelled 3 jobs in the last 30 days');
    expect(backOutWarning({ ...summary, recent: 2, warn: false })).toBeNull();
    expect(backOutWarning(null)).toBeNull();
    expect(backOutWarning(undefined)).toBeNull();
  });
});

describe('cancelledHeadline / cancelledReason / visitFeeNotice', () => {
  const byWorker = { cancellation: { by: 'WORKER' as const, stage: 'ARRIVED' as const, reasonCode: 'PRICE_DISAGREEMENT', reason: 'Could not agree on the price', visitFeeDue: 250 }, cancelledBy: 'WORKER' as const, cancelReason: 'Could not agree on the price' };
  const byCustomer = { cancellation: { by: 'CUSTOMER' as const, stage: 'ASSIGNED' as const, reasonCode: 'CHANGED_MIND', reason: 'Changed my mind', visitFeeDue: null }, cancelledBy: 'CUSTOMER' as const, cancelReason: 'Changed my mind' };
  const expired = { cancellation: undefined, cancelledBy: 'SYSTEM' as const, cancelReason: 'EXPIRED' };

  it('words the headline for whoever is looking', () => {
    expect(cancelledHeadline(byWorker, 'worker')).toBe('You cancelled this job');
    expect(cancelledHeadline(byWorker, 'customer')).toBe('The worker cancelled this job');
    expect(cancelledHeadline(byCustomer, 'customer')).toBe('You cancelled this job');
    expect(cancelledHeadline(byCustomer, 'worker')).toBe('The customer cancelled this job');
  });

  it('calls an expired or older job simply closed', () => {
    expect(cancelledHeadline(expired, 'customer')).toBe('This request was closed');
    expect(cancelledHeadline({ cancellation: undefined, cancelledBy: null, cancelReason: null }, 'worker')).toBe('This request was closed');
  });

  it('words a declined or unanswered direct request in plain language', () => {
    const declined = { cancellation: undefined, cancelledBy: 'WORKER' as const, cancelReason: 'DECLINED' };
    expect(cancelledHeadline(declined, 'customer')).toBe('The worker declined your request');
    expect(cancelledHeadline(declined, 'worker')).toBe('You declined this request');
    expect(cancelledReason(declined)).toContain('could not take this job');
    expect(cancelledReason(declined, 'worker')).toBe('You said no to this request.');
    expect(cancelledReason(expired)).toContain('Nobody answered in time');
  });

  it('falls back to the job\'s own cancel reason, then to a plain sentence', () => {
    expect(cancelledReason(byWorker)).toBe('Could not agree on the price');
    expect(cancelledReason({ cancellation: undefined, cancelledBy: 'CUSTOMER', cancelReason: 'old text' })).toBe('old text');
    expect(cancelledReason({ cancellation: undefined, cancelledBy: null, cancelReason: null })).toBe('No reason was given.');
  });

  it('says who owes the visit fee to whom, only when one is owed', () => {
    expect(visitFeeNotice(byWorker, 'worker')).toBe('The visit fee of ₹250 is payable to you directly by the customer. KaamConnect does not handle this money.');
    expect(visitFeeNotice(byWorker, 'customer')).toBe('The visit fee of ₹250 is payable to the worker directly. KaamConnect does not handle this money.');
    expect(visitFeeNotice(byCustomer, 'worker')).toBeNull();
    expect(visitFeeNotice(expired, 'customer')).toBeNull();
    expect(visitFeeNotice({ cancellation: { ...byWorker.cancellation, visitFeeDue: 0 } }, 'worker')).toBeNull();
  });
});

describe('cancelledMessage', () => {
  it('tells a worker whether the request went back to other workers', () => {
    expect(cancelledMessage('WORKER', true).title).toBe('Job released');
    expect(cancelledMessage('WORKER', false).title).toBe('Job cancelled');
    expect(cancelledMessage('CUSTOMER', false).message).toBe('The worker has been told.');
  });
});
