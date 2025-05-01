// src/api/client.ts
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NativeEventEmitter, NativeModules } from 'react-native';

// Vytvoříme vlastní eventEmitter
// Používáme prázdný nativní modul jako základ pro NativeEventEmitter
const dummyEventEmitter = new NativeEventEmitter();
export const LOGOUT_EVENT = 'logout';

// Zde nastavte adresu vašeho API
const API_URL = 'https://timer.softcode.cz/api';  // pro produkci

const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Nastavíme interceptor pro automatické přidávání tokenu
apiClient.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Přidáme interceptor pro handle vypršení tokenu
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = error.response?.status;
    if (status === 401) {
      // 1) smažeme vypršelý token
      await AsyncStorage.removeItem('token');
      // 2) možno i zavolat signOut() z AuthContext, pokud ho exportujete
      // 3) zobrazit uživateli alert
      Alert.alert('Sezení vypršelo', 'Prosím přihlašte se znovu.');
      // 4) přesměrovat na přihlášení
      navigate('Login');
    }
    return Promise.reject(error);
  }
);

export { dummyEventEmitter as logoutEventEmitter };
export default apiClient;