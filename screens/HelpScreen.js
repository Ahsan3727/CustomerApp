import React, { useState } from 'react';
import {
  Alert,
  Linking,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import api from '../services/api';
import { Colors } from '../theme/theme';

const FAQS = [
  { q: 'How do I track my order?', a: 'Open Orders -> tap an active order to see live tracking.' },
  { q: 'How do I cancel an order?', a: 'Open the order and tap Cancel - available until it is out for delivery.' },
  { q: 'What payment methods are supported?', a: 'Cash on delivery only, for now.' },
  { q: 'How do I add or change my delivery address?', a: 'Go to Profile -> My Addresses to add, edit, or set a default.' },
];

export default function HelpScreen() {
  const [faqOpen, setFaqOpen] = useState(false);
  const [ticketOpen, setTicketOpen] = useState(false);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const submitTicket = async () => {
    if (!subject.trim() || !message.trim()) {
      Alert.alert('Missing info', 'Please fill in both subject and message.');
      return;
    }
    setSubmitting(true);
    try {
      await api.post('/support', { subject: subject.trim(), message: message.trim() });
      setSubject('');
      setMessage('');
      setTicketOpen(false);
      Alert.alert('Ticket submitted', 'Our support team will get back to you soon.');
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to submit ticket');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.item} onPress={() => setFaqOpen(true)}>
        <Text>FAQ</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.item} onPress={() => setTicketOpen(true)}>
        <Text>Live Chat</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.item} onPress={() => Linking.openURL('mailto:support@groxo.app')}>
        <Text>Email Support</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.item} onPress={() => setTicketOpen(true)}>
        <Text>Report an Issue</Text>
      </TouchableOpacity>

      {/* ---- FAQ modal ---- */}
      <Modal visible={faqOpen} animationType="slide" onRequestClose={() => setFaqOpen(false)}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>FAQ</Text>
            <TouchableOpacity onPress={() => setFaqOpen(false)}><Text style={styles.close}>x</Text></TouchableOpacity>
          </View>
          <ScrollView>
            {FAQS.map((f, i) => (
              <View key={i} style={styles.faqItem}>
                <Text style={styles.faqQ}>{f.q}</Text>
                <Text style={styles.faqA}>{f.a}</Text>
              </View>
            ))}
          </ScrollView>
        </View>
      </Modal>

      {/* ---- Report an issue / ticket modal ---- */}
      <Modal visible={ticketOpen} animationType="slide" onRequestClose={() => setTicketOpen(false)}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Contact Support</Text>
            <TouchableOpacity onPress={() => setTicketOpen(false)}><Text style={styles.close}>x</Text></TouchableOpacity>
          </View>
          <TextInput
            placeholder="Subject"
            value={subject}
            onChangeText={setSubject}
            style={styles.input}
            placeholderTextColor={Colors.gray}
          />
          <TextInput
            placeholder="Describe the issue..."
            value={message}
            onChangeText={setMessage}
            style={[styles.input, styles.textarea]}
            multiline
            placeholderTextColor={Colors.gray}
          />
          <TouchableOpacity style={styles.submitBtn} onPress={submitTicket} disabled={submitting}>
            <Text style={styles.submitBtnText}>{submitting ? 'Submitting...' : 'Submit'}</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.white, padding: 16 },
  item: { paddingVertical: 16, borderBottomWidth: 1, borderColor: Colors.lightGray, fontSize: 16 },
  modalContainer: { flex: 1, backgroundColor: Colors.white, padding: 16, paddingTop: 48 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 20, fontWeight: 'bold' },
  close: { fontSize: 20, color: Colors.gray },
  faqItem: { marginBottom: 20 },
  faqQ: { fontWeight: '700', marginBottom: 4 },
  faqA: { color: Colors.gray },
  input: { backgroundColor: Colors.background, padding: 14, borderRadius: 10, marginBottom: 12, borderWidth: 1, borderColor: Colors.lightGray, color: Colors.black },
  textarea: { minHeight: 120, textAlignVertical: 'top' },
  submitBtn: { backgroundColor: Colors.primary, padding: 16, borderRadius: 12, alignItems: 'center' },
  submitBtnText: { color: Colors.white, fontWeight: 'bold', fontSize: 16 },
});
