import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, SafeAreaView, Alert, Image, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Mic, Camera, Send, Check } from 'lucide-react-native';
import { Colors, Spacing, Radius } from '../../constants/theme';
import { useStore } from '../../store/useStore';

export default function PostJobScreen() {
  const router = useRouter();
  const { selectedCategory } = useStore();
  const [title, setTitle] = useState('Kitchen Sink Under-pipe Burst & Water Flow');
  const [desc, setDesc] = useState('PVC pipe under the kitchen sink cracked suddenly, water is spreading on floor. Need replacement pipe immediately.');
  const [isRecording, setIsRecording] = useState(false);
  const [timing, setTiming] = useState('immediate');

  const handleToggleRecord = () => {
    setIsRecording(!isRecording);
    if (!isRecording) {
      Alert.alert('🎙️ Recording Started', 'Recording 15s audio memo in Hindi/Punjabi for nearby mistris...');
    } else {
      Alert.alert('✅ Recording Saved', 'Voice memo attached to request!');
    }
  };

  const handleBroadcast = () => {
    if (Platform.OS === 'web') {
      window.alert('🎉 Job Broadcasted\n\nRequest sent to 24 nearby Tricity technicians in Sector 22 & Mohali! Receiving quotes now...');
      router.push('/compare-offers');
    } else {
      Alert.alert('🎉 Job Broadcasted', 'Request sent to 24 nearby Tricity technicians in Sector 22 & Mohali! Receiving quotes now...', [
        { text: 'View Bids', onPress: () => router.push('/compare-offers') }
      ]);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Post Job & Details / काम का विवरण</Text>
          <Text style={styles.headerSub}>Broadcast Direct to Tricity Workers • 0% Fee</Text>
        </View>

        {/* Category Picker */}
        <View style={styles.card}>
          <Text style={styles.label}>Service Type / सेवा का प्रकार *</Text>
          <View style={styles.pickerBox}>
            <Text style={styles.pickerText}>Plumber (पानी / लीकेज समस्या)</Text>
          </View>
        </View>

        {/* Problem Title */}
        <View style={styles.card}>
          <Text style={styles.label}>Problem Heading / मुख्य समस्या *</Text>
          <TextInput
            style={styles.textInput}
            value={title}
            onChangeText={setTitle}
            placeholder="e.g. Geyser not turning on, Water pipe burst"
          />
        </View>

        {/* Interactive Voice Note Card */}
        <View style={styles.voiceCard}>
          <Text style={styles.voiceTitle}>🎙️ Record Voice Note (बोलकर बताएं)</Text>
          <Text style={styles.voiceSub}>Help technicians understand the issue faster in Hindi or Punjabi</Text>

          <View style={styles.voiceRow}>
            <TouchableOpacity
              style={[styles.recordBtn, isRecording && styles.recordBtnActive]}
              onPress={handleToggleRecord}
            >
              <Mic color="#FFFFFF" size={24} />
            </TouchableOpacity>

            <View style={styles.waveformWrap}>
              <View style={[styles.waveBar, { height: isRecording ? 24 : 10 }]} />
              <View style={[styles.waveBar, { height: isRecording ? 18 : 14 }]} />
              <View style={[styles.waveBar, { height: isRecording ? 28 : 8 }]} />
              <View style={[styles.waveBar, { height: isRecording ? 16 : 12 }]} />
              <View style={[styles.waveBar, { height: isRecording ? 22 : 6 }]} />
            </View>

            <Text style={styles.timerText}>{isRecording ? 'REC 0:18' : '0:14 ✓'}</Text>
          </View>

          <Text style={styles.voiceAttached}>Audio Attached: "Under sink PVC pipe cracked, need emergency fix" ✓</Text>
        </View>

        {/* Description */}
        <View style={styles.card}>
          <Text style={styles.label}>Additional Details / अधिक जानकारी</Text>
          <TextInput
            style={[styles.textInput, { height: 72, textAlignVertical: 'top' }]}
            multiline
            value={desc}
            onChangeText={setDesc}
          />
        </View>

        {/* Attach Photos */}
        <View style={styles.card}>
          <Text style={styles.label}>Attach Photos (फ़ोटो जोड़ें)</Text>
          <View style={{ flexDirection: 'row', gap: 10, marginTop: 4 }}>
            <TouchableOpacity style={styles.addPhotoBox} onPress={() => Alert.alert('Add Photo', 'Camera selected')}>
              <Camera color={Colors.textMuted} size={20} />
              <Text style={{ fontSize: 9, color: Colors.textMuted, marginTop: 2 }}>Add</Text>
            </TouchableOpacity>
            <Image
              source={{ uri: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=150&auto=format&fit=crop&q=80' }}
              style={styles.photoThumb}
            />
          </View>
        </View>

        {/* Timing Selector */}
        <View style={styles.card}>
          <Text style={styles.label}>Preferred Timing / कब चाहिए? *</Text>
          <View style={styles.timingRow}>
            <TouchableOpacity
              style={[styles.timingBtn, timing === 'immediate' && styles.timingBtnActive]}
              onPress={() => setTiming('immediate')}
            >
              <Text style={[styles.timingText, timing === 'immediate' && styles.timingTextActive]}>Immediate (30m)</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.timingBtn, timing === 'afternoon' && styles.timingBtnActive]}
              onPress={() => setTiming('afternoon')}
            >
              <Text style={[styles.timingText, timing === 'afternoon' && styles.timingTextActive]}>Afternoon</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.timingBtn, timing === 'tomorrow' && styles.timingBtnActive]}
              onPress={() => setTiming('tomorrow')}
            >
              <Text style={[styles.timingText, timing === 'tomorrow' && styles.timingTextActive]}>Tomorrow</Text>
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity style={styles.broadcastBtn} onPress={handleBroadcast}>
          <Send color="#FFFFFF" size={18} />
          <Text style={styles.broadcastBtnText}>Broadcast Request to Nearby Pros (Free)</Text>
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
  header: {
    marginBottom: Spacing.md
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.textMain
  },
  headerSub: {
    fontSize: 10,
    color: Colors.textMuted
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.xl,
    padding: 14,
    marginBottom: Spacing.md
  },
  label: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.textMain,
    marginBottom: 6
  },
  pickerBox: {
    height: 44,
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: Colors.borderDark,
    borderRadius: Radius.md,
    justifyContent: 'center',
    paddingHorizontal: 12
  },
  pickerText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textMain
  },
  textInput: {
    borderWidth: 1.5,
    borderColor: Colors.borderDark,
    borderRadius: Radius.md,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    color: Colors.textMain
  },
  voiceCard: {
    backgroundColor: '#F0FDF4',
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: Colors.primary,
    borderRadius: Radius.xl,
    padding: 16,
    alignItems: 'center',
    marginBottom: Spacing.md
  },
  voiceTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#065F46'
  },
  voiceSub: {
    fontSize: 10,
    color: '#047857',
    marginTop: 2,
    marginBottom: 12,
    textAlign: 'center'
  },
  voiceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 8
  },
  recordBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center'
  },
  recordBtnActive: {
    backgroundColor: Colors.error
  },
  waveformWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    height: 30
  },
  waveBar: {
    width: 4,
    backgroundColor: Colors.primary,
    borderRadius: 2
  },
  timerText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#065F46'
  },
  voiceAttached: {
    fontSize: 10,
    color: '#059669',
    fontWeight: '700'
  },
  addPhotoBox: {
    width: 60,
    height: 60,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: Colors.borderDark,
    alignItems: 'center',
    justifyContent: 'center'
  },
  photoThumb: {
    width: 60,
    height: 60,
    borderRadius: Radius.md
  },
  timingRow: {
    flexDirection: 'row',
    gap: 6
  },
  timingBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center'
  },
  timingBtnActive: {
    backgroundColor: '#F0FDF4',
    borderColor: Colors.primary,
    borderWidth: 2
  },
  timingText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.textMain
  },
  timingTextActive: {
    color: '#065F46'
  },
  broadcastBtn: {
    backgroundColor: Colors.primary,
    height: 52,
    borderRadius: Radius.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 6,
    marginBottom: 20
  },
  broadcastBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800'
  }
});
