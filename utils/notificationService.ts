// Notification HTTP layer.
//
// All requests go through the shared `apiClient` (services/api/client.ts) so they
// inherit the Clerk bearer token, x-currency/x-country headers, timeout, and the
// custom fetch adapter. `apiClient`'s baseURL already ends in `/api/`, so paths
// are passed WITHOUT a leading slash (e.g. "notifications" -> /api/notifications).
//
// Responses are read defensively as `res.data?.data ?? res.data` so this module is
// correct whether or not a response interceptor unwraps the backend's
// `{ success, data, meta }` envelope. The `authToken` parameters are kept for
// backward compatibility with existing callers but are now optional — the request
// interceptor attaches the token automatically. When a token is explicitly passed
// it overrides the interceptor's Authorization header.
import apiClient from "@/services/api/client";

export interface Notification {
  _id: string;
  id: string;
  type: string;
  recipientType: 'user' | 'merchant' | 'admin';
  title: string;
  body: string;
  deepLink?: string;
  metadata?: Record<string, any>;
  channel: 'push' | 'in_app' | 'sms' | 'email';
  isRead: boolean;
  sentAt: string;
  expiresAt?: string;
  status: 'pending' | 'queued' | 'retrying' | 'sent' | 'failed' | 'delivered';
  category: 'transactional' | 'merchant_alerts' | 'behavioral' | 'marketing' | 'system';
  priority: number;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationPreferences {
  channels: {
    push: boolean;
    in_app: boolean;
    sms: boolean;
    email: boolean;
  };
  types: Record<string, {
    enabled: boolean;
    channels: {
      push?: boolean;
      in_app?: boolean;
      sms?: boolean;
      email?: boolean;
    };
  }>;
  quietHours: {
    enabled: boolean;
    start: string;
    end: string;
    timezone: string;
  };
  rateLimiting: {
    enabled: boolean;
    maxPerHour: number;
    maxPerDay: number;
  };
  antiSpam: {
    enabled: boolean;
    minIntervalBetweenSameType: number;
  };
}

// Unwrap the backend envelope defensively: works whether the response is the raw
// `{ success, data, meta }` shape or has already been unwrapped to just `data`.
function unwrap<T = any>(res: { data?: any }): T {
  return (res?.data?.data ?? res?.data) as T;
}

// Build a per-request config that overrides the Authorization header only when an
// explicit token is supplied. Without an explicit token we let the request
// interceptor attach the current Clerk token.
function authConfig(authToken?: string | null) {
  return authToken
    ? { headers: { Authorization: `Bearer ${authToken}` } }
    : undefined;
}

/**
 * Get notifications for current user
 * @param options Query options for notifications
 * @param authToken Optional auth token (interceptor attaches one automatically;
 *                   pass this only to override).
 */
export async function getNotifications(
  options: {
    limit?: number;
    offset?: number;
    category?: string;
    isRead?: boolean;
    type?: string;
  } = {},
  authToken?: string | null
): Promise<{ notifications: Notification[]; total: number; limit: number; offset: number }> {
  try {
    const { limit = 50, offset = 0, category, isRead, type } = options;

    const res = await apiClient.get("notifications", {
      params: {
        limit,
        offset,
        category,
        isRead: isRead !== undefined ? isRead : undefined,
        type,
      },
      ...authConfig(authToken),
    });

    const data = unwrap(res);
    return data || { notifications: [], total: 0, limit, offset };
  } catch (error) {
    throw error;
  }
}

/**
 * Get unread notification count
 * @param category Optional category filter
 * @param authToken Optional auth token (interceptor attaches one automatically).
 */
export async function getUnreadCount(category?: string, authToken?: string | null): Promise<number> {
  try {
    const res = await apiClient.get("notifications/unread", {
      params: { category },
      ...authConfig(authToken),
    });

    return unwrap<{ count?: number }>(res)?.count || 0;
  } catch (error) {
    console.error('Error fetching unread count:', error);
    return 0;
  }
}

/**
 * Mark notification as read
 * @param notificationId ID of the notification to mark as read
 * @param authToken Optional auth token (interceptor attaches one automatically).
 */
export async function markAsRead(notificationId: string, authToken?: string | null): Promise<Notification | null> {
  try {
    const res = await apiClient.patch(
      `notifications/${notificationId}/read`,
      undefined,
      authConfig(authToken)
    );

    return unwrap<Notification>(res) || null;
  } catch (error) {
    console.error('Error marking notification as read:', error);
    throw error;
  }
}

/**
 * Mark multiple notifications as read
 * @param notificationIds Array of notification IDs to mark as read
 * @param authToken Optional auth token (interceptor attaches one automatically).
 */
export async function markMultipleAsRead(
  notificationIds: string[],
  authToken?: string | null
): Promise<{ modifiedCount: number }> {
  try {
    const res = await apiClient.post(
      "notifications/mark-read",
      { notificationIds },
      authConfig(authToken)
    );

    const data = unwrap<{ modifiedCount?: number }>(res);
    return { modifiedCount: data?.modifiedCount ?? 0 };
  } catch (error) {
    console.error('Error marking multiple notifications as read:', error);
    throw error;
  }
}

/**
 * Get notification preferences
 * @param authToken Optional auth token (interceptor attaches one automatically).
 */
export async function getPreferences(authToken?: string | null): Promise<NotificationPreferences | null> {
  try {
    const res = await apiClient.get("notifications/preferences", authConfig(authToken));

    return unwrap<NotificationPreferences>(res) || null;
  } catch (error) {
    return null;
  }
}

/**
 * Update notification preferences
 * @param preferences Partial preferences to update
 * @param authToken Optional auth token (interceptor attaches one automatically).
 */
export async function updatePreferences(
  preferences: Partial<NotificationPreferences>,
  authToken?: string | null
): Promise<NotificationPreferences | null> {
  try {
    const res = await apiClient.put(
      "notifications/preferences",
      preferences,
      authConfig(authToken)
    );

    return unwrap<NotificationPreferences>(res) || null;
  } catch (error) {
    throw error;
  }
}

/**
 * Send a test notification to the current user (for debugging)
 * @param authToken Optional auth token (interceptor attaches one automatically).
 */
export async function sendTestNotification(authToken?: string | null): Promise<any> {
  try {
    const res = await apiClient.post("notifications/test", undefined, authConfig(authToken));

    return unwrap(res) || null;
  } catch (error) {
    console.error('Error sending test notification:', error);
    throw error;
  }
}
