// App.tsx
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { navigationRef } from './src/navigation/RootNavigation';
import { StatusBar } from 'react-native';
import { AuthProvider } from './src/contexts/AuthContext';
import { TimeEntryProvider } from './src/contexts/TimeEntryContext';
import { AppNavigator } from './src/navigation/AppNavigator';
import InactivityMonitor from './src/components/InactivityMonitor';

const App = () => {
  return (
    <AuthProvider>
      <TimeEntryProvider>
        <NavigationContainer>
          <AppNavigator />
        </NavigationContainer>
      </TimeEntryProvider>
    </AuthProvider>
  );
};

export default App;