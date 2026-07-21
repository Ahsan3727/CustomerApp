import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Shadows } from '../theme';

const tabs = [
  { label: 'Home', icon: '🏠', screen: 'Home' },
  { label: 'Cart', icon: '🛒', screen: 'Cart' },
  { label: 'Orders', icon: '📋', screen: 'Orders' },
  { label: 'Profile', icon: '👤', screen: 'Profile' },
];

export default function BottomTabBar({ navigation, activeScreen }) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom + 8 }]}>
      {tabs.map((tab) => {
        const isActive = activeScreen === tab.screen;
        return (
          <TouchableOpacity
            key={tab.screen}
            style={styles.tabItem}
            onPress={() => navigation.navigate(tab.screen)}
            activeOpacity={0.7}
          >
            <View style={[styles.iconContainer, isActive && styles.activeIconContainer]}>
              <Text style={[styles.icon, isActive && styles.activeIcon]}>
                {tab.icon}
              </Text>
            </View>
            <Text style={[styles.label, isActive && styles.activeLabel]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    ...Shadows.md,
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    paddingVertical: 8,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  activeIconContainer: {
    backgroundColor: Colors.basilLight,
  },
  icon: {
    fontSize: 20,
    color: Colors.inkMuted,
  },
  activeIcon: {
    color: Colors.basilDark,
    transform: [{ scale: 1.15 }],
  },
  label: {
    fontSize: 10,
    color: Colors.inkMuted,
    fontWeight: '500',
  },
  activeLabel: {
    color: Colors.basilDark,
    fontWeight: '600',
  },
});