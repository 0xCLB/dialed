import { StyleSheet, View } from 'react-native';

import {
  isDarkReelTemplate,
  ReelKicker,
  ReelSlideFrame,
  reelFrameStyles,
} from '@/components/reels/ReelSlideFrame';
import { Text } from '@/components/ui/Text';
import { PILLARS, PILLAR_ORDER } from '@/lib/constants';
import type { ReelData, ReelSlide, ReelTemplate } from '@/features/reels/types';

export function ReelPillarSummarySlide({
  data,
  slide,
  template,
}: {
  data: ReelData;
  slide: ReelSlide;
  template: ReelTemplate;
}) {
  const dark = isDarkReelTemplate(template);
  const progressByPillar = new Map((slide.pillarProgress ?? []).map((item) => [item.pillar, item]));

  return (
    <ReelSlideFrame data={data} slide={slide} template={template}>
      <View style={styles.stack}>
        <ReelKicker slide={slide} dark={dark} />
        <Text variant="hero" style={dark && reelFrameStyles.lightText}>
          {slide.title}
        </Text>
        <Text style={[styles.subtitle, dark && reelFrameStyles.lightMuted]}>{slide.subtitle}</Text>
      </View>

      <View style={styles.pillars}>
        {PILLAR_ORDER.map((pillar) => {
          const progress = progressByPillar.get(pillar);
          const points = progress?.points ?? 0;
          const active = points > 0;

          return (
            <View key={pillar} style={[styles.pillarRow, dark && styles.pillarRowDark]}>
              <View style={[styles.pillarDot, { backgroundColor: PILLARS[pillar].color }]} />
              <View style={styles.pillarCopy}>
                <Text variant="subtitle" style={dark && reelFrameStyles.lightText}>
                  {PILLARS[pillar].label}
                </Text>
                <Text variant="caption" style={dark && reelFrameStyles.lightMuted}>
                  {active ? `${points} points` : 'Missing'}
                </Text>
              </View>
              <Text variant="caption" style={[styles.status, dark && reelFrameStyles.lightMuted]}>
                {active ? 'Done' : 'Open'}
              </Text>
            </View>
          );
        })}
      </View>
    </ReelSlideFrame>
  );
}

const styles = StyleSheet.create({
  stack: {
    gap: 10,
  },
  subtitle: {
    color: '#393A40',
    fontWeight: '800',
  },
  pillars: {
    gap: 9,
  },
  pillarRow: {
    minHeight: 58,
    borderRadius: 18,
    paddingHorizontal: 13,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    backgroundColor: 'rgba(255,255,255,0.56)',
  },
  pillarRowDark: {
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  pillarDot: {
    width: 12,
    height: 34,
    borderRadius: 6,
  },
  pillarCopy: {
    flex: 1,
  },
  status: {
    color: '#657083',
    textTransform: 'uppercase',
  },
});
