import { Share2 } from 'lucide-react-native';

import { Button } from '@/components/ui/Button';
import { theme } from '@/components/ui/theme';
import type { ReelExportStatus } from '@/features/reels/types';

export function ReelExportButton({
  status,
  onPress,
}: {
  status: ReelExportStatus;
  onPress: () => void;
}) {
  return (
    <Button loading={status === 'rendering'} onPress={onPress}>
      <Share2 size={18} color={theme.colors.white} />
      {status === 'ready' ? 'Share again' : 'Share reel'}
    </Button>
  );
}
