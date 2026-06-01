import { useState } from 'react';
import { Alert, Image, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { Camera, ImagePlus, Send } from 'lucide-react-native';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { TextInputField } from '@/components/ui/TextInputField';
import { theme } from '@/components/ui/theme';
import { PillarChip } from '@/components/entries/PillarChip';
import { SubmitSuccessCard } from '@/components/entries/SubmitSuccessCard';
import { VisibilitySelector } from '@/components/entries/VisibilitySelector';
import { useAuth } from '@/features/auth/useAuth';
import { createPhotoEntry } from '@/features/entries/entryService';
import type {
  EntryVisibility,
  EntryWithScore,
  WellnessPillar,
} from '@/features/entries/types';
import { PILLAR_ORDER } from '@/lib/constants';

type ProofAsset = {
  uri: string;
  mimeType?: string | null;
  base64?: string | null;
  width?: number | null;
  height?: number | null;
};

function inferPillar(value: string): WellnessPillar {
  const text = value.toLowerCase();
  if (/(gym|walk|run|lift|workout|steps|sport|hike)/.test(text)) return 'movement';
  if (/(water|protein|meal|fuel|hydrate|nutrition|fast)/.test(text)) return 'fuel';
  if (/(read|meditat|journal|study|mind|focus|therapy)/.test(text)) return 'mind';
  if (/(sauna|stretch|sleep|mobility|cold|breath|recover)/.test(text)) return 'recovery';
  return 'movement';
}

function firstAsset(result: ImagePicker.ImagePickerResult): ProofAsset | null {
  if (result.canceled || result.assets.length === 0) {
    return null;
  }
  const asset = result.assets[0];
  return {
    uri: asset.uri,
    mimeType: asset.mimeType,
    base64: asset.base64,
    width: asset.width,
    height: asset.height,
  };
}

export default function CaptureScreen() {
  const { session, profile } = useAuth();
  const [asset, setAsset] = useState<ProofAsset | null>(null);
  const [activity, setActivity] = useState('');
  const [caption, setCaption] = useState('');
  const [pillar, setPillar] = useState<WellnessPillar>('movement');
  const [visibility, setVisibility] = useState<EntryVisibility>(
    profile?.privacyDefault ?? 'friends',
  );
  const [submitting, setSubmitting] = useState(false);
  const [submittedEntry, setSubmittedEntry] = useState<EntryWithScore | null>(null);

  function handleActivityChange(value: string) {
    setActivity(value);
    if (value.trim()) {
      setPillar(inferPillar(value));
    }
  }

  async function takePhoto() {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Camera permission needed', 'Allow camera access to capture proof.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.88,
      base64: true,
    });
    const picked = firstAsset(result);
    if (picked) {
      setAsset(picked);
      await Haptics.selectionAsync();
    }
  }

  async function choosePhoto() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Photo permission needed', 'Allow photo access to choose proof.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.88,
      base64: true,
    });
    const picked = firstAsset(result);
    if (picked) {
      setAsset(picked);
      await Haptics.selectionAsync();
    }
  }

  async function handleSubmit() {
    if (!session?.user.id) {
      Alert.alert('Sign in required', 'Log in again before creating an entry.');
      return;
    }
    if (!asset) {
      Alert.alert('Add proof', 'Take or choose a photo first.');
      return;
    }
    if (!activity.trim()) {
      Alert.alert('Add an activity', 'Name what this proof shows.');
      return;
    }

    setSubmitting(true);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const entry = await createPhotoEntry({
        userId: session.user.id,
        uri: asset.uri,
        mimeType: asset.mimeType,
        base64: asset.base64,
        width: asset.width,
        height: asset.height,
        activityTag: activity,
        caption,
        wellnessPillar: pillar,
        visibility,
      });
      setSubmittedEntry(entry);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert(
        'Photo proof failed',
        error instanceof Error ? error.message : 'The photo entry could not be saved.',
      );
    } finally {
      setSubmitting(false);
    }
  }

  function resetForm() {
    setSubmittedEntry(null);
    setAsset(null);
    setActivity('');
    setCaption('');
    setPillar('movement');
  }

  if (submittedEntry) {
    return (
      <Screen>
        <SubmitSuccessCard
          entry={submittedEntry}
          onViewDay={() => router.replace('/(tabs)/home')}
          onAddAnother={resetForm}
        />
      </Screen>
    );
  }

  return (
    <Screen>
      <View style={styles.header}>
        <Text variant="title">Capture proof</Text>
        <Text muted>Photo evidence for the thing you actually did.</Text>
      </View>

      <Card style={styles.previewCard}>
        {asset ? (
          <Image source={{ uri: asset.uri }} style={styles.preview} />
        ) : (
          <View style={styles.emptyPreview}>
            <Camera size={38} color={theme.colors.primary} />
            <Text variant="subtitle">Ready when you are</Text>
          </View>
        )}
        <View style={styles.photoActions}>
          <Button onPress={takePhoto} style={styles.photoButton}>
            <Camera size={18} color={theme.colors.white} />
            Camera
          </Button>
          <Button variant="secondary" onPress={choosePhoto} style={styles.photoButton}>
            <ImagePlus size={18} color={theme.colors.ink} />
            Library
          </Button>
        </View>
      </Card>

      <Card style={styles.card}>
        <TextInputField
          label="Activity"
          placeholder="Gym, walk, protein, meditation"
          value={activity}
          onChangeText={handleActivityChange}
          autoCapitalize="words"
          returnKeyType="done"
        />
        <TextInputField
          label="Caption"
          placeholder="What made it count?"
          value={caption}
          onChangeText={setCaption}
          multiline
          style={styles.captionInput}
        />
      </Card>

      <Card style={styles.card}>
        <Text variant="subtitle">Pillar</Text>
        <View style={styles.pillars}>
          {PILLAR_ORDER.map((item) => (
            <PillarChip
              key={item}
              pillar={item}
              selected={pillar === item}
              onPress={() => {
                Haptics.selectionAsync();
                setPillar(item);
              }}
            />
          ))}
        </View>
      </Card>

      <Card style={styles.card}>
        <Text variant="subtitle">Visibility</Text>
        <VisibilitySelector value={visibility} onChange={setVisibility} />
      </Card>

      <Button
        loading={submitting}
        disabled={!asset || !activity.trim()}
        onPress={handleSubmit}>
        <Send size={18} color={theme.colors.white} />
        Submit proof
      </Button>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: 6,
  },
  previewCard: {
    gap: 12,
  },
  preview: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.surfaceAlt,
  },
  emptyPreview: {
    minHeight: 280,
    borderRadius: theme.radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: theme.colors.primarySoft,
  },
  photoActions: {
    flexDirection: 'row',
    gap: 10,
  },
  photoButton: {
    flex: 1,
  },
  card: {
    gap: 14,
  },
  captionInput: {
    minHeight: 92,
    paddingTop: 14,
    textAlignVertical: 'top',
  },
  pillars: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
});
