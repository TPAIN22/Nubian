/**
 * ⚠️ LEGACY — presentation pieces for the cascading dropdown location picker.
 *
 * Consumed only by `components/LocationPicker.tsx` (also legacy). Retained as
 * part of the rollback path — see the header of `components/AddressForm.tsx`.
 *
 * Not to be confused with `components/map/` (the map renderer) or
 * `components/address/` (the current address UI), which are the live modules.
 */
export type { LocationData, LocationStep, LocationItem } from "./types";
export { localizedName } from "./localizedName";
export { useLocationPicker } from "./useLocationPicker";
export type { UseLocationPicker } from "./useLocationPicker";
export { LocationPickerHeader } from "./LocationPickerHeader";
export { LocationStepProgress } from "./LocationStepProgress";
export { LocationBreadcrumb } from "./LocationBreadcrumb";
export { LocationSearchBar } from "./LocationSearchBar";
export { LocationListItem } from "./LocationListItem";
export { LocationListSkeleton } from "./LocationListSkeleton";
export { LocationEmptyState } from "./LocationEmptyState";
export { LocationErrorState } from "./LocationErrorState";
