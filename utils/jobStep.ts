// What the person has to do next on the Job Progress screen, once the job moves to a new status. Two screens read it:
// job-progress scrolls that section into view and buzzes the phone, so a change that happens while they are reading
// something else is noticed instead of sitting below the fold.
import type { AlertLevel } from './alerts';
import type { JobStatus } from '../api/types';

/** The named blocks on app/job-progress.tsx that can become the thing to do. */
export type JobSection = 'arrival' | 'bill' | 'photos' | 'actions' | 'cancelled';

export interface JobStep {
  /** Where to scroll, or null when nothing new needs doing on this screen. */
  section: JobSection | null;
  /** How hard to buzz: 'loud' for a change someone has been waiting on. */
  level: AlertLevel;
}

const WORKER: Partial<Record<JobStatus, JobStep>> = {
  // The customer booked them: the next thing is reaching the address and entering the arrival code
  ASSIGNED: { section: 'arrival', level: 'loud' },
  // The code was accepted: write the bill so the customer can approve the cost
  ARRIVED: { section: 'bill', level: 'soft' },
  // The customer approved the cost - the worker has been standing there waiting for exactly this
  IN_PROGRESS: { section: 'photos', level: 'loud' },
  WORK_COMPLETED: { section: 'actions', level: 'soft' },
  // Paid
  COMPLETED: { section: 'actions', level: 'loud' },
  CANCELLED: { section: 'cancelled', level: 'loud' },
};

const CUSTOMER: Partial<Record<JobStatus, JobStep>> = {
  ASSIGNED: { section: null, level: 'loud' },
  // Someone is at the door
  ARRIVED: { section: 'actions', level: 'loud' },
  IN_PROGRESS: { section: 'photos', level: 'soft' },
  // The bill is ready and the worker is waiting to be paid
  WORK_COMPLETED: { section: 'actions', level: 'loud' },
  COMPLETED: { section: 'actions', level: 'soft' },
  CANCELLED: { section: 'cancelled', level: 'loud' },
};

/** null when this status means nothing new for this side (for example a worker seeing a still-open request). */
export function jobStep(status: JobStatus, viewer: 'worker' | 'customer'): JobStep | null {
  return (viewer === 'worker' ? WORKER : CUSTOMER)[status] ?? null;
}
