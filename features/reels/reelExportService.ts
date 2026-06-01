import { decode } from 'base64-arraybuffer';
import * as Crypto from 'expo-crypto';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import type { RefObject } from 'react';
import { captureRef } from 'react-native-view-shot';

import { track } from '@/lib/analytics';
import { STORAGE_BUCKETS } from '@/lib/constants';
import { supabase } from '@/lib/supabase';
import type { ReelData, ReelExportResult } from '@/features/reels/types';

async function getAuthenticatedUserId() {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  if (!data.user) throw new Error('You must be signed in to export a reel.');
  return data.user.id;
}

function localBaseDirectory() {
  const baseDir = FileSystem.documentDirectory ?? FileSystem.cacheDirectory;
  if (!baseDir) {
    throw new Error('No local directory is available for reel export.');
  }
  return baseDir;
}

export async function captureReelSlide(ref: RefObject<unknown>) {
  return captureRef(ref, {
    format: 'png',
    quality: 1,
    result: 'tmpfile',
  });
}

export async function captureAllSlides(slideRefs: Array<RefObject<unknown>>) {
  const captured: string[] = [];

  for (const ref of slideRefs) {
    if (ref.current) {
      captured.push(await captureReelSlide(ref));
    }
  }

  track('reel_generated', { slide_count: captured.length });
  return captured;
}

export async function saveSlideSequenceLocally(uris: string[]) {
  const baseDir = localBaseDirectory();
  const stamp = Date.now();

  return Promise.all(
    uris.map(async (uri, index) => {
      const destination = `${baseDir}dialed-reel-${stamp}-${index + 1}.png`;
      await FileSystem.copyAsync({ from: uri, to: destination });
      return destination;
    }),
  );
}

export async function openNativeShareSheetForReel(uriOrUris: string | string[]) {
  const uri = Array.isArray(uriOrUris) ? uriOrUris[0] : uriOrUris;
  if (!uri) return false;

  const available = await Sharing.isAvailableAsync();
  if (!available) {
    return false;
  }

  await Sharing.shareAsync(uri, {
    mimeType: 'image/png',
    dialogTitle: 'Share your Dialed reel',
    UTI: 'public.png',
  });
  track('reel_shared');
  return true;
}

export async function createShareAssetRowForReel(data: ReelData) {
  const userId = await getAuthenticatedUserId();
  const assetId = Crypto.randomUUID();
  const storagePath = `${STORAGE_BUCKETS.shareAssets}/${userId}/${assetId}.png`;

  const { data: row, error } = await supabase
    .from('share_assets')
    .insert({
      id: assetId,
      user_id: userId,
      entry_id: null,
      score_date: data.date,
      asset_type: 'reel',
      template_id: data.template,
      bucket_id: STORAGE_BUCKETS.shareAssets,
      storage_path: storagePath,
      visibility: 'private',
      status: 'pending_upload',
      metadata: {
        reel_type: data.type,
        reel_v1: true,
        export_kind: 'cover_image',
        slide_count: data.slides.length,
        total_points: data.totalPoints,
        completed_pillars: data.daySummary.completedPillars,
        deep_link: data.deepLink,
        invite_code_placeholder: data.inviteCode ?? 'INVITE-CODE',
        todo_true_video: {
          renderer: 'cloud_ffmpeg_or_media_service',
          output: 'mp4',
          inputs: ['captured_slide_sequence', 'timings', 'music_template'],
        },
        pro_placeholders: ['weekly_reels', 'premium_templates', 'remove_watermark', 'music_templates'],
      },
    })
    .select('id, storage_path')
    .single();

  if (error) throw error;
  return row as { id: string; storage_path: string };
}

export async function uploadReelAssetToSupabase(uri: string, data: ReelData) {
  const row = await createShareAssetRowForReel(data);
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
    track('reel_failed', { reason: uploadError.message, date: data.date });
    throw uploadError;
  }

  const { error: updateError } = await supabase
    .from('share_assets')
    .update({ status: 'ready', updated_at: new Date().toISOString() })
    .eq('id', row.id);

  if (updateError) throw updateError;

  return {
    assetId: row.id,
    storagePath: row.storage_path,
  };
}

export async function exportReel({
  slideRefs,
  data,
  upload = true,
  share = true,
}: {
  slideRefs: Array<RefObject<unknown>>;
  data: ReelData;
  upload?: boolean;
  share?: boolean;
}): Promise<ReelExportResult> {
  try {
    const capturedUris = await captureAllSlides(slideRefs);
    if (capturedUris.length === 0) {
      throw new Error('No reel slides were ready to export.');
    }

    const slideUris = await saveSlideSequenceLocally(capturedUris);
    const coverUri = slideUris[0];
    const uploaded = upload ? await uploadReelAssetToSupabase(coverUri, data) : null;
    const shared = share ? await openNativeShareSheetForReel(coverUri) : false;

    return {
      status: 'ready',
      uri: coverUri,
      slideUris,
      storagePath: uploaded?.storagePath,
      assetId: uploaded?.assetId,
      shared,
      uploaded: Boolean(uploaded),
      exportKind: 'cover_image',
    };
  } catch (error) {
    track('reel_failed', {
      date: data.date,
      message: error instanceof Error ? error.message : 'unknown',
    });
    return {
      status: 'failed',
      error: error instanceof Error ? error.message : 'The reel could not be exported.',
      exportKind: 'cover_image',
    };
  }
}
