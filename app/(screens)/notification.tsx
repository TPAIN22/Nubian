import { useEffect, useState, useCallback } from "react";
import { View, FlatList, ActivityIndicator, StyleSheet, RefreshControl, TouchableOpacity } from "react-native";
import { Text } from "@/components/ui/text";
import { useUser, useAuth } from "@clerk/clerk-expo";
import { useRouter } from "expo-router";
import { useTheme } from "@/providers/ThemeProvider";
import {
  getNotifications,
  markAsRead,
  markMultipleAsRead,
  getUnreadCount,
  type Notification
} from "@/utils/notificationService";
import { Ionicons } from "@expo/vector-icons";

const NotificationsScreen = () => {
  const { theme } = useTheme();
  const Colors = theme.colors;
  const { user } = useUser();
  const { getToken } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const router = useRouter();

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const token = await getToken();

      if (!token && !user) {
        setNotifications([]);
        return;
      }

      // Simplified: Just fetch all notifications, backend will filter based on preferences
      const options: {
        limit?: number;
        offset?: number;
      } = {
        limit: 50,
        offset: 0,
      };

      const result = await getNotifications(options, token);
      setNotifications(result.notifications || []);

      // Fetch unread count (all categories)
      const count = await getUnreadCount(undefined, token);
      setUnreadCount(count);
    } catch {
      setNotifications([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [user]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchNotifications();
  }, []);

  const handleNotificationPress = async (notification: Notification) => {
    try {
      // Mark as read if unread
      if (!notification.isRead) {
        const token = await getToken();
        if (token) {
          try {
            await markAsRead(notification._id, token);
            // Update local state
            setNotifications(prev =>
              prev.map(n =>
                n._id === notification._id ? { ...n, isRead: true } : n
              )
            );
            setUnreadCount(prev => Math.max(0, prev - 1));
          } catch (error) {
            console.error('Error marking notification as read:', error);
          }
        }
      }

      // Handle deep link
      if (notification.deepLink) {
        // Parse deep link and navigate
        const url = notification.deepLink.startsWith('/')
          ? notification.deepLink
          : `/${notification.deepLink}`;

        // Navigate using router
        if (url.startsWith('/orders/')) {
          router.push(`/(tabs)/orders/${url.split('/orders/')[1]}`);
        } else if (url.startsWith('/products/')) {
          router.push(`/(tabs)/products/${url.split('/products/')[1]}`);
        } else if (url.startsWith('/cart')) {
          router.push('/(tabs)/cart');
        } else {
          router.push(url as any);
        }
      }
    } catch (error) {
      console.error('Error handling notification press:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const token = await getToken();
      if (!token) return;

      const unreadNotifications = notifications.filter(n => !n.isRead);
      if (unreadNotifications.length === 0) return;

      await markMultipleAsRead(
        unreadNotifications.map(n => n._id),
        token
      );

      // Update local state
      setNotifications(prev =>
        prev.map(n => ({ ...n, isRead: true }))
      );
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'transactional':
        return 'receipt-outline';
      case 'merchant_alerts':
        return 'storefront-outline';
      case 'behavioral':
        return 'heart-outline';
      case 'marketing':
        return 'megaphone-outline';
      default:
        return 'notifications-outline';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'transactional':
        return '#007AFF';
      case 'merchant_alerts':
        return '#FF9500';
      case 'behavioral':
        return '#FF3B30';
      case 'marketing':
        return '#34C759';
      default:
        return Colors.text.gray;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (seconds < 60) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: Colors.surface }]}>
      {/* Header with filters */}
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: Colors.text.primary }]}>
          Notifications
          {unreadCount > 0 && (
            <Text style={[styles.badge, { backgroundColor: Colors.primary }]}>
              {unreadCount}
            </Text>
          )}
        </Text>
        <View style={styles.headerActions}>
          {unreadCount > 0 && (
            <TouchableOpacity onPress={handleMarkAllAsRead} style={styles.headerButton}>
              <Text style={[styles.markAllButton, { color: Colors.primary }]}>
                Mark all read
              </Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            onPress={() => router.push('/(screens)/notificationPreferences')}
            style={styles.headerButton}
          >
            <Ionicons name="settings-outline" size={24} color={Colors.primary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Notifications list - Simplified: no filters, backend handles categorization */}
      <FlatList
        data={notifications}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => handleNotificationPress(item)}
            style={[
              styles.notificationItem,
              {
                backgroundColor: Colors.cardBackground,
                borderLeftColor: getCategoryColor(item.category),
                borderLeftWidth: item.isRead ? 0 : 3,
                opacity: item.isRead ? 0.7 : 1,
              },
            ]}
          >
            <View style={styles.notificationContent}>
              <View style={styles.notificationHeader}>
                <Ionicons
                  name={getCategoryIcon(item.category) as any}
                  size={20}
                  color={getCategoryColor(item.category)}
                  style={styles.categoryIcon}
                />
                <Text
                  style={[styles.title, { color: Colors.text.primary }]}
                  numberOfLines={1}
                >
                  {item.title}
                </Text>
                {!item.isRead && (
                  <View style={[styles.unreadDot, { backgroundColor: Colors.primary }]} />
                )}
              </View>
              <Text
                style={[styles.body, { color: Colors.text.secondary }]}
                numberOfLines={2}
              >
                {item.body}
              </Text>
              <View style={styles.notificationFooter}>
                <Text
                  style={[styles.date, { color: Colors.text.tertiary }]}
                >
                  {formatDate(item.sentAt || item.createdAt)}
                </Text>
                {item.deepLink && (
                  <Ionicons
                    name="chevron-forward-outline"
                    size={16}
                    color={Colors.text.tertiary}
                  />
                )}
              </View>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons
              name="notifications-off-outline"
              size={64}
              color={Colors.text.tertiary}
            />
            <Text style={[styles.emptyText, { color: Colors.text.tertiary }]}>
              No notifications
            </Text>
          </View>
        }
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={
          notifications.length === 0 ? styles.emptyList : undefined
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    lineHeight: 38,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  headerButton: {
    padding: 4,
  },
  badge: {
    marginLeft: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    fontSize: 12,
    color: "#FFFFFF",
    overflow: "hidden",
  },
  markAllButton: {
    fontSize: 14,
    fontWeight: "600",
    lineHeight: 28,
  },
  notificationItem: {
    padding: 16,
    marginBottom: 12,
    borderRadius: 12,
    borderLeftWidth: 3,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  notificationContent: {
    flex: 1,
  },
  notificationHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  categoryIcon: {
    marginRight: 8,
  },
  title: {
    flex: 1,
    fontSize: 16,
    fontWeight: "600",
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: 8,
  },
  body: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  notificationFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  date: {
    fontSize: 12,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 100,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
  },
  emptyList: {
    flexGrow: 1,
  },
});

export default NotificationsScreen;
