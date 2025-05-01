// src/navigation/RootNavigation.ts
import { createNavigationContainerRef } from '@react-navigation/native';

// Vytvoříme typování pro naši navigaci - musíme definovat parametry všech obrazovek
export type RootStackParamList = {
  Login: undefined;
  Dashboard: undefined;
  Projects: undefined;
  Project: { id: number; name: string };
  TimeEntry: { id: number };
  EditTimeEntry: { id: number };
};

// Vytvoříme navigationRef s typováním
export const navigationRef = createNavigationContainerRef<RootStackParamList>();

// Funkce pro navigaci mimo komponenty React
export function navigate(name: keyof RootStackParamList, params?: any) {
  if (navigationRef.isReady()) {
    navigationRef.navigate(name, params);
  } else {
    // Uložíme navigaci do fronty, až bude navigace připravena
    console.log(`Navigace není připravena, nelze navigovat na: ${name}`);
  }
}

// Funkce pro získání aktuální obrazovky
export function getCurrentRoute() {
  if (navigationRef.isReady()) {
    return navigationRef.getCurrentRoute();
  }
  return null;
}

// Funkce pro resetování celé navigace
export function resetNavigation(routeName: keyof RootStackParamList, params?: any) {
  if (navigationRef.isReady()) {
    navigationRef.reset({
      index: 0,
      routes: [{ name: routeName, params }],
    });
  } else {
    console.log(`Navigace není připravena, nelze resetovat na: ${routeName}`);
  }
}