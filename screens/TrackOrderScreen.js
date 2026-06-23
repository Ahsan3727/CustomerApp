import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { io } from 'socket.io-client';
import AppButton from '../components/AppButton';
import Card from '../components/Card';
import api from '../services/api';
import { Fonts, Radius, Shadows } from '../theme';

// ---------- Native maps (only outside Expo Go) ----------
let MapView = null;
let Marker = null;
let Polyline = null;
if (Constants.appOwnership !== 'expo') {
  try {
    const maps = require('react-native-maps');
    MapView = maps.default || maps;
    Marker = maps.Marker || (MapView && MapView.Marker);
    Polyline = maps.Polyline || (MapView && MapView.Polyline);
  } catch (e) {
    console.warn('react-native-maps not available:', e.message);
  }
}

const Colors = {
  primary: '#FF7F2A',
  primaryLight: '#FFF0E5',
  white: '#FFFFFF',
  gray100: '#f1f5f9',
  gray200: '#e2e8f0',
  gray400: '#9CA3AF',
  gray600: '#475569',
  darkest: '#3E2723',
  orangeText: '#8B4513',
  heroBg: '#FF9F43',
  amber: '#f59e0b',
  green: '#16a34a',
};

// ---------- Leaflet map HTML (ultra‑small markers) ----------
function buildMapHTML(riderLat, riderLng, dropoffLat, dropoffLng) {
  const hasDropoff = dropoffLat != null && dropoffLng != null;
  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.3/dist/leaflet.css" />
    <script src="https://unpkg.com/leaflet@1.9.3/dist/leaflet.js"></script>
    <style>
      body { margin:0; padding:0; background:#FFF6F0; }
      #map { width:100vw; height:100vh; }
      @keyframes pulse {
        0% { box-shadow: 0 0 0 0 rgba(255,127,42,0.6); }
        50% { box-shadow: 0 0 0 8px rgba(255,127,42,0); }
        100% { box-shadow: 0 0 0 0 rgba(255,127,42,0); }
      }
      .rider-pulse { animation: pulse 2s infinite; border-radius: 50%; }
      .dropoff-glow { box-shadow: 0 0 6px rgba(59,130,246,0.5); border-radius: 50%; }
    </style>
  </head>
  <body>
    <div id="map"></div>
    <script>
      var map = L.map('map', { zoomControl: true, attributionControl: false }).setView([${riderLat}, ${riderLng}], 15);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '&copy; OpenStreetMap' }).addTo(map);

      // Tiny rider marker (28x28)
      var riderIcon = L.divIcon({
        className: 'rider-pulse',
        html: '<div style="width:28px;height:28px;background:#FF7F2A;border-radius:50%;border:1.5px solid white;box-shadow:0 1px 6px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;font-size:14px;color:white;">🛵</div>',
        iconSize: [28,28], iconAnchor: [14,28], popupAnchor: [0,-28]
      });

      // Tiny dropoff marker (24x24)
      var dropoffIcon = L.divIcon({
        className: 'dropoff-glow',
        html: '<div style="width:24px;height:24px;background:#3b82f6;border-radius:50%;border:1.5px solid white;box-shadow:0 1px 6px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;font-size:12px;color:white;">🏠</div>',
        iconSize: [24,24], iconAnchor: [12,24], popupAnchor: [0,-24]
      });

      var riderMarker = L.marker([${riderLat}, ${riderLng}], { icon: riderIcon }).addTo(map).bindPopup('🛵 Rider');
      var dropoffMarker = ${hasDropoff ? `L.marker([${dropoffLat}, ${dropoffLng}], { icon: dropoffIcon }).addTo(map).bindPopup('🏠 Your address');` : 'null;'}

      var routeLayer = null;
      async function fetchAndDrawRoute(fromLat, fromLng, toLat, toLng) {
        if (!toLat || !toLng) return;
        try {
          var url = 'https://router.project-osrm.org/route/v1/driving/' + fromLng + ',' + fromLat + ';' + toLng + ',' + toLat + '?overview=full&geometries=geojson';
          var response = await fetch(url);
          var data = await response.json();
          if (data.code === 'Ok' && data.routes.length > 0) {
            var route = data.routes[0].geometry.coordinates.map(function(c) { return [c[1], c[0]]; });
            if (routeLayer) map.removeLayer(routeLayer);
            routeLayer = L.polyline(route, { color: '#FF7F2A', weight: 3, opacity: 0.9, dashArray: '8 6', lineCap: 'round', lineJoin: 'round' }).addTo(map);
            map.fitBounds(routeLayer.getBounds(), { padding: [50, 50] });
            return;
          }
        } catch (e) {}
        if (routeLayer) map.removeLayer(routeLayer);
        routeLayer = L.polyline([[fromLat, fromLng], [toLat, toLng]], { color: '#FF7F2A', weight: 2, opacity: 0.7, dashArray: '6 6', lineCap: 'round' }).addTo(map);
        map.fitBounds(routeLayer.getBounds(), { padding: [50, 50] });
      }

      fetchAndDrawRoute(${riderLat}, ${riderLng}, ${dropoffLat || 0}, ${dropoffLng || 0});

      window.updateRiderLocation = function(lat, lng) {
        riderMarker.setLatLng([lat, lng]);
        fetchAndDrawRoute(lat, lng, ${dropoffLat || 0}, ${dropoffLng || 0});
        map.setView([lat, lng], 15);
      };
    </script>
  </body>
  </html>
  `;
}

export default function TrackOrderScreen({ navigation, route }) {
  const order = route?.params?.order;
  const [riderLocation, setRiderLocation] = useState(null);
  const socketRef = useRef(null);
  const webViewRef = useRef(null);

  // ---------- 1. Initial fetch + polling ----------
  const fetchRiderLocation = useCallback(async () => {
    if (!order?.rider?._id) return;
    try {
      const { data } = await api.get(`/rider/${order.rider._id}/location`);
      if (data && data.lat != null) {
        setRiderLocation({ latitude: data.lat, longitude: data.lng });
      }
    } catch (err) {
      console.warn('Rider location fetch error:', err.message);
    }
  }, [order?.rider?._id]);

  useEffect(() => {
    fetchRiderLocation();
  }, [fetchRiderLocation]);

  useEffect(() => {
    if (!order?.rider?._id) return;
    const interval = setInterval(fetchRiderLocation, 10000);
    return () => clearInterval(interval);
  }, [fetchRiderLocation, order?.rider?._id]);

  // ---------- 2. Socket listener ----------
  useEffect(() => {
    if (!order?.rider?._id) return;
    const connectSocket = async () => {
      const token = await AsyncStorage.getItem('customerToken');
      const customerData = await AsyncStorage.getItem('customerData');
      if (!token || !customerData) return;
      const customer = JSON.parse(customerData);
      const socket = io(Platform.OS === 'web' ? 'http://localhost:5000' : 'http://10.0.2.2:5000', {
        query: { userId: customer._id },
        auth: { token },
      });
      socketRef.current = socket;
      socket.on('riderLocationUpdate', data => {
        if (data.orderId === order._id) {
          setRiderLocation({ latitude: data.lat, longitude: data.lng });
        }
      });
    };
    connectSocket();
    return () => { if (socketRef.current) socketRef.current.disconnect(); };
  }, [order?._id]);

  // ---------- 3. Update WebView map ----------
  useEffect(() => {
    if (webViewRef.current && riderLocation) {
      webViewRef.current.injectJavaScript(`
        window.updateRiderLocation(${riderLocation.latitude}, ${riderLocation.longitude});
      `);
    }
  }, [riderLocation]);

  // ---------- Derived data ----------
  const dropoffLat = order?.deliveryAddress?.lat;
  const dropoffLng = order?.deliveryAddress?.lng;
  const mapLat = riderLocation?.latitude || 31.72;
  const mapLng = riderLocation?.longitude || 72.98;

  const statusSteps = [
    { key: 'pending', label: 'Order Confirmed', icon: '✅' },
    { key: 'packing', label: 'Order Picked / Packed', icon: '📦' },
    { key: 'out_for_delivery', label: 'On the Way', icon: '🚚' },
    { key: 'delivered', label: 'Delivered', icon: '🏠' },
  ];
  const stepIndex = statusSteps.findIndex(s => s.key === (order?.status || 'pending'));

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>📦 Live Tracking</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.orderInfoBar}>
        <Text style={styles.orderId}>Order #{order._id?.slice(-6)}</Text>
        <Text style={styles.arrivalText}>{order?.status === 'delivered' ? 'Delivered' : 'Arriving soon'}</Text>
      </View>

      {/* ---- Map (always visible) ---- */}
      <View style={styles.realMapContainer}>
        {MapView ? (
          <MapView
            style={styles.realMap}
            initialRegion={{
              latitude: mapLat,
              longitude: mapLng,
              latitudeDelta: 0.01,
              longitudeDelta: 0.01,
            }}
            showsUserLocation={false}
            toolbarEnabled={false}
          >
            {riderLocation && (
              <Marker coordinate={riderLocation} title="Rider">
                <View style={styles.riderMarkerBox}>
                  <Text style={styles.riderMarkerIcon}>🛵</Text>
                </View>
              </Marker>
            )}
            {dropoffLat && dropoffLng && (
              <Marker coordinate={{ latitude: dropoffLat, longitude: dropoffLng }} title="You">
                <View style={styles.dropoffMarkerBox}>
                  <Text style={styles.dropoffMarkerIcon}>🏠</Text>
                </View>
              </Marker>
            )}
            {riderLocation && dropoffLat && dropoffLng && (
              <Polyline
                coordinates={[riderLocation, { latitude: dropoffLat, longitude: dropoffLng }]}
                strokeColor="#FF7F2A"
                strokeWidth={2}
                lineDashPattern={[6, 4]}
              />
            )}
          </MapView>
        ) : (
          <WebView
            ref={webViewRef}
            source={{ html: buildMapHTML(mapLat, mapLng, dropoffLat, dropoffLng) }}
            style={styles.realMap}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            startInLoadingState={false}
            scrollEnabled={false}
          />
        )}
      </View>

      <View style={styles.mapLabels}>
        <Text style={styles.mapLabel}>📍 Store</Text>
        <Text style={styles.mapLabel}>🏠 You</Text>
      </View>

      <Card style={styles.stepsCard}>
        <Text style={styles.sectionTitle}>Order Progress</Text>
        {statusSteps.map((step, idx) => {
          const completed = idx < stepIndex;
          const active = idx === stepIndex;
          return (
            <View key={step.key} style={styles.stepRow}>
              <View style={[styles.stepIcon, completed && styles.stepCompleted, active && styles.stepActive, !completed && !active && styles.stepPending]}>
                <Text style={styles.stepIconText}>{completed ? '✓' : active ? '●' : ''}</Text>
              </View>
              <View style={styles.stepInfo}>
                <Text style={[styles.stepLabel, (completed || active) && styles.stepLabelActive]}>{step.label}</Text>
                {active && <Text style={styles.stepTime}>In progress...</Text>}
                {completed && <Text style={styles.stepTime}>Completed</Text>}
              </View>
              {idx < statusSteps.length - 1 && <View style={[styles.stepLine, completed && styles.stepLineCompleted]} />}
            </View>
          );
        })}
      </Card>

      {order.rider && (order.status === 'out_for_delivery' || order.status === 'delivered') && (
        <Card style={styles.driverCard}>
          <View style={styles.driverRow}>
            <View style={styles.driverAvatar}><Text>👨‍🍳</Text></View>
            <View style={{ flex: 1 }}>
              <Text style={styles.driverName}>{order.rider?.name || 'Rider'}</Text>
              <Text style={styles.driverRating}>⭐ {order.rider?.rating || '4.8'}</Text>
              <Text style={styles.driverNote}>Your delivery partner</Text>
            </View>
            <TouchableOpacity style={styles.driverAction}><Text>📞</Text></TouchableOpacity>
            <TouchableOpacity style={styles.driverAction}><Text>💬</Text></TouchableOpacity>
          </View>
        </Card>
      )}

      <Card style={styles.summaryCard}>
        <Text style={styles.sectionTitle}>📋 Order Summary</Text>
        <Text style={styles.summaryText}>{order.items?.length || 0} items · Subtotal Rs. {order.payment?.amount?.toFixed(2)}</Text>
        <View style={styles.divider} />
        <View style={styles.totalRow}><Text style={styles.totalLabel}>Total Paid</Text><Text style={styles.totalValue}>Rs. {order.payment?.amount?.toFixed(2)}</Text></View>
      </Card>

      {order.status === 'out_for_delivery' && (
        <AppButton title="✅ Confirm Delivery Received" style={styles.confirmButton}
          onPress={() => Alert.alert('Confirm', 'Have you received your order?', [
            { text: 'No', style: 'cancel' },
            { text: 'Yes', onPress: () => navigation.goBack() },
          ])} />
      )}
    </ScrollView>
  );
}

// ---------- Styles (ultra‑small native markers) ----------
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF6F0' },
  scrollContent: { paddingBottom: 40 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: Constants.statusBarHeight + 12, paddingHorizontal: 16, paddingBottom: 12, backgroundColor: Colors.heroBg, borderBottomLeftRadius: 20, borderBottomRightRadius: 20, ...Shadows.sm },
  backButton: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center' },
  backText: { fontSize: 24, color: '#FFFFFF', fontWeight: '600' },
  headerTitle: { fontSize: Fonts.sizes.xl, fontWeight: '700', color: '#FFFFFF' },
  placeholder: { width: 44 },
  orderInfoBar: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, marginTop: 16, marginBottom: 8 },
  orderId: { fontSize: 14, fontWeight: '700', color: Colors.darkest },
  arrivalText: { fontSize: 14, color: Colors.amber, fontWeight: '600' },
  realMapContainer: { height: 200, marginHorizontal: 20, borderRadius: Radius.xl, overflow: 'hidden', marginTop: 8 },
  realMap: { flex: 1 },
  mapLabels: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 28, marginTop: -8, marginBottom: 16 },
  mapLabel: { fontSize: 11, color: Colors.orangeText },
  stepsCard: { marginHorizontal: 20, marginBottom: 16 },
  sectionTitle: { fontSize: Fonts.sizes.md, fontWeight: '700', color: Colors.darkest, marginBottom: 12 },
  stepRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 16, position: 'relative' },
  stepIcon: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center', zIndex: 1 },
  stepCompleted: { backgroundColor: Colors.green },
  stepActive: { backgroundColor: Colors.amber },
  stepPending: { backgroundColor: Colors.gray200 },
  stepIconText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
  stepInfo: { flex: 1, marginLeft: 12 },
  stepLabel: { fontSize: 14, fontWeight: '600', color: Colors.gray600 },
  stepLabelActive: { color: Colors.darkest },
  stepTime: { fontSize: 12, color: Colors.gray400, marginTop: 2 },
  stepLine: { position: 'absolute', left: 15, top: 32, bottom: -16, width: 2, backgroundColor: Colors.gray200 },
  stepLineCompleted: { backgroundColor: Colors.green },
  driverCard: { marginHorizontal: 20, marginBottom: 16 },
  driverRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  driverAvatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#fbbf24', justifyContent: 'center', alignItems: 'center' },
  driverName: { fontWeight: '600', color: Colors.darkest },
  driverRating: { fontSize: 12, color: Colors.amber },
  driverNote: { fontSize: 11, color: Colors.gray400 },
  driverAction: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.gray100, justifyContent: 'center', alignItems: 'center' },
  summaryCard: { marginHorizontal: 20, marginBottom: 16 },
  summaryText: { fontSize: 12, color: Colors.orangeText, marginBottom: 4 },
  divider: { height: 1, backgroundColor: Colors.border, marginVertical: 8 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between' },
  totalLabel: { fontWeight: '600', color: Colors.darkest },
  totalValue: { fontWeight: '700', fontSize: 16, color: Colors.primary },
  confirmButton: { marginHorizontal: 20, marginBottom: 12 },
  // Ultra‑small native markers
  riderMarkerBox: {
    alignItems: 'center', justifyContent: 'center',
    width: 28, height: 28,
    backgroundColor: '#FF7F2A',
    borderRadius: 14, borderWidth: 1.5, borderColor: 'white',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.3, shadowRadius: 3, elevation: 3,
  },
  riderMarkerIcon: { fontSize: 14 },
  dropoffMarkerBox: {
    alignItems: 'center', justifyContent: 'center',
    width: 24, height: 24,
    backgroundColor: '#3b82f6',
    borderRadius: 12, borderWidth: 1.5, borderColor: 'white',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.3, shadowRadius: 3, elevation: 3,
  },
  dropoffMarkerIcon: { fontSize: 12 },
});