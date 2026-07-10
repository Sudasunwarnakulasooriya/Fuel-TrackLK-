import React from 'react';
import { View } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import CustomTabBar from './CustomTabBar';

import HomeScreen from '../screens/HomeScreen';
import NearbyStationsScreen from '../screens/NearbyStationsScreen';
import PredictionsScreen from '../screens/PredictionsScreen';
import ProfileScreen from '../screens/ProfileScreen';

const Tab = createBottomTabNavigator();

export default function MainTabs() {
  return (
    <Tab.Navigator
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ title: 'Home' }} />
      <Tab.Screen name="Nearby" component={NearbyStationsScreen} options={{ title: 'Nearby' }} />
      <Tab.Screen name="Report" component={View} options={{ title: 'Report' }} />
      <Tab.Screen name="Predictions" component={PredictionsScreen} options={{ title: 'Insights' }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ title: 'Profile' }} />
    </Tab.Navigator>
  );
}
