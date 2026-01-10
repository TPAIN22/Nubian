import Constants from 'expo-constants';

// API base URL
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'https://nubian-lne4.onrender.com';

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
  status: 'pending' | 'sent' | 'failed' | 'delivered';
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

/**
 * Get notifications for current user
 * @param options Query options for notifications
 * @param authToken Optional auth token (if not provided, request will be unauthenticated)
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
    const token = authToken || null;
    const { limit = 50, offset = 0, category, isRead, type } = options;

    const params = new URLSearchParams({
      limit: limit.toString(),
      offset: offset.toString(),
    });
    if (category) params.append('category', category);
    if (isRead !== undefined) params.append('isRead', isRead.toString());
    if (type) params.append('type', type);

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}/api/notifications?${params.toString()}`, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Failed to fetch notifications' }));
      throw new Error(errorData.message || 'Failed to fetch notifications');
    }

    const data = await response.json();
    return data.data || { notifications: [], total: 0, limit, offset };
  } catch (error) {
    console.error('Error fetching notifications:', error);
    throw error;
  }
}

/**
 * Get unread notification count
 * @param category Optional category filter
 * @param authToken Optional auth token (if not provided, request will be unauthenticated)
 */
export async function getUnreadCount(category?: string, authToken?: string | null): Promise<number> {
  try {
    const token = authToken || null;
    const params = new URLSearchParams();
    if (category) params.append('category', category);

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}/api/notifications/unread?${params.toString()}`, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      throw new Error('Failed to fetch unread count');
    }

    const data = await response.json();
    return data.data?.count || 0;
  } catch (error) {
    console.error('Error fetching unread count:', error);
    return 0;
  }
}

/**
 * Mark notification as read
 * @param notificationId ID of the notification to mark as read
 * @param authToken Required auth token
 */
export async function markAsRead(notificationId: string, authToken: string): Promise<Notification | null> {
  try {
    if (!authToken) {
      throw new Error('Authentication required');
    }

    const response = await fetch(`${API_BASE_URL}/api/notifications/${notificationId}/read`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Failed to mark as read' }));
      throw new Error(errorData.message || 'Failed to mark as read');
    }

    const data = await response.json();
    return data.data || null;
  } catch (error) {
    console.error('Error marking notification as read:', error);
    throw error;
  }
}

/**
 * Mark multiple notifications as read
 * @param notificationIds Array of notification IDs to mark as read
 * @param authToken Required auth token
 */
export async function markMultipleAsRead(
  notificationIds: string[],
  authToken: string
): Promise<{ modifiedCount: number }> {
  try {
    if (!authToken) {
      throw new Error('Authentication required');
    }

    const response = await fetch(`${API_BASE_URL}/api/notifications/mark-read`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
      },
      body: JSON.stringify({ notificationIds }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Failed to mark as read' }));
      throw new Error(errorData.message || 'Failed to mark as read');
    }

    const data = await response.json();
    return data.data || { modifiedCount: 0 };
  } catch (error) {
    console.error('Error marking multiple notifications as read:', error);
    throw error;
  }
}

/**
 * Get notification preferences
 * @param authToken Required auth token
 */
export async function getPreferences(authToken: string): Promise<NotificationPreferences | null> {
  try {
    if (!authToken) {
      throw new Error('Authentication required');
    }

    const response = await fetch(`${API_BASE_URL}/api/notifications/preferences`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch preferences');
    }

    const data = await response.json();
    return data.data || null;
  } catch (error) {
    console.error('Error fetching preferences:', error);
    return null;
  }
}

/**
 * Update notification preferences
 * @param preferences Partial preferences to update
 * @param authToken Required auth token
 */
export async function updatePreferences(
  preferences: Partial<NotificationPreferences>,
  authToken: string
): Promise<NotificationPreferences | null> {
  try {
    if (!authToken) {
      throw new Error('Authentication required');
    }

    const response = await fetch(`${API_BASE_URL}/api/notifications/preferences`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
      },
      body: JSON.stringify(preferences),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Failed to update preferences' }));
      throw new Error(errorData.message || 'Failed to update preferences');
    }

    const data = await response.json();
    return data.data || null;
  } catch (error) {
    console.error('Error updating preferences:', error);
    throw error;
  }
}

/**
 * Send a test notification to the current user (for debugging)
 * @param authToken Required auth token
 */
export async function sendTestNotification(authToken: string): Promise<any> {
  try {
    if (!authToken) {
      throw new Error('Authentication required');
    }

    const response = await fetch(`${API_BASE_URL}/api/notifications/test`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Failed to send test notification' }));
      throw new Error(errorData.message || 'Failed to send test notification');
    }

    const data = await response.json();
    return data.data || null;
  } catch (error) {
    console.error('Error sending test notification:', error);
    throw error;
  }
}
