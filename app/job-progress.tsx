import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, CheckCircle2, QrCode, Phone, ShieldCheck, Zap } from 'lucide-react-native';
import { Colors, Spacing, Radius } from '../constants/theme';
import { VERIFIED_WORKERS } from '../constants/mockData';

export default function JobProgressScreen() {
  const router = useRouter();
  const worker = VERIFIED_WORKERS[0];
  const [paymentDone, setPaymentDone] = useState(false);

  const handlePayment = (mode: string) => {
    setPaymentDone(true);
    setTimeout(() => {
      router.push('/rating');
    }, 400);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Header Bar */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => router.push('/tracking')}
            activeOpacity={0.7}
          >
            <ArrowLeft color="#1E293B" size={20} />
          </TouchableOpacity>
          <View>
            <Text style={styles.headerTitle}>Job Progress & Completion</Text>
            <Text style={styles.headerSubtitle}>Booking #KC-88421 • Direct Settlement</Text>
          </View>
        </View>
        <View style={styles.statusPill}>
          <Text style={styles.statusPillText}>IN PROGRESS</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Worker Summary Card */}
        <View style={styles.card}>
          <View style={styles.workerRow}>
            <Image source={{ uri: worker.avatar }} style={styles.workerAvatar} />
            <View style={{ flex: 1 }}>
              <View style={styles.nameRow}>
                <Text style={styles.workerName}>{worker.name}</Text>
                <ShieldCheck color={Colors.primary} size={15} />
              </View>
              <Text style={styles.workerTrade}>{worker.trade} • {worker.sector}</Text>
              <Text style={styles.workerVehicle}>🛵 {worker.vehicle}</Text>
            </View>
            <TouchableOpacity
              style={styles.callSmallBtn}
              onPress={() => alert(`Calling ${worker.name} directly at ${worker.phone}`)}
              activeOpacity={0.8}
            >
              <Phone color="#065F46" size={14} />
              <Text style={styles.callSmallText}>Call</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Live Milestones Stepper */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Service Milestones (कार्य प्रगति)</Text>

          <View style={styles.timeline}>
            {/* Step 1 */}
            <View style={styles.timelineItem}>
              <View style={[styles.timelineIcon, styles.timelineDone]}>
                <CheckCircle2 color="#FFFFFF" size={15} />
              </View>
              <View style={styles.timelineContent}>
                <Text style={styles.timelineTitle}>Technician Arrived at Location</Text>
                <Text style={styles.timelineDesc}>Sector 22-B • OTP 8421 Verified at 11:42 AM</Text>
              </View>
            </View>
            <View style={styles.timelineLine} />

            {/* Step 2 */}
            <View style={styles.timelineItem}>
              <View style={[styles.timelineIcon, styles.timelineDone]}>
                <CheckCircle2 color="#FFFFFF" size={15} />
              </View>
              <View style={styles.timelineContent}>
                <Text style={styles.timelineTitle}>Fault Inspected & Cost Approved</Text>
                <Text style={styles.timelineDesc}>Replaced Cracked PVC Drainage Pipe</Text>
              </View>
            </View>
            <View style={styles.timelineLine} />

            {/* Step 3 */}
            <View style={styles.timelineItem}>
              <View style={[styles.timelineIcon, styles.timelineActive]}>
                <Text style={styles.timelineStepNumber}>3</Text>
              </View>
              <View style={styles.timelineContent}>
                <Text style={[styles.timelineTitle, { color: Colors.tertiary }]}>
                  Water Pressure Testing Complete
                </Text>
                <Text style={styles.timelineDesc}>Ready for direct bill settlement</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Before & After Work Photos */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Work Proof Photos (मरम्मत फ़ोटो)</Text>
          <View style={styles.photosGrid}>
            <View style={styles.photoCol}>
              <Text style={styles.photoLabelBefore}>BEFORE (लीकेज)</Text>
              <Image
                source={{
                  uri: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=400&auto=format&fit=crop&q=80'
                }}
                style={styles.proofImage}
              />
            </View>
            <View style={styles.photoCol}>
              <Text style={styles.photoLabelAfter}>AFTER (मरम्मत पूर्ण)</Text>
              <Image
                source={{
                  uri: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=400&auto=format&fit=crop&q=80'
                }}
                style={styles.proofImage}
              />
            </View>
          </View>
        </View>

        {/* Transparent Bill Breakdown */}
        <View style={[styles.card, styles.billCard]}>
          <View style={styles.billHeader}>
            <Text style={styles.sectionTitle}>Transparent Bill (बिल विवरण)</Text>
            <View style={styles.zeroCutBadge}>
              <Text style={styles.zeroCutBadgeText}>0% APP CUT</Text>
            </View>
          </View>

          <View style={styles.billRow}>
            <Text style={styles.billItem}>Visiting & Inspection Fee</Text>
            <Text style={styles.billAmount}>₹200.00</Text>
          </View>

          <View style={styles.billRow}>
            <Text style={styles.billItem}>Heavy-Duty PVC Drain Pipe (New)</Text>
            <Text style={styles.billAmount}>₹180.00</Text>
          </View>

          <View style={styles.billRow}>
            <Text style={styles.billItem}>Teflon Sealant & Labour</Text>
            <Text style={styles.billAmount}>₹50.00</Text>
          </View>

          <View style={styles.billRowHighlight}>
            <Text style={styles.billHighlightText}>KaamConnect Platform Commission</Text>
            <Text style={styles.billHighlightAmount}>₹0.00 (FREE)</Text>
          </View>

          <View style={styles.billTotalRow}>
            <Text style={styles.totalLabel}>Total Payable to Worker</Text>
            <Text style={styles.totalAmount}>₹430.00</Text>
          </View>
        </View>

        {/* Direct UPI / Cash QR Payment Card */}
        <View style={styles.qrCard}>
          <Text style={styles.qrTitle}>Scan & Pay Directly to {worker.name}</Text>
          <Text style={styles.qrSubtitle}>
            UPI ID: <Text style={{ fontWeight: '800' }}>rajesh.tricity@upi</Text> (GPay / PhonePe / Paytm / Cash)
          </Text>

          <View style={styles.qrFrame}>
            <QrCode color="#1E293B" size={100} strokeWidth={1.5} />
            <Text style={styles.qrCodeLabel}>SCAN ANY UPI APP</Text>
          </View>

          <View style={styles.actionRow}>
            <TouchableOpacity
              style={[styles.payBtn, styles.payBtnPrimary]}
              onPress={() => handlePayment('UPI')}
              activeOpacity={0.8}
            >
              <Zap color="#FFFFFF" size={16} />
              <Text style={styles.payBtnText}>Paid ₹430 via UPI ✓</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.payBtn, styles.payBtnCash]}
              onPress={() => handlePayment('Cash')}
              activeOpacity={0.8}
            >
              <Text style={styles.payBtnCashText}>Paid Cash 💵</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
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
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: Colors.border
  },
  headerLeft: {
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
    fontSize: 11,
    color: Colors.textMuted
  },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radius.full,
    backgroundColor: Colors.primaryContainer
  },
  statusPillText: {
    fontSize: 10,
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
    fontSize: 14,
    fontWeight: '800',
    color: Colors.textMain
  },
  workerTrade: {
    fontSize: 12,
    color: Colors.textMuted
  },
  workerVehicle: {
    fontSize: 11,
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
    fontSize: 11,
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
    fontSize: 11,
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
    fontSize: 10,
    fontWeight: '800',
    color: Colors.error,
    marginBottom: 4
  },
  photoLabelAfter: {
    fontSize: 10,
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
    marginBottom: Spacing.sm
  },
  zeroCutBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.full,
    backgroundColor: Colors.primaryContainer
  },
  zeroCutBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: Colors.primaryDark
  },
  billRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4
  },
  billItem: {
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
    paddingVertical: 6,
    marginTop: 4
  },
  billHighlightText: {
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
    paddingTop: Spacing.md,
    marginTop: 6,
    borderTopWidth: 2,
    borderTopColor: Colors.border
  },
  totalLabel: {
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
    marginBottom: 2
  },
  qrSubtitle: {
    fontSize: 11,
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
    fontSize: 9,
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
  payBtnText: {
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
  }
});
