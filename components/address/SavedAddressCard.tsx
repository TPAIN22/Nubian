/**
 * A saved address, as a card.
 *
 * Shared by the profile address list and checkout, so an address looks the same
 * everywhere. `selectable` switches it between a management card (edit/delete/
 * set-default actions) and a checkout card (a radio row).
 *
 * Legacy addresses with no pin get an explicit "add map location" nudge rather
 * than being quietly rendered as second-class — they still work for delivery,
 * they're just less precise, and the shopper is the only one who can fix that.
 */
import { memo, useMemo } from 'react';
import { I18nManager, Pressable, StyleSheet, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Text } from '@/components/ui/text';
import i18n from '@/utils/i18n';
import { radius, spacing, typography } from '@/theme/tokens';
import { useCheckoutTheme } from '@/components/checkout';
import { MapPreview } from '@/components/map';
import {
  formatAddressLine,
  formatDeliveryDetails,
  labelIcon,
  labelText,
  needsLocationPin,
  shouldConfirmLocation,
} from '@/utils/addressDisplay';
import type { Address } from '@/store/addressStore';

interface Props {
  address: Address;
  /** Renders as a selectable radio row (checkout) instead of a management card. */
  selectable?: boolean;
  selected?: boolean;
  /** Hide the map thumbnail — used in dense lists. */
  showMap?: boolean;
  onPress?: (address: Address) => void;
  onEdit?: (address: Address) => void;
  onDelete?: (address: Address) => void;
  onSetDefault?: (address: Address) => void;
}

export const SavedAddressCard = memo(function SavedAddressCard({
  address,
  selectable = false,
  selected = false,
  showMap = true,
  onPress,
  onEdit,
  onDelete,
  onSetDefault,
}: Props) {
  const t = useCheckoutTheme();
  const writingDirection: 'ltr' | 'rtl' = i18n.language === 'ar' ? 'rtl' : 'ltr';

  const addressLine = useMemo(() => formatAddressLine(address), [address]);
  const detailsLine = useMemo(() => formatDeliveryDetails(address), [address]);
  const missingPin = needsLocationPin(address);
  // An unconfirmed pin (migrated / geocoded) gets the same nudge as no pin —
  // it has coordinates, but nobody has ever checked them.
  const needsConfirm = shouldConfirmLocation(address);

  const title = address.name?.trim() || labelText(address.addressLabel) || i18n.t('shippingAddress') || 'Address';

  const body = (
    <>
      {showMap ? (
        <MapPreview
          latitude={address.latitude}
          longitude={address.longitude}
          height={104}
          topRoundedOnly
        />
      ) : null}

      <View style={styles.content}>
        <View style={styles.headerRow}>
          <View style={[styles.labelBadge, { backgroundColor: t.accentSoft }]}>
            <Ionicons name={labelIcon(address.addressLabel)} size={13} color={t.accent} />
            <Text style={[styles.labelBadgeText, { color: t.accent }]} numberOfLines={1}>
              {labelText(address.addressLabel) || i18n.t('address_labelOther') || 'Other'}
            </Text>
          </View>

          {address.isDefault ? (
            <View style={[styles.defaultBadge, { backgroundColor: t.successSoft }]}>
              <Ionicons name="checkmark-circle" size={12} color={t.success} />
              <Text style={[styles.defaultText, { color: t.success }]}>
                {i18n.t('default') || 'Default'}
              </Text>
            </View>
          ) : null}

          {selectable ? (
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
              {selected ? <Ionicons name="checkmark" size={12} color={t.textInverse} /> : null}
            </View>
          ) : null}
        </View>

        <Text
          style={[styles.title, { color: t.textPrimary, writingDirection }]}
          numberOfLines={1}
        >
          {title}
        </Text>

        {addressLine ? (
          <Text
            style={[styles.line, { color: t.textSecondary, writingDirection }]}
            numberOfLines={2}
          >
            {addressLine}
          </Text>
        ) : null}

        {detailsLine ? (
          <Text
            style={[styles.line, { color: t.textTertiary, writingDirection }]}
            numberOfLines={1}
          >
            {detailsLine}
          </Text>
        ) : null}

        {address.phone ? (
          <View
            style={[
              styles.phoneRow,
              { flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row' },
            ]}
          >
            <Ionicons name="call-outline" size={13} color={t.textTertiary} />
            <Text style={[styles.phoneText, { color: t.textTertiary }]} numberOfLines={1}>
              {address.phone}
            </Text>
          </View>
        ) : null}

        {needsConfirm ? (
          <View style={[styles.nudge, { backgroundColor: t.warningSoft }]}>
            <Ionicons name="map-outline" size={13} color={t.warning} />
            <Text style={[styles.nudgeText, { color: t.textSecondary }]} numberOfLines={2}>
              {missingPin
                ? i18n.t('address_addPinNudge') ||
                  'Add a map location so couriers can find you faster'
                : i18n.t('address_confirmPinNudge') ||
                  'Tap edit to confirm this location on the map'}
            </Text>
          </View>
        ) : null}
      </View>

      {!selectable && (onEdit || onDelete || onSetDefault) ? (
        <View style={[styles.actions, { borderTopColor: t.divider }]}>
          {onEdit ? (
            <Pressable
              onPress={() => onEdit(address)}
              accessibilityRole="button"
              accessibilityLabel={i18n.t('edit') || 'Edit'}
              android_ripple={{ color: t.surfaceMuted }}
              style={styles.action}
            >
              <Ionicons name="create-outline" size={16} color={t.accent} />
              <Text style={[styles.actionText, { color: t.accent }]}>
                {i18n.t('edit') || 'Edit'}
              </Text>
            </Pressable>
          ) : null}

          {onSetDefault && !address.isDefault ? (
            <Pressable
              onPress={() => onSetDefault(address)}
              accessibilityRole="button"
              accessibilityLabel={i18n.t('setAsDefault') || 'Set as default'}
              android_ripple={{ color: t.surfaceMuted }}
              style={styles.action}
            >
              <Ionicons name="star-outline" size={16} color={t.textSecondary} />
              <Text style={[styles.actionText, { color: t.textSecondary }]} numberOfLines={1}>
                {i18n.t('setAsDefault') || 'Set default'}
              </Text>
            </Pressable>
          ) : null}

          {onDelete ? (
            <Pressable
              onPress={() => onDelete(address)}
              accessibilityRole="button"
              accessibilityLabel={i18n.t('delete') || 'Delete'}
              android_ripple={{ color: t.errorSoft }}
              style={styles.action}
            >
              <Ionicons name="trash-outline" size={16} color={t.error} />
              <Text style={[styles.actionText, { color: t.error }]}>
                {i18n.t('delete') || 'Delete'}
              </Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}
    </>
  );

  const cardStyle = [
    styles.card,
    {
      backgroundColor: t.card,
      borderColor: selected ? t.accent : t.border,
      borderWidth: selected ? 1.5 : StyleSheet.hairlineWidth,
      shadowColor: t.isDark ? '#000' : '#0f172a',
    },
  ];

  if (!onPress) {
    return <View style={cardStyle}>{body}</View>;
  }

  return (
    // Static style only — NativeWind drops the function form of Pressable's
    // `style`, which would leave the whole card unstyled.
    <Pressable
      onPress={() => onPress(address)}
      accessibilityRole={selectable ? 'radio' : 'button'}
      accessibilityState={selectable ? { selected, checked: selected } : undefined}
      accessibilityLabel={[title, addressLine, address.phone].filter(Boolean).join(', ')}
      style={cardStyle}
    >
      {body}
    </Pressable>
  );
});

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.card,
    overflow: 'hidden',
    marginBottom: spacing.md,
    shadowOpacity: 0.07,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  content: { paddingHorizontal: spacing.base, paddingTop: spacing.md, paddingBottom: spacing.md },

  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  labelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  labelBadgeText: { ...typography.label },
  defaultBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  defaultText: { ...typography.label },
  radio: {
    marginLeft: 'auto',
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },

  title: { ...typography.subtitle, marginBottom: 2 },
  line: { ...typography.caption, marginTop: 2 },

  phoneRow: { alignItems: 'center', gap: 6, marginTop: spacing.sm },
  phoneText: { ...typography.caption },

  nudge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: spacing.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: 7,
    borderRadius: radius.input,
  },
  nudgeText: { ...typography.caption, flex: 1 },

  actions: {
    flexDirection: 'row',
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  action: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    minHeight: 46,
    paddingHorizontal: spacing.sm,
  },
  actionText: { ...typography.captionStrong },
});

export default SavedAddressCard;
