import { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, ActivityIndicator, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@clerk/clerk-expo';
import { useTicketStore } from '@/store/useTicketStore';

export default function SupportScreen() {
  const router = useRouter();
  const { getToken, isLoaded, isSignedIn } = useAuth();

  // Granular selectors to prevent unnecessary re-renders
  const tickets = useTicketStore((state) => state.tickets);
  const fetchTickets = useTicketStore((state) => state.fetchTickets);
  const isLoading = useTicketStore((state) => state.isLoading);

  const [refreshing, setRefreshing] = useState(false);

  // Effect to load tickets when auth is ready
  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;

    let isMounted = true;

    const init = async () => {
      try {
        console.log("Fetching tickets...");
        const token = await getToken();
        if (token && isMounted) {
          await fetchTickets(token);
        }
      } catch (err) {
        if (isMounted) console.error("Failed to load tickets", err);
      }
    };

    init();

    return () => { isMounted = false; };
  }, [isLoaded, isSignedIn]); // Only re-run if auth state changes

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      const token = await getToken();
      if (token) {
        await fetchTickets(token);
      }
    } catch (err) {
      console.error("Failed to refresh", err);
    }
    setRefreshing(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return '#3b82f6'; // blue
      case 'resolved_refund':
      case 'resolved_rejected':
      case 'closed': return '#22c55e'; // green
      case 'under_review':
      case 'waiting_customer': return '#f59e0b'; // orange
      case 'escalated': return '#ef4444'; // red
      default: return '#6b7280'; // gray
    }
  };

  const formatStatus = (status: string) => {
    return status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const renderItem = useCallback(({ item }: { item: any }) => (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.7}
      onPress={() => router.push(`/(screens)/support/${item._id}`)}
    >
      <View style={styles.cardHeader}>
        <Text style={styles.ticketId}>{item.ticketNumber}</Text>
        <View style={[styles.badge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
          <Text style={[styles.badgeText, { color: getStatusColor(item.status) }]}>
            {formatStatus(item.status)}
          </Text>
        </View>
      </View>

      <View style={styles.cardRow}>
        <Text style={styles.label}>Subject:</Text>
        <Text style={styles.value} numberOfLines={1}>{item.subject}</Text>
      </View>

      <View style={styles.cardRow}>
        <Text style={styles.label}>Category:</Text>
        <Text style={styles.value}>{formatStatus(item.category)}</Text>
      </View>

      <View style={styles.cardRow}>
        <Text style={styles.label}>Created:</Text>
        <Text style={styles.value}>
          {item.createdAt ? new Date(item.createdAt).toLocaleDateString('ar-EG') : 'N/A'}
        </Text>
      </View>
    </TouchableOpacity>
  ), [router]);

  if (!isLoaded) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color="#000" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={tickets || []}
        keyExtractor={(item) => item._id}
        renderItem={renderItem}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListHeaderComponent={
          <>
            <TouchableOpacity
              style={styles.createButton}
              onPress={() => router.push('/(screens)/support/create')}
            >
              <Text style={styles.createButtonText}>Open New Ticket</Text>
            </TouchableOpacity>
            <Text style={styles.sectionTitle}>Your Tickets</Text>
          </>
        }
        ListEmptyComponent={
          isLoading && !refreshing ? (
            <ActivityIndicator size="small" color="#000" style={{ marginTop: 20 }} />
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>No tickets found.</Text>
            </View>
          )
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  createButton: {
    backgroundColor: '#000',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 24,
  },
  createButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#111827',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  ticketId: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#111827',
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  cardRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  label: {
    fontSize: 14,
    color: '#6b7280',
    width: 80,
  },
  value: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
    flex: 1,
  },
  emptyState: {
    padding: 20,
    alignItems: 'center',
  },
  emptyStateText: {
    color: '#6b7280',
    fontSize: 16,
  },
});
