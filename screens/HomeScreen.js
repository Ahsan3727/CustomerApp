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
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import BottomTabBar from '../components/BottomTabBar';
import CartSummaryBar from '../components/CartSummaryBar';
import ImageCarousel from '../components/ImageCarousel';
import { useCart } from '../context/CartContext';
import api from '../services/api';
import { Shadows } from '../theme';

// Warm orange palette
const Colors = {
  primary: '#FF7F2A',
  primaryLight: '#FFF0E5',
  primaryDark: '#E6691C',
  white: '#FFFFFF',
  gray400: '#9CA3AF',
  darkest: '#3E2723',
  orangeText: '#8B4513',
  heroBg: '#FF9F43',
  border: '#FFD0B5',
  green: '#16a34a',
};

const { width } = Dimensions.get('window');
const numColumns = 3;   // ← now 3 products per row

const categories = ['Fruits', 'Vegetables', 'Dairy', 'Bakery', 'Beverages'];

// Cloudinary thumbnail helper – keeps images lightweight
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

export default function HomeScreen({ navigation }) {
  // ---------- State ----------
  const [products, setProducts] = useState([]);
  const [banners, setBanners] = useState([]);
  const [popularProducts, setPopularProducts] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const { addToCart } = useCart();
  const { cart } = useCart();

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

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

  const fetchBanners = async () => {
    try {
      const { data } = await api.get('/banners');
      setBanners(data || []);
    } catch (e) { console.error(e); }
  };

  const fetchPopularProducts = async () => {
    try {
      const { data } = await api.get('/products/popular');
      setPopularProducts(data.products || []);
    } catch (e) { console.log(e); }
  };

  useEffect(() => {
    Promise.all([fetchProducts(), fetchBanners(), fetchPopularProducts()])
      .finally(() => {
        setLoading(false);
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }).start();
      });
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([fetchProducts(), fetchBanners(), fetchPopularProducts()]);
    setRefreshing(false);
  }, []);

  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: progress,
      duration: 600,
      useNativeDriver: false,
    }).start();
  }, [cartTotal]);

  const filtered = search
    ? products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()))
    : products;

  const getDisplayPrice = (product) => product.adminPrice || product.price;
  const cardWidth = (width - 32 - (numColumns - 1) * 10) / numColumns;   // fit 3 cards

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={{ marginTop: 12, color: Colors.gray400 }}>Loading fresh deals...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* ---- Sticky Header ---- */}
      <View style={styles.header}>
        <View style={styles.searchBox}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            placeholder="Search groceries, fruits & more..."
            placeholderTextColor={Colors.gray400}
            value={search}
            onChangeText={setSearch}
            style={styles.searchInput}
            returnKeyType="search"
          />
          {search !== '' && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Text style={styles.clearIcon}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
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
      </View>

      <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[Colors.primary]}
              tintColor={Colors.primary}
            />
          }
        >
          {/* ---- Image Carousel ---- */}
          <ImageCarousel
            banners={banners}
            onBannerPress={(banner) => {
              if (banner.link) navigation.navigate(banner.link);
            }}
          />

          {/* ---- Hero Section ---- */}
          <View style={styles.hero}>
            <View style={styles.heroTag}>
              <Text style={styles.heroTagText}>🔥 Weekly Special</Text>
            </View>
            <Text style={styles.heroTitle}>Up to 30% Off</Text>
            <Text style={styles.heroSubtitle}>on fresh organic fruits & vegetables</Text>
            <TouchableOpacity style={styles.heroBtn}>
              <Text style={styles.heroBtnText}>Shop Now →</Text>
            </TouchableOpacity>
            <Text style={styles.heroFloat}>🥑</Text>
          </View>

          {/* ---- Offer Cards ---- */}
          <View style={styles.offerRow}>
            <TouchableOpacity style={[styles.offerCard, { backgroundColor: '#FFF0E5' }]}>
              <Text style={styles.offerIcon}>🌿</Text>
              <View>
                <Text style={styles.offerTitle}>Organic</Text>
                <Text style={styles.offerSubtitle}>Save up to 20%</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.offerCard, { backgroundColor: '#FFE8E0' }]}>
              <Text style={styles.offerIcon}>🥩</Text>
              <View>
                <Text style={styles.offerTitle}>Fresh Meat</Text>
                <Text style={styles.offerSubtitle}>15% OFF</Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* ---- Categories ---- */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Shop by Category</Text>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryRow}
          >
            {categories.map(cat => (
              <TouchableOpacity
                key={cat}
                style={styles.chip}
                onPress={() => navigation.navigate('ProductList', { category: cat })}
                activeOpacity={0.7}
              >
                <View style={styles.chipIcon}>
                  <Text style={styles.chipEmoji}>🛍️</Text>
                </View>
                <Text style={styles.chipText}>{cat}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* ---- Popular Products ---- */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>🔥 Trending Now</Text>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.productScroll}
          >
            {popularProducts.map(item => (
              <ProductCardInline
                key={item._id}
                product={item}
                onPress={() => navigation.navigate('ProductDetail', { product: item })}
                onAddToCart={addToCart}
              />
            ))}
          </ScrollView>

          {/* ---- Best Sellers Grid (3 per row) ---- */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>🛒 Best Sellers</Text>
          </View>
          {filtered.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>🛍️</Text>
              <Text style={styles.emptyText}>No products found</Text>
            </View>
          ) : (
            <FlatList
              data={filtered}
              keyExtractor={item => item._id}
              numColumns={numColumns}
              key={numColumns}
              scrollEnabled={false}
              columnWrapperStyle={numColumns > 1 ? styles.row : null}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.productCard, { width: cardWidth }]}
                  activeOpacity={0.85}
                  onPress={() => navigation.navigate('ProductDetail', { product: item })}
                >
                  {/* Product Image */}
                  <View style={styles.imageBox}>
                    {item.image ? (
                      <Image
                        source={{ uri: getThumbnail(item.image, 180) }}
                        style={styles.productImage}
                        resizeMode="cover"
                      />
                    ) : (
                      <Text style={styles.productEmoji}>{item.emoji || '🛍️'}</Text>
                    )}
                    {/* Quick add overlay on image */}
                    <TouchableOpacity
                      style={styles.quickAdd}
                      onPress={() => addToCart(item)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.quickAddText}>+</Text>
                    </TouchableOpacity>
                  </View>
                  {/* Details */}
                  <View style={styles.productDetails}>
                    <Text style={styles.productName} numberOfLines={2}>{item.name}</Text>
                    <View style={styles.priceRow}>
                      <Text style={styles.productPrice}>Rs. {getDisplayPrice(item)}</Text>
                      <Text style={styles.productUnit}>/ {item.unit || 'pc'}</Text>
                    </View>
                  </View>
                </TouchableOpacity>
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
                      width: progressAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: ['0%', '100%'],
                      }),
                      backgroundColor: progress >= 1 ? Colors.green : Colors.primary,
                    },
                  ]}
                />
              </View>
            </View>
          </View>
        </ScrollView>
      </Animated.View>

      {/* ---- Cart Summary ---- */}
      <CartSummaryBar navigation={navigation} />

      {/* ---- Bottom Navigation ---- */}
      <BottomTabBar navigation={navigation} activeScreen="Home" />
    </View>
  );
}

// ---- Inline Popular Product Card ----
function ProductCardInline({ product, onPress, onAddToCart }) {
  return (
    <TouchableOpacity style={styles.productCardInline} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.imageBoxSmall}>
        {product.image ? (
          <Image
            source={{ uri: getThumbnail(product.image, 180) }}
            style={styles.productImageSmall}
            resizeMode="cover"
          />
        ) : (
          <Text style={styles.productEmoji}>{product.emoji || '🛍️'}</Text>
        )}
      </View>
      <Text style={styles.productName} numberOfLines={1}>{product.name}</Text>
      <Text style={styles.productDesc}>{product.description || ''}</Text>
      <View style={styles.productBottom}>
        <Text style={styles.productPrice}>Rs. {(product.adminPrice || product.price).toFixed(2)}</Text>
        <TouchableOpacity style={styles.productAdd} onPress={() => onAddToCart(product)}>
          <Text style={{ color: '#fff', fontWeight: '700' }}>+</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

// ---- Styles ----
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF6F0' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scrollContent: { paddingBottom: 200 },

  // Header
  header: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 10,
    paddingTop: Constants.statusBarHeight + 8, backgroundColor: '#FF9F43',
    borderBottomLeftRadius: 20, borderBottomRightRadius: 20, ...Shadows.md,
  },
  searchBox: {
    flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF',
    borderRadius: 24, paddingLeft: 16, marginRight: 8, height: 44,
  },
  searchIcon: { fontSize: 16, marginRight: 8, color: Colors.gray400 },
  searchInput: { flex: 1, fontSize: 14, color: Colors.darkest },
  clearIcon: { fontSize: 18, color: Colors.gray400, marginRight: 12 },
  cartButton: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center' },
  cartIcon: { fontSize: 24 },
  cartBadge: {
    position: 'absolute', top: 2, right: 2,
    backgroundColor: '#E6691C', borderRadius: 10, width: 20, height: 20,
    justifyContent: 'center', alignItems: 'center',
  },
  cartBadgeText: { color: '#FFF', fontSize: 11, fontWeight: '700' },

  // Hero
  hero: {
    backgroundColor: '#FF9F43', borderRadius: 20, padding: 22, margin: 16,
    position: 'relative', overflow: 'hidden', ...Shadows.lg,
  },
  heroTag: {
    backgroundColor: 'rgba(255,255,255,0.3)', paddingHorizontal: 12, paddingVertical: 5,
    borderRadius: 20, alignSelf: 'flex-start', marginBottom: 8,
  },
  heroTagText: { color: '#fff', fontSize: 10, fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase' },
  heroTitle: { color: '#fff', fontSize: 24, fontWeight: '800', letterSpacing: -0.6, lineHeight: 28, marginBottom: 4 },
  heroSubtitle: { color: 'rgba(255,255,255,0.9)', fontSize: 13, marginBottom: 14 },
  heroBtn: {
    backgroundColor: '#FFFFFF', paddingVertical: 10, paddingHorizontal: 18,
    borderRadius: 20, alignSelf: 'flex-start',
    shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 14, elevation: 3,
  },
  heroBtnText: { color: '#FF7F2A', fontWeight: '700', fontSize: 13 },
  heroFloat: { position: 'absolute', right: 12, top: '50%', marginTop: -30, fontSize: 60, opacity: 0.8 },

  // Offers
  offerRow: { flexDirection: 'row', gap: 10, marginHorizontal: 16, marginBottom: 16 },
  offerCard: {
    flex: 1, borderRadius: 16, padding: 14, flexDirection: 'row', alignItems: 'center',
    ...Shadows.sm, gap: 10,
  },
  offerIcon: { fontSize: 36 },
  offerTitle: { fontWeight: '700', fontSize: 14, color: Colors.darkest },
  offerSubtitle: { fontSize: 11, color: '#b45309', marginTop: 2 },

  // Sections
  sectionHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, marginBottom: 12, marginTop: 8,
  },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: '#3E2723', letterSpacing: -0.3 },

  // Categories
  categoryRow: { paddingLeft: 12, paddingRight: 8, marginBottom: 18 },
  chip: { alignItems: 'center', marginRight: 20, width: 70 },
  chipIcon: {
    width: 54, height: 54, borderRadius: 16, backgroundColor: '#FFFFFF',
    justifyContent: 'center', alignItems: 'center', marginBottom: 6, ...Shadows.sm,
  },
  chipEmoji: { fontSize: 26 },
  chipText: { fontSize: 11, color: '#3E2723', fontWeight: '600' },

  // Products horizontal
  productScroll: { marginBottom: 18, paddingLeft: 16 },
  productCardInline: {
    backgroundColor: '#FFFFFF', borderRadius: 16, padding: 12, marginRight: 14,
    width: 150, borderWidth: 1, borderColor: '#FFD0B5', ...Shadows.sm,
  },

  // Product grid (3 per row)
  productCard: {
    backgroundColor: '#FFFFFF', borderRadius: 16, marginHorizontal: 4,
    marginBottom: 12, overflow: 'hidden', ...Shadows.sm,
  },
  imageBox: {
    width: '100%', height: 110, backgroundColor: '#f5f5f5',
    justifyContent: 'center', alignItems: 'center',
  },
  imageBoxSmall: {
    width: '100%', height: 90, borderRadius: 12,
    backgroundColor: '#f5f5f5', justifyContent: 'center', alignItems: 'center',
    marginBottom: 8, overflow: 'hidden',
  },
  productImage: { width: '100%', height: '100%' },
  productImageSmall: { width: '100%', height: '100%' },
  productEmoji: { fontSize: 44, textAlign: 'center' },
  quickAdd: {
    position: 'absolute', bottom: 8, right: 8,
    backgroundColor: Colors.primary, borderRadius: 15, width: 30, height: 30,
    justifyContent: 'center', alignItems: 'center',
    shadowColor: '#FF7F2A', shadowOpacity: 0.4, shadowRadius: 8, elevation: 4,
  },
  quickAddText: { color: '#FFF', fontWeight: '700', fontSize: 16 },
  productDetails: { padding: 10 },
  productName: { fontWeight: '600', fontSize: 12, color: '#3E2723', lineHeight: 16, marginBottom: 4 },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', gap: 2 },
  productPrice: { fontWeight: '700', fontSize: 14, color: '#E6691C' },
  productUnit: { fontSize: 11, color: '#9A3412' },
  productDesc: { fontSize: 10, color: '#9A3412', marginVertical: 2, textAlign: 'center' },
  productBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8, width: '100%' },
  productAdd: {
    width: 30, height: 30, borderRadius: 15, backgroundColor: '#FF7F2A',
    justifyContent: 'center', alignItems: 'center',
    shadowColor: '#FF7F2A', shadowOpacity: 0.3, shadowRadius: 8, elevation: 3,
  },

  emptyState: { alignItems: 'center', paddingVertical: 40 },
  emptyIcon: { fontSize: 48, marginBottom: 12, opacity: 0.5 },
  emptyText: { fontSize: 16, fontWeight: '600', color: '#9A3412' },

  // Delivery
  deliveryBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#FFF0E5', borderRadius: 16, padding: 12,
    marginHorizontal: 16, marginTop: 8, marginBottom: 20,
    borderWidth: 1, borderColor: '#FFD0B5',
  },
  deliveryIcon: { fontSize: 26 },
  deliveryText: { fontWeight: '600', fontSize: 12, color: Colors.darkest },
  progressBar: {
    height: 5, backgroundColor: '#FFD0B5', borderRadius: 10,
    overflow: 'hidden', marginTop: 4,
  },
  progressFill: { height: '100%', borderRadius: 10 },

  row: { justifyContent: 'space-between', paddingHorizontal: 8 },
});