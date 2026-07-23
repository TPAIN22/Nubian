/**
 * NotificationCard — the floating card itself.
 *
 * Composition only: `NotificationAnimator` (motion) wraps `NotificationGesture`
 * (touch) wraps this card's surface, which in turn composes `NotificationIcon`
 * and `NotificationProgress`. The card holds exactly one piece of local state —
 * whether a finger is currently on it — and delegates everything else to
 * `NotificationManager`.
 *
 * Navigation is deliberately *not* reimplemented here: taps hand the item's
 * `deepLink` to the existing `navigateFromNotificationLink` parser, the same
 * one the push handler and the notification inbox use.
 */

import { memo, useCallback, useEffect, useState } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
// Themed Text: Cairo font + theme aware. `bold` swaps to Cairo-Bold — a raw
// fontWeight alone would not change the font family on native.
import { Text } from '@/components/ui/text';
import { useColors } from '@/hooks/useColors';
import { useRTL } from '@/hooks/useRTL';
import { HIT_SLOP, spacing, typography } from '@/theme/tokens';
import { navigateFromNotificationLink } from '@/utils/deepLinks';
import { NotificationManager } from './NotificationManager';
import { NotificationAnimator } from './NotificationAnimator';
import { NotificationGesture } from './NotificationGesture';
import { NotificationIcon } from './NotificationIcon';
import { NotificationProgress } from './NotificationProgress';
import {
  NOTIFICATION_LAYOUT,
  getPriorityVisuals,
  getVariantVisuals,
  withAlpha,
  type ThemeColors,
} from './notificationTheme';
import { formatRelativeTime, strings } from './notificationStrings';
import { playDismissHaptic } from './haptics';
import type { NotificationItem } from './types';

interface Props {
  item: NotificationItem;
  /** 0 = newest / frontmost. */
  index: number;
  reduceMotion: boolean;
  /**
   * When a screen reader is on, the card holds its clock indefinitely so the
   * message can't disappear mid-announcement.
   */
  holdForScreenReader: boolean;
}

function NotificationCardBase({ item, index, reduceMotion, holdForScreenReader }: Props) {
  const colors = useColors() as ThemeColors;
  const { chevronForward, writingDirection, textAlign } = useRTL();
  const [pressed, setPressed] = useState(false);

  const visuals = getVariantVisuals(item.variant, colors);
  const emphasis = getPriorityVisuals(item.priority);
  const relativeTime = formatRelativeTime(item.timestamp);

  const { id } = item;

  // Assistive tech: freeze the countdown for as long as the card is mounted.
  useEffect(() => {
    if (!holdForScreenReader) return;
    NotificationManager.pause(id);
  }, [holdForScreenReader, id]);

  const handlePressIn = useCallback(() => {
    setPressed(true);
    NotificationManager.pause(id);
  }, [id]);

  const handlePressOut = useCallback(() => {
    setPressed(false);
    if (holdForScreenReader) return;
    NotificationManager.resume(id);
  }, [id, holdForScreenReader]);

  const handleExited = useCallback(() => {
    NotificationManager.remove(id);
  }, [id]);

  const handleSwipedOut = useCallback(() => {
    playDismissHaptic();
    // Already off-screen — skip the exit animation and free the slot now.
    NotificationManager.remove(id);
  }, [id]);

  const handleClose = useCallback(() => {
    playDismissHaptic();
    NotificationManager.dismiss(id);
  }, [id]);

  const handleOpen = useCallback(() => {
    if (item.onPress) item.onPress();
    else if (item.deepLink) navigateFromNotificationLink(item.deepLink);
    NotificationManager.dismiss(id);
  }, [id, item]);

  const handleAction = useCallback(() => {
    const action = item.action;
    if (!action) return;
    if (action.onPress) action.onPress();
    else if (action.deepLink) navigateFromNotificationLink(action.deepLink);
    NotificationManager.dismiss(id);
  }, [id, item.action]);

  const openable = Boolean(item.onPress || item.deepLink);
  const Surface = openable ? Pressable : View;

  const accessibilityLabel = [
    item.title,
    item.message,
    relativeTime,
    item.priority === 'critical' ? strings.urgent() : null,
  ]
    .filter(Boolean)
    .join('. ');

  return (
    <NotificationAnimator
      index={index}
      exiting={item.exiting}
      onExited={handleExited}
      reduceMotion={reduceMotion}
    >
      <NotificationGesture
        enabled={item.dismissible}
        onSwipedOut={handleSwipedOut}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        reduceMotion={reduceMotion}
      >
        <Surface
          {...(openable
            ? {
                onPress: handleOpen,
                accessibilityRole: 'button' as const,
                accessibilityHint: strings.swipeHint(),
              }
            : {})}
          accessible
          accessibilityLabel={accessibilityLabel}
          accessibilityLiveRegion={
            item.priority === 'critical' || item.priority === 'high'
              ? 'assertive'
              : 'polite'
          }
          style={[
            styles.surface,
            {
              backgroundColor: colors.cardBackground,
              borderColor: visuals.border,
              borderWidth: emphasis.borderWidth,
              shadowColor: colors.shadow,
              shadowOpacity: emphasis.shadowOpacity,
              shadowRadius: emphasis.shadowRadius,
              elevation: emphasis.elevation,
            },
            pressed && styles.surfacePressed,
          ]}
        >
          {/* Type wash — a 5% tint so the card reads as its category before a
              single word is parsed. */}
          <View
            pointerEvents="none"
            style={[StyleSheet.absoluteFillObject, { backgroundColor: visuals.wash }]}
          />

          {/* Leading accent rail. */}
          <View
            pointerEvents="none"
            style={[
              styles.rail,
              { width: emphasis.railWidth, backgroundColor: visuals.accent },
            ]}
          />

          <View style={styles.row}>
            <NotificationIcon visuals={visuals} priority={item.priority} />

            <View style={styles.body}>
              <View style={styles.titleRow}>
                <Text
                  bold
                  numberOfLines={2}
                  maxFontSizeMultiplier={1.8}
                  style={[
                    styles.title,
                    { color: colors.text.secondary, textAlign, writingDirection },
                  ]}
                >
                  {item.title}
                </Text>

                {emphasis.showBadge && (
                  <View
                    style={[
                      styles.badge,
                      {
                        backgroundColor: withAlpha(visuals.accent, 0.16),
                        borderColor: withAlpha(visuals.accent, 0.3),
                      },
                    ]}
                  >
                    <Text
                      bold
                      maxFontSizeMultiplier={1.4}
                      style={[styles.badgeText, { color: visuals.accent }]}
                    >
                      {strings.urgent()}
                    </Text>
                  </View>
                )}
              </View>

              {!!item.message && (
                <Text
                  numberOfLines={3}
                  maxFontSizeMultiplier={1.8}
                  style={[
                    styles.message,
                    { color: colors.text.tertiary, textAlign, writingDirection },
                  ]}
                >
                  {item.message}
                </Text>
              )}

              {!!relativeTime && (
                <Text
                  maxFontSizeMultiplier={1.6}
                  style={[
                    styles.timestamp,
                    { color: colors.text.tertiary, textAlign, writingDirection },
                  ]}
                >
                  {relativeTime}
                </Text>
              )}

              {!!item.action && (
                <Pressable
                  onPress={handleAction}
                  hitSlop={HIT_SLOP}
                  accessibilityRole="button"
                  accessibilityLabel={item.action.label}
                  style={({ pressed: ctaPressed }) => [
                    styles.cta,
                    {
                      backgroundColor: withAlpha(visuals.accent, ctaPressed ? 0.24 : 0.14),
                      borderColor: withAlpha(visuals.accent, 0.28),
                    },
                  ]}
                >
                  <Text
                    bold
                    maxFontSizeMultiplier={1.6}
                    style={[styles.ctaText, { color: visuals.accent }]}
                  >
                    {item.action.label}
                  </Text>
                  <Ionicons name={chevronForward} size={14} color={visuals.accent} />
                </Pressable>
              )}
            </View>

            {item.dismissible && (
              <Pressable
                onPress={handleClose}
                hitSlop={HIT_SLOP}
                accessibilityRole="button"
                accessibilityLabel={strings.dismiss()}
                style={({ pressed: closePressed }) => [
                  styles.close,
                  {
                    backgroundColor: closePressed
                      ? withAlpha(colors.text.tertiary, 0.18)
                      : 'transparent',
                  },
                ]}
              >
                <Ionicons name="close" size={18} color={colors.text.tertiary} />
              </Pressable>
            )}
          </View>

          <NotificationProgress
            duration={item.duration}
            paused={pressed || holdForScreenReader}
            revision={item.revision}
            color={visuals.accent}
          />
        </Surface>
      </NotificationGesture>
    </NotificationAnimator>
  );
}

const styles = StyleSheet.create({
  surface: {
    borderRadius: NOTIFICATION_LAYOUT.cardRadius,
    paddingVertical: NOTIFICATION_LAYOUT.paddingVertical,
    paddingHorizontal: NOTIFICATION_LAYOUT.paddingHorizontal,
    paddingBottom: NOTIFICATION_LAYOUT.paddingVertical + NOTIFICATION_LAYOUT.progressHeight,
    overflow: 'hidden',
    // iOS shadow; Android uses `elevation` set inline per priority.
    shadowOffset: { width: 0, height: 8 },
  },
  surfacePressed: {
    opacity: Platform.OS === 'ios' ? 0.96 : 1,
  },
  rail: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    start: 0,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: NOTIFICATION_LAYOUT.gap,
  },
  body: {
    flex: 1,
    minWidth: 0,
    paddingTop: 2,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  title: {
    flexShrink: 1,
    fontSize: 16,
    lineHeight: 21,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: 999,
    borderWidth: 1,
  },
  badgeText: {
    ...typography.label,
    textTransform: 'uppercase',
  },
  message: {
    marginTop: 3,
    fontSize: 14,
    lineHeight: 19,
    fontWeight: '400',
  },
  timestamp: {
    marginTop: 5,
    fontSize: 11,
    lineHeight: 15,
    fontWeight: '600',
    letterSpacing: 0.2,
    opacity: 0.8,
  },
  cta: {
    alignSelf: 'flex-start',
    marginTop: spacing.md,
    minHeight: 36,
    paddingHorizontal: spacing.md + 2,
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs + 2,
  },
  ctaText: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '700',
  },
  close: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -2,
    marginEnd: -4,
  },
});

/**
 * Re-render only when the item's identity/revision or its stack position
 * changes. A neighbouring card's timer or gesture never touches this one.
 */
export const NotificationCard = memo(NotificationCardBase, (prev, next) => {
  return (
    prev.item === next.item &&
    prev.index === next.index &&
    prev.reduceMotion === next.reduceMotion &&
    prev.holdForScreenReader === next.holdForScreenReader
  );
});
