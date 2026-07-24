import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  Image, ActivityIndicator, RefreshControl,
} from 'react-native';
import Constants from 'expo-constants';
import api from '../services/api';
import { Colors, Fonts, Radius, Shadows } from '../theme';

const TYPE_ICON = {
  sabzi: '🥬', fruit: '🍎', nashta: '🍳', dawat: '🎉', recipe: '🍲', custom: '🎯',
};

export default function BundleListScreen({ navigation }) {
  const [bundles, setBundles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchBundles = async () => {
    try {
      const { data } = await api.get('/bundles');
      setBundles(data.bundles || []);
    } catch (e) {
      console.log(e);
    }
  };

  useEffect(() => {
    fetchBundles().finally(() => setLoading(false));
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchBundles();
    setRefreshing(false);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Budget Bundles</Text>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={Colors.apricot} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.apricot]} />}
        >
          <Text style={styles.intro}>
            A curated set of items at a fixed total price — see exactly what's inside before you add it to cart.
          </Text>

          {bundles.length === 0 ? (
            <View style={styles.empty}>
              <Text style={{ fontSize: 44, marginBottom: 10 }}>🎯</Text>
              <Text style={styles.emptyText}>No bundles available right now — check back soon.</Text>
            </View>
          ) : (
            bundles.map((bundle) => (
              <TouchableOpacity
                key={bundle._id}
                style={styles.card}
                activeOpacity={0.85}
                onPress={() => navigation.navigate('BundleDetail', { bundleId: bundle._id })}
              >
                <View style={styles.imageBox}>
                  {bundle.image ? (
                    <Image source={{ uri: bundle.image }} style={styles.image} resizeMode="cover" />
                  ) : (
                    <Text style={{ fontSize: 40 }}>{TYPE_ICON[bundle.type] || '🎯'}</Text>
                  )}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardName} numberOfLines={2}>{bundle.name}</Text>
                  <Text style={styles.cardItems} numberOfLines={1}>
                    {(bundle.items || []).map((i) => i.label || i.product?.name).filter(Boolean).join(' · ')}
                  </Text>
                  <Text style={styles.cardPrice}>Rs. {bundle.targetPrice}</Text>
                </View>
              </TouchableOpacity>
            ))
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.linen },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingTop: Constants.statusBarHeight + 8, paddingHorizontal: 16, paddingBottom: 14,
    backgroundColor: Colors.apricot, borderBottomLeftRadius: 24, borderBottomRightRadius: 24, ...Shadows.md,
  },
  backButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  backText: { fontSize: 22, color: Colors.white, fontWeight: '600' },
  headerTitle: { fontSize: 17, fontWeight: '700', color: Colors.white, ...Fonts.bold },
  intro: { fontSize: 12.5, color: Colors.inkMuted, marginBottom: 14, lineHeight: 18 },
  empty: { alignItems: 'center', paddingVertical: 60 },
  emptyText: { color: Colors.inkMuted, fontSize: 13, textAlign: 'center', paddingHorizontal: 30 },
  card: {
    flexDirection: 'row', backgroundColor: Colors.white, borderRadius: Radius.lg, padding: 12,
    marginBottom: 12, borderWidth: 1, borderColor: Colors.border, ...Shadows.sm,
  },
  imageBox: {
    width: 68, height: 68, borderRadius: 14, backgroundColor: Colors.apricotLight,
    justifyContent: 'center', alignItems: 'center', overflow: 'hidden', marginRight: 12,
  },
  image: { width: '100%', height: '100%' },
  cardName: { fontWeight: '700', fontSize: 14.5, color: Colors.ink, marginBottom: 4 },
  cardItems: { fontSize: 11.5, color: Colors.inkMuted, marginBottom: 6 },
  cardPrice: { fontWeight: '800', fontSize: 15, color: Colors.apricotDark },
});
