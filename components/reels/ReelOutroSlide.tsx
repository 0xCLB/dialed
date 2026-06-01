import { StyleSheet, View } from 'react-native';

import {
  isDarkReelTemplate,
  ReelKicker,
  ReelSlideFrame,
  reelFrameStyles,
} from '@/components/reels/ReelSlideFrame';
import { Text } from '@/components/ui/Text';
import type { ReelData, ReelSlide, ReelTemplate } from '@/features/reels/types';

export function ReelOutroSlide({
  data,
  slide,
  template,
}: {
  data: ReelData;
  slide: ReelSlide;
  template: ReelTemplate;
}) {
  const dark = isDarkReelTemplate(template);

  return (
    <ReelSlideFrame data={data} slide={slide} template={template}>
      <View style={styles.stack}>
        <ReelKicker slide={slide} dark={dark} />
        <Text variant="hero" style={dark && reelFrameStyles.lightText}>
          {slide.title}
        </Text>
        <Text style={[styles.subtitle, dark && reelFrameStyles.lightMuted]}>{slide.subtitle}</Text>
      </View>

      <View style={[styles.badge, dark && styles.badgeDark]}>
        <Text variant="caption" style={dark && reelFrameStyles.lightMuted}>
          {slide.profile?.username ? `@${slide.profile.username}` : '@dialed'}
        </Text>
        <Text variant="title" style={dark && reelFrameStyles.lightText}>
          Stack proof daily.
        </Text>
      </View>

      <View style={styles.hooks}>
        <Text variant="caption" style={dark && reelFrameStyles.lightMuted}>
          Weekly reels
        </Text>
        <Text variant="caption" style={dark && reelFrameStyles.lightMuted}>
          Music templates
        </Text>
        <Text variant="caption" style={dark && reelFrameStyles.lightMuted}>
          Remove watermark
        </Text>
      </View>
    </ReelSlideFrame>
  );
}

const styles = StyleSheet.create({
  stack: {
    gap: 11,
  },
  subtitle: {
    color: '#393A40',
    fontWeight: '800',
  },
  badge: {
    borderRadius: 24,
    padding: 18,
    gap: 8,
    backgroundColor: 'rgba(255,255,255,0.58)',
  },
  badgeDark: {
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  hooks: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
});
