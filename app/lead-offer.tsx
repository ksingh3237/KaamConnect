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

const ETAS = [
  { minutes: 15, label: '15 Mins (Fast)' },
  { minutes: 30, label: '30 Mins' },
  { minutes: 45, label: '45 Mins' },
];

export default function LeadOfferScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const leadState = useAsync(() => (id ? getLead(id) : Promise.reject(new Error('No lead selected'))), [id], { reloadOnFocus: false });
  const lead = leadState.data;
  const initials = (lead?.customerName ?? '')
    .split(' ')
    .filter((word) => word && !word.endsWith('.'))
    .map((word) => word[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const [fee, setFee] = useState('');
  const [feeError, setFeeError] = useState(false);
  const [eta, setEta] = useState(15);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const alreadyQuoted = !!lead?.myOffer;

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
      notify('✅ Quote Sent', `Your quote of ₹${fee} has been sent to ${lead.customerName}. You will see it here as accepted if they choose you.`);
      router.replace('/(tabs)/leads');
    } catch (error) {
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
            accessibilityLabel="Go back"
          >
            <ArrowLeft color={Colors.textMain} size={20} />
          </TouchableOpacity>
          <View style={styles.headerText}>
            <Text style={styles.headerTitle}>Lead Details & Send Quote</Text>
            <Text style={styles.headerSub}>Direct Customer Connect • 0% Fee</Text>
          </View>
          {lead?.urgency === 'IMMEDIATE' && (
            <View style={styles.urgentBadge}><Text style={styles.urgentText}>URGENT</Text></View>
          )}
        </View>

        {!id && <EmptyBlock title="No lead selected" hint="Open a lead from the radar. / रडार से लीड खोलें" />}
        {id && leadState.loading && <LoadingBlock />}
        {leadState.error && !leadState.data && <ErrorBlock message={leadState.error} onRetry={() => void leadState.reload()} />}
        {lead && (
          <>

        {/* Lead Details Card */}
        <View style={styles.card}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 8 }}>
            <View style={{ flex: 1 }}>
              <View style={styles.catPill}><Text style={styles.catPillText}>{lead.category.title.en}</Text></View>
              <Text style={styles.leadTitle}>{lead.title}</Text>
            </View>
            <View style={styles.distPill}><Text style={styles.distText}>{lead.distanceKm !== null ? `${lead.distanceKm} km` : lead.areaName}</Text></View>
          </View>

          {/* Customer identity row */}
          <View style={styles.customerRow}>
            <View style={styles.custAvatar}><Text style={{ fontWeight: '800', color: Colors.tertiary }}>{initials}</Text></View>
            <View style={{ flex: 1 }}>
              <Text style={styles.custName}>{lead.customerName}</Text>
              <Text style={styles.custLoc}>📍 {lead.areaName} • {lead.urgency === 'IMMEDIATE' ? 'Immediate' : lead.scheduledFor ? whenLabel(lead.scheduledFor) : lead.urgency.toLowerCase()}</Text>
            </View>
            <View style={styles.verifiedCustBadge}><Text style={styles.verifiedCustText}>Verified</Text></View>
          </View>

          {/* Voice note: opened in the device's own player */}
          {lead.voiceNote && (
            <TouchableOpacity style={styles.voicePlayBox} onPress={() => void Linking.openURL(lead.voiceNote!.url)} accessibilityRole="button">
              <View style={styles.playCircle}><Play color="#FFFFFF" size={16} /></View>
              <View style={{ flex: 1 }}>
                <Text style={styles.voicePlayTitle}>Customer Voice Note{lead.voiceNote.durationSec ? ` (${lead.voiceNote.durationSec}s)` : ''}</Text>
                <Text style={styles.voicePlaySub}>Tap to listen</Text>
              </View>
            </TouchableOpacity>
          )}

          {lead.notes ? <Text style={styles.leadNotes}>"{lead.notes}"</Text> : null}

          {/* Photos the customer attached */}
          {lead.photoUrls.length > 0 && (
            <>
              <Text style={[styles.formLabel, { marginTop: 10, marginBottom: 4 }]}>Customer Attached Photos:</Text>
              {lead.photoUrls.map((url) => (
                <Image key={url} source={{ uri: url }} style={[styles.leadImg, { marginBottom: 8 }]} />
              ))}
            </>
          )}
        </View>

        {/* Worker Quote Form */}
        <View style={[styles.card, { borderColor: Colors.primary, borderWidth: 2 }]}>
          <Text style={styles.quoteHeaderTitle}>Your Quote to Customer (आपका ऑफर)</Text>
          <Text style={styles.quoteHeaderSub}>Set your inspection rate & earliest arrival time.</Text>

          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Visiting & Inspection Fee (विज़िट व जांच फीस) *</Text>
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
              <Text style={[styles.hintText, styles.errorText]}>Enter your visiting fee to send the quote / फीस दर्ज करें</Text>
            ) : (
              <Text style={styles.hintText}>Material/parts costs will be extra with customer approval.</Text>
            )}
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>How quickly can you arrive?</Text>
            <View style={{ flexDirection: 'row', gap: 6 }}>
              {ETAS.map((e) => (
                <TouchableOpacity key={e.minutes} style={[styles.etaBtn, eta === e.minutes && styles.etaBtnActive]} onPress={() => setEta(e.minutes)} accessibilityRole="button" accessibilityState={{ selected: eta === e.minutes }}>
                  <Text style={[styles.etaText, eta === e.minutes && styles.etaTextActive]}>{e.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Message to Customer (Optional)</Text>
            <TextInput
              style={[styles.formInput, styles.messageInput]}
              value={message}
              onChangeText={setMessage}
              placeholder="Add a short note for the customer"
              placeholderTextColor={Colors.textSubtle}
              multiline
            />
          </View>
        </View>

        {formError && <Text style={[styles.errorText, { textAlign: 'center', marginBottom: 8 }]} accessibilityRole="alert">{formError}</Text>}
        {lead.leadState === 'ACCEPTED' && <EmptyBlock title="This request is now yours" hint="Open it from Your active jobs on the leads page." />}
        <TouchableOpacity style={[styles.sendQuoteBtn, (sending || lead.leadState !== 'NEW') && { opacity: 0.7 }]} onPress={() => void handleSendOffer()} disabled={sending || lead.leadState !== 'NEW'} accessibilityRole="button">
          {sending ? <ActivityIndicator color="#FFFFFF" /> : <Send color="#FFFFFF" size={18} />}
          <Text style={styles.sendQuoteBtnText}>{sending ? 'Sending…' : alreadyQuoted ? 'Update Quote (0% Commission)' : 'Send Direct Quote to Customer (0% Commission)'}</Text>
        </TouchableOpacity>
          </>
        )}
      </ScrollView>
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
    fontSize: 10,
    color: Colors.textMuted
  },
  urgentBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.sm
  },
  urgentText: {
    fontSize: 10,
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
    fontSize: 9,
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
    fontSize: 10,
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
    fontSize: 10,
    color: Colors.textMuted
  },
  verifiedCustBadge: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4
  },
  verifiedCustText: {
    fontSize: 9,
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
    fontSize: 11,
    fontWeight: '800',
    color: '#065F46'
  },
  voicePlaySub: {
    fontSize: 9,
    color: '#047857'
  },
  leadNotes: {
    fontSize: 11,
    color: Colors.textMuted,
    lineHeight: 16,
    marginTop: 4
  },
  leadImg: {
    width: '100%',
    height: 120,
    borderRadius: Radius.md
  },
  quoteHeaderTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#065F46'
  },
  quoteHeaderSub: {
    fontSize: 10,
    color: Colors.textMuted,
    marginBottom: 10
  },
  formGroup: {
    marginBottom: 10
  },
  formLabel: {
    fontSize: 11,
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
    fontSize: 9,
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
    fontSize: 10,
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
