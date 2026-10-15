import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, Phone, AlertTriangle } from 'lucide-react-native';
import Svg, { Rect, Path, Circle, Text as SvgText, G } from 'react-native-svg';
import { Colors, Spacing, Radius } from '../constants/theme';
import { useStore } from '../store/useStore';
import { useAsync } from '../api/useAsync';
import { getJob, getTracking, raiseSos } from '../api/endpoints';
import { userMessage } from '../api/errors';
import type { JobView, Tracking } from '../api/types';
import Avatar from '../components/Avatar';
import { EmptyBlock, ErrorBlock, LoadingBlock } from '../components/StateBlocks';
import { callPhone, confirmAction, notify } from '../utils/dialog';
import { currentPosition } from '../utils/position';

const POLL_MS = 6000; // the customer sees the worker's progress by polling; REST is the source of truth

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

  const state = useAsync<Loaded | null>(
    async () => {
      if (!activeJobId) return null;
      const job = await getJob(activeJobId);
      // Live position exists only once somebody is assigned; a pending direct request has none yet
      const tracking = job.worker && job.status !== 'OPEN' && job.status !== 'CANCELLED' ? await getTracking(activeJobId) : null;
      return { job, tracking };
    },
    [activeJobId],
    { pollMs: POLL_MS },
  );
  const job = state.data?.job ?? null;
  const tracking = state.data?.tracking ?? null;
  const worker = job?.worker ?? null;

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

  const etaText = (() => {
    if (!tracking || tracking.status !== 'ASSIGNED') return STATUS_LABEL[job?.status ?? 'OPEN'] ?? '';
    if (tracking.etaMinutes === null) return 'On the way • waiting for the worker\'s location';
    return `Arriving in ${tracking.etaMinutes} min${tracking.distanceKm !== null ? ` • ${tracking.distanceKm} km away` : ''}`;
  })();

  return (
    <View style={styles.container}>
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

      {/* SVG Map Canvas */}
      <View style={styles.mapCanvas}>
        <Svg viewBox="0 0 400 450" style={styles.svgMap}>
          <Rect width="400" height="450" fill="#E8EEF5" />

          {/* Landmarks */}
          <Rect x="20" y="30" width="100" height="70" rx="12" fill="#D1E7DD" />
          <SvgText x="30" y="70" fill="#4A7C59" fontSize="10" fontWeight="bold">Rose Garden</SvgText>

          <Rect x="260" y="180" width="110" height="80" rx="12" fill="#D1E7DD" />
          <SvgText x="270" y="225" fill="#4A7C59" fontSize="10" fontWeight="bold">Sec 22 Market</SvgText>

          {/* Road Grid */}
          <Path d="M 0 140 L 400 140" stroke="#FFFFFF" strokeWidth="14" />
          <Path d="M 180 0 L 180 450" stroke="#FFFFFF" strokeWidth="16" />
          <Path d="M 0 320 L 400 320" stroke="#FFFFFF" strokeWidth="14" />

          {/* Active Navigation Path */}
          <Path
            d="M 90 140 L 180 140 L 180 280 L 250 280"
            fill="none"
            stroke="#00B074"
            strokeWidth="6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Destination Pin */}
          <Circle cx="250" cy="280" r="14" fill="#0284C7" />
          <Circle cx="250" cy="280" r="6" fill="#FFFFFF" />
          <SvgText x="210" y="310" fill="#0F172A" fontSize="11" fontWeight="bold">Your location</SvgText>

          {/* Motorbike Moving Pin */}
          <G transform="translate(130, 140)">
            <Circle cx="0" cy="0" r="20" fill="rgba(0, 176, 116, 0.25)" />
            <Circle cx="0" cy="0" r="14" fill="#00B074" />
            <SvgText x="-6" y="5" fontSize="11">🏍️</SvgText>
          </G>
        </Svg>

        {/* Floating ETA Badge */}
        <View style={[styles.floatingEta, { top: insets.top + 66 }]}>
          <Text style={{ color: Colors.primary, fontWeight: '800' }}>⚡</Text>
          <Text style={styles.floatingEtaText}>{etaText}</Text>
        </View>
      </View>

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
  mapCanvas: {
    flex: 1,
    position: 'relative'
  },
  svgMap: {
    width: '100%',
    height: '100%'
  },
  floatingEta: {
    position: 'absolute',
    alignSelf: 'center',
    backgroundColor: '#1E293B',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: Radius.full,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    elevation: 6
  },
  floatingEtaText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800'
  },
  bottomDrawer: {
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
  workerAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25
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
