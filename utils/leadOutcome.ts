// What became of a lead, in words the worker reads on the radar card and on the lead screen. The server decides the
// outcome (leads.service / lead-outcome.ts); this only says it, so the card and the screen never disagree.
import type { LeadItem, LeadOutcome } from '../api/types';
import { t } from '../i18n';

export interface OutcomeNotice {
  /** Short: the card's status line and the screen's banner heading. */
  title: string;
  /** One sentence: what it means for the worker. */
  hint: string;
  /** 'retry': the worker may still quote (declined quote). 'closed': nothing left to do. */
  tone: 'retry' | 'closed';
}

/** True when the lead is over: no quote form, no "Send quote" button. A declined quote is not over. */
export function isClosedOutcome(outcome: LeadOutcome | null | undefined): boolean {
  return outcome !== null && outcome !== undefined && outcome !== 'QUOTE_DECLINED';
}

export function outcomeNotice(lead: Pick<LeadItem, 'outcome'>): OutcomeNotice | null {
  switch (lead.outcome) {
    case 'QUOTE_DECLINED':
      return { title: t('Customer declined your quote'), hint: t('The request is still open. You can send a new quote.'), tone: 'retry' };
    case 'CANCELLED_BY_CUSTOMER':
      return { title: t('Cancelled by customer'), hint: t('The customer cancelled this request. There is nothing more to do.'), tone: 'closed' };
    case 'TAKEN_BY_OTHER':
      return { title: t('Customer chose another worker'), hint: t('This request is closed. New jobs will keep coming to your radar.'), tone: 'closed' };
    case 'EXPIRED':
      return { title: t('Request expired'), hint: t('Nobody was chosen in time, so this request is closed.'), tone: 'closed' };
    case 'CLOSED':
      return { title: t('Request closed'), hint: t('This request is no longer open.'), tone: 'closed' };
    default:
      return null;
  }
}
