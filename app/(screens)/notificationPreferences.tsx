import React, { useEffect, useState } from "react";
import { View, StyleSheet, ScrollView, ActivityIndicator, Alert } from "react-native";
import { Text } from "@/components/ui/text";
import { useAuth } from "@clerk/clerk-expo";
import { Stack } from "expo-router";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "@/providers/ThemeProvider";
import { Switch } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { getPreferences, updatePreferences, type NotificationPreferences } from "@/utils/notificationService";

const NotificationPreferencesScreen = () => {
  const { theme } = useTheme();
  const Colors = theme.colors;
  const { getToken } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);

  // Simple toggle states - backend will auto-categorize
  const [recommendations, setRecommendations] = useState(true);
  const [offers, setOffers] = useState(true);
  const [orderUpdates, setOrderUpdates] = useState(true);
  const [merchantAlerts, setMerchantAlerts] = useState(true);
  const [pushEnabled, setPushEnabled] = useState(true);

  useEffect(() => {
    fetchPreferences();
  }, []);

  const fetchPreferences = async () => {
    try {
      setLoading(true);
      const token = await getToken();
      if (!token) {
        Alert.alert("Error", "Please log in to manage notification preferences");
        return;
      }

      if (!token) {
        Alert.alert("Error", "Please log in to manage notification preferences");
        return;
      }

      const prefs = await getPreferences(token);
      if (prefs) {
        setPreferences(prefs);
        
        // Map backend preferences to simple toggles
        // Backend automatically categorizes: behavioral = recommendations, marketing = offers
        const behaviorEnabled = prefs.types?.behavioral?.enabled !== false;
        const marketingEnabled = prefs.types?.marketing?.enabled !== false;
        const transactionalEnabled = prefs.types?.transactional?.enabled !== false;
        const merchantAlertsEnabled = prefs.types?.merchant_alerts?.enabled !== false;
        
        setRecommendations(behaviorEnabled);
        setOffers(marketingEnabled);
        setOrderUpdates(transactionalEnabled);
        setMerchantAlerts(merchantAlertsEnabled);
        setPushEnabled(prefs.channels?.push !== false);
      }
    } catch (error: any) {
      console.error("Error fetching preferences:", error);
      Alert.alert("Error", error.message || "Failed to load preferences");
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (
    toggleType: 'recommendations' | 'offers' | 'orderUpdates' | 'merchantAlerts' | 'push',
    value: boolean
  ) => {
    try {
      const token = await getToken();
      if (!token) {
        Alert.alert("Error", "Please log in to update preferences");
        return;
      }

      setSaving(true);

      // Update local state immediately for better UX
      switch (toggleType) {
        case 'recommendations':
          setRecommendations(value);
          break;
        case 'offers':
          setOffers(value);
          break;
        case 'orderUpdates':
          setOrderUpdates(value);
          break;
        case 'merchantAlerts':
          setMerchantAlerts(value);
          break;
        case 'push':
          setPushEnabled(value);
          break;
      }

      // Build simplified preferences object
      // Backend will automatically determine user/merchant and categorize
      const updatedPrefs: Partial<NotificationPreferences> = {
        channels: {
          push: toggleType === 'push' ? value : pushEnabled,
          in_app: true, // Always enabled for in-app
          sms: preferences?.channels?.sms || false,
          email: preferences?.channels?.email || false,
        },
        types: {
          // Backend auto-categorizes these based on notification type
          behavioral: {
            enabled: toggleType === 'recommendations' ? value : recommendations,
            channels: {
              push: toggleType === 'recommendations' ? value && pushEnabled : recommendations && pushEnabled,
              in_app: true,
            },
          },
          marketing: {
            enabled: toggleType === 'offers' ? value : offers,
            channels: {
              push: toggleType === 'offers' ? value && pushEnabled : offers && pushEnabled,
              in_app: true,
            },
          },
          transactional: {
            enabled: toggleType === 'orderUpdates' ? value : orderUpdates,
            channels: {
              push: toggleType === 'orderUpdates' ? value && pushEnabled : orderUpdates && pushEnabled,
              in_app: true,
            },
          },
          merchant_alerts: {
            enabled: toggleType === 'merchantAlerts' ? value : merchantAlerts,
            channels: {
              push: toggleType === 'merchantAlerts' ? value && pushEnabled : merchantAlerts && pushEnabled,
              in_app: true,
            },
          },
        },
      };

      // Update on backend - backend will auto-detect user/merchant and auto-categorize notifications
      const updated = await updatePreferences(updatedPrefs, token);
      if (updated) {
        setPreferences(updated);
        
        // Update local state from backend response
        const behaviorEnabled = updated.types?.behavioral?.enabled !== false;
        const marketingEnabled = updated.types?.marketing?.enabled !== false;
        const transactionalEnabled = updated.types?.transactional?.enabled !== false;
        const merchantAlertsEnabled = updated.types?.merchant_alerts?.enabled !== false;
        
        setRecommendations(behaviorEnabled);
        setOffers(marketingEnabled);
        setOrderUpdates(transactionalEnabled);
        setMerchantAlerts(merchantAlertsEnabled);
        setPushEnabled(updated.channels?.push !== false);
      }
    } catch (error: any) {
      console.error("Error updating preferences:", error);
      
      // Revert local state on error
      switch (toggleType) {
        case 'recommendations':
          setRecommendations(!value);
          break;
        case 'offers':
          setOffers(!value);
          break;
        case 'orderUpdates':
          setOrderUpdates(!value);
          break;
        case 'merchantAlerts':
          setMerchantAlerts(!value);
          break;
        case 'push':
          setPushEnabled(!value);
          break;
      }
      
      Alert.alert("Error", error.message || "Failed to update preferences");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaProvider>
        <SafeAreaView style={{ flex: 1, backgroundColor: Colors.surface }}>
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={[styles.loadingText, { color: Colors.text.secondary, marginTop: 16 }]}>
              Loading preferences...
            </Text>
          </View>
        </SafeAreaView>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <SafeAreaView style={{ flex: 1, backgroundColor: Colors.surface }}>
        <Stack.Screen
          options={{
            title: "Notification Preferences",
            headerStyle: {
              backgroundColor: Colors.surface,
            },
            headerTintColor: Colors.text.primary,
          }}
        />
        <ScrollView
          style={[styles.container, { backgroundColor: Colors.surface }]}
          contentContainerStyle={styles.content}
        >
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: Colors.text.primary }]}>
              Notification Types
            </Text>
            <Text style={[styles.sectionDescription, { color: Colors.text.secondary }]}>
              Choose what notifications you want to receive. The system will automatically send the right type to you.
            </Text>
          </View>

          {/* Push Notifications Toggle */}
          <View style={[styles.toggleCard, { backgroundColor: Colors.cardBackground }]}>
            <View style={styles.toggleHeader}>
              <View style={styles.toggleHeaderLeft}>
                <Ionicons name="notifications-outline" size={24} color={Colors.primary} />
                <View style={styles.toggleTextContainer}>
                  <Text style={[styles.toggleTitle, { color: Colors.text.primary }]}>
                    Push Notifications
                  </Text>
                  <Text style={[styles.toggleDescription, { color: Colors.text.secondary }]}>
                    Enable or disable all push notifications
                  </Text>
                </View>
              </View>
              <Switch
                value={pushEnabled}
                onValueChange={(value) => handleToggle('push', value)}
                disabled={saving}
                trackColor={{ false: Colors.text.tertiary, true: Colors.primary }}
                thumbColor="#FFFFFF"
              />
            </View>
          </View>

          {/* Recommendations Toggle */}
          <View style={[styles.toggleCard, { backgroundColor: Colors.cardBackground }]}>
            <View style={styles.toggleHeader}>
              <View style={styles.toggleHeaderLeft}>
                <Ionicons name="heart-outline" size={24} color="#FF3B30" />
                <View style={styles.toggleTextContainer}>
                  <Text style={[styles.toggleTitle, { color: Colors.text.primary }]}>
                    Recommendations
                  </Text>
                  <Text style={[styles.toggleDescription, { color: Colors.text.secondary }]}>
                    Personalized product recommendations
                  </Text>
                </View>
              </View>
              <Switch
                value={recommendations}
                onValueChange={(value) => handleToggle('recommendations', value)}
                disabled={saving || !pushEnabled}
                trackColor={{ false: Colors.text.tertiary, true: Colors.primary }}
                thumbColor="#FFFFFF"
              />
            </View>
          </View>

          {/* Offers Toggle */}
          <View style={[styles.toggleCard, { backgroundColor: Colors.cardBackground }]}>
            <View style={styles.toggleHeader}>
              <View style={styles.toggleHeaderLeft}>
                <Ionicons name="pricetag-outline" size={24} color="#34C759" />
                <View style={styles.toggleTextContainer}>
                  <Text style={[styles.toggleTitle, { color: Colors.text.primary }]}>
                    Offers & Promotions
                  </Text>
                  <Text style={[styles.toggleDescription, { color: Colors.text.secondary }]}>
                    Special deals, discounts, and promotional offers
                  </Text>
                </View>
              </View>
              <Switch
                value={offers}
                onValueChange={(value) => handleToggle('offers', value)}
                disabled={saving || !pushEnabled}
                trackColor={{ false: Colors.text.tertiary, true: Colors.primary }}
                thumbColor="#FFFFFF"
              />
            </View>
          </View>

          {/* Order Updates Toggle */}
          <View style={[styles.toggleCard, { backgroundColor: Colors.cardBackground }]}>
            <View style={styles.toggleHeader}>
              <View style={styles.toggleHeaderLeft}>
                <Ionicons name="receipt-outline" size={24} color="#007AFF" />
                <View style={styles.toggleTextContainer}>
                  <Text style={[styles.toggleTitle, { color: Colors.text.primary }]}>
                    Order Updates
                  </Text>
                  <Text style={[styles.toggleDescription, { color: Colors.text.secondary }]}>
                    Order confirmations, shipping updates, and delivery notifications
                  </Text>
                </View>
              </View>
              <Switch
                value={orderUpdates}
                onValueChange={(value) => handleToggle('orderUpdates', value)}
                disabled={saving || !pushEnabled}
                trackColor={{ false: Colors.text.tertiary, true: Colors.primary }}
                thumbColor="#FFFFFF"
              />
            </View>
          </View>

          {/* Merchant Alerts Toggle (only shown if user is a merchant) */}
          {preferences && (
            <View style={[styles.toggleCard, { backgroundColor: Colors.cardBackground }]}>
              <View style={styles.toggleHeader}>
                <View style={styles.toggleHeaderLeft}>
                  <Ionicons name="storefront-outline" size={24} color="#FF9500" />
                  <View style={styles.toggleTextContainer}>
                    <Text style={[styles.toggleTitle, { color: Colors.text.primary }]}>
                      Merchant Alerts
                    </Text>
                    <Text style={[styles.toggleDescription, { color: Colors.text.secondary }]}>
                      Store updates, inventory alerts, and merchant notifications
                    </Text>
                  </View>
                </View>
                <Switch
                  value={merchantAlerts}
                  onValueChange={(value) => handleToggle('merchantAlerts', value)}
                  disabled={saving || !pushEnabled}
                  trackColor={{ false: Colors.text.tertiary, true: Colors.primary }}
                  thumbColor="#FFFFFF"
                />
              </View>
            </View>
          )}

          {saving && (
            <View style={styles.savingIndicator}>
              <ActivityIndicator size="small" color={Colors.primary} />
              <Text style={[styles.savingText, { color: Colors.text.secondary }]}>
                Saving...
              </Text>
            </View>
          )}

          <View style={styles.footer}>
            <Text style={[styles.footerText, { color: Colors.text.tertiary }]}>
              The system will automatically determine if you're a merchant or customer and send the appropriate notifications.
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </SafeAreaProvider>
  );
};

const styles = StyleSheet.create({
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    fontSize: 14,
  },
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  toggleCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  toggleHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  toggleHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: 16,
  },
  toggleTextContainer: {
    marginLeft: 12,
    flex: 1,
  },
  toggleTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  toggleDescription: {
    fontSize: 13,
    lineHeight: 18,
  },
  savingIndicator: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 16,
    marginBottom: 8,
  },
  savingText: {
    marginLeft: 8,
    fontSize: 14,
  },
  footer: {
    marginTop: 24,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.1)",
  },
  footerText: {
    fontSize: 12,
    lineHeight: 18,
    textAlign: "center",
  },
});

export default NotificationPreferencesScreen;