// One service in the 2-column grid: a real work photo with the icon and a "Visit Fee Applicable" note on top (the fee
// itself is what each worker quotes), the name and typical jobs in the person's language, and a "Book Direct" call to action. A category without a photo (added on the server later) shows its colour
// and icon instead.
import React, { memo } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { ArrowRight } from 'lucide-react-native';
import { Colors, Radius } from '../constants/theme';
import { SERVICE_PHOTOS, serviceIcon } from '../constants/services';
import type { ServiceCategory } from '../api/types';
import { pick } from '../i18n';
import { categoryExamples } from '../i18n/categories';
import { useLang, useT } from '../i18n/useT';

interface Props {
  category: ServiceCategory;
  onPress: (id: string) => void;
}

function ServiceCard({ category, onPress }: Props) {
  const Icon = serviceIcon(category.iconKey);
  const photo = SERVICE_PHOTOS[category.id];
  const t = useT();
  const lang = useLang();
  const title = pick(category.title, lang);
  return (
    <Pressable
      onPress={() => onPress(category.id)}
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
      accessibilityRole="button"
      accessibilityLabel={`${title}. ${t('Visit Fee Applicable')}. ${t('Book Direct')}`}
    >
      <View style={[styles.photoWrap, { backgroundColor: category.bgColor }]}>
        {photo ? (
          <Image source={photo} style={styles.photo} resizeMode="cover" />
        ) : (
          <View style={styles.photoFallback}>
            <Icon color={category.color} size={44} strokeWidth={1.8} />
          </View>
        )}
        <View style={styles.zeroFee}>
          <Text style={styles.zeroFeeText}>{t('0% FEE')}</Text>
        </View>
        <View style={styles.overlayBadge}>
          <View style={[styles.iconDot, { backgroundColor: category.bgColor }]}>
            <Icon color={category.color} size={14} strokeWidth={2.4} />
          </View>
          <Text style={styles.feeText} numberOfLines={1}>{t('Visit Fee Applicable')}</Text>
        </View>
      </View>

      <View style={styles.body}>
        <Text style={styles.title} numberOfLines={2}>{title}</Text>
        <Text style={styles.examples} numberOfLines={2}>{categoryExamples(category.id, category.examples, lang)}</Text>
        <View style={styles.cta}>
          <Text style={styles.ctaText}>{t('Book Direct')}</Text>
          <ArrowRight color="#FFFFFF" size={15} strokeWidth={2.6} />
        </View>
      </View>
    </Pressable>
  );
}

export default memo(ServiceCard);

const styles = StyleSheet.create({
  card: {
    width: '48.5%',
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
    shadowColor: '#0F172A',
    shadowOpacity: 0.07,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 8,
    elevation: 2,
  },
  cardPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.97 }],
  },
  photoWrap: {
    width: '100%',
    aspectRatio: 4 / 3,
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  photoFallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  zeroFee: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: Colors.primary,
    borderRadius: Radius.full,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  zeroFeeText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  overlayBadge: {
    position: 'absolute',
    left: 8,
    maxWidth: '92%',
    bottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: Radius.full,
    paddingLeft: 3,
    paddingRight: 9,
    paddingVertical: 3,
  },
  iconDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  feeText: {
    flexShrink: 1,
    fontSize: 12,
    fontWeight: '800',
    color: Colors.textMain,
  },
  body: {
    flex: 1,
    padding: 10,
  },
  title: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.textMain,
    lineHeight: 20,
  },
  examples: {
    fontSize: 13,
    color: Colors.textMuted,
    lineHeight: 18,
    marginTop: 4,
    marginBottom: 10,
  },
  cta: {
    marginTop: 'auto',
    minHeight: 40,
    borderRadius: Radius.md,
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  ctaText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
});
