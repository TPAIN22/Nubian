/**
 * NotificationQueue — pure, framework-free queue state.
 *
 * Single responsibility: decide *which* notifications are on screen and in what
 * order. It owns no timers, no haptics, no React. `NotificationManager` layers
 * scheduling and side effects on top. Keeping this pure makes the stacking /
 * dedupe / overflow rules unit-testable without a renderer.
 *
 * Rules:
 *  - At most MAX_VISIBLE cards are mounted; the rest wait in `pending`.
 *  - Higher priority jumps the pending line (stable within the same priority).
 *  - Same `dedupeKey` never stacks twice — it refreshes the existing entry.
 *  - `pending` is bounded so a runaway loop can't grow memory without limit.
 */

import type { NotificationItem, NotificationPriority } from './types';

export const MAX_VISIBLE = 3;
export const MAX_PENDING = 12;

const PRIORITY_RANK: Record<NotificationPriority, number> = {
  low: 0,
  normal: 1,
  high: 2,
  critical: 3,
};

export type QueueChange =
  /** Item is on screen now and its dismiss timer should be running. */
  | { type: 'shown'; item: NotificationItem }
  /** Existing card was refreshed in place (dedupe hit). */
  | { type: 'refreshed'; item: NotificationItem }
  /** Item is parked; no timer should run until it is promoted. */
  | { type: 'queued'; item: NotificationItem }
  /** Item started its exit animation. */
  | { type: 'exiting'; item: NotificationItem }
  /** Item left the tree entirely. */
  | { type: 'removed'; item: NotificationItem };

export class NotificationQueue {
  private visible: NotificationItem[] = [];
  private pending: NotificationItem[] = [];

  /** Stable snapshot — identity only changes when the visible list changes. */
  getVisible(): NotificationItem[] {
    return this.visible;
  }

  getPendingCount(): number {
    return this.pending.length;
  }

  find(id: string): NotificationItem | undefined {
    return (
      this.visible.find((n) => n.id === id) ?? this.pending.find((n) => n.id === id)
    );
  }

  isVisible(id: string): boolean {
    return this.visible.some((n) => n.id === id && !n.exiting);
  }

  /**
   * Add an item. Returns the changes the caller must react to (start a timer,
   * fire haptics, …) so side effects stay outside this class.
   */
  push(item: NotificationItem): QueueChange[] {
    const duplicate =
      this.visible.find((n) => n.dedupeKey === item.dedupeKey && !n.exiting) ??
      this.pending.find((n) => n.dedupeKey === item.dedupeKey);

    if (duplicate) {
      // Refresh in place: keep the id/position so the card doesn't remount and
      // the stack doesn't reshuffle under the user's thumb.
      const refreshed: NotificationItem = {
        ...duplicate,
        ...item,
        id: duplicate.id,
        createdAt: duplicate.createdAt,
        revision: duplicate.revision + 1,
        exiting: false,
      };
      this.replace(refreshed);
      return [{ type: 'refreshed', item: refreshed }];
    }

    if (this.visible.length < MAX_VISIBLE) {
      this.visible = [item, ...this.visible];
      return [{ type: 'shown', item }];
    }

    // Full: park it. Critical items are allowed to displace the oldest
    // low-priority card so an urgent message is never stuck behind chatter.
    const displaceable = [...this.visible]
      .reverse()
      .find((n) => !n.exiting && PRIORITY_RANK[n.priority] < PRIORITY_RANK[item.priority]);

    if (item.priority === 'critical' && displaceable) {
      const changes = this.markExiting(displaceable.id);
      this.insertPending(item);
      return [...changes, { type: 'queued', item }];
    }

    this.insertPending(item);
    return [{ type: 'queued', item }];
  }

  /** Begin the exit animation for an item (or drop it outright if pending). */
  markExiting(id: string): QueueChange[] {
    const pendingIndex = this.pending.findIndex((n) => n.id === id);
    if (pendingIndex >= 0) {
      const [dropped] = this.pending.splice(pendingIndex, 1);
      this.pending = [...this.pending];
      return dropped ? [{ type: 'removed', item: dropped }] : [];
    }

    const current = this.visible.find((n) => n.id === id);
    if (!current || current.exiting) return [];

    const exiting = { ...current, exiting: true };
    this.replace(exiting);
    return [{ type: 'exiting', item: exiting }];
  }

  /** Unmount an item and promote whatever was waiting behind it. */
  remove(id: string): QueueChange[] {
    const index = this.visible.findIndex((n) => n.id === id);
    if (index < 0) return this.markExiting(id);

    const [removed] = this.visible.splice(index, 1);
    this.visible = [...this.visible];
    const changes: QueueChange[] = removed
      ? [{ type: 'removed', item: removed }]
      : [];

    return [...changes, ...this.promote()];
  }

  /** Start dismissing everything currently on screen. */
  clear(): QueueChange[] {
    const dropped = this.pending;
    this.pending = [];
    const changes: QueueChange[] = dropped.map((item) => ({ type: 'removed', item }));
    for (const item of [...this.visible]) {
      changes.push(...this.markExiting(item.id));
    }
    return changes;
  }

  /** Replace an item's data in whichever list holds it. */
  update(item: NotificationItem): void {
    this.replace(item);
  }

  // -- internals -------------------------------------------------------------

  private promote(): QueueChange[] {
    const changes: QueueChange[] = [];
    while (this.visible.length < MAX_VISIBLE && this.pending.length > 0) {
      const next = this.pending.shift();
      this.pending = [...this.pending];
      if (!next) break;
      this.visible = [next, ...this.visible];
      changes.push({ type: 'shown', item: next });
    }
    return changes;
  }

  private insertPending(item: NotificationItem): void {
    const rank = PRIORITY_RANK[item.priority];
    const at = this.pending.findIndex((n) => PRIORITY_RANK[n.priority] < rank);
    const next = [...this.pending];
    if (at < 0) next.push(item);
    else next.splice(at, 0, item);
    // Bound the backlog by dropping the least important tail entries.
    this.pending = next.slice(0, MAX_PENDING);
  }

  private replace(item: NotificationItem): void {
    const visibleIndex = this.visible.findIndex((n) => n.id === item.id);
    if (visibleIndex >= 0) {
      const next = [...this.visible];
      next[visibleIndex] = item;
      this.visible = next;
      return;
    }
    const pendingIndex = this.pending.findIndex((n) => n.id === item.id);
    if (pendingIndex >= 0) {
      const next = [...this.pending];
      next[pendingIndex] = item;
      this.pending = next;
    }
  }
}
