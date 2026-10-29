import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, Phone, AlertTriangle } from 'lucide-react-native';
import { Colors, Spacing, Radius } from '../constants/theme';
import { useStore } from '../store/useStore';
import { useAsync } from '../api/useAsync';
import { getJob, getTracking, raiseSos, resetArrivalCode } from '../api/endpoints';
import { isSocketConnected, onConnectionChange, onJobLocation, onJobStatus, unwatchJob, watchJob } from '../api/socket';
import { userMessage } from '../api/errors';
import type { JobLocationPayload, JobView, Tracking } from '../api/types';
import Avatar from '../components/Avatar';
import LateBanner from '../components/LateBanner';
import TripMap from '../components/TripMap';
import { EmptyBlock, ErrorBlock, LoadingBlock } from '../components/StateBlocks';
import { useCancelJob } from '../components/CancelReasonSheet';
import { cancelledHeadline, cancelledMessage, cancelledReason, visitFeeNotice } from '../utils/cancelReasons';
import { callPhone, confirmAction, notify } from '../utils/dialog';
import { currentPosition } from '../utils/position';
import { timeAgo } from '../utils/time';
import { AT_THE_DOOR_KM, trackingPill, type RoadTrip } from '../utils/trip';
import { buzz } from '../utils/alerts';
import { jobStep } from '../utils/jobStep';

const POLL_MS = 6000; // REST polling while the socket is down: the customer still sees the worker move
const POLL_SOCKET_UP_MS = 20000; // with a live socket, polling is only a safety net for status changes
const STALE_MS = 2 * 60 * 1000; // same as the server: an older fix is shown as "last seen"

const STATUS_LABEL: Record<string, string> = {
  OPEN: 'WAITING FOR THE WORKER',
  ASSIGNED: 'WORKER ON THE WAY',
  ARRIVED: 'WORKER HAS ARRIVED',
  IN_PROGRESS: 'WORK IN PROGRESS',
  WORK_COMPLETED: 'WORK DONE • BILL READY',
  COMPLETED: 'JOB COMPLETED',
  CANCELLED: 'JOB CANCELLED',
};

interface Loaded {
  job: JobView;
  tracking: Tracking | null;
}

export default function TrackingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { activeJobId } = useStore();
  const [sosBusy, setSosBusy] = useState(false);
  const [live, setLive] = useState<JobLocationPayload | null>(null); // newest `job.location` event
  const [road, setRoad] = useState<RoadTrip | null>(null); // what the map's road route says, which beats the straight line
  const [socketUp, setSocketUp] = useState(isSocketConnected());
  const [resetting, setResetting] = useState(false);
  const { cancel, busy: cancelling, modal: cancelModal } = useCancelJob('CUSTOMER');
  const lastStatus = useRef<string | null>(null);
  const doorBuzzed = useRef(false);

  const state = useAsync<Loaded | null>(
    async () => {
      if (!activeJobId) return null;
      const job = await getJob(activeJobId);
      // Live position exists only once somebody is assigned; a pending direct request has none yet
      const tracking = job.worker && job.status !== 'OPEN' && job.status !== 'CANCELLED' ? await getTracking(activeJobId) : null;
      return { job, tracking };
    },
    [activeJobId],
    { pollMs: socketUp ? POLL_SOCKET_UP_MS : POLL_MS },
  );
  const job = state.data?.job ?? null;
  const tracking = state.data?.tracking ?? null;
  const worker = job?.worker ?? null;
  const cancelled = job?.status === 'CANCELLED';
  // A broadcast request with no worker that I got here from: the worker backed out and it re-opened for quotes
  const reopened = !!job && job.status === 'OPEN' && !job.isDirect;
  const showWorker = !!job && !!worker && !cancelled;
  const reloadRef = useRef(state.reload);
  reloadRef.current = state.reload;

  useEffect(() => {
    setSocketUp(isSocketConnected());
    return onConnectionChange(setSocketUp);
  }, []);

  // Live updates: join the job's room while this screen is open, leave it when it closes
  const following = Boolean(activeJobId && worker);
  useEffect(() => {
    if (!activeJobId || !following) return undefined;
    watchJob(activeJobId);
    const offLocation = onJobLocation((p) => {
      if (p.jobId === activeJobId) setLive(p);
    });
    const offStatus = onJobStatus((p) => {
      if (p.jobId === activeJobId) void reloadRef.current(); // arrived, cancelled...: refresh the card and the arrival code
    });
    return () => {
      offLocation();
      offStatus();
      unwatchJob(activeJobId);
      setLive(null);
    };
  }, [activeJobId, following]);

  // The newest position from either door: a socket event or the last REST answer
  const polled = tracking?.location ?? null;
  const liveIsNewer = live !== null && (polled === null || Date.parse(live.updatedAt) >= Date.parse(polled.updatedAt));
  const fix = liveIsNewer ? live : polled;
  const workerPoint = fix ? { lat: fix.lat, lng: fix.lng } : null;
  const destination = typeof job?.lat === 'number' && typeof job?.lng === 'number' ? { lat: job.lat, lng: job.lng } : null;
  // The server measures the crow's flight; the map has the real road. Prefer the road, keep the server as the fallback.
  const eta = road?.etaMinutes ?? (liveIsNewer ? live.etaMinutes : (tracking?.etaMinutes ?? null));
  const away = road?.distanceKm ?? (liveIsNewer ? live.distanceKm : (tracking?.distanceKm ?? null));
  const stale = fix ? Date.now() - Date.parse(fix.updatedAt) > STALE_MS : false;
  const status = tracking?.status ?? job?.status ?? 'OPEN';
  const pill =
    trackingPill({ status, hasLocation: fix !== null, stale, etaMinutes: eta, distanceKm: away, lastSeen: fix ? timeAgo(fix.updatedAt) : undefined }) ||
    (STATUS_LABEL[status] ?? '');

  // The job moved on while the customer was reading this screen (socket or poll): buzz, so it is not missed with the
  // phone on the table. The screen itself already shows the change; this is only the nudge to look at it.
  useEffect(() => {
    if (!job) return;
    const previous = lastStatus.current;
    lastStatus.current = job.status;
    if (previous === null || previous === job.status) return;
    const step = jobStep(job.status, 'customer');
    if (step) buzz(step.level);
  }, [job]);

  // The worker has reached the address but has not entered the code yet: the customer needs to open the door
  useEffect(() => {
    if (status !== 'ASSIGNED' || stale || away === null || away > AT_THE_DOOR_KM) {
      if (away !== null && away > AT_THE_DOOR_KM) doorBuzzed.current = false;
      return;
    }
    if (doorBuzzed.current) return;
    doorBuzzed.current = true;
    buzz('loud');
  }, [status, stale, away]);

  const handleSos = async () => {
    if (!activeJobId || sosBusy) return;
    const ok = await confirmAction(
      '🚨 Emergency SOS',
      'This sends an alert to the KaamConnect safety desk with your job details and location. Use it only in an emergency. Send it now?',
      'Send SOS',
      true,
    );
    if (!ok) return;
    setSosBusy(true);
    try {
      // Location is best effort: the alert goes out even when the device cannot give a position
      const position = await currentPosition(4000).catch(() => undefined);
      const result = await raiseSos(activeJobId, position);
      if (result.delivered) {
        notify(
          result.repeated ? 'SOS already sent' : 'SOS sent',
          'The safety desk has received your alert. If you are in danger, call 112 now.',
        );
      } else {
        // Stored on our side but the desk has not confirmed yet; the server keeps retrying by itself.
        notify(
          'SOS saved, not confirmed yet',
          'Your alert is saved and we keep trying to reach the safety desk. This is not confirmed yet. If you are in danger, call 112 now.',
        );
      }
    } catch (error) {
      notify('SOS could not be sent', userMessage(error) + '\n\nIf you are in danger, call 112 now.');
    } finally {
      setSosBusy(false);
    }
  };

  // The worker typed five wrong codes and is locked out: a new code unlocks them (the old one stops working)
  const handleNewCode = async () => {
    if (!activeJobId || resetting) return;
    setResetting(true);
    try {
      await resetArrivalCode(activeJobId);
      await state.reload();
      void notify('New code issued', 'Share the new code with your worker when they arrive. The old one no longer works.');
    } catch (error) {
      void notify('Could not issue a new code', userMessage(error));
      await state.reload();
    } finally {
      setResetting(false);
    }
  };

  // Cancel while the worker is on the way, or decline the cost once they are on site. Failure usually means the job just changed.
  const handleCancel = () => {
    if (!activeJobId || !job) return;
    const stage = job.status === 'ARRIVED' ? 'ARRIVED' : 'ASSIGNED';
    void cancel(activeJobId, stage, {
      onCancelled: async () => {
        await state.reload();
        const { title, message } = cancelledMessage('CUSTOMER', false);
        void notify(title, message);
      },
      onFailed: () => state.reload(),
    });
  };

  const handleCall = () => {
    const phone = tracking?.worker?.phone ?? worker?.phone;
    if (phone) void callPhone(phone, worker?.name ?? 'your worker');
  };

  return (
    <View style={styles.container}>
      {/* Live Google map: worker, route line and your location (fills the screen, the card below floats over it) */}
      <TripMap
        fill
        worker={workerPoint}
        destination={destination}
        vehicle={tracking?.worker?.vehicle ?? worker?.vehicle}
        onTrip={setRoad}
        padding={{ top: insets.top + 110, right: 50, bottom: 220, left: 50 }}
      />

      {/* Floating Header */}
      <View style={[styles.floatingHeader, { top: insets.top + 14 }]}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)/home')}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <ArrowLeft color={Colors.textMain} size={20} />
        </TouchableOpacity>
        <View style={styles.livePill}>
          <Text style={styles.livePillText}>• {job ? STATUS_LABEL[job.status] ?? job.status : 'TRACKER'}</Text>
        </View>
        <TouchableOpacity style={[styles.sosBtn, (sosBusy || !activeJobId) && { opacity: 0.6 }]} onPress={() => void handleSos()} disabled={sosBusy || !activeJobId} accessibilityRole="button" accessibilityLabel="Emergency SOS">
          <AlertTriangle color="#FFFFFF" size={18} />
        </TouchableOpacity>
      </View>

      {/* Floating ETA pill */}
      {pill ? (
        <View style={[styles.floatingEta, { top: insets.top + 66 }]} accessibilityLiveRegion="polite">
          <Text style={styles.floatingEtaText}>{pill}</Text>
        </View>
      ) : null}

      {/* Technician Bottom Drawer Card */}
      <View style={[styles.bottomDrawer, { paddingBottom: Math.max(insets.bottom, 24) }]}>
        <View style={styles.drawerHandle} />

        {state.loading && <LoadingBlock label="Loading your job… / जॉब लोड हो रहा है…" />}
        {state.error && !state.data && <ErrorBlock message={state.error} onRetry={() => void state.reload()} />}
        {!activeJobId && <EmptyBlock title="No job selected" hint="Book a pro or accept a quote first. / पहले बुक करें" />}
        {job && cancelled && (
          <>
            <EmptyBlock title={cancelledHeadline(job, 'customer')} hint={[cancelledReason(job), visitFeeNotice(job, 'customer')].filter(Boolean).join('\n')} />
            <TouchableOpacity style={styles.standaloneBtn} onPress={() => router.replace('/(tabs)/home')} accessibilityRole="button">
              <Text style={styles.standaloneBtnText}>Back to home</Text>
            </TouchableOpacity>
          </>
        )}
        {/* The worker backed out of a broadcast request: it is open again, so the next step is choosing another quote */}
        {reopened && (
          <>
            <EmptyBlock title="Your worker had to cancel" hint="Your request is open again so other workers can quote. Choose a new quote to continue." />
            <TouchableOpacity style={styles.standaloneBtn} onPress={() => router.replace('/compare-offers')} accessibilityRole="button">
              <Text style={styles.standaloneBtnText}>View quotes</Text>
            </TouchableOpacity>
          </>
        )}
        {job && !cancelled && !reopened && !worker && (
          <EmptyBlock title="Waiting for the worker to accept" hint="You will see the worker here as soon as they accept. This page refreshes by itself." />
        )}
        {showWorker && job && worker && (
          <>
            <LateBanner job={job} viewer="customer" />
            <View style={styles.drawerHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
                <Avatar uri={worker.photoUrl} size={50} />
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <Text style={styles.workerName}>{worker.name}</Text>
                    <Text>🛡️</Text>
                  </View>
                  {worker.vehicle ? <Text style={styles.vehicleText}>{worker.vehicle}</Text> : null}
                  <Text style={styles.workerSub}>{worker.trade} • Aadhaar Verified</Text>
                </View>
              </View>

              {job.arrivalCode ? (
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={styles.codeLabel}>Arrival Code</Text>
                  <Text style={styles.codeNumber}>{job.arrivalCode}</Text>
                </View>
              ) : null}
            </View>

            {job.arrivalCode ? (
              <View style={styles.noticeBox}>
                <Text style={styles.noticeText}>
                  Share arrival code <Text style={{ fontWeight: '800' }}>{job.arrivalCode}</Text> with worker upon entry.
                </Text>
              </View>
            ) : null}

            {/* Five wrong codes lock the worker out: a new code unlocks them */}
            {job.arrivalLocked ? (
              <View style={styles.lockedBox} accessibilityRole="alert">
                <Text style={styles.lockedText}>Your worker entered a wrong code too many times and is locked out.</Text>
                {(job.arrivalResetsLeft ?? 0) > 0 ? (
                  <TouchableOpacity style={[styles.newCodeBtn, resetting && { opacity: 0.6 }]} onPress={() => void handleNewCode()} disabled={resetting} accessibilityRole="button">
                    <Text style={styles.newCodeText}>{resetting ? 'Issuing…' : `Issue a new code (${job.arrivalResetsLeft} left)`}</Text>
                  </TouchableOpacity>
                ) : (
                  <Text style={styles.lockedText}>No new codes can be issued for this job. Call the worker, or cancel the job below.</Text>
                )}
              </View>
            ) : null}
          </>
        )}

        {showWorker && (
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <TouchableOpacity style={styles.callBtn} onPress={handleCall}>
              <Phone color="#FFFFFF" size={16} />
              <Text style={styles.callBtnText}>Call Worker</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.progressBtn} onPress={() => router.push('/job-progress')}>
              <Text style={styles.progressBtnText}>Job Progress →</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Cancel while the worker is on the way, or decline the cost once they are on site (not possible after approving it) */}
        {showWorker && job && (job.status === 'ASSIGNED' || job.status === 'ARRIVED') && (
          <TouchableOpacity style={[styles.cancelLink, cancelling && { opacity: 0.6 }]} onPress={handleCancel} disabled={cancelling} accessibilityRole="button">
            <Text style={styles.cancelLinkText}>{cancelling ? 'Cancelling…' : job.status === 'ARRIVED' ? 'Decline the cost and cancel / रद्द करें' : 'Cancel this job / जॉब रद्द करें'}</Text>
          </TouchableOpacity>
        )}
      </View>

      {cancelModal}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E8EEF5'
  },
  floatingHeader: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 50,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4
  },
  livePill: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.full,
    elevation: 4
  },
  livePillText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#065F46'
  },
  sosBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.error,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4
  },
  floatingEta: {
    position: 'absolute',
    alignSelf: 'center',
    maxWidth: '92%',
    zIndex: 40,
    backgroundColor: '#1E293B',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: Radius.full,
    elevation: 6
  },
  floatingEtaText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
    textAlign: 'center'
  },
  bottomDrawer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: Spacing.lg,
    elevation: 10
  },
  drawerHandle: {
    width: 36,
    height: 4,
    backgroundColor: '#CBD5E1',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 12
  },
  drawerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12
  },
  workerName: {
    flexShrink: 1,
    fontSize: 14,
    fontWeight: '800',
    color: Colors.textMain
  },
  vehicleText: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: '700'
  },
  workerSub: {
    fontSize: 12,
    color: Colors.textMuted
  },
  codeLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textMuted
  },
  codeNumber: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.primary,
    letterSpacing: 1
  },
  noticeBox: {
    backgroundColor: '#F8FAFC',
    padding: 10,
    borderRadius: Radius.md,
    marginBottom: 12
  },
  noticeText: {
    fontSize: 13,
    color: Colors.textMuted
  },
  callBtn: {
    flex: 1,
    backgroundColor: Colors.primary,
    height: 48,
    borderRadius: Radius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6
  },
  callBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800'
  },
  progressBtn: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    height: 48,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.borderDark
  },
  progressBtnText: {
    color: Colors.textMain,
    fontSize: 13,
    fontWeight: '700'
  },
  standaloneBtn: {
    marginTop: 10,
    backgroundColor: Colors.primary,
    height: 48,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center'
  },
  standaloneBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800'
  },
  lockedBox: {
    backgroundColor: Colors.secondaryLight,
    padding: 10,
    borderRadius: Radius.md,
    marginBottom: 12,
    gap: 8
  },
  lockedText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.secondaryDark,
    lineHeight: 19
  },
  newCodeBtn: {
    backgroundColor: Colors.secondaryDark,
    minHeight: 44,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12
  },
  newCodeText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800'
  },
  cancelLink: {
    marginTop: 10,
    minHeight: 44,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    borderColor: '#FCA5A5',
    backgroundColor: Colors.errorLight,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12
  },
  cancelLinkText: {
    color: '#991B1B',
    fontSize: 13,
    fontWeight: '800',
    textAlign: 'center'
  }
});
