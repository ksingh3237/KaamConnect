import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Image, Linking, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Play, Send } from 'lucide-react-native';
import { Colors, Spacing, Radius } from '../constants/theme';
import { useAsync } from '../api/useAsync';
import { getLead, sendOffer } from '../api/endpoints';
import { isApiError, userMessage } from '../api/errors';
import { notify } from '../utils/dialog';
import { whenLabel } from '../utils/time';
import { EmptyBlock, ErrorBlock, LoadingBlock } from '../components/StateBlocks';
import { useImageViewer } from '../components/ImageViewerModal';
import { pick } from '../i18n';
import { useLang, useT } from '../i18n/useT';

const ETA_MINUTES = [15, 30, 45];

/** Server answers that mean the request is gone for this worker, not that something broke. */
const CLOSED_CODES = new Set(['NOT_FOUND', 'JOB_NOT_OPEN']);

export default function LeadOfferScreen() {
  const router = useRouter();
  const t = useT();
  const lang = useLang();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const leadState = useAsync(() => (id ? getLead(id) : Promise.resolve(null)), [id], { reloadOnFocus: false });
  const lead = leadState.data;
  const initials = (lead?.customerName ?? '')
    .split(' ')
    .filter((word) => word && !word.endsWith('.'))
    .map((word) => word[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const { show: viewImage, modal: imageViewer } = useImageViewer();
  const [fee, setFee] = useState('');
  const [feeError, setFeeError] = useState(false);
  const [eta, setEta] = useState(15);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const alreadyQuoted = !!lead?.myOffer;
  // Set when sending finds the request already taken or cancelled
  const [closedOnSend, setClosedOnSend] = useState(false);
  const closed =
    closedOnSend ||
    (leadState.errorCode !== null && CLOSED_CODES.has(leadState.errorCode)) ||
    // not open any more, and not because this worker won it (their accepted quote / accepted direct request)
    (!!lead && lead.status !== 'OPEN' && lead.leadState !== 'ACCEPTED' && lead.myOffer?.status !== 'ACCEPTED');
  const toRadar = () => router.replace('/(tabs)/leads');

  // Start from the category's standard visit fee, or from the quote already sent
  useEffect(() => {
    if (!lead) return;
    setFee(String(lead.myOffer?.visitFee ?? lead.baseVisitFee));
    if (lead.myOffer) {
      setEta(lead.myOffer.etaMinutes);
      setMessage(lead.myOffer.message ?? '');
    }
  }, [lead]);

  const handleSendOffer = async () => {
    if (sending || !lead) return;
    setFormError(null);
    if (!Number(fee)) {
      setFeeError(true);
      return;
    }
    setSending(true);
    try {
      await sendOffer(lead.id, { visitFee: Number(fee), etaMinutes: eta, ...(message.trim() ? { message: message.trim() } : {}) });
      void notify(`✅ ${t('Quote Sent')}`, t('Your quote of ₹{fee} has been sent to {name}. You will see it here as accepted if they choose you.', { fee, name: lead.customerName }));
      router.replace('/(tabs)/leads');
    } catch (error) {
      if (isApiError(error) && CLOSED_CODES.has(error.code)) {
        setClosedOnSend(true);
        return;
      }
      const fields = isApiError(error) ? error.details.map((d) => `${d.field}: ${d.issue}`).join('; ') : '';
      setFormError(userMessage(error) + (fields ? ` (${fields})` : ''));
    } finally {
      setSending(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {/* Header */}
        <View style={styles.headerBar}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)/leads')}
            accessibilityRole="button"
            accessibilityLabel={t('Go back')}
          >
            <ArrowLeft color={Colors.textMain} size={20} />
          </TouchableOpacity>
          <View style={styles.headerText}>
            <Text style={styles.headerTitle}>{t('Lead Details & Send Quote')}</Text>
            <Text style={styles.headerSub}>{t('Direct Customer Connect • 0% Fee')}</Text>
          </View>
          {lead?.urgency === 'IMMEDIATE' && (
            <View style={styles.urgentBadge}><Text style={styles.urgentText}>{t('URGENT')}</Text></View>
          )}
        </View>
        {!id && <EmptyBlock title={t('Choose a lead first')} hint={t('Open a lead from your radar to send a quote.')} />}
        {id && leadState.loading && <LoadingBlock />}
        {closed && <EmptyBlock title={t('This lead has been fulfilled or closed')} hint={t('Check new leads on your radar.')} />}
        {leadState.error && !leadState.data && !closed && <ErrorBlock message={leadState.error} onRetry={() => void leadState.reload()} />}
        {(!id || closed) && (
          <TouchableOpacity style={styles.sendQuoteBtn} onPress={toRadar} activeOpacity={0.8} accessibilityRole="button">
            <Text style={styles.sendQuoteBtnText}>{t('Open my lead radar')}</Text>
          </TouchableOpacity>
        )}
        {lead && (
          <>

        {/* Lead Details Card */}
        <View style={styles.card}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 8 }}>
            <View style={{ flex: 1 }}>
              <View style={styles.catPill}><Text style={styles.catPillText}>{pick(lead.category.title, lang)}</Text></View>
              <Text style={styles.leadTitle}>{lead.title}</Text>
            </View>
            <View style={styles.distPill}><Text style={styles.distText}>{lead.distanceKm !== null ? t('{km} km', { km: lead.distanceKm }) : lead.areaName}</Text></View>
          </View>

          {/* Customer identity row */}
          <View style={styles.customerRow}>
            <View style={styles.custAvatar}><Text style={{ fontWeight: '800', color: Colors.tertiary }}>{initials}</Text></View>
            <View style={{ flex: 1 }}>
              <Text style={styles.custName}>{lead.customerName}</Text>
              {/* Area and city only: the full address is sent to the worker who gets the job, not to everyone quoting */}
              <Text style={styles.custLoc}>📍 {lead.areaName}, {lead.cityName} • {lead.urgency === 'IMMEDIATE' ? t('Immediate') : lead.scheduledFor ? whenLabel(lead.scheduledFor) : lead.urgency === 'AFTERNOON' ? t('Afternoon') : lead.urgency === 'TOMORROW' ? t('Tomorrow') : t('Scheduled')}</Text>
              <Text style={styles.custLocHint}>{t('Full address after the customer accepts your quote.')}</Text>
            </View>
            <View style={styles.verifiedCustBadge}><Text style={styles.verifiedCustText}>{t('Verified')}</Text></View>
          </View>

          {/* Voice note: opened in the device's own player */}
          {lead.voiceNote && (
            <TouchableOpacity style={styles.voicePlayBox} onPress={() => void Linking.openURL(lead.voiceNote!.url)} accessibilityRole="button">
              <View style={styles.playCircle}><Play color="#FFFFFF" size={16} /></View>
              <View style={{ flex: 1 }}>
                <Text style={styles.voicePlayTitle}>{t('Customer Voice Note')}{lead.voiceNote.durationSec ? ` (${lead.voiceNote.durationSec}s)` : ''}</Text>
                <Text style={styles.voicePlaySub}>{t('Tap to listen')}</Text>
              </View>
            </TouchableOpacity>
          )}

          {lead.notes ? <Text style={styles.leadNotes}>"{lead.notes}"</Text> : null}

          {/* Photos the customer attached */}
          {lead.photoUrls.length > 0 && (
            <>
              <Text style={[styles.formLabel, { marginTop: 10, marginBottom: 4 }]}>{t('Customer Attached Photos:')}</Text>
              {lead.photoUrls.map((url, index) => (
                <TouchableOpacity
                  key={url}
                  style={[styles.leadImg, { marginBottom: 8 }]}
                  onPress={() => viewImage(url, `Customer photo ${index + 1}`)}
                  activeOpacity={0.85}
                  accessibilityRole="imagebutton"
                  accessibilityLabel={t('View customer photo {number} full screen', { number: index + 1 })}
                >
                  {/* The picture fills the touchable, which is what carries the size: a percentage on the image
                      itself would measure against a parent that sizes to its child, and show nothing. */}
                  <Image source={{ uri: url }} style={styles.leadImgFill} resizeMode="cover" accessibilityIgnoresInvertColors />
                </TouchableOpacity>
              ))}
            </>
          )}
        </View>

        {/* Worker Quote Form */}
        <View style={[styles.card, { borderColor: Colors.primary, borderWidth: 2 }]}>
          <Text style={styles.quoteHeaderTitle}>{t('Your Quote to Customer')}</Text>
          <Text style={styles.quoteHeaderSub}>{t('Set your inspection rate & earliest arrival time.')}</Text>

          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>{t('Visiting & Inspection Fee')} *</Text>
            <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
              <View style={styles.rupeeBox}><Text style={{ fontSize: 16, fontWeight: '800' }}>₹</Text></View>
              <TextInput
                style={[styles.formInput, styles.feeInput, feeError && styles.formInputError]}
                value={fee}
                onChangeText={(text) => {
                  setFee(text.replace(/\D/g, ''));
                  setFeeError(false);
                }}
                keyboardType="numeric"
                maxLength={5}
              />
            </View>
            {feeError ? (
              <Text style={[styles.hintText, styles.errorText]}>{t('Enter your visiting fee to send the quote.')}</Text>
            ) : (
              <Text style={styles.hintText}>{t('Material/parts costs will be extra with customer approval.')}</Text>
            )}
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>{t('How quickly can you arrive?')}</Text>
            <View style={{ flexDirection: 'row', gap: 6 }}>
              {ETA_MINUTES.map((minutes) => (
                <TouchableOpacity key={minutes} style={[styles.etaBtn, eta === minutes && styles.etaBtnActive]} onPress={() => setEta(minutes)} accessibilityRole="button" accessibilityState={{ selected: eta === minutes }}>
                  <Text style={[styles.etaText, eta === minutes && styles.etaTextActive]}>{minutes === 15 ? t('15 Mins (Fast)') : t('{min} Mins', { min: minutes })}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>{t('Message to Customer (Optional)')}</Text>
            <TextInput
              style={[styles.formInput, styles.messageInput]}
              value={message}
              onChangeText={setMessage}
              placeholder={t('Add a short note for the customer')}
              placeholderTextColor={Colors.textSubtle}
              multiline
            />
          </View>
        </View>

        {formError && <Text style={[styles.errorText, { textAlign: 'center', marginBottom: 8 }]} accessibilityRole="alert">{formError}</Text>}
        {lead.leadState === 'ACCEPTED' && <EmptyBlock title={t('This request is now yours')} hint={t('Open it from Your active jobs on the leads page.')} />}
        {!closed && (
          <TouchableOpacity style={[styles.sendQuoteBtn, (sending || lead.leadState !== 'NEW') && { opacity: 0.7 }]} onPress={() => void handleSendOffer()} disabled={sending || lead.leadState !== 'NEW'} activeOpacity={0.8} accessibilityRole="button">
            {sending ? <ActivityIndicator color="#FFFFFF" /> : <Send color="#FFFFFF" size={18} />}
            <Text style={styles.sendQuoteBtnText}>{sending ? t('Sending…') : alreadyQuoted ? t('Update Quote (0% Commission)') : t('Send Direct Quote to Customer (0% Commission)')}</Text>
          </TouchableOpacity>
        )}
          </>
        )}
      </ScrollView>
      {imageViewer}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background
  },
  scrollContent: {
    padding: Spacing.lg
  },
  headerBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center'
  },
  headerText: {
    flex: 1,
    marginHorizontal: 10
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.textMain
  },
  headerSub: {
    fontSize: 12,
    color: Colors.textMuted
  },
  urgentBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.sm
  },
  urgentText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#92400E'
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.xl,
    padding: 14,
    marginBottom: Spacing.md
  },
  catPill: {
    alignSelf: 'flex-start',
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginBottom: 4
  },
  catPillText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0369A1'
  },
  leadTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.textMain
  },
  distPill: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.full
  },
  distText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#065F46'
  },
  customerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F8FAFC',
    padding: 10,
    borderRadius: Radius.md,
    marginTop: 8,
    marginBottom: 8
  },
  custAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#E0F2FE',
    alignItems: 'center',
    justifyContent: 'center'
  },
  custName: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textMain
  },
  custLoc: {
    fontSize: 12,
    color: Colors.textMuted
  },
  custLocHint: {
    fontSize: 11,
    color: Colors.textSubtle,
    marginTop: 1
  },
  verifiedCustBadge: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4
  },
  verifiedCustText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.success
  },
  voicePlayBox: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#86EFAC',
    borderRadius: Radius.md,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8
  },
  playCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center'
  },
  voicePlayTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#065F46'
  },
  voicePlaySub: {
    fontSize: 12,
    color: '#047857'
  },
  leadNotes: {
    fontSize: 13,
    color: Colors.textMuted,
    lineHeight: 18,
    marginTop: 4
  },
  leadImg: {
    width: '100%',
    height: 120,
    borderRadius: Radius.md,
    overflow: 'hidden',
    backgroundColor: Colors.surfaceVariant
  },
  leadImgFill: {
    width: '100%',
    height: '100%'
  },
  quoteHeaderTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#065F46'
  },
  quoteHeaderSub: {
    fontSize: 12,
    color: Colors.textMuted,
    marginBottom: 10
  },
  formGroup: {
    marginBottom: 10
  },
  formLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textMain,
    marginBottom: 4
  },
  rupeeBox: {
    width: 44,
    height: 44,
    backgroundColor: '#F1F5F9',
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center'
  },
  formInput: {
    height: 44,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: Colors.borderDark,
    borderRadius: Radius.md,
    paddingHorizontal: 10,
    fontSize: 12,
    color: Colors.textMain
  },
  feeInput: {
    flex: 1,
    // Web inputs have an intrinsic min width that pushes them out of the card
    minWidth: 0,
    fontSize: 18,
    fontWeight: '800',
    color: Colors.primaryDark
  },
  messageInput: {
    height: 64,
    paddingVertical: 8,
    textAlignVertical: 'top'
  },
  formInputError: {
    borderColor: Colors.error
  },
  errorText: {
    color: Colors.error,
    fontWeight: '600'
  },
  hintText: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 2
  },
  etaBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center'
  },
  etaBtnActive: {
    backgroundColor: '#F0FDF4',
    borderColor: Colors.primary,
    borderWidth: 2
  },
  etaText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textMain
  },
  etaTextActive: {
    color: '#065F46'
  },
  sendQuoteBtn: {
    backgroundColor: Colors.primary,
    minHeight: 52,
    paddingHorizontal: Spacing.lg,
    paddingVertical: 8,
    borderRadius: Radius.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 20
  },
  sendQuoteBtnText: {
    flexShrink: 1,
    textAlign: 'center',
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800'
  }
});
