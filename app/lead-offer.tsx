import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, SafeAreaView, Image, Alert, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, Play, Send } from 'lucide-react-native';
import { Colors, Spacing, Radius } from '../constants/theme';
import { WORKER_ACTIVE_LEADS } from '../constants/mockData';

export default function LeadOfferScreen() {
  const router = useRouter();
  const lead = WORKER_ACTIVE_LEADS[0];
  const [fee, setFee] = useState('250');
  const [eta, setEta] = useState('15');

  const handleSendOffer = () => {
    if (Platform.OS === 'web') {
      window.alert(`✅ Quote Sent\n\nYour quote of ₹${fee} has been sent directly to ${lead.customer}. Customer will call or confirm arrival.`);
      router.push('/tracking');
    } else {
      Alert.alert('✅ Quote Sent', `Your quote of ₹${fee} has been sent directly to ${lead.customer}. Customer will call or confirm arrival.`, [
        { text: 'View Active Job', onPress: () => router.push('/tracking') }
      ]);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.headerBar}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.canGoBack() ? router.back() : router.replace('/')}>
            <ArrowLeft color={Colors.textMain} size={20} />
          </TouchableOpacity>
          <View>
            <Text style={styles.headerTitle}>Lead Details & Send Quote</Text>
            <Text style={styles.headerSub}>Direct Customer Connect • 0% Fee</Text>
          </View>
          <View style={styles.urgentBadge}><Text style={styles.urgentText}>URGENT</Text></View>
        </View>

        {/* Lead Details Card */}
        <View style={styles.card}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
            <View>
              <View style={styles.catPill}><Text style={styles.catPillText}>{lead.category}</Text></View>
              <Text style={styles.leadTitle}>{lead.title}</Text>
            </View>
            <View style={styles.distPill}><Text style={styles.distText}>{lead.distance}</Text></View>
          </View>

          {/* Customer identity row */}
          <View style={styles.customerRow}>
            <View style={styles.custAvatar}><Text style={{ fontWeight: '800', color: Colors.tertiary }}>SS</Text></View>
            <View style={{ flex: 1 }}>
              <Text style={styles.custName}>{lead.customer}</Text>
              <Text style={styles.custLoc}>📍 {lead.sector} • House #1402</Text>
            </View>
            <View style={styles.verifiedCustBadge}><Text style={styles.verifiedCustText}>Verified</Text></View>
          </View>

          {/* Voice Memo Player */}
          {lead.hasAudio && (
            <TouchableOpacity
              style={styles.voicePlayBox}
              onPress={() => Alert.alert('🔊 Voice Note', 'Playing customer audio memo in Hindi...')}
            >
              <View style={styles.playCircle}><Play color="#FFFFFF" size={16} /></View>
              <View style={{ flex: 1 }}>
                <Text style={styles.voicePlayTitle}>Customer Voice Note (14s)</Text>
                <Text style={styles.voicePlaySub}>Recorded in Hindi • "Under sink pipe cracked..."</Text>
              </View>
            </TouchableOpacity>
          )}

          <Text style={styles.leadNotes}>"{lead.notes}"</Text>

          {/* Photo */}
          <Text style={[styles.formLabel, { marginTop: 10, marginBottom: 4 }]}>Customer Attached Photo:</Text>
          <Image
            source={{ uri: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=400&auto=format&fit=crop&q=80' }}
            style={styles.leadImg}
          />
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
                style={[styles.formInput, { flex: 1, fontSize: 18, fontWeight: '800', color: Colors.primaryDark }]}
                value={fee}
                onChangeText={setFee}
                keyboardType="numeric"
              />
            </View>
            <Text style={styles.hintText}>Material/parts costs will be extra with customer approval.</Text>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>How quickly can you arrive?</Text>
            <View style={{ flexDirection: 'row', gap: 6 }}>
              <TouchableOpacity
                style={[styles.etaBtn, eta === '15' && styles.etaBtnActive]}
                onPress={() => setEta('15')}
              >
                <Text style={[styles.etaText, eta === '15' && styles.etaTextActive]}>15 Mins (Fast)</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.etaBtn, eta === '30' && styles.etaBtnActive]}
                onPress={() => setEta('30')}
              >
                <Text style={[styles.etaText, eta === '30' && styles.etaTextActive]}>30 Mins</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.etaBtn, eta === '45' && styles.etaBtnActive]}
                onPress={() => setEta('45')}
              >
                <Text style={[styles.etaText, eta === '45' && styles.etaTextActive]}>45 Mins</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Message to Customer (Optional)</Text>
            <TextInput
              style={styles.formInput}
              defaultValue="I have PVC replacement pipes in stock. Can arrive in 15 mins."
            />
          </View>
        </View>

        <TouchableOpacity style={styles.sendQuoteBtn} onPress={handleSendOffer}>
          <Send color="#FFFFFF" size={18} />
          <Text style={styles.sendQuoteBtnText}>Send Direct Quote to Customer (0% Commission)</Text>
        </TouchableOpacity>
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
    height: 52,
    borderRadius: Radius.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 20
  },
  sendQuoteBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800'
  }
});
