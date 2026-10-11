// One error type for everything the API (or the network) can go wrong with, plus the text the user sees.
// The server sends machine-readable codes and no user text (see docs/03-api-spec.md section 1); the wording lives here.

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

const MESSAGES: Record<string, string> = {
  NETWORK: 'Cannot reach the server. Check your connection and try again. / सर्वर से संपर्क नहीं हो सका',
  TIMEOUT: 'The server took too long to answer. Please try again. / सर्वर ने जवाब देने में बहुत समय लिया',
  OTP_INVALID: 'That code is wrong or has expired. / कोड गलत है या समाप्त हो गया',
  OTP_LOCKED: 'Too many wrong codes. Request a new code. / बहुत गलत कोड, नया कोड मंगाएं',
  OTP_COOLDOWN: 'Please wait a moment before asking for another code. / कृपया थोड़ा रुकें',
  OTP_LIMIT: 'Too many codes requested. Try again later. / बहुत अधिक कोड मांगे गए, बाद में प्रयास करें',
  OTP_SEND_FAILED: 'We could not send the code. Please try again. / कोड नहीं भेजा जा सका',
  UNAUTHENTICATED: 'Your session has ended. Please sign in again. / कृपया दोबारा लॉगिन करें',
  ACCOUNT_DISABLED: 'This account has been disabled. Please contact support. / यह खाता बंद है',
  TOO_MANY_REQUESTS: 'Too many requests. Please wait a moment. / बहुत अधिक अनुरोध, थोड़ी देर रुकें',
  VALIDATION_FAILED: 'Please check the highlighted details. / कृपया जानकारी जांचें',
  NOT_FOUND: 'We could not find that. / यह नहीं मिला',
  JOB_NOT_OPEN: 'This request is no longer open. / यह अनुरोध अब खुला नहीं है',
  OFFER_UNAVAILABLE: 'That quote is not available right now. Choose another. / यह कोटेशन अभी उपलब्ध नहीं',
  OFFER_EXISTS: 'You have already sent a quote for this job. / आप पहले ही कोटेशन भेज चुके हैं',
  WORKER_UNAVAILABLE: 'That worker can no longer make this time. / कारीगर इस समय उपलब्ध नहीं',
  CODE_LOCKED: 'Too many wrong codes. Ask the customer for a new code. / ग्राहक से नया कोड मांगें',
  ACTIVE_JOB_BLOCKS_DELETION: 'Finish or cancel your active jobs before deleting your account.',
  ADMIN_CANNOT_DELETE_SELF: 'An admin account cannot be deleted from the app.',
  STORAGE_UNAVAILABLE: 'We could not remove your files right now, so nothing was deleted. Please try again. / फ़ाइलें अभी नहीं हटाई जा सकीं',
  SOS_NOT_AVAILABLE: 'SOS is available while a worker is assigned to your job. If you are in danger, call 112.',
  NOT_VERIFIED: 'Your worker profile is not verified yet. / आपकी प्रोफ़ाइल अभी सत्यापित नहीं है',
  CUSTOMER_PROFILE_REQUIRED: 'Please complete your customer profile first. / पहले प्रोफ़ाइल पूरा करें',
  WORKER_PROFILE_REQUIRED: 'Please complete your worker profile first. / पहले प्रोफ़ाइल पूरा करें',
};

/** Text for the user. Field-level problems are shown beside their fields; this is the general line. */
export function userMessage(error: unknown): string {
  if (isApiError(error)) {
    const known = MESSAGES[error.code];
    if (known) {
      if (error.code === 'TOO_MANY_REQUESTS' || error.code === 'OTP_COOLDOWN' || error.code === 'OTP_LIMIT') {
        return error.retryAfterSec ? `${known} (${error.retryAfterSec}s)` : known;
      }
      return known;
    }
    if (error.status >= 500) return 'Something went wrong on our side. Please try again. / कुछ गड़बड़ हुई, दोबारा प्रयास करें';
    return error.message || 'Something went wrong. / कुछ गलत हुआ';
  }
  return 'Something went wrong. / कुछ गलत हुआ';
}
