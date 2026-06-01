import Svg, { Circle } from 'react-native-svg';
import { StyleSheet, View } from 'react-native';

import {
  isDarkReelTemplate,
  ReelKicker,
  ReelPoints,
  ReelSlideFrame,
  reelFrameStyles,
} from '@/components/reels/ReelSlideFrame';
import { Text } from '@/components/ui/Text';
import { PILLARS, PILLAR_ORDER } from '@/lib/constants';
import type { ReelData, ReelSlide, ReelTemplate } from '@/features/reels/types';

const SIZE = 118;
const STROKE = 9;
const RADIUS = (SIZE - STROKE) / 2;

function MiniRing({ slide }: { slide: ReelSlide }) {
  const completed = new Set(slide.completedPillars ?? []);

  return (
    <View style={styles.ringWrap}>
      <Svg width={SIZE} height={SIZE}>
        {PILLAR_ORDER.map((pillar, index) => {
          const radius = RADIUS - index * 13;
          const circumference = 2 * Math.PI * radius;
          const active = completed.has(pillar);
          return (
            <Circle
              key={pillar}
              cx={SIZE / 2}
              cy={SIZE / 2}
              r={radius}
              stroke={PILLARS[pillar].color}
              strokeWidth={STROKE}
              fill="none"
              strokeLinecap="round"
              strokeDasharray={`${circumference * (active ? 0.94 : 0.08)} ${circumference}`}
              rotation="-90"
              origin={`${SIZE / 2}, ${SIZE / 2}`}
              opacity={active ? 1 : 0.18}
            />
          );
        })}
      </Svg>
    </View>
  );
}

export function ReelIntroSlide({
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
      <View style={styles.bodyRow}>
        <MiniRing slide={slide} />
        <ReelPoints points={slide.points} dark={dark} />
      </View>
      <Text variant="caption" style={[styles.caption, dark && reelFrameStyles.lightMuted]}>
        {slide.completedPillars?.length ?? 0}/4 pillars complete
      </Text>
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
  bodyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 14,
  },
  ringWrap: {
    width: SIZE,
    height: SIZE,
  },
  caption: {
    color: '#657083',
    textTransform: 'uppercase',
  },
});
