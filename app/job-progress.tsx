import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, TextInput, ActivityIndicator, Linking, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, CheckCircle2, Phone, ShieldCheck, Zap } from 'lucide-react-native';
import { Colors, Spacing, Radius } from '../constants/theme';
import { useStore } from '../store/useStore';
import { useAsync } from '../api/useAsync';
import { addWorkPhoto, approveBill, completeWork, getBill, getJob, getMyCancellations, payJob, putBillItems, verifyArrival } from '../api/endpoints';
import { isApiError, userMessage } from '../api/errors';
import { uploadFile } from '../api/upload';
import { useImagePicker } from '../components/ImageSourceModal';
import { useCancelJob } from '../components/CancelReasonSheet';
import { backOutWarning, cancelledHeadline, cancelledMessage, cancelledReason, visitFeeNotice } from '../utils/cancelReasons';
import { callPhone, confirmAction, notify } from '../utils/dialog';
import { getLocationAccess, requestWorkerLocationAccess } from '../utils/locationPermission';
import { workerTracking } from '../utils/workerTracking';
import { useWorkerTracking } from '../utils/useWorkerTracking';
import LateBanner from '../components/LateBanner';
import { navigationUrls } from '../utils/trip';
import { useSession } from '../store/useSession';
import TripMap from '../components/TripMap';
import WorkerLocationPermissionModal from '../components/WorkerLocationPermissionModal';
import type { BillItemKind, BillView, JobView, PaymentMethod } from '../api/types';
import Avatar from '../components/Avatar';
import { EmptyBlock, ErrorBlock, LoadingBlock } from '../components/StateBlocks';

const POLL_MS = 6000;
const PHOTO_PLACEHOLDER = require('../assets/images/photo-placeholder.png');
const KINDS: Exclude<BillItemKind, 'VISIT_FEE'>[] = ['PARTS', 'LABOUR', 'OTHER'];
const STATUS_PILL: Record<string, string> = {
  OPEN: 'WAITING',
  ASSIGNED: 'ON THE WAY',
  ARRIVED: 'ARRIVED',
  IN_PROGRESS: 'IN PROGRESS',
  WORK_COMPLETED: 'BILL READY',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
};
const money = (n: number) => `₹${n.toFixed(2)}`;
const timeOf = (iso: string | null) => (iso ? new Date(iso).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '');

interface Loaded {
  job: JobView;
  bill: BillView | null;
}
interface DraftItem {
  kind: Exclude<BillItemKind, 'VISIT_FEE'>;
  description: string;
  amount: string;
}

export default function JobProgressScreen() {
  const router = useRouter();
  const { activeJobId, setActiveJobId, currentLat, currentLng, isTrackingActive, trackingIssue } = useStore();
  const workerProfile = useSession((s) => s.workerProfile);
  const [askLocation, setAskLocation] = useState(false);
  const { pick: pickImage, modal: imageSourceModal } = useImagePicker();
  const askedFor = useRef<string | null>(null);
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
      return { job, bill };
    },
    [activeJobId],
    { pollMs: POLL_MS },
  );
  const job = state.data?.job ?? null;
  const bill = state.data?.bill ?? null;
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

  const workerPoint = currentLat !== null && currentLng !== null ? { lat: currentLat, lng: currentLng } : null;
  const destination = typeof job?.lat === 'number' && typeof job?.lng === 'number' ? { lat: job.lat, lng: job.lng } : null;

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
        return;
      } catch {
        /* no app for this link: try the next one */
      }
    }
    void notify('Navigation not available', 'The customer has not shared a map location or address for this job. Please call them for directions.');
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
      if (parsed.some((it) => !it.description || !Number.isFinite(it.amount) || it.amount < 0)) throw new Error('Each line needs a description and an amount in rupees. / हर लाइन में विवरण और राशि लिखें');
      await putBillItems(activeJobId!, parsed);
      setDraft(null);
    });

  const addPhoto = (kind: 'BEFORE' | 'AFTER') =>
    run('photo', async () => {
      const picked = await pickImage();
      if (!picked) return;
      await addWorkPhoto(activeJobId!, kind, await uploadFile('WORK_PROOF', picked));
    });

  // Only possible once the customer approved the cost (IN_PROGRESS); the server refuses it before that
  const finishWork = () => run('complete', () => completeWork(activeJobId!));

  const pay = async (method: PaymentMethod) => {
    if (!bill) return;
    const ok = await confirmAction('Confirm payment', `Mark ${money(bill.total)} as paid to ${bill.payTo.name} by ${method === 'UPI' ? 'UPI' : 'cash'}? Only do this after the payment is made.`, 'Yes, I paid');
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
    if (phone) void callPhone(phone, other?.name ?? 'them');
  };

  const timeline = job && job.status !== 'CANCELLED'
    ? [
        { title: 'Worker accepted the job', desc: job.assignedAt ? `At ${timeOf(job.assignedAt)}` : 'Waiting', done: !!job.assignedAt },
        { title: 'Technician arrived at location', desc: job.arrivedAt ? `Arrival code verified at ${timeOf(job.arrivedAt)}` : 'Share the arrival code when the worker reaches you', done: !!job.arrivedAt },
        { title: 'Cost approved, work started', desc: job.status === 'ARRIVED' ? 'Waiting for the customer to approve the cost' : 'Approved', done: ['IN_PROGRESS', 'WORK_COMPLETED', 'COMPLETED'].includes(job.status) },
        { title: 'Work completed', desc: ['WORK_COMPLETED', 'COMPLETED'].includes(job.status) ? 'Bill is ready' : 'In progress', done: ['WORK_COMPLETED', 'COMPLETED'].includes(job.status) },
        { title: 'Paid & closed', desc: job.completedAt ? `At ${timeOf(job.completedAt)}` : 'Settled directly with the worker', done: job.status === 'COMPLETED' },
      ]
    : [];
  const nextIndex = timeline.findIndex((t) => !t.done);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => (router.canGoBack() ? router.back() : router.replace(isWorker ? '/(tabs)/leads' : '/tracking'))}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <ArrowLeft color="#1E293B" size={20} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>Job Progress & Completion</Text>
            <Text style={styles.headerSubtitle} numberOfLines={1}>{job ? `Booking ${job.reference} • Direct Settlement` : 'Loading…'}</Text>
          </View>
        </View>
        <View style={styles.statusPill}>
          <Text style={styles.statusPillText}>{job ? STATUS_PILL[job.status] ?? job.status : '…'}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {!activeJobId && <EmptyBlock title="No job selected" hint="Open a job from Activity. / गतिविधि से जॉब खोलें" />}
        {activeJobId && state.loading && <LoadingBlock label="Loading job… / जॉब लोड हो रहा है…" />}
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
                    <Text style={styles.workerTrade}>{isWorker ? job.title : job.worker?.trade}</Text>
                    {!isWorker && job.worker?.vehicle ? <Text style={styles.workerVehicle}>🛵 {job.worker.vehicle}</Text> : null}
                  </View>
                  {other.phone ? (
                    <TouchableOpacity style={styles.callSmallBtn} onPress={call} activeOpacity={0.8} accessibilityRole="button">
                      <Phone color="#065F46" size={14} />
                      <Text style={styles.callSmallText}>Call</Text>
                    </TouchableOpacity>
                  ) : null}
                </View>
              </View>
            )}

            {enRoute && <LateBanner job={job} viewer="worker" />}

            {/* Worker on the way: live GPS status, map and turn-by-turn navigation */}
            {enRoute && (
              <View style={styles.card}>
                <Text style={styles.sectionTitle}>On the way (रास्ते में)</Text>
                {isTrackingActive ? (
                  <View style={[styles.gpsPill, styles.gpsOn]} accessibilityLiveRegion="polite">
                    <Text style={styles.gpsOnText}>🟢 Live GPS Sharing Active • Customer can see your arrival</Text>
                  </View>
                ) : trackingIssue ? (
                  <TouchableOpacity style={[styles.gpsPill, styles.gpsOff]} onPress={() => void reenableGps()} activeOpacity={0.8} accessibilityRole="button" accessibilityLabel="GPS paused. Tap to re-enable location">
                    <Text style={styles.gpsOffText}>
                      ⚠️ GPS Paused • Tap to re-enable location{trackingIssue === 'SERVICES_OFF' ? ' (phone location is off)' : ''}
                    </Text>
                  </TouchableOpacity>
                ) : (
                  <View style={[styles.gpsPill, styles.gpsWait]}>
                    <Text style={styles.gpsWaitText}>Starting GPS…</Text>
                  </View>
                )}

                {(workerPoint || destination) && (
                  <View style={{ marginTop: Spacing.md }}>
                    <TripMap worker={workerPoint} destination={destination} vehicle={workerProfile?.vehicle} height={200} />
                  </View>
                )}

                <TouchableOpacity style={styles.navBtn} onPress={() => void openNavigation()} activeOpacity={0.85} accessibilityRole="button">
                  <Text style={styles.navBtnText}>🗺️ Open in Google Maps Navigation</Text>
                </TouchableOpacity>
                {__DEV__ && (
                  <TouchableOpacity style={styles.simBtn} onPress={() => void toggleSimulation()} activeOpacity={0.8} accessibilityRole="button">
                    <Text style={styles.simBtnText}>{simulating ? '⏹ Stop simulated drive' : '🧪 Simulate drive from Sector 17 (dev only)'}</Text>
                  </TouchableOpacity>
                )}
                {!destination && <Text style={styles.hint}>The customer did not pin an exact spot, so navigation opens their typed address.</Text>}
              </View>
            )}

            {/* Cancelled: who, why, and what (if anything) is owed. Replaces the milestones, which no longer apply. */}
            {job.status === 'CANCELLED' && (
              <View style={[styles.card, styles.cancelledCard]} accessibilityRole="alert">
                <Text style={styles.cancelledTitle}>{cancelledHeadline(job, isWorker ? 'worker' : 'customer')}</Text>
                <Text style={styles.cancelledReason}>{cancelledReason(job, 'worker')}</Text>
                {visitFeeNotice(job, isWorker ? 'worker' : 'customer') ? <Text style={styles.cancelledFee}>{visitFeeNotice(job, isWorker ? 'worker' : 'customer')}</Text> : null}
                <TouchableOpacity
                  style={[styles.smallBtn, { paddingVertical: 14, marginTop: Spacing.md }]}
                  onPress={() => router.replace(isWorker ? '/(tabs)/leads' : '/(tabs)/home')}
                  accessibilityRole="button"
                >
                  <Text style={styles.smallBtnText}>{isWorker ? 'Back to leads' : 'Back to home'}</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Milestones */}
            {timeline.length > 0 && (
              <View style={styles.card}>
                <Text style={styles.sectionTitle}>Service Milestones (कार्य प्रगति)</Text>
                <View style={styles.timeline}>
                  {timeline.map((t, i) => (
                    <React.Fragment key={t.title}>
                      <View style={styles.timelineItem}>
                        <View style={[styles.timelineIcon, t.done ? styles.timelineDone : i === nextIndex ? styles.timelineActive : null]}>
                          {t.done ? <CheckCircle2 color="#FFFFFF" size={15} /> : <Text style={styles.timelineStepNumber}>{i + 1}</Text>}
                        </View>
                        <View style={styles.timelineContent}>
                          <Text style={[styles.timelineTitle, i === nextIndex && { color: Colors.tertiary }]}>{t.title}</Text>
                          <Text style={styles.timelineDesc}>{t.desc}</Text>
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
              <View style={styles.card}>
                <Text style={styles.sectionTitle}>Arrival Code (आगमन कोड)</Text>
                {job.arrivalLocked ? (
                  <Text style={styles.lockedText} accessibilityRole="alert">
                    Too many wrong codes, so entering a code is locked. Ask the customer to issue a new code from their Tracking screen, or cancel this job below. / ग्राहक से नया कोड जारी करने को कहें
                  </Text>
                ) : (
                  <Text style={styles.hint}>Ask the customer for the 4-digit code shown in their app to confirm you have arrived.</Text>
                )}
                <View style={[styles.inputRow, job.arrivalLocked && { opacity: 0.4 }]} pointerEvents={job.arrivalLocked ? 'none' : 'auto'}>
                  <TextInput
                    style={styles.input}
                    value={code}
                    onChangeText={(t) => setCode(t.replace(/\D/g, '').slice(0, 4))}
                    placeholder="• • • •"
                    placeholderTextColor={Colors.textSubtle}
                    keyboardType="number-pad"
                    maxLength={4}
                    accessibilityLabel="Arrival code"
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
                    {busy === 'arrival' ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.smallBtnText}>Verify arrival</Text>}
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Work proof photos */}
            {['ARRIVED', 'IN_PROGRESS', 'WORK_COMPLETED', 'COMPLETED'].includes(job.status) && (
              <View style={styles.card}>
                <Text style={styles.sectionTitle}>Work Proof Photos (मरम्मत फ़ोटो)</Text>
                <View style={styles.photosGrid}>
                  {(['before', 'after'] as const).map((side) => {
                    const urls = job.workPhotos?.[side] ?? [];
                    return (
                      <View key={side} style={styles.photoCol}>
                        <Text style={side === 'before' ? styles.photoLabelBefore : styles.photoLabelAfter}>{side === 'before' ? 'BEFORE (पहले)' : 'AFTER (बाद में)'}</Text>
                        <View style={styles.photoThumbRow}>
                          {urls.length === 0 && <Image source={PHOTO_PLACEHOLDER} style={styles.proofImage} />}
                          {urls.map((u) => (
                            <Image key={u} source={{ uri: u }} style={styles.proofImage} />
                          ))}
                        </View>
                        {isWorker && ['ARRIVED', 'IN_PROGRESS'].includes(job.status) && (
                          <TouchableOpacity style={[styles.ghostBtn, { marginTop: 6 }]} onPress={() => void addPhoto(side === 'before' ? 'BEFORE' : 'AFTER')} disabled={busy !== null} accessibilityRole="button">
                            <Text style={styles.ghostBtnText}>{busy === 'photo' ? 'Uploading…' : '+ Add photo'}</Text>
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
              <View style={[styles.card, styles.billCard]}>
                <View style={styles.billHeader}>
                  <Text style={[styles.sectionTitle, { flex: 1, marginBottom: 0 }]}>Transparent Bill (बिल विवरण)</Text>
                  <View style={styles.zeroCutBadge}>
                    <Text style={styles.zeroCutBadgeText}>0% APP CUT</Text>
                  </View>
                </View>

                {isWorker && job.status === 'ARRIVED' ? (
                  <>
                    {bill.items.filter((i) => i.kind === 'VISIT_FEE').map((i) => (
                      <View key={i.id} style={styles.billRow}>
                        <Text style={styles.billItem}>{i.description}</Text>
                        <Text style={styles.billAmount}>{money(i.amount)}</Text>
                      </View>
                    ))}
                    {items.map((it, index) => (
                      <View key={index} style={styles.itemBox}>
                        <View style={styles.chipRow}>
                          {KINDS.map((k) => (
                            <TouchableOpacity key={k} style={[styles.chip, it.kind === k && styles.chipOn]} onPress={() => updateItem(index, { kind: k })} accessibilityRole="button" accessibilityState={{ selected: it.kind === k }}>
                              <Text style={[styles.chipText, it.kind === k && styles.chipTextOn]}>{k === 'PARTS' ? 'Parts' : k === 'LABOUR' ? 'Labour' : 'Other'}</Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                        <View style={styles.inputRow}>
                          <TextInput style={[styles.input, { flex: 2 }]} value={it.description} onChangeText={(t) => updateItem(index, { description: t.slice(0, 120) })} placeholder="What was done / part used" placeholderTextColor={Colors.textSubtle} />
                          <TextInput style={styles.input} value={it.amount} onChangeText={(t) => updateItem(index, { amount: t.replace(/[^0-9.]/g, '').slice(0, 8) })} placeholder="₹" placeholderTextColor={Colors.textSubtle} keyboardType="decimal-pad" />
                          <TouchableOpacity style={styles.ghostBtn} onPress={() => setDraft(items.filter((_, i) => i !== index))} accessibilityRole="button" accessibilityLabel="Remove this line">
                            <Text style={styles.ghostBtnText}>✕</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    ))}
                    <View style={[styles.inputRow, { justifyContent: 'space-between' }]}>
                      <TouchableOpacity style={styles.ghostBtn} onPress={() => setDraft([...items, { kind: 'PARTS', description: '', amount: '' }])} accessibilityRole="button">
                        <Text style={styles.ghostBtnText}>+ Add line</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={[styles.smallBtn, (busy !== null || !draft) && { opacity: 0.6 }]} onPress={() => void saveItems()} disabled={busy !== null || !draft} accessibilityRole="button">
                        {busy === 'items' ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.smallBtnText}>Save bill</Text>}
                      </TouchableOpacity>
                    </View>
                    <Text style={styles.hint}>Current total: {money(bill.total)}. Save it, then the customer approves the cost before you start the work.</Text>
                  </>
                ) : (
                  <>
                    {bill.items.map((i) => (
                      <View key={i.id} style={styles.billRow}>
                        <Text style={styles.billItem}>{i.description}</Text>
                        <Text style={styles.billAmount}>{money(i.amount)}</Text>
                      </View>
                    ))}
                  </>
                )}

                <View style={styles.billRowHighlight}>
                  <Text style={styles.billHighlightText}>KaamConnect Platform Commission</Text>
                  <Text style={styles.billHighlightAmount}>₹0.00 (FREE)</Text>
                </View>
                <View style={styles.billTotalRow}>
                  <Text style={styles.totalLabel}>{isWorker ? 'Total Payable by Customer' : 'Total Payable to Worker'}</Text>
                  <Text style={styles.totalAmount}>{money(bill.total)}</Text>
                </View>
              </View>
            )}

            {/* Worker: finish */}
            {isWorker && job.status === 'ARRIVED' && (
              <EmptyBlock title="Waiting for the customer to approve the cost" hint="Save the bill above. Start the work once they approve. This page refreshes by itself." />
            )}
            {isWorker && job.status === 'IN_PROGRESS' && (
              <TouchableOpacity style={[styles.smallBtn, { paddingVertical: 14 }, busy !== null && { opacity: 0.6 }]} onPress={() => void finishWork()} disabled={busy !== null} accessibilityRole="button">
                {busy === 'complete' ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.smallBtnText}>Work finished — send bill to customer</Text>}
              </TouchableOpacity>
            )}
            {isWorker && job.status === 'WORK_COMPLETED' && <EmptyBlock title="Waiting for the payment" hint="The customer pays you directly and then marks it paid. This page refreshes by itself." />}
            {isWorker && job.status === 'COMPLETED' && (
              <TouchableOpacity style={[styles.smallBtn, { paddingVertical: 14 }]} onPress={() => router.replace('/(tabs)/leads')} accessibilityRole="button">
                <Text style={styles.smallBtnText}>Paid — back to leads</Text>
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
                {busy === 'approve' ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.smallBtnText}>Approve cost {money(bill.total)} and start the work</Text>}
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
                <Text style={styles.dangerBtnText}>{cancelling ? 'Cancelling…' : 'Decline the cost and cancel / दाम न मानें, रद्द करें'}</Text>
              </TouchableOpacity>
            )}
            {!isWorker && bill && job.status === 'WORK_COMPLETED' && (
              <View style={styles.qrCard}>
                <Text style={styles.qrTitle}>Pay Directly to {bill.payTo.name}</Text>
                <Text style={styles.qrSubtitle}>
                  {bill.payTo.upiId ? (
                    <>UPI ID: <Text style={{ fontWeight: '800' }}>{bill.payTo.upiId}</Text> (GPay / PhonePe / Paytm) or pay cash</>
                  ) : (
                    'Pay the worker in cash, or ask for their UPI ID'
                  )}
                </Text>
                <Text style={styles.hint}>KaamConnect does not touch the money. Pay the worker first, then confirm below.</Text>
                <View style={[styles.actionRow, { marginTop: 12 }]}>
                  <TouchableOpacity style={[styles.payBtn, styles.payBtnPrimary, busy !== null && styles.payBtnDisabled]} onPress={() => void pay('UPI')} disabled={busy !== null} activeOpacity={0.8} accessibilityRole="button">
                    <Zap color="#FFFFFF" size={16} />
                    <Text style={styles.payBtnText}>{busy === 'pay' ? 'Saving…' : `Paid ${money(bill.total)} via UPI ✓`}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.payBtn, styles.payBtnCash, busy !== null && styles.payBtnDisabled]} onPress={() => void pay('CASH')} disabled={busy !== null} activeOpacity={0.8} accessibilityRole="button">
                    <Text style={styles.payBtnCashText}>Paid Cash 💵</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
            {!isWorker && job.status === 'COMPLETED' && (
              <TouchableOpacity style={[styles.smallBtn, { paddingVertical: 14 }]} onPress={() => router.replace('/rating')} accessibilityRole="button">
                <Text style={styles.smallBtnText}>{job.review ? 'Thanks for rating' : 'Rate this job'}</Text>
              </TouchableOpacity>
            )}

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
                  {cancelling ? 'Cancelling…' : job.status === 'ASSIGNED' ? 'Cannot make it? Cancel this job / जॉब रद्द करें' : 'Cannot do this work? Leave the job / जॉब छोड़ें'}
                </Text>
              </TouchableOpacity>
            )}

            {actionError && <Text style={styles.errorLine} accessibilityRole="alert">{actionError}</Text>}
          </>
        )}
      </ScrollView>

      <WorkerLocationPermissionModal
        visible={askLocation}
        onDone={(result) => {
          setAskLocation(false);
          if (result === 'granted' && jobId) void workerTracking.startTracking(jobId);
        }}
      />
      {imageSourceModal}
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
  photoLabelBefore: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.error,
    marginBottom: 4
  },
  photoLabelAfter: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.primary,
    marginBottom: 4
  },
  proofImage: {
    width: '100%',
    height: 95,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border
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
