// src/api/auth.ts
import apiClient from './client'; // Změna zde - importujeme apiClient místo axios
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LoginRequest, LoginResponse, User } from '../types/api.types';

export const login = async (email: string, password: string): Promise<User> => {
  try {
    // Volání API pro přihlášení (použijeme apiClient místo axios)
    const response = await apiClient.post('/login_check', {
      email: email,  // nebo username - podle toho, jak máte nastavený backend
      password
    });

    console.log('Odpověď serveru:', response.data);

    // Zkontrolujeme, jestli token existuje
    if (!response.data.token) {
      throw new Error('Server nevrátil token');
    }

    // Uložíme token do AsyncStorage
    await AsyncStorage.setItem('token', response.data.token);

    // Nyní musíme získat informace o uživateli
    let userData: User;

    try {
      // Zkusíme získat informace o aktuálním uživateli
      const userResponse = await apiClient.get('/me');
      userData = userResponse.data.user;
    } catch (userError) {
      // Pokud se nepodaří získat data o uživateli, vytvoříme základní objekt
      userData = {
        id: 0,
        email: email,
        firstName: '',
        lastName: ''
      };
      console.log('Nepodařilo se získat data o uživateli:', userError);
    }

    // Uložíme informace o uživateli
    if (userData) {
      await AsyncStorage.setItem('user', JSON.stringify(userData));
    } else {
      console.warn('Uživatelská data chybí, nelze uložit do AsyncStorage');
    }

    return userData;
  } catch (error) {
    console.error('Chyba při přihlášení:', error.response?.data || error.message);
    throw new Error('Přihlášení selhalo. Zkontrolujte přihlašovací údaje.');
  }
};

export const getCurrentUser = async (): Promise<User | null> => {
  try {
    const userJson = await AsyncStorage.getItem('user');
    if (userJson) {
      return JSON.parse(userJson);
    }
    return null;
  } catch (error) {
    return null;
  }
};

export const logout = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem('token');
    await AsyncStorage.removeItem('user');
  } catch (error) {
    console.error('Chyba při odhlašování', error);
  }
};