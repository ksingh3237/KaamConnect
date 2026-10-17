// Response and request shapes of the KaamConnect API. They mirror the server's own TypeScript interfaces
// (KaamConnectBackendAPI/src/modules/**), which are the source of truth; docs/03-api-spec.md describes them in prose.

export type Lang = 'en' | 'hi' | 'pa';
export type JobStatus = 'OPEN' | 'ASSIGNED' | 'ARRIVED' | 'IN_PROGRESS' | 'WORK_COMPLETED' | 'COMPLETED' | 'CANCELLED';
export type JobTiming = 'IMMEDIATE' | 'AFTERNOON' | 'TOMORROW' | 'SCHEDULED';
export type JobTab = 'ongoing' | 'completed' | 'cancelled';
export type PaymentMethod = 'UPI' | 'CASH';
export type BillItemKind = 'VISIT_FEE' | 'PARTS' | 'LABOUR' | 'OTHER';
export type VerificationStatus = 'PENDING' | 'VERIFIED' | 'REJECTED';
export type DocumentType = 'AADHAAR_FRONT' | 'AADHAAR_BACK';
export type ReviewTag = 'PUNCTUAL' | 'FAIR_PRICE' | 'CLEAN_WORK' | 'POLITE' | 'EXPERT_SKILL';
export type MediaPurpose = 'PROFILE_PHOTO' | 'JOB_PHOTO' | 'JOB_VOICE' | 'WORK_PROOF' | 'AADHAAR';

// ── auth
export interface OtpRequestResult {
  resendAfterSec: number;
  expiresInSec: number;
  /** Present only when the server runs with the development OTP bypass. */
  devNotice?: string;
  /** Length of the code the person must type; set when the MSG91 widget decides it, otherwise 6. */
  otpLength?: number;
  /** True when the number was verified without a code (invisible OTP) and the person is already signed in. */
  signedIn?: boolean;
}
export interface SessionUser {
  id: string;
  phone: string;
  language: string;
  hasCustomerProfile: boolean;
  hasWorkerProfile: boolean;
}
export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}
export interface VerifyResult extends TokenPair {
  isNewUser: boolean;
  user: SessionUser;
}

// ── reference data
export interface LocationCity {
  id: number;
  name: string;
  areas: { id: number; name: string }[];
}
export interface ServiceCategory {
  id: string;
  title: { en: string; hi: string; pa: string };
  iconKey: string;
  color: string;
  bgColor: string;
  baseVisitFee: number;
  examples: string;
}

// ── profiles
export interface AddressView {
  id: string;
  area: { id: number; name: string };
  /** Typed by the customer when their pocket is not in the sector list (area is then the city's "Other area"). */
  locality: string | null;
  city: { id: number; name: string };
  line: string;
  lat: number | null;
  lng: number | null;
  isPrimary: boolean;
}
export interface CustomerView {
  userId: string;
  fullName: string;
  photoUrl: string | null;
  commLanguage: Lang;
  allowDirectCalls: boolean;
  addresses: AddressView[];
}
export interface WorkerView {
  userId: string;
  fullName: string;
  photoUrl: string | null;
  trades: { categoryId: string; isPrimary: boolean }[];
  experienceYears: number;
  skills: string[];
  languages: Lang[];
  baseArea: { id: number; name: string };
  /** Typed locality when the base area is not in the list. */
  locality: string | null;
  city: { id: number; name: string };
  /** Shop / workshop / home address (private: the worker and admins only). */
  addressLine: string | null;
  /** "Taking jobs": off = no new-lead alerts, hidden from customers, no direct bookings. */
  isAvailable: boolean;
  radiusKm: number;
  scheduledRadiusKm: number | null;
  visitingFee: number | null;
  vehicle: string | null;
  upiId: string | null;
  badge: string | null;
  verificationStatus: VerificationStatus;
  rejectionReason: string | null;
  documents: Record<DocumentType, boolean>;
  ratingAvg: number | null;
  reviewCount: number;
}
/** GET /me: who is signed in and which profiles exist. The full profiles are GET /customers/me and GET /workers/me. */
export interface MeView {
  id: string;
  phone: string;
  language: string;
  customer: { fullName: string; commLanguage: Lang; allowDirectCalls: boolean } | null;
  worker: { fullName: string; verificationStatus: VerificationStatus } | null;
}

export interface PutCustomerBody {
  fullName: string;
  photoKey?: string;
  commLanguage: Lang;
  allowDirectCalls: boolean;
  address: { areaId: number; line: string; lat?: number; lng?: number; localityName?: string };
}
export interface PutWorkerBody {
  fullName: string;
  photoKey?: string;
  trades: string[];
  experienceYears: number;
  skills: string[];
  languages: Lang[];
  baseAreaId: number;
  localityName?: string;
  addressLine?: string;
  radiusKm: 3 | 6 | 12;
  upiId?: string;
  vehicle?: string;
  visitingFee?: number;
  termsAccepted: boolean;
}

// ── discovery
export interface WorkerCard {
  id: string;
  name: string;
  trade: string;
  tradeId: string;
  areaName: string;
  cityName: string;
  distanceKm: number | null;
  rating: number | null;
  reviewsCount: number;
  visitingFee: number;
  etaMinutes: number | null;
  badge: string | null;
  experienceYears: number;
  vehicle: string | null;
  skills: string[];
  photoUrl: string | null;
  phone: string;
}
export interface Page<T> {
  items: T[];
  nextCursor: string | null;
}

// ── jobs (customer)
/** A one-off job address typed for a single job (not saved to the profile). lat and lng go together or not at all. */
export interface JobAddressInput {
  areaId: number;
  line: string;
  localityName?: string;
  lat?: number;
  lng?: number;
}
export interface CreateJobBody {
  categoryId: string;
  title: string;
  description?: string;
  timing: JobTiming;
  /** Send exactly one of addressId (saved address) or address (typed for this job). */
  addressId?: string;
  address?: JobAddressInput;
  photoKeys?: string[];
  voiceNote?: { key: string; durationSec: number };
}
export interface CreatedJob {
  id: string;
  jobNumber: number;
  reference: string;
  status: JobStatus;
  expiresAt: string;
  notifiedWorkers?: number;
  awaitingWorker?: boolean;
}
export interface JobListItem {
  id: string;
  jobNumber: number;
  reference: string;
  title: string;
  status: JobStatus;
  category: { id: string; title: string };
  area: string;
  city: string;
  createdAt: string;
  offersCount: number;
  isDirect: boolean;
  scheduledFor: string | null;
  bookedStartAt: string | null;
  worker: { id: string; name: string; phone: string } | null;
  rating?: number | null;
  reviewed?: boolean;
}
export interface JobListPage extends Page<JobListItem> {
  meta: { counts: Record<JobTab, number> };
}
export interface ReviewView {
  id: string;
  jobId: string;
  rating: number;
  tags: ReviewTag[];
  tipAmount: number;
  createdAt: string;
}
export interface JobView {
  id: string;
  jobNumber: number;
  reference: string;
  status: JobStatus;
  title: string;
  description: string | null;
  timing: JobTiming;
  scheduledFor: string | null;
  durationMin: number;
  booking: { startAt: string; endAt: string; confirmedAt: string } | null;
  category: { id: string; title: { en: string; hi: string; pa: string } };
  area: { id: number; name: string };
  locality: string | null;
  city: { id: number; name: string };
  isDirect: boolean;
  expiresAt: string | null;
  createdAt: string;
  assignedAt: string | null;
  arrivedAt: string | null;
  completedAt: string | null;
  cancelledAt: string | null;
  cancelReason: string | null;
  photoUrls: string[];
  voiceNote: { url: string; durationSec: number | null } | null;
  workPhotos?: { before: string[]; after: string[] };
  offersCount: number;
  viewer: 'customer' | 'worker';
  addressLine?: string;
  lat?: number | null;
  lng?: number | null;
  customer?: { name: string; phone: string | null };
  worker?: WorkerCard;
  arrivalCode?: string;
  arrivalLocked?: boolean;
  arrivalResetsLeft?: number;
  review?: ReviewView | null;
  canReview?: boolean;
}
export interface OfferForCustomer {
  offerId: string;
  visitFee: number;
  etaMinutes: number;
  message: string | null;
  status: string;
  createdAt: string;
  isFastest: boolean;
  available: boolean;
  startsAt: string;
  worker: WorkerCard;
}
export interface Tracking {
  status: JobStatus;
  location: { lat: number; lng: number; updatedAt: string; stale: boolean } | null;
  distanceKm: number | null;
  etaMinutes: number | null;
  distanceBasis: 'JOB_COORDINATES' | 'AREA_CENTROID' | null;
  worker?: { id: string; name: string; trade: string; vehicle: string | null; phone: string; verified: boolean };
  customer?: { name: string };
  arrivalCode?: string;
}
export interface BillItemView {
  id: string;
  kind: BillItemKind;
  description: string;
  amount: number;
}
export interface BillView {
  jobId: string;
  status: JobStatus;
  items: BillItemView[];
  platformFee: 0;
  total: number;
  approved: boolean;
  payTo: { name: string; upiId: string | null };
}
export interface PaymentView {
  jobId: string;
  status: JobStatus;
  receiptNo: string;
  method: PaymentMethod;
  amount: number;
  platformFee: 0;
  markedAt: string;
}
export interface Receipt {
  receiptNo: string;
  date: string;
  jobTitle: string;
  customer: { name: string };
  worker: { name: string };
  items: { kind: BillItemKind; description: string; amount: number }[];
  platformFee: 0;
  total: number;
  method: PaymentMethod;
}

// ── leads and worker jobs
export interface OfferSummary {
  id: string;
  visitFee: number;
  etaMinutes: number;
  message: string | null;
  status: string;
  createdAt: string;
}
export interface LeadItem {
  id: string;
  reference: string;
  title: string;
  category: { id: string; title: { en: string; hi: string; pa: string } };
  customerName: string;
  areaName: string;
  cityName: string;
  distanceKm: number | null;
  urgency: JobTiming;
  scheduledFor: string | null;
  durationMin: number;
  extendedReach: boolean;
  leadState: 'NEW' | 'ACCEPTED' | 'DECLINED';
  postedAt: string;
  hasVoiceNote: boolean;
  notes: string | null;
  offersCount: number;
  baseVisitFee: number;
  isDirect: boolean;
  expiresAt: string | null;
  myOffer: OfferSummary | null;
}
export interface LeadDetail extends LeadItem {
  status: JobStatus;
  photoUrls: string[];
  voiceNote: { url: string; durationSec: number | null } | null;
}
export interface WorkerJobItem {
  id: string;
  reference: string;
  title: string;
  status: JobStatus;
  category: { id: string; title: string };
  area: string;
  city: string;
  customerName: string;
  scheduledFor: string | null;
  bookedStartAt: string | null;
  bookedEndAt: string | null;
  total: number;
  rating?: number | null;
  createdAt: string;
}
export interface PendingQuote {
  offerId: string;
  jobId: string;
  reference: string;
  title: string;
  visitFee: number;
  etaMinutes: number;
  scheduledFor: string | null;
  createdAt: string;
}
export interface WorkerJobsPage extends Page<WorkerJobItem> {
  meta: { counts: Record<JobTab, number> };
  pendingQuotes?: PendingQuote[];
}

// ── money views
export interface Earnings {
  period: 'today' | 'week' | 'month';
  from: string;
  to: string;
  amount: number;
  jobsDone: number;
  platformFee: 0;
  currency: 'INR';
}
export interface Savings {
  commissionSaved: number;
  benchmarkRate: number;
  currency: 'INR';
  role: 'customer' | 'worker';
  jobsCount: number;
  jobsTotal: number;
}

// ── safety
export interface SosStatusView {
  alertId: string;
  status: 'OPEN' | 'ACKNOWLEDGED' | 'RESOLVED';
  raisedAt: string;
  /** True once the safety desk confirmed it received the alert. */
  delivered: boolean;
  acknowledgedAt: string | null;
  resolvedAt: string | null;
}

// ── media
export interface PresignResult {
  uploadUrl: string;
  method: 'PUT';
  headers: Record<string, string>;
  key: string;
  expiresInSec: number;
}

// ── realtime (Socket.IO /realtime)
/** The `job.location` event: the worker's position on the way to a job. distanceKm / etaMinutes are null without real coordinates. */
export interface JobLocationPayload {
  jobId: string;
  lat: number;
  lng: number;
  updatedAt: string;
  distanceKm: number | null;
  etaMinutes: number | null;
  distanceBasis: 'JOB_COORDINATES' | 'AREA_CENTROID' | null;
}

// ── notifications (bell inbox + push)
export type NotificationType =
  | 'NEW_LEAD'
  | 'DIRECT_REQUEST'
  | 'NEW_QUOTE'
  | 'BOOKING_CONFIRMED'
  | 'WORKER_EN_ROUTE'
  | 'WORKER_ARRIVED'
  | 'BILL_CREATED'
  | 'WORK_COMPLETED';

export interface NotificationItem {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  /** Always has `type`; job notifications also have `jobId`. */
  data: Record<string, unknown>;
  isRead: boolean;
  createdAt: string;
}
