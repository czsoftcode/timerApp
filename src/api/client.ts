// src/api/client.ts
import axios, { AxiosInstance } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Event pro informování o odhlášení (pro případ vypršení tokenu)
export const logoutEvent = new EventTarget();
export const LOGOUT_EVENT = 'logout';

// Zde nastavte adresu vašeho API
const API_URL = __DEV__
  ? 'http://localhost:8000/api'  // pro vývoj
  : 'https://timer.softcode.cz/api';  // pro produkci

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
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      // Pokud token vypršel, odhlásíme uživatele
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('user');

      // Vyvolat event pro odhlášení
      logoutEvent.dispatchEvent(new Event(LOGOUT_EVENT));
    }

    return Promise.reject(error);
  }
);

export default apiClient;