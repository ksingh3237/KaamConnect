// What a person is asked, and told, when they cancel a job. Pure (no React) so it is unit-tested.
//
// The server decides everything that matters (which codes exist, whether the request re-opens, what is owed); this file
// only chooses which reasons to OFFER at each stage and words the consequence. WORKER_FAULT mirrors the server's
// `workerFault` flags in KaamConnectBackendAPI/src/modules/jobs/cancel-reasons.ts and only changes the wording.
// Everything is worded in the person's language (i18n); the server stores and sends its labels in English.
import type { BackOutSummary, CancelActor, CancelReasonCode, CancelStage, JobView } from '../api/types';
import { t } from '../i18n';

export interface ReasonOption {
  code: CancelReasonCode;
  label: string;
}

/** The server's English label of each reason (cancel-reasons.ts there): what comes back as a cancellation's reason. */
const SERVER_LABELS: Record<string, CancelReasonCode> = {
  'Vehicle problem': 'VEHICLE_PROBLEM',
  'Personal emergency': 'PERSONAL_EMERGENCY',
  'Double-booked': 'DOUBLE_BOOKED',
  'Too far to reach in time': 'TOO_FAR',
  'Cannot do this work': 'CANT_DO_WORK',
  'Customer is not answering': 'CUSTOMER_UNREACHABLE',
  'Address is wrong or cannot be found': 'WRONG_ADDRESS',
  'Customer asked me to cancel': 'CUSTOMER_ASKED',
  'Could not agree on the price': 'PRICE_DISAGREEMENT',
  'The location felt unsafe': 'UNSAFE_LOCATION',
  'Changed my mind': 'CHANGED_MIND',
  'Found another worker': 'FOUND_ANOTHER',
  'The worker is taking too long': 'WORKER_LATE',
  'Cannot reach the worker': 'WORKER_UNREACHABLE',
  'Posted by mistake': 'POSTED_BY_MISTAKE',
  'The price is too high': 'PRICE_TOO_HIGH',
  'Other reason': 'OTHER',
};

/** A reason's label in the person's language. */
function labelFor(code: CancelReasonCode): string {
  switch (code) {
    case 'VEHICLE_PROBLEM':
      return t('Vehicle problem');
    case 'PERSONAL_EMERGENCY':
      return t('Personal emergency');
    case 'DOUBLE_BOOKED':
      return t('Double-booked');
    case 'TOO_FAR':
      return t('Too far to reach in time');
    case 'CANT_DO_WORK':
      return t('Cannot do this work');
    case 'CUSTOMER_UNREACHABLE':
      return t('Customer is not answering');
    case 'WRONG_ADDRESS':
      return t('Address is wrong or cannot be found');
    case 'CUSTOMER_ASKED':
      return t('Customer asked me to cancel');
    case 'PRICE_DISAGREEMENT':
      return t('Could not agree on the price');
    case 'UNSAFE_LOCATION':
      return t('The location felt unsafe');
    case 'CHANGED_MIND':
      return t('Changed my mind');
    case 'FOUND_ANOTHER':
      return t('Found another worker');
    case 'WORKER_LATE':
      return t('The worker is taking too long');
    case 'WORKER_UNREACHABLE':
      return t('Cannot reach the worker');
    case 'POSTED_BY_MISTAKE':
      return t('Posted by mistake');
    case 'PRICE_TOO_HIGH':
      return t('The price is too high');
    case 'OTHER':
      return t('Other reason');
  }
}

const KNOWN_CODES = new Set<string>(Object.values(SERVER_LABELS));

/** The reasons offered at each stage, most likely first. `OTHER` is always last and asks for a few words. */
const OFFERED: Record<CancelActor, Record<CancelStage, CancelReasonCode[]>> = {
  WORKER: {
    OPEN: [],
    ASSIGNED: [
      'VEHICLE_PROBLEM',
      'PERSONAL_EMERGENCY',
      'DOUBLE_BOOKED',
      'TOO_FAR',
      'CUSTOMER_UNREACHABLE',
      'WRONG_ADDRESS',
      'CUSTOMER_ASKED',
      'UNSAFE_LOCATION',
      'OTHER',
    ],
    ARRIVED: ['CANT_DO_WORK', 'PRICE_DISAGREEMENT', 'CUSTOMER_ASKED', 'UNSAFE_LOCATION', 'PERSONAL_EMERGENCY', 'OTHER'],
  },
  CUSTOMER: {
    OPEN: ['CHANGED_MIND', 'FOUND_ANOTHER', 'POSTED_BY_MISTAKE', 'OTHER'],
    ASSIGNED: ['WORKER_LATE', 'WORKER_UNREACHABLE', 'FOUND_ANOTHER', 'CHANGED_MIND', 'POSTED_BY_MISTAKE', 'OTHER'],
    ARRIVED: ['PRICE_TOO_HIGH', 'CHANGED_MIND', 'OTHER'],
  },
};

/** Worker reasons that are the worker's own doing: they count towards the repeat back-out warning. */
const WORKER_FAULT: ReadonlySet<CancelReasonCode> = new Set(['VEHICLE_PROBLEM', 'PERSONAL_EMERGENCY', 'DOUBLE_BOOKED', 'TOO_FAR', 'CANT_DO_WORK', 'OTHER']);

export function reasonsFor(actor: CancelActor, stage: CancelStage): ReasonOption[] {
  return OFFERED[actor][stage].map((code) => ({ code, label: labelFor(code) }));
}

export const labelOfCode = (code: string): string => (KNOWN_CODES.has(code) ? labelFor(code as CancelReasonCode) : code);

/** A reason as the server sent it: a listed label is shown in the person's language, their own typed words as written. */
export function reasonText(text: string): string {
  if (text === 'No reason given') return t('No reason was given.');
  if (text === 'The worker did not arrive in time') return t('The worker did not arrive in time.');
  const code = SERVER_LABELS[text];
  return code ? labelFor(code) : text;
}

/** `OTHER` is the only reason that needs the person's own words (the server refuses it without them). */
export const needsNote = (code: CancelReasonCode | null): boolean => code === 'OTHER';

export interface CancelCopy {
  title: string;
  intro: string;
  confirmLabel: string;
}

/** The heading and the first paragraph of the cancel sheet. `visitFee` is the worker's visit fee in rupees, when known. */
export function cancelCopy(actor: CancelActor, stage: CancelStage, visitFee?: number | null): CancelCopy {
  const fee = visitFee && visitFee > 0 ? `₹${visitFee}` : t('the visit fee');
  if (actor === 'WORKER') {
    return stage === 'ARRIVED'
      ? {
          title: t('Leave this job?'),
          intro: t('You are already at the customer’s place. Tell them why you cannot do the work. They are told straight away.'),
          confirmLabel: t('Leave the job'),
        }
      : {
          title: t('Cancel this job?'),
          intro: t('Tell the customer why you cannot come. They are told straight away, so please do it as early as you can.'),
          confirmLabel: t('Cancel the job'),
        };
  }
  if (stage === 'ARRIVED') {
    return {
      title: t('Decline the cost and cancel?'),
      intro: t('The worker has already come to you, so {fee} is payable to them directly. They are told straight away.', { fee }),
      confirmLabel: t('Decline and cancel'),
    };
  }
  return stage === 'ASSIGNED'
    ? {
        title: t('Cancel with the worker on the way?'),
        intro: t('Your worker is told straight away. Please cancel only if you really need to, they may already be travelling.'),
        confirmLabel: t('Yes, cancel'),
      }
    : {
        title: t('Cancel this request?'),
        intro: t('Workers who already quoted will be told. You can post it again any time.'),
        confirmLabel: t('Yes, cancel'),
      };
}

/** What will happen, given the reason chosen. Null until a reason is chosen (or when there is nothing more to say). */
export function consequence(actor: CancelActor, stage: CancelStage, code: CancelReasonCode | null, visitFee?: number | null): string | null {
  if (!code || actor !== 'WORKER') return null;
  const fault = WORKER_FAULT.has(code);
  const fee = visitFee && visitFee > 0 ? `₹${visitFee}` : t('the visit fee');
  if (stage === 'ARRIVED') {
    return fault
      ? t('The job is closed and counts as a cancellation on your record. No visit fee is due.')
      : t('The job is closed. The customer is told {fee} is payable to you directly.', { fee });
  }
  return fault
    ? t('The customer’s request goes back to other workers for new quotes. This counts as a cancellation on your record.')
    : t('The job is closed. This does not count against you.');
}

/** The warning shown to a worker who backs out often; null while they are under the limit. */
export function backOutWarning(summary: BackOutSummary | null | undefined): string | null {
  if (!summary?.warn) return null;
  return t('You have cancelled {count} jobs in the last {days} days. Customers rely on you showing up, and repeated cancellations may be reviewed by our team.', {
    count: summary.recent,
    days: summary.windowDays,
  });
}

type CancelledJob = Pick<JobView, 'cancellation' | 'cancelledBy' | 'cancelReason'>;

/** The line a cancelled job opens with, from the point of view of whoever is looking at it. */
export function cancelledHeadline(job: CancelledJob, viewer: 'customer' | 'worker'): string {
  const by = job.cancellation?.by ?? (job.cancelledBy === 'WORKER' || job.cancelledBy === 'CUSTOMER' ? job.cancelledBy : null);
  // A direct request the worker said no to carries no cancellation record, only the system code
  if (job.cancelReason === 'DECLINED' && !job.cancellation) return viewer === 'customer' ? t('The worker declined your request') : t('You declined this request');
  if (job.cancellation?.by === 'SYSTEM') return viewer === 'worker' ? t('You did not arrive in time') : t('Your worker did not arrive');
  if (!by) return t('This request was closed');
  if ((by === 'WORKER') === (viewer === 'worker')) return t('You cancelled this job');
  return by === 'WORKER' ? t('The worker cancelled this job') : t('The customer cancelled this job');
}

/** Why it was cancelled, in the person's own words if they gave any. */
export function cancelledReason(job: CancelledJob, viewer: 'customer' | 'worker' = 'customer'): string {
  if (job.cancellation?.by === 'SYSTEM')
    return viewer === 'worker'
      ? t('The job was released because you had not arrived. This counts as a cancellation on your record.')
      : t('The worker did not arrive in time. You can post the request again.');
  if (job.cancellation?.reason) return reasonText(job.cancellation.reason);
  if (job.cancelReason === 'DECLINED')
    return viewer === 'customer' ? t('The worker you asked for could not take this job. You can choose another worker.') : t('You said no to this request.');
  if (job.cancelReason === 'EXPIRED') return t('Nobody answered in time. You can choose another worker.');
  return job.cancelReason ? reasonText(job.cancelReason) : t('No reason was given.');
}

/** The visit fee owed directly to the worker, as a sentence for the person looking; null when nothing is owed. */
export function visitFeeNotice(job: Pick<JobView, 'cancellation'>, viewer: 'customer' | 'worker'): string | null {
  const fee = job.cancellation?.visitFeeDue;
  if (!fee || fee <= 0) return null;
  return viewer === 'worker'
    ? t('The visit fee of ₹{fee} is payable to you directly by the customer. KaamConnect does not handle this money.', { fee })
    : t('The visit fee of ₹{fee} is payable to the worker directly. KaamConnect does not handle this money.', { fee });
}

/** What the person is told after a successful cancel, given what the server did with the job. */
export function cancelledMessage(actor: CancelActor, reopened: boolean): { title: string; message: string } {
  if (actor === 'CUSTOMER') return { title: t('Cancelled'), message: t('The worker has been told.') };
  return reopened
    ? { title: t('Job released'), message: t('The customer has been told and their request is open to other workers again.') }
    : { title: t('Job cancelled'), message: t('The customer has been told.') };
}
