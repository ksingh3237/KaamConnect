// One error type for everything the API (or the network) can go wrong with, plus the text the user sees.
// The server sends machine-readable codes and no user text (see docs/03-api-spec.md section 1); the wording lives here.
import { currentLanguage, t } from '../i18n';

export interface FieldIssue {
  field: string;
  issue: string;
}

export class ApiError extends Error {
  constructor(
    public readonly status: number, // 0 = the request never got an answer
    public readonly code: string,
    message: string,
    public readonly details: FieldIssue[] = [],
    public readonly requestId?: string,
    public readonly retryAfterSec?: number,
  ) {
    super(message);
    this.name = 'ApiError';
  }

  /** The issue the server reported for one field, if any. */
  issueFor(field: string): string | undefined {
    return this.details.find((d) => d.field === field)?.issue;
  }
}

export const isApiError = (e: unknown): e is ApiError => e instanceof ApiError;


// Read when the message is shown (not when this file loads), so it follows the language the person chose
const MESSAGES: Record<string, () => string> = {
  NETWORK: () => t('Cannot reach the server. Check your connection and try again.'),
  TIMEOUT: () => t('The server took too long to answer. Please try again.'),
  OTP_INVALID: () => t('That code is wrong or has expired.'),
  OTP_LOCKED: () => t('Too many wrong codes. Request a new code.'),
  OTP_COOLDOWN: () => t('Please wait a moment before asking for another code.'),
  OTP_LIMIT: () => t('Too many codes requested. Try again later.'),
  OTP_EXPIRED: () => t('That code has expired. Request a new one.'),
  OTP_BAD_NUMBER: () => t('Enter a valid 10-digit mobile number.'),
  OTP_CONFIG: () => t('Phone verification is not set up correctly right now. Please try again later.'),
  OTP_PROVIDER_UNAVAILABLE: () => t('The verification service is not reachable right now. Please try again.'),
  OTP_PROVIDER_ERROR: () => t('The verification service gave an unexpected answer. Please try again.'),
  OTP_SESSION_LOST: () => t('This verification has ended. Please enter your number again.'),
  OTP_SEND_FAILED: () => t('We could not send the code. Please try again.'),
  CHANNEL_NOT_AVAILABLE: () => t('Codes on WhatsApp are not available yet. Use SMS.'),
  UNAUTHENTICATED: () => t('Your session has ended. Please sign in again.'),
  TOKEN_EXPIRED: () => t('Your session has ended. Please sign in again.'),
  REFRESH_INVALID: () => t('Your session has ended. Please sign in again.'),
  REFRESH_REUSED: () => t('Your session has ended. Please sign in again.'),
  ACCOUNT_DISABLED: () => t('This account has been disabled. Please contact support.'),
  TOO_MANY_REQUESTS: () => t('Too many requests. Please wait a moment.'),
  VALIDATION_FAILED: () => t('Please check the highlighted details.'),
  NOT_FOUND: () => t('We could not find that.'),
  FORBIDDEN: () => t('That is not allowed. Please try again.'),
  PROFILE_NOT_FOUND: () => t('Please complete your profile first.'),
  JOB_NOT_OPEN: () => t('This request is no longer open.'),
  INVALID_TRANSITION: () => t('This job has just changed, so that is no longer possible. Please check its latest status.'),
  OFFER_UNAVAILABLE: () => t('That quote is not available right now. Choose another.'),
  OFFER_NOT_PENDING: () => t('This quote has already been answered or withdrawn.'),
  OFFER_EXISTS: () => t('You have already sent a quote for this job.'),
  OWN_JOB: () => t('You cannot quote on your own request.'),
  BACKED_OUT: () => t('You backed out of this request, so you cannot quote on it again.'),
  DIRECT_JOB: () => t('This request was sent to one worker, who has to accept it.'),
  DIRECT_LIMIT: () => t('You already have the most worker requests waiting. Wait for an answer first.'),
  JOB_LIMIT: () => t('You have the most open requests allowed. Close one before posting another.'),
  ADDRESS_LIMIT: () => t('You have saved the most addresses allowed. Remove one first.'),
  WORKER_UNAVAILABLE: () => t('That worker can no longer make this time.'),
  WORKER_OFFLINE: () => t('This worker is not taking jobs right now. Post your job to reach other nearby workers.'),
  WORKER_BUSY: () => t('You are already working on another job. Finish it before arriving at this one.'),
  SCHEDULE_CONFLICT: () => t('You already have a booking that clashes with this time.'),
  ARRIVAL_CODE_INVALID: () => t('That code is not right. Check it with the customer.'),
  CODE_LOCKED: () => t('Too many wrong codes. Ask the customer for a new code.'),
  RESET_LIMIT: () => t('No more new codes can be issued for this job. You can cancel it, or call the worker.'),
  RESET_COOLDOWN: () => t('A new code was issued a moment ago. Please wait a little.'),
  RESET_FAILED: () => t('Could not issue a new code just now. Please try again.'),
  BILL_CHANGED: () => t('The bill changed. Review the new total before approving.'),
  BILL_NOT_AVAILABLE: () => t('There is no bill until a worker has been chosen.'),
  PHOTO_LIMIT: () => t('You have added the most photos allowed for this side.'),
  WORK_PHOTOS_REQUIRED: () => t('Add at least one BEFORE and one AFTER photo before marking the work finished.'),
  RECEIPT_NOT_AVAILABLE: () => t('A receipt is available once the payment has been recorded.'),
  TRACKING_NOT_AVAILABLE: () => t('Tracking is available once a worker is on the job.'),
  REVIEW_NOT_ALLOWED: () => t('You can review a job once it is completed and paid.'),
  ALREADY_REVIEWED: () => t('You have already reviewed this job.'),
  DOCUMENTS_MISSING: () => t('Please upload both sides of your Aadhaar card.'),
  ACTIVE_JOB_BLOCKS_DELETION: () => t('Finish or cancel your active jobs before deleting your account.'),
  ADMIN_CANNOT_DELETE_SELF: () => t('An admin account cannot be deleted from the app.'),
  STORAGE_UNAVAILABLE: () => t('We could not remove your files right now, so nothing was deleted. Please try again.'),
  SOS_NOT_AVAILABLE: () => t('SOS is available while a worker is assigned to your job. If you are in danger, call 112.'),
  NOT_VERIFIED: () => t('Your worker profile is not verified yet.'),
  CUSTOMER_PROFILE_REQUIRED: () => t('Please complete your customer profile first.'),
  WORKER_PROFILE_REQUIRED: () => t('Please complete your worker profile first.'),
};

/** Text for the user. Field-level problems are shown beside their fields; this is the general line. */
export function userMessage(error: unknown): string {
  if (isApiError(error)) {
    const known = MESSAGES[error.code]?.();
    if (known) {
      if (error.code === 'TOO_MANY_REQUESTS' || error.code === 'OTP_COOLDOWN' || error.code === 'OTP_LIMIT') {
        return error.retryAfterSec ? `${known} (${error.retryAfterSec}s)` : known;
      }
      return known;
    }
    if (error.status >= 500) return t('Something went wrong on our side. Please try again.');
    // A code this app does not know yet: the server's own words are English, so other languages get the general line
    if (error.message && currentLanguage() === 'en') return error.message;
  }
  return t('Something went wrong. Please try again.');
}
