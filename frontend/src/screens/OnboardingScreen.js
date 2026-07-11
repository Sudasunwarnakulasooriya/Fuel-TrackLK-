import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, FlatList, Dimensions } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, fontSizes, spacing, radii } from '../theme/theme';
import PrimaryButton from '../components/PrimaryButton';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const slides = [
  {
    id: '1',
    title: 'Find fuel easily',
    body: 'We help you locate nearby fuel stations, check live availability, and avoid long queues — all in real time.',
    icon: 'local-gas-station'
  },
  {
    id: '2',
    title: 'Track Queue Times',
    body: 'See live queue lengths and estimated wait times before you leave home.',
    icon: 'access-time'
  },
  {
    id: '3',
    title: 'Stay Updated',
    body: 'Get instant notifications for fuel arrivals and status changes at your favorite stations.',
    icon: 'notifications-active'
  }
];

export default function OnboardingScreen({ navigation }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef(null);

  const onViewableItemsChanged = useRef(({ viewableItems }) => {
    if (viewableItems[0]) {
      setCurrentIndex(viewableItems[0].index);
    }
  }).current;

  const viewConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

  const handleNext = () => {
    if (currentIndex < slides.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1, animated: true });
    } else {
      navigation.replace('Login');
    }
  };

  const getItemLayout = (_, index) => ({
    length: SCREEN_WIDTH,
    offset: SCREEN_WIDTH * index,
    index,
  });

  const renderItem = ({ item }) => (
    <View style={styles.slide}>
      <View style={styles.illustrationWrap}>
        <View style={styles.bigCircle}>
          <MaterialIcons name={item.icon} size={120} color={colors.primary} />
        </View>
        <View style={[styles.floatIcon, styles.float1]}>
          <MaterialIcons name="place" size={20} color={colors.primary} />
        </View>
        <View style={[styles.floatIcon, styles.float2]}>
          <MaterialIcons name="notifications" size={18} color={colors.primary} />
        </View>
        <View style={[styles.floatIcon, styles.float3]}>
          <MaterialIcons name="bolt" size={18} color={colors.primary} />
        </View>
      </View>

      <Text style={styles.title}>{item.title}</Text>
      <Text style={styles.body}>{item.body}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity style={styles.skip} onPress={() => navigation.replace('Login')}>
        <Text style={styles.skipText}>Skip</Text>
      </TouchableOpacity>

      <FlatList
        data={slides}
        renderItem={renderItem}
        horizontal
        showsHorizontalScrollIndicator={false}
        pagingEnabled
        bounces={false}
        keyExtractor={(item) => item.id}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewConfig}
        getItemLayout={getItemLayout}
        ref={flatListRef}
        style={styles.flatList}
      />

      <View style={styles.bottomContainer}>
        <View style={styles.dots}>
          {slides.map((_, index) => (
            <View
              key={index}
              style={[styles.dot, currentIndex === index && styles.dotActive]}
            />
          ))}
        </View>

        <PrimaryButton
          title={currentIndex === slides.length - 1 ? "Get Started" : "Next"}
          onPress={handleNext}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  skip: {
    alignSelf: 'flex-end',
    backgroundColor: colors.primaryTint,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: radii.pill,
    marginTop: spacing.sm,
    marginHorizontal: spacing.lg,
  },
  skipText: {
    color: colors.primary,
    fontWeight: '700',
    fontSize: fontSizes.sm,
  },
  flatList: {
    flex: 1,
  },
  slide: {
    width: SCREEN_WIDTH,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  illustrationWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xxl,
  },
  bigCircle: {
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: colors.primaryTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  floatIcon: {
    position: 'absolute',
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  float1: { top: 10, left: 30 },
  float2: { top: 40, right: 20 },
  float3: { bottom: 20, left: 50 },
  bottomContainer: {
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    marginBottom: spacing.lg,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.border,
  },
  dotActive: {
    width: 22,
    backgroundColor: colors.primary,
  },
  title: {
    fontSize: fontSizes.xl,
    fontWeight: '800',
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  body: {
    fontSize: fontSizes.base,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: spacing.sm,
  },
});
