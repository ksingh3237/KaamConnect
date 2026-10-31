import React, { useEffect, useRef, useState } from 'react';
import { AppState, View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, TextInput, ActivityIndicator, Linking, Platform, type LayoutChangeEvent } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, CheckCircle2, MapPin, Navigation, Phone, ShieldCheck, Zap } from 'lucide-react-native';
import { KeyboardAwareScrollView } from '../components/KeyboardAwareScrollView';
import { Colors, Spacing, Radius } from '../constants/theme';
import { useStore } from '../store/useStore';
import { useAsync } from '../api/useAsync';
import { addWorkPhoto, approveBill, completeWork, getBill, getJob, getMyCancellations, getTracking, payJob, putBillItems, verifyArrival } from '../api/endpoints';
import { isApiError, userMessage } from '../api/errors';
import { uploadFile } from '../api/upload';
import { useImagePicker } from '../components/ImageSourceModal';
import { useImageViewer } from '../components/ImageViewerModal';
import { useCancelJob } from '../components/CancelReasonSheet';
import { backOutWarning, cancelledHeadline, cancelledMessage, cancelledReason, visitFeeNotice } from '../utils/cancelReasons';
import { callPhone, confirmAction, notify } from '../utils/dialog';
import { getLocationAccess, requestWorkerLocationAccess } from '../utils/locationPermission';
import { workerTracking } from '../utils/workerTracking';
import { useWorkerTracking } from '../utils/useWorkerTracking';
import LateBanner from '../components/LateBanner';
import { AT_THE_DOOR_KM, distanceKm, navigationUrls } from '../utils/trip';
import { buzz, ringAlert } from '../utils/alerts';
import { jobStep, type JobSection } from '../utils/jobStep';
import { TRIP_RETURN_TYPE, clearReturnReminder, showReturnReminder } from '../utils/tripReturn';
import { useSession } from '../store/useSession';
import TripMap from '../components/TripMap';
import WorkerLocationPermissionModal from '../components/WorkerLocationPermissionModal';
import type { BillItemKind, BillView, JobView, PaymentMethod, Tracking } from '../api/types';
import Avatar from '../components/Avatar';
import { EmptyBlock, ErrorBlock, LoadingBlock } from '../components/StateBlocks';
import { useLang, useT } from '../i18n/useT';
import { categoryTitle } from '../i18n/categories';

const POLL_MS = 6000;
/** Once the worker is further than this again, a new approach can nudge them a second time. */
const LEFT_THE_DOOR_KM = 0.3;
const PHOTO_PLACEHOLDER = require('../assets/images/photo-placeholder.png');
const KINDS: Exclude<BillItemKind, 'VISIT_FEE'>[] = ['PARTS', 'LABOUR', 'OTHER'];
const money = (n: number) => `₹${n.toFixed(2)}`;
const timeOf = (iso: string | null) => (iso ? new Date(iso).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '');

interface Loaded {
  job: JobView;
  bill: BillView | null;
  /** The server's own distance and arrival time, so both sides read the same numbers. Null when not applicable. */
  tracking: Tracking | null;
}
interface DraftItem {
  kind: Exclude<BillItemKind, 'VISIT_FEE'>;
  description: string;
  amount: string;
}

export default function JobProgressScreen() {
  const router = useRouter();
  const t = useT();
  const lang = useLang();
  const statusPill: Record<string, string> = {
    OPEN: t('WAITING'),
    ASSIGNED: t('ON THE WAY'),
    ARRIVED: t('ARRIVED'),
    IN_PROGRESS: t('IN PROGRESS'),
    WORK_COMPLETED: t('BILL READY'),
    COMPLETED: t('COMPLETED'),
    CANCELLED: t('CANCELLED'),
  };
  const { activeJobId, setActiveJobId, currentLat, currentLng, isTrackingActive, trackingIssue } = useStore();
  const workerProfile = useSession((s) => s.workerProfile);
  const [askLocation, setAskLocation] = useState(false);
  const { pick: pickImage, modal: imageSourceModal } = useImagePicker();
  const { show: viewImage, modal: imageViewerModal } = useImageViewer();
  const askedFor = useRef<string | null>(null);
  // Where each block sits in the scroll view, so the one that just became the person's turn can be brought into view
  const scrollRef = useRef<ScrollView>(null);
  const sectionY = useRef<Partial<Record<JobSection, number>>>({});
  const onSectionLayout = (section: JobSection) => (event: LayoutChangeEvent) => {
    sectionY.current[section] = event.nativeEvent.layout.y;
  };
  // Never yank the page away while the worker is typing a bill line
  const typing = useRef(false);
  const lastStatus = useRef<string | null>(null);
  // The "you have reached it" nudge fires once per approach, not once per GPS fix
  const nudged = useRef(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [code, setCode] = useState('');
  const [draft, setDraft] = useState<DraftItem[] | null>(null);

  const state = useAsync<Loaded | null>(
    async () => {
      if (!activeJobId) return null;
      const job = await getJob(activeJobId);
      // The bill exists once the worker has arrived; before that the call is simply not applicable
      const bill = ['ARRIVED', 'IN_PROGRESS', 'WORK_COMPLETED', 'COMPLETED'].includes(job.status) ? await getBill(activeJobId).catch(() => null) : null;
      // Only meaningful while someone is on the way; the server answers 409 outside those statuses
      const tracking = job.status === 'ASSIGNED' ? await getTracking(activeJobId).catch(() => null) : null;
      return { job, bill, tracking };
    },
    [activeJobId],
    { pollMs: POLL_MS },
  );
  const job = state.data?.job ?? null;
  const bill = state.data?.bill ?? null;
  const tracking = state.data?.tracking ?? null;
  const isWorker = job?.viewer === 'worker';
  const other = isWorker ? job?.customer : job?.worker;
  const { cancel, busy: cancelling, modal: cancelModal } = useCancelJob(isWorker ? 'WORKER' : 'CUSTOMER');
  // What the worker charged to come: owed to them directly if the visit ends without the work (shown in the cancel sheet)
  const visitFee = bill?.items.find((i) => i.kind === 'VISIT_FEE')?.amount ?? null;

  // Worker on the way: share GPS for this job while it stays ASSIGNED, stop the moment it is not (arrived, cancelled...)
  const enRoute = isWorker && job?.status === 'ASSIGNED';
  const jobId = job?.id;
  useWorkerTracking(!job ? undefined : enRoute ? job.id : null);

  // The first time a job turns ASSIGNED, check the permission and explain it if it was never granted
  useEffect(() => {
    if (!enRoute || !jobId || askedFor.current === jobId) return;
    askedFor.current = jobId;
    void getLocationAccess().then((access) => {
      if (access === 'ask') setAskLocation(true);
    });
  }, [enRoute, jobId]);

  // A different job in the same screen starts over: no alert for a status it never had
  useEffect(() => {
    lastStatus.current = null;
    nudged.current = false;
  }, [activeJobId]);

  // The status changed under the person (their own action, a poll or a socket event): buzz, and scroll the control
  // that is now theirs into view. The first load only records where the job is, so opening the screen is silent.
  useEffect(() => {
    if (!job) return;
    const status = job.status;
    const previous = lastStatus.current;
    lastStatus.current = status;
    if (previous === null || previous === status) return;
    const step = jobStep(status, job.viewer === 'worker' ? 'worker' : 'customer');
    if (!step) return;
    buzz(step.level);
    const y = step.section ? sectionY.current[step.section] : undefined;
    if (y === undefined || typing.current) return;
    // Let the newly rendered block settle before scrolling to where it was measured
    const timer = setTimeout(() => scrollRef.current?.scrollTo({ y: Math.max(y - Spacing.lg, 0), animated: true }), 300);
    return () => clearTimeout(timer);
  }, [job]);

  const workerPoint = currentLat !== null && currentLng !== null ? { lat: currentLat, lng: currentLng } : null;
  const destination = typeof job?.lat === 'number' && typeof job?.lng === 'number' ? { lat: job.lat, lng: job.lng } : null;

  // Arrived in front of the address: buzz, say so, and put the code entry under their thumb. The worker is usually
  // still holding the phone from the navigation, so this is the moment the next step has to be visible.
  useEffect(() => {
    if (!isWorker || job?.status !== 'ASSIGNED' || !workerPoint || !destination) return;
    const km = distanceKm(workerPoint, destination);
    if (km > LEFT_THE_DOOR_KM) {
      nudged.current = false; // they drove off again (wrong turn, another street): the next approach may nudge
      return;
    }
    if (km > AT_THE_DOOR_KM || nudged.current) return;
    nudged.current = true;
    void clearReturnReminder();
    void ringAlert({
      title: t('You have reached the job'),
      body: t('Ask the customer for the 4-digit arrival code'),
      level: 'loud',
      data: { type: TRIP_RETURN_TYPE, jobId },
    });
    const y = sectionY.current.arrival;
    if (y !== undefined) scrollRef.current?.scrollTo({ y: Math.max(y - Spacing.lg, 0), animated: true });
  }, [isWorker, job?.status, jobId, workerPoint?.lat, workerPoint?.lng, destination?.lat, destination?.lng]); // eslint-disable-line react-hooks/exhaustive-deps

  // The reminder in the shade belongs to one trip only, and to the time the worker is actually away from the app
  useEffect(() => {
    if (!enRoute) {
      void clearReturnReminder();
      return undefined;
    }
    const appState = AppState.addEventListener('change', (next) => {
      if (next === 'active') void clearReturnReminder(); // they are back: nothing left to tap
    });
    return () => {
      appState.remove();
      void clearReturnReminder();
    };
  }, [enRoute]);

  const reenableGps = async () => {
    const access = await requestWorkerLocationAccess();
    if (access === 'granted' && jobId) await workerTracking.startTracking(jobId);
  };

  // Development only: drive a pretend worker to the job so both screens can be tried without moving
  const [simulating, setSimulating] = useState(() => __DEV__ && workerTracking.isSimulating());
  const toggleSimulation = async () => {
    if (!jobId) return;
    if (simulating) {
      workerTracking.stopSimulation();
      setSimulating(false);
      void workerTracking.startTracking(jobId); // back to the real GPS
      return;
    }
    setSimulating(await workerTracking.startSimulation(jobId, { destination }));
  };

  const openNavigation = async () => {
    for (const url of navigationUrls(destination, job?.addressLine, Platform.OS === 'android')) {
      try {
        await Linking.openURL(url);
        if (jobId) void showReturnReminder(jobId);
        return;
      } catch {
        /* no app for this link: try the next one */
      }
    }
    void notify(t('Navigation not available'), t('The customer has not shared a map location or address for this job. Please call them for directions.'));
  };

  // Runs one server action, shows its error under the buttons, and refreshes the screen on success
  const run = async (name: string, action: () => Promise<unknown>, after?: () => void) => {
    if (busy) return;
    setBusy(name);
    setActionError(null);
    try {
      await action();
      await state.reload();
      after?.();
    } catch (error) {
      const fields = isApiError(error) ? error.details.map((d) => `${d.field}: ${d.issue}`).join('; ') : '';
      const message = error instanceof Error && !isApiError(error) ? error.message : userMessage(error);
      setActionError(message + (fields ? ` (${fields})` : ''));
    } finally {
      setBusy(null);
    }
  };

  const items: DraftItem[] =
    draft ?? (bill?.items.filter((i) => i.kind !== 'VISIT_FEE').map((i) => ({ kind: i.kind as DraftItem['kind'], description: i.description, amount: String(i.amount) })) ?? []);
  const updateItem = (index: number, patch: Partial<DraftItem>) => setDraft(items.map((it, i) => (i === index ? { ...it, ...patch } : it)));

  const saveItems = () =>
    run('items', async () => {
      const parsed = items.map((it) => ({ kind: it.kind, description: it.description.trim(), amount: Number(it.amount) }));
      if (parsed.some((it) => !it.description || !Number.isFinite(it.amount) || it.amount < 0)) throw new Error(t('Each line needs a description and an amount in rupees.'));
      await putBillItems(activeJobId!, parsed);
      setDraft(null);
    });

  // The busy key names the side, so adding a BEFORE photo does not make the AFTER button say "Uploading…" as well
  const addPhoto = (kind: 'BEFORE' | 'AFTER') =>
    run(`photo:${kind}`, async () => {
      const picked = await pickImage();
      if (!picked) return;
      await addWorkPhoto(activeJobId!, kind, await uploadFile('WORK_PROOF', picked));
    });

  // Proof of work is compulsory: a BEFORE photo before the bill goes to the customer (so it is taken before the work
  // starts), and an AFTER one before the work can be marked finished. The server refuses to finish without both.
  const beforeCount = job?.workPhotos?.before.length ?? 0;
  const afterCount = job?.workPhotos?.after.length ?? 0;
  const proofComplete = beforeCount > 0 && afterCount > 0;

  // Only possible once the customer approved the cost (IN_PROGRESS); the server refuses it before that
  const finishWork = () => run('complete', () => completeWork(activeJobId!));

  const pay = async (method: PaymentMethod) => {
    if (!bill) return;
    const ok = await confirmAction(
      t('Confirm payment'),
      method === 'UPI'
        ? t('Mark {amount} as paid to {name} by UPI? Only do this after the payment is made.', { amount: money(bill.total), name: bill.payTo.name })
        : t('Mark {amount} as paid to {name} in cash? Only do this after the payment is made.', { amount: money(bill.total), name: bill.payTo.name }),
      t('Yes, I paid'),
    );
    if (!ok) return;
    await run('pay', () => payJob(activeJobId!, method), () => router.replace('/rating'));
  };

  // The worker cannot continue (on the way, or on site). The server re-opens the request or closes it, depending on why.
  const cancelAsWorker = (stage: 'ASSIGNED' | 'ARRIVED') =>
    void cancel(activeJobId!, stage, {
      visitFee,
      onCancelled: async (result) => {
        workerTracking.stopTracking();
        let warning: string | null = null;
        try {
          warning = backOutWarning((await getMyCancellations()).summary);
        } catch {
          /* the warning is a courtesy: never hide that the job was cancelled because it could not be loaded */
        }
        const { title, message } = cancelledMessage('WORKER', result.status === 'OPEN');
        setActiveJobId(null); // a re-opened job is no longer theirs: do not keep pointing at it
        router.replace('/(tabs)/leads');
        void notify(title, warning ? `${message}\n\n${warning}` : message);
      },
      onFailed: () => state.reload(),
    });

  // The customer, with the worker on site, refuses the cost: the job closes and the visit fee is owed directly
  const declineCost = () => void cancel(activeJobId!, 'ARRIVED', { visitFee, onCancelled: () => state.reload(), onFailed: () => state.reload() });

  const call = () => {
    const phone = other?.phone;
    if (phone) void callPhone(phone, other?.name ?? '');
  };

  const timeline = job && job.status !== 'CANCELLED'
    ? [
        { title: t('Worker accepted the job'), desc: job.assignedAt ? t('At {time}', { time: timeOf(job.assignedAt) }) : t('Waiting'), done: !!job.assignedAt },
        {
          title: t('Technician arrived at location'),
          desc: job.arrivedAt ? t('Arrival code verified at {time}', { time: timeOf(job.arrivedAt) }) : t('Share the arrival code when the worker reaches you'),
          done: !!job.arrivedAt,
        },
        {
          title: t('Cost approved, work started'),
          desc: job.status === 'ARRIVED' ? t('Waiting for the customer to approve the cost') : t('Approved'),
          done: ['IN_PROGRESS', 'WORK_COMPLETED', 'COMPLETED'].includes(job.status),
        },
        { title: t('Work completed'), desc: ['WORK_COMPLETED', 'COMPLETED'].includes(job.status) ? t('Bill is ready') : t('In progress'), done: ['WORK_COMPLETED', 'COMPLETED'].includes(job.status) },
        { title: t('Paid & closed'), desc: job.completedAt ? t('At {time}', { time: timeOf(job.completedAt) }) : t('Settled directly with the worker'), done: job.status === 'COMPLETED' },
      ]
    : [];
  const nextIndex = timeline.findIndex((m) => !m.done);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => (router.canGoBack() ? router.back() : router.replace(isWorker ? '/(tabs)/leads' : '/tracking'))}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel={t('Go back')}
          >
            <ArrowLeft color="#1E293B" size={20} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>{t('Job Progress & Completion')}</Text>
            <Text style={styles.headerSubtitle} numberOfLines={1}>{job ? t('Booking {reference} • Direct Settlement', { reference: job.reference }) : t('Loading…')}</Text>
          </View>
        </View>
        <View style={styles.statusPill}>
          <Text style={styles.statusPillText}>{job ? statusPill[job.status] ?? job.status : '…'}</Text>
        </View>
      </View>

      <KeyboardAwareScrollView ref={scrollRef} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {!activeJobId && <EmptyBlock title={t('No job selected')} hint={t('Open a job from Activity.')} />}
        {activeJobId && state.loading && <LoadingBlock label={t('Loading job…')} />}
        {state.error && !state.data && <ErrorBlock message={state.error} onRetry={() => void state.reload()} />}

        {job && (
          <>
            {/* The other party */}
            {other && (
              <View style={styles.card}>
                <View style={styles.workerRow}>
                  <Avatar uri={isWorker ? null : job.worker?.photoUrl} size={44} style={styles.workerAvatar} />
                  <View style={{ flex: 1 }}>
                    <View style={styles.nameRow}>
                      <Text style={styles.workerName}>{other.name}</Text>
                      {!isWorker && <ShieldCheck color={Colors.primary} size={15} />}
                    </View>
                    <Text style={styles.workerTrade}>{isWorker ? job.title : job.worker ? categoryTitle(job.worker.tradeId, job.worker.trade, lang) : ''}</Text>
                    {!isWorker && job.worker?.vehicle ? <Text style={styles.workerVehicle}>🛵 {job.worker.vehicle}</Text> : null}
                  </View>
                  {other.phone ? (
                    <TouchableOpacity style={styles.callSmallBtn} onPress={call} activeOpacity={0.8} accessibilityRole="button">
                      <Phone color="#065F46" size={14} />
                      <Text style={styles.callSmallText}>{t('Call')}</Text>
                    </TouchableOpacity>
                  ) : null}
                </View>
              </View>
            )}

            {/* Where the worker has to go. The server sends the full address only to the worker who was assigned,
                so this card appears once the job is theirs and stays while they are on site. */}
            {isWorker && ['ASSIGNED', 'ARRIVED', 'IN_PROGRESS', 'WORK_COMPLETED'].includes(job.status) && (
              <View style={styles.card}>
                <Text style={styles.sectionTitle}>{t('Customer Address')}</Text>
                <View style={styles.addressRow}>
                  <MapPin color={Colors.error} size={20} />
                  <View style={{ flex: 1 }}>
                    {job.addressLine ? (
                      <Text style={styles.addressLine}>{job.addressLine}</Text>
                    ) : (
                      <Text style={styles.addressLine}>{t('No house number was typed. Call the customer for directions.')}</Text>
                    )}
                    <Text style={styles.addressArea}>
                      {[job.locality, job.area.name, job.city.name].filter(Boolean).join(' • ')}
                    </Text>
                    {destination ? null : <Text style={styles.hint}>{t('The customer did not pin an exact spot on the map.')}</Text>}
                  </View>
                </View>
                <View style={styles.addressBtnRow}>
                  <TouchableOpacity style={styles.addressNavBtn} onPress={() => void openNavigation()} activeOpacity={0.85} accessibilityRole="button">
                    <Navigation color="#FFFFFF" size={15} />
                    <Text style={styles.addressNavText}>{t('Navigate')}</Text>
                  </TouchableOpacity>
                  {other?.phone ? (
                    <TouchableOpacity style={styles.addressCallBtn} onPress={call} activeOpacity={0.85} accessibilityRole="button">
                      <Phone color="#065F46" size={15} />
                      <Text style={styles.addressCallText}>{t('Call customer')}</Text>
                    </TouchableOpacity>
                  ) : null}
                </View>
              </View>
            )}

            {/* What the customer photographed when they posted the job. Both sides see them; a tap opens one full screen. */}
            {job.photoUrls.length > 0 && (
              <View style={styles.card}>
                <Text style={styles.sectionTitle}>{isWorker ? t('Photos from the customer') : t('Photos you attached')}</Text>
                <View style={styles.photoThumbRow}>
                  {job.photoUrls.map((url, index) => (
                    <TouchableOpacity
                      key={url}
                      onPress={() => viewImage(url, t('Job photo {number}', { number: index + 1 }))}
                      activeOpacity={0.85}
                      accessibilityRole="imagebutton"
                      accessibilityLabel={t('View job photo {number} full screen', { number: index + 1 })}
                    >
                      <Image source={{ uri: url }} style={styles.proofThumb} resizeMode="cover" accessibilityIgnoresInvertColors />
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {enRoute && <LateBanner job={job} viewer="worker" />}

            {/* Worker on the way: live GPS status, map and turn-by-turn navigation */}
            {enRoute && (
              <View style={styles.card}>
                <Text style={styles.sectionTitle}>{t('On the way')}</Text>
                {isTrackingActive ? (
                  <View style={[styles.gpsPill, styles.gpsOn]} accessibilityLiveRegion="polite">
                    <Text style={styles.gpsOnText}>🟢 {t('Live GPS Sharing Active • Customer can see your arrival')}</Text>
                  </View>
                ) : trackingIssue ? (
                  <TouchableOpacity style={[styles.gpsPill, styles.gpsOff]} onPress={() => void reenableGps()} activeOpacity={0.8} accessibilityRole="button" accessibilityLabel={t('GPS paused. Tap to re-enable location')}>
                    <Text style={styles.gpsOffText}>
                      ⚠️ {t('GPS Paused • Tap to re-enable location')}{trackingIssue === 'SERVICES_OFF' ? ` ${t('(phone location is off)')}` : ''}
                    </Text>
                  </TouchableOpacity>
                ) : (
                  <View style={[styles.gpsPill, styles.gpsWait]}>
                    <Text style={styles.gpsWaitText}>{t('Starting GPS…')}</Text>
                  </View>
                )}

                {(workerPoint || destination) && (
                  <View style={{ marginTop: Spacing.md }}>
                    <TripMap
                      worker={workerPoint}
                      destination={destination}
                      vehicle={workerProfile?.vehicle}
                      distanceKm={tracking?.distanceKm ?? null}
                      etaMinutes={tracking?.etaMinutes ?? null}
                      height={240}
                      expandable
                      title={job.addressLine ? t('To {address}', { address: job.addressLine }) : t('On the way to the customer')}
                      onNavigate={() => void openNavigation()}
                    />
                  </View>
                )}

                <TouchableOpacity style={styles.navBtn} onPress={() => void openNavigation()} activeOpacity={0.85} accessibilityRole="button">
                  <Text style={styles.navBtnText}>🗺️ {t('Open in Google Maps Navigation')}</Text>
                </TouchableOpacity>
                <Text style={styles.hint}>
                  {t('Tap the map to see it full screen inside KaamConnect. Google Maps navigation leaves the app; to come back, tap the KaamConnect notification in the status bar.')}
                </Text>
                {__DEV__ && (
                  <TouchableOpacity style={styles.simBtn} onPress={() => void toggleSimulation()} activeOpacity={0.8} accessibilityRole="button">
                    <Text style={styles.simBtnText}>{simulating ? '⏹ Stop simulated drive' : '🧪 Simulate drive from Sector 17 (dev only)' /* developer-only button: not translated */}</Text>
                  </TouchableOpacity>
                )}
                {!destination && <Text style={styles.hint}>{t('The customer did not pin an exact spot, so navigation opens their typed address.')}</Text>}
              </View>
            )}

            {/* Cancelled: who, why, and what (if anything) is owed. Replaces the milestones, which no longer apply. */}
            {job.status === 'CANCELLED' && (
              <View style={[styles.card, styles.cancelledCard]} onLayout={onSectionLayout('cancelled')} accessibilityRole="alert">
                <Text style={styles.cancelledTitle}>{cancelledHeadline(job, isWorker ? 'worker' : 'customer')}</Text>
                <Text style={styles.cancelledReason}>{cancelledReason(job, isWorker ? 'worker' : 'customer')}</Text>
                {visitFeeNotice(job, isWorker ? 'worker' : 'customer') ? <Text style={styles.cancelledFee}>{visitFeeNotice(job, isWorker ? 'worker' : 'customer')}</Text> : null}
                <TouchableOpacity
                  style={[styles.smallBtn, { paddingVertical: 14, marginTop: Spacing.md }]}
                  onPress={() => router.replace(isWorker ? '/(tabs)/leads' : '/(tabs)/home')}
                  accessibilityRole="button"
                >
                  <Text style={styles.smallBtnText}>{isWorker ? t('Back to leads') : t('Back to home')}</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Milestones */}
            {timeline.length > 0 && (
              <View style={styles.card}>
                <Text style={styles.sectionTitle}>{t('Service Milestones')}</Text>
                <View style={styles.timeline}>
                  {timeline.map((m, i) => (
                    <React.Fragment key={i}>
                      <View style={styles.timelineItem}>
                        <View style={[styles.timelineIcon, m.done ? styles.timelineDone : i === nextIndex ? styles.timelineActive : null]}>
                          {m.done ? <CheckCircle2 color="#FFFFFF" size={15} /> : <Text style={styles.timelineStepNumber}>{i + 1}</Text>}
                        </View>
                        <View style={styles.timelineContent}>
                          <Text style={[styles.timelineTitle, i === nextIndex && { color: Colors.tertiary }]}>{m.title}</Text>
                          <Text style={styles.timelineDesc}>{m.desc}</Text>
                        </View>
                      </View>
                      {i < timeline.length - 1 && <View style={styles.timelineLine} />}
                    </React.Fragment>
                  ))}
                </View>
              </View>
            )}

            {/* Worker: arrival code */}
            {isWorker && job.status === 'ASSIGNED' && (
              <View style={styles.card} onLayout={onSectionLayout('arrival')}>
                <Text style={styles.sectionTitle}>{t('Arrival Code')}</Text>
                {job.arrivalLocked ? (
                  <Text style={styles.lockedText} accessibilityRole="alert">
                    {t('Too many wrong codes, so entering a code is locked. Ask the customer to issue a new code from their Tracking screen, or cancel this job below.')}
                  </Text>
                ) : (
                  <Text style={styles.hint}>{t('Ask the customer for the 4-digit code shown in their app to confirm you have arrived.')}</Text>
                )}
                <View style={[styles.inputRow, job.arrivalLocked && { opacity: 0.4 }]} pointerEvents={job.arrivalLocked ? 'none' : 'auto'}>
                  <TextInput
                    style={styles.input}
                    value={code}
                    onChangeText={(text) => setCode(text.replace(/\D/g, '').slice(0, 4))}
                    placeholder="• • • •"
                    placeholderTextColor={Colors.textSubtle}
                    keyboardType="number-pad"
                    maxLength={4}
                    accessibilityLabel={t('Arrival code')}
                  />
                  <TouchableOpacity
                    style={[styles.smallBtn, (code.length !== 4 || busy !== null) && { opacity: 0.6 }]}
                    disabled={code.length !== 4 || busy !== null}
                    onPress={() => void run('arrival', () => verifyArrival(activeJobId!, code), () => {
                      setCode('');
                      workerTracking.stopTracking(); // arrived: the customer no longer needs the live dot
                    })}
                    accessibilityRole="button"
                  >
                    {busy === 'arrival' ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.smallBtnText}>{t('Verify arrival')}</Text>}
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Work proof photos */}
            {['ARRIVED', 'IN_PROGRESS', 'WORK_COMPLETED', 'COMPLETED'].includes(job.status) && (
              <View style={styles.card} onLayout={onSectionLayout('photos')}>
                <Text style={styles.sectionTitle}>{t('Work Proof Photos')}</Text>
                {isWorker && ['ARRIVED', 'IN_PROGRESS'].includes(job.status) && !proofComplete && (
                  <Text style={styles.proofRule}>
                    {job.status === 'ARRIVED'
                      ? t('Required: take a BEFORE photo now, before you start the work. You will add an AFTER photo when you finish.')
                      : t('Required: at least one BEFORE and one AFTER photo before you can mark the work finished.')}
                  </Text>
                )}
                <View style={styles.photosGrid}>
                  {(['before', 'after'] as const).map((side) => {
                    const urls = job.workPhotos?.[side] ?? [];
                    return (
                      <View key={side} style={styles.photoCol}>
                        <View style={styles.photoLabelRow}>
                          <Text style={side === 'before' ? styles.photoLabelBefore : styles.photoLabelAfter}>{side === 'before' ? t('BEFORE') : t('AFTER')}</Text>
                          {isWorker && ['ARRIVED', 'IN_PROGRESS'].includes(job.status) && (
                            urls.length > 0 ? <CheckCircle2 color={Colors.primary} size={15} /> : <Text style={styles.requiredChip}>{t('Required')}</Text>
                          )}
                        </View>
                        <View style={styles.photoThumbRow}>
                          {urls.length === 0 && <Image source={PHOTO_PLACEHOLDER} style={styles.proofImage} />}
                          {urls.map((u) => (
                            <TouchableOpacity
                              key={u}
                              onPress={() => viewImage(u, side === 'before' ? t('Before the work') : t('After the work'))}
                              activeOpacity={0.85}
                              accessibilityRole="imagebutton"
                              accessibilityLabel={side === 'before' ? t('View the before photo full screen') : t('View the after photo full screen')}
                            >
                              <Image source={{ uri: u }} style={styles.proofThumb} resizeMode="cover" accessibilityIgnoresInvertColors />
                            </TouchableOpacity>
                          ))}
                        </View>
                        {isWorker && ['ARRIVED', 'IN_PROGRESS'].includes(job.status) && (
                          <TouchableOpacity style={[styles.ghostBtn, { marginTop: 6 }]} onPress={() => void addPhoto(side === 'before' ? 'BEFORE' : 'AFTER')} disabled={busy !== null} accessibilityRole="button">
                            <Text style={styles.ghostBtnText}>{busy === `photo:${side === 'before' ? 'BEFORE' : 'AFTER'}` ? t('Uploading…') : t('+ Add photo')}</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    );
                  })}
                </View>
              </View>
            )}

            {/* Bill */}
            {bill && (
              <View style={[styles.card, styles.billCard]} onLayout={onSectionLayout('bill')}>
                <View style={styles.billHeader}>
                  <Text style={[styles.sectionTitle, { flex: 1, marginBottom: 0 }]}>{t('Transparent Bill')}</Text>
                  <View style={styles.zeroCutBadge}>
                    <Text style={styles.zeroCutBadgeText}>{t('0% APP CUT')}</Text>
                  </View>
                </View>

                {isWorker && job.status === 'ARRIVED' ? (
                  <>
                    {bill.items.filter((i) => i.kind === 'VISIT_FEE').map((i) => (
                      <View key={i.id} style={styles.billRow}>
                        <Text style={styles.billItem}>{t('Visiting & Inspection Fee')}</Text>
                        <Text style={styles.billAmount}>{money(i.amount)}</Text>
                      </View>
                    ))}
                    {items.map((it, index) => (
                      <View key={index} style={styles.itemBox}>
                        <View style={styles.chipRow}>
                          {KINDS.map((k) => (
                            <TouchableOpacity key={k} style={[styles.chip, it.kind === k && styles.chipOn]} onPress={() => updateItem(index, { kind: k })} accessibilityRole="button" accessibilityState={{ selected: it.kind === k }}>
                              <Text style={[styles.chipText, it.kind === k && styles.chipTextOn]}>{k === 'PARTS' ? t('Parts') : k === 'LABOUR' ? t('Labour') : t('Other')}</Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                        <View style={styles.inputRow}>
                          <TextInput style={[styles.input, { flex: 2 }]} value={it.description} onChangeText={(text) => updateItem(index, { description: text.slice(0, 120) })} onFocus={() => (typing.current = true)} onBlur={() => (typing.current = false)} placeholder={t('What was done or part used')} placeholderTextColor={Colors.textSubtle} />
                          <TextInput style={styles.input} value={it.amount} onChangeText={(text) => updateItem(index, { amount: text.replace(/[^0-9.]/g, '').slice(0, 8) })} onFocus={() => (typing.current = true)} onBlur={() => (typing.current = false)} placeholder="₹" placeholderTextColor={Colors.textSubtle} keyboardType="decimal-pad" />
                          <TouchableOpacity style={styles.ghostBtn} onPress={() => setDraft(items.filter((_, i) => i !== index))} accessibilityRole="button" accessibilityLabel={t('Remove this line')}>
                            <Text style={styles.ghostBtnText}>✕</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    ))}
                    <View style={[styles.inputRow, { justifyContent: 'space-between' }]}>
                      <TouchableOpacity style={styles.ghostBtn} onPress={() => setDraft([...items, { kind: 'PARTS', description: '', amount: '' }])} accessibilityRole="button">
                        <Text style={styles.ghostBtnText}>{t('+ Add line')}</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={[styles.smallBtn, (busy !== null || !draft) && { opacity: 0.6 }]} onPress={() => void saveItems()} disabled={busy !== null || !draft} accessibilityRole="button">
                        {busy === 'items' ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.smallBtnText}>{t('Save bill')}</Text>}
                      </TouchableOpacity>
                    </View>
                    <Text style={styles.hint}>{t('Current total: {amount}. Save it, then the customer approves the cost before you start the work.', { amount: money(bill.total) })}</Text>
                  </>
                ) : (
                  <>
                    {bill.items.map((i) => (
                      <View key={i.id} style={styles.billRow}>
                        <Text style={styles.billItem}>{i.kind === 'VISIT_FEE' ? t('Visiting & Inspection Fee') : i.description}</Text>
                        <Text style={styles.billAmount}>{money(i.amount)}</Text>
                      </View>
                    ))}
                  </>
                )}

                <View style={styles.billRowHighlight}>
                  <Text style={styles.billHighlightText}>{t('KaamConnect Platform Commission')}</Text>
                  <Text style={styles.billHighlightAmount}>{t('₹0.00 (FREE)')}</Text>
                </View>
                <View style={styles.billTotalRow}>
                  <Text style={styles.totalLabel}>{isWorker ? t('Total Payable by Customer') : t('Total Payable to Worker')}</Text>
                  <Text style={styles.totalAmount}>{money(bill.total)}</Text>
                </View>
              </View>
            )}

            {/* Everything that is a button for one side or the other: the block the status change scrolls to */}
            <View style={{ gap: Spacing.lg }} onLayout={onSectionLayout('actions')}>
              {/* Worker: finish */}
              {isWorker && job.status === 'ARRIVED' && (
                <EmptyBlock title={t('Waiting for the customer to approve the cost')} hint={t('Save the bill above. Start the work once they approve. This page refreshes by itself.')} />
              )}
              {isWorker && job.status === 'IN_PROGRESS' && (
                <View style={{ gap: Spacing.sm }}>
                  {!proofComplete && (
                    <View style={styles.proofChecklist} accessibilityRole="alert">
                      <Text style={styles.proofChecklistTitle}>{t('Before you finish, add the work photos:')}</Text>
                      <Text style={beforeCount > 0 ? styles.proofDone : styles.proofMissing}>{beforeCount > 0 ? '✓' : '✗'} {t('BEFORE photo')}</Text>
                      <Text style={afterCount > 0 ? styles.proofDone : styles.proofMissing}>{afterCount > 0 ? '✓' : '✗'} {t('AFTER photo')}</Text>
                    </View>
                  )}
                  <TouchableOpacity
                    style={[styles.smallBtn, { paddingVertical: 14 }, (busy !== null || !proofComplete) && { opacity: 0.5 }]}
                    onPress={() => void finishWork()}
                    disabled={busy !== null || !proofComplete}
                    accessibilityRole="button"
                    accessibilityState={{ disabled: busy !== null || !proofComplete }}
                  >
                    {busy === 'complete' ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.smallBtnText}>{t('Work finished: send bill to customer')}</Text>}
                  </TouchableOpacity>
                </View>
              )}
              {isWorker && job.status === 'WORK_COMPLETED' && <EmptyBlock title={t('Waiting for the payment')} hint={t('The customer pays you directly and then marks it paid. This page refreshes by itself.')} />}
              {isWorker && job.status === 'COMPLETED' && (
                <TouchableOpacity style={[styles.smallBtn, { paddingVertical: 14 }]} onPress={() => router.replace('/(tabs)/leads')} accessibilityRole="button">
                  <Text style={styles.smallBtnText}>{t('Paid: back to leads')}</Text>
                </TouchableOpacity>
              )}

              {/* Customer: approve, then pay */}
              {!isWorker && bill && job.status === 'ARRIVED' && !bill.approved && (
                <TouchableOpacity
                  style={[styles.smallBtn, { paddingVertical: 14 }, busy !== null && { opacity: 0.6 }]}
                  onPress={() => void run('approve', () => approveBill(activeJobId!, bill.total))}
                  disabled={busy !== null}
                  accessibilityRole="button"
                >
                  {busy === 'approve' ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.smallBtnText}>{t('Approve cost {amount} and start the work', { amount: money(bill.total) })}</Text>}
                </TouchableOpacity>
              )}
              {/* Not happy with the cost: leave without starting. Once the cost is approved this is no longer possible. */}
              {!isWorker && job.status === 'ARRIVED' && (
                <TouchableOpacity
                  style={[styles.dangerBtn, (cancelling || busy !== null) && { opacity: 0.6 }]}
                  onPress={declineCost}
                  disabled={cancelling || busy !== null}
                  activeOpacity={0.8}
                  accessibilityRole="button"
                >
                  <Text style={styles.dangerBtnText}>{cancelling ? t('Cancelling…') : t('Decline the cost and cancel')}</Text>
                </TouchableOpacity>
              )}
              {!isWorker && bill && job.status === 'WORK_COMPLETED' && (
                <View style={styles.qrCard}>
                  <Text style={styles.qrTitle}>{t('Pay Directly to {name}', { name: bill.payTo.name })}</Text>
                  <Text style={styles.qrSubtitle}>
                    {bill.payTo.upiId ? (
                      <>{t('UPI ID:')} <Text style={{ fontWeight: '800' }}>{bill.payTo.upiId}</Text> {t('(GPay / PhonePe / Paytm) or pay cash')}</>
                    ) : (
                      t('Pay the worker in cash, or ask for their UPI ID')
                    )}
                  </Text>
                  <Text style={styles.hint}>{t('KaamConnect does not touch the money. Pay the worker first, then confirm below.')}</Text>
                  <View style={[styles.actionRow, { marginTop: 12 }]}>
                    <TouchableOpacity style={[styles.payBtn, styles.payBtnPrimary, busy !== null && styles.payBtnDisabled]} onPress={() => void pay('UPI')} disabled={busy !== null} activeOpacity={0.8} accessibilityRole="button">
                      <Zap color="#FFFFFF" size={16} />
                      <Text style={styles.payBtnText}>{busy === 'pay' ? t('Saving…') : t('Paid {amount} via UPI ✓', { amount: money(bill.total) })}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.payBtn, styles.payBtnCash, busy !== null && styles.payBtnDisabled]} onPress={() => void pay('CASH')} disabled={busy !== null} activeOpacity={0.8} accessibilityRole="button">
                      <Text style={styles.payBtnCashText}>{t('Paid Cash')} 💵</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
              {!isWorker && job.status === 'COMPLETED' && (
                <TouchableOpacity style={[styles.smallBtn, { paddingVertical: 14 }]} onPress={() => router.replace('/rating')} accessibilityRole="button">
                  <Text style={styles.smallBtnText}>{job.review ? t('Thanks for rating') : t('Rate this job')}</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* The worker cannot continue: on the way (ASSIGNED) or on site before the cost is approved (ARRIVED) */}
            {isWorker && (job.status === 'ASSIGNED' || job.status === 'ARRIVED') && (
              <TouchableOpacity
                style={[styles.dangerBtn, (cancelling || busy !== null) && { opacity: 0.6 }]}
                onPress={() => cancelAsWorker(job.status as 'ASSIGNED' | 'ARRIVED')}
                disabled={cancelling || busy !== null}
                activeOpacity={0.8}
                accessibilityRole="button"
              >
                <Text style={styles.dangerBtnText}>
                  {cancelling ? t('Cancelling…') : job.status === 'ASSIGNED' ? t('Cannot make it? Cancel this job') : t('Cannot do this work? Leave the job')}
                </Text>
              </TouchableOpacity>
            )}

            {actionError && <Text style={styles.errorLine} accessibilityRole="alert">{actionError}</Text>}
          </>
        )}
      </KeyboardAwareScrollView>

      <WorkerLocationPermissionModal
        visible={askLocation}
        onDone={(result) => {
          setAskLocation(false);
          if (result === 'granted' && jobId) void workerTracking.startTracking(jobId);
        }}
      />
      {imageSourceModal}
      {imageViewerModal}
      {cancelModal}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: Colors.border
  },
  headerLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: Radius.full,
    backgroundColor: Colors.surfaceVariant,
    alignItems: 'center',
    justifyContent: 'center'
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.textMain
  },
  headerSubtitle: {
    fontSize: 13,
    color: Colors.textMuted
  },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radius.full,
    backgroundColor: Colors.primaryContainer
  },
  statusPillText: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.primaryDark
  },
  content: {
    padding: Spacing.lg,
    gap: Spacing.lg
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2
  },
  workerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md
  },
  workerAvatar: {
    width: 48,
    height: 48,
    borderRadius: Radius.full
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4
  },
  workerName: {
    flexShrink: 1,
    fontSize: 14,
    fontWeight: '800',
    color: Colors.textMain
  },
  workerTrade: {
    fontSize: 12,
    color: Colors.textMuted
  },
  workerVehicle: {
    fontSize: 13,
    color: Colors.primary,
    fontWeight: '700',
    marginTop: 2
  },
  callSmallBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: Radius.md,
    backgroundColor: Colors.primaryContainer,
    borderWidth: 1,
    borderColor: '#A7F3D0'
  },
  callSmallText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#065F46'
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.textMain,
    marginBottom: Spacing.md
  },
  timeline: {
    gap: 4
  },
  timelineItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md
  },
  timelineIcon: {
    width: 26,
    height: 26,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center'
  },
  timelineDone: {
    backgroundColor: Colors.primary
  },
  timelineActive: {
    backgroundColor: Colors.tertiary
  },
  timelineStepNumber: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800'
  },
  timelineContent: {
    flex: 1
  },
  timelineTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textMain
  },
  timelineDesc: {
    fontSize: 13,
    color: Colors.textMuted
  },
  timelineLine: {
    width: 2,
    height: 18,
    backgroundColor: Colors.border,
    marginLeft: 12,
    marginVertical: 2
  },
  photosGrid: {
    flexDirection: 'row',
    gap: Spacing.md
  },
  photoCol: {
    flex: 1
  },
  photoLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 4
  },
  photoLabelBefore: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.error
  },
  photoLabelAfter: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.primary
  },
  requiredChip: {
    fontSize: 11,
    fontWeight: '800',
    color: '#92400E',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
    overflow: 'hidden'
  },
  proofRule: {
    fontSize: 13,
    fontWeight: '600',
    color: '#92400E',
    backgroundColor: '#FFFBEB',
    borderRadius: Radius.md,
    padding: 10,
    marginBottom: Spacing.sm,
    lineHeight: 18
  },
  proofChecklist: {
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FCD34D',
    borderRadius: Radius.md,
    padding: 12,
    gap: 4
  },
  proofChecklistTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#92400E'
  },
  proofDone: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.primaryDark
  },
  proofMissing: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.error
  },
  proofImage: {
    width: '100%',
    height: 95,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border
  },
  // A thumbnail sits inside a touchable that sizes itself to its child, so a percentage width would resolve to
  // nothing and the photo would come out invisible. These are fixed squares instead.
  proofThumb: {
    width: 88,
    height: 88,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surfaceVariant
  },
  billCard: {
    borderWidth: 2,
    borderColor: Colors.primary
  },
  billHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.sm,
    marginBottom: Spacing.sm
  },
  zeroCutBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.full,
    backgroundColor: Colors.primaryContainer
  },
  zeroCutBadgeText: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.primaryDark
  },
  billRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.sm,
    paddingVertical: 4
  },
  billItem: {
    flex: 1,
    fontSize: 12,
    color: Colors.textMain
  },
  billAmount: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textMain
  },
  billRowHighlight: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.sm,
    paddingVertical: 6,
    marginTop: 4
  },
  billHighlightText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primary
  },
  billHighlightAmount: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.primary
  },
  billTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingTop: Spacing.md,
    marginTop: 6,
    borderTopWidth: 2,
    borderTopColor: Colors.border
  },
  totalLabel: {
    flex: 1,
    fontSize: 14,
    fontWeight: '800',
    color: Colors.textMain
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.primaryDark
  },
  qrCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.borderDark,
    alignItems: 'center'
  },
  qrTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.textMain,
    textAlign: 'center',
    marginBottom: 2
  },
  qrSubtitle: {
    fontSize: 13,
    color: Colors.textMuted,
    marginBottom: Spacing.md,
    textAlign: 'center'
  },
  qrFrame: {
    width: 140,
    height: 140,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: Colors.borderDark,
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg
  },
  qrCodeLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.textMuted,
    marginTop: 4,
    letterSpacing: 0.5
  },
  actionRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    width: '100%'
  },
  payBtn: {
    flex: 1,
    height: 44,
    borderRadius: Radius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6
  },
  payBtnPrimary: {
    backgroundColor: Colors.primary
  },
  payBtnDisabled: {
    opacity: 0.5
  },
  payBtnText: {
    flexShrink: 1,
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800'
  },
  payBtnCash: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: Colors.borderDark
  },
  payBtnCashText: {
    color: Colors.textMain,
    fontSize: 12,
    fontWeight: '800'
  },
  inputRow: { flexDirection: 'row', gap: 8, alignItems: 'center', marginTop: 8 },
  input: { flex: 1, minWidth: 0, borderWidth: 1.5, borderColor: Colors.borderDark, borderRadius: Radius.md, paddingHorizontal: 12, paddingVertical: 8, fontSize: 13, color: Colors.textMain, backgroundColor: '#FFFFFF' },
  smallBtn: { backgroundColor: Colors.primary, paddingHorizontal: 14, paddingVertical: 10, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center' },
  smallBtnText: { color: '#FFFFFF', fontSize: 12, fontWeight: '800' },
  ghostBtn: { borderWidth: 1.5, borderColor: Colors.borderDark, paddingHorizontal: 12, paddingVertical: 8, borderRadius: Radius.md, backgroundColor: '#FFFFFF' },
  ghostBtnText: { color: Colors.textMain, fontSize: 12, fontWeight: '700' },
  hint: { fontSize: 13, color: Colors.textMuted, marginTop: 6, lineHeight: 18 },
  addressRow: { flexDirection: 'row', gap: Spacing.sm, alignItems: 'flex-start' },
  addressLine: { fontSize: 15, fontWeight: '800', color: Colors.textMain, lineHeight: 21 },
  addressArea: { fontSize: 13, fontWeight: '600', color: Colors.textMuted, marginTop: 2 },
  addressBtnRow: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.md },
  addressNavBtn: {
    flex: 1,
    minHeight: 46,
    borderRadius: Radius.md,
    backgroundColor: Colors.tertiary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  addressNavText: { color: '#FFFFFF', fontSize: 13, fontWeight: '800' },
  addressCallBtn: {
    flex: 1,
    minHeight: 46,
    borderRadius: Radius.md,
    backgroundColor: Colors.primaryContainer,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  addressCallText: { color: '#065F46', fontSize: 13, fontWeight: '800' },
  lockedText: { fontSize: 13, fontWeight: '700', color: Colors.secondaryDark, backgroundColor: Colors.secondaryLight, borderRadius: Radius.md, padding: Spacing.md, marginTop: 6, lineHeight: 19 },
  dangerBtn: { minHeight: 48, borderRadius: Radius.md, borderWidth: 1.5, borderColor: '#FCA5A5', backgroundColor: Colors.errorLight, alignItems: 'center', justifyContent: 'center', paddingHorizontal: Spacing.md, paddingVertical: 10 },
  dangerBtnText: { color: '#991B1B', fontSize: 13, fontWeight: '800', textAlign: 'center' },
  cancelledCard: { borderColor: '#FCA5A5', backgroundColor: Colors.errorLight },
  cancelledTitle: { fontSize: 16, fontWeight: '800', color: '#991B1B' },
  cancelledReason: { fontSize: 14, color: Colors.textMain, marginTop: 6, lineHeight: 20 },
  cancelledFee: { fontSize: 13, fontWeight: '700', color: Colors.secondaryDark, backgroundColor: Colors.secondaryLight, borderRadius: Radius.md, padding: Spacing.md, marginTop: Spacing.md, lineHeight: 19 },
  errorLine: { fontSize: 12, fontWeight: '600', color: Colors.error, marginTop: 8, textAlign: 'center' },
  chipRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap', marginTop: 6 },
  chip: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: Radius.full, borderWidth: 1, borderColor: Colors.borderDark, backgroundColor: '#FFFFFF' },
  chipOn: { backgroundColor: Colors.primaryContainer, borderColor: Colors.primary },
  chipText: { fontSize: 13, fontWeight: '700', color: Colors.textMuted },
  chipTextOn: { color: Colors.primaryDark },
  itemBox: { borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.md, padding: 10, marginTop: 8, backgroundColor: '#FAFCFE' },
  gpsPill: { borderRadius: Radius.full, paddingHorizontal: 14, paddingVertical: 9 },
  gpsOn: { backgroundColor: Colors.successLight, borderWidth: 1, borderColor: '#A7F3D0' },
  gpsOnText: { fontSize: 13, fontWeight: '700', color: '#065F46', textAlign: 'center' },
  gpsOff: { backgroundColor: Colors.secondaryLight, borderWidth: 1, borderColor: '#FCD34D' },
  gpsOffText: { fontSize: 13, fontWeight: '800', color: Colors.secondaryDark, textAlign: 'center' },
  gpsWait: { backgroundColor: Colors.surfaceVariant, borderWidth: 1, borderColor: Colors.border },
  gpsWaitText: { fontSize: 13, fontWeight: '700', color: Colors.textMuted, textAlign: 'center' },
  navBtn: { marginTop: Spacing.md, minHeight: 48, borderRadius: Radius.md, backgroundColor: Colors.tertiary, alignItems: 'center', justifyContent: 'center', paddingHorizontal: Spacing.md },
  simBtn: { marginTop: Spacing.sm, minHeight: 44, borderRadius: Radius.md, borderWidth: 1.5, borderStyle: 'dashed', borderColor: Colors.secondary, backgroundColor: Colors.secondaryLight, alignItems: 'center', justifyContent: 'center', paddingHorizontal: Spacing.md },
  simBtnText: { color: Colors.secondaryDark, fontSize: 13, fontWeight: '800' },
  navBtnText: { color: '#FFFFFF', fontSize: 14, fontWeight: '800' },
  photoThumbRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 6 },
});
