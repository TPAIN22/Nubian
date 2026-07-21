/**
 * Checkout design tokens now live in the shared token module so auth, profile,
 * and checkout all pull from one source of truth. Re-exported here to keep the
 * existing `./tokens` imports across the checkout components working unchanged.
 */

export {
  spacing,
  radius,
  typography,
  animation,
  HIT_SLOP,
  MIN_TOUCH,
} from '@/theme/tokens';
export type { ColorsLike } from '@/theme/tokens';
