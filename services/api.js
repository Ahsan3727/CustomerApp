import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { Platform } from 'react-native';

const getBaseUrl = () => {
  if (Platform.OS === 'android') {
    return 'https://groxo-0zy1.onrender.com/api';
  }
  return 'https://groxo-0zy1.onrender.com/api';
};

export const BASE_URL = getBaseUrl();

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('customerToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  console.log(`📡 ${config.method.toUpperCase()} ${config.url}`);
  return config;
});

api.interceptors.response.use(
  (response) => {
    console.log('✅ Response:', response.status);
    return response;
  },
  async (error) => {
    console.log('❌ Error:', error.response?.status);
    if (error.response?.status === 401) {
      await AsyncStorage.multiRemove(['customerToken', 'customerData']);
    }
    return Promise.reject(error);
  }
);

export default api;