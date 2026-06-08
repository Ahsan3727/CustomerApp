import Constants from 'expo-constants'; // ✅ for environment check
import * as Location from 'expo-location';
import { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import AppButton from '../components/AppButton';
import InputGroup from '../components/InputGroup';
import { useAuth } from '../context/AuthContext';

// ---------- Only load react-native-maps outside Expo Go ----------
let MapView = null;
let Marker = null;
if (Constants.appOwnership !== 'expo') {
  const maps = require('react-native-maps');
  MapView = maps.default;
  Marker = maps.Marker;
}

// Warm orange palette (same as login)
const Colors = {
  bgTop: '#FF9F43',
  bgBottom: '#FFF6F0',
  white: '#FFFFFF',
  cardBg: '#FFFFFF',
  lightOrange: '#FFF0E5',
  border: '#FFD0B5',
  orange500: '#FF7F2A',
  orange600: '#E6691C',
  orangeText: '#8B4513',
  darkest: '#3E2723',
};

export default function SignupScreen({ navigation }) {
  const { signup } = useAuth();

  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [street, setStreet] = useState('');
  const [city, setCity] = useState('');
  const [landmark, setLandmark] = useState('');
  const [location, setLocation] = useState(null);
  const [mapRegion, setMapRegion] = useState({
    latitude: 31.72,
    longitude: 72.98,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  });
  const [loadingLocation, setLoadingLocation] = useState(false);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const [signupLoading, setSignupLoading] = useState(false);

  const getCurrentLocation = async () => {
    setLoadingLocation(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location permission is required to set your address.');
        return;
      }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      const newLoc = { latitude: loc.coords.latitude, longitude: loc.coords.longitude };
      setLocation(newLoc);
      setMapRegion({
        latitude: newLoc.latitude,
        longitude: newLoc.longitude,
        latitudeDelta: 0.005,
        longitudeDelta: 0.005,
      });
      if (mapRef.current) {
        mapRef.current.animateToRegion({
          ...newLoc,
          latitudeDelta: 0.005,
          longitudeDelta: 0.005,
        }, 1000);
      }
    } catch (error) {
      Alert.alert('Error', 'Could not fetch location.');
    } finally {
      setLoadingLocation(false);
    }
  };

  const onMarkerDragEnd = (e) => {
    const { latitude, longitude } = e.nativeEvent.coordinate;
    setLocation({ latitude, longitude });
  };

  const handleNext = () => {
    if (step === 1) {
      if (!name.trim() || !phone.trim()) {
        Alert.alert('Error', 'Name and Phone are required.');
        return;
      }
      if (password.length < 6) {
        Alert.alert('Error', 'Password must be at least 6 characters.');
        return;
      }
      if (password !== confirmPassword) {
        Alert.alert('Error', 'Passwords do not match.');
        return;
      }
      setStep(2);
    }
  };

  const handleSignup = async () => {
    if (!street.trim() || !city.trim()) {
      Alert.alert('Error', 'Please enter street and city at minimum.');
      return;
    }

    const address = {
      street: street.trim(),
      city: city.trim(),
      state: '',
      zip: '',
      landmark: landmark.trim(),
      lat: location?.latitude,
      lng: location?.longitude,
    };

    setSignupLoading(true);
    const result = await signup(name.trim(), email.trim(), phone.trim(), password, address);
    setSignupLoading(false);

    if (!result.success) {
      Alert.alert('Signup Failed', result.message);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.headerBg}>
          <Text style={styles.appName}>GROXO</Text>
          <Text style={styles.subtitle}>Create Account</Text>
        </View>

        <View style={styles.card}>
          <View style={styles.stepIndicator}>
            <View style={[styles.stepDot, step === 1 && styles.activeStepDot]} />
            <View style={styles.stepLine} />
            <View style={[styles.stepDot, step === 2 && styles.activeStepDot]} />
          </View>

          {step === 1 && (
            <>
              <Text style={styles.sectionTitle}>Personal Details</Text>
              <InputGroup icon="👤" placeholder="Full Name *" value={name} onChangeText={setName} />
              <InputGroup icon="📧" placeholder="Email (optional)" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
              <InputGroup icon="🇵🇰 +92" placeholder="Phone * (300 1234567)" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
              <InputGroup
                icon="🔒"
                placeholder="Password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                rightIcon={{ icon: showPassword ? '🙈' : '👁️', onPress: () => setShowPassword(!showPassword) }}
              />
              <InputGroup
                icon="🔒"
                placeholder="Confirm Password *"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showConfirmPassword}
                rightIcon={{ icon: showConfirmPassword ? '🙈' : '👁️', onPress: () => setShowConfirmPassword(!showConfirmPassword) }}
              />
              <AppButton title="Next → Address" onPress={handleNext} style={{ marginTop: 12 }} />
            </>
          )}

          {step === 2 && (
            <>
              <Text style={styles.sectionTitle}>Delivery Address</Text>

              {/* Map – only if native module is available */}
              {MapView ? (
                <View style={styles.mapContainer}>
                  <MapView
                    ref={mapRef}
                    style={styles.map}
                    initialRegion={mapRegion}
                    showsUserLocation={false}
                    toolbarEnabled={false}
                  >
                    {location && (
                      <Marker coordinate={location} draggable onDragEnd={onMarkerDragEnd} ref={markerRef} />
                    )}
                  </MapView>
                  <TouchableOpacity
                    style={styles.locateButton}
                    onPress={getCurrentLocation}
                    disabled={loadingLocation}
                  >
                    {loadingLocation ? (
                      <ActivityIndicator color="#FF7F2A" />
                    ) : (
                      <Text style={styles.locateButtonText}>📍 Use My Location</Text>
                    )}
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.mapPlaceholder}>
                  <Text style={{ color: '#8B4513', fontWeight: '600' }}>📍 Map unavailable in Expo Go</Text>
                  <Text style={{ fontSize: 12, color: '#8B4513', marginTop: 4 }}>
                    You can still enter your address below
                  </Text>
                </View>
              )}

              <Text style={styles.mapHint}>Drag the pin to your exact location</Text>

              <InputGroup icon="📍" placeholder="Street / House No. *" value={street} onChangeText={setStreet} />
              <InputGroup icon="🏙️" placeholder="City *" value={city} onChangeText={setCity} />
              <InputGroup icon="🏠" placeholder="Landmark (e.g., Near Jamia Masjid)" value={landmark} onChangeText={setLandmark} />

              <View style={styles.buttonRow}>
                <AppButton title="← Back" type="outline" style={{ flex: 1, marginRight: 8 }} onPress={() => setStep(1)} />
                <AppButton title="Create Account" loading={signupLoading} style={{ flex: 2 }} onPress={handleSignup} />
              </View>
            </>
          )}

          <Text style={styles.footerText}>
            Already have an account?{' '}
            <Text style={styles.link} onPress={() => navigation.navigate('Login')}>
              Login
            </Text>
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bgBottom },
  scrollContent: { flexGrow: 1, paddingBottom: 40 },
  headerBg: {
    backgroundColor: Colors.bgTop, paddingTop: 80, paddingBottom: 50,
    alignItems: 'center', borderBottomLeftRadius: 30, borderBottomRightRadius: 30,
  },
  appName: { fontSize: 32, fontWeight: '800', color: '#FFFFFF', letterSpacing: -0.5 },
  subtitle: { fontSize: 16, color: '#FFEDD5', marginTop: 4 },
  card: {
    backgroundColor: Colors.cardBg, borderRadius: 24, padding: 24,
    marginHorizontal: 20, marginTop: -30,
    shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 16, elevation: 4,
  },
  stepIndicator: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 24,
  },
  stepDot: { width: 14, height: 14, borderRadius: 7, backgroundColor: '#FFD0B5' },
  activeStepDot: { backgroundColor: Colors.orange500 },
  stepLine: { width: 40, height: 2, backgroundColor: '#FFD0B5', marginHorizontal: 8 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: Colors.darkest, marginBottom: 16 },
  mapContainer: {
    height: 200, borderRadius: 16, overflow: 'hidden', marginBottom: 12,
    borderWidth: 1, borderColor: Colors.border, backgroundColor: '#f0f0f0',
  },
  map: { flex: 1 },
  locateButton: {
    position: 'absolute', bottom: 10, alignSelf: 'center',
    backgroundColor: 'white', paddingVertical: 8, paddingHorizontal: 16,
    borderRadius: 20, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4, elevation: 2,
  },
  locateButtonText: { fontSize: 13, fontWeight: '600', color: Colors.orange500 },
  mapPlaceholder: {
    height: 200, backgroundColor: '#FFF0E5', borderRadius: 16,
    justifyContent: 'center', alignItems: 'center', marginBottom: 12,
  },
  mapHint: { textAlign: 'center', fontSize: 12, color: Colors.orangeText, marginBottom: 12 },
  buttonRow: { flexDirection: 'row', marginTop: 16 },
  footerText: { textAlign: 'center', fontSize: 14, color: Colors.orangeText, marginTop: 24 },
  link: { color: Colors.orange600, fontWeight: '700' },
});