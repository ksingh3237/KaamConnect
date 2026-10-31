// New quotes pop up over the customer's screens one at a time, the way ride apps show driver offers: each one slides
// in at the top for TOAST_MS with Call / Decline / Accept, then goes by itself and the next one follows. Touching the
// card keeps it open (the person is deciding); ✕ closes it. Every quote is shown once (remembered on the phone);
// a quote that was not answered stays reachable from the bell and from the request's Compare Offers screen.
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ChevronRight, X } from 'lucide-react-native';
import { Colors, Radius } from '../constants/theme';
import { useAsync } from '../api/useAsync';
import { listMyJobs, listOffers } from '../api/endpoints';
import { loadSeenOffers, saveSeenOffers } from '../api/storage';
import type { OfferForCustomer } from '../api/types';
import { useStore } from '../store/useStore';
import { useT } from '../i18n/useT';
import OfferCard, { useOfferActions } from './OfferCard';

const POLL_MS = 8000;
export const TOAST_MS = 5000;
/** A short gap between two toasts, so the second does not look like the first one changing. */
const GAP_MS = 700;
const NATIVE = Platform.OS !== 'web';

interface QueuedOffer {
  jobId: string;
  jobTitle: string;
  offer: OfferForCustomer;
  /** This quote's place among the request's waiting quotes ("2 of 3"). */
  position: number;
  total: number;
}

async function loadWaitingOffers(): Promise<QueuedOffer[]> {
  const page = await listMyJobs('ongoing');
  // A direct request goes to one chosen worker who accepts it; it never collects quotes
  const open = page.items.filter((j) => j.status === 'OPEN' && !j.isDirect && j.offersCount > 0);
  const perJob = await Promise.all(
    open.map(async (job) => {
      const offers = (await listOffers(job.id, 'fee')).filter((o) => o.status === 'PENDING');
      const byArrival = [...offers].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
      return byArrival.map((offer, i) => ({ jobId: job.id, jobTitle: job.title, offer, position: i + 1, total: offers.length }));
    }),
  );
  return perJob.flat().sort((a, b) => a.offer.createdAt.localeCompare(b.offer.createdAt));
}

export default function OfferToastHost() {
  const router = useRouter();
  const t = useT();
  const insets = useSafeAreaInsets();
  const setActiveJobId = useStore((s) => s.setActiveJobId);
  const feed = useAsync(loadWaitingOffers, [], { pollMs: POLL_MS });

  // Quotes already shown (this run and earlier ones); null until read from the phone, so nothing pops before that
  const [seen, setSeen] = useState<Set<string> | null>(null);
  useEffect(() => {
    void loadSeenOffers().then((ids) => setSeen(new Set(ids)));
  }, []);
  const markSeen = useCallback((offerId: string) => {
    setSeen((prev) => {
      const next = new Set(prev ?? []);
      next.add(offerId);
      void saveSeenOffers([...next]);
      return next;
    });
  }, []);

  const queue = useMemo(() => (seen ? (feed.data ?? []).filter((q) => !seen.has(q.offer.offerId)) : []), [feed.data, seen]);
  const [current, setCurrent] = useState<QueuedOffer | null>(null);
  const [held, setHeld] = useState(false);
  const slide = useRef(new Animated.Value(-400)).current;
  const timeLeft = useRef(new Animated.Value(1)).current;
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimer = () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
  };

  const dismiss = useCallback(() => {
    clearTimer();
    timeLeft.stopAnimation();
    Animated.timing(slide, { toValue: -400, duration: 220, useNativeDriver: NATIVE }).start(() => {
      setCurrent((shown) => {
        if (shown) markSeen(shown.offer.offerId);
        return null;
      });
      setHeld(false);
    });
  }, [markSeen, slide, timeLeft]);

  // A declined quote leaves the next poll and the effect below closes the toast; an accepted one opens tracking
  const { busy, accept, decline } = useOfferActions(
    () => void feed.reload(),
    () => {
      dismiss();
      router.push('/tracking');
    },
  );

  // Show the next waiting quote when nothing is on screen
  useEffect(() => {
    if (current || queue.length === 0) return undefined;
    const wait = setTimeout(() => {
      setCurrent(queue[0]!);
      setHeld(false);
      slide.setValue(-400);
      timeLeft.setValue(1);
      Animated.spring(slide, { toValue: 0, useNativeDriver: NATIVE, friction: 8 }).start();
      Animated.timing(timeLeft, { toValue: 0, duration: TOAST_MS, easing: Easing.linear, useNativeDriver: false }).start();
      timer.current = setTimeout(dismiss, TOAST_MS);
    }, GAP_MS);
    return () => clearTimeout(wait);
  }, [current, queue, dismiss, slide, timeLeft]);

  // The quote on screen was answered elsewhere (accepted, declined, withdrawn): let it go
  useEffect(() => {
    if (current && feed.data && !feed.data.some((q) => q.offer.offerId === current.offer.offerId)) dismiss();
  }, [feed.data, current, dismiss]);

  useEffect(() => () => clearTimer(), []);

  // The person is reading or deciding: stop the countdown until they close it or act
  const hold = () => {
    if (held) return;
    setHeld(true);
    clearTimer();
    timeLeft.stopAnimation();
  };

  if (!current) return null;
  const openAll = () => {
    dismiss();
    setActiveJobId(current.jobId);
    router.push('/compare-offers');
  };

  return (
    <Animated.View
      style={[styles.wrap, { top: insets.top + 8, transform: [{ translateY: slide }] }]}
      onTouchStart={hold}
      accessibilityLiveRegion="polite"
    >
      <View style={styles.head}>
        <View style={styles.liveDot} />
        <Text style={styles.headText} numberOfLines={1}>
          {t('New quote {position} of {total} • {title}', { position: current.position, total: current.total, title: current.jobTitle })}
        </Text>
        <TouchableOpacity onPress={dismiss} hitSlop={10} style={styles.close} accessibilityRole="button" accessibilityLabel={t('Close')}>
          <X color={Colors.textMuted} size={18} />
        </TouchableOpacity>
      </View>
      <OfferCard
        offer={current.offer}
        fastest={false}
        busy={busy}
        onAccept={() => {
          hold();
          void accept(current.jobId, current.offer);
        }}
        onDecline={() => {
          hold();
          void decline(current.jobId, current.offer);
        }}
      />
      {current.total > 1 && (
        <TouchableOpacity style={styles.all} onPress={openAll} activeOpacity={0.7} accessibilityRole="button">
          <Text style={styles.allText}>{t('See all {count} offers', { count: current.total })}</Text>
          <ChevronRight color={Colors.primaryDark} size={16} />
        </TouchableOpacity>
      )}
      {!held && (
        <View style={styles.track}>
          <Animated.View style={[styles.bar, { width: timeLeft.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }) }]} />
        </View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 10,
    right: 10,
    zIndex: 100,
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.xl,
    padding: 8,
    shadowColor: '#0F172A',
    shadowOpacity: 0.25,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 18,
    elevation: 16,
  },
  head: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 6, paddingTop: 4, paddingBottom: 8 },
  liveDot: { width: 9, height: 9, borderRadius: 5, backgroundColor: Colors.primary },
  headText: { flex: 1, fontSize: 14, fontWeight: '800', color: Colors.textMain },
  close: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F1F5F9' },
  all: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, minHeight: 40 },
  allText: { fontSize: 14, fontWeight: '800', color: Colors.primaryDark },
  track: { height: 4, borderRadius: 2, backgroundColor: '#E2E8F0', marginTop: 8, marginHorizontal: 6, overflow: 'hidden' },
  bar: { height: 4, backgroundColor: Colors.primary },
});
