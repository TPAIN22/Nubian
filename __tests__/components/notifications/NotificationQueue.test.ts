import {
  MAX_VISIBLE,
  NotificationQueue,
} from '@/components/notifications/NotificationQueue';
import type {
  NotificationItem,
  NotificationPriority,
  NotificationVariant,
} from '@/components/notifications/types';

let counter = 0;

function makeItem(
  overrides: Partial<NotificationItem> & { title: string }
): NotificationItem {
  counter += 1;
  const variant: NotificationVariant = overrides.variant ?? 'info';
  const priority: NotificationPriority = overrides.priority ?? 'normal';
  return {
    id: `id_${counter}`,
    dedupeKey: `${variant}|${overrides.title}`,
    variant,
    priority,
    title: overrides.title,
    duration: 4000,
    dismissible: true,
    haptics: true,
    createdAt: Date.now(),
    revision: 0,
    exiting: false,
    ...overrides,
  };
}

describe('NotificationQueue', () => {
  beforeEach(() => {
    counter = 0;
  });

  it('shows the first notification immediately, newest first', () => {
    const queue = new NotificationQueue();
    queue.push(makeItem({ title: 'first' }));
    queue.push(makeItem({ title: 'second' }));

    expect(queue.getVisible().map((n) => n.title)).toEqual(['second', 'first']);
  });

  it('caps the visible stack and parks the overflow', () => {
    const queue = new NotificationQueue();
    for (let i = 0; i < MAX_VISIBLE + 2; i += 1) {
      queue.push(makeItem({ title: `n${i}` }));
    }

    expect(queue.getVisible()).toHaveLength(MAX_VISIBLE);
    expect(queue.getPendingCount()).toBe(2);
  });

  it('promotes a queued notification when a visible one is removed', () => {
    const queue = new NotificationQueue();
    const items = Array.from({ length: MAX_VISIBLE + 1 }, (_, i) =>
      makeItem({ title: `n${i}` })
    );
    items.forEach((item) => queue.push(item));

    const oldest = queue.getVisible()[queue.getVisible().length - 1]!;
    const changes = queue.remove(oldest.id);

    expect(queue.getVisible()).toHaveLength(MAX_VISIBLE);
    expect(queue.getPendingCount()).toBe(0);
    expect(changes.some((c) => c.type === 'shown')).toBe(true);
  });

  it('collapses duplicates instead of stacking them', () => {
    const queue = new NotificationQueue();
    queue.push(makeItem({ title: 'Added to cart' }));
    const changes = queue.push(makeItem({ title: 'Added to cart' }));

    expect(queue.getVisible()).toHaveLength(1);
    expect(changes[0]?.type).toBe('refreshed');
    expect(queue.getVisible()[0]?.revision).toBe(1);
  });

  it('keeps a refreshed duplicate in its original position', () => {
    const queue = new NotificationQueue();
    queue.push(makeItem({ title: 'older' }));
    queue.push(makeItem({ title: 'newer' }));
    queue.push(makeItem({ title: 'older' }));

    expect(queue.getVisible().map((n) => n.title)).toEqual(['newer', 'older']);
  });

  it('lets a critical notification displace low-priority chatter when full', () => {
    const queue = new NotificationQueue();
    for (let i = 0; i < MAX_VISIBLE; i += 1) {
      queue.push(makeItem({ title: `low${i}`, priority: 'low' }));
    }

    queue.push(makeItem({ title: 'critical', priority: 'critical' }));

    // Oldest low-priority card starts leaving to make room.
    expect(queue.getVisible().filter((n) => n.exiting)).toHaveLength(1);
    expect(queue.getVisible().find((n) => n.exiting)?.title).toBe('low0');
  });

  it('orders the pending line by priority', () => {
    const queue = new NotificationQueue();
    for (let i = 0; i < MAX_VISIBLE; i += 1) {
      queue.push(makeItem({ title: `visible${i}` }));
    }
    queue.push(makeItem({ title: 'lowQueued', priority: 'low' }));
    queue.push(makeItem({ title: 'highQueued', priority: 'high' }));

    const oldest = queue.getVisible()[MAX_VISIBLE - 1]!;
    queue.remove(oldest.id);

    expect(queue.getVisible()[0]?.title).toBe('highQueued');
  });

  it('marks a visible item as exiting rather than dropping it outright', () => {
    const queue = new NotificationQueue();
    const item = makeItem({ title: 'bye' });
    queue.push(item);

    const changes = queue.markExiting(item.id);

    expect(changes[0]?.type).toBe('exiting');
    expect(queue.getVisible()).toHaveLength(1);
    expect(queue.isVisible(item.id)).toBe(false);
  });

  it('drops a pending item immediately when dismissed', () => {
    const queue = new NotificationQueue();
    for (let i = 0; i < MAX_VISIBLE; i += 1) {
      queue.push(makeItem({ title: `n${i}` }));
    }
    const parked = makeItem({ title: 'parked' });
    queue.push(parked);

    const changes = queue.markExiting(parked.id);

    expect(changes[0]?.type).toBe('removed');
    expect(queue.getPendingCount()).toBe(0);
  });

  it('clear() empties the backlog and dismisses everything on screen', () => {
    const queue = new NotificationQueue();
    for (let i = 0; i < MAX_VISIBLE + 2; i += 1) {
      queue.push(makeItem({ title: `n${i}` }));
    }

    queue.clear();

    expect(queue.getPendingCount()).toBe(0);
    expect(queue.getVisible().every((n) => n.exiting)).toBe(true);
  });

  it('returns a stable snapshot reference when nothing changed', () => {
    const queue = new NotificationQueue();
    queue.push(makeItem({ title: 'stable' }));

    expect(queue.getVisible()).toBe(queue.getVisible());
  });
});
