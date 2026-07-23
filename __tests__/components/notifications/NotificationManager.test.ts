import {
  DURATION_BY_PRIORITY,
  NotificationManager,
} from '@/components/notifications/NotificationManager';
import { MAX_VISIBLE } from '@/components/notifications/NotificationQueue';

jest.mock('@/components/notifications/haptics', () => ({
  playNotificationHaptic: jest.fn(),
  playDismissHaptic: jest.fn(),
}));

const { playNotificationHaptic } = jest.requireMock(
  '@/components/notifications/haptics'
) as { playNotificationHaptic: jest.Mock };

/** Exit animation grace window used by the manager's safety reaper. */
const EXIT_GRACE_MS = 420;

describe('NotificationManager', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    NotificationManager.reset();
    playNotificationHaptic.mockClear();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('applies variant defaults for priority and duration', () => {
    NotificationManager.show({ variant: 'error', title: 'Payment failed' });
    const item = NotificationManager.getSnapshot()[0]!;

    expect(item.priority).toBe('high');
    expect(item.duration).toBe(DURATION_BY_PRIORITY.high);
  });

  it('gives low-priority promos a shorter life than critical alerts', () => {
    NotificationManager.show({ variant: 'promo', title: 'Flash sale' });
    NotificationManager.show({
      variant: 'order',
      title: 'Order cancelled',
      priority: 'critical',
    });

    const byTitle = Object.fromEntries(
      NotificationManager.getSnapshot().map((n) => [n.title, n.duration])
    );

    expect(byTitle['Flash sale']).toBe(DURATION_BY_PRIORITY.low);
    expect(byTitle['Order cancelled']).toBe(DURATION_BY_PRIORITY.critical);
    expect(byTitle['Flash sale']!).toBeLessThan(byTitle['Order cancelled']!);
  });

  it('auto-dismisses after the dwell time and unmounts after the exit grace', () => {
    const id = NotificationManager.show({ variant: 'success', title: 'Saved' });

    jest.advanceTimersByTime(DURATION_BY_PRIORITY.normal - 1);
    expect(NotificationManager.getSnapshot()[0]?.exiting).toBe(false);

    jest.advanceTimersByTime(1);
    expect(NotificationManager.getSnapshot()[0]?.exiting).toBe(true);

    jest.advanceTimersByTime(EXIT_GRACE_MS);
    expect(NotificationManager.getSnapshot()).toHaveLength(0);
    expect(NotificationManager.getRemaining(id)).toBe(0);
  });

  it('never auto-dismisses a sticky notification', () => {
    NotificationManager.show({ title: 'Needs your attention', duration: null });

    jest.advanceTimersByTime(60_000);

    expect(NotificationManager.getSnapshot()).toHaveLength(1);
    expect(NotificationManager.getSnapshot()[0]?.exiting).toBe(false);
  });

  it('freezes and resumes the dwell clock while the card is touched', () => {
    const id = NotificationManager.show({ variant: 'info', title: 'Held' });

    jest.advanceTimersByTime(1000);
    NotificationManager.pause(id);

    const remaining = NotificationManager.getRemaining(id);
    jest.advanceTimersByTime(30_000);

    expect(NotificationManager.getRemaining(id)).toBe(remaining);
    expect(NotificationManager.getSnapshot()[0]?.exiting).toBe(false);

    NotificationManager.resume(id);
    jest.advanceTimersByTime(remaining);

    expect(NotificationManager.getSnapshot()[0]?.exiting).toBe(true);
  });

  it('collapses duplicates and restarts the clock instead of stacking', () => {
    const first = NotificationManager.show({ variant: 'success', title: 'Added to cart' });

    jest.advanceTimersByTime(DURATION_BY_PRIORITY.normal - 500);
    const second = NotificationManager.show({
      variant: 'success',
      title: 'Added to cart',
    });

    expect(second).toBe(first);
    expect(NotificationManager.getSnapshot()).toHaveLength(1);
    expect(NotificationManager.getSnapshot()[0]?.revision).toBe(1);

    // Clock restarted: the original deadline passes without dismissing it.
    jest.advanceTimersByTime(500);
    expect(NotificationManager.getSnapshot()[0]?.exiting).toBe(false);
  });

  it('starts a queued notification’s clock only once it becomes visible', () => {
    const ids = Array.from({ length: MAX_VISIBLE + 1 }, (_, i) =>
      NotificationManager.show({ variant: 'info', title: `n${i}` })
    );
    const queuedId = ids[ids.length - 1]!;

    expect(NotificationManager.getRemaining(queuedId)).toBe(0);

    // Drain the visible stack; the parked card is promoted and starts ticking.
    jest.advanceTimersByTime(DURATION_BY_PRIORITY.normal + EXIT_GRACE_MS);

    expect(
      NotificationManager.getSnapshot().some((n) => n.id === queuedId && !n.exiting)
    ).toBe(true);
    expect(NotificationManager.getRemaining(queuedId)).toBeGreaterThan(0);
  });

  it('fires one haptic per surfaced notification', () => {
    NotificationManager.show({ variant: 'error', title: 'Boom' });
    expect(playNotificationHaptic).toHaveBeenCalledTimes(1);
    expect(playNotificationHaptic).toHaveBeenCalledWith('error', 'high');

    NotificationManager.show({ variant: 'success', title: 'Quiet', haptics: false });
    expect(playNotificationHaptic).toHaveBeenCalledTimes(1);
  });

  it('announces new notifications to the screen reader', () => {
    const announce = jest.fn();
    NotificationManager.setAnnouncer(announce);

    NotificationManager.show({ title: 'Order shipped', message: 'Arriving Tuesday' });

    expect(announce).toHaveBeenCalledWith('Order shipped. Arriving Tuesday');
    NotificationManager.setAnnouncer(null);
  });

  it('notifies subscribers only when the visible list changes', () => {
    const listener = jest.fn();
    const unsubscribe = NotificationManager.subscribe(listener);

    const id = NotificationManager.show({ title: 'Hello' });
    expect(listener).toHaveBeenCalledTimes(1);

    // Pausing is pure timer bookkeeping — it must not re-render the tree.
    NotificationManager.pause(id);
    NotificationManager.resume(id);
    expect(listener).toHaveBeenCalledTimes(1);

    unsubscribe();
    NotificationManager.dismiss(id);
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('dismissAll starts the exit animation for every visible card', () => {
    NotificationManager.show({ title: 'a' });
    NotificationManager.show({ title: 'b' });

    NotificationManager.dismissAll();
    expect(NotificationManager.getSnapshot().every((n) => n.exiting)).toBe(true);

    jest.advanceTimersByTime(EXIT_GRACE_MS);
    expect(NotificationManager.getSnapshot()).toHaveLength(0);
  });

  it('ignores dismiss/pause/resume for unknown ids', () => {
    expect(() => {
      NotificationManager.dismiss('nope');
      NotificationManager.pause('nope');
      NotificationManager.resume('nope');
      NotificationManager.remove('nope');
    }).not.toThrow();
  });
});
