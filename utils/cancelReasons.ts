// What a person is asked, and told, when they cancel a job. Pure (no React) so it is unit-tested.
//
// The server decides everything that matters (which codes exist, whether the request re-opens, what is owed); this file
// only chooses which reasons to OFFER at each stage and words the consequence. WORKER_FAULT mirrors the server's
// `workerFault` flags in KaamConnectBackendAPI/src/modules/jobs/cancel-reasons.ts and only changes the wording.
import type { BackOutSummary, CancelActor, CancelReasonCode, CancelStage, JobView } from '../api/types';

export interface ReasonOption {
  code: CancelReasonCode;
  label: string;
}

const LABELS: Record<CancelReasonCode, string> = {
  VEHICLE_PROBLEM: 'Vehicle problem / गाड़ी में खराबी',
  PERSONAL_EMERGENCY: 'Personal emergency / निजी आपात स्थिति',
  DOUBLE_BOOKED: 'Double-booked / दूसरा काम बुक है',
  TOO_FAR: 'Too far to reach in time / समय पर पहुंचना मुश्किल',
  CANT_DO_WORK: 'Cannot do this work / यह काम नहीं कर सकता',
  CUSTOMER_UNREACHABLE: 'Customer is not answering / ग्राहक फ़ोन नहीं उठा रहे',
  WRONG_ADDRESS: 'Address is wrong or cannot be found / पता गलत है या नहीं मिल रहा',
  CUSTOMER_ASKED: 'Customer asked me to cancel / ग्राहक ने रद्द करने को कहा',
  PRICE_DISAGREEMENT: 'Could not agree on the price / दाम पर सहमति नहीं बनी',
  UNSAFE_LOCATION: 'The location felt unsafe / जगह सुरक्षित नहीं लगी',
  CHANGED_MIND: 'Changed my mind / इरादा बदल गया',
  FOUND_ANOTHER: 'Found another worker / दूसरा कारीगर मिल गया',
  WORKER_LATE: 'The worker is taking too long / कारीगर को देर हो रही है',
  WORKER_UNREACHABLE: 'Cannot reach the worker / कारीगर से बात नहीं हो रही',
  POSTED_BY_MISTAKE: 'Posted by mistake / गलती से पोस्ट हो गया',
  PRICE_TOO_HIGH: 'The price is too high / दाम बहुत ज़्यादा है',
  OTHER: 'Other reason / कोई और कारण',
};

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
  return OFFERED[actor][stage].map((code) => ({ code, label: LABELS[code] }));
}

export const labelOfCode = (code: string): string => (code in LABELS ? LABELS[code as CancelReasonCode] : code);

/** `OTHER` is the only reason that needs the person's own words (the server refuses it without them). */
export const needsNote = (code: CancelReasonCode | null): boolean => code === 'OTHER';

export interface CancelCopy {
  title: string;
  intro: string;
  confirmLabel: string;
}

/** The heading and the first paragraph of the cancel sheet. `visitFee` is the worker's visit fee in rupees, when known. */
export function cancelCopy(actor: CancelActor, stage: CancelStage, visitFee?: number | null): CancelCopy {
  const fee = visitFee && visitFee > 0 ? `₹${visitFee}` : 'the visit fee';
  if (actor === 'WORKER') {
    return stage === 'ARRIVED'
      ? {
          title: 'Leave this job? / यह जॉब छोड़ें?',
          intro: 'You are already at the customer’s place. Tell them why you cannot do the work. They are told straight away.',
          confirmLabel: 'Leave the job',
        }
      : {
          title: 'Cancel this job? / जॉब रद्द करें?',
          intro: 'Tell the customer why you cannot come. They are told straight away, so please do it as early as you can.',
          confirmLabel: 'Cancel the job',
        };
  }
  if (stage === 'ARRIVED') {
    return {
      title: 'Decline the cost and cancel? / दाम न मानें और रद्द करें?',
      intro: `The worker has already come to you, so ${fee} is payable to them directly. They are told straight away.`,
      confirmLabel: 'Decline and cancel',
    };
  }
  return stage === 'ASSIGNED'
    ? {
        title: 'Cancel with the worker on the way? / रद्द करें?',
        intro: 'Your worker is told straight away. Please cancel only if you really need to, they may already be travelling.',
        confirmLabel: 'Yes, cancel',
      }
    : {
        title: 'Cancel this request? / अनुरोध रद्द करें?',
        intro: 'Workers who already quoted will be told. You can post it again any time.',
        confirmLabel: 'Yes, cancel',
      };
}

/** What will happen, given the reason chosen. Null until a reason is chosen (or when there is nothing more to say). */
export function consequence(actor: CancelActor, stage: CancelStage, code: CancelReasonCode | null, visitFee?: number | null): string | null {
  if (!code || actor !== 'WORKER') return null;
  const fault = WORKER_FAULT.has(code);
  const fee = visitFee && visitFee > 0 ? `₹${visitFee}` : 'the visit fee';
  if (stage === 'ARRIVED') {
    return fault
      ? 'The job is closed and counts as a cancellation on your record. No visit fee is due.'
      : `The job is closed. The customer is told ${fee} is payable to you directly.`;
  }
  return fault
    ? 'The customer’s request goes back to other workers for new quotes. This counts as a cancellation on your record.'
    : 'The job is closed. This does not count against you.';
}

/** The warning shown to a worker who backs out often; null while they are under the limit. */
export function backOutWarning(summary: BackOutSummary | null | undefined): string | null {
  if (!summary?.warn) return null;
  return `You have cancelled ${summary.recent} jobs in the last ${summary.windowDays} days. Customers rely on you showing up, and repeated cancellations may be reviewed by our team.`;
}

type CancelledJob = Pick<JobView, 'cancellation' | 'cancelledBy' | 'cancelReason'>;

/** The line a cancelled job opens with, from the point of view of whoever is looking at it. */
export function cancelledHeadline(job: CancelledJob, viewer: 'customer' | 'worker'): string {
  const by = job.cancellation?.by ?? (job.cancelledBy === 'WORKER' || job.cancelledBy === 'CUSTOMER' ? job.cancelledBy : null);
  // A direct request the worker said no to carries no cancellation record, only the system code
  if (job.cancelReason === 'DECLINED' && !job.cancellation) return viewer === 'customer' ? 'The worker declined your request' : 'You declined this request';
  if (job.cancellation?.by === 'SYSTEM') return viewer === 'worker' ? 'You did not arrive in time' : 'Your worker did not arrive';
  if (!by) return 'This request was closed';
  if ((by === 'WORKER') === (viewer === 'worker')) return 'You cancelled this job';
  return by === 'WORKER' ? 'The worker cancelled this job' : 'The customer cancelled this job';
}

/** Why it was cancelled, in the person's own words if they gave any. */
export function cancelledReason(job: CancelledJob, viewer: 'customer' | 'worker' = 'customer'): string {
  if (job.cancellation?.by === 'SYSTEM')
    return viewer === 'worker'
      ? 'The job was released because you had not arrived. This counts as a cancellation on your record.'
      : 'The worker did not arrive in time. You can post the request again.';
  if (job.cancellation?.reason) return job.cancellation.reason;
  if (job.cancelReason === 'DECLINED') return viewer === 'customer' ? 'The worker you asked for could not take this job. You can choose another worker.' : 'You said no to this request.';
  if (job.cancelReason === 'EXPIRED') return 'Nobody answered in time. You can choose another worker.';
  return job.cancelReason ?? 'No reason was given.';
}

/** The visit fee owed directly to the worker, as a sentence for the person looking; null when nothing is owed. */
export function visitFeeNotice(job: Pick<JobView, 'cancellation'>, viewer: 'customer' | 'worker'): string | null {
  const fee = job.cancellation?.visitFeeDue;
  if (!fee || fee <= 0) return null;
  const who = viewer === 'worker' ? 'payable to you directly by the customer' : 'payable to the worker directly';
  return `The visit fee of ₹${fee} is ${who}. KaamConnect does not handle this money.`;
}

/** What the person is told after a successful cancel, given what the server did with the job. */
export function cancelledMessage(actor: CancelActor, reopened: boolean): { title: string; message: string } {
  if (actor === 'CUSTOMER') return { title: 'Cancelled', message: 'The worker has been told.' };
  return reopened
    ? { title: 'Job released', message: 'The customer has been told and their request is open to other workers again.' }
    : { title: 'Job cancelled', message: 'The customer has been told.' };
}
