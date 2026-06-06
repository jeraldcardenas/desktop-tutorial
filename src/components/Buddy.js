/**
 * Buddy — the friendly TalkQuest mascot.
 *
 * Built from plain emoji + animated views so the app ships with no image
 * assets and stays light. Buddy gently bobs to feel alive, and can show a few
 * moods used across screens.
 */
import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View, Easing } from 'react-native';
import { colors, radius } from '../theme';

const FACES = {
  happy: '🐻',
  cheer: '🥳',
  wave: '👋',
  sleepy: '😴',
};

export default function Buddy({ mood = 'happy', size = 140, bobbing = true }) {
  const bob = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!bobbing) return undefined;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(bob, {
          toValue: 1,
          duration: 900,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(bob, {
          toValue: 0,
          duration: 900,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [bob, bobbing]);

  const translateY = bob.interpolate({ inputRange: [0, 1], outputRange: [0, -10] });

  return (
    <Animated.View
      accessibilityLabel={`Buddy the bear looking ${mood}`}
      style={[
        styles.wrap,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          transform: [{ translateY }],
        },
      ]}
    >
      <View style={styles.inner}>
        <Text style={{ fontSize: size * 0.5 }}>{FACES[mood] || FACES.happy}</Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: colors.sunny,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.pill,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 5,
  },
  inner: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
