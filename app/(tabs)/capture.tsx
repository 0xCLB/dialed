import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Image, StyleSheet, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { Camera, ImagePlus, Send, Utensils } from 'lucide-react-native';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { TextInputField } from '@/components/ui/TextInputField';
import { theme } from '@/components/ui/theme';
import { PillarChip } from '@/components/entries/PillarChip';
import { SubmitSuccessCard } from '@/components/entries/SubmitSuccessCard';
import { VisibilitySelector } from '@/components/entries/VisibilitySelector';
import { FoodAnalysisCard } from '@/components/food/FoodAnalysisCard';
import { DailyProofCard } from '@/components/proofs/DailyProofCard';
import { EarnMoreProofsCard } from '@/components/proofs/EarnMoreProofsCard';
import { ProofBalancePill } from '@/components/proofs/ProofBalancePill';
import { ProofSpendModal } from '@/components/proofs/ProofSpendModal';
import { ProProofUpgradeCard } from '@/components/proofs/ProProofUpgradeCard';
import { useAuth } from '@/features/auth/useAuth';
import { createPhotoEntry } from '@/features/entries/entryService';
import type {
  EntryVisibility,
  EntryWithScore,
  WellnessPillar,
} from '@/features/entries/types';
import { analyzeFoodProof } from '@/features/food/foodAnalysisService';
import type { FoodAnalysisResult } from '@/features/food/types';
import { usePro } from '@/features/monetization/usePro';
import { canSpendProof, getTodayProofWallet } from '@/features/proofs/proofService';
import type { ProofWallet } from '@/features/proofs/types';
import { PILLAR_ORDER } from '@/lib/constants';

type ProofAsset = {
  uri: string;
  mimeType?: string | null;
  base64?: string | null;
  width?: number | null;
  height?: number | null;
};

type CaptureMode = 'photo' | 'food';

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
  const params = useLocalSearchParams<{ activity?: string; pillar?: string; mode?: string }>();
  const pro = usePro();
  const [proofMode, setProofMode] = useState<CaptureMode>(
    params.mode === 'food' ? 'food' : 'photo',
  );
  const [asset, setAsset] = useState<ProofAsset | null>(null);
  const [activity, setActivity] = useState('');
  const [caption, setCaption] = useState('');
  const [pillar, setPillar] = useState<WellnessPillar>('movement');
  const [visibility, setVisibility] = useState<EntryVisibility>(
    profile?.privacyDefault ?? 'friends',
  );
  const [proofWallet, setProofWallet] = useState<ProofWallet | null>(null);
  const [proofLoading, setProofLoading] = useState(true);
  const [proofModalVisible, setProofModalVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submittedEntry, setSubmittedEntry] = useState<EntryWithScore | null>(null);
  const [foodAnalysis, setFoodAnalysis] = useState<FoodAnalysisResult | null>(null);
  const hasProAccess = Boolean(pro.isPro || profile?.isPro);
  const modeCopy = proofMode === 'food'
    ? {
        title: 'Food Proof',
        body: 'Estimate macros and Fuel quality from a meal photo. Estimates are not medical advice.',
        empty: 'Show the meal',
        activityLabel: 'Food context',
        activityPlaceholder: 'Chicken bowl, smoothie, protein breakfast',
        captionPlaceholder: 'Anything useful about portions or ingredients?',
      }
    : {
        title: 'Photo Proof',
        body: 'Photo proof verifies the action. Verified proofs move your score and ranked leaderboard.',
        empty: 'Ready when you are',
        activityLabel: 'Activity',
        activityPlaceholder: 'Gym, walk, protein, meditation',
        captionPlaceholder: 'What made it count?',
      };
  const currentActivityTag = useMemo(
    () => (proofMode === 'food' ? activity.trim() || 'food_photo' : activity.trim()),
    [activity, proofMode],
  );

  const refreshProofWallet = useCallback(async () => {
    if (!session?.user.id) {
      setProofWallet(null);
      setProofLoading(false);
      return null;
    }

    setProofLoading(true);
    try {
      const wallet = await getTodayProofWallet(session.user.id, { isPro: hasProAccess });
      setProofWallet(wallet);
      return wallet;
    } catch {
      return null;
    } finally {
      setProofLoading(false);
    }
  }, [hasProAccess, session?.user.id]);

  useEffect(() => {
    refreshProofWallet();
  }, [refreshProofWallet]);

  useEffect(() => {
    if (params.mode === 'food') {
      setProofMode('food');
      setPillar('fuel');
      if (!activity.trim()) {
        setActivity('food_photo');
      }
    }
    if (typeof params.activity === 'string' && params.activity.trim() && !activity.trim()) {
      setActivity(params.activity);
    }
    if (
      typeof params.pillar === 'string' &&
      PILLAR_ORDER.includes(params.pillar as WellnessPillar)
    ) {
      setPillar(params.pillar as WellnessPillar);
    }
  }, [activity, params.activity, params.mode, params.pillar]);

  function handleActivityChange(value: string) {
    setActivity(value);
    if (proofMode === 'food') {
      setPillar('fuel');
    } else if (value.trim()) {
      setPillar(inferPillar(value));
    }
  }

  function changeMode(mode: CaptureMode) {
    Haptics.selectionAsync();
    setProofMode(mode);
    setFoodAnalysis(null);
    if (mode === 'food') {
      setPillar('fuel');
      if (!activity.trim()) setActivity('food_photo');
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

  async function handleUseProofPress() {
    if (!session?.user.id) {
      Alert.alert('Sign in required', 'Log in again before creating an entry.');
      return;
    }
    if (!asset) {
      Alert.alert('Add proof', proofMode === 'food' ? 'Take or choose a food photo first.' : 'Take or choose a photo first.');
      return;
    }
    if (!currentActivityTag) {
      Alert.alert('Add an activity', 'Name what this proof shows.');
      return;
    }

    try {
      const proofCheck = await canSpendProof(session.user.id, { isPro: hasProAccess });
      setProofWallet(proofCheck.wallet);
      setProofModalVisible(true);
    } catch (proofError) {
      Alert.alert(
        'Daily Proof check failed',
        proofError instanceof Error
          ? proofError.message
          : 'Could not verify your Daily Proof balance.',
      );
    }
  }

  async function handleSubmit() {
    if (!session?.user.id || !asset) {
      Alert.alert('Proof missing', 'Take or choose a photo before submitting.');
      return;
    }

    setProofModalVisible(false);
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
        activityTag: currentActivityTag,
        caption,
        wellnessPillar: proofMode === 'food' ? 'fuel' : pillar,
        visibility,
        proofType: 'photo',
        verificationMethod: 'photo',
        trustLevel: 'photo_ai',
        rankedEligible: true,
        metadata: proofMode === 'food'
          ? {
              food_proof: true,
              proof_subtype: 'food',
              food_analysis_status: 'pending',
              macro_estimate_disclaimer: 'Estimated macros only. Not medical advice.',
            }
          : undefined,
      });
      setSubmittedEntry(entry);
      if (proofMode === 'food') {
        setFoodAnalysis(await analyzeFoodProof(entry));
      }
      await refreshProofWallet();
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      await refreshProofWallet();
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert(
        'Photo proof failed',
        error instanceof Error ? error.message : 'The photo entry could not be saved.',
      );
    } finally {
      setSubmitting(false);
    }
  }

  function openEarnMore() {
    setProofModalVisible(false);
    router.push('/(tabs)/home');
  }

  function openUpgrade() {
    setProofModalVisible(false);
    pro.openPaywall('settings');
  }

  function resetForm() {
    setSubmittedEntry(null);
    setFoodAnalysis(null);
    setAsset(null);
    setActivity(proofMode === 'food' ? 'food_photo' : '');
    setCaption('');
    setPillar(proofMode === 'food' ? 'fuel' : 'movement');
  }

  if (submittedEntry) {
    return (
      <Screen>
        <ProofBalancePill wallet={proofWallet} loading={proofLoading} />
        <SubmitSuccessCard
          entry={submittedEntry}
          proofWallet={proofWallet}
          onViewDay={() => router.replace('/(tabs)/home')}
          onAddAnother={resetForm}
        />
        {proofMode === 'food' ? <FoodAnalysisCard result={foodAnalysis} /> : null}
      </Screen>
    );
  }

  return (
    <Screen>
      <View style={styles.header}>
        <Text variant="title">{modeCopy.title}</Text>
        <Text muted>{modeCopy.body}</Text>
        <ProofBalancePill wallet={proofWallet} loading={proofLoading} />
      </View>

      <Card style={styles.card}>
        <Text variant="subtitle">Proof mode</Text>
        <View style={styles.modeRow}>
          <Button
            variant={proofMode === 'photo' ? 'primary' : 'secondary'}
            style={styles.modeButton}
            onPress={() => changeMode('photo')}>
            <Camera size={18} color={proofMode === 'photo' ? theme.colors.white : theme.colors.ink} />
            Photo Proof
          </Button>
          <Button
            variant={proofMode === 'food' ? 'primary' : 'secondary'}
            style={styles.modeButton}
            onPress={() => changeMode('food')}>
            <Utensils size={18} color={proofMode === 'food' ? theme.colors.white : theme.colors.ink} />
            Food Proof
          </Button>
        </View>
      </Card>

      <DailyProofCard
        wallet={proofWallet}
        loading={proofLoading}
        onEarnMore={openEarnMore}
        onUpgrade={openUpgrade}
      />

      <Card style={styles.previewCard}>
        {asset ? (
          <Image source={{ uri: asset.uri }} style={styles.preview} />
        ) : (
          <View style={styles.emptyPreview}>
            {proofMode === 'food' ? (
              <Utensils size={38} color={theme.colors.primary} />
            ) : (
              <Camera size={38} color={theme.colors.primary} />
            )}
            <Text variant="subtitle">{modeCopy.empty}</Text>
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
          label={modeCopy.activityLabel}
          placeholder={modeCopy.activityPlaceholder}
          value={activity}
          onChangeText={handleActivityChange}
          autoCapitalize="words"
          returnKeyType="done"
        />
        <TextInputField
          label="Caption"
          placeholder={modeCopy.captionPlaceholder}
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
                if (proofMode !== 'food') setPillar(item);
              }}
            />
          ))}
        </View>
      </Card>

      <Card style={styles.card}>
        <Text variant="subtitle">Visibility</Text>
        <VisibilitySelector value={visibility} onChange={setVisibility} />
      </Card>

      {proofWallet?.remainingProofs === 0 || proofWallet?.setupRequired ? (
        <>
          <EarnMoreProofsCard onShare={openEarnMore} onInvite={() => router.push('/friends')} />
          {!hasProAccess ? <ProProofUpgradeCard onPress={openUpgrade} /> : null}
        </>
      ) : null}

      <Button
        loading={submitting}
        disabled={!asset || !currentActivityTag}
        onPress={handleUseProofPress}>
        <Send size={18} color={theme.colors.white} />
        {proofMode === 'food' ? 'Use Food Proof' : 'Use a Proof'}
      </Button>
      <ProofSpendModal
        visible={proofModalVisible}
        wallet={proofWallet}
        loading={submitting}
        onConfirm={handleSubmit}
        onClose={() => setProofModalVisible(false)}
        onEarnMore={openEarnMore}
        onUpgrade={openUpgrade}
      />
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
  modeRow: {
    flexDirection: 'row',
    gap: 10,
  },
  modeButton: {
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
