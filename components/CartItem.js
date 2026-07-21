import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Colors } from '../theme';

export default function CartItem({ item, onUpdateQty, onRemove }) {
  // Determine icon and background from item (if available)
  const icon = item.icon || '🛒';
  const bgColor = item.color || Colors.basilLight;

  return (
    <View style={styles.container}>
      {/* Thumbnail */}
      <View style={[styles.thumbnail, { backgroundColor: bgColor }]}>
        <Text style={styles.thumbIcon}>{icon}</Text>
      </View>

      {/* Product details */}
      <View style={styles.details}>
        <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
        {item.unit && <Text style={styles.unit}>{item.unit}</Text>}
        <View style={styles.priceRow}>
          <Text style={styles.price}>₹{item.price} x {item.qty}</Text>
        </View>
      </View>

      {/* Actions: stepper + remove */}
      <View style={styles.actions}>
        <View style={styles.stepper}>
          <TouchableOpacity
            onPress={() => onUpdateQty(item._id, item.qty - 1)}
            style={styles.stepperBtn}
          >
            <Text style={styles.stepperText}>−</Text>
          </TouchableOpacity>
          <Text style={styles.qty}>{item.qty}</Text>
          <TouchableOpacity
            onPress={() => onUpdateQty(item._id, item.qty + 1)}
            style={styles.stepperBtn}
          >
            <Text style={styles.stepperText}>+</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity onPress={() => onRemove(item._id)} style={styles.removeBtn}>
          <Text style={styles.removeIcon}>🗑</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    padding: 12,
    marginBottom: 10,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Colors.border,
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  thumbnail: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  thumbIcon: {
    fontSize: 24,
  },
  details: {
    flex: 1,
  },
  name: {
    fontWeight: '600',
    fontSize: 14,
    color: Colors.ink,
  },
  unit: {
    fontSize: 11,
    color: Colors.inkMuted,
    marginTop: 2,
  },
  priceRow: {
    marginTop: 4,
  },
  price: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.ink,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.basilLight,
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 4,
  },
  stepperBtn: {
    width: 26,
    height: 26,
    borderRadius: 7,
    backgroundColor: Colors.basil,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepperText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 18,
  },
  qty: {
    fontSize: 14,
    fontWeight: '700',
    marginHorizontal: 10,
    color: Colors.ink,
  },
  removeBtn: {
    marginLeft: 12,
  },
  removeIcon: {
    fontSize: 20,
    color: Colors.inkMuted,
  },
});