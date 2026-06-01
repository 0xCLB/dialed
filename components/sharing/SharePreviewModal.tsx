import { useMemo, useRef, useState } from 'react';
import { Alert, Modal, Pressable, StyleSheet, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { X } from 'lucide-react-native';

import { UpgradeCTA } from '@/components/monetization/UpgradeCTA';
import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { theme } from '@/components/ui/theme';
import { DailyScoreShareCard } from '@/components/sharing/DailyScoreShareCard';
import { DigestQuoteCard } from '@/components/sharing/DigestQuoteCard';
import { EntryShareCard } from '@/components/sharing/EntryShareCard';
import { FriendCompareShareCard } from '@/components/sharing/FriendCompareShareCard';
import { FullyDialedShareCard } from '@/components/sharing/FullyDialedShareCard';
import { LeaderboardShareCard } from '@/components/sharing/LeaderboardShareCard';
import { StreakShareCard } from '@/components/sharing/StreakShareCard';
import { TemplatePicker } from '@/components/sharing/TemplatePicker';
import { usePro } from '@/features/monetization/usePro';
import { exportShareCard } from '@/features/sharing/shareExportService';
import { track } from '@/lib/analytics';
import type { ShareCardData, ShareCardTemplate } from '@/features/sharing/types';

function renderCard(data: ShareCardData) {
  if (data.type === 'entry') return <EntryShareCard data={data} />;
  if (data.type === 'daily_score') return <DailyScoreShareCard data={data} />;
  if (data.type === 'fully_dialed') return <FullyDialedShareCard data={data} />;
  if (data.type === 'streak') return <StreakShareCard data={data} />;
  if (data.type === 'leaderboard') return <LeaderboardShareCard data={data} />;
  if (data.type === 'friend_compare') return <FriendCompareShareCard data={data} />;
  return <DigestQuoteCard data={data} />;
}

export function SharePreviewModal({
  visible,
  data,
  isPro,
  onClose,
}: {
  visible: boolean;
  data: ShareCardData | null;
  isPro?: boolean;
  onClose: () => void;
}) {
  const pro = usePro();
  const [template, setTemplate] = useState<ShareCardTemplate | null>(null);
  const [lockedTemplate, setLockedTemplate] = useState<ShareCardTemplate | null>(null);
  const [exporting, setExporting] = useState(false);
  const cardRef = useRef<View>(null);
  const hasProAccess = Boolean(isPro || pro.isPro);
  const effectiveData = useMemo(() => {
    if (!data) return null;
    return { ...data, template: template ?? data.template };
  }, [data, template]);

  async function handleShare() {
    if (!effectiveData || !cardRef.current) return;
    setExporting(true);
    track('share_card_opened', { type: effectiveData.type, template: effectiveData.template });
    try {
      await exportShareCard({ ref: cardRef, data: effectiveData });
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert(
        'Share failed',
        error instanceof Error ? error.message : 'The share card could not be exported.',
      );
    } finally {
      setExporting(false);
    }
  }

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFillObject} onPress={onClose} />
        <View style={styles.sheet}>
          <View style={styles.header}>
            <View>
              <Text variant="subtitle">Share card</Text>
              <Text variant="caption" muted>
                9:16 story export
              </Text>
            </View>
            <Button variant="secondary" style={styles.closeButton} onPress={onClose}>
              <X size={18} color={theme.colors.ink} />
            </Button>
          </View>

          {effectiveData ? (
            <>
              <View ref={cardRef} collapsable={false} style={styles.preview}>
                {renderCard(effectiveData)}
              </View>
              <TemplatePicker
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
                  title="Premium template"
                  body="That template is part of Dialed Pro. Cleaner flex, less default internet."
                  onPress={() => pro.openPaywall('share_template')}
                />
              ) : null}
              {!hasProAccess && !lockedTemplate ? (
                <UpgradeCTA
                  title="Remove watermark"
                  body="Pro watermark controls are staged for the export polish pass."
                  cta="Preview Pro"
                  onPress={() => pro.openPaywall('share_template')}
                />
              ) : null}
              <View style={styles.actions}>
                <Button loading={exporting} onPress={handleShare} style={styles.actionButton}>
                  Share now
                </Button>
                <Button variant="secondary" onPress={onClose} style={styles.actionButton}>
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
    maxHeight: '94%',
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
  preview: {
    alignItems: 'center',
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
  },
  actionButton: {
    flex: 1,
  },
});
