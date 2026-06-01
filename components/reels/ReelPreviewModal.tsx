import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Modal, PanResponder, Pressable, StyleSheet, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { ChevronLeft, ChevronRight, X } from 'lucide-react-native';

import { UpgradeCTA } from '@/components/monetization/UpgradeCTA';
import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { theme } from '@/components/ui/theme';
import { ReelEntrySlide } from '@/components/reels/ReelEntrySlide';
import { ReelExportButton } from '@/components/reels/ReelExportButton';
import { ReelIntroSlide } from '@/components/reels/ReelIntroSlide';
import { ReelLeaderboardSlide } from '@/components/reels/ReelLeaderboardSlide';
import { ReelOutroSlide } from '@/components/reels/ReelOutroSlide';
import { ReelPillarSummarySlide } from '@/components/reels/ReelPillarSummarySlide';
import { ReelProgressDots } from '@/components/reels/ReelProgressDots';
import {
  isDarkReelTemplate,
  ReelKicker,
  ReelSlideFrame,
  reelFrameStyles,
} from '@/components/reels/ReelSlideFrame';
import { ReelTemplatePicker } from '@/components/reels/ReelTemplatePicker';
import { usePro } from '@/features/monetization/usePro';
import { exportReel } from '@/features/reels/reelExportService';
import { track } from '@/lib/analytics';
import type {
  ReelData,
  ReelExportStatus,
  ReelSlide,
  ReelTemplate,
} from '@/features/reels/types';

function renderSlide(data: ReelData, slide: ReelSlide, template: ReelTemplate) {
  if (slide.type === 'intro') return <ReelIntroSlide data={data} slide={slide} template={template} />;
  if (slide.type === 'entry') return <ReelEntrySlide data={data} slide={slide} template={template} />;
  if (slide.type === 'pillar_summary') {
    return <ReelPillarSummarySlide data={data} slide={slide} template={template} />;
  }
  if (slide.type === 'leaderboard') {
    return <ReelLeaderboardSlide data={data} slide={slide} template={template} />;
  }
  if (slide.type === 'outro') return <ReelOutroSlide data={data} slide={slide} template={template} />;

  const dark = isDarkReelTemplate(template);
  return (
    <ReelSlideFrame data={data} slide={slide} template={template}>
      <View style={styles.digestStack}>
        <ReelKicker slide={slide} dark={dark} />
        <Text variant="hero" style={dark && reelFrameStyles.lightText}>
          {slide.title}
        </Text>
        <Text style={[styles.digestQuote, dark && reelFrameStyles.lightMuted]}>
          {slide.subtitle}
        </Text>
      </View>
    </ReelSlideFrame>
  );
}

export function ReelPreviewModal({
  visible,
  data,
  isPro,
  onClose,
}: {
  visible: boolean;
  data: ReelData | null;
  isPro?: boolean;
  onClose: () => void;
}) {
  const pro = usePro();
  const slideRef = useRef<View>(null);
  const [slideIndex, setSlideIndex] = useState(0);
  const [template, setTemplate] = useState<ReelTemplate | null>(null);
  const [lockedTemplate, setLockedTemplate] = useState<ReelTemplate | null>(null);
  const [exportStatus, setExportStatus] = useState<ReelExportStatus>('idle');
  const hasProAccess = Boolean(isPro || pro.isPro);

  const effectiveData = useMemo(() => {
    if (!data) return null;
    return { ...data, template: template ?? data.template };
  }, [data, template]);
  const currentSlide = effectiveData?.slides[slideIndex] ?? null;

  const goNext = useCallback(() => {
    if (!effectiveData) return;
    setSlideIndex((current) => (current + 1) % effectiveData.slides.length);
  }, [effectiveData]);

  const goPrevious = useCallback(() => {
    if (!effectiveData) return;
    setSlideIndex((current) => (current - 1 + effectiveData.slides.length) % effectiveData.slides.length);
  }, [effectiveData]);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, gesture) =>
          Math.abs(gesture.dx) > 18 && Math.abs(gesture.dx) > Math.abs(gesture.dy),
        onPanResponderRelease: (_, gesture) => {
          if (gesture.dx < -42) goNext();
          if (gesture.dx > 42) goPrevious();
        },
      }),
    [goNext, goPrevious],
  );

  useEffect(() => {
    if (!visible || !data) return;
    setTemplate(data.template);
    setSlideIndex(0);
    setExportStatus('idle');
    track('reel_opened', { date: data.date, slide_count: data.slides.length });
  }, [data, visible]);

  useEffect(() => {
    if (!visible || !currentSlide || !effectiveData) return;
    track('reel_slide_viewed', {
      date: effectiveData.date,
      type: currentSlide.type,
      index: slideIndex + 1,
    });
  }, [currentSlide, effectiveData, slideIndex, visible]);

  useEffect(() => {
    if (!visible || !effectiveData || effectiveData.slides.length < 2) return undefined;
    const timer = setInterval(() => {
      setSlideIndex((current) => (current + 1) % effectiveData.slides.length);
    }, 2800);

    return () => clearInterval(timer);
  }, [effectiveData, visible]);

  async function handleExport() {
    if (!effectiveData || !slideRef.current) return;
    if (!hasProAccess) {
      pro.requirePro('reel_exports', 'reel_export');
      return;
    }
    setExportStatus('rendering');
    const result = await exportReel({ slideRefs: [slideRef], data: effectiveData });

    if (result.status === 'ready') {
      setExportStatus('ready');
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      return;
    }

    setExportStatus('failed');
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    Alert.alert('Reel export failed', result.error ?? 'The reel could not be exported.');
  }

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFillObject} onPress={onClose} />
        <View style={styles.sheet}>
          <View style={styles.header}>
            <View>
              <Text variant="subtitle">Reels From My Day</Text>
              <Text variant="caption" muted>
                9:16 day recap
              </Text>
            </View>
            <Button variant="secondary" style={styles.closeButton} onPress={onClose}>
              <X size={18} color={theme.colors.ink} />
            </Button>
          </View>

          {effectiveData && currentSlide ? (
            <>
              <View style={styles.previewRow}>
                <Button variant="secondary" style={styles.navButton} onPress={goPrevious}>
                  <ChevronLeft size={18} color={theme.colors.ink} />
                </Button>
                <View
                  ref={slideRef}
                  collapsable={false}
                  style={styles.preview}
                  {...panResponder.panHandlers}>
                  {renderSlide(effectiveData, currentSlide, effectiveData.template)}
                </View>
                <Button variant="secondary" style={styles.navButton} onPress={goNext}>
                  <ChevronRight size={18} color={theme.colors.ink} />
                </Button>
              </View>

              <ReelProgressDots count={effectiveData.slides.length} index={slideIndex} />
              <ReelTemplatePicker
                value={effectiveData.template}
                isPro={hasProAccess}
                onChange={(nextTemplate) => {
                  setLockedTemplate(null);
                  setTemplate(nextTemplate);
                }}
                onLockedPress={(nextTemplate) => {
                  setLockedTemplate(nextTemplate);
                  pro.requirePro('premium_share_templates', 'share_template');
                }}
              />
              {lockedTemplate ? (
                <UpgradeCTA
                  title="Premium reel template"
                  body="This style is part of Dialed Pro, because the scoreboard deserves better lighting."
                  onPress={() => pro.openPaywall('share_template')}
                />
              ) : null}
              {!hasProAccess ? (
                <UpgradeCTA
                  title="Reel export is Pro"
                  body="Preview stays free. Exporting the recap is where Pro steps in."
                  onPress={() => pro.openPaywall('reel_export')}
                />
              ) : null}
              <View style={styles.actions}>
                <View style={styles.primaryAction}>
                  <ReelExportButton status={exportStatus} onPress={handleExport} />
                </View>
                <Button variant="secondary" onPress={onClose} style={styles.laterButton}>
                  Later
                </Button>
              </View>
            </>
          ) : null}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(20,20,20,0.35)',
  },
  sheet: {
    maxHeight: '96%',
    borderTopLeftRadius: theme.radius.xxl,
    borderTopRightRadius: theme.radius.xxl,
    padding: 18,
    paddingBottom: 30,
    gap: 14,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  closeButton: {
    width: 42,
    minHeight: 42,
    paddingHorizontal: 0,
  },
  previewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  preview: {
    alignItems: 'center',
  },
  navButton: {
    width: 38,
    minHeight: 38,
    paddingHorizontal: 0,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
  },
  primaryAction: {
    flex: 1,
  },
  laterButton: {
    flex: 1,
  },
  digestStack: {
    gap: 18,
  },
  digestQuote: {
    color: '#393A40',
    fontSize: 24,
    lineHeight: 31,
    fontWeight: '800',
  },
});
