import Constants from 'expo-constants';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import BottomTabBar from '../components/BottomTabBar';
import ProductCard from '../components/ProductCard';
import { useCart } from '../context/CartContext';
import api from '../services/api';
import { Colors, Radius, Shadows } from '../theme';

const { width } = Dimensions.get('window');
const numColumns = 2;
const gap = 12;
const cardWidth = (width - 32 - (numColumns - 1) * gap) / numColumns;

// Recent search chips (static for demo, could be fetched from storage)
const RECENT_SEARCHES = ['Apples', 'Milk', 'Bread', 'Eggs', 'Juice'];

export default function SearchScreen({ navigation }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [popularProducts, setPopularProducts] = useState([]);
  const [isFocused, setIsFocused] = useState(false);
  const { addToCart } = useCart();
  const fadeAnim = useRef(new Animated.Value(1)).current;

  // Fetch popular products for the initial state
  const fetchPopular = async () => {
    try {
      const { data } = await api.get('/products/popular');
      setPopularProducts(data.products || []);
    } catch (e) { console.log(e); }
  };

  useEffect(() => {
    fetchPopular();
  }, []);

  // Debounced search – waits 500ms after the user stops typing
  useEffect(() => {
    const timer = setTimeout(() => {
      if (query.trim().length > 0) {
        performSearch(query.trim());
      } else {
        setResults([]);
        setHasSearched(false);
        Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }).start();
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [query]);

  const performSearch = async (searchTerm) => {
    setLoading(true);
    setHasSearched(true);
    // Quick fade transition
    Animated.timing(fadeAnim, { toValue: 0, duration: 120, useNativeDriver: true }).start();
    try {
      const { data } = await api.get(`/products?search=${searchTerm}`);
      setResults(data.products || []);
    } catch (error) {
      console.error('Search error:', error);
      setResults([]);
    } finally {
      setLoading(false);
      Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }).start();
    }
  };

  const clearSearch = () => {
    setQuery('');
    setResults([]);
    setHasSearched(false);
    setIsFocused(false);
  };

  const handleProductPress = (product) => {
    navigation.navigate('ProductDetail', { product });
  };

  // Render product grid item
  const renderProductItem = ({ item }) => (
    <View style={styles.productCardWrapper}>
      <ProductCard
        product={item}
        onPress={() => handleProductPress(item)}
        onAddToCart={addToCart}
      />
    </View>
  );

  // Recent searches chip bar
  const renderRecentChips = () => (
    <View style={styles.chipSection}>
      <Text style={styles.sectionTitle}>Recent searches</Text>
      <View style={styles.chipRow}>
        {RECENT_SEARCHES.map((term) => (
          <TouchableOpacity
            key={term}
            style={styles.chip}
            onPress={() => setQuery(term)}
            activeOpacity={0.7}
          >
            <Text style={styles.chipIcon}>🕒</Text>
            <Text style={styles.chipLabel}>{term}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  // Popular products grid (initial view)
  const renderPopular = () => (
    <View style={styles.popularSection}>
      <Text style={styles.sectionTitle}>🔥 Popular right now</Text>
      {popularProducts.length > 0 ? (
        <FlatList
          data={popularProducts}
          keyExtractor={(item) => item._id}
          numColumns={numColumns}
          scrollEnabled={false}
          columnWrapperStyle={styles.columnWrapper}
          renderItem={({ item }) => (
            <View style={styles.productCardWrapper}>
              <ProductCard
                product={item}
                onPress={() => handleProductPress(item)}
                onAddToCart={addToCart}
              />
            </View>
          )}
        />
      ) : (
        <Text style={styles.emptyText}>Loading popular items...</Text>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>

        <View style={[styles.searchInputWrapper, isFocused && styles.searchInputFocused]}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search atta, milk, eggs…"
            placeholderTextColor={Colors.inkMuted}
            value={query}
            onChangeText={setQuery}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            autoFocus={false}
            returnKeyType="search"
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={clearSearch} style={styles.clearButton}>
              <Text style={styles.clearText}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Main content */}
      <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={Colors.apricot} />
            <Text style={styles.loadingText}>Searching...</Text>
          </View>
        ) : hasSearched && results.length === 0 ? (
          // Empty search result
          <View style={styles.centered}>
            <Text style={styles.emptyIcon}>🔍</Text>
            <Text style={styles.emptyTitle}>No matches found</Text>
            <Text style={styles.emptySubtitle}>Try a different keyword like “milk” or “bread”.</Text>
          </View>
        ) : !hasSearched ? (
          // Initial state: recent chips + popular grid
          <FlatList
            data={[]}
            renderItem={null}
            ListHeaderComponent={
              <>
                {renderRecentChips()}
                {renderPopular()}
              </>
            }
            keyExtractor={(item) => item?._id || 'header'}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          />
        ) : (
          // Search results grid
          <FlatList
            data={results}
            keyExtractor={(item) => item._id}
            renderItem={renderProductItem}
            numColumns={numColumns}
            columnWrapperStyle={styles.columnWrapper}
            contentContainerStyle={styles.listContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          />
        )}
      </Animated.View>

      {/* Bottom tab bar */}
      <BottomTabBar navigation={navigation} activeScreen="Search" />
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
    paddingTop: Constants.statusBarHeight + 12,
    paddingHorizontal: 12,
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
    marginRight: 10,
  },
  backText: {
    fontSize: 20,
    color: Colors.white,
    fontWeight: '700',
  },
  searchInputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 44,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  searchInputFocused: {
    borderColor: Colors.apricotDark,
  },
  searchIcon: {
    fontSize: 16,
    marginRight: 8,
    color: Colors.inkMuted,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: Colors.ink,
    fontWeight: '500',
    paddingVertical: 0,
  },
  clearButton: {
    padding: 4,
  },
  clearText: {
    fontSize: 18,
    color: Colors.inkMuted,
    fontWeight: '600',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: Colors.inkMuted,
  },
  emptyIcon: {
    fontSize: 56,
    marginBottom: 16,
    color: Colors.border,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.ink,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: Colors.inkMuted,
    textAlign: 'center',
    lineHeight: 20,
  },

  // Chip section
  chipSection: {
    marginTop: 20,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.ink,
    marginBottom: 12,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.full,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  chipIcon: {
    fontSize: 13,
    marginRight: 6,
    color: Colors.inkMuted,
  },
  chipLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.ink,
  },

  // Popular grid
  popularSection: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  columnWrapper: {
    justifyContent: 'space-between',
  },
  productCardWrapper: {
    width: cardWidth,
    marginBottom: 12,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 100,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  emptyText: {
    fontSize: 13,
    color: Colors.inkMuted,
    textAlign: 'center',
    marginTop: 20,
  },
});