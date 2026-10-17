import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, Phone, AlertTriangle } from 'lucide-react-native';
import { Colors, Spacing, Radius } from '../constants/theme';
import { useStore } from '../store/useStore';
import { useAsync } from '../api/useAsync';
import { getJob, getTracking, raiseSos } from '../api/endpoints';
import { isSocketConnected, onConnectionChange, onJobLocation, onJobStatus, unwatchJob, watchJob } from '../api/socket';
import { userMessage } from '../api/errors';
import type { JobLocationPayload, JobView, Tracking } from '../api/types';
import Avatar from '../components/Avatar';
import TripMap from '../components/TripMap';
import { EmptyBlock, ErrorBlock, LoadingBlock } from '../components/StateBlocks';
import { callPhone, confirmAction, notify } from '../utils/dialog';
import { currentPosition } from '../utils/position';
import { timeAgo } from '../utils/time';
import { trackingPill } from '../utils/trip';

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
  const [socketUp, setSocketUp] = useState(isSocketConnected());

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
  const eta = liveIsNewer ? live.etaMinutes : (tracking?.etaMinutes ?? null);
  const away = liveIsNewer ? live.distanceKm : (tracking?.distanceKm ?? null);
  const stale = fix ? Date.now() - Date.parse(fix.updatedAt) > STALE_MS : false;
  const status = tracking?.status ?? job?.status ?? 'OPEN';
  const pill =
    trackingPill({ status, hasLocation: fix !== null, stale, etaMinutes: eta, distanceKm: away, lastSeen: fix ? timeAgo(fix.updatedAt) : undefined }) ||
    (STATUS_LABEL[status] ?? '');

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
        {job && !worker && (
          <EmptyBlock
            title={job.status === 'CANCELLED' ? 'This request was cancelled' : 'Waiting for the worker to accept'}
            hint={job.status === 'CANCELLED' ? job.cancelReason ?? undefined : 'You will see the worker here as soon as they accept. This page refreshes by itself.'}
          />
        )}
        {job && worker && (
          <>
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
          </>
        )}

        <View style={{ flexDirection: 'row', gap: 10 }}>
          <TouchableOpacity style={styles.callBtn} onPress={handleCall}>
            <Phone color="#FFFFFF" size={16} />
            <Text style={styles.callBtnText}>Call Worker</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.progressBtn} onPress={() => router.push('/job-progress')}>
            <Text style={styles.progressBtnText}>Job Progress →</Text>
          </TouchableOpacity>
        </View>
      </View>
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
  }
});
