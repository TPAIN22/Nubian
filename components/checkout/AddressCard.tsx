import React, { useMemo } from 'react';
import { I18nManager, StyleSheet, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Text } from '@/components/ui/text';
import i18n from '@/utils/i18n';
import { useCheckoutTheme } from './theme';
import { radius, spacing, typography } from './tokens';
import { PressableScale } from './PressableScale';

export type AddressShape = {
  _id: string;
  name?: string;
  countryName?: string;
  cityName?: string;
  subCityName?: string;
  city?: string;
  area?: string;
  street?: string;
  building?: string;
  phone?: string;
  notes?: string;
  isDefault?: boolean;
};

type Props = {
  address: AddressShape;
  selected: boolean;
  onSelect: (id: string) => void;
  onEdit?: (address: AddressShape) => void;
};

export const AddressCard = React.memo(function AddressCard({
  address,
  selected,
  onSelect,
}: Props) {
  const t = useCheckoutTheme();
  const writingDirection: 'ltr' | 'rtl' =
    i18n.language === 'ar' ? 'rtl' : 'ltr';

  const cityLine = useMemo(
    () =>
      [address.subCityName || address.area, address.cityName || address.city]
        .filter(Boolean)
        .join(' · '),
    [address],
  );

  const streetLine = useMemo(
    () => [address.street, address.building].filter(Boolean).join(', '),
    [address.street, address.building],
  );

  return (
    <PressableScale
      onPress={() => onSelect(String(address._id))}
      accessibilityRole="radio"
      accessibilityState={{ selected, checked: selected }}
      accessibilityLabel={`${address.name || ''}, ${cityLine}, ${address.phone || ''}`}
      style={[
        styles.card,
        {
          backgroundColor: t.card,
          borderColor: selected ? t.accent : t.border,
          borderWidth: selected ? 1.5 : StyleSheet.hairlineWidth,
        },
      ]}
    >
      <View style={styles.headerRow}>
        <View style={styles.titleRow}>
          <View
            style={[
              styles.nickIconWrap,
              { backgroundColor: t.accentSoft },
            ]}
          >
            <Ionicons name="location-outline" size={14} color={t.accent} />
          </View>
          {address.name ? (
            <Text
              style={[styles.name, { color: t.textPrimary, writingDirection }]}
              numberOfLines={1}
            >
              {address.name}
            </Text>
          ) : (
            <Text
              style={[styles.name, { color: t.textPrimary }]}
              numberOfLines={1}
            >
              {i18n.t('shippingAddress') || 'Shipping address'}
            </Text>
          )}
          {address.isDefault ? (
            <View
              style={[
                styles.defaultBadge,
                { borderColor: t.border },
              ]}
            >
              <Text
                style={[styles.defaultText, { color: t.textSecondary }]}
              >
                {i18n.t('default') || 'Default'}
              </Text>
            </View>
          ) : null}
        </View>

        <View
          style={[
            styles.radio,
            {
              borderColor: selected ? t.accent : t.borderStrong,
              backgroundColor: selected ? t.accent : 'transparent',
            },
          ]}
          accessibilityElementsHidden
        >
          {selected ? (
            <Ionicons name="checkmark" size={12} color={t.textInverse} />
          ) : null}
        </View>
      </View>

      {cityLine ? (
        <Text
          style={[styles.line, { color: t.textSecondary, writingDirection }]}
          numberOfLines={1}
        >
          {cityLine}
        </Text>
      ) : null}

      {streetLine ? (
        <Text
          style={[styles.line, { color: t.textSecondary, writingDirection }]}
          numberOfLines={2}
        >
          {streetLine}
        </Text>
      ) : null}

      {address.phone ? (
        <View
          style={[
            styles.phoneRow,
            {
              flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row',
            },
          ]}
        >
          <Ionicons
            name="call-outline"
            size={13}
            color={t.textTertiary}
          />
          <Text
            style={[styles.phoneText, { color: t.textTertiary }]}
            numberOfLines={1}
          >
            {address.phone}
          </Text>
        </View>
      ) : null}
    </PressableScale>
  );
});

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.card,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.base,
    marginBottom: spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flexShrink: 1,
    flex: 1,
  },
  nickIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  defaultBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
  },
  defaultText: { ...typography.label, letterSpacing: 0.3 },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: { ...typography.bodyStrong, flexShrink: 1 },
  line: { ...typography.caption, marginTop: 2 },
  phoneRow: {
    alignItems: 'center',
    gap: spacing.xs + 2,
    marginTop: spacing.sm,
  },
  phoneText: { ...typography.caption },
});
