import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StyleProp, ViewStyle } from 'react-native';
import { Colors, Radius } from '../constants/theme';
import { useStore, Language } from '../store/useStore';

const LANGUAGES: Language[] = ['en', 'hi', 'pa'];

export const SHORT_LANG_LABELS: Record<Language, string> = { en: 'EN', hi: 'हिं', pa: 'ਪੰ' };
export const FULL_LANG_LABELS: Record<Language, string> = { en: 'EN', hi: 'हिंदी', pa: 'ਪੰਜਾਬੀ' };

/** Each language by its own name, the way people look for it. */
export const LANGUAGE_NAMES: Record<Language, string> = { en: 'English', hi: 'हिंदी', pa: 'ਪੰਜਾਬੀ' };

const A11Y_LABELS: Record<Language, string> = { en: 'English', hi: 'Hindi', pa: 'Punjabi' };

interface LanguageToggleProps {
  // 'solid' = emerald active pill, 'soft' = white active pill on a tinted track
  variant?: 'solid' | 'soft';
  labels?: Record<Language, string>;
  style?: StyleProp<ViewStyle>;
}

// Segmented EN / हिंदी / ਪੰਜਾਬੀ switcher bound to the app-wide language in the store
export default function LanguageToggle({ variant = 'solid', labels = SHORT_LANG_LABELS, style }: LanguageToggleProps) {
  const { language, setLanguage } = useStore();
  const isSoft = variant === 'soft';

  return (
    <View style={[styles.track, isSoft && styles.trackSoft, style]}>
      {LANGUAGES.map((lang) => {
        const isActive = language === lang;
        return (
          <TouchableOpacity
            key={lang}
            style={[styles.pill, isActive && (isSoft ? styles.pillActiveSoft : styles.pillActiveSolid)]}
            onPress={() => setLanguage(lang)}
            activeOpacity={0.7}
            hitSlop={{ top: 10, bottom: 10 }}
            accessibilityRole="button"
            accessibilityLabel={A11Y_LABELS[lang]}
            aria-selected={isActive}
          >
            <Text
              style={[
                styles.pillText,
                isSoft && styles.pillTextSoft,
                isActive && (isSoft ? styles.pillTextActiveSoft : styles.pillTextActiveSolid)
              ]}
            >
              {labels[lang]}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 0,
    padding: 2,
    backgroundColor: Colors.surface,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.border
  },
  trackSoft: {
    backgroundColor: '#e7eeff',
    borderColor: 'rgba(188, 202, 191, 0.3)'
  },
  pill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.full
  },
  pillActiveSolid: {
    backgroundColor: Colors.primary
  },
  pillActiveSoft: {
    backgroundColor: Colors.surface,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
    elevation: 1
  },
  pillText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569'
  },
  pillTextSoft: {
    fontWeight: '500',
    color: '#3d4a41'
  },
  pillTextActiveSolid: {
    fontWeight: '700',
    color: Colors.onPrimary
  },
  pillTextActiveSoft: {
    fontWeight: '700',
    color: Colors.primaryDark
  }
});
