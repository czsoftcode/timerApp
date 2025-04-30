// src/contexts/AuthContext.tsx
import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../types/api.types';
import { login as apiLogin, logout as apiLogout, getCurrentUser } from '../api/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface AuthContextData {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextData>({
  user: null,
  loading: true,
  login: async () => {},
  logout: async () => {},
});

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Kontrola existujícího uživatele při načtení aplikace
    async function loadUser() {
      try {
        const savedUser = await getCurrentUser();
        if (savedUser) {
          setUser(savedUser);
        }
      } catch (error) {
        console.error('Chyba při načítání uživatele', error);
      } finally {
        setLoading(false);
      }
    }

    loadUser();
  }, []);

  async function login(email: string, password: string) {
    try {
      const userData = await apiLogin(email, password);
      setUser(userData);
    } catch (error) {
      throw error;
    }
  }

  async function logout() {
    try {
      await apiLogout();
      setUser(null);
    } catch (error) {
      console.error('Chyba při odhlašování', error);
    }
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth musí být používán uvnitř AuthProvider');
  }
  return context;
}