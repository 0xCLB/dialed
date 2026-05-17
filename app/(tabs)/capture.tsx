import { useMemo, useState } from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { router } from 'expo-router';
import { Camera, MapPin } from 'lucide-react-native';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { PillarBadge } from '@/components/ui/PillarBadge';
import { Screen } from '@/components/ui/Screen';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { Text } from '@/components/ui/Text';
import { TextInputField } from '@/components/ui/TextInputField';
import { theme } from '@/components/ui/theme';
import { useAuthStore } from '@/features/auth/auth-store';
import { createPhotoEntry } from '@/features/entries/entry-service';
import { ACTION_CATALOG, PILLAR_ORDER } from '@/lib/constants';
import type { WellnessPillar } from '@/types/domain';

export default function CaptureScreen() {
  const session = useAuthStore((state) => state.session);
  const [pillar, setPillar] = useState<WellnessPillar>('movement');
  const [actionType, setActionType] = useState(ACTION_CATALOG.movement[0].key);
  const [caption, setCaption] = useState('');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [withLocation, setWithLocation] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const action = useMemo(
    () => ACTION_CATALOG[pillar].find((item) => item.key === actionType) ?? ACTION_CATALOG[pillar][0],
    [actionType, pillar],
  );

  async function openCamera() {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      setError('Camera permission is required to capture proof.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 5],
      quality: 0.86,
    });

    if (!result.canceled) {
      setPhotoUri(result.assets[0].uri);
    }
  }

  async function handleCreate() {
    if (!session || !photoUri) {
      return;
    }

    setLoading(true);
    setError(null);
    try {
      let location: Record<string, unknown> | null = null;
      if (withLocation) {
        const permission = await Location.requestForegroundPermissionsAsync();
        if (permission.granted) {
          const current = await Location.getCurrentPositionAsync({});
          location = {
            latitude: current.coords.latitude,
            longitude: current.coords.longitude,
            accuracy: current.coords.accuracy,
          };
        }
      }

      const entry = await createPhotoEntry({
        userId: session.user.id,
        pillar,
        actionType: action.key,
        title: action.label,
        caption,
        localUri: photoUri,
        location,
      });
      router.push(`/entry/${entry.id}`);
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : 'Could not score proof.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen>
      <Text variant="title">Capture proof</Text>
      <Text muted>Photos are uploaded as proof, then scored by the server-side AI function.</Text>

      <Pressable onPress={openCamera} style={styles.camera}>
        {photoUri ? (
          <Image source={{ uri: photoUri }} style={styles.preview} />
        ) : (
          <View style={styles.cameraEmpty}>
            <Camera size={32} color={theme.colors.ink} />
            <Text variant="subtitle">Open camera</Text>
            <Text muted>Gym plate, trail view, meal, journal, sauna, or any real proof.</Text>
          </View>
        )}
      </Pressable>

      <Card style={styles.card}>
        <SegmentedControl
          value={pillar}
          options={PILLAR_ORDER.map((item) => ({ value: item, label: item }))}
          onChange={(next) => {
            setPillar(next);
            setActionType(ACTION_CATALOG[next][0].key);
          }}
        />
        <View style={styles.actionGrid}>
          {ACTION_CATALOG[pillar].map((item) => {
            const active = item.key === actionType;
            return (
              <Pressable
                key={item.key}
                onPress={() => setActionType(item.key)}
                style={[styles.action, active && styles.actionActive]}>
                <Text variant="caption" style={active && styles.actionActiveText}>
                  {item.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
        <PillarBadge pillar={pillar} />
      </Card>

      <TextInputField
        label="Caption"
        value={caption}
        onChangeText={setCaption}
        placeholder="What did you complete?"
      />

      <Pressable onPress={() => setWithLocation((current) => !current)} style={styles.location}>
        <MapPin size={18} color={withLocation ? theme.colors.accent : theme.colors.muted} />
        <Text style={withLocation && styles.locationActive}>Attach location proof</Text>
      </Pressable>

      {error ? <Text style={styles.error}>{error}</Text> : null}
      <Button disabled={!photoUri} loading={loading} onPress={handleCreate}>
        Score proof
      </Button>
    </Screen>
  );
}

const styles = StyleSheet.create({
  camera: {
    width: '100%',
    aspectRatio: 0.86,
    borderRadius: theme.radius.lg,
    overflow: 'hidden',
    backgroundColor: theme.colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border,
  },
  preview: {
    width: '100%',
    height: '100%',
  },
  cameraEmpty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 28,
    gap: 10,
  },
  card: {
    gap: 14,
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  action: {
    minHeight: 38,
    borderRadius: theme.radius.sm,
    paddingHorizontal: 10,
    justifyContent: 'center',
    backgroundColor: theme.colors.surfaceAlt,
  },
  actionActive: {
    backgroundColor: theme.colors.ink,
  },
  actionActiveText: {
    color: theme.colors.white,
  },
  location: {
    minHeight: 46,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  locationActive: {
    color: theme.colors.accent,
  },
  error: {
    color: theme.colors.danger,
  },
});
