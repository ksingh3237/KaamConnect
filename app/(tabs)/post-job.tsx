import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert, Image, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Mic, Camera, Send } from 'lucide-react-native';
import { Colors, Spacing, Radius } from '../../constants/theme';
import { useStore } from '../../store/useStore';
import { useSession } from '../../store/useSession';
import { useAsync } from '../../api/useAsync';
import { createJob, getCategories } from '../../api/endpoints';
import { isApiError, userMessage } from '../../api/errors';
import { uploadFile, type PickedFile } from '../../api/upload';
import { pickImage } from '../../utils/pickImage';
import type { JobTiming } from '../../api/types';
import { ErrorBlock, LoadingBlock } from '../../components/StateBlocks';

const MAX_PHOTOS = 4;
const TIMINGS: { id: JobTiming; label: string }[] = [
  { id: 'IMMEDIATE', label: 'Immediate (30m)' },
  { id: 'AFTERNOON', label: 'Afternoon' },
  { id: 'TOMORROW', label: 'Tomorrow' },
];


export default function PostJobScreen() {
  const router = useRouter();
  const { selectedCategory, setSelectedCategory, setActiveJobId } = useStore();
  const { customerProfile } = useSession();
  const categories = useAsync(() => getCategories(), [], { reloadOnFocus: false });
  const address = customerProfile?.addresses.find((a) => a.isPrimary) ?? customerProfile?.addresses[0] ?? null;

  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [timing, setTiming] = useState<JobTiming>('IMMEDIATE');
  const [titleError, setTitleError] = useState(false);
  const [photos, setPhotos] = useState<{ file: PickedFile; key: string | null; failed?: boolean }[]>([]);
  const [uploading, setUploading] = useState(false);
  const [posting, setPosting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const category = (categories.data ?? []).find((c) => c.id === selectedCategory) ?? categories.data?.[0] ?? null;

  const handleAddPhoto = async () => {
    if (uploading || photos.length >= MAX_PHOTOS) return;
    setFormError(null);
    try {
      const picked = await pickImage();
      if (!picked) return;
      setUploading(true);
      const key = await uploadFile('JOB_PHOTO', picked);
      setPhotos((prev) => [...prev, { file: picked, key }]);
    } catch (error) {
      setFormError(error instanceof Error && !isApiError(error) ? error.message : userMessage(error));
    } finally {
      setUploading(false);
    }
  };

  const handleBroadcast = async () => {
    if (posting || uploading) return;
    setFormError(null);
    if (!title.trim()) {
      setTitleError(true);
      return;
    }
    if (!category) {
      setFormError('Choose a service first. / पहले सेवा चुनें');
      return;
    }
    if (!address) {
      setFormError('Add your address first. / पहले अपना पता जोड़ें');
      router.push('/customer-onboarding');
      return;
    }
    setPosting(true);
    try {
      const job = await createJob({
          categoryId: category.id,
          title: title.trim(),
          ...(desc.trim() ? { description: desc.trim() } : {}),
          timing,
          addressId: address.id,
          ...(photos.length ? { photoKeys: photos.flatMap((p) => (p.key ? [p.key] : [])) } : {}),
      });
      setActiveJobId(job.id);
      setTitle('');
      setDesc('');
      setPhotos([]);
      router.push('/compare-offers');
    } catch (error) {
      const fields = isApiError(error) ? error.details.map((d) => `${d.field}: ${d.issue}`).join('; ') : '';
      setFormError(userMessage(error) + (fields ? ` (${fields})` : ''));
    } finally {
      setPosting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Post Job & Details / काम का विवरण</Text>
          <Text style={styles.headerSub}>Broadcast Direct to Tricity Workers • 0% Fee</Text>
        </View>

        {/* Category Picker */}
        <View style={styles.card}>
          <Text style={styles.label}>Service Type / सेवा का प्रकार *</Text>
          {categories.loading && <LoadingBlock label="Loading services… / सेवाएँ लोड हो रही हैं…" />}
          {categories.error && !categories.data && <ErrorBlock message={categories.error} onRetry={() => void categories.reload()} />}
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {(categories.data ?? []).map((c) => {
              const on = category?.id === c.id;
              return (
                <TouchableOpacity
                  key={c.id}
                  style={[styles.timingBtn, on && styles.timingBtnActive]}
                  onPress={() => setSelectedCategory(c.id)}
                  accessibilityRole="button"
                  accessibilityState={{ selected: on }}
                >
                  <Text style={[styles.timingText, on && styles.timingTextActive]} numberOfLines={1}>{c.title.en} ({c.title.hi})</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Problem Title */}
        <View style={styles.card}>
          <Text style={styles.label}>Problem Heading / मुख्य समस्या *</Text>
          <TextInput
            style={[styles.textInput, titleError && styles.textInputError]}
            value={title}
            onChangeText={(text) => {
              setTitle(text);
              setTitleError(false);
            }}
            placeholder="e.g. Geyser not turning on, Water pipe burst"
            placeholderTextColor={Colors.textSubtle}
          />
          {titleError && (
            <Text style={styles.errorText}>Please describe the main problem / कृपया समस्या लिखें</Text>
          )}
        </View>

        {/* Voice notes need a recorder that is not part of this build yet; the server supports them (JOB_VOICE). */}
        <View style={styles.voiceCard}>
          <Text style={styles.voiceTitle}>🎙️ Voice Note (बोलकर बताएं)</Text>
          <Text style={styles.voiceSub}>Voice notes are coming soon. For now, write the problem below or add photos.</Text>
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
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 4 }}>
            {photos.length < MAX_PHOTOS && (
              <TouchableOpacity style={styles.addPhotoBox} onPress={() => void handleAddPhoto()} disabled={uploading} accessibilityRole="button" accessibilityLabel="Add a photo of the problem">
                {uploading ? <ActivityIndicator color={Colors.primary} /> : <Camera color={Colors.textMuted} size={20} />}
                <Text style={{ fontSize: 9, color: Colors.textMuted, marginTop: 2 }}>{uploading ? 'Uploading' : 'Add'}</Text>
              </TouchableOpacity>
            )}
            {photos.map((p, i) => (
              <TouchableOpacity key={p.key ?? i} onPress={() => setPhotos((prev) => prev.filter((_, j) => j !== i))} accessibilityRole="button" accessibilityLabel="Remove this photo">
                <Image source={{ uri: p.file.uri }} style={styles.photoThumb} />
              </TouchableOpacity>
            ))}
          </View>
          {photos.length > 0 && <Text style={{ fontSize: 9, color: Colors.textMuted, marginTop: 4 }}>Tap a photo to remove it.</Text>}
        </View>

        {/* Timing Selector */}
        <View style={styles.card}>
          <Text style={styles.label}>Preferred Timing / कब चाहिए? *</Text>
          <View style={styles.timingRow}>
            {TIMINGS.map((t) => (
              <TouchableOpacity key={t.id} style={[styles.timingBtn, timing === t.id && styles.timingBtnActive]} onPress={() => setTiming(t.id)} accessibilityRole="button" accessibilityState={{ selected: timing === t.id }}>
                <Text style={[styles.timingText, timing === t.id && styles.timingTextActive]}>{t.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {formError && (
          <Text style={[styles.errorText, { textAlign: 'center', marginBottom: 8 }]} accessibilityRole="alert">{formError}</Text>
        )}
        <TouchableOpacity style={[styles.broadcastBtn, (posting || uploading) && { opacity: 0.7 }]} onPress={() => void handleBroadcast()} disabled={posting || uploading} accessibilityRole="button">
          {posting ? <ActivityIndicator color="#FFFFFF" /> : <Send color="#FFFFFF" size={18} />}
          <Text style={styles.broadcastBtnText}>{posting ? 'Posting…' : 'Broadcast Request to Nearby Pros (Free)'}</Text>
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
  textInputError: {
    borderColor: Colors.error
  },
  errorText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.error,
    marginTop: 6
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
    fontWeight: '700',
    textAlign: 'center'
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
    // Constant 2px border so the row doesn't shift when the selection changes
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: 'center'
  },
  timingBtnActive: {
    backgroundColor: '#F0FDF4',
    borderColor: Colors.primary
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
    minHeight: 52,
    paddingHorizontal: Spacing.lg,
    paddingVertical: 8,
    borderRadius: Radius.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 6,
    marginBottom: 20
  },
  broadcastBtnText: {
    flexShrink: 1,
    textAlign: 'center',
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800'
  }
});
