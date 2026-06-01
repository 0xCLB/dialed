import { Image, StyleSheet, View } from 'react-native';

import {
  isDarkReelTemplate,
  ReelKicker,
  ReelPoints,
  ReelSlideFrame,
  reelFrameStyles,
} from '@/components/reels/ReelSlideFrame';
import { Text } from '@/components/ui/Text';
import { PILLARS } from '@/lib/constants';
import type { ReelData, ReelSlide, ReelTemplate } from '@/features/reels/types';

export function ReelEntrySlide({
  data,
  slide,
  template,
}: {
  data: ReelData;
  slide: ReelSlide;
  template: ReelTemplate;
}) {
  const dark = isDarkReelTemplate(template);
  const activity = String(slide.metadata?.activity ?? slide.entry?.activityTag ?? 'Proof logged');
  const pillar = slide.pillar;

  return (
    <ReelSlideFrame data={data} slide={slide} template={template}>
      {slide.mediaUrl ? (
        <Image source={{ uri: slide.mediaUrl }} style={styles.photo} />
      ) : (
        <View style={[styles.photoFallback, dark && styles.photoFallbackDark]}>
          <Text variant="caption" style={dark && reelFrameStyles.lightMuted}>
            {activity}
          </Text>
        </View>
      )}

      <View style={styles.stack}>
        <ReelKicker slide={slide} dark={dark} />
        <Text variant="hero" style={dark && reelFrameStyles.lightText}>
          {slide.title}
        </Text>
        <Text style={[styles.subtitle, dark && reelFrameStyles.lightMuted]}>{slide.subtitle}</Text>
      </View>

      <View style={styles.bottomRow}>
        <ReelPoints points={slide.points} dark={dark} />
        <View style={styles.meta}>
          {pillar ? (
            <View style={[styles.pill, { backgroundColor: PILLARS[pillar].color }]}>
              <Text variant="caption" style={styles.pillText}>
                {PILLARS[pillar].label}
              </Text>
            </View>
          ) : null}
          {slide.timestamp ? (
            <Text variant="caption" style={dark && reelFrameStyles.lightMuted}>
              {slide.timestamp}
            </Text>
          ) : null}
        </View>
      </View>
    </ReelSlideFrame>
  );
}

const styles = StyleSheet.create({
  photo: {
    width: '100%',
    aspectRatio: 1.04,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  photoFallback: {
    width: '100%',
    aspectRatio: 1.04,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(20,20,20,0.16)',
    backgroundColor: 'rgba(255,255,255,0.54)',
  },
  photoFallbackDark: {
    borderColor: 'rgba(255,255,255,0.22)',
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  stack: {
    gap: 9,
  },
  subtitle: {
    color: '#393A40',
    fontWeight: '800',
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 10,
  },
  meta: {
    alignItems: 'flex-end',
    gap: 8,
  },
  pill: {
    minHeight: 30,
    borderRadius: 15,
    paddingHorizontal: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillText: {
    color: '#FFFFFF',
    textTransform: 'uppercase',
  },
});
