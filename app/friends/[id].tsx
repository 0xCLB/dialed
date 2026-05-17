import { useEffect, useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { MetricTile } from '@/components/ui/MetricTile';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { theme } from '@/components/ui/theme';
import { useRequireSession } from '@/features/auth/useRequireSession';
import { supabase } from '@/lib/supabase';

export default function FriendDetailScreen() {
  useRequireSession();
  const params = useLocalSearchParams<{ id?: string }>();
  const [profile, setProfile] = useState<any>(null);
  const [score, setScore] = useState(0);

  useEffect(() => {
    if (!params.id) {
      return;
    }
    supabase.from('profiles').select('*').eq('id', params.id).maybeSingle().then(({ data }) => {
      setProfile(data);
    });
    supabase
      .from('leaderboard_scores')
      .select('score')
      .eq('user_id', params.id)
      .eq('scope', 'weekly')
      .maybeSingle()
      .then(({ data }) => setScore(data?.score ?? 0));
  }, [params.id]);

  return (
    <Screen>
      <View style={styles.header}>
        <Button variant="secondary" style={styles.iconButton} onPress={() => router.back()}>
          <ArrowLeft size={18} color={theme.colors.ink} />
        </Button>
        <Text variant="title">{profile?.display_name ?? profile?.username ?? 'Friend'}</Text>
      </View>
      <Card style={styles.card}>
        <Text muted>@{profile?.username ?? 'private'}</Text>
        <Text>{profile?.bio ?? 'Competing across the health stack.'}</Text>
      </Card>
      <View style={styles.metrics}>
        <MetricTile label="Weekly DP" value={score} detail="current reset" />
        <MetricTile label="Privacy" value={profile?.is_private ? 'Private' : 'Open'} detail="profile mode" />
      </View>
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
  card: {
    gap: 8,
  },
  metrics: {
    flexDirection: 'row',
    gap: 10,
  },
});
