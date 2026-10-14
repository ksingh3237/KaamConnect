// Every API call the app makes, typed. Screens import from here and never build URLs themselves.
import { del, get, patch, post, put } from './client';
import { toE164 } from './phone';
import type {
  BillItemKind,
  BillView,
  CreateJobBody,
  CreatedJob,
  DocumentType,
  Earnings,
  JobListPage,
  JobTab,
  JobView,
  Lang,
  LeadDetail,
  LeadItem,
  LocationCity,
  MeView,
  OfferForCustomer,
  OtpRequestResult,
  Page,
  PaymentMethod,
  PaymentView,
  PutCustomerBody,
  PutWorkerBody,
  Receipt,
  ReviewTag,
  ReviewView,
  Savings,
  ServiceCategory,
  Tracking,
  VerifyResult,
  WorkerCard,
  WorkerJobsPage,
  WorkerView,
  CustomerView,
  OfferSummary,
  SosStatusView,
} from './types';

export { toE164 };

// ── auth (public)
export const requestOtp = (phone: string) =>
  post<OtpRequestResult>('/auth/otp/request', { phone: toE164(phone) }, { auth: false });
export const verifyOtp = (phone: string, code: string) =>
  post<VerifyResult>('/auth/otp/verify', { phone: toE164(phone), code }, { auth: false });
/** Firebase Phone Authentication: trades the Firebase ID token for our own session (same reply as verifyOtp). */
export const verifyFirebase = (idToken: string) => post<VerifyResult>('/auth/firebase/verify', { idToken }, { auth: false });
export const logout = (refreshToken: string) => post<void>('/auth/logout', { refreshToken });

// ── account
export const getMe = () => get<MeView>('/me');
export const patchMe = (body: { language: Lang }) => patch<MeView>('/me', body);
/**
 * Deletes the account (anonymisation). The proof is ONE of: `code` (a fresh SMS code for the account's own number, development
 * OTP) or `firebaseIdToken` (a Firebase phone sign-in done just now for that number). The server also refuses while a job is active.
 */
export type DeletionProof = { code: string } | { firebaseIdToken: string };
export const deleteAccount = (proof: DeletionProof) => del<void>('/me', { body: { ...proof, confirm: true } });
export const getSavings = (role?: 'customer' | 'worker') => get<Savings>('/me/savings', { query: { role } });

// ── reference data
export const getLocations = () => get<LocationCity[]>('/locations');
export const getCategories = () => get<ServiceCategory[]>('/service-categories');

// ── profiles
export const putCustomer = (body: PutCustomerBody) => put<CustomerView>('/customers/me', body);
export const getCustomer = () => get<CustomerView>('/customers/me');
export const putWorker = (body: PutWorkerBody) => put<WorkerView>('/workers/me', body);
export const getWorkerProfile = () => get<WorkerView>('/workers/me');
export const putWorkerDocument = (type: DocumentType, key: string) =>
  put<WorkerView>(`/workers/me/documents/${type}`, { key });
export const putWorkerLocation = (lat: number, lng: number) => put<void>('/workers/me/location', { lat, lng });
export const getEarnings = (period: 'today' | 'week' | 'month' = 'today') =>
  get<Earnings>('/workers/me/earnings', { query: { period } });

// ── discovery (customer)
export const listWorkers = (query: { categoryId?: string; areaId?: number; sort?: 'distance' | 'rating'; limit?: number; cursor?: string }) =>
  get<Page<WorkerCard>>('/workers', { query });

// ── jobs (customer)
// The server does not implement idempotency keys (docs/03 lists it as later), so a double tap is prevented on the
// screen by disabling the button while the request is in flight.
export const createJob = (body: CreateJobBody) => post<CreatedJob>('/jobs', body);
export const createDirectBooking = (body: CreateJobBody & { workerId: string }) => post<CreatedJob>('/jobs/direct-booking', body);
export const listMyJobs = (tab: JobTab, cursor?: string) =>
  get<JobListPage>('/customers/me/jobs', { query: { tab, limit: 20, cursor } });
export const getJob = (id: string) => get<JobView>(`/jobs/${id}`);
export const listOffers = (jobId: string, sort: 'fee' | 'eta' = 'fee') =>
  get<OfferForCustomer[]>(`/jobs/${jobId}/offers`, { query: { sort } });
export const acceptOffer = (jobId: string, offerId: string) => post<JobView>(`/jobs/${jobId}/offers/${offerId}/accept`);
export const cancelJob = (jobId: string, reason?: string) => post<JobView>(`/jobs/${jobId}/cancel`, reason ? { reason } : {});
export const getTracking = (jobId: string) => get<Tracking>(`/jobs/${jobId}/tracking`);
export const getBill = (jobId: string) => get<BillView>(`/jobs/${jobId}/bill`);
export const approveBill = (jobId: string, expectedTotal: number) => post<BillView>(`/jobs/${jobId}/bill/approve`, { expectedTotal });
export const payJob = (jobId: string, method: PaymentMethod) => post<PaymentView>(`/jobs/${jobId}/payment`, { method });
export const getReceipt = (jobId: string) => get<Receipt>(`/jobs/${jobId}/receipt`);
export const reviewJob = (jobId: string, body: { rating: number; tags: ReviewTag[]; tipAmount?: number }) =>
  post<ReviewView>(`/jobs/${jobId}/review`, body);
export const resetArrivalCode = (jobId: string) => post<JobView>(`/jobs/${jobId}/arrival-code/reset`);

// ── leads and quotes (worker)
export const listLeads = (query: { filter?: 'all' | 'immediate' | 'scheduled'; categoryId?: string; cursor?: string } = {}) =>
  get<Page<LeadItem>>('/leads', { query: { limit: 20, ...query } });
export const getLead = (id: string) => get<LeadDetail>(`/leads/${id}`);
export const sendOffer = (leadId: string, body: { visitFee: number; etaMinutes: number; message?: string }) =>
  post<OfferSummary>(`/leads/${leadId}/offers`, body);
export const declineLead = (leadId: string) => post<void>(`/leads/${leadId}/decline`);
export const listWorkerJobs = (tab: JobTab, cursor?: string) =>
  get<WorkerJobsPage>('/workers/me/jobs', { query: { tab, limit: 20, cursor } });
export const acceptDirect = (jobId: string) => post<JobView>(`/jobs/${jobId}/direct/accept`);
export const declineDirect = (jobId: string) => post<JobView>(`/jobs/${jobId}/direct/decline`);

// ── fulfilment (worker)
export const verifyArrival = (jobId: string, code: string) => post<JobView>(`/jobs/${jobId}/arrival`, { code });
export const putBillItems = (jobId: string, items: { kind: Exclude<BillItemKind, 'VISIT_FEE'>; description: string; amount: number }[]) =>
  put<BillView>(`/jobs/${jobId}/bill-items`, { items });
export const addWorkPhoto = (jobId: string, kind: 'BEFORE' | 'AFTER', key: string) =>
  post<JobView>(`/jobs/${jobId}/work-photos`, { kind, key });
export const completeWork = (jobId: string) => post<JobView>(`/jobs/${jobId}/complete-work`);

// ── safety
export const raiseSos = (jobId: string, position?: { lat: number; lng: number }) =>
  post<SosStatusView & { repeated: boolean }>(`/jobs/${jobId}/sos`, position ?? {});
/** The caller's own SOS alerts on this job: sent, received by the safety desk, acknowledged, resolved. */
export const getSosStatus = (jobId: string) => get<SosStatusView[]>(`/jobs/${jobId}/sos`);

export { del };
