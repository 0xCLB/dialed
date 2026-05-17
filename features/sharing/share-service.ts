import * as Sharing from 'expo-sharing';
import * as MediaLibrary from 'expo-media-library';
import { captureRef } from 'react-native-view-shot';
import type { RefObject } from 'react';

import { STORAGE_BUCKETS } from '@/lib/constants';
import { supabase } from '@/lib/supabase';
import type { ShareTemplate } from '@/types/domain';

export async function captureShareCard(ref: RefObject<unknown>) {
  const uri = await captureRef(ref, {
    format: 'png',
    quality: 1,
    result: 'tmpfile',
  });

  return uri;
}

export async function shareUri(uri: string) {
  const available = await Sharing.isAvailableAsync();
  if (!available) {
    await MediaLibrary.saveToLibraryAsync(uri);
    return;
  }

  await Sharing.shareAsync(uri, {
    mimeType: 'image/png',
    dialogTitle: 'Share your Dialed proof',
    UTI: 'public.png',
  });
}

export async function uploadShareAsset(userId: string, uri: string, template: ShareTemplate) {
  const response = await fetch(uri);
  const blob = await response.blob();
  const path = `${userId}/${template}-${Date.now()}.png`;
  const { error } = await supabase.storage.from(STORAGE_BUCKETS.shareAssets).upload(path, blob, {
    contentType: 'image/png',
    upsert: false,
  });

  if (error) {
    throw error;
  }

  await supabase.from('share_assets').insert({
    user_id: userId,
    template,
    storage_path: path,
  });

  return path;
}
