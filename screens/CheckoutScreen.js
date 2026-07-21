import Constants from 'expo-constants';
import { useEffect, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import AppButton from '../components/AppButton';
import Card from '../components/Card';
import { useCart } from '../context/CartContext';
import { useOrders } from '../context/OrderContext';
import api from '../services/api';
import { Colors, Radius, Shadows } from '../theme';

export default function CheckoutScreen({ navigation }) {
  const { items, subtotal, total, discount, clearCart } = useCart();
  const { placeOrder } = useOrders();
  const [address, setAddress] = useState(null);
  const [addresses, setAddresses] = useState([]);
  const [paymentMethod, setPaymentMethod] = useState('COD');
  const [slot, setSlot] = useState('Today 6-8 PM');
  const [loading, setLoading] = useState(false);

  // Fetch user addresses
  useEffect(() => {
    api.get('/users/addresses')
      .then(res => {
        if (res.data.addresses?.length) {
          setAddresses(res.data.addresses);
          setAddress(res.data.addresses[0]);   // default to first
        }
      })
      .catch(() => {});
  }, []);

  const handlePlaceOrder = async () => {
    setLoading(true);
    try {
      const order = await placeOrder({
        products: items.map(i => ({ product: i._id, qty: i.qty })),
        addressId: address?._id,
        paymentMethod,
        deliverySlot: slot,
        total,
      });
      clearCart();
      navigation.navigate('OrderConfirm', { order });
    } catch (e) {
      alert('Order failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Checkout</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ---- Delivery Address ---- */}
        <Text style={styles.sectionTitle}>Delivery address</Text>
        {address ? (
          <TouchableOpacity
            style={[styles.card, styles.selectedCard]}
            onPress={() => navigation.navigate('AddressList')}
            activeOpacity={0.7}
          >
            <View style={styles.cardInner}>
              <View style={styles.radioOuter}>
                <View style={styles.radioDot} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardLabel}>{address.label}</Text>
                <Text style={styles.cardSub}>
                  {address.line1}, {address.city}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.card}
            onPress={() => navigation.navigate('AddAddress')}
            activeOpacity={0.7}
          >
            <Text style={styles.addNewText}>+ Add a new address</Text>
          </TouchableOpacity>
        )}

        {/* ---- Delivery Slot ---- */}
        <Text style={styles.sectionTitle}>Delivery slot</Text>
        <TouchableOpacity
          style={[styles.card, styles.selectedCard]}
          onPress={() => {
            // Optional: open slot picker
          }}
          activeOpacity={0.7}
        >
          <View style={styles.cardInner}>
            <View style={styles.radioOuter}>
              <View style={styles.radioDot} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardLabel}>{slot}</Text>
              <Text style={styles.cardSub}>Next available slot</Text>
            </View>
          </View>
        </TouchableOpacity>

        {/* ---- Payment Method ---- */}
        <Text style={styles.sectionTitle}>Payment method</Text>
        {[
          { id: 'COD', label: 'Cash on delivery', sub: 'Pay when your order arrives' },
          { id: 'Wallet', label: 'GrocerEase Wallet', sub: 'Balance: Rs. 200.00' },
        ].map(method => (
          <TouchableOpacity
            key={method.id}
            style={[styles.card, paymentMethod === method.id && styles.selectedCard]}
            onPress={() => setPaymentMethod(method.id)}
            activeOpacity={0.7}
          >
            <View style={styles.cardInner}>
              <View style={[styles.radioOuter, paymentMethod === method.id && styles.radioOuterSelected]}>
                {paymentMethod === method.id && <View style={styles.radioDot} />}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardLabel}>{method.label}</Text>
                <Text style={styles.cardSub}>{method.sub}</Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}

        {/* ---- Order Summary ---- */}
        <Text style={styles.sectionTitle}>Order summary</Text>
        <Card style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal ({items.length} items)</Text>
            <Text style={styles.summaryValue}>Rs. {subtotal.toFixed(2)}</Text>
          </View>
          {discount > 0 && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Discount ({Math.round(discount * 100)}%)</Text>
              <Text style={[styles.summaryValue, { color: Colors.chili }]}>
                - Rs. {((subtotal * discount).toFixed(2))}
              </Text>
            </View>
          )}
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Delivery</Text>
            <Text style={[styles.summaryValue, { color: Colors.basil }]}>FREE</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.summaryRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>Rs. {total.toFixed(2)}</Text>
          </View>
        </Card>

        {/* Place Order Button */}
        <View style={styles.buttonWrapper}>
          <AppButton
            title={loading ? 'Placing order...' : 'Place order'}
            onPress={handlePlaceOrder}
            loading={loading}
            size="lg"
          />
          <Text style={styles.codNotice}>💵 Cash on delivery · Pay when you receive</Text>
        </View>
      </ScrollView>
    </View>
  );
}

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
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.ink,
    marginTop: 24,
    marginBottom: 12,
    fontFamily: 'Sora-Bold',
  },
  card: {
    backgroundColor: Colors.white,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: Radius.lg,
    padding: 16,
    marginBottom: 10,
    ...Shadows.sm,
  },
  selectedCard: {
    borderColor: Colors.apricot,
    backgroundColor: Colors.white,
    ...Shadows.md,
  },
  cardInner: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  radioOuterSelected: {
    borderColor: Colors.apricot,
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.apricot,
  },
  cardLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.ink,
    marginBottom: 3,
  },
  cardSub: {
    fontSize: 12,
    color: Colors.inkMuted,
    lineHeight: 16,
  },
  addNewText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.apricot,
  },
  summaryCard: {
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.sm,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 5,
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
    marginTop: 24,
  },
  codNotice: {
    textAlign: 'center',
    fontSize: 13,
    color: Colors.inkMuted,
    marginTop: 12,
  },
});