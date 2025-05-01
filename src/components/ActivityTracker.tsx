// src/components/ActivityTracker.tsx
import React, { useEffect } from 'react';
import { TouchableWithoutFeedback, View } from 'react-native';
import { useAuth } from '../contexts/AuthContext';

/**
 * Komponenta, která sleduje aktivitu uživatele a resetuje časovač neaktivity
 */
const ActivityTracker: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, resetInactivityTimer } = useAuth();

  // Při každém vykreslení resetujeme časovač neaktivity
  useEffect(() => {
    if (user) {
      resetInactivityTimer();
    }
  }, [user, resetInactivityTimer]);

  // Pokud není přihlášený uživatel, jen vrátíme děti
  if (!user) {
    return <>{children}</>;
  }

  // Když je uživatel přihlášen, obalíme děti komponenty do TouchableWithoutFeedback
  // aby zachycovala interakce a resetovala časovač
  return (
    <TouchableWithoutFeedback onPress={resetInactivityTimer}>
      <View style={{ flex: 1 }}>{children}</View>
    </TouchableWithoutFeedback>
  );
};

export default ActivityTracker;