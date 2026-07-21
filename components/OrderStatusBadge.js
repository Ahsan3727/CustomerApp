import { StyleSheet, Text, View } from 'react-native';
import { Radius } from '../theme';

const statusConfig = {
  pending:     { bg: '#FEF3C7', text: '#92400E', label: 'Pending' },
  accepted:    { bg: '#DBEAFE', text: '#1E40AF', label: 'Accepted' },
  picked:      { bg: '#F3E8FF', text: '#6B21A8', label: 'Picked Up' },
  onway:       { bg: '#FDEEE1', text: '#C96A26', label: 'On Way' },          // apricot‑light
  out_for_delivery: { bg: '#FDEEE1', text: '#C96A26', label: 'On Way' },
  completed:   { bg: '#EAF6EF', text: '#1B7A4F', label: 'Completed' },        // basil‑light
  delivered:   { bg: '#EAF6EF', text: '#1B7A4F', label: 'Delivered' },
  cancelled:   { bg: '#FBEAEA', text: '#D64545', label: 'Cancelled' },        // chili‑light
};

export default function OrderStatusBadge({ status }) {
  const config = statusConfig[status] || { bg: '#E2E8F0', text: '#334155', label: status?.replace(/_/g, ' ') || status };
  return (
    <View style={[styles.badge, { backgroundColor: config.bg }]}>
      <Text style={[styles.text, { color: config.text }]}>{config.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.full,
  },
  text: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
});