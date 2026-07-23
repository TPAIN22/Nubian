/**
 * Cart feedback bus — presentation only.
 *
 * A tiny module-level pub/sub that lets any "add to cart" call site trigger the
 * global feedback layer (`CartAnimationLayer`) without threading props through
 * the tree or touching `store/useCartStore`. It carries **no** cart state: the
 * cart itself remains the single source of truth in the Zustand store, and this
 * module never reads or writes it.
 *
 * Deliberately not a Zustand store — the flight/confirmation events are
 * fire-and-forget UI signals, and keeping them out of a store means no
 * component re-renders because an animation started somewhere else.
 */

export type Rect = { x: number; y: number; width: number; height: number };

export type CartFlight = {
  id: string;
  /** Product image to fly. `null` renders a generic dot instead. */
  uri: string | null;
  from: Rect;
  to: Rect;
};

export type CartConfirmation = {
  id: string;
  title: string;
  subtitle?: string;
  uri: string | null;
  /** Fired when the user taps "View cart". */
  onViewCart?: () => void;
};

type FlightListener = (flight: CartFlight) => void;
type ConfirmListener = (confirmation: CartConfirmation) => void;
type BumpListener = () => void;

const flightListeners = new Set<FlightListener>();
const confirmListeners = new Set<ConfirmListener>();
const bumpListeners = new Set<BumpListener>();

/** Where the cart icon currently is, in window coordinates. */
let cartTarget: Rect | null = null;

let seq = 0;
const nextId = () => `cf_${Date.now().toString(36)}_${++seq}`;

/* ── Cart icon registration ─────────────────────────────────────────────── */

/** Called by the tab bar's cart icon on layout. */
export function setCartTarget(rect: Rect | null): void {
  cartTarget = rect;
}

export function getCartTarget(): Rect | null {
  return cartTarget;
}

/* ── Flight (product → cart icon) ───────────────────────────────────────── */

export function subscribeFlights(listener: FlightListener): () => void {
  flightListeners.add(listener);
  return () => flightListeners.delete(listener);
}

/**
 * Launch a product image toward the cart icon.
 * No-ops (silently) when the cart icon has never been laid out — e.g. a screen
 * pushed over a hidden tab bar — so the caller never has to check.
 */
export function flyToCart(input: { uri?: string | null; from: Rect | null }): void {
  if (!input.from) return;
  const to = cartTarget;
  if (!to) return;
  if (flightListeners.size === 0) return;

  const flight: CartFlight = {
    id: nextId(),
    uri: input.uri ?? null,
    from: input.from,
    to,
  };
  flightListeners.forEach(l => {
    try {
      l(flight);
    } catch {
      /* a broken listener must never break an add-to-cart */
    }
  });
}

/* ── Badge bump (arrival pulse) ─────────────────────────────────────────── */

export function subscribeBump(listener: BumpListener): () => void {
  bumpListeners.add(listener);
  return () => bumpListeners.delete(listener);
}

/** Fired when a flight lands, so the badge can pop in sync with the image. */
export function bumpCartBadge(): void {
  bumpListeners.forEach(l => {
    try {
      l();
    } catch {
      /* noop */
    }
  });
}

/* ── Floating confirmation card ─────────────────────────────────────────── */

export function subscribeConfirmations(listener: ConfirmListener): () => void {
  confirmListeners.add(listener);
  return () => confirmListeners.delete(listener);
}

export function showCartConfirmation(
  input: Omit<CartConfirmation, 'id'>,
): void {
  if (confirmListeners.size === 0) return;
  const confirmation: CartConfirmation = { id: nextId(), ...input };
  confirmListeners.forEach(l => {
    try {
      l(confirmation);
    } catch {
      /* noop */
    }
  });
}

/** Test seam — resets module state between specs. */
export function __resetCartFeedback(): void {
  flightListeners.clear();
  confirmListeners.clear();
  bumpListeners.clear();
  cartTarget = null;
}
