import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { io } from 'socket.io-client';
import { useAuth } from '../context/AuthContext';
import api, { BASE_URL } from '../services/api';
import { Colors } from '../theme/theme';

const SOCKET_URL = BASE_URL.replace(/\/api\/?$/, '');

export default function ChatScreen({ route }) {
  const { orderId, otherUserId, otherUserName } = route.params || {};
  const { customer } = useAuth();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const socketRef = useRef(null);
  const listRef = useRef(null);

  // ---- 1. Load history ----
  const loadHistory = useCallback(async () => {
    if (!otherUserId) return;
    try {
      const params = { userId: otherUserId };
      if (orderId) params.orderId = orderId;
      const { data } = await api.get('/chat', { params });
      setMessages(data || []);
    } catch (err) {
      console.warn('Chat history fetch error:', err.message);
    } finally {
      setLoading(false);
    }
  }, [orderId, otherUserId]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  // ---- 2. Socket: listen for incoming messages live ----
  useEffect(() => {
    const connect = async () => {
      const token = await AsyncStorage.getItem('customerToken');
      if (!token || !customer?._id) return;
      const socket = io(SOCKET_URL, {
        query: { userId: customer._id },
        auth: { token },
      });
      socketRef.current = socket;
      socket.on('new_chat_message', (msg) => {
        // Only append messages that belong to this conversation.
        const belongsHere =
          (msg.sender === otherUserId || msg.sender?._id === otherUserId) ||
          (msg.receiver === otherUserId || msg.receiver?._id === otherUserId);
        if (belongsHere) {
          setMessages((prev) => [...prev, msg]);
        }
      });
    };
    connect();
    return () => {
      if (socketRef.current) socketRef.current.disconnect();
    };
  }, [customer?._id, otherUserId]);

  // ---- 3. Send ----
  const send = async () => {
    const text = input.trim();
    if (!text || !otherUserId) return;
    setInput('');
    try {
      const { data } = await api.post('/chat', {
        receiverId: otherUserId,
        orderId,
        message: text,
      });
      // Append locally right away — the socket event will also arrive for
      // the other party, and for us on multi-device, but de-dupe by _id.
      setMessages((prev) => (prev.some(m => m._id === data._id) ? prev : [...prev, data]));
    } catch (err) {
      console.warn('Send message error:', err.message);
    }
  };

  const renderItem = ({ item }) => {
    const isMe = (item.sender === customer?._id) || (item.sender?._id === customer?._id);
    return (
      <View style={[styles.bubble, isMe ? styles.me : styles.other]}>
        <Text style={isMe ? styles.meText : styles.otherText}>{item.message}</Text>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={80}
    >
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{otherUserName || 'Chat'}</Text>
      </View>
      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={(item, i) => item._id || i.toString()}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
        ListEmptyComponent={!loading ? (
          <Text style={styles.emptyText}>No messages yet — say hello!</Text>
        ) : null}
      />
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          value={input}
          onChangeText={setInput}
          placeholder="Message..."
          placeholderTextColor={Colors.gray}
        />
        <TouchableOpacity onPress={send} style={styles.sendBtn}>
          <Text style={styles.sendText}>Send</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { padding: 16, backgroundColor: Colors.primary },
  headerTitle: { color: Colors.white, fontWeight: 'bold', fontSize: 18 },
  list: { padding: 8, flexGrow: 1 },
  emptyText: { textAlign: 'center', marginTop: 40, color: Colors.gray },
  bubble: { padding: 10, borderRadius: 10, marginVertical: 4, maxWidth: '80%' },
  me: { alignSelf: 'flex-end', backgroundColor: '#DCF8C6' },
  other: { alignSelf: 'flex-start', backgroundColor: Colors.white },
  meText: { color: Colors.black },
  otherText: { color: Colors.black },
  inputRow: { flexDirection: 'row', alignItems: 'center', padding: 8 },
  input: { flex: 1, backgroundColor: Colors.white, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 8, borderWidth: 1, borderColor: Colors.lightGray },
  sendBtn: { backgroundColor: Colors.primary, borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8, marginLeft: 8 },
  sendText: { color: Colors.white, fontWeight: 'bold' },
});
