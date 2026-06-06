/**
 * Stack navigation for TalkQuest. Navigation is parent-controlled (standard
 * header back button), with large in-screen buttons driving the play flow.
 */
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { colors, typography } from '../theme';
import WelcomeScreen from '../screens/WelcomeScreen';
import AgeSelectionScreen from '../screens/AgeSelectionScreen';
import SessionLengthScreen from '../screens/SessionLengthScreen';
import ThemeSelectionScreen from '../screens/ThemeSelectionScreen';
import MissionScreen from '../screens/MissionScreen';
import CelebrationScreen from '../screens/CelebrationScreen';
import ProgressSummaryScreen from '../screens/ProgressSummaryScreen';
import ParentDashboardScreen from '../screens/ParentDashboardScreen';
import SettingsScreen from '../screens/SettingsScreen';

const Stack = createNativeStackNavigator();

const screenOptions = {
  headerStyle: { backgroundColor: colors.background },
  headerShadowVisible: false,
  headerTintColor: colors.primaryDark,
  headerTitleStyle: { ...typography.heading },
  contentStyle: { backgroundColor: colors.background },
};

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={screenOptions}>
        <Stack.Screen name="Welcome" component={WelcomeScreen} options={{ headerShown: false }} />
        <Stack.Screen name="AgeSelection" component={AgeSelectionScreen} options={{ title: 'Choose Age' }} />
        <Stack.Screen name="SessionLength" component={SessionLengthScreen} options={{ title: 'Play Time' }} />
        <Stack.Screen name="ThemeSelection" component={ThemeSelectionScreen} options={{ title: 'Adventure' }} />
        <Stack.Screen
          name="Mission"
          component={MissionScreen}
          options={{ title: 'Mission', headerBackVisible: false, gestureEnabled: false }}
        />
        <Stack.Screen
          name="Celebration"
          component={CelebrationScreen}
          options={{ headerShown: false, gestureEnabled: false }}
        />
        <Stack.Screen
          name="ProgressSummary"
          component={ProgressSummaryScreen}
          options={{ title: 'Great Job!', headerBackVisible: false, gestureEnabled: false }}
        />
        <Stack.Screen name="ParentDashboard" component={ParentDashboardScreen} options={{ title: 'For Parents' }} />
        <Stack.Screen name="Settings" component={SettingsScreen} options={{ title: 'Settings' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
