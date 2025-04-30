// src/api/client.ts
import axios, { AxiosInstance } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Zde nastavte adresu vašeho API
const API_URL = 'https://timer.softcode.cz/api';

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

      // Zde můžete přidat kód pro přesměrování na přihlašovací obrazovku
    }
    return Promise.reject(error);
  }
);

export default apiClient;