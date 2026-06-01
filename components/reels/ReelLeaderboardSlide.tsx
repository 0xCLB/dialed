import { StyleSheet, View } from 'react-native';

import {
  isDarkReelTemplate,
  ReelKicker,
  ReelPoints,
  ReelSlideFrame,
  reelFrameStyles,
} from '@/components/reels/ReelSlideFrame';
import { Text } from '@/components/ui/Text';
import type { ReelData, ReelSlide, ReelTemplate } from '@/features/reels/types';

export function ReelLeaderboardSlide({
  data,
  slide,
  template,
}: {
  data: ReelData;
  slide: ReelSlide;
  template: ReelTemplate;
}) {
  const dark = isDarkReelTemplate(template);
  const rows = slide.leaderboardRows ?? [];

  return (
    <ReelSlideFrame data={data} slide={slide} template={template}>
      <View style={styles.stack}>
        <ReelKicker slide={slide} dark={dark} />
        <Text variant="hero" style={dark && reelFrameStyles.lightText}>
          {slide.title}
        </Text>
        <Text style={[styles.subtitle, dark && reelFrameStyles.lightMuted]}>{slide.subtitle}</Text>
      </View>

      <View style={styles.rows}>
        {rows.length === 0 ? (
          <View style={[styles.empty, dark && styles.emptyDark]}>
            <Text variant="caption" style={dark && reelFrameStyles.lightMuted}>
              Friends leaderboard is warming up.
            </Text>
          </View>
        ) : (
          rows.slice(0, 4).map((row) => (
            <View key={row.userId} style={[styles.row, row.isCurrentUser && styles.current]}>
              <Text variant="subtitle" style={[styles.rank, row.isCurrentUser && styles.currentText]}>
                #{row.rank}
              </Text>
              <View style={styles.rowCopy}>
                <Text variant="subtitle" style={dark && reelFrameStyles.lightText}>
                  {row.profile?.displayName ?? 'Dialed athlete'}
                </Text>
                <Text variant="caption" style={dark && reelFrameStyles.lightMuted}>
                  {row.completedPillars}/4 pillars - streak {row.streak}
                </Text>
              </View>
              <Text variant="subtitle" style={dark && reelFrameStyles.lightText}>
                {row.points}
              </Text>
            </View>
          ))
        )}
      </View>

      <ReelPoints points={slide.points} dark={dark} />
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
  rows: {
    gap: 8,
  },
  row: {
    minHeight: 56,
    borderRadius: 18,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  current: {
    backgroundColor: '#7C3AED',
  },
  rank: {
    width: 42,
    color: '#FFFFFF',
  },
  currentText: {
    color: '#FFFFFF',
  },
  rowCopy: {
    flex: 1,
  },
  empty: {
    minHeight: 76,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.54)',
  },
  emptyDark: {
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
});
