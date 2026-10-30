// One worker's quote: who (photo, trade, rating, distance, arrival), the visit fee, and what the customer can do about it:
// call, decline or accept. Shared by Compare Offers and the customer's Home, so a quote looks and behaves the same in
// both places. useOfferActions() holds the accept / decline calls and their messages.
import React, { useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Check, Phone, X } from 'lucide-react-native';
import { Colors, Radius } from '../constants/theme';
import { acceptOffer, declineOffer } from '../api/endpoints';
import { userMessage } from '../api/errors';
import type { OfferForCustomer } from '../api/types';
import { categoryTitle } from '../i18n/categories';
import { useLang, useT } from '../i18n/useT';
import { useStore } from '../store/useStore';
import { callPhone, confirmAction, notify } from '../utils/dialog';
import Avatar from './Avatar';

export type OfferBusy = { offerId: string; kind: 'accept' | 'decline' } | null;

interface Props {
  offer: OfferForCustomer;
  fastest: boolean;
  /** The action running on any card (one at a time), or null. */
  busy: OfferBusy;
  onAccept: () => void;
  onDecline: () => void;
  /** A line above the worker naming the request (Home lists quotes from several requests). */
  context?: string;
}

export default function OfferCard({ offer, fastest, busy, onAccept, onDecline, context }: Props) {
  const t = useT();
  const lang = useLang();
  const worker = offer.worker;
  const accepted = offer.status === 'ACCEPTED';
  const mine = busy?.offerId === offer.offerId ? busy.kind : null;
  const locked = busy !== null || !offer.available;

  return (
    <View style={[styles.card, fastest && !accepted && styles.cardFastest, accepted && styles.cardAccepted]}>
      {fastest && !accepted && (
        <View style={styles.fastestBadge}>
          <Text style={styles.fastestText}>{t('FASTEST ARRIVAL ({min} MIN)', { min: offer.etaMinutes })}</Text>
        </View>
      )}
      {context ? <Text style={styles.context} numberOfLines={1}>{context}</Text> : null}

      <View style={styles.top}>
        <Avatar uri={worker.photoUrl} size={52} style={styles.avatar} />
        <View style={{ flex: 1 }}>
          <View style={styles.nameRow}>
            <Text style={styles.name} numberOfLines={1}>{worker.name}</Text>
            <Text>🛡️</Text>
          </View>
          <Text style={styles.trade}>{categoryTitle(worker.tradeId, worker.trade, lang)}</Text>
          <View style={styles.metaRow}>
            <Text style={styles.rating}>⭐ {worker.rating ?? t('New')} ({worker.reviewsCount})</Text>
            <Text style={styles.metaDim}>📍 {worker.distanceKm !== null ? t('{km} km', { km: worker.distanceKm }) : worker.areaName}</Text>
            <Text style={styles.metaDim}>⏱️ {t('{min} Min ETA', { min: offer.etaMinutes })}</Text>
          </View>
        </View>
      </View>

      {offer.message ? (
        <View style={styles.messageBox}>
          <Text style={styles.messageText}>💬 "{offer.message}"</Text>
        </View>
      ) : null}

      <View style={styles.feeRow}>
        <Text style={styles.feeLabel}>{t('Offered Visit Fee')}</Text>
        <Text style={styles.feeAmount}>
          ₹{offer.visitFee}
          <Text style={styles.feeNote}> {t('(0% App Fee)')}</Text>
        </Text>
      </View>

      {accepted ? (
        <View style={styles.bookedRow}>
          <View style={styles.bookedPill}>
            <Check color={Colors.primaryDark} size={15} strokeWidth={3} />
            <Text style={styles.bookedText}>{t('You booked this worker')}</Text>
          </View>
          <TouchableOpacity style={[styles.btn, styles.callBtn, styles.btnCompact]} onPress={() => void callPhone(worker.phone, worker.name)} accessibilityRole="button" accessibilityLabel={t('Direct Call')}>
            <Phone color="#FFFFFF" size={14} />
            <Text style={styles.btnText}>{t('Call')}</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.actions}>
          <TouchableOpacity style={[styles.btn, styles.callBtn]} onPress={() => void callPhone(worker.phone, worker.name)} accessibilityRole="button" accessibilityLabel={t('Direct Call')}>
            <Phone color="#FFFFFF" size={14} />
            <Text style={styles.btnText} numberOfLines={1}>{t('Call')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.btn, styles.declineBtn, busy !== null && styles.dim]}
            onPress={onDecline}
            disabled={busy !== null}
            accessibilityRole="button"
            accessibilityLabel={t('Decline this offer')}
          >
            {mine === 'decline' ? <ActivityIndicator color={Colors.error} size="small" /> : <X color={Colors.error} size={15} strokeWidth={2.6} />}
            <Text style={styles.declineText} numberOfLines={1}>{t('Decline')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.btn, styles.acceptBtn, locked && styles.dim]}
            onPress={onAccept}
            disabled={locked}
            accessibilityRole="button"
            accessibilityLabel={t('Accept Offer')}
          >
            {mine === 'accept' ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={styles.btnText} numberOfLines={1}>{!offer.available ? t('Booked') : t('Accept ✓')}</Text>
            )}
          </TouchableOpacity>
        </View>
      )}
      {!accepted && !offer.available && <Text style={styles.unavailable}>{t('This worker is busy at that time. Choose another offer.')}</Text>}
    </View>
  );
}

/** Accept and decline with their confirmations and error messages. `reload` refreshes the list after a change or a failure. */
export function useOfferActions(reload: () => void, onAccepted: (jobId: string) => void) {
  const t = useT();
  const setActiveJobId = useStore((s) => s.setActiveJobId);
  const [busy, setBusy] = useState<OfferBusy>(null);

  const accept = async (jobId: string, offer: OfferForCustomer) => {
    if (busy) return;
    setBusy({ offerId: offer.offerId, kind: 'accept' });
    try {
      await acceptOffer(jobId, offer.offerId);
      setActiveJobId(jobId);
      onAccepted(jobId);
    } catch (error) {
      // e.g. the worker was booked meanwhile, or the request was already booked: say so and show the list as it is now
      void notify(t('Could not accept'), userMessage(error));
      reload();
    } finally {
      setBusy(null);
    }
  };

  const decline = async (jobId: string, offer: OfferForCustomer) => {
    if (busy) return;
    const ok = await confirmAction(
      t('Decline this offer?'),
      t('{name} will be told you declined. You can still accept the other offers.', { name: offer.worker.name }),
      t('Decline'),
      true,
    );
    if (!ok) return;
    setBusy({ offerId: offer.offerId, kind: 'decline' });
    try {
      await declineOffer(jobId, offer.offerId);
    } catch (error) {
      void notify(t('Could not decline'), userMessage(error));
    } finally {
      setBusy(null);
      reload();
    }
  };

  return { busy, accept, decline };
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.xl,
    padding: 14,
  },
  cardFastest: { borderColor: Colors.primary, borderWidth: 2, marginTop: 6 },
  cardAccepted: { borderColor: Colors.primaryDark, borderWidth: 2, backgroundColor: '#F0FDF4' },
  fastestBadge: {
    position: 'absolute',
    top: -11,
    right: 14,
    backgroundColor: Colors.primary,
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: Radius.full,
  },
  fastestText: { color: '#FFFFFF', fontSize: 12, fontWeight: '800' },
  context: { fontSize: 12, fontWeight: '700', color: Colors.textMuted, marginBottom: 8 },
  top: { flexDirection: 'row', gap: 10, marginBottom: 8 },
  avatar: { width: 52, height: 52, borderRadius: 26 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  name: { flexShrink: 1, fontSize: 15, fontWeight: '800', color: Colors.textMain },
  trade: { fontSize: 14, color: Colors.primaryDark, fontWeight: '700', marginTop: 1 },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', columnGap: 10, rowGap: 2, marginTop: 3 },
  rating: { fontSize: 13, fontWeight: '700', color: '#B45309' },
  metaDim: { fontSize: 13, color: Colors.textMuted },
  messageBox: { backgroundColor: '#F0FDF4', borderRadius: Radius.md, padding: 8, marginBottom: 8 },
  messageText: { fontSize: 13, color: '#065F46', lineHeight: 18 },
  feeRow: {
    paddingTop: 10,
    borderTopWidth: 1,
    borderStyle: 'dashed',
    borderTopColor: '#E2E8F0',
    marginBottom: 10,
  },
  feeLabel: { fontSize: 13, color: Colors.textMuted },
  feeAmount: { fontSize: 18, fontWeight: '800', color: Colors.textMain, marginTop: 1 },
  feeNote: { color: Colors.primary, fontSize: 13, fontWeight: '700' },
  actions: { flexDirection: 'row', gap: 8 },
  btn: {
    flex: 1,
    minHeight: 46,
    borderRadius: Radius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingHorizontal: 6,
  },
  btnCompact: { flex: 0, paddingHorizontal: 14 },
  callBtn: { backgroundColor: Colors.primary },
  declineBtn: { backgroundColor: '#FFFFFF', borderWidth: 1.5, borderColor: '#FCA5A5' },
  acceptBtn: { flex: 1.3, backgroundColor: '#065F46' },
  dim: { opacity: 0.6 },
  btnText: { color: '#FFFFFF', fontSize: 14, fontWeight: '800', flexShrink: 1 },
  declineText: { color: Colors.error, fontSize: 14, fontWeight: '800', flexShrink: 1 },
  bookedRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  bookedPill: {
    flex: 1,
    minHeight: 46,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    borderRadius: Radius.md,
    backgroundColor: Colors.primaryLight,
  },
  bookedText: { flexShrink: 1, fontSize: 14, fontWeight: '800', color: Colors.primaryDark },
  unavailable: { marginTop: 8, fontSize: 12, color: '#92400E' },
});
