// App.tsx
import React from 'react';
import { StatusBar } from 'react-native';
import { AuthProvider } from './src/contexts/AuthContext';
import { TimeEntryProvider } from './src/contexts/TimeEntryContext';
import AppNavigator from './src/navigation/AppNavigator';
import InactivityMonitor from './src/components/InactivityMonitor';

const App = () => {
  return (
    <AuthProvider>
      <TimeEntryProvider>
        <StatusBar backgroundColor="#4286f4" barStyle="light-content" />
        <AppNavigator />
        <InactivityMonitor />
      </TimeEntryProvider>
    </AuthProvider>
  );
};

export default App;