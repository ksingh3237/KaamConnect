// Appointment times for "Afternoon" / "Tomorrow" requests, and the "booked, not on the way yet" stage of an accepted
// job. All clock times are Indian time (the server checks "today", "tomorrow" and "12:00 to 20:00" in IST), whatever
// the phone's own time zone. Pure, so it is unit tested (appointment.test.ts).
import type { JobTiming } from '../api/types';

const IST_OFFSET_MS = (5 * 60 + 30) * 60_000;
const HOUR_MS = 3_600_000;
const DAY_MS = 24 * HOUR_MS;

/** Same as the server's SCHEDULE_MIN_LEAD_MIN: an appointment must be at least this far ahead. */
export const MIN_LEAD_MIN = 30;
/** Same as the server's EARLY_ARRIVAL_MIN: the worker may arrive (enter the code) at most this long before. */
export const EARLY_ARRIVAL_MIN = 60;

/** "Afternoon" covers appointments starting 12:00 to 19:00 (the server allows up to 20:00, exclusive). */
const AFTERNOON_HOURS = [12, 13, 14, 15, 16, 17, 18, 19];
/** "Tomorrow" offers 8 AM to 8 PM. */
const TOMORROW_HOURS = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20];

/** Midnight IST of the IST day that contains `at`. */
function istDayStart(at: number): number {
  return Math.floor((at + IST_OFFSET_MS) / DAY_MS) * DAY_MS - IST_OFFSET_MS;
}

/** One choosable start time. `iso` is what goes to the server; `hour` is the IST clock hour (0-23). */
export interface Slot {
  iso: string;
  at: number;
  hour: number;
}

function slotAt(dayStart: number, hour: number): Slot {
  const at = dayStart + hour * HOUR_MS;
  const ist = new Date(at + IST_OFFSET_MS); // its UTC fields read as IST wall-clock
  const pad = (n: number) => String(n).padStart(2, '0');
  const iso = `${ist.getUTCFullYear()}-${pad(ist.getUTCMonth() + 1)}-${pad(ist.getUTCDate())}T${pad(hour)}:00:00+05:30`;
  return { iso, at, hour };
}

/** The start times the customer can pick for this timing, right now. Empty for IMMEDIATE (and for a late evening's Afternoon). */
export function slotsFor(timing: JobTiming, now: number = Date.now()): Slot[] {
  const today = istDayStart(now);
  const earliest = now + MIN_LEAD_MIN * 60_000;
  if (timing === 'AFTERNOON') return AFTERNOON_HOURS.map((h) => slotAt(today, h)).filter((s) => s.at >= earliest);
  if (timing === 'TOMORROW') return TOMORROW_HOURS.map((h) => slotAt(today + DAY_MS, h));
  return [];
}

/** The slot picked before the customer touches anything: 2 PM this afternoon (or the first one left), 10 AM tomorrow. */
export function defaultSlot(timing: JobTiming, now: number = Date.now()): Slot | null {
  const slots = slotsFor(timing, now);
  const preferred = timing === 'AFTERNOON' ? 14 : 10;
  return slots.find((s) => s.hour === preferred) ?? slots[0] ?? null;
}

/** "10 AM", "2 PM", "12 PM". */
export function hourLabel(hour: number): string {
  const h = hour % 12 === 0 ? 12 : hour % 12;
  return `${h} ${hour < 12 ? 'AM' : 'PM'}`;
}

/** When the worker may start this job (enter the arrival code). Null for an "as soon as possible" job. */
export function arrivalOpensAt(scheduledFor: string | null | undefined): number | null {
  if (!scheduledFor) return null;
  const at = Date.parse(scheduledFor);
  return Number.isNaN(at) ? null : at - EARLY_ARRIVAL_MIN * 60_000;
}

/**
 * Accepted, but its appointment is still more than EARLY_ARRIVAL_MIN away: the worker is not on the way yet. No GPS is
 * shared, the customer is not shown "on the way", and the arrival code cannot be entered.
 */
export function isBooked(job: { status: string; scheduledFor?: string | null }, now: number = Date.now()): boolean {
  const opens = arrivalOpensAt(job.scheduledFor);
  return job.status === 'ASSIGNED' && opens !== null && now < opens;
}
