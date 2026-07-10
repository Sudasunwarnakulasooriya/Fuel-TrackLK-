import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, fontSizes, radii, shadow } from '../theme/theme';
import { fuelStations } from '../data/mockData';

const TAB_ICONS = {
  Home: 'home',
  Nearby: 'place',
  Report: 'add',
  Predictions: 'insights',
  Profile: 'person',
};

export default function CustomTabBar({ state, descriptors, navigation }) {
  return (
    <View style={styles.wrapper}>
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const isFocused = state.index === index;
        const isCenter = route.name === 'Report';

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });
          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        if (isCenter) {
          const handleCenterPress = () => {
            const nearest = [...fuelStations].sort((a, b) => a.distanceKm - b.distanceKm)[0];
            navigation.navigate('ReportQueue', { stationId: nearest.id });
          };

          return (
            <TouchableOpacity
              key={route.key}
              onPress={handleCenterPress}
              style={styles.centerBtn}
              activeOpacity={0.85}
              hitSlop={{ top: 28, bottom: 10, left: 10, right: 10 }}
            >
              <MaterialIcons name="add" size={28} color={colors.white} />
            </TouchableOpacity>
          );
        }

        return (
          <TouchableOpacity key={route.key} onPress={onPress} style={styles.tabItem}>
            <MaterialIcons
              name={TAB_ICONS[route.name]}
              size={22}
              color={isFocused ? colors.primary : colors.textMuted}
            />
            <Text style={[styles.tabLabel, isFocused && styles.tabLabelActive]}>
              {options.title || route.name}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 8,
    paddingBottom: 22,
    paddingHorizontal: 8,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    gap: 3,
  },
  tabLabel: {
    fontSize: 10,
    color: colors.textMuted,
    fontWeight: '600',
  },
  tabLabelActive: {
    color: colors.primary,
  },
  centerBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -28,
    ...shadow.button,
  },
});
