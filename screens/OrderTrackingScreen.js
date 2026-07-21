import Constants from 'expo-constants';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import OrderStatusBadge from '../components/OrderStatusBadge';
import api from '../services/api';
import { Colors, Radius, Shadows } from '../theme';

export default function OrderTrackingScreen({ navigation }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/orders')
      .then(res => setOrders(res.data.orders || []))
      .catch(console.log)
      .finally(() => setLoading(false));
  }, []);

  const renderOrder = ({ item }) => {
    const orderId = item._id?.slice(-6).toUpperCase() || 'XXXXXX';
    const date = item.createdAt
      ? new Date(item.createdAt).toLocaleDateString('en-IN', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        })
      : 'N/A';
    const total = item.total ? `Rs. ${item.total.toFixed(2)}` : 'N/A';
    const itemCount = item.items ? item.items.length : 0;
    const itemsSummary = item.items
      ? item.items.slice(0, 3).map(i => i.name).join(', ') + (item.items.length > 3 ? ' + more' : '')
      : 'No items';

    return (
      <TouchableOpacity
        style={styles.orderCard}
        activeOpacity={0.85}
        onPress={() => {
          // Navigate to order detail or tracking (if you have a screen)
          // navigation.navigate('OrderDetail', { order: item });
        }}
      >
        {/* Top row: Order ID and Status */}
        <View style={styles.topRow}>
          <View>
            <Text style={styles.orderId}>#{orderId}</Text>
            <Text style={styles.orderDate}>{date}</Text>
          </View>
          <OrderStatusBadge status={item.status} />
        </View>

        {/* Items summary */}
        <Text style={styles.itemsLine} numberOfLines={1}>
          {itemsSummary}
        </Text>

        {/* Bottom row: Total and Actions */}
        <View style={styles.bottomRow}>
          <Text style={styles.orderTotal}>{total}</Text>
          <View style={styles.actions}>
            {item.status !== 'delivered' && item.status !== 'cancelled' && (
              <TouchableOpacity
                style={styles.trackBtn}
                onPress={() => {
                  // Navigate to tracking screen
                  // navigation.navigate('Tracking', { orderId: item._id });
                }}
              >
                <Text style={styles.trackBtnText}>Track</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={styles.reorderBtn}
              onPress={() => {
                // Reorder logic (add items to cart)
              }}
            >
              <Text style={styles.reorderBtnText}>Reorder</Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={Colors.apricot} />
        <Text style={styles.loadingText}>Loading your orders...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation?.goBack()} style={styles.backButton}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My orders</Text>
        <View style={styles.headerRight} />
      </View>

      <FlatList
        data={orders}
        keyExtractor={item => item._id}
        renderItem={renderOrder}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>📋</Text>
            <Text style={styles.emptyTitle}>No orders yet</Text>
            <Text style={styles.emptySub}>
              Start shopping and your orders will appear here.
            </Text>
          </View>
        }
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.linen,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.linen,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: Colors.inkMuted,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Constants.statusBarHeight + 12,
    paddingHorizontal: 16,
    paddingBottom: 14,
    backgroundColor: Colors.apricot,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    ...Shadows.md,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backText: {
    fontSize: 20,
    color: Colors.white,
    fontWeight: '700',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.white,
    fontFamily: 'Sora-Bold',
  },
  headerRight: {
    width: 40,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 40,
  },
  orderCard: {
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.sm,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  orderId: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.ink,
    marginBottom: 2,
  },
  orderDate: {
    fontSize: 12,
    color: Colors.inkMuted,
  },
  itemsLine: {
    fontSize: 13,
    color: Colors.inkMuted,
    marginBottom: 12,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderTotal: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.ink,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  trackBtn: {
    backgroundColor: Colors.apricot,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
  },
  trackBtnText: {
    color: Colors.white,
    fontWeight: '700',
    fontSize: 12,
  },
  reorderBtn: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
  },
  reorderBtnText: {
    color: Colors.ink,
    fontWeight: '700',
    fontSize: 12,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
    marginTop: 100,
  },
  emptyIcon: {
    fontSize: 60,
    marginBottom: 16,
    color: Colors.border,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.ink,
    marginBottom: 8,
  },
  emptySub: {
    fontSize: 14,
    color: Colors.inkMuted,
    textAlign: 'center',
    lineHeight: 20,
  },
});