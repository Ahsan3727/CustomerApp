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
import { useCart } from '../context/CartContext';
import { Colors, Shadows } from '../theme';

export default function ProductDetailScreen({ navigation, route }) {
  const { addToCart } = useCart();
  const product = route?.params?.product;
  const [quantity, setQuantity] = useState(1);
  const [adding, setAdding] = useState(false);

  // Handle missing product
  if (!product) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorEmoji}>🛍️</Text>
        <Text style={styles.errorTitle}>Product not found</Text>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.errorBack}>
          <Text style={styles.errorBackText}>← Go back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const displayPrice = product.adminPrice || product.price;
  const hasMrp = product.mrp && product.mrp > displayPrice;
  const discount = hasMrp ? Math.round((1 - displayPrice / product.mrp) * 100) : 0;
  const total = (displayPrice * quantity).toFixed(2);

  const handleAddToCart = () => {
    setAdding(true);
    setTimeout(() => {
      addToCart({ ...product, quantity });
      Alert.alert('Added to Cart', `${product.name} (x${quantity}) added!`);
      setAdding(false);
    }, 200);
  };

  return (
    <View style={styles.container}>
      {/* ---- Header ---- */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Product details</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* ---- Product Image ---- */}
        <View style={styles.imageSection}>
          <View style={[styles.imageCard, { backgroundColor: product.color || '#FDEEE1' }]}>
            {product.image ? (
              <Image source={{ uri: product.image }} style={styles.image} />
            ) : (
              <Text style={styles.emoji}>{product.emoji || '🛍️'}</Text>
            )}
            {hasMrp && (
              <View style={styles.discountBadge}>
                <Text style={styles.discountText}>{discount}% OFF</Text>
              </View>
            )}
          </View>
        </View>

        {/* ---- Details Card ---- */}
        <View style={styles.card}>
          {/* Category */}
          {product.category ? (
            <Text style={styles.category}>{product.category}</Text>
          ) : null}

          {/* Name */}
          <Text style={styles.productName}>{product.name}</Text>

          {/* Unit */}
          {product.unit ? (
            <Text style={styles.unit}>{product.unit}</Text>
          ) : null}

          {/* Rating (if available) */}
          {product.rating ? (
            <View style={styles.ratingRow}>
              <View style={styles.stars}>
                <Text style={styles.starIcon}>⭐</Text>
                <Text style={styles.ratingText}>{product.rating}</Text>
              </View>
              <Text style={styles.ratingCount}>
                {product.ratingCount || '210'} ratings
              </Text>
            </View>
          ) : null}

          {/* Freshness */}
          <View style={styles.freshnessRow}>
            <Text style={styles.freshnessIcon}>✅</Text>
            <Text style={styles.freshnessText}>Quality checked – ships fresh</Text>
          </View>

          {/* Price section */}
          <View style={styles.priceSection}>
            <View style={styles.priceMain}>
              <Text style={styles.price}>Rs. {displayPrice}</Text>
              {hasMrp && <Text style={styles.mrp}>Rs. {product.mrp}</Text>}
            </View>
            {hasMrp && (
              <View style={styles.discountPill}>
                <Text style={styles.discountPillText}>{discount}% off</Text>
              </View>
            )}
          </View>

          {/* Quantity label */}
          <Text style={styles.qtyLabel}>Quantity</Text>

          {/* Stepper */}
          <View style={styles.stepper}>
            <TouchableOpacity
              style={styles.stepperBtn}
              onPress={() => setQuantity(prev => Math.max(1, prev - 1))}
            >
              <Text style={styles.stepperBtnText}>−</Text>
            </TouchableOpacity>
            <Text style={styles.stepperValue}>{quantity}</Text>
            <TouchableOpacity
              style={styles.stepperBtn}
              onPress={() => setQuantity(prev => prev + 1)}
            >
              <Text style={styles.stepperBtnText}>+</Text>
            </TouchableOpacity>
          </View>

          {/* Total row */}
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>Rs. {total}</Text>
          </View>

          {/* Add to Cart button */}
          <AppButton
            title={adding ? 'Adding...' : `Add to cart · Rs. ${total}`}
            onPress={handleAddToCart}
            loading={adding}
            type="primary"
            size="lg"
            style={styles.addToCartBtn}
          />
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
  scrollContent: {
    paddingBottom: 40,
  },

  // ---- Header ----
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
    width: 40,   // spacer
  },

  // ---- Image ----
  imageSection: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 20,
  },
  imageCard: {
    width: 220,
    height: 220,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.lg,
    position: 'relative',
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  emoji: {
    fontSize: 80,
  },
  discountBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: Colors.chili,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  discountText: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.3,
  },

  // ---- Details Card ----
  card: {
    backgroundColor: Colors.white,
    marginHorizontal: 16,
    borderRadius: 24,
    padding: 24,
    ...Shadows.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  category: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.apricotDark,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
  },
  productName: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.ink,
    fontFamily: 'Sora-Bold',
    marginBottom: 6,
    lineHeight: 30,
  },
  unit: {
    fontSize: 14,
    color: Colors.inkMuted,
    marginBottom: 12,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  stars: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.apricotLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  starIcon: {
    fontSize: 14,
    color: Colors.apricotDark,
  },
  ratingText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.apricotDark,
  },
  ratingCount: {
    fontSize: 13,
    color: Colors.inkMuted,
    fontWeight: '600',
  },
  freshnessRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  freshnessIcon: {
    fontSize: 14,
    marginRight: 6,
  },
  freshnessText: {
    fontSize: 13,
    color: Colors.inkMuted,
    fontWeight: '500',
  },

  // Price
  priceSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    marginBottom: 16,
  },
  priceMain: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  price: {
    fontSize: 26,
    fontWeight: '800',
    color: Colors.ink,
    fontFamily: 'Sora-Bold',
  },
  mrp: {
    fontSize: 16,
    color: Colors.inkMuted,
    textDecorationLine: 'line-through',
  },
  discountPill: {
    backgroundColor: Colors.chiliLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  discountPillText: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.chili,
  },

  // Stepper
  qtyLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.inkMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.apricotLight,
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignSelf: 'flex-start',
    marginBottom: 20,
  },
  stepperBtn: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: Colors.apricot,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepperBtnText: {
    color: Colors.white,
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 20,
  },
  stepperValue: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.ink,
    marginHorizontal: 20,
    minWidth: 20,
    textAlign: 'center',
  },

  // Total
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    marginBottom: 16,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.ink,
  },
  totalValue: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.ink,
    fontFamily: 'Sora-Bold',
  },

  addToCartBtn: {
    marginTop: 0,
  },

  // ---- Error / Empty ----
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.linen,
    paddingHorizontal: 30,
  },
  errorEmoji: {
    fontSize: 60,
    marginBottom: 16,
    opacity: 0.5,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.ink,
    marginBottom: 12,
  },
  errorBack: {
    paddingVertical: 10,
    paddingHorizontal: 24,
    backgroundColor: Colors.apricot,
    borderRadius: 12,
  },
  errorBackText: {
    color: Colors.white,
    fontWeight: '700',
    fontSize: 15,
  },
});