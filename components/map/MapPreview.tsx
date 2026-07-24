/**
 * A small, non-interactive map thumbnail for address cards.
 *
 * Uses the same adapter as the full picker, so a provider swap updates previews
 * and the picker together. Addresses with no pin (legacy rows) render a
 * labelled placeholder rather than an empty grey box — the card still has to
 * communicate *why* there's no map.
 */
import { memo } from 'react';
import { StyleSheet, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Text } from '@/components/ui/text';
import i18n from '@/utils/i18n';
import { radius } from '@/theme/tokens';
import { useCheckoutTheme } from '@/components/checkout';
import { useGeoConfig } from '@/hooks/useGeoConfig';
import { isValidCoordinate } from '@/services/geo/types';
import { MapCanvas } from './MapCanvas';
import { toMapSource } from './types';

interface Props {
  latitude?: number | null;
  longitude?: number | null;
  height?: number;
  zoom?: number;
  /** Rounds only the top corners when the preview caps a card. */
  topRoundedOnly?: boolean;
}

export const MapPreview = memo(function MapPreview({
  latitude,
  longitude,
  height = 110,
  zoom = 16,
  topRoundedOnly = false,
}: Props) {
  const t = useCheckoutTheme();
  const { config } = useGeoConfig();

  const cornerStyle = topRoundedOnly
    ? { borderTopLeftRadius: radius.card, borderTopRightRadius: radius.card }
    : { borderRadius: radius.card };

  const hasPin = isValidCoordinate(latitude ?? null, longitude ?? null);

  if (!hasPin) {
    return (
      <View
        style={[
          styles.placeholder,
          cornerStyle,
          { height, backgroundColor: t.surfaceMuted, borderColor: t.border },
        ]}
      >
        <Ionicons name="map-outline" size={18} color={t.textTertiary} />
        <Text style={[styles.placeholderText, { color: t.textTertiary }]} numberOfLines={1}>
          {i18n.t('address_noPinYet') || 'No map location yet'}
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, cornerStyle, { height, backgroundColor: t.surfaceMuted }]}>
      <MapCanvas
        initialCenter={{ lat: latitude as number, lng: longitude as number }}
        initialZoom={zoom}
        source={toMapSource(config)}
        isDark={t.isDark}
        interactive={false}
        // A thumbnail is too small to carry legible attribution; the full
        // picker shows it, which is where the licence obligation is met.
        hideAttribution
      />

      {/* Static centre marker — the preview never moves, so no animation. */}
      <View style={styles.pin} pointerEvents="none">
        <Ionicons name="location" size={26} color={t.accent} />
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: { overflow: 'hidden', width: '100%' },
  placeholder: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
    borderWidth: StyleSheet.hairlineWidth,
  },
  placeholderText: { fontSize: 12, fontWeight: '500' },
  pin: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 13,
  },
});

export default MapPreview;
