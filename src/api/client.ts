// src/api/client.ts
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NativeEventEmitter, NativeModules, Alert } from 'react-native';
import { navigationRef } from '../navigation/RootNavigation';

// Vytvoříme vlastní eventEmitter pro komunikaci napříč aplikací
export const logoutEventEmitter = new NativeEventEmitter();
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

    // Když dostaneme 401 Unauthorized, znamená to vypršení tokenu
    if (status === 401) {
      console.log('Token vypršel nebo je neplatný, automatické odhlášení');

      try {
        // 1) smažeme vypršelý token
        await AsyncStorage.removeItem('token');
        await AsyncStorage.removeItem('user');

        // 2) vyšleme událost pro ostatní komponenty
        logoutEventEmitter.emit(LOGOUT_EVENT);

        // 3) zobrazíme alert uživateli
        Alert.alert(
          'Sezení vypršelo',
          'Vaše přihlášení vypršelo. Prosím, přihlaste se znovu.',
          [
            {
              text: 'OK',
              onPress: () => {
                // 4) přesměrujeme na přihlášení, pokud je navigace připravena
                if (navigationRef.isReady()) {
                  navigationRef.navigate('Login');
                }
              }
            }
          ]
        );
      } catch (logoutError) {
        console.error('Chyba při zpracování vypršení tokenu:', logoutError);
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;