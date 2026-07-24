import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import AppButton from '../components/AppButton';
import BottomTabBar from '../components/BottomTabBar';
import Card from '../components/Card';
import InputGroup from '../components/InputGroup';
import { useAuth } from '../context/AuthContext';
import { Colors, Radius, Shadows } from '../theme';

export default function ProfileScreen({ navigation }) {
  const { customer, updateProfile, logout } = useAuth();
  const [name, setName] = useState(customer?.name || '');
  const [phone, setPhone] = useState(customer?.phone || '');
  const [street, setStreet] = useState(customer?.address?.street || '');
  const [city, setCity] = useState(customer?.address?.city || '');

  const handleSave = async () => {
    const result = await updateProfile({
      name,
      phone,
      address: { street, city },
    });
    if (result.success) {
      Alert.alert('Success', 'Profile updated');
    } else {
      Alert.alert('Error', result.message);
    }
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          await AsyncStorage.clear();
          logout();
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Profile</Text>
        </View>

        {/* Avatar */}
        <View style={styles.avatarContainer}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {(customer?.name || 'C')[0].toUpperCase()}
            </Text>
          </View>
          <Text style={styles.userName}>{customer?.name || 'Customer'}</Text>
          <Text style={styles.userPhone}>{customer?.phone || '+92 300 1234567'}</Text>
        </View>

        {/* Profile Details Card */}
        <Card style={styles.profileCard}>
          <InputGroup
            icon="👤"
            placeholder="Name"
            value={name}
            onChangeText={setName}
          />
          <InputGroup
            icon="📧"
            placeholder="Email"
            value={customer?.email}
            editable={false}
          />
          <InputGroup
            icon="📱"
            placeholder="Phone"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
          />
          <InputGroup
            icon="📍"
            placeholder="Street"
            value={street}
            onChangeText={setStreet}
          />
          <InputGroup
            icon="🏙️"
            placeholder="City"
            value={city}
            onChangeText={setCity}
          />
        </Card>

        {/* Menu */}
        <Card style={styles.menuCard}>
          {[
            { label: '📍 My Addresses', screen: 'AddressList' },
            { label: '📦 My Orders', screen: 'Orders' },
            { label: '👛 Wallet', screen: 'Wallet' },
            { label: '❓ Help & Support', screen: 'Help' },
            { label: '⚙️ Settings', screen: 'Settings' },
          ].map((item) => (
            <AppButton
              key={item.screen}
              title={item.label}
              type="ghost"
              onPress={() => navigation.navigate(item.screen)}
              style={styles.menuItem}
              textStyle={styles.menuItemText}
            />
          ))}
        </Card>

        {/* Save Button */}
        <AppButton
          title="Save"
          onPress={handleSave}
          style={styles.saveButton}
        />

        {/* Logout Button */}
        <AppButton
          title="🚪 Logout"
          type="outline"
          onPress={handleLogout}
          style={styles.logoutButton}
          textStyle={{ color: Colors.chili }}
        />
      </ScrollView>

      <BottomTabBar navigation={navigation} activeScreen="Profile" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.linen,
  },
  scrollContent: {
    paddingBottom: 120,
  },
  header: {
    paddingTop: Constants.statusBarHeight + 16,
    paddingHorizontal: 16,
    paddingBottom: 14,
    backgroundColor: Colors.apricot,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    ...Shadows.md,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.white,
    fontFamily: 'Sora-Bold',
  },
  avatarContainer: {
    alignItems: 'center',
    marginTop: -30,            // pulls avatar up to overlap header a little
    marginBottom: 20,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.apricot,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: Colors.white,
    ...Shadows.md,
  },
  avatarText: {
    color: Colors.white,
    fontSize: 30,
    fontWeight: '700',
  },
  userName: {
    marginTop: 12,
    fontSize: 18,
    fontWeight: '700',
    color: Colors.ink,
  },
  userPhone: {
    fontSize: 13,
    color: Colors.inkMuted,
    marginTop: 4,
  },
  profileCard: {
    marginHorizontal: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.lg,
    backgroundColor: Colors.white,
    ...Shadows.sm,
  },
  saveButton: {
    marginHorizontal: 16,
    marginTop: 20,
  },
  menuCard: {
    marginHorizontal: 16,
    marginTop: 16,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.lg,
    backgroundColor: Colors.white,
    ...Shadows.sm,
  },
  menuItem: {
    justifyContent: 'flex-start',
    borderWidth: 0,
    paddingHorizontal: 8,
  },
  menuItemText: {
    color: Colors.ink,
    textAlign: 'left',
  },
  logoutButton: {
    marginHorizontal: 16,
    marginTop: 12,
    borderColor: Colors.chili,
  },
});