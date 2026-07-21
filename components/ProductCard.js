// components/ProductCard.js  (final image-ready version)
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Colors, Shadows } from '../theme';

export default function ProductCard({ product, onPress, onAddToCart, displayPrice }) {
  const price = displayPrice || product.adminPrice || product.price;
  const mrp = product.mrp && product.mrp > price ? product.mrp : null;
  const discount = mrp ? Math.round((1 - price / mrp) * 100) : null;
  const icon = product.emoji || '🛍️';
  const bgColor = product.color || Colors.apricotLight;

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.9}>
      <View style={[styles.imageContainer, { backgroundColor: bgColor }]}>
        {/* ----- IMAGE or EMOJI ----- */}
        {product.image ? (
          <Image
            source={{ uri: product.image }}
            style={styles.productImage}
            resizeMode="cover"
          />
        ) : (
          <Text style={styles.productIcon}>{icon}</Text>
        )}
        {discount && (
          <View style={styles.discountBadge}>
            <Text style={styles.discountText}>{discount}% OFF</Text>
          </View>
        )}
        <TouchableOpacity
          style={styles.addBtn}
          onPress={(e) => {
            e.stopPropagation?.();
            onAddToCart?.(product);
          }}
          activeOpacity={0.7}
        >
          <Text style={styles.addBtnText}>+</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={2}>{product.name}</Text>
        <Text style={styles.unit}>{product.unit || ''}</Text>
        <View style={styles.priceRow}>
          <Text style={styles.price}>₹{price}</Text>
          {mrp && <Text style={styles.mrp}>₹{mrp}</Text>}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: Colors.white,
    margin: 6,
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.sm,
  },
  imageContainer: {
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  productIcon: {
    fontSize: 36,
  },
  discountBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: Colors.chili,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
  },
  discountText: {
    color: Colors.white,
    fontSize: 10,
    fontWeight: '800',
  },
  addBtn: {
    position: 'absolute',
    bottom: -12,
    right: 8,
    width: 30,
    height: 30,
    borderRadius: 11,
    backgroundColor: Colors.apricot,
    borderWidth: 3,
    borderColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: Colors.apricot,
    shadowOpacity: 0.4,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  addBtnText: {
    color: Colors.white,
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 20,
  },
  info: {
    padding: 12,
    paddingTop: 18,
  },
  name: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.ink,
    lineHeight: 18,
    marginBottom: 3,
  },
  unit: {
    fontSize: 11,
    color: Colors.inkMuted,
    marginBottom: 6,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  price: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.ink,
  },
  mrp: {
    fontSize: 11,
    color: Colors.inkMuted,
    textDecorationLine: 'line-through',
  },
});