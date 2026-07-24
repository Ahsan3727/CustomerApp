import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Constants from 'expo-constants';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { OrderProvider } from './context/OrderContext';
import usePushNotifications from './hooks/usePushNotifications';
import useLocationTracking from './hooks/useLocationTracking';

// ---------- Screens that never use native maps (always safe) ----------
import AddAddressScreen from './screens/AddAddressScreen';
import AddressListScreen from './screens/AddressListScreen';
import CancelOrderScreen from './screens/CancelOrderScreen';
import CartScreen from './screens/CartScreen';
import ChatScreen from './screens/ChatScreen';
import HelpScreen from './screens/HelpScreen';
import HomeScreen from './screens/HomeScreen';
import LoginScreen from './screens/LoginScreen';
import OrderConfirmScreen from './screens/OrderConfirmScreen';
import OrderDetailScreen from './screens/OrderDetailScreen';
import OrderMapPicker from './screens/OrderMapPicker'; // also uses Maps - same conditional-load caveat as MapScreen below
import OrdersScreen from './screens/OrdersScreen';
import ProductDetailScreen from './screens/ProductDetailScreen';
import ProductListScreen from './screens/ProductListScreen';
import ProfileScreen from './screens/ProfileScreen';
import RateScreen from './screens/RateScreen';
import SearchScreen from './screens/SearchScreen';
import SettingsScreen from './screens/SettingsScreen';
import SignupScreen from './screens/SignupScreen';
import TrackOrderScreen from './screens/TrackOrderScreen';
import WalletScreen from './screens/WalletScreen';

// ---------- Conditionally load MapScreen (only outside Expo Go) ----------
let MapScreen = null;
if (Constants.appOwnership !== 'expo') {
  try {
    MapScreen = require('./screens/MapScreen').default;
  } catch (e) {
    console.warn('MapScreen not available:', e.message);
  }
}

const Stack = createNativeStackNavigator();

// Runs the two background hooks (push notification registration + periodic
// location updates) once the user is authenticated. Both hooks existed and
// were fully written, but neither was ever imported/called anywhere in the
// app, so push tokens were never registered and the customer's live
// location was never sent to the backend.
function BackgroundServices({ isAuthenticated }) {
  usePushNotifications(isAuthenticated);
  useLocationTracking(isAuthenticated);
  return null;
}

function AppNavigator() {
  const { isAuthenticated } = useAuth();

  return (
    <>
      <BackgroundServices isAuthenticated={isAuthenticated} />
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {isAuthenticated ? (
          <>
            <Stack.Screen name="Home" component={HomeScreen} />
            <Stack.Screen name="Cart" component={CartScreen} />
            <Stack.Screen name="Orders" component={OrdersScreen} />
            <Stack.Screen name="OrderDetail" component={OrderDetailScreen} />
            <Stack.Screen name="OrderConfirm" component={OrderConfirmScreen} />
            <Stack.Screen name="TrackOrder" component={TrackOrderScreen} />
            <Stack.Screen name="CancelOrder" component={CancelOrderScreen} />
            <Stack.Screen name="Rate" component={RateScreen} />
            <Stack.Screen name="Profile" component={ProfileScreen} />
            <Stack.Screen name="Settings" component={SettingsScreen} />
            <Stack.Screen name="Search" component={SearchScreen} />
            <Stack.Screen name="ProductDetail" component={ProductDetailScreen} />
            <Stack.Screen name="ProductList" component={ProductListScreen} />
            <Stack.Screen name="OrderMapPicker" component={OrderMapPicker} />
            <Stack.Screen name="AddressList" component={AddressListScreen} />
            <Stack.Screen name="AddAddress" component={AddAddressScreen} />
            <Stack.Screen name="Chat" component={ChatScreen} />
            <Stack.Screen name="Help" component={HelpScreen} />
            <Stack.Screen name="Wallet" component={WalletScreen} />
            {/* Only show MapScreen if it loaded successfully */}
            {MapScreen && <Stack.Screen name="Map" component={MapScreen} />}
          </>
        ) : (
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Signup" component={SignupScreen} />
          </>
        )}
      </Stack.Navigator>
    </>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <CartProvider>
          <OrderProvider>
            <NavigationContainer>
              <AppNavigator />
            </NavigationContainer>
          </OrderProvider>
        </CartProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
