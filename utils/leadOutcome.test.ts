import { afterEach, describe, expect, it } from 'vitest';
import type { LeadOutcome } from '../api/types';
import { setCurrentLanguage } from '../i18n';
import { isClosedOutcome, outcomeNotice } from './leadOutcome';

const ALL: LeadOutcome[] = ['QUOTE_DECLINED', 'CANCELLED_BY_CUSTOMER', 'TAKEN_BY_OTHER', 'EXPIRED', 'CLOSED'];

describe('isClosedOutcome', () => {
  it('an open lead, or one from a server that sends no outcome, is not closed', () => {
    expect(isClosedOutcome(null)).toBe(false);
    expect(isClosedOutcome(undefined)).toBe(false);
  });

  it('a declined quote can be sent again; every other outcome is the end', () => {
    expect(isClosedOutcome('QUOTE_DECLINED')).toBe(false);
    for (const outcome of ALL.filter((o) => o !== 'QUOTE_DECLINED')) expect(isClosedOutcome(outcome)).toBe(true);
  });
});

describe('outcomeNotice', () => {
  afterEach(() => setCurrentLanguage('en'));

  it('says nothing for an open lead', () => {
    expect(outcomeNotice({ outcome: null })).toBeNull();
    expect(outcomeNotice({})).toBeNull();
  });

  it('names the customer cancellation plainly, as closed', () => {
    expect(outcomeNotice({ outcome: 'CANCELLED_BY_CUSTOMER' })).toEqual({
      title: 'Cancelled by customer',
      hint: 'The customer cancelled this request. There is nothing more to do.',
      tone: 'closed',
    });
  });

  it('agrees with isClosedOutcome for every outcome, and every one has words', () => {
    for (const outcome of ALL) {
      const notice = outcomeNotice({ outcome })!;
      expect(notice.title.length).toBeGreaterThan(0);
      expect(notice.tone === 'closed').toBe(isClosedOutcome(outcome));
    }
  });

  it('follows the chosen language', () => {
    setCurrentLanguage('hi');
    expect(outcomeNotice({ outcome: 'CANCELLED_BY_CUSTOMER' })!.title).not.toBe('Cancelled by customer');
  });
});
