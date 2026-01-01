import React, { useEffect, useState, useCallback } from "react";
import { View, FlatList, ActivityIndicator, StyleSheet, RefreshControl, SafeAreaView } from "react-native";
import { Text } from "@/components/ui/text";
import { useUser } from "@clerk/clerk-expo";
import * as Notifications from "expo-notifications";
import { Stack, useRouter } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { useTheme } from "@/providers/ThemeProvider";

interface NotificationItem {
  _id: string;
  title: string;
  body: string;
  createdAt: string;
}

const NotificationsScreen = () => {
  const { theme } = useTheme();
  const Colors = theme.colors;
  const { user } = useUser();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();

  const fetchNotifications = async () => {
  try {
    setLoading(true);
    const userId = user?.id;

    let deviceId = null;
    if (!userId) {
      const device = await Notifications.getDevicePushTokenAsync();
      deviceId = device?.data;
    }

    if (!userId && !deviceId) {
      setNotifications([]);
      return;
    }

    const url = userId
      ? `https://nubian-lne4.onrender.com/api/notifications/user?userId=${userId}`
      : `https://nubian-lne4.onrender.com/api/notifications/user?deviceId=${deviceId}`;

    const res = await fetch(url);

    if (!res.ok) {
      const errorText = await res.text();
      setNotifications([]);
      return;
    }

    const text = await res.text();

    const data = JSON.parse(text);
    setNotifications(data.notifications || []);
  } catch (error) {
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
  }, [user]);

  if (loading && !refreshing) {
    return <ActivityIndicator size="large" style={styles.loader} />;
  }

  return (
    <SafeAreaProvider >
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.surface }}>
    <View style={[styles.container, { backgroundColor: Colors.surface }]}>
      <FlatList
        data={notifications}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => (
          <View style={[styles.notificationItem, { backgroundColor: Colors.cardBackground }]}>
            <Text style={[styles.title, { color: Colors.text.gray }]}>{item.title}</Text>
            <Text style={[styles.body, { color: Colors.text.veryLightGray }]}>{item.body}</Text>
            <Text style={[styles.date, { color: Colors.text.veryLightGray }]}>{new Date(item.createdAt).toLocaleString()}</Text>
          </View>
        )}
        ListEmptyComponent={<Text style={{ color: Colors.text.veryLightGray }}>لا توجد إشعارات حالياً.</Text>}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        />
    </View>
    </SafeAreaView>
    </SafeAreaProvider>
  );
};

const styles = StyleSheet.create({
  loader: { flex: 1, justifyContent: "center", alignItems: "center" },
  container: { flex: 1, padding: 12, paddingTop:32},
  notificationItem: {
    padding: 15,
    marginBottom: 10,
    borderRadius: 10,
    elevation: 2,
  },
  title: { fontWeight: "bold", fontSize: 16 },
  body: { marginTop: 5 },
  date: { marginTop: 5, fontSize: 12 },
});

export default NotificationsScreen;
