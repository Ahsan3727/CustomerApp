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
import BottomTabBar from '../components/BottomTabBar';
import Card from '../components/Card';
import OrderStatusBadge from '../components/OrderStatusBadge';
import api from '../services/api';
import { Colors, Radius, Shadows } from '../theme';

export default function OrdersScreen({ navigation }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/orders')
      .then(res => setOrders(res.data || []))
      .catch(console.error)
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
    const total = item.payment?.amount
      ? `Rs. ${item.payment.amount.toFixed(2)}`
      : item.total
      ? `Rs. ${item.total.toFixed(2)}`
      : 'N/A';
    const itemCount = item.items?.length || 0;
    const itemsSummary = item.items
      ? item.items.slice(0, 3).map(i => i.name || i.product?.name).join(', ') + (item.items.length > 3 ? ' + more' : '')
      : '';

    return (
      <Card
        style={styles.orderCard}
        onPress={() => navigation.navigate('TrackOrder', { order: item })}
      >
        {/* Top row: Order ID & date + status badge */}
        <View style={styles.topRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.orderId}>#{orderId}</Text>
            <Text style={styles.orderDate}>{date}</Text>
          </View>
          <OrderStatusBadge status={item.status} />
        </View>

        {/* Items summary */}
        {itemsSummary ? (
          <Text style={styles.itemsLine} numberOfLines={1}>{itemsSummary}</Text>
        ) : (
          <Text style={styles.itemCount}>{itemCount} items</Text>
        )}

        {/* Bottom row: Total and actions */}
        <View style={styles.bottomRow}>
          <Text style={styles.orderTotal}>{total}</Text>
          <View style={styles.actions}>
            {item.status === 'out_for_delivery' && (
              <TouchableOpacity
                style={styles.trackBtn}
                onPress={() => navigation.navigate('TrackOrder', { order: item })}
              >
                <Text style={styles.trackBtnText}>Track</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={styles.reorderBtn}
              onPress={() => {
                // Add reorder logic if needed
              }}
            >
              <Text style={styles.reorderBtnText}>Reorder</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Card>
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
        <Text style={styles.headerTitle}>📋 My Orders</Text>
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

      <BottomTabBar navigation={navigation} activeScreen="Orders" />
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
    paddingTop: Constants.statusBarHeight + 16,
    paddingHorizontal: 16,
    paddingBottom: 14,
    backgroundColor: Colors.apricot,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    ...Shadows.md,
    marginBottom: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.white,
    fontFamily: 'Sora-Bold',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  orderCard: {
    marginBottom: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.lg,
    backgroundColor: Colors.white,
    ...Shadows.sm,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  orderId: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.ink,
    marginBottom: 3,
  },
  orderDate: {
    fontSize: 12,
    color: Colors.inkMuted,
  },
  itemsLine: {
    fontSize: 13,
    color: Colors.inkMuted,
    marginBottom: 10,
  },
  itemCount: {
    fontSize: 13,
    color: Colors.inkMuted,
    marginBottom: 10,
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
    paddingVertical: 7,
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
    paddingVertical: 7,
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
    marginTop: 80,
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