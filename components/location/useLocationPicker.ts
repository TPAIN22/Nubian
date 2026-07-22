import { useCallback, useEffect, useMemo, useState } from "react";
import useLocationStore from "@/store/locationStore";
import { localizedName } from "./localizedName";
import type { LocationData, LocationItem, LocationStep } from "./types";

interface UseLocationPickerArgs {
  visible: boolean;
  initialValues?: LocationData;
  onSelect: (location: LocationData) => void;
  onClose: () => void;
}

export interface UseLocationPicker {
  step: LocationStep;
  /** Zero-based index of the active step — handy for progress UI. */
  stepIndex: number;
  search: string;
  setSearch: (value: string) => void;

  /** Rows for the current step, already filtered by the search query. */
  data: LocationItem[];
  /** `_id` of the row selected at the current step (for highlight/checkmark). */
  activeId: string | null;

  /** Resolved breadcrumb pieces for the steps already completed. */
  selectedCountry: LocationItem | null;
  selectedCity: LocationItem | null;

  isLoading: boolean;
  error: string | null;

  /** Tap a row — advances the step, or emits + closes on the final step. */
  onPick: (id: string) => void;
  /** Step back one level (or noop on the first step). */
  onBack: () => void;
  /** Whether a back action is available (used to swap close/back affordance). */
  canGoBack: boolean;
  /** Re-run the loader for the current step after an error. */
  retry: () => void;
}

/**
 * All Location Picker business logic, extracted verbatim from the legacy
 * component so the presentation layer stays pure.
 *
 * Preserved exactly:
 * - loadCountries on open; loadCities on country change; loadSubCities on city.
 * - search matching against nameEn / nameAr / name / localizedName.
 * - onPickSubCity builds LocationData from the resolved records, then
 *   onSelect() + onClose().
 * - back navigation resets downstream selections and clears the query.
 *
 * Deliberate correctness fix: `data` now also depends on the store's
 * `citiesByCountryId` / `subCitiesByCityId` slices, so a first-time (uncached)
 * city/area load actually re-renders the list instead of showing stale rows.
 */
export function useLocationPicker({
  visible,
  initialValues,
  onSelect,
  onClose,
}: UseLocationPickerArgs): UseLocationPicker {
  const {
    countries,
    citiesByCountryId,
    subCitiesByCityId,
    isLoading,
    error,
    loadCountries,
    loadCities,
    loadSubCities,
    getCitiesForCountry,
    getSubCitiesForCity,
  } = useLocationStore();

  const [selectedCountryId, setSelectedCountryId] = useState<string | null>(null);
  const [selectedCityId, setSelectedCityId] = useState<string | null>(null);
  const [selectedSubCityId, setSelectedSubCityId] = useState<string | null>(null);
  const [step, setStep] = useState<LocationStep>("country");
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!visible) return;
    loadCountries();
    setSelectedCountryId(initialValues?.countryId || null);
    setSelectedCityId(initialValues?.cityId || null);
    setSelectedSubCityId(initialValues?.subCityId || null);
    setStep("country");
    setSearch("");
  }, [visible]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (selectedCountryId && visible) loadCities(selectedCountryId);
  }, [selectedCountryId, visible]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (selectedCityId && visible) loadSubCities(selectedCityId);
  }, [selectedCityId, visible]); // eslint-disable-line react-hooks/exhaustive-deps

  const onPickCountry = useCallback((id: string) => {
    setSelectedCountryId(id);
    setSelectedCityId(null);
    setSelectedSubCityId(null);
    setStep("city");
    setSearch("");
  }, []);

  const onPickCity = useCallback((id: string) => {
    setSelectedCityId(id);
    setSelectedSubCityId(null);
    setStep("subcity");
    setSearch("");
  }, []);

  const onPickSubCity = useCallback(
    (id: string) => {
      const country = countries.find((c: LocationItem) => c._id === selectedCountryId);
      const city = citiesByCountryId[selectedCountryId || ""]?.find(
        (c: LocationItem) => c._id === selectedCityId,
      );
      const sub = subCitiesByCityId[selectedCityId || ""]?.find(
        (s: LocationItem) => s._id === id,
      );

      onSelect({
        countryId: selectedCountryId || undefined,
        cityId: selectedCityId || undefined,
        subCityId: id,
        countryName: localizedName(country),
        cityName: localizedName(city),
        subCityName: localizedName(sub),
      });
      onClose();
    },
    [
      countries,
      selectedCountryId,
      selectedCityId,
      citiesByCountryId,
      subCitiesByCityId,
      onSelect,
      onClose,
    ],
  );

  const onPick = useCallback(
    (id: string) => {
      if (step === "country") onPickCountry(id);
      else if (step === "city") onPickCity(id);
      else onPickSubCity(id);
    },
    [step, onPickCountry, onPickCity, onPickSubCity],
  );

  const onBack = useCallback(() => {
    if (step === "subcity") {
      setStep("city");
      setSelectedSubCityId(null);
    } else if (step === "city") {
      setStep("country");
      setSelectedCityId(null);
      setSelectedSubCityId(null);
    }
    setSearch("");
  }, [step]);

  const retry = useCallback(() => {
    if (step === "country") loadCountries(true);
    else if (step === "city" && selectedCountryId) loadCities(selectedCountryId, true);
    else if (step === "subcity" && selectedCityId) loadSubCities(selectedCityId, true);
  }, [step, selectedCountryId, selectedCityId, loadCountries, loadCities, loadSubCities]);

  const data = useMemo<LocationItem[]>(() => {
    const q = search.trim().toLowerCase();
    const matches = (item: LocationItem) => {
      if (!q) return true;
      return [item.nameEn, item.nameAr, item.name, localizedName(item)].some(v =>
        String(v ?? "").toLowerCase().includes(q),
      );
    };

    if (step === "country") return countries.filter(matches);
    if (step === "city") {
      return selectedCountryId ? getCitiesForCountry(selectedCountryId).filter(matches) : [];
    }
    return selectedCityId ? getSubCitiesForCity(selectedCityId).filter(matches) : [];
    // citiesByCountryId / subCitiesByCityId are intentional deps: the getters
    // read those store slices, so recomputing when a first-time (uncached) load
    // resolves is what keeps freshly-fetched rows from being missed.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    step,
    countries,
    citiesByCountryId,
    subCitiesByCityId,
    selectedCountryId,
    selectedCityId,
    search,
    getCitiesForCountry,
    getSubCitiesForCity,
  ]);

  const selectedCountry = useMemo(
    () => countries.find((c: LocationItem) => c._id === selectedCountryId) ?? null,
    [countries, selectedCountryId],
  );

  const selectedCity = useMemo(
    () =>
      citiesByCountryId[selectedCountryId || ""]?.find(
        (c: LocationItem) => c._id === selectedCityId,
      ) ?? null,
    [citiesByCountryId, selectedCountryId, selectedCityId],
  );

  const activeId =
    step === "country"
      ? selectedCountryId
      : step === "city"
        ? selectedCityId
        : selectedSubCityId;

  const stepIndex = step === "country" ? 0 : step === "city" ? 1 : 2;

  return {
    step,
    stepIndex,
    search,
    setSearch,
    data,
    activeId,
    selectedCountry,
    selectedCity,
    isLoading,
    error,
    onPick,
    onBack,
    canGoBack: step !== "country",
    retry,
  };
}
