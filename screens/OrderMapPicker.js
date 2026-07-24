import * as Location from 'expo-location';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import AppButton from '../components/AppButton';
import { useCart } from '../context/CartContext';
import api from '../services/api';

// Always use WebView map – no native maps needed
const MapView = null;
const Marker = null;

// Warm orange palette
const Colors = {
  primary: '#FF7F2A',
  white: '#FFFFFF',
  gray400: '#9CA3AF',
  darkest: '#3E2723',
  orangeText: '#8B4513',
  heroBg: '#FF9F43',
};

// ---------- Leaflet map HTML ----------
const mapHTML = (lat, lng) => `
  <!DOCTYPE html>
  <html>
  <head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.3/dist/leaflet.css" />
    <script src="https://unpkg.com/leaflet@1.9.3/dist/leaflet.js"></script>
    <style>
      body { margin:0; padding:0; }
      #map { width:100vw; height:100vh; }
    </style>
  </head>
  <body>
    <div id="map"></div>
    <script>
      const map = L.map('map', { zoomControl: true }).setView([${lat}, ${lng}], 15);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap'
      }).addTo(map);

      const marker = L.marker([${lat}, ${lng}], { draggable: true }).addTo(map);

      marker.on('dragend', function(e) {
        const pos = e.target.getLatLng();
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'markerDrag',
          lat: pos.lat,
          lng: pos.lng
        }));
      });

      map.on('click', function(e) {
        marker.setLatLng(e.latlng);
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'markerDrag',
          lat: e.latlng.lat,
          lng: e.latlng.lng
        }));
      });

      // Function called from React Native to update the location
      window.updateLocation = function(lat, lng) {
        marker.setLatLng([lat, lng]);
        map.setView([lat, lng], 15);
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'markerDrag',
          lat: lat,
          lng: lng
        }));
      };

      // Send initial position
      window.ReactNativeWebView.postMessage(JSON.stringify({
        type: 'markerDrag',
        lat: marker.getLatLng().lat,
        lng: marker.getLatLng().lng
      }));
    </script>
  </body>
  </html>
`;

export default function OrderMapPicker({ navigation, route }) {
  const { cartItems, apiFunc } = route.params;
  const { clearCart } = useCart();
  const insets = useSafeAreaInsets();

  const [location, setLocation] = useState(null);
  const [region, setRegion] = useState({
    latitude: 31.72,
    longitude: 72.98,
    latitudeDelta: 0.005,
    longitudeDelta: 0.005,
  });
  const [landmark, setLandmark] = useState('');
  const [loading, setLoading] = useState(false);
  const [locating, setLocating] = useState(true);
  const mapRef = useRef(null);
  const webViewRef = useRef(null);

  // ---------- Get current location ----------
  const getCurrentLocation = async () => {
    setLocating(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please grant location access to use this feature.');
        setLocating(false);
        return;
      }
      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      const newLoc = {
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      };
      setLocation(newLoc);

      // WebView map – move marker via injected JS
      if (webViewRef.current) {
        webViewRef.current.injectJavaScript(`
          window.updateLocation(${newLoc.latitude}, ${newLoc.longitude});
        `);
      }
    } catch (error) {
      Alert.alert('Error', 'Could not fetch your location. Drag the pin manually.');
    } finally {
      setLocating(false);
    }
  };

  useEffect(() => {
    // WebView will load with initial map region and we can still get location later
    setLocating(false);
  }, []);

  // ---------- Handlers ----------
  const handleWebViewMessage = (event) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'markerDrag') {
        setLocation({ latitude: data.lat, longitude: data.lng });
      }
    } catch (e) {
      // ignore malformed messages
    }
  };

  const handleConfirm = async () => {
    // Allow order even without location (landmark only)
    setLoading(true);
    try {
      const { data: order } = await apiFunc({
        items: cartItems,
        deliveryAddress: {
          lat: location?.latitude || 0,
          lng: location?.longitude || 0,
          landmark: landmark.trim(),
        },
        payment: { method: 'cod' },
      });

      // Update customer's current location
      if (location) {
        await api.put('/auth/location', { lat: location.latitude, lng: location.longitude });
      }

      clearCart();
      navigation.replace('OrderConfirm', { order });
    } catch (error) {
      console.error('Order error:', error.response?.data);
      Alert.alert('Error', error.response?.data?.message || 'Failed to place order');
    } finally {
      setLoading(false);
    }
  };

  // ---------- Render ----------
  return (
    <View style={styles.container}>
      {/* Map – always WebView */}
      <View style={StyleSheet.absoluteFillObject}>
        <WebView
          ref={webViewRef}
          source={{ html: mapHTML(region.latitude, region.longitude) }}
          style={{ flex: 1 }}
          onMessage={handleWebViewMessage}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          startInLoadingState={false}
        />
      </View>

      {/* Center hint (when no location yet) */}
      {!location && !locating && (
        <View style={styles.centerHint}>
          <Text style={styles.centerHintText}>📍 Drag the pin to set your delivery location</Text>
        </View>
      )}

      {/* Re‑center GPS button */}
      <TouchableOpacity
        style={[styles.locateButton, { top: insets.top + 20 }]}
        onPress={getCurrentLocation}
        disabled={locating}
        activeOpacity={0.8}
      >
        {locating ? (
          <ActivityIndicator size="small" color={Colors.primary} />
        ) : (
          <Text style={styles.locateButtonText}>📍 My Location</Text>
        )}
      </TouchableOpacity>

      {/* Back button */}
      <TouchableOpacity
        style={[styles.backBtn, { top: insets.top + 20 }]}
        onPress={() => navigation.goBack()}
        activeOpacity={0.8}
      >
        <Text style={styles.backBtnText}>←</Text>
      </TouchableOpacity>

      {/* Bottom card */}
      <View style={[styles.bottomCard, { paddingBottom: insets.bottom + 16 }]}>
        <Text style={styles.instructionText}>
          Drag the pin on the map to your delivery spot
        </Text>
        <TextInput
          style={styles.landmarkInput}
          placeholder="Landmark (e.g., Near Jamia Masjid)"
          placeholderTextColor={Colors.gray400}
          value={landmark}
          onChangeText={setLandmark}
        />
        <AppButton
          title={loading ? 'Placing Order...' : 'Confirm Location & Place Order'}
          onPress={handleConfirm}
          loading={loading}
        />
      </View>
    </View>
  );
}

// ---------- Styles ----------
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF6F0' },
  centerHint: {
    position: 'absolute',
    top: '50%',
    alignSelf: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  centerHintText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  locateButton: {
    position: 'absolute',
    right: 20,
    backgroundColor: Colors.white,
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 25,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 10,
  },
  locateButtonText: { fontSize: 13, fontWeight: '700', color: Colors.primary },
  backBtn: {
    position: 'absolute',
    left: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
    zIndex: 10,
  },
  backBtnText: { fontSize: 22, fontWeight: '700', color: Colors.primary },
  bottomCard: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 20,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 8,
  },
  instructionText: {
    fontSize: 15,
    color: Colors.darkest,
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 22,
  },
  landmarkInput: {
    borderWidth: 1.5,
    borderColor: '#FFD0B5',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    marginBottom: 16,
    backgroundColor: '#FFF6F0',
    color: Colors.darkest,
  },
});