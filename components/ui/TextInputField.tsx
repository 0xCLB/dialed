import { StyleSheet, TextInput, TextInputProps, View } from 'react-native';

import { Text } from '@/components/ui/Text';
import { theme } from '@/components/ui/theme';

type TextInputFieldProps = TextInputProps & {
  label: string;
  helper?: string;
};

export function TextInputField({ label, helper, style, ...props }: TextInputFieldProps) {
  return (
    <View style={styles.wrap}>
      <Text variant="caption" muted>
        {label}
      </Text>
      <TextInput
        {...props}
        placeholderTextColor={theme.colors.faint}
        style={[styles.input, style]}
        selectionColor={theme.colors.accent}
      />
      {helper ? (
        <Text variant="caption" muted>
          {helper}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 8,
  },
  input: {
    minHeight: 52,
    borderRadius: theme.radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    color: theme.colors.ink,
    paddingHorizontal: 14,
    fontSize: 16,
    fontWeight: '600',
  },
});
