/**
 * The Nubian UI kit.
 *
 * Every screen should be buildable from these plus layout `View`s. If a screen
 * needs a style that isn't expressible here, that's a signal to extend the kit
 * rather than to hand-roll a one-off — one-offs are how the app drifted into
 * five different card radii and three different golds.
 *
 *   import { Screen, Surface, Button, AppText, Price } from '@/components/ui/kit';
 */

export { AppText } from './Text';
export type { AppTextProps } from './Text';

export { Touchable } from './Touchable';
export type { TouchableProps } from './Touchable';

export { Button, IconButton, ButtonRow } from './Button';
export type { ButtonProps, ButtonVariant, ButtonSize, IconButtonProps } from './Button';

export { Input } from './Input';
export type { InputProps, InputState } from './Input';

export { Badge, DiscountBadge, Rating } from './Badge';
export type { BadgeProps, BadgeTone } from './Badge';

export { Chip } from './Chip';
export type { ChipProps } from './Chip';

export { Surface, Screen } from './Surface';
export type { SurfaceProps } from './Surface';

export { Separator, LabelledSeparator } from './Separator';
export type { SeparatorProps } from './Separator';

export { SectionHeader } from './SectionHeader';
export type { SectionHeaderProps } from './SectionHeader';

export { EmptyState } from './EmptyState';
export type { EmptyStateProps } from './EmptyState';

export {
  SkeletonBlock,
  SkeletonProductCard,
  SkeletonListRow,
  SkeletonRail,
} from './Skeleton';
export type { SkeletonBlockProps } from './Skeleton';

export { Price } from './Price';
export type { PriceProps, PriceSize } from './Price';
