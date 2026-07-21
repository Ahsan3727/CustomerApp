import Constants from 'expo-constants';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  FlatList,
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import BottomTabBar from '../components/BottomTabBar';
import CartSummaryBar from '../components/CartSummaryBar';
import { useCart } from '../context/CartContext';
import api from '../services/api';
import { Colors, Fonts, Radius, Shadows } from '../theme';

const { width } = Dimensions.get('window');
const numColumns = 3;

// Category icons – colours remain as before (they are category‑specific, not brand)
const categories = [
  { label: 'Fruits', icon: '🍎', bg: '#FDECEA', ink: '#C0392B' },
  { label: 'Vegetables', icon: '🥬', bg: '#EAF6EF', ink: '#1B7A4F' },
  { label: 'Dairy', icon: '🥛', bg: '#EAF2FB', ink: '#2563EB' },
  { label: 'Bakery', icon: '🍞', bg: '#FBF0DE', ink: '#B8860B' },
  { label: 'Beverages', icon: '🥤', bg: '#FDEEE1', ink: '#C96A26' },
  { label: 'Snacks', icon: '🍪', bg: '#FBEFE3', ink: '#A0522D' },
];

// Promo slides – all using different orange / warm tones (green removed)
const PROMOS = [
  {
    eyebrow: 'This week',
    title: 'Fresh produce,\nup to 30% off',
    icon: '🥑',
    bg: '#FDEEE1',        // apricot‑light
    textColor: Colors.ink,
    eyebrowColor: Colors.apricotDark,
  },
  {
    eyebrow: 'Just landed',
    title: 'Farm dairy,\nchilled & same-day',
    icon: '🥛',
    bg: '#FFF2E5',        // lighter orange
    textColor: Colors.ink,
    eyebrowColor: Colors.apricotDark,
  },
  {
    eyebrow: 'Ending soon',
    title: 'Snack box combos\nfrom Rs 250',
    icon: '🍪',
    bg: '#FFE8D6',        // warm peach
    textColor: Colors.ink,
    eyebrowColor: Colors.chili,   // keep a subtle accent
  },
];

// ---------- Cloudinary helper ----------
const getThumbnail = (imageUrl, size = 200) => {
  if (!imageUrl) return null;
  if (imageUrl.includes('res.cloudinary.com')) {
    const parts = imageUrl.split('/upload/');
    if (parts.length === 2) {
      return `${parts[0]}/upload/w_${size},f_auto,q_auto/${parts[1]}`;
    }
  }
  return imageUrl;
};

// ============== Promo Carousel ==============
function PromoCarousel() {
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollRef = useRef(null);
  const timerRef = useRef(null);

  const goTo = (index) => {
    setActiveIndex(index);
    scrollRef.current?.scrollTo({ x: index * (width - 32), animated: true });
  };

  const startAuto = () => {
    stopAuto();
    timerRef.current = setInterval(() => {
      setActiveIndex((prev) => {
        const next = (prev + 1) % PROMOS.length;
        scrollRef.current?.scrollTo({ x: next * (width - 32), animated: true });
        return next;
      });
    }, 4200);
  };
  const stopAuto = () => clearInterval(timerRef.current);

  useEffect(() => {
    startAuto();
    return stopAuto;
  }, []);

  return (
    <View style={promoStyles.wrapper}>
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(e) => {
          const idx = Math.round(e.nativeEvent.contentOffset.x / (width - 32));
          setActiveIndex(idx);
          startAuto();
        }}
        onTouchStart={stopAuto}
        onTouchEnd={startAuto}
        scrollEventThrottle={16}
      >
        {PROMOS.map((p, i) => (
          <View key={i} style={[promoStyles.card, { backgroundColor: p.bg }]}>
            <View style={{ flex: 1 }}>
              <Text style={[promoStyles.eyebrow, { color: p.eyebrowColor }]}>{p.eyebrow}</Text>
              <Text style={[promoStyles.title, { color: p.textColor }]}>{p.title}</Text>
              <TouchableOpacity style={promoStyles.btn}>
                <Text style={promoStyles.btnText}>Shop now</Text>
              </TouchableOpacity>
            </View>
            <Text style={promoStyles.icon}>{p.icon}</Text>
          </View>
        ))}
      </ScrollView>
      {PROMOS.length > 1 && (
        <View style={promoStyles.dots}>
          {PROMOS.map((_, i) => (
            <View
              key={i}
              style={[promoStyles.dot, i === activeIndex && promoStyles.activeDot]}
            />
          ))}
        </View>
      )}
    </View>
  );
}

const promoStyles = StyleSheet.create({
  wrapper: {
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: Radius.lg,
    overflow: 'hidden',
  },
  card: {
    width: width - 32,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  eyebrow: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  title: {
    fontFamily: 'Sora-Bold',
    fontSize: 18,
    lineHeight: 22,
    fontWeight: '700',
    marginBottom: 12,
  },
  btn: {
    backgroundColor: Colors.apricot,     // orange button
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: Radius.full,
    alignSelf: 'flex-start',
  },
  btnText: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: '700',
  },
  icon: {
    fontSize: 48,
    opacity: 0.65,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: 8,
    backgroundColor: Colors.linen,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: Colors.border,
    marginHorizontal: 3,
  },
  activeDot: {
    width: 14,
    borderRadius: 3,
    backgroundColor: Colors.apricot,     // orange active dot
  },
});

// ============== Product Card (grid) ==============
function ProductCard({ product, onPress, onAddToCart }) {
  const price = product.adminPrice || product.price;
  const mrp = product.mrp && product.mrp > price ? product.mrp : null;
  const discount = mrp ? Math.round((1 - price / mrp) * 100) : null;
  const icon = product.emoji || '🛍️';
  const bgColor = product.color || '#FDEEE1';  // fallback warm
  const iconColor = product.ink || Colors.apricotDark;

  return (
    <TouchableOpacity style={cardStyles.card} onPress={onPress} activeOpacity={0.9}>
      <View style={[cardStyles.imageBox, { backgroundColor: bgColor }]}>
        <Text style={[cardStyles.icon, { color: iconColor }]}>{icon}</Text>
        {discount && (
          <View style={cardStyles.badge}>
            <Text style={cardStyles.badgeText}>{discount}% OFF</Text>
          </View>
        )}
        <TouchableOpacity
          style={cardStyles.addBtn}
          onPress={(e) => {
            e.stopPropagation?.();
            onAddToCart(product);
          }}
          activeOpacity={0.7}
        >
          <Text style={cardStyles.addBtnText}>+</Text>
        </TouchableOpacity>
      </View>
      <View style={cardStyles.details}>
        <Text style={cardStyles.name} numberOfLines={2}>{product.name}</Text>
        <Text style={cardStyles.unit}>{product.unit || ''}</Text>
        <View style={cardStyles.priceRow}>
          <Text style={cardStyles.price}>Rs. {price}</Text>
          {mrp && <Text style={cardStyles.mrp}>Rs. {mrp}</Text>}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const cardStyles = StyleSheet.create({
  card: {
    backgroundColor: Colors.white,
    borderRadius: 18,
    marginHorizontal: 4,
    marginBottom: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.sm,
  },
  imageBox: {
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  icon: {
    fontSize: 36,
  },
  badge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: Colors.chili,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgeText: {
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
    borderColor: Colors.linen,
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
  details: {
    padding: 12,
    paddingTop: 18,
  },
  name: {
    fontWeight: '700',
    fontSize: 13,
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

// ============== Trending Card ==============
function TrendingCard({ product, onPress, onAddToCart }) {
  return (
    <TouchableOpacity style={trendStyles.card} onPress={onPress} activeOpacity={0.7}>
      <View style={[trendStyles.imageBox, { backgroundColor: product.color || '#FDEEE1' }]}>
        {product.image ? (
          <Image
            source={{ uri: getThumbnail(product.image, 180) }}
            style={trendStyles.image}
            resizeMode="cover"
          />
        ) : (
          <Text style={trendStyles.emoji}>{product.emoji || '🛍️'}</Text>
        )}
      </View>
      <Text style={trendStyles.name} numberOfLines={1}>{product.name}</Text>
      <View style={trendStyles.priceRow}>
        <Text style={trendStyles.price}>Rs. {(product.adminPrice || product.price).toFixed(2)}</Text>
        <TouchableOpacity style={trendStyles.addBtn} onPress={() => onAddToCart(product)}>
          <Text style={trendStyles.addBtnText}>+</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

const trendStyles = StyleSheet.create({
  card: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 12,
    marginRight: 14,
    width: 140,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.sm,
  },
  imageBox: {
    width: '100%',
    height: 80,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    overflow: 'hidden',
  },
  image: { width: '100%', height: '100%' },
  emoji: { fontSize: 36 },
  name: { fontWeight: '600', fontSize: 13, color: Colors.ink, marginBottom: 4 },
  priceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 },
  price: { fontWeight: '700', fontSize: 13, color: Colors.ink },
  addBtn: {
    width: 26,
    height: 26,
    borderRadius: 9,
    backgroundColor: Colors.apricot,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
    shadowColor: Colors.apricot,
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  addBtnText: { color: Colors.white, fontWeight: '700', fontSize: 14 },
});

// ========================
//        MAIN SCREEN
// ========================
export default function HomeScreen({ navigation }) {
  const [products, setProducts] = useState([]);
  const [popularProducts, setPopularProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const { addToCart, cart } = useCart();
  const contentOpacity = useRef(new Animated.Value(0)).current;

  const cartTotal = cart.reduce((sum, item) => sum + (item.adminPrice || item.price) * item.quantity, 0);
  const freeDeliveryThreshold = 1000;
  const progress = Math.min(cartTotal / freeDeliveryThreshold, 1);
  const remaining = freeDeliveryThreshold - cartTotal;

  const fetchProducts = async () => {
    try {
      const { data } = await api.get('/products');
      setProducts(data.products || []);
    } catch (e) { console.log(e); }
  };

  const fetchPopularProducts = async () => {
    try {
      const { data } = await api.get('/products/popular');
      setPopularProducts(data.products || []);
    } catch (e) { console.log(e); }
  };

  useEffect(() => {
    Promise.all([fetchProducts(), fetchPopularProducts()]).finally(() => {
      setLoading(false);
      Animated.timing(contentOpacity, { toValue: 1, duration: 500, useNativeDriver: true }).start();
    });
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([fetchProducts(), fetchPopularProducts()]);
    setRefreshing(false);
  }, []);

  const cardWidth = (width - 32 - (numColumns - 1) * 10) / numColumns;

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={Colors.apricot} />
        <Text style={{ marginTop: 12, color: Colors.inkMuted, ...Fonts.medium }}>
          Bringing the farm to you...
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* ---- Header (Apricot) ---- */}
      <View style={styles.header}>
        {/* Location Pill */}
        <TouchableOpacity style={styles.locationPill}>
          <Text style={styles.locIcon}>📍</Text>
          <View>
            <Text style={styles.locTitle}>Home</Text>
            <Text style={styles.locSub}>DHA Phase 5, Lahore</Text>
          </View>
          <Text style={styles.locChevron}>▼</Text>
        </TouchableOpacity>

        {/* Cart icon */}
        <TouchableOpacity
          style={styles.cartButton}
          onPress={() => navigation.navigate('Cart')}
        >
          <Text style={styles.cartIcon}>🛒</Text>
          {cart.length > 0 && (
            <View style={styles.cartBadge}>
              <Text style={styles.cartBadgeText}>{cart.length}</Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Search Bar */}
        <TouchableOpacity
          style={styles.searchBar}
          onPress={() => navigation.navigate('Search')}
          activeOpacity={0.8}
        >
          <Text style={styles.searchIcon}>🔍</Text>
          <Text style={styles.searchPlaceholder}>Search atta, milk, eggs...</Text>
        </TouchableOpacity>
      </View>

      <Animated.View style={{ flex: 1, opacity: contentOpacity }}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[Colors.apricot]}
              tintColor={Colors.apricot}
            />
          }
        >
          {/* ---- Promo Carousel ---- */}
          <PromoCarousel />

          {/* ---- Categories ---- */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Shop by Category</Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryRow}>
            {categories.map((cat) => (
              <TouchableOpacity
                key={cat.label}
                style={styles.chip}
                onPress={() => navigation.navigate('ProductList', { category: cat.label })}
                activeOpacity={0.7}
              >
                <View style={[styles.chipIcon, { backgroundColor: cat.bg }]}>
                  <Text style={[styles.chipEmoji, { color: cat.ink }]}>{cat.icon}</Text>
                </View>
                <Text style={styles.chipText}>{cat.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* ---- Trending Now ---- */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>🔥 Trending Now</Text>
            <TouchableOpacity><Text style={styles.seeAll}>See all →</Text></TouchableOpacity>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 20, paddingLeft: 16 }}>
            {popularProducts.map((item) => (
              <TrendingCard
                key={item._id}
                product={item}
                onPress={() => navigation.navigate('ProductDetail', { product: item })}
                onAddToCart={addToCart}
              />
            ))}
          </ScrollView>

          {/* ---- Best Sellers Grid ---- */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>🛒 Best Sellers</Text>
            <TouchableOpacity><Text style={styles.seeAll}>See all →</Text></TouchableOpacity>
          </View>
          {products.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>🛍️</Text>
              <Text style={styles.emptyText}>No products found</Text>
            </View>
          ) : (
            <FlatList
              data={products}
              keyExtractor={(item) => item._id}
              numColumns={numColumns}
              key={numColumns}
              scrollEnabled={false}
              columnWrapperStyle={styles.row}
              renderItem={({ item }) => (
                <View style={{ width: cardWidth }}>
                  <ProductCard
                    product={item}
                    onPress={() => navigation.navigate('ProductDetail', { product: item })}
                    onAddToCart={addToCart}
                  />
                </View>
              )}
            />
          )}

          {/* ---- Delivery Banner ---- */}
          <View style={styles.deliveryBanner}>
            <Text style={styles.deliveryIcon}>🚚</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.deliveryText}>
                {progress >= 1
                  ? '🎉 Free Delivery Unlocked!'
                  : `Add Rs. ${remaining.toFixed(0)} more for free delivery`
                }
              </Text>
              <View style={styles.progressBar}>
                <Animated.View
                  style={[
                    styles.progressFill,
                    {
                      width: `${progress * 100}%`,
                      backgroundColor: progress >= 1 ? Colors.apricot : Colors.apricotDark,
                    },
                  ]}
                />
              </View>
            </View>
          </View>
        </ScrollView>
      </Animated.View>

      {/* ---- Cart Summary Bar ---- */}
      <CartSummaryBar navigation={navigation} />

      {/* ---- Bottom Tab Bar ---- */}
      <BottomTabBar navigation={navigation} activeScreen="Home" />
    </View>
  );
}

// ======================== Styles ========================
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
  scrollContent: {
    paddingBottom: 200,
  },

  // Header (Apricot)
  header: {
    backgroundColor: Colors.apricot,          // main orange
    paddingTop: Constants.statusBarHeight + 8,
    paddingBottom: 14,
    paddingHorizontal: 16,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    ...Shadows.md,
  },
  locationPill: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  locIcon: {
    fontSize: 18,
    marginRight: 6,
    color: Colors.white,
  },
  locTitle: {
    color: Colors.white,
    fontWeight: '700',
    fontSize: 13,
  },
  locSub: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 11,
    fontWeight: '500',
  },
  locChevron: {
    color: Colors.white,
    fontSize: 10,
    marginLeft: 4,
    opacity: 0.8,
  },
  cartButton: {
    position: 'absolute',
    right: 16,
    top: Constants.statusBarHeight + 8,
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cartIcon: {
    fontSize: 20,
    color: Colors.white,
  },
  cartBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: Colors.apricotDark,
    borderRadius: 8,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.apricot,
  },
  cartBadgeText: {
    color: Colors.white,
    fontSize: 10,
    fontWeight: '800',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 14,
    paddingVertical: 11,
    paddingHorizontal: 14,
    marginTop: 4,
  },
  searchIcon: {
    fontSize: 16,
    color: Colors.inkMuted,
    marginRight: 8,
  },
  searchPlaceholder: {
    flex: 1,
    fontSize: 13,
    color: Colors.inkMuted,
    fontWeight: '500',
  },

  // Sections
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
    marginTop: 16,
  },
  sectionTitle: {
    fontFamily: 'Sora-Bold',
    fontSize: 17,
    fontWeight: '700',
    color: Colors.ink,
  },
  seeAll: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.apricotDark,     // orange accent for links
  },

  // Categories
  categoryRow: {
    paddingLeft: 16,
    paddingRight: 8,
    marginBottom: 10,
  },
  chip: {
    alignItems: 'center',
    marginRight: 18,
    width: 64,
  },
  chipIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
    ...Shadows.sm,
  },
  chipEmoji: {
    fontSize: 24,
  },
  chipText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.ink,
  },

  // Grid
  row: {
    justifyContent: 'space-between',
    paddingHorizontal: 12,
  },

  // Delivery
  deliveryBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: Colors.apricotLight,     // light orange
    borderRadius: 16,
    padding: 14,
    marginHorizontal: 16,
    marginTop: 20,
    marginBottom: 20,
  },
  deliveryIcon: {
    fontSize: 24,
    color: Colors.apricotDark,
  },
  deliveryText: {
    fontWeight: '600',
    fontSize: 12,
    color: Colors.apricotDark,
    marginBottom: 6,
  },
  progressBar: {
    height: 5,
    backgroundColor: '#FFD0B5',        // lighter orange track
    borderRadius: 10,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 10,
  },

  // Empty state
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
    opacity: 0.4,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.inkMuted,
  },
});