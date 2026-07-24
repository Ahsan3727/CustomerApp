import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  Image, ActivityIndicator, Alert,
} from 'react-native';
import Constants from 'expo-constants';
import api from '../services/api';
import { useCart } from '../context/CartContext';
import { Colors, Fonts, Radius, Shadows } from '../theme';

const TYPE_ICON = {
  sabzi: '🥬', fruit: '🍎', nashta: '🍳', dawat: '🎉', recipe: '🍲', custom: '🎯',
};

export default function BundleDetailScreen({ navigation, route }) {
  const { bundleId } = route.params || {};
  const [bundle, setBundle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const { addBundleToCart } = useCart();

  useEffect(() => {
    api.get(`/bundles/${bundleId}`)
      .then((res) => setBundle(res.data.bundle))
      .catch((e) => console.log(e))
      .finally(() => setLoading(false));
  }, [bundleId]);

  const itemsTotal = (bundle?.items || []).reduce((sum, i) => sum + (i.allocatedPrice || 0), 0);

  const handleAddAll = () => {
    if (!bundle) return;
    setAdding(true);
    try {
      addBundleToCart(bundle);
      Alert.alert('Added to cart', `${bundle.name} — all ${bundle.items.length} items added.`, [
        { text: 'Keep browsing', style: 'cancel' },
        { text: 'Go to cart', onPress: () => navigation.navigate('Cart') },
      ]);
    } finally {
      setAdding(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={Colors.apricot} />
      </View>
    );
  }

  if (!bundle) {
    return (
      <View style={styles.centered}>
        <Text style={{ fontSize: 40, marginBottom: 10 }}>😕</Text>
        <Text style={{ color: Colors.inkMuted }}>This bundle isn't available anymore.</Text>
        <TouchableOpacity style={styles.backLink} onPress={() => navigation.goBack()}>
          <Text style={{ color: Colors.apricotDark, fontWeight: '700' }}>Go back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{bundle.name}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 120 }}>
        <View style={styles.hero}>
          {bundle.image ? (
            <Image source={{ uri: bundle.image }} style={styles.heroImage} resizeMode="cover" />
          ) : (
            <Text style={{ fontSize: 56 }}>{TYPE_ICON[bundle.type] || '🎯'}</Text>
          )}
        </View>

        <Text style={styles.name}>{bundle.name}</Text>
        {!!bundle.description && <Text style={styles.description}>{bundle.description}</Text>}

        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total price</Text>
          <Text style={styles.totalValue}>Rs. {bundle.targetPrice}</Text>
        </View>

        {/* ---- Itemized breakdown — always visible, this is the whole point ---- */}
        <Text style={styles.sectionTitle}>What's inside</Text>
        {(bundle.items || []).map((item, index) => (
          <View style={styles.itemRow} key={index}>
            <View style={{ flex: 1 }}>
              <Text style={styles.itemName}>{item.label || item.product?.name}</Text>
              <Text style={styles.itemQty}>
                {item.quantity} {item.product?.unit || ''}
              </Text>
            </View>
            <Text style={styles.itemPrice}>Rs. {item.allocatedPrice}</Text>
          </View>
        ))}

        <View style={styles.checkRow}>
          <Text style={styles.checkLabel}>Adds up to</Text>
          <Text style={styles.checkValue}>Rs. {itemsTotal}</Text>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <View>
          <Text style={styles.footerLabel}>Total</Text>
          <Text style={styles.footerPrice}>Rs. {bundle.targetPrice}</Text>
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={handleAddAll} disabled={adding} activeOpacity={0.85}>
          <Text style={styles.addBtnText}>{adding ? 'Adding…' : `Add all ${bundle.items.length} items to cart`}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.linen },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.linen, padding: 24 },
  backLink: { marginTop: 14 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingTop: Constants.statusBarHeight + 8, paddingHorizontal: 16, paddingBottom: 14,
    backgroundColor: Colors.apricot, borderBottomLeftRadius: 24, borderBottomRightRadius: 24, ...Shadows.md,
  },
  backButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  backText: { fontSize: 22, color: Colors.white, fontWeight: '600' },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 15, fontWeight: '700', color: Colors.white, ...Fonts.bold },
  hero: {
    height: 150, borderRadius: Radius.lg, backgroundColor: Colors.apricotLight,
    justifyContent: 'center', alignItems: 'center', overflow: 'hidden', marginBottom: 16,
  },
  heroImage: { width: '100%', height: '100%' },
  name: { fontSize: 19, fontWeight: '800', color: Colors.ink, marginBottom: 6, ...Fonts.bold },
  description: { fontSize: 13, color: Colors.inkMuted, marginBottom: 14, lineHeight: 19 },
  totalRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: Colors.white, borderRadius: Radius.md, padding: 14, marginBottom: 18,
    borderWidth: 1, borderColor: Colors.border,
  },
  totalLabel: { fontSize: 13, fontWeight: '600', color: Colors.inkMuted },
  totalValue: { fontSize: 20, fontWeight: '800', color: Colors.apricotDark },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: Colors.ink, marginBottom: 10 },
  itemRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  itemName: { fontSize: 13.5, fontWeight: '600', color: Colors.ink },
  itemQty: { fontSize: 11.5, color: Colors.inkMuted, marginTop: 2 },
  itemPrice: { fontSize: 14, fontWeight: '700', color: Colors.ink },
  checkRow: {
    flexDirection: 'row', justifyContent: 'space-between', paddingTop: 12, marginTop: 4,
  },
  checkLabel: { fontSize: 12.5, color: Colors.inkMuted, fontWeight: '600' },
  checkValue: { fontSize: 12.5, color: Colors.inkMuted, fontWeight: '700' },
  footer: {
    position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: Colors.white,
    borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 16,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, ...Shadows.md,
  },
  footerLabel: { fontSize: 11, color: Colors.inkMuted, fontWeight: '600' },
  footerPrice: { fontSize: 17, fontWeight: '800', color: Colors.ink },
  addBtn: {
    flex: 1, marginLeft: 14, backgroundColor: Colors.apricot, borderRadius: Radius.full,
    paddingVertical: 14, alignItems: 'center', justifyContent: 'center',
  },
  addBtnText: { color: Colors.white, fontWeight: '700', fontSize: 13.5 },
});
