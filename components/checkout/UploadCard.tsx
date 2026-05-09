import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Text } from '@/components/ui/text';
import i18n from '@/utils/i18n';
import { useCheckoutTheme } from './theme';
import { radius, spacing, typography } from './tokens';

type Props = {
  imageUri: string | null;
  uploading: boolean;
  uploaded: boolean;
  onPick: () => void;
  onRemove: () => void;
  helperText?: string;
};

export const UploadCard = React.memo(function UploadCard({
  imageUri,
  uploading,
  uploaded,
  onPick,
  onRemove,
  helperText,
}: Props) {
  const t = useCheckoutTheme();

  if (!imageUri) {
    return (
      <Pressable
        onPress={onPick}
        accessibilityRole="button"
        accessibilityLabel={i18n.t('selectImage') || 'Upload receipt'}
        style={[
          styles.dropzone,
          {
            borderColor: t.borderStrong,
            backgroundColor: t.surfaceMuted,
          },
        ]}
      >
        <View
          style={[styles.iconWrap, { backgroundColor: t.accentSoft }]}
        >
          <Ionicons name="cloud-upload-outline" size={22} color={t.accent} />
        </View>
        <Text style={[styles.title, { color: t.textPrimary }]}>
          {i18n.t('uploadReceiptTitle') || 'Upload transfer receipt'}
        </Text>
        <Text style={[styles.helper, { color: t.textTertiary }]}>
          {helperText ||
            i18n.t('uploadReceiptHelper') ||
            'PNG or JPG up to 10MB. Required to confirm bank transfer.'}
        </Text>
      </Pressable>
    );
  }

  return (
    <View
      style={[
        styles.previewWrap,
        { borderColor: t.border, backgroundColor: t.card },
      ]}
    >
      <Image
        source={{ uri: imageUri }}
        style={styles.preview}
        contentFit="cover"
        transition={200}
      />
      {uploading ? (
        <View style={[styles.overlay, { backgroundColor: t.overlay }]}>
          <ActivityIndicator size="small" color={t.textInverse} />
          <Text style={[styles.overlayText, { color: t.textInverse }]}>
            {i18n.t('uploadingTransferImage') || 'Uploading…'}
          </Text>
        </View>
      ) : null}

      {!uploading && uploaded ? (
        <View
          style={[
            styles.statusPill,
            { backgroundColor: t.successSoft },
          ]}
          accessibilityElementsHidden
        >
          <Ionicons name="checkmark-circle" size={14} color={t.success} />
          <Text style={[styles.statusText, { color: t.success }]}>
            {i18n.t('uploaded') || 'Uploaded'}
          </Text>
        </View>
      ) : null}

      <View style={styles.actions}>
        <Pressable
          onPress={onPick}
          disabled={uploading}
          accessibilityRole="button"
          accessibilityLabel={i18n.t('changeImage') || 'Replace image'}
          style={[
            styles.actionBtn,
            {
              backgroundColor: t.card,
              borderColor: t.border,
            },
          ]}
        >
          <Ionicons name="refresh" size={14} color={t.textSecondary} />
          <Text style={[styles.actionText, { color: t.textSecondary }]}>
            {i18n.t('replace') || 'Replace'}
          </Text>
        </Pressable>
        <Pressable
          onPress={onRemove}
          disabled={uploading}
          accessibilityRole="button"
          accessibilityLabel={i18n.t('removeImage') || 'Remove image'}
          style={[
            styles.actionBtn,
            {
              backgroundColor: t.card,
              borderColor: t.border,
            },
          ]}
        >
          <Ionicons name="trash-outline" size={14} color={t.error} />
          <Text style={[styles.actionText, { color: t.error }]}>
            {i18n.t('remove') || 'Remove'}
          </Text>
        </Pressable>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  dropzone: {
    borderRadius: radius.card,
    borderWidth: 1.2,
    borderStyle: 'dashed',
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.base,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  title: { ...typography.bodyStrong, textAlign: 'center' },
  helper: { ...typography.caption, textAlign: 'center', maxWidth: 280 },

  previewWrap: {
    borderRadius: radius.card,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  preview: {
    width: '100%',
    height: 200,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs + 2,
  },
  overlayText: { ...typography.caption },
  statusPill: {
    position: 'absolute',
    top: spacing.sm,
    left: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 999,
  },
  statusText: { ...typography.label },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.sm,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: spacing.sm + 2,
    borderRadius: radius.button - 2,
    borderWidth: StyleSheet.hairlineWidth,
    minHeight: 40,
  },
  actionText: { ...typography.captionStrong },
});
