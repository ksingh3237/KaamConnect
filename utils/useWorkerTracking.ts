// Ties GPS sharing to what a screen knows about the worker's jobs. Several screens can use it at once (Home, Leads, Job
// Progress each poll the worker's jobs), so it only ever stops a session that THIS screen started for that job.
import { useEffect, useRef } from 'react';
import { startTracking, stopTracking, trackedJobId } from './workerTracking';

/**
 * @param assignedJobId  the job that is ASSIGNED (worker on the way) -> share GPS for it;
 *                       null -> the screen knows there is none -> stop sharing for the job it started;
 *                       undefined -> not loaded yet, do nothing.
 */
export function useWorkerTracking(assignedJobId: string | null | undefined): void {
  const started = useRef<string | null>(null);
  useEffect(() => {
    if (assignedJobId === undefined) return;
    if (assignedJobId) {
      started.current = assignedJobId;
      void startTracking(assignedJobId);
    } else {
      if (started.current && trackedJobId() === started.current) stopTracking();
      started.current = null;
    }
  }, [assignedJobId]);
}
