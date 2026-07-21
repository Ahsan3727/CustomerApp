import { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCart } from '../context/CartContext';
import { Radius, Shadows } from '../theme';

// Green theme colours (basil family)
const Colors = {
  basilDark: '#0F5233',
  basil: '#1B7A4F',
  basilLight: '#EAF6EF',
  apricot: '#E8823A',        // kept for the CTA button only
  white: '#FFFFFF',
  inkMuted: '#6B7280',
};

const FREE_DELIVERY_THRESHOLD = 1000;

export default function CartSummaryBar({ navigation }) {
  const { cart, cartTotalItems } = useCart();
  const insets = useSafeAreaInsets();

  // Animated values
  const translateY = useRef(new Animated.Value(30)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const [hasPulsed, setHasPulsed] = useState(false);

  const totalAmount = cart.reduce(
    (sum, item) => sum + (item.adminPrice || item.price) * item.quantity,
    0
  );
  const itemCount = cartTotalItems();
  const progress = Math.min(totalAmount / FREE_DELIVERY_THRESHOLD, 1);
  const remaining = FREE_DELIVERY_THRESHOLD - totalAmount;
  const freeDeliveryUnlocked = progress >= 1;

  // Entrance / exit animation
  useEffect(() => {
    if (itemCount > 0) {
      // Slide up + fade in with spring
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          tension: 80,
          friction: 10,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      // Animate progress bar with overshoot
      Animated.spring(progressAnim, {
        toValue: progress,
        tension: 60,
        friction: 8,
        useNativeDriver: false,
      }).start();

      // Trigger button pulse when free delivery is unlocked (once)
      if (freeDeliveryUnlocked && !hasPulsed) {
        setHasPulsed(true);
        // You can add a manual pulse animation here if needed
      }
    } else {
      // Fade out and slide down
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: 30,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
      progressAnim.setValue(0);
      setHasPulsed(false);
    }
  }, [itemCount, totalAmount]);

  if (itemCount === 0) return null;

  // Bottom positioning: above the tab bar (tab bar height ~68 + bottom inset)
  const bottomPosition = insets.bottom + 68;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity,
          transform: [{ translateY }],
          bottom: bottomPosition,
        },
      ]}
    >
      <TouchableOpacity
        style={styles.touchable}
        onPress={() => navigation.navigate('Cart')}
        activeOpacity={0.85}
      >
        {/* Left: item count & total */}
        <View style={styles.leftSection}>
          <Text style={styles.itemCount}>
            {itemCount} {itemCount === 1 ? 'item' : 'items'}
          </Text>
          <Text style={styles.totalAmount}>Rs. {totalAmount.toFixed(2)}</Text>
        </View>

        {/* Center: progress info */}
        <View style={styles.centerSection}>
          {freeDeliveryUnlocked ? (
            <Text style={styles.freeDeliveryText}>🎉 Free Delivery Unlocked!</Text>
          ) : (
            <Text style={styles.remainingText}>
              Add Rs. {remaining.toFixed(2)} more for free delivery
            </Text>
          )}
          <View style={styles.progressBarBackground}>
            <Animated.View
              style={[
                styles.progressBarFill,
                {
                  width: progressAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0%', '100%'],
                  }),
                  backgroundColor: freeDeliveryUnlocked ? Colors.basil : Colors.apricot,
                },
              ]}
            />
          </View>
        </View>

        {/* Right: View Cart button (pulses when unlocked) */}
        <Animated.View
          style={[
            styles.viewCartBtn,
            freeDeliveryUnlocked && styles.pulseButton, // subtle scale pulse
          ]}
        >
          <TouchableOpacity onPress={() => navigation.navigate('Cart')}>
            <Text style={styles.viewCartText}>View cart</Text>
          </TouchableOpacity>
        </Animated.View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 12,
    right: 12,
    backgroundColor: Colors.basilDark,     // dark green
    borderRadius: Radius.lg,
    ...Shadows.md,
    zIndex: 20,
    overflow: 'hidden',
  },
  touchable: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
  },
  leftSection: {
    marginRight: 12,
  },
  itemCount: {
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.75)',
  },
  totalAmount: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.white,
    marginTop: 2,
  },
  centerSection: {
    flex: 1,
    marginRight: 12,
  },
  freeDeliveryText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.basilLight,
    marginBottom: 4,
  },
  remainingText: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 4,
  },
  progressBarBackground: {
    height: 5,
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  viewCartBtn: {
    backgroundColor: Colors.apricot,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    // pulse animation will be added via transform
  },
  pulseButton: {
    // example: a slight scale pulse (you can define a keyframe or use Animated.loop)
    transform: [{ scale: 1.05 }],   // subtle permanent scale when unlocked
  },
  viewCartText: {
    color: Colors.white,
    fontWeight: '800',
    fontSize: 13,
  },
});