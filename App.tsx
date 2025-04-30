// App.tsx
import React from 'react';
import { StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AppNavigator from './src/navigation/AppNavigator';
import { AuthProvider } from './src/contexts/AuthContext';
import { TimeEntryProvider } from './src/contexts/TimeEntryContext';

export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <AuthProvider>
        <TimeEntryProvider>
          <AppNavigator />
        </TimeEntryProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
};