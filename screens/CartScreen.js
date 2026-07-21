import Constants from 'expo-constants';
import { useState } from 'react';
import {
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import AppButton from '../components/AppButton';
import BottomTabBar from '../components/BottomTabBar';
import Card from '../components/Card';
import { useCart } from '../context/CartContext';
import api from '../services/api';
import { Colors, Shadows } from '../theme';

export default function CartScreen({ navigation }) {
  const { cart, removeFromCart, changeCartQuantity, clearCart, cartTotalItems } = useCart();
  const [loading, setLoading] = useState(false);

  const totalAmount = cart.reduce(
    (sum, item) => sum + (item.adminPrice || item.price) * item.quantity,
    0
  );
  const bagFee = 0.25;
  const serviceFee = 5.25;
  const deliveryFee = totalAmount > 500 ? 0 : 50;
  const grandTotal = totalAmount + bagFee + serviceFee + deliveryFee;

  const placeOrderApiCall = async (orderData) => {
    return api.post('/orders', orderData);
  };

  const handleGoToMap = () => {
    if (cart.length === 0) {
      Alert.alert('Cart Empty', 'Add some products first.');
      return;
    }
    const cartItems = cart.map(item => ({
      product: item._id,
      quantity: item.quantity,
    }));
    navigation.navigate('OrderMapPicker', {
      cartItems,
      apiFunc: placeOrderApiCall,
    });
  };

  // ---------- Empty cart ----------
  if (cart.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Text style={styles.backText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>My cart</Text>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>0</Text>
          </View>
        </View>

        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>🛒</Text>
          <Text style={styles.emptyTitle}>Your cart is empty</Text>
          <Text style={styles.emptySub}>Browse products and add the things you love.</Text>
          <AppButton
            title="Start shopping"
            onPress={() => navigation.navigate('Home')}
            style={{ marginTop: 24 }}
          />
        </View>
        <BottomTabBar navigation={navigation} activeScreen="Cart" />
      </View>
    );
  }

  // ---------- Cart with items ----------
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My cart</Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{cartTotalItems()}</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Cart items (with images) */}
        {cart.map(item => {
          const itemTotal = (item.adminPrice || item.price) * item.quantity;
          const bgColor = item.color || Colors.apricotLight;
          const icon = item.emoji || '🛍️';
          return (
            <View key={item._id} style={styles.cartItem}>
              {/* Product image or emoji */}
              <View style={[styles.itemThumb, { backgroundColor: bgColor }]}>
                {item.image ? (
                  <Image
                    source={{ uri: item.image }}
                    style={styles.itemImage}
                    resizeMode="cover"
                  />
                ) : (
                  <Text style={styles.itemIcon}>{icon}</Text>
                )}
              </View>

              <View style={styles.itemInfo}>
                <Text style={styles.itemName}>{item.name}</Text>
                {item.unit ? <Text style={styles.itemUnit}>{item.unit}</Text> : null}
                <View style={styles.stepper}>
                  <TouchableOpacity
                    style={styles.stepperBtn}
                    onPress={() => changeCartQuantity(item._id, -1)}
                  >
                    <Text style={styles.stepperBtnText}>−</Text>
                  </TouchableOpacity>
                  <Text style={styles.stepperValue}>{item.quantity}</Text>
                  <TouchableOpacity
                    style={styles.stepperBtn}
                    onPress={() => changeCartQuantity(item._id, 1)}
                  >
                    <Text style={styles.stepperBtnText}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.itemRight}>
                <Text style={styles.itemTotal}>Rs. {itemTotal.toFixed(2)}</Text>
                <TouchableOpacity
                  onPress={() => removeFromCart(item._id)}
                  style={styles.removeBtn}
                >
                  <Text style={styles.removeIcon}>🗑</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        })}

        {/* Add more link */}
        <TouchableOpacity
          style={styles.addMore}
          onPress={() => navigation.navigate('Home')}
        >
          <Text style={styles.addMoreIcon}>+</Text>
          <Text style={styles.addMoreText}>Missed something? Add more items</Text>
        </TouchableOpacity>

        {/* Order Summary */}
        <Text style={styles.sectionTitle}>🧾 Order summary</Text>
        <Card style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal ({cartTotalItems()} items)</Text>
            <Text style={styles.summaryValue}>Rs. {totalAmount.toFixed(2)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Bag fee</Text>
            <Text style={styles.summaryValue}>Rs. {bagFee.toFixed(2)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Service fee</Text>
            <Text style={styles.summaryValue}>Rs. {serviceFee.toFixed(2)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Delivery</Text>
            <Text style={[styles.summaryValue, deliveryFee === 0 && { color: Colors.basil }]}>
              {deliveryFee === 0 ? 'FREE' : `Rs. ${deliveryFee.toFixed(2)}`}
            </Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.summaryRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>Rs. {grandTotal.toFixed(2)}</Text>
          </View>
        </Card>

        {/* Place Order */}
        <View style={styles.buttonWrapper}>
          <AppButton
            title={loading ? 'Placing order...' : 'Place order (COD)'}
            onPress={handleGoToMap}
            loading={loading}
          />
          <Text style={styles.codNotice}>💵 Cash on delivery · Pay when you receive</Text>
        </View>
      </ScrollView>

      <BottomTabBar navigation={navigation} activeScreen="Cart" />
    </View>
  );
}

// ---------- Styles ----------
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.linen,
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
    marginBottom: 4,
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
  badge: {
    backgroundColor: Colors.chili,
    minWidth: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  badgeText: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: '700',
  },

  // Empty state
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
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

  scrollView: {
    flex: 1,
  },

  // Cart items
  cartItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 18,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.sm,
  },
  itemThumb: {
    width: 52,
    height: 52,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    overflow: 'hidden',
  },
  itemImage: {
    width: '100%',
    height: '100%',
  },
  itemIcon: {
    fontSize: 28,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontWeight: '700',
    fontSize: 14,
    color: Colors.ink,
    marginBottom: 3,
  },
  itemUnit: {
    fontSize: 11,
    color: Colors.inkMuted,
    marginBottom: 8,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.apricotLight,
    borderRadius: 10,
    paddingVertical: 4,
    paddingHorizontal: 6,
    alignSelf: 'flex-start',
  },
  stepperBtn: {
    width: 26,
    height: 26,
    borderRadius: 8,
    backgroundColor: Colors.apricot,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepperBtnText: {
    color: Colors.white,
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 17,
  },
  stepperValue: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.ink,
    marginHorizontal: 12,
    minWidth: 16,
    textAlign: 'center',
  },
  itemRight: {
    alignItems: 'flex-end',
    marginLeft: 8,
  },
  itemTotal: {
    fontWeight: '800',
    fontSize: 14,
    color: Colors.ink,
    marginBottom: 6,
  },
  removeBtn: {
    padding: 4,
  },
  removeIcon: {
    fontSize: 18,
    color: Colors.inkMuted,
  },

  addMore: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    marginBottom: 8,
  },
  addMoreIcon: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.apricot,
    marginRight: 8,
  },
  addMoreText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.apricotDark,
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.ink,
    marginBottom: 12,
    marginTop: 8,
  },
  summaryCard: {
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 16,
    backgroundColor: Colors.white,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  summaryLabel: {
    fontSize: 13,
    color: Colors.inkMuted,
  },
  summaryValue: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.ink,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: 10,
  },
  totalLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.ink,
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.ink,
    fontFamily: 'Sora-Bold',
  },
  buttonWrapper: {
    marginTop: 8,
    marginBottom: 20,
  },
  codNotice: {
    textAlign: 'center',
    fontSize: 13,
    color: Colors.inkMuted,
    marginTop: 12,
  },
});