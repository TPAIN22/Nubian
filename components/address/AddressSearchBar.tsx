/**
 * Search over cities, streets, landmarks, businesses and neighbourhoods.
 *
 * Floats above the map. Results replace the map only while the field is
 * focused and non-empty, so the map is never hidden by an empty panel.
 *
 * Hidden entirely when the active provider can't do autocomplete — a dead
 * search box is worse than none.
 */
import { memo, useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  I18nManager,
  Keyboard,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Text } from '@/components/ui/text';
import i18n from '@/utils/i18n';
import { radius, spacing, typography } from '@/theme/tokens';
import { useCheckoutTheme } from '@/components/checkout';
import { getPlaceDetails, searchPlaces } from '@/services/geo/geo.api';
import type { GeoAddress, GeoPoint, GeoSuggestion } from '@/services/geo/types';

interface Props {
  /** Bias results toward the current map centre. */
  near: GeoPoint | null;
  /** Server-tuned debounce. */
  debounceMs: number;
  enabled: boolean;
  /** Fired with a fully-resolved address once a suggestion is chosen. */
  onSelect: (address: GeoAddress) => void;
}

export const AddressSearchBar = memo(function AddressSearchBar({
  near,
  debounceMs,
  enabled,
  onSelect,
}: Props) {
  const t = useCheckoutTheme();
  const writingDirection: 'ltr' | 'rtl' = i18n.language === 'ar' ? 'rtl' : 'ltr';

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<GeoSuggestion[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [resolvingId, setResolvingId] = useState<string | null>(null);

  const inputRef = useRef<TextInput>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (timerRef.current) clearTimeout(timerRef.current);
      abortRef.current?.abort();
    };
  }, []);

  const runSearch = useCallback(
    (text: string) => {
      if (timerRef.current) clearTimeout(timerRef.current);
      // Abandon the previous query — its results are for text the user has
      // already edited past.
      abortRef.current?.abort();

      const trimmed = text.trim();
      if (trimmed.length < 2) {
        setResults([]);
        setIsSearching(false);
        return;
      }

      setIsSearching(true);

      timerRef.current = setTimeout(async () => {
        const controller = new AbortController();
        abortRef.current = controller;

        const found = await searchPlaces(trimmed, near, controller.signal);

        if (!mountedRef.current || controller.signal.aborted) return;
        setResults(found);
        setIsSearching(false);
      }, debounceMs);
    },
    [near, debounceMs],
  );

  const handleChange = useCallback(
    (text: string) => {
      setQuery(text);
      runSearch(text);
    },
    [runSearch],
  );

  const handleSelect = useCallback(
    async (suggestion: GeoSuggestion) => {
      setResolvingId(suggestion.id);
      Keyboard.dismiss();

      // Some providers return coordinates inline, some only give an id. Ask for
      // details, and fall back to whatever the suggestion already carried so a
      // details-lookup failure doesn't dead-end the tap.
      const resolved = await getPlaceDetails(suggestion.id);

      if (!mountedRef.current) return;
      setResolvingId(null);

      const address: GeoAddress | null =
        resolved ??
        (typeof suggestion.lat === 'number' && typeof suggestion.lng === 'number'
          ? {
              lat: suggestion.lat,
              lng: suggestion.lng,
              formattedAddress: suggestion.description,
              countryCode: '',
              country: '',
              administrativeArea: '',
              subAdministrativeArea: '',
              city: '',
              neighborhood: '',
              street: '',
              streetNumber: '',
              postalCode: '',
              placeId: suggestion.id,
              // A suggestion never carries a plus code; only place details do.
              plusCode: '',
              provider: suggestion.provider,
              accuracy: 'approximate',
            }
          : null);

      if (!address) return;

      setQuery('');
      setResults([]);
      setIsFocused(false);
      inputRef.current?.blur();
      onSelect(address);
    },
    [onSelect],
  );

  const clear = useCallback(() => {
    setQuery('');
    setResults([]);
    inputRef.current?.focus();
  }, []);

  if (!enabled) return null;

  const showPanel = isFocused && query.trim().length >= 2;

  return (
    <View style={styles.wrapper}>
      <View
        style={[
          styles.field,
          {
            backgroundColor: t.card,
            borderColor: isFocused ? t.accent : t.border,
            borderWidth: isFocused ? 1.5 : StyleSheet.hairlineWidth,
            shadowColor: t.isDark ? '#000' : '#0f172a',
          },
        ]}
      >
        <Ionicons name="search" size={18} color={t.textTertiary} />
        <TextInput
          ref={inputRef}
          value={query}
          onChangeText={handleChange}
          onFocus={() => setIsFocused(true)}
          placeholder={
            i18n.t('address_searchPlaceholder') || 'Search a place, street or landmark'
          }
          placeholderTextColor={t.textTertiary}
          style={[styles.input, { color: t.textPrimary, writingDirection }]}
          returnKeyType="search"
          autoCorrect={false}
          accessibilityLabel={i18n.t('address_searchPlaceholder') || 'Search for a location'}
        />
        {isSearching ? <ActivityIndicator size="small" color={t.accent} /> : null}
        {query.length > 0 && !isSearching ? (
          <Pressable
            onPress={clear}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel={i18n.t('clear') || 'Clear'}
          >
            <Ionicons name="close-circle" size={18} color={t.textTertiary} />
          </Pressable>
        ) : null}
      </View>

      {showPanel ? (
        <View
          style={[
            styles.panel,
            { backgroundColor: t.card, borderColor: t.border, shadowColor: t.isDark ? '#000' : '#0f172a' },
          ]}
        >
          <ScrollView
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            style={styles.panelScroll}
          >
            {results.length === 0 && !isSearching ? (
              <View style={styles.emptyRow}>
                <Text style={[styles.emptyText, { color: t.textTertiary }]}>
                  {i18n.t('address_noResults') || 'No matching places'}
                </Text>
              </View>
            ) : null}

            {results.map((item, index) => (
              // Static style only: under NativeWind v4 the function form of
              // Pressable's `style` is silently dropped and the row renders
              // unstyled. Press feedback comes from android_ripple instead.
              <Pressable
                key={item.id}
                onPress={() => handleSelect(item)}
                accessibilityRole="button"
                accessibilityLabel={item.description}
                android_ripple={{ color: t.surfaceMuted }}
                style={[
                  styles.row,
                  index > 0 && {
                    borderTopWidth: StyleSheet.hairlineWidth,
                    borderTopColor: t.divider,
                  },
                ]}
              >
                <View style={[styles.rowIcon, { backgroundColor: t.accentSoft }]}>
                  <Ionicons name="location-outline" size={15} color={t.accent} />
                </View>

                <View style={styles.rowText}>
                  <Text
                    style={[styles.rowTitle, { color: t.textPrimary, writingDirection }]}
                    numberOfLines={1}
                  >
                    {item.title}
                  </Text>
                  {item.subtitle ? (
                    <Text
                      style={[styles.rowSubtitle, { color: t.textTertiary, writingDirection }]}
                      numberOfLines={1}
                    >
                      {item.subtitle}
                    </Text>
                  ) : null}
                </View>

                {resolvingId === item.id ? (
                  <ActivityIndicator size="small" color={t.accent} />
                ) : (
                  <Ionicons
                    name={I18nManager.isRTL ? 'chevron-back' : 'chevron-forward'}
                    size={16}
                    color={t.textTertiary}
                  />
                )}
              </Pressable>
            ))}
          </ScrollView>
        </View>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  wrapper: { width: '100%' },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.base,
    minHeight: 52,
    shadowOpacity: 0.12,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  input: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    paddingVertical: 14,
  },
  panel: {
    marginTop: spacing.sm,
    borderRadius: radius.card,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
    shadowOpacity: 0.14,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  panelScroll: { maxHeight: 280 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    minHeight: 56,
  },
  rowIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowText: { flex: 1 },
  rowTitle: { ...typography.bodyStrong },
  rowSubtitle: { ...typography.caption, marginTop: 1 },
  emptyRow: { paddingHorizontal: spacing.base, paddingVertical: spacing.lg, alignItems: 'center' },
  emptyText: { ...typography.caption },
});

export default AddressSearchBar;
