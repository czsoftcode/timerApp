// src/api/auth.ts
import axios from './client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LoginRequest, LoginResponse, User } from '../types/api.types';

export const login = async (email: string, password: string): Promise<User> => {
  try {
    const response = await axios.post<LoginResponse>('/login_check', {
      email,
      password
    });

    // Uložíme token do AsyncStorage
    await AsyncStorage.setItem('token', response.data.token);

    // Uložíme informace o uživateli
    await AsyncStorage.setItem('user', JSON.stringify(response.data.user));

    return response.data.user;
  } catch (error) {
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