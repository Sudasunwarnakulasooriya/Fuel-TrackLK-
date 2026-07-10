import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialIcons } from '@expo/vector-icons';
import { colors } from '../theme/theme';

import StationDashboard from '../screens/StationDashboard';
import PredictionsScreen from '../screens/PredictionsScreen';
import StationProfileScreen from '../screens/StationProfileScreen';

const Tab = createBottomTabNavigator();

export default function StationTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          if (route.name === 'Dashboard') iconName = 'home';
          else if (route.name === 'Insights') iconName = 'insights';
          else if (route.name === 'Profile') iconName = 'person';
          
          return <MaterialIcons name={iconName} size={24} color={color} />;
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          borderTopWidth: 1,
          borderTopColor: colors.border,
          paddingTop: 8,
          paddingBottom: 8,
          height: 60,
          backgroundColor: colors.white,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '600',
          marginBottom: 4,
        },
      })}
    >
      <Tab.Screen name="Dashboard" component={StationDashboard} />
      <Tab.Screen name="Insights" component={PredictionsScreen} />
      <Tab.Screen name="Profile" component={StationProfileScreen} />
    </Tab.Navigator>
  );
}
