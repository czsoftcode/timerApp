// src/contexts/AuthContext.tsx
import React, { createContext, useState, useEffect, ReactNode, useCallback, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { User } from '../types/api.types';
import { login as apiLogin, logout as apiLogout, getCurrentUser } from '../api/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { logoutEventEmitter, LOGOUT_EVENT } from '../api/client';

interface AuthContextData {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  resetInactivityTimer: () => void;
}

const AuthContext = createContext<AuthContextData>({
  user: null,
  loading: true,
  login: async () => {},
  logout: async () => {},
  resetInactivityTimer: () => {},
});

// Konstanta pro časový limit neaktivity (1 hodina v milisekundách)
const INACTIVITY_TIMEOUT = 60 * 60 * 1000;

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null);
  const appStateRef = useRef(AppState.currentState);

  // Funkce pro odhlášení
  const logout = useCallback(async () => {
    try {
      // Zrušíme časovač neaktivity
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
        inactivityTimerRef.current = null;
      }

      await apiLogout();
      setUser(null);
    } catch (error) {
      console.error('Chyba při odhlašování', error);
    }
  }, []);

  // Funkce pro reset časovače neaktivity
  const resetInactivityTimer = useCallback(() => {
    // Zrušíme předchozí časovač, pokud existuje
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
    }

    // Vytvoříme nový časovač pouze pokud je uživatel přihlášen
    if (user) {
      inactivityTimerRef.current = setTimeout(() => {
        console.log('Automatické odhlášení z důvodu neaktivity (1 hodina)');
        logout();
      }, INACTIVITY_TIMEOUT);
    }
  }, [user, logout]);

  // Funkce pro sledování změn stavu aplikace (aktivní/na pozadí)
  const handleAppStateChange = useCallback((nextAppState: AppStateStatus) => {
    if (nextAppState === 'active' && appStateRef.current !== 'active') {
      // Aplikace byla obnovena z pozadí - automaticky odhlásíme uživatele
      console.log('Aplikace obnovena z pozadí - automatické odhlášení');
      logout();
    } else if (nextAppState === 'background' || nextAppState === 'inactive') {
      // Aplikace přešla do pozadí - zrušíme časovač neaktivity
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
        inactivityTimerRef.current = null;
      }
    }

    appStateRef.current = nextAppState;
  }, [logout]);

  // Přihlášení uživatele
  const login = async (email: string, password: string) => {
    try {
      const userData = await apiLogin(email, password);
      setUser(userData);

      // Spustíme časovač neaktivity po přihlášení
      resetInactivityTimer();
    } catch (error) {
      throw error;
    }
  };

  // Efekt pro nastavení sledování stavu aplikace při inicializaci a událostí odhlášení
  useEffect(() => {
    const subscription = AppState.addEventListener('change', handleAppStateChange);

    // Přidáme posluchač pro události odhlášení z API
    const handleLogout = () => {
      console.log('Automatické odhlášení - vypršení tokenu nebo 401 chyba');
      logout();
    };

    // React Native NativeEventEmitter
    const logoutSubscription = logoutEventEmitter.addListener(LOGOUT_EVENT, handleLogout);

    return () => {
      subscription.remove();
      // Odstranění posluchače
      logoutSubscription.remove();

      // Vyčistíme časovač při zničení komponenty
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
      }
    };
  }, [handleAppStateChange, logout]);

  // Efekt pro počáteční načtení uživatele
  useEffect(() => {
    async function loadUser() {
      try {
        // Odstraníme token a uživatele při startu aplikace
        await AsyncStorage.removeItem('token');
        await AsyncStorage.removeItem('user');
        setUser(null);
      } catch (error) {
        console.error('Chyba při resetu session', error);
      } finally {
        setLoading(false);
      }
    }

    loadUser();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, resetInactivityTimer }}>
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