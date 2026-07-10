import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { useAuth } from '../context/AuthContext';

import SplashScreen from '../screens/SplashScreen';
import OnboardingScreen from '../screens/OnboardingScreen';
import SignUpScreen from '../screens/SignUpScreen';
import LoginScreen from '../screens/LoginScreen';
import VerifyScreen from '../screens/VerifyScreen';
import SuccessScreen from '../screens/SuccessScreen';
import RoleSelectionScreen from '../screens/RoleSelectionScreen';
import SignUpStationScreen from '../screens/SignUpStationScreen';
import StationDashboard from '../screens/StationDashboard';

import MainTabs from './MainTabs';
import StationDetailsScreen from '../screens/StationDetailsScreen';
import NearbyStationsScreen from '../screens/NearbyStationsScreen';
import ReportQueueScreen from '../screens/ReportQueueScreen';
import TrackQueueScreen from '../screens/TrackQueueScreen';
import ProfileScreen from '../screens/ProfileScreen';
import AddressesScreen from '../screens/AddressesScreen';
import PredictionsScreen from '../screens/PredictionsScreen';
import NotificationsScreen from '../screens/NotificationsScreen';

// Profile sub-screens
import ManageAccountScreen from '../screens/ManageAccountScreen';
import ReportHistoryScreen from '../screens/ReportHistoryScreen';
import MyVehiclesScreen from '../screens/MyVehiclesScreen';
import NotificationSettingsScreen from '../screens/NotificationSettingsScreen';
import HelpSupportScreen from '../screens/HelpSupportScreen';

const Stack = createNativeStackNavigator();

function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName="Splash">
      <Stack.Screen name="Splash" component={SplashScreen} />
      <Stack.Screen name="Onboarding" component={OnboardingScreen} />
      <Stack.Screen name="RoleSelection" component={RoleSelectionScreen} />
      <Stack.Screen name="SignUp" component={SignUpScreen} />
      <Stack.Screen name="SignUpStation" component={SignUpStationScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Verify" component={VerifyScreen} />
      <Stack.Screen
        name="VerifySuccess"
        component={SuccessScreen}
        initialParams={{
          title: 'Welcome to FuelTrack LK!',
          message: 'Your account has been verified. Sign in to start tracking fuel availability near you.',
          buttonLabel: 'Continue to Log in',
          nextScreen: 'Login',
        }}
      />
    </Stack.Navigator>
  );
}

function AppStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MainTabs" component={MainTabs} />
      <Stack.Screen name="StationDetails" component={StationDetailsScreen} />
      <Stack.Screen name="NearbyStations" component={NearbyStationsScreen} />
      <Stack.Screen name="ReportQueue" component={ReportQueueScreen} />
      <Stack.Screen name="TrackQueue" component={TrackQueueScreen} />
      <Stack.Screen name="Profile" component={ProfileScreen} />
      <Stack.Screen name="ManageAccount" component={ManageAccountScreen} />
      <Stack.Screen name="ReportHistory" component={ReportHistoryScreen} />
      <Stack.Screen name="MyVehicles" component={MyVehiclesScreen} />
      <Stack.Screen name="NotificationSettings" component={NotificationSettingsScreen} />
      <Stack.Screen name="HelpSupport" component={HelpSupportScreen} />
      <Stack.Screen name="Addresses" component={AddressesScreen} />
      <Stack.Screen name="Predictions" component={PredictionsScreen} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} />
      <Stack.Screen name="Success" component={SuccessScreen} />
    </Stack.Navigator>
  );
}

import StationTabs from './StationTabs';

function StationStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="StationTabs" component={StationTabs} />
      <Stack.Screen name="ManageAccount" component={ManageAccountScreen} />
      <Stack.Screen name="NotificationSettings" component={NotificationSettingsScreen} />
      <Stack.Screen name="HelpSupport" component={HelpSupportScreen} />
    </Stack.Navigator>
  );
}

export default function RootNavigator() {
  const { isAuthenticated, user } = useAuth();

  return (
    <NavigationContainer>
      {isAuthenticated ? (
        user?.role === 'station' ? <StationStack /> : <AppStack />
      ) : (
        <AuthStack />
      )}
    </NavigationContainer>
  );
}
