// src/navigation/AppNavigator.tsx
import React from 'react';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import LoginScreen from '../screens/LoginScreen';
import DashboardScreen from '../screens/DashboardScreen';
import ProjectsScreen from '../screens/ProjectsScreen';
import ProjectScreen from '../screens/ProjectScreen';
import TimeEntryScreen from '../screens/TimeEntryScreen';
import { useAuth } from '../contexts/AuthContext';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// Navigace pro přihlášené uživatele
const MainTabs = () => {
  return (
    <Tab.Navigator>
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home-outline" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Projects"
        component={ProjectsStackNavigator}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="folder-outline" size={size} color={color} />
          ),
          headerShown: false
        }}
      />
    </Tab.Navigator>
  );
};

// Stack navigace pro projekty a časové záznamy
const ProjectsStack = createStackNavigator();

const ProjectsStackNavigator = () => {
  return (
    <ProjectsStack.Navigator>
      <ProjectsStack.Screen name="ProjectsList" component={ProjectsScreen} options={{ title: 'Projekty' }} />
      <ProjectsStack.Screen name="Project" component={ProjectScreen} options={({ route }) => ({ title: route.params?.name || 'Projekt' })} />
      <ProjectsStack.Screen name="TimeEntry" component={TimeEntryScreen} options={{ title: 'Časový záznam' }} />
    </ProjectsStack.Navigator>
  );
};

// Hlavní navigace aplikace
const AppNavigator = () => {
  const { user, loading } = useAuth();

  if (loading) {
    // Zde můžete zobrazit loading obrazovku
    return null;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator>
        {!user ? (
          // Obrazovky pro nepřihlášené uživatele
          <Stack.Screen
            name="Login"
            component={LoginScreen}
            options={{ headerShown: false }}
          />
        ) : (
          // Obrazovky pro přihlášené uživatele
          <Stack.Screen
            name="Main"
            component={MainTabs}
            options={{ headerShown: false }}
          />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;