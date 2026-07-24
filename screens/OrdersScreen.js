import Constants from 'expo-constants';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import BottomTabBar from '../components/BottomTabBar';
import Card from '../components/Card';
import OrderStatusBadge from '../components/OrderStatusBadge';
import { useCart } from '../context/CartContext';
import api from '../services/api';
import { Colors, Radius, Shadows } from '../theme';

const CANCELLABLE_STATUSES = ['pending', 'confirmed', 'packing', 'ready_for_pickup'];

// Left-edge accent color per status, matching the same semantic families
// used by OrderStatusBadge (amber = pending, apricot = in progress,
// basil green = done, chili red = cancelled) so the card border and the
// badge always agree with each other at a glance.
const STATUS_ACCENT = {
  pending: Colors.amber,
  confirmed: Colors.apricot,
  packing: Colors.apricot,
  ready_for_pickup: Colors.apricot,
  picked: Colors.apricot,
  onway: Colors.apricot,
  out_for_delivery: Colors.apricot,
  delivered: Colors.basil,
  completed: Colors.basil,
  cancelled: Colors.chili,
};
const getStatusAccent = (status) => STATUS_ACCENT[status] || Colors.gray300;

export default function OrdersScreen({ navigation }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const { addToCart } = useCart();

  useEffect(() => {
    api.get('/orders')
      .then(res => setOrders(res.data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleReorder = (item) => {
    (item.items || []).forEach((it) => {
      if (it.product && typeof it.product === 'object') {
        addToCart({ ...it.product, quantity: it.quantity || 1 });
      }
    });
    navigation.navigate('Cart');
  };

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
        accent={getStatusAccent(item.status)}
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

        <View style={styles.divider} />

        {/* Total */}
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.orderTotal}>{total}</Text>
        </View>

        {/* Actions — wraps to a second line instead of overflowing on
            narrow screens when several buttons are shown at once
            (e.g. a delivered, unrated order shows Track + Rate + Reorder). */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.trackBtn}
            onPress={() => navigation.navigate('TrackOrder', { order: item })}
          >
            <Text style={styles.trackBtnText}>🚚 Track Order</Text>
          </TouchableOpacity>
          {item.status === 'delivered' && !item.rating && (
            <TouchableOpacity
              style={styles.neutralBtn}
              onPress={() => navigation.navigate('Rate', { order: item })}
            >
              <Text style={styles.neutralBtnText}>⭐ Rate</Text>
            </TouchableOpacity>
          )}
          {CANCELLABLE_STATUSES.includes(item.status) && (
            <TouchableOpacity
              style={styles.dangerBtn}
              onPress={() => navigation.navigate('CancelOrder', { order: item })}
            >
              <Text style={styles.dangerBtnText}>Cancel</Text>
            </TouchableOpacity>
          )}
          {item.status === 'delivered' && (
            <TouchableOpacity
              style={styles.neutralBtn}
              onPress={() => handleReorder(item)}
            >
              <Text style={styles.neutralBtnText}>↻ Reorder</Text>
            </TouchableOpacity>
          )}
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
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginBottom: 10,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  totalLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.inkMuted,
  },
  orderTotal: {
    fontSize: 17,
    fontWeight: '800',
    color: Colors.ink,
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  // Primary action — the one thing every order card can always do.
  trackBtn: {
    backgroundColor: Colors.apricot,
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderRadius: 10,
  },
  trackBtnText: {
    color: Colors.white,
    fontWeight: '700',
    fontSize: 12.5,
  },
  // Neutral, non-destructive secondary actions (Rate, Reorder).
  neutralBtn: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderRadius: 10,
  },
  neutralBtnText: {
    color: Colors.ink,
    fontWeight: '700',
    fontSize: 12.5,
  },
  // Destructive action (Cancel) — visually distinct from Rate/Reorder so
  // it's never mistaken for a harmless secondary button.
  dangerBtn: {
    backgroundColor: Colors.chiliLight,
    borderWidth: 1,
    borderColor: '#F3C9C9',
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderRadius: 10,
  },
  dangerBtnText: {
    color: Colors.chili,
    fontWeight: '700',
    fontSize: 12.5,
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