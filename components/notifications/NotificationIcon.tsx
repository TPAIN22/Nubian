/**
 * NotificationIcon — the leading glyph chip.
 *
 * Single responsibility: render the variant icon at a size that reads instantly
 * from arm's length, on a tinted circular chip that carries the type colour.
 * Critical notifications get a second, softer ring so urgency is legible
 * without relying on colour alone (colour-blind safe).
 */

import { memo } from 'react';
import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NOTIFICATION_LAYOUT, withAlpha, type VariantVisuals } from './notificationTheme';
import type { NotificationPriority } from './types';

interface Props {
  visuals: VariantVisuals;
  priority: NotificationPriority;
}

function NotificationIconBase({ visuals, priority }: Props) {
  const isCritical = priority === 'critical';

  return (
    <View
      // Decorative: the card's accessibilityLabel already names the type.
      accessible={false}
      importantForAccessibility="no"
      style={[
        styles.chip,
        {
          backgroundColor: visuals.chip,
          borderColor: visuals.chipBorder,
        },
        isCritical && {
          borderWidth: 2,
          shadowColor: visuals.accent,
          shadowOpacity: 0.35,
          shadowRadius: 8,
          shadowOffset: { width: 0, height: 0 },
        },
      ]}
    >
      {isCritical && (
        <View
          style={[
            StyleSheet.absoluteFillObject,
            styles.ring,
            { borderColor: withAlpha(visuals.accent, 0.35) },
          ]}
        />
      )}
      <Ionicons name={visuals.icon} size={24} color={visuals.accent} />
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    width: NOTIFICATION_LAYOUT.chipSize,
    height: NOTIFICATION_LAYOUT.chipSize,
    borderRadius: NOTIFICATION_LAYOUT.chipRadius,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ring: {
    borderRadius: NOTIFICATION_LAYOUT.chipRadius,
    borderWidth: 1,
    margin: -4,
  },
});

export const NotificationIcon = memo(NotificationIconBase);
