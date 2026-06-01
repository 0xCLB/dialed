import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, UserMinus } from 'lucide-react-native';

import { Avatar } from '@/components/ui/Avatar';
import { LockedFeatureCard } from '@/components/monetization/LockedFeatureCard';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/StateViews';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { theme } from '@/components/ui/theme';
import { EntryCard } from '@/components/entries/EntryCard';
import { DaySummaryCard } from '@/components/progress/DaySummaryCard';
import { PillarProgressCard } from '@/components/progress/PillarProgressCard';
import { StreakCard } from '@/components/progress/StreakCard';
import { ReactionBar } from '@/components/social/ReactionBar';
import { ShareCTAButton } from '@/components/sharing/ShareCTAButton';
import { SharePreviewModal } from '@/components/sharing/SharePreviewModal';
import { useRequireSession } from '@/features/auth/useRequireSession';
import { usePro } from '@/features/monetization/usePro';
import {
  getFriendProfile,
  reactToEntry,
  removeFriend,
  removeReaction,
} from '@/features/social/socialService';
import type { FriendProfile, ReactionType } from '@/features/social/types';
import { buildFriendCompareShareData } from '@/features/sharing/shareDataService';
import type { ShareCardData } from '@/features/sharing/types';

export default function FriendDetailScreen() {
  useRequireSession();
  const pro = usePro();
  const params = useLocalSearchParams<{ id?: string }>();
  const profileId = params.id;
  const [friendProfile, setFriendProfile] = useState<FriendProfile | null>(null);
  const [activeReactions, setActiveReactions] = useState<Record<string, ReactionType[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [removing, setRemoving] = useState(false);
  const [shareData, setShareData] = useState<ShareCardData | null>(null);
  const [shareVisible, setShareVisible] = useState(false);

  const load = useCallback(async () => {
    if (!profileId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      setFriendProfile(await getFriendProfile(profileId));
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Friend profile failed to load.');
    } finally {
      setLoading(false);
    }
  }, [profileId]);

  useEffect(() => {
    load();
  }, [load]);

  const acceptedFriendship = useMemo(
    () => friendProfile?.friendship?.status === 'accepted' ? friendProfile.friendship : null,
    [friendProfile],
  );

  async function handleRemoveFriend() {
    if (!acceptedFriendship) {
      return;
    }
    setRemoving(true);
    try {
      await removeFriend(acceptedFriendship.id);
      router.back();
    } catch (removeError) {
      Alert.alert(
        'Could not remove friend',
        removeError instanceof Error ? removeError.message : 'Try again in a moment.',
      );
    } finally {
      setRemoving(false);
    }
  }

  async function handleReaction(entryId: string, reaction: ReactionType, selected: boolean) {
    setActiveReactions((current) => {
      const existing = current[entryId] ?? [];
      return {
        ...current,
        [entryId]: selected
          ? existing.filter((item) => item !== reaction)
          : [...existing, reaction],
      };
    });

    try {
      if (selected) {
        await removeReaction(entryId, reaction);
      } else {
        await reactToEntry(entryId, reaction);
      }
    } catch {
      setActiveReactions((current) => {
        const existing = current[entryId] ?? [];
        return {
          ...current,
          [entryId]: selected
            ? [...existing, reaction]
            : existing.filter((item) => item !== reaction),
        };
      });
    }
  }

  async function handleShareCompare() {
    if (!profileId) return;
    setShareData(await buildFriendCompareShareData(profileId, new Date()));
    setShareVisible(true);
  }

  return (
    <Screen>
      <View style={styles.header}>
        <Button variant="secondary" style={styles.iconButton} onPress={() => router.back()}>
          <ArrowLeft size={18} color={theme.colors.ink} />
        </Button>
        <Text variant="title">Friend</Text>
      </View>

      {loading ? <LoadingState label="Loading friend" /> : null}
      {error ? <ErrorState message={error} onRetry={load} /> : null}

      {!loading && !error && friendProfile ? (
        <>
          <Card style={styles.identityCard}>
            <Avatar
              name={friendProfile.profile.displayName}
              uri={friendProfile.profile.avatarPath}
              size={72}
            />
            <View style={styles.identity}>
              <Text variant="title">{friendProfile.profile.displayName}</Text>
              <Text muted>@{friendProfile.profile.username ?? 'dialed'}</Text>
              {friendProfile.profile.bio ? <Text muted>{friendProfile.profile.bio}</Text> : null}
            </View>
          </Card>

          <DaySummaryCard summary={friendProfile.todaySummary} title="Today" />
          <ShareCTAButton label="Share comparison" onPress={handleShareCompare} />
          {pro.isPro ? (
            <Card style={styles.card}>
              <Text variant="subtitle">Pro Compare Insight</Text>
              <Text muted>
                Pillar-by-pillar friend analysis is staged here. For now, comparison share cards are ready and privacy-safe.
              </Text>
            </Card>
          ) : (
            <LockedFeatureCard
              title="Advanced friend insights"
              body="Pro will break down where you are gaining ground, where they are, and what to do before tomorrow."
              onPress={() => pro.openPaywall('advanced_insights')}
            />
          )}
          <StreakCard streak={friendProfile.streak} />

          <View style={styles.sectionHeader}>
            <Text variant="subtitle">Pillar Snapshot</Text>
            <Text variant="caption" muted>
              visible data
            </Text>
          </View>
          <View style={styles.pillarGrid}>
            {friendProfile.pillarProgress.map((progress) => (
              <PillarProgressCard key={progress.pillar} progress={progress} />
            ))}
          </View>

          <View style={styles.sectionHeader}>
            <Text variant="subtitle">Visible Entries</Text>
            <Text variant="caption" muted>
              {friendProfile.recentEntries.length}
            </Text>
          </View>
          {friendProfile.recentEntries.length === 0 ? (
            <EmptyState
              title="Nothing visible"
              body="Private entries stay private. Visible friend proof will appear here."
            />
          ) : (
            friendProfile.recentEntries.map((entry) => (
              <View key={entry.id} style={styles.entryBlock}>
                <EntryCard entry={entry} />
                <ReactionBar
                  active={activeReactions[entry.id] ?? []}
                  onToggle={(reaction, selected) => handleReaction(entry.id, reaction, selected)}
                />
              </View>
            ))
          )}

          {acceptedFriendship ? (
            <Button variant="secondary" loading={removing} onPress={handleRemoveFriend}>
              <UserMinus size={18} color={theme.colors.ink} />
              Remove friend
            </Button>
          ) : null}
        </>
      ) : null}
      <SharePreviewModal
        visible={shareVisible}
        data={shareData}
        isPro={pro.isPro}
        onClose={() => setShareVisible(false)}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconButton: {
    width: 44,
    minHeight: 44,
    paddingHorizontal: 0,
  },
  identityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  identity: {
    flex: 1,
    gap: 4,
  },
  card: {
    gap: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  pillarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  entryBlock: {
    gap: 10,
  },
});
