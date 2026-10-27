// Shown while an assigned worker has passed their promised arrival time: tells the worker what happens next and the
// customer that they may keep waiting or cancel. All the rules live on the server (docs/15-no-show.md); this only displays them.
import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Clock } from 'lucide-react-native';
import type { JobView } from '../api/types';
import { lateNotice, lateState } from '../utils/noShow';

const TICK_MS = 30_000;

export default function LateBanner({ job, viewer }: { job: JobView; viewer: 'customer' | 'worker' }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), TICK_MS);
    return () => clearInterval(timer);
  }, []);

  const state = lateState(job, now);
  if (!state) return null;
  const { title, body } = lateNotice(state, viewer);
  return (
    <View style={styles.box} accessibilityRole="alert" accessibilityLiveRegion="polite">
      <Clock color="#92400E" size={20} />
      <View style={{ flex: 1 }}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.body}>{body}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  box: { flexDirection: 'row', gap: 10, alignItems: 'flex-start', backgroundColor: '#FEF3C7', borderColor: '#FCD34D', borderWidth: 1, borderRadius: 12, padding: 12 },
  title: { fontSize: 14, fontWeight: '800', color: '#92400E' },
  body: { fontSize: 13, color: '#92400E', marginTop: 2, lineHeight: 18 },
});
