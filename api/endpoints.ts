// Every API call the app makes, typed. Screens import from here and never build URLs themselves.
import { del, get, patch, post, put } from './client';
import type {
  BillItemKind,
  BillView,
  CancelBody,
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
  NotificationItem,
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
  WorkerCancellations,
  WorkerCard,
  WorkerJobsPage,
  WorkerView,
  CustomerView,
  OfferSummary,
  SosStatusView,
} from './types';

/** "98765 43210", "9876543210" or "+919876543210" all become "+919876543210" (the server also accepts these). */
export const toE164 = (input: string): string => {
  const digits = input.replace(/\D/g, '');
  return digits.length === 10 ? `+91${digits}` : `+${digits}`;
};

// ── auth (public)
export const requestOtp = (phone: string) =>
  post<OtpRequestResult>('/auth/otp/request', { phone: toE164(phone) }, { auth: false });
export const verifyOtp = (phone: string, code: string) =>
  post<VerifyResult>('/auth/otp/verify', { phone: toE164(phone), code }, { auth: false });
/** Real-SMS sign-in: the access token the MSG91 widget returned. The server checks it with MSG91 and takes the number from MSG91, not from the app. */
export const msg91Verify = (accessToken: string) => post<VerifyResult>('/auth/msg91/verify', { accessToken }, { auth: false });
export const logout = (refreshToken: string) => post<void>('/auth/logout', { refreshToken });

// ── account
export const getMe = () => get<MeView>('/me');
export const patchMe = (body: { language: Lang }) => patch<MeView>('/me', body);
/** Deletes the account (anonymisation). `code` is a fresh OTP for the account's own number; the server also refuses while a job is active. */
export const deleteAccount = (code: string) => del<void>('/me', { body: { code, confirm: true } });
export const getSavings = (role?: 'customer' | 'worker') => get<Savings>('/me/savings', { query: { role } });

// ── reference data
export const getLocations = () => get<LocationCity[]>('/locations');
export const getCategories = () => get<ServiceCategory[]>('/service-categories');

// ── profiles
export const putCustomer = (body: PutCustomerBody) => put<CustomerView>('/customers/me', body);
export const getCustomer = () => get<CustomerView>('/customers/me');
export const putWorker = (body: PutWorkerBody) => put<WorkerView>('/workers/me', body);
export const getWorkerProfile = () => get<WorkerView>('/workers/me');
/** Partial update; e.g. the "taking jobs" switch: patchWorker({ isAvailable: false }). */
export const patchWorker = (body: Partial<Omit<PutWorkerBody, 'termsAccepted' | 'scheduledRadiusKm'>> & { isAvailable?: boolean; addressLine?: string | null; localityName?: string | null; scheduledRadiusKm?: number | null }) =>
  patch<WorkerView>('/workers/me', body);
export const putWorkerDocument = (type: DocumentType, key: string) =>
  put<WorkerView>(`/workers/me/documents/${type}`, { key });
/** A short-lived link to the worker's own uploaded document, for showing it back to them. */
export const getWorkerDocumentUrl = (type: DocumentType) =>
  get<{ url: string; expiresInSec: number }>(`/workers/me/documents/${type}/url`);
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
/** Turns one waiting quote down; the worker is told and may quote again. */
export const declineOffer = (jobId: string, offerId: string) => post<{ offerId: string; status: string }>(`/jobs/${jobId}/offers/${offerId}/decline`);
/** One route for both people: the customer cancels, or the assigned worker backs out (the server decides by who owns the job). */
export const cancelJob = (jobId: string, body: CancelBody = {}) => post<JobView>(`/jobs/${jobId}/cancel`, body);
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
/** Change the fee, arrival time or note of a quote that is still waiting for the customer. */
export const reviseOffer = (offerId: string, body: { visitFee: number; etaMinutes: number; message?: string }) =>
  patch<OfferSummary>(`/offers/${offerId}`, body);
/** Take back a quote that is still waiting; the worker may quote again later. */
export const withdrawOffer = (offerId: string) => del<void>(`/offers/${offerId}`);
export const listWorkerJobs = (tab: JobTab, cursor?: string) =>
  get<WorkerJobsPage>('/workers/me/jobs', { query: { tab, limit: 20, cursor } });
/** The worker's own cancellations (a re-opened job leaves their job list, so this is where it is kept) and the repeat back-out warning. */
export const getMyCancellations = () => get<WorkerCancellations>('/workers/me/cancellations');
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

// ── notifications
export const registerDeviceToken = (token: string, platform: 'ANDROID' | 'IOS' | 'WEB') =>
  post<void>('/notifications/device-token', { token, platform });
export const unregisterDeviceToken = (token: string) => del<void>('/notifications/device-token', { body: { token } });
export const listNotifications = (cursor?: string) => get<Page<NotificationItem>>('/notifications', { query: { cursor } });
export const getUnreadCount = () => get<{ count: number }>('/notifications/unread-count');
export const markNotificationRead = (id: string) => patch<void>(`/notifications/${id}/read`);
export const markAllNotificationsRead = () => patch<{ updated: number }>('/notifications/read-all');
export const deleteNotification = (id: string) => del<void>(`/notifications/${id}`);
export const clearNotifications = () => del<{ deleted: number }>('/notifications');

export { del };
