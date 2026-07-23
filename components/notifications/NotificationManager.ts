/**
 * NotificationManager — the single source of truth for in-app notification
 * cards. Framework-free on purpose: Zustand stores, axios interceptors and
 * plain utils can all call `notify()` without importing React or a renderer.
 *
 * Responsibilities:
 *  - resolve caller input into a fully-defaulted `NotificationItem`
 *  - own the auto-dismiss clock (including pause/resume while touched)
 *  - fire haptics and screen-reader announcements once per notification
 *  - expose an external store (`subscribe`/`getSnapshot`) for React
 *
 * It deliberately does NOT talk to the backend, mark anything as read, or
 * navigate. Deep links are handed to the existing `navigateFromNotificationLink`
 * parser by the card, so routing behaviour is unchanged.
 */

import { NotificationQueue, type QueueChange } from './NotificationQueue';
import { playNotificationHaptic } from './haptics';
import type {
  NotificationInput,
  NotificationItem,
  NotificationPriority,
  NotificationVariant,
} from './types';

/**
 * Dwell time by priority. Low-priority chatter clears fast; critical messages
 * hang around long enough to be read and acted on.
 */
export const DURATION_BY_PRIORITY: Record<NotificationPriority, number> = {
  low: 2600,
  normal: 4200,
  high: 6000,
  critical: 9000,
};

/** Sensible default importance per variant — callers can always override. */
const PRIORITY_BY_VARIANT: Record<NotificationVariant, NotificationPriority> = {
  success: 'normal',
  error: 'high',
  warning: 'high',
  info: 'normal',
  order: 'high',
  promo: 'low',
};

/** Safety net: if no card mounts to run the exit animation, reap the item. */
const EXIT_GRACE_MS = 420;

type Listener = () => void;

interface Timer {
  handle: ReturnType<typeof setTimeout> | null;
  /** ms left when paused, or the full remaining slice while running. */
  remaining: number;
  startedAt: number;
  paused: boolean;
}

let idCounter = 0;
function nextId(): string {
  idCounter += 1;
  return `notif_${Date.now().toString(36)}_${idCounter}`;
}

function toTimestamp(value: NotificationInput['timestamp']): number | undefined {
  if (value === undefined || value === null) return undefined;
  if (typeof value === 'number') return value;
  if (value instanceof Date) return value.getTime();
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? undefined : parsed;
}

class Manager {
  private queue = new NotificationQueue();
  private listeners = new Set<Listener>();
  private timers = new Map<string, Timer>();
  private announce: ((message: string) => void) | null = null;

  // -- external store ---------------------------------------------------------

  subscribe = (listener: Listener): (() => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  getSnapshot = (): NotificationItem[] => this.queue.getVisible();

  /** Web/SSR parity for `useSyncExternalStore`. */
  getServerSnapshot = (): NotificationItem[] => this.queue.getVisible();

  private emit(): void {
    this.listeners.forEach((listener) => listener());
  }

  /**
   * Installed once by the container so announcements go through React Native's
   * AccessibilityInfo without this module importing it.
   */
  setAnnouncer(fn: ((message: string) => void) | null): void {
    this.announce = fn;
  }

  // -- public API -------------------------------------------------------------

  show = (input: NotificationInput): string => {
    const variant = input.variant ?? 'info';
    const priority = input.priority ?? PRIORITY_BY_VARIANT[variant];
    const item: NotificationItem = {
      id: input.id ?? nextId(),
      dedupeKey:
        input.dedupeKey ?? `${variant}|${input.title}|${input.message ?? ''}`,
      variant,
      priority,
      title: input.title,
      message: input.message,
      timestamp: toTimestamp(input.timestamp),
      duration:
        input.duration === null
          ? null
          : (input.duration ?? DURATION_BY_PRIORITY[priority]),
      action: input.action,
      onPress: input.onPress,
      deepLink: input.deepLink,
      dismissible: input.dismissible ?? true,
      haptics: input.haptics ?? true,
      createdAt: Date.now(),
      revision: 0,
      exiting: false,
    };

    const changes = this.queue.push(item);
    this.applyChanges(changes);
    this.emit();

    // The push may have been collapsed into an existing card — report the id
    // the caller can actually dismiss.
    const landed = changes.find(
      (c) => c.type === 'shown' || c.type === 'queued' || c.type === 'refreshed'
    );
    return landed?.item.id ?? item.id;
  };

  /** Start dismissing a card. Safe to call for unknown ids. */
  dismiss = (id: string): void => {
    this.clearTimer(id);
    const changes = this.queue.markExiting(id);
    if (changes.length === 0) return;
    this.applyChanges(changes);
    this.emit();
  };

  dismissAll = (): void => {
    this.timers.forEach((_, id) => this.clearTimer(id));
    const changes = this.queue.clear();
    if (changes.length === 0) return;
    this.applyChanges(changes);
    this.emit();
  };

  /** Called by a card once its exit animation has finished. */
  remove = (id: string): void => {
    this.clearTimer(id);
    const changes = this.queue.remove(id);
    if (changes.length === 0) return;
    this.applyChanges(changes);
    this.emit();
  };

  /** Freeze the auto-dismiss clock while the user is touching the card. */
  pause = (id: string): void => {
    const timer = this.timers.get(id);
    if (!timer || timer.paused) return;
    if (timer.handle) clearTimeout(timer.handle);
    timer.remaining = Math.max(0, timer.remaining - (Date.now() - timer.startedAt));
    timer.handle = null;
    timer.paused = true;
  };

  resume = (id: string): void => {
    const timer = this.timers.get(id);
    if (!timer || !timer.paused) return;
    timer.paused = false;
    timer.startedAt = Date.now();
    timer.handle = setTimeout(() => this.dismiss(id), Math.max(0, timer.remaining));
  };

  /** Remaining dwell time in ms — used to keep the progress bar in sync. */
  getRemaining = (id: string): number => {
    const timer = this.timers.get(id);
    if (!timer) return 0;
    if (timer.paused) return timer.remaining;
    return Math.max(0, timer.remaining - (Date.now() - timer.startedAt));
  };

  /** Test/hot-reload hook: drop everything without animating. */
  reset = (): void => {
    this.timers.forEach((timer) => timer.handle && clearTimeout(timer.handle));
    this.timers.clear();
    this.queue = new NotificationQueue();
    this.emit();
  };

  // -- internals --------------------------------------------------------------

  private applyChanges(changes: QueueChange[]): void {
    for (const change of changes) {
      switch (change.type) {
        case 'shown':
          this.startTimer(change.item);
          this.onSurfaced(change.item);
          break;
        case 'refreshed':
          // Same card, new content: restart the clock so the user gets a full
          // read of the *latest* message, and re-announce it.
          this.clearTimer(change.item.id);
          if (this.queue.isVisible(change.item.id)) {
            this.startTimer(change.item);
            this.onSurfaced(change.item);
          }
          break;
        case 'queued':
          // No timer while parked — dwell time starts when it becomes visible.
          break;
        case 'exiting':
          this.clearTimer(change.item.id);
          this.scheduleReap(change.item.id);
          break;
        case 'removed':
          this.clearTimer(change.item.id);
          break;
      }
    }
  }

  private onSurfaced(item: NotificationItem): void {
    if (item.haptics) playNotificationHaptic(item.variant, item.priority);
    if (this.announce) {
      this.announce(item.message ? `${item.title}. ${item.message}` : item.title);
    }
  }

  private startTimer(item: NotificationItem): void {
    this.clearTimer(item.id);
    if (item.duration === null) return; // sticky
    const timer: Timer = {
      handle: null,
      remaining: item.duration,
      startedAt: Date.now(),
      paused: false,
    };
    timer.handle = setTimeout(() => this.dismiss(item.id), item.duration);
    this.timers.set(item.id, timer);
  }

  private clearTimer(id: string): void {
    const timer = this.timers.get(id);
    if (timer?.handle) clearTimeout(timer.handle);
    this.timers.delete(id);
  }

  /**
   * If the exit animation never reports back (card unmounted by a screen
   * transition, reduced-motion, web), remove the item anyway so the slot frees
   * up and queued notifications keep flowing.
   */
  private scheduleReap(id: string): void {
    const handle = setTimeout(() => {
      this.timers.delete(id);
      const changes = this.queue.remove(id);
      if (changes.length === 0) return;
      this.applyChanges(changes);
      this.emit();
    }, EXIT_GRACE_MS);
    this.timers.set(id, {
      handle,
      remaining: EXIT_GRACE_MS,
      startedAt: Date.now(),
      paused: false,
    });
  }
}

export const NotificationManager = new Manager();

/** Show a notification card. Returns its id (usable with `dismiss`). */
export function notify(input: NotificationInput): string {
  return NotificationManager.show(input);
}

export const dismissNotification = NotificationManager.dismiss;
export const dismissAllNotifications = NotificationManager.dismissAll;
