/**
 * Failure classification for cart operations.
 *
 * Kept in its own module (no React imports) so it can be unit-tested and reused
 * by a store, a screen or a component without dragging a component tree along.
 */

export type CartErrorKind = 'network' | 'auth' | 'stock' | 'generic';

/**
 * Best-effort bucket for anything the cart layer can throw or store: an axios
 * error, a plain `Error`, or the bare message string `useCartStore` keeps in
 * `state.error`.
 *
 * Order matters — an HTTP status is the strongest signal, so it wins over text
 * matching, and the network check runs last because a 5xx response is still a
 * response.
 */
export function classifyCartError(error: unknown): CartErrorKind {
  if (error == null) return 'generic';

  const err = error as any;
  const status: number | undefined = err?.response?.status;
  const text = String(err?.message ?? err ?? '').toLowerCase();

  if (status === 401 || status === 403) return 'auth';
  if (status === 409) return 'stock';

  if (status == null) {
    if (/unauthori[sz]ed|sign in|not signed in|token/.test(text)) return 'auth';
    if (/stock|inventory|unavailable|sold out/.test(text)) return 'stock';
  }

  if (
    err?.code === 'ERR_NETWORK' ||
    err?.code === 'ECONNABORTED' ||
    (status == null && /network|timeout|offline|connection/.test(text)) ||
    (status == null && !!err?.request)
  ) {
    return 'network';
  }

  if (/stock|inventory|sold out/.test(text)) return 'stock';

  return 'generic';
}
