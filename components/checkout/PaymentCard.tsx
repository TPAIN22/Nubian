import React from 'react';
import { StyleSheet, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Text } from '@/components/ui/text';
import { useCheckoutTheme } from './theme';
import { radius, spacing, typography } from './tokens';
import { PressableScale } from './PressableScale';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

type Props = {
  title: string;
  description?: string;
  icon: IoniconName;
  selected: boolean;
  disabled?: boolean;
  onSelect: () => void;
  trailing?: React.ReactNode;
  expanded?: React.ReactNode;
};

export const PaymentCard = React.memo(function PaymentCard({
  title,
  description,
  icon,
  selected,
  disabled,
  onSelect,
  trailing,
  expanded,
}: Props) {
  const t = useCheckoutTheme();

  return (
    <PressableScale
      onPress={onSelect}
      disabled={disabled}
      accessibilityRole="radio"
      accessibilityState={{ checked: selected, disabled }}
      accessibilityLabel={title}
      style={[
        styles.card,
        {
          backgroundColor: t.card,
          borderColor: selected ? t.accent : t.border,
          borderWidth: selected ? 1.5 : StyleSheet.hairlineWidth,
          opacity: disabled ? 0.55 : 1,
        },
      ]}
    >
      <View style={styles.row}>
        <View
          style={[
            styles.iconWrap,
            {
              backgroundColor: selected ? t.accentSoft : t.surfaceMuted,
              borderColor: selected ? t.accent : t.border,
            },
          ]}
        >
          <Ionicons
            name={icon}
            size={20}
            color={selected ? t.accent : t.textSecondary}
          />
        </View>

        <View style={styles.content}>
          <Text
            style={[styles.title, { color: t.textPrimary }]}
            numberOfLines={1}
          >
            {title}
          </Text>
          {description ? (
            <Text
              style={[styles.desc, { color: t.textTertiary }]}
              numberOfLines={2}
            >
              {description}
            </Text>
          ) : null}
        </View>

        {trailing ? (
          <View style={styles.trailing}>{trailing}</View>
        ) : (
          <View
            style={[
              styles.radio,
              {
                borderColor: selected ? t.accent : t.borderStrong,
                backgroundColor: selected ? t.accent : 'transparent',
              },
            ]}
          >
            {selected ? (
              <Ionicons name="checkmark" size={12} color={t.textInverse} />
            ) : null}
          </View>
        )}
      </View>

      {selected && expanded ? (
        <View
          style={[
            styles.expanded,
            { borderTopColor: t.divider },
          ]}
        >
          {expanded}
        </View>
      ) : null}
    </PressableScale>
  );
});

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.card,
    marginBottom: spacing.md,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.base,
    gap: spacing.md,
    minHeight: 64,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: { flex: 1 },
  title: { ...typography.bodyStrong },
  desc: { ...typography.caption, marginTop: 2 },
  trailing: { marginLeft: spacing.sm },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  expanded: {
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
});
