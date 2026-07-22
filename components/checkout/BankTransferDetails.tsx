import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from '@/components/ui/text';
import i18n from '@/utils/i18n';
import { useCheckoutTheme } from './theme';
import { radius, spacing, typography } from './tokens';
import { UploadCard } from './UploadCard';

type BankConfig = {
  accountName: string;
  accountNumber: string;
  bankName: string;
};

type Props = {
  config: BankConfig;
  imageUri: string | null;
  uploading: boolean;
  uploaded: boolean;
  onPick: () => void;
  onRemove: () => void;
};

function BankRow({ label, value }: { label: string; value: string }) {
  const t = useCheckoutTheme();
  return (
    <View style={styles.bankRow}>
      <Text style={[styles.bankLabel, { color: t.textTertiary }]}>{label}</Text>
      <Text
        style={[styles.bankValue, { color: t.textPrimary }]}
        numberOfLines={1}
      >
        {value}
      </Text>
    </View>
  );
}

/**
 * The Bankak (bank transfer) expanded panel: the destination account details
 * plus the receipt uploader. Rendered inside the payment card's `expanded`
 * slot. Purely presentational — the upload flow and its state are owned by the
 * checkout orchestrator and passed in.
 */
export const BankTransferDetails = React.memo(function BankTransferDetails({
  config,
  imageUri,
  uploading,
  uploaded,
  onPick,
  onRemove,
}: Props) {
  const t = useCheckoutTheme();

  return (
    <View style={{ gap: spacing.md }}>
      <View
        style={[
          styles.bankBox,
          { backgroundColor: t.surfaceMuted, borderColor: t.border },
        ]}
      >
        <BankRow
          label={i18n.t('accountName') || 'Account name'}
          value={config.accountName}
        />
        <BankRow
          label={i18n.t('accountNumber') || 'Account number'}
          value={config.accountNumber}
        />
        <BankRow label={i18n.t('bankName') || 'Bank'} value={config.bankName} />
      </View>
      <UploadCard
        imageUri={imageUri}
        uploading={uploading}
        uploaded={uploaded}
        onPick={onPick}
        onRemove={onRemove}
      />
    </View>
  );
});

const styles = StyleSheet.create({
  bankBox: {
    borderRadius: radius.input,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    gap: spacing.xs + 2,
  },
  bankRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: 4,
  },
  bankLabel: { ...typography.caption },
  bankValue: { ...typography.captionStrong, flexShrink: 1, textAlign: 'right' },
});
