// The "worker is late" state of an assigned job (docs/15-no-show.md on the server). The server decides everything
// (late notices, the automatic release, whether it counts); this only tells the screens what to show.
import type { JobView } from '../api/types';

export interface LateState {
  /** When the server releases the job if the worker has still not arrived. */
  releaseAt: Date;
  /** Whole minutes left until then, never below 1 while it is still in the future. */
  minutesLeft: number;
}

type LateJob = Pick<JobView, 'status' | 'booking' | 'noShowReleaseAt'>;

/** Non-null only while the job is ASSIGNED and the promised arrival time has passed. */
export function lateState(job: LateJob, now: number): LateState | null {
  if (job.status !== 'ASSIGNED' || !job.booking || !job.noShowReleaseAt) return null;
  if (now < Date.parse(job.booking.startAt)) return null;
  const releaseAt = new Date(job.noShowReleaseAt);
  return { releaseAt, minutesLeft: Math.max(0, Math.ceil((releaseAt.getTime() - now) / 60_000)) };
}

/** "4:35 pm", in the phone's own time zone. */
export function clockTime(at: Date): string {
  return at.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true });
}

export function lateNotice(state: LateState, viewer: 'customer' | 'worker'): { title: string; body: string } {
  const at = clockTime(state.releaseAt);
  return viewer === 'worker'
    ? {
        title: 'You are late • आप लेट हैं',
        body: `The customer is waiting. If you have not arrived by ${at}, the job is released and counts as a cancellation on your record.`,
      }
    : {
        title: 'Your worker is running late',
        body: `They have not arrived yet. If they have not arrived by ${at}, the request is released automatically. You can keep waiting or cancel below.`,
      };
}
