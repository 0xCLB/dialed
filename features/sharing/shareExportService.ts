import { decode } from 'base64-arraybuffer';
import * as Crypto from 'expo-crypto';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { captureRef } from 'react-native-view-shot';
import type { RefObject } from 'react';

import { track } from '@/lib/analytics';
import { STORAGE_BUCKETS } from '@/lib/constants';
import { supabase } from '@/lib/supabase';
import type { ShareCardData, ShareExportResult } from '@/features/sharing/types';

function shareAssetType(type: ShareCardData['type']) {
  if (type === 'leaderboard' || type === 'friend_compare') return 'leaderboard_card';
  if (type === 'digest') return 'digest_card';
  return 'story_card';
}

async function getAuthenticatedUserId() {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  if (!data.user) throw new Error('You must be signed in to export a share card.');
  return data.user.id;
}

export async function captureShareCard(ref: RefObject<unknown>) {
  track('share_card_generated');
  return captureRef(ref, {
    format: 'png',
    quality: 1,
    result: 'tmpfile',
  });
}

export async function saveShareAssetLocally(uri: string) {
  const destination = `${FileSystem.documentDirectory ?? FileSystem.cacheDirectory}dialed-share-${Date.now()}.png`;
  await FileSystem.copyAsync({ from: uri, to: destination });
  return destination;
}

export async function openNativeShareSheet(uri: string) {
  const available = await Sharing.isAvailableAsync();
  if (!available) {
    return false;
  }

  await Sharing.shareAsync(uri, {
    mimeType: 'image/png',
    dialogTitle: 'Share your Dialed card',
    UTI: 'public.png',
  });
  track('share_card_shared');
  return true;
}

export async function createShareAssetRow(data: ShareCardData) {
  const userId = await getAuthenticatedUserId();
  const assetId = Crypto.randomUUID();
  const scoreDate =
    data.daySummary?.date ?? data.friendCompare?.date ?? new Date().toISOString().slice(0, 10);
  const storagePath = `${STORAGE_BUCKETS.shareAssets}/${userId}/${assetId}.png`;
  const { data: row, error } = await supabase
    .from('share_assets')
    .insert({
      id: assetId,
      user_id: userId,
      entry_id: data.entry?.id ?? null,
      score_date: scoreDate,
      asset_type: shareAssetType(data.type),
      template_id: data.template,
      bucket_id: STORAGE_BUCKETS.shareAssets,
      storage_path: storagePath,
      visibility: 'private',
      status: 'pending_upload',
      metadata: {
        share_card_type: data.type,
        deep_link: data.deepLink,
        invite_code_placeholder: data.inviteCode ?? 'INVITE-CODE',
        reels_prep: {
          todo: ['local_frame_sequence', 'cloud_ffmpeg_render', 'audio_templates', 'weekly_recap_video'],
        },
      },
    })
    .select('id, storage_path')
    .single();

  if (error) throw error;
  return row as { id: string; storage_path: string };
}

export async function uploadShareAssetToSupabase(uri: string, data: ShareCardData) {
  const row = await createShareAssetRow(data);
  const userId = await getAuthenticatedUserId();
  const objectPath = `${userId}/${row.id}.png`;
  const base64 = await FileSystem.readAsStringAsync(uri, {
    encoding: FileSystem.EncodingType.Base64,
  });

  const { error: uploadError } = await supabase.storage
    .from(STORAGE_BUCKETS.shareAssets)
    .upload(objectPath, decode(base64), {
      contentType: 'image/png',
      upsert: false,
    });

  if (uploadError) {
    await supabase.from('share_assets').update({ status: 'failed' }).eq('id', row.id);
    track('share_card_failed', { reason: uploadError.message, type: data.type });
    throw uploadError;
  }

  const { error: updateError } = await supabase
    .from('share_assets')
    .update({ status: 'ready', updated_at: new Date().toISOString() })
    .eq('id', row.id);

  if (updateError) throw updateError;
  track('share_card_uploaded', { type: data.type, template: data.template });

  return {
    assetId: row.id,
    storagePath: row.storage_path,
  };
}

export async function exportShareCard({
  ref,
  data,
  upload = true,
  share = true,
}: {
  ref: RefObject<unknown>;
  data: ShareCardData;
  upload?: boolean;
  share?: boolean;
}): Promise<ShareExportResult> {
  try {
    const capturedUri = await captureShareCard(ref);
    const uri = await saveShareAssetLocally(capturedUri);
    const uploaded = upload ? await uploadShareAssetToSupabase(uri, data) : null;
    const shared = share ? await openNativeShareSheet(uri) : false;

    return {
      uri,
      storagePath: uploaded?.storagePath,
      assetId: uploaded?.assetId,
      shared,
      uploaded: Boolean(uploaded),
    };
  } catch (error) {
    track('share_card_failed', {
      type: data.type,
      message: error instanceof Error ? error.message : 'unknown',
    });
    throw error;
  }
}
