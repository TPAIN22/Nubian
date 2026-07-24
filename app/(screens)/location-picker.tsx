/**
 * Map-first address picker.
 *
 * The whole add/edit flow lives here:
 *   open map → permission → centre on the device → pan under a fixed pin
 *   (or search) → confirm → fill in details → save.
 *
 * There is no city / sub-city / neighbourhood dropdown anywhere in this flow.
 *
 * Route params:
 *   addressId — edit an existing address; omit to create a new one.
 *
 * Saves through the address store and pops back, so callers (profile, checkout)
 * just navigate here and read the store afterwards.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  StyleSheet,
  View,
  // eslint-disable-next-line no-restricted-imports
  Text as RNText,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import * as Haptics from 'expo-haptics';
import { Text } from '@/components/ui/text';
import i18n from '@/utils/i18n';
import { radius, spacing, typography } from '@/theme/tokens';
import { useCheckoutTheme } from '@/components/checkout';
import { MapCanvas, CenterPin, toMapSource, type MapCanvasHandle } from '@/components/map';
import { trace, traceError } from '@/components/map/trace';
import AddressSearchBar from '@/components/address/AddressSearchBar';
import AddressDetailsSheet, {
  EMPTY_DETAILS,
  type AddressDetailsValue,
} from '@/components/address/AddressDetailsSheet';
import { useGeoConfig } from '@/hooks/useGeoConfig';
import { useDeviceLocation } from '@/hooks/useDeviceLocation';
import { useReverseGeocode } from '@/hooks/useReverseGeocode';
import useAddressStore, { type AddressDraft } from '@/store/addressStore';
import { formatCoordinates } from '@/utils/addressDisplay';
import type { GeoAddress, GeoPoint, LocationSource } from '@/services/geo/types';

export default function LocationPickerScreen() {
  const t = useCheckoutTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { addressId } = useLocalSearchParams<{ addressId?: string }>();

  const { config, isLoading: isConfigLoading } = useGeoConfig();
  const mapRef = useRef<MapCanvasHandle>(null);

  // Renderer-neutral basemap descriptor. The screen never touches tile or
  // style URLs — that stays inside the map layer.
  const mapSource = useMemo(() => toMapSource(config), [config]);

  const { addresses, addAddress, updateAddress, isSaving, error, clearError } = useAddressStore();
  const existing = useMemo(
    () => (addressId ? addresses.find((a) => a._id === addressId) : undefined),
    [addressId, addresses],
  );
  const isEditing = Boolean(existing);

  const device = useDeviceLocation();

  const [center, setCenter] = useState<GeoPoint | null>(null);
  const [isMoving, setIsMoving] = useState(false);
  const [isMapReady, setIsMapReady] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  /**
   * How the current pin was obtained. Persisted so delivery features can later
   * weigh a confirmed GPS fix differently from a coarse text geocode.
   */
  const [locationSource, setLocationSource] = useState<LocationSource>('map_pin');

  const {
    address: resolvedAddress,
    isResolving,
    resolve,
    setResolved,
    markStale,
  } = useReverseGeocode({
    debounceMs: config.reverseGeocodeDebounceMs,
    enabled: config.capabilities.reverseGeocode,
  });

  /* ── Initial centre ──────────────────────────────────────────────────────
   * Editing an existing pin wins; otherwise try the device; otherwise the
   * server-configured default. Resolved once — later changes must not yank the
   * map out from under the user. */
  const initialCenterRef = useRef<GeoPoint | null>(null);

  useEffect(() => {
    if (initialCenterRef.current || isConfigLoading) return;

    const bootstrap = async () => {
      trace('picker', 'bootstrap start', {
        mode: existing ? 'edit' : 'create',
        provider: config.provider,
        basemap: config.basemap,
        defaultCenter: config.defaultCenter,
      });

      if (existing && typeof existing.latitude === 'number' && typeof existing.longitude === 'number') {
        const point = { lat: existing.latitude, lng: existing.longitude };
        initialCenterRef.current = point;
        setCenter(point);
        setLocationSource(existing.locationSource ?? 'map_pin');
        // Seed the label from what's already stored so the confirm bar isn't
        // blank while the first reverse-geocode is in flight.
        if (existing.formattedAddress) {
          setResolved({
            lat: point.lat,
            lng: point.lng,
            formattedAddress: existing.formattedAddress,
            countryCode: existing.countryCode ?? '',
            country: existing.country ?? '',
            administrativeArea: existing.administrativeArea ?? '',
            subAdministrativeArea: '',
            city: existing.city ?? '',
            neighborhood: existing.neighborhood ?? '',
            street: existing.street ?? '',
            streetNumber: '',
            postalCode: existing.postalCode ?? '',
            placeId: existing.placeId ?? '',
            plusCode: existing.plusCode ?? '',
            provider: existing.geoProvider ?? '',
            accuracy: 'unknown',
          });
        }
        return;
      }

      // New address: try for a real fix, but never block on it.
      const fix = await device.request();
      const point = fix ?? config.defaultCenter;

      trace('picker', fix ? 'centred on device fix' : 'centred on configured default', {
        point,
        gpsStatus: device.status,
      });

      initialCenterRef.current = point;
      setCenter(point);
      setLocationSource(fix ? 'gps' : 'map_pin');
      if (fix) resolve(fix);
    };

    bootstrap();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isConfigLoading, existing]);

  useEffect(() => device.dispose, [device.dispose]);

  /* ── Map events ─────────────────────────────────────────────────────────── */

  /**
   * The map fires the same move events whether the user dragged it or we
   * recentred it in code. Without this flag, recentring on a GPS fix or a
   * search result would immediately be re-labelled `map_pin`, losing the fact
   * that the pin came from a trusted source.
   */
  const programmaticMoveRef = useRef(false);

  const moveMapTo = useCallback((point: GeoPoint, source: LocationSource) => {
    programmaticMoveRef.current = true;
    setCenter(point);
    setLocationSource(source);
    mapRef.current?.setCenter(point, { zoom: 17, animate: true });
  }, []);

  const handleRegionChangeStart = useCallback(() => {
    setIsMoving(true);
    markStale();
  }, [markStale]);

  const handleRegionChangeEnd = useCallback(
    (next: GeoPoint) => {
      setIsMoving(false);
      setCenter(next);

      if (programmaticMoveRef.current) {
        // Our own recentre settling. Keep the source we set, and skip the
        // lookup — the caller already resolved (or is resolving) this point.
        programmaticMoveRef.current = false;
        return;
      }

      // A real drag: the user is choosing this point by hand.
      setLocationSource('map_pin');
      resolve(next);
    },
    [resolve],
  );

  /* ── Actions ────────────────────────────────────────────────────────────── */

  const recenterOnDevice = useCallback(async () => {
    Haptics.selectionAsync().catch(() => {});
    const fix = await device.request({ promptIfBlocked: true });
    if (!fix) return;

    moveMapTo(fix, 'gps');
    resolve(fix);
  }, [device, moveMapTo, resolve]);

  const handleSearchSelect = useCallback(
    (address: GeoAddress) => {
      moveMapTo({ lat: address.lat, lng: address.lng }, 'search');
      // The search result is already a resolved address — reusing it avoids a
      // redundant reverse-geocode that would only produce a vaguer answer.
      setResolved(address);
    },
    [moveMapTo, setResolved],
  );

  const initialDetails: AddressDetailsValue = useMemo(() => {
    if (!existing) return EMPTY_DETAILS;
    return {
      name: existing.name ?? '',
      phone: existing.phone ?? '',
      whatsapp: existing.whatsapp ?? '',
      building: existing.building ?? '',
      floor: existing.floor ?? '',
      apartment: existing.apartment ?? '',
      landmark: existing.landmark ?? '',
      notes: existing.notes ?? '',
      addressLabel: existing.addressLabel ?? 'home',
      isDefault: Boolean(existing.isDefault),
    };
  }, [existing]);

  const handleSave = useCallback(
    async (details: AddressDetailsValue) => {
      if (!center) return;

      const draft: AddressDraft = {
        latitude: center.lat,
        longitude: center.lng,
        // Only send the place id when it belongs to the point being saved —
        // a stale id from an earlier search would make the server label this
        // pin with a different place entirely.
        placeId:
          resolvedAddress &&
          resolvedAddress.lat === center.lat &&
          resolvedAddress.lng === center.lng
            ? resolvedAddress.placeId
            : undefined,
        locationSource,
        // Only report a radius when the platform actually gave us one, and only
        // for a device fix — the server drops it for any other source rather
        // than storing a number that describes nothing.
        locationAccuracyMeters: locationSource === 'gps' ? device.accuracyMeters : null,
        ...details,
      };

      try {
        if (isEditing && existing) {
          const ok = await updateAddress(existing._id, draft);
          if (!ok) return;
        } else {
          await addAddress(draft);
        }

        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
        setDetailsOpen(false);
        router.back();
      } catch {
        // The store already surfaced the message; keep the sheet open so the
        // user doesn't lose what they typed.
      }
    },
    [center, resolvedAddress, locationSource, device.accuracyMeters, isEditing, existing, updateAddress, addAddress, router],
  );

  /* ── Derived UI state ───────────────────────────────────────────────────── */

  const addressLine = resolvedAddress?.formattedAddress ?? '';
  const coordinatesLine = center ? formatCoordinates(center.lat, center.lng) : '';

  const permissionHint = useMemo(() => {
    switch (device.status) {
      case 'blocked':
        return i18n.t('address_locationBlocked') || 'Location is off. Enable it in Settings, or pan the map to your address.';
      case 'denied':
        return i18n.t('address_locationDenied') || 'Location permission denied — pan the map to your address.';
      case 'servicesDisabled':
        return i18n.t('address_locationServicesOff') || 'Location services are off — pan the map to your address.';
      case 'unavailable':
        return i18n.t('address_locationUnavailable') || "Couldn't get a GPS fix — pan the map to your address.";
      default:
        return null;
    }
  }, [device.status]);

  const isBootstrapping = !center || isConfigLoading;

  // The two gates that can leave this screen showing a spinner. Logging the
  // transition means a hang identifies which gate it is stuck behind, instead
  // of just looking like "the map didn't open".
  useEffect(() => {
    trace('picker', 'render gate', {
      isBootstrapping,
      isMapReady,
      waitingOn: isConfigLoading
        ? 'geo config'
        : !center
          ? 'initial centre (GPS or default)'
          : !isMapReady
            ? 'renderer ready callback'
            : 'nothing — map visible',
    });
  }, [isBootstrapping, isMapReady, isConfigLoading, center]);

  return (
    <View style={[styles.container, { backgroundColor: t.surface }]}>
      {/* ── Map ───────────────────────────────────────────────────────────── */}
      <View style={styles.mapLayer}>
        {isBootstrapping ? (
          <View style={[styles.mapPlaceholder, { backgroundColor: t.surfaceMuted }]}>
            <ActivityIndicator size="large" color={t.accent} />
            <Text style={[styles.placeholderText, { color: t.textTertiary }]}>
              {i18n.t('address_locatingYou') || 'Finding your location…'}
            </Text>
          </View>
        ) : (
          <MapCanvas
            ref={mapRef}
            initialCenter={center}
            initialZoom={17}
            source={mapSource}
            isDark={t.isDark}
            onReady={() => {
              trace('picker', 'renderer reported ready — lifting the loading veil');
              setIsMapReady(true);
            }}
            onRegionChangeStart={handleRegionChangeStart}
            onRegionChangeEnd={handleRegionChangeEnd}
            onError={(message) => {
              traceError('picker', 'renderer reported an error', { message });
              setMapError(message);
            }}
            testID="location-picker-map"
          />
        )}

        {!isBootstrapping ? <CenterPin isMoving={isMoving} /> : null}
      </View>

      {/* ── Top chrome ────────────────────────────────────────────────────── */}
      <View style={[styles.topBar, { paddingTop: insets.top + spacing.sm }]}>
        <View style={styles.topRow}>
          <Pressable
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel={i18n.t('back') || 'Back'}
            hitSlop={12}
            style={[styles.circleBtn, { backgroundColor: t.card, borderColor: t.border }]}
          >
            <Ionicons name="arrow-back" size={20} color={t.textPrimary} />
          </Pressable>

          <View style={styles.searchSlot}>
            <AddressSearchBar
              near={center}
              debounceMs={config.searchDebounceMs}
              enabled={config.capabilities.autocomplete}
              onSelect={handleSearchSelect}
            />
          </View>
        </View>

        {permissionHint ? (
          <Pressable
            onPress={device.status === 'blocked' ? device.openSettings : undefined}
            accessibilityRole={device.status === 'blocked' ? 'button' : 'text'}
            accessibilityLabel={permissionHint}
            style={[styles.hint, { backgroundColor: t.warningSoft, borderColor: t.warning }]}
          >
            <Ionicons name="information-circle-outline" size={15} color={t.warning} />
            <Text style={[styles.hintText, { color: t.textSecondary }]} numberOfLines={2}>
              {permissionHint}
            </Text>
          </Pressable>
        ) : null}

        {mapError ? (
          <View style={[styles.hint, { backgroundColor: t.errorSoft, borderColor: t.error }]}>
            <Ionicons name="cloud-offline-outline" size={15} color={t.error} />
            <Text style={[styles.hintText, { color: t.textSecondary }]} numberOfLines={2}>
              {i18n.t('address_mapOffline') ||
                'Map tiles are unavailable. Your pin still saves from its coordinates.'}
            </Text>
          </View>
        ) : null}
      </View>

      {/* ── Locate button ─────────────────────────────────────────────────── */}
      <Pressable
        onPress={recenterOnDevice}
        accessibilityRole="button"
        accessibilityLabel={i18n.t('address_useMyLocation') || 'Use my current location'}
        style={[
          styles.locateBtn,
          {
            backgroundColor: t.card,
            borderColor: t.border,
            bottom: insets.bottom + 210,
          },
        ]}
      >
        {device.isLoading ? (
          <ActivityIndicator size="small" color={t.accent} />
        ) : (
          <Ionicons
            name={device.status === 'granted' ? 'locate' : 'locate-outline'}
            size={21}
            color={device.status === 'granted' ? t.accent : t.textSecondary}
          />
        )}
      </Pressable>

      {/* ── Confirm card ──────────────────────────────────────────────────── */}
      <View
        style={[
          styles.confirmCard,
          {
            backgroundColor: t.surface,
            borderTopColor: t.divider,
            paddingBottom: Math.max(insets.bottom, spacing.base),
            shadowColor: t.isDark ? '#000' : '#0f172a',
          },
        ]}
      >
        <Text style={[styles.confirmEyebrow, { color: t.textTertiary }]}>
          {i18n.t('address_deliveringTo') || 'Delivering to'}
        </Text>

        <View style={styles.confirmRow}>
          <View style={[styles.confirmIcon, { backgroundColor: t.accentSoft }]}>
            <Ionicons name="location" size={18} color={t.accent} />
          </View>

          <View style={styles.confirmText}>
            {isMoving || isResolving ? (
              <>
                <View style={[styles.skeletonLine, { backgroundColor: t.surfaceMuted }]} />
                <View
                  style={[styles.skeletonLine, styles.skeletonShort, { backgroundColor: t.surfaceMuted }]}
                />
              </>
            ) : (
              <>
                <Text
                  style={[styles.confirmTitle, { color: t.textPrimary }]}
                  numberOfLines={2}
                >
                  {addressLine ||
                    i18n.t('address_pinSelected') ||
                    'Pinned location'}
                </Text>
                <Text style={[styles.confirmSub, { color: t.textTertiary }]} numberOfLines={1}>
                  {coordinatesLine}
                </Text>
              </>
            )}
          </View>
        </View>

        <Pressable
          onPress={() => {
            if (!center || isMoving) return;
            Haptics.selectionAsync().catch(() => {});
            clearError();
            setDetailsOpen(true);
          }}
          disabled={!center || isMoving}
          accessibilityRole="button"
          accessibilityState={{ disabled: !center || isMoving }}
          accessibilityLabel={i18n.t('address_confirmLocation') || 'Confirm location'}
          style={styles.confirmPressable}
        >
          {/* Fill on a plain View with a static style — NativeWind drops the
              function form of Pressable's style prop. */}
          <View
            style={[
              styles.confirmBtn,
              { backgroundColor: !center || isMoving ? t.ctaDisabled : t.cta },
            ]}
          >
            <RNText
              style={[
                styles.confirmBtnText,
                { color: !center || isMoving ? t.ctaDisabledText : t.ctaText },
              ]}
            >
              {i18n.t('address_confirmLocation') || 'Confirm location'}
            </RNText>
          </View>
        </Pressable>
      </View>

      {error ? (
        <View
          style={[
            styles.errorToast,
            { backgroundColor: t.errorSoft, borderColor: t.error, bottom: insets.bottom + 200 },
          ]}
        >
          <Text style={[styles.hintText, { color: t.error }]} numberOfLines={2}>
            {error}
          </Text>
        </View>
      ) : null}

      <AddressDetailsSheet
        visible={detailsOpen}
        addressLine={addressLine}
        coordinatesLine={coordinatesLine}
        initialValues={initialDetails}
        isSaving={isSaving}
        isEditing={isEditing}
        onClose={() => setDetailsOpen(false)}
        onChangeLocation={() => setDetailsOpen(false)}
        onSubmit={handleSave}
      />

      {/* Keeps the map mounted but inert until it reports ready, so the pin
          never floats over a blank canvas. */}
      {!isMapReady && !isBootstrapping ? (
        <View style={[styles.readyVeil, { backgroundColor: t.surfaceMuted }]} pointerEvents="none">
          <ActivityIndicator size="small" color={t.accent} />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  mapLayer: { ...StyleSheet.absoluteFillObject },
  mapPlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md },
  placeholderText: { ...typography.caption },

  readyVeil: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 190,
    alignItems: 'center',
    justifyContent: 'center',
  },

  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: spacing.base,
    gap: spacing.sm,
  },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  circleBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  searchSlot: { flex: 1 },

  hint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.input,
    borderWidth: StyleSheet.hairlineWidth,
  },
  hintText: { ...typography.caption, flex: 1 },

  locateBtn: {
    position: 'absolute',
    right: spacing.base,
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    shadowColor: '#000',
    shadowOpacity: 0.14,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },

  confirmCard: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: spacing.base,
    paddingTop: spacing.base,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: StyleSheet.hairlineWidth,
    shadowOpacity: 0.16,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: -6 },
    elevation: 16,
  },
  confirmEyebrow: {
    ...typography.label,
    textTransform: 'uppercase',
    marginBottom: spacing.sm,
  },
  confirmRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.base,
    minHeight: 44,
  },
  confirmIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmText: { flex: 1, gap: 4 },
  confirmTitle: { ...typography.subtitle },
  confirmSub: { ...typography.caption },

  skeletonLine: { height: 12, borderRadius: 6, width: '86%' },
  skeletonShort: { width: '48%' },

  confirmPressable: { width: '100%' },
  confirmBtn: {
    width: '100%',
    height: 54,
    borderRadius: radius.button,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmBtnText: {
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: -0.2,
    fontFamily: Platform.OS === 'web' ? undefined : 'Cairo-Bold',
  },

  errorToast: {
    position: 'absolute',
    left: spacing.base,
    right: spacing.base,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.input,
    borderWidth: StyleSheet.hairlineWidth,
  },
});
