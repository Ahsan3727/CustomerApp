import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../theme/theme';
export default function OrderDetailScreen({ route }) {
  const { order } = route.params;
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Order #{order._id}</Text>
      <Text>Status: {order.status}</Text>
      <Text style={styles.section}>Items:</Text>
      {order.items?.map((it, i) => <Text key={i}>- {it.product?.name || it.product} x {it.quantity}</Text>)}
      <Text>Total: ₹{order.payment?.amount?.toFixed?.(2) ?? order.payment?.amount}</Text>
      <Text>Payment: {order.payment?.method}</Text>
    </View>
  );
}
const styles = StyleSheet.create({ container: { flex: 1, padding: 16, backgroundColor: Colors.white }, title: { fontSize: 20, fontWeight: 'bold', marginBottom: 8 }, section: { fontWeight: 'bold', marginTop: 12 } });
