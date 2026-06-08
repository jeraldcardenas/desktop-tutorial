/**
 * Confetti — a lightweight celebration animation built with the Animated API
 * (no extra native deps). A handful of colorful pieces fall and fade. Gentle,
 * not overstimulating.
 */
import React, { useEffect, useRef } from 'react';
import { Animated, Dimensions, Easing, StyleSheet, View } from 'react-native';
import { colors } from '../theme';

const PIECE_COLORS = [colors.coral, colors.sunny, colors.sky, colors.grape, colors.success];
const COUNT = 14;
const { width } = Dimensions.get('window');

function Piece({ delay, x, color, emoji }) {
  const fall = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const anim = Animated.timing(fall, {
      toValue: 1,
      duration: 1600,
      delay,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    });
    anim.start();
    return () => anim.stop();
  }, [fall, delay]);

  const translateY = fall.interpolate({ inputRange: [0, 1], outputRange: [-40, 320] });
  const rotate = fall.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '320deg'] });
  const opacity = fall.interpolate({ inputRange: [0, 0.8, 1], outputRange: [1, 1, 0] });

  return (
    <Animated.View
      style={[
        styles.piece,
        { left: x, backgroundColor: emoji ? 'transparent' : color, opacity, transform: [{ translateY }, { rotate }] },
      ]}
    />
  );
}

export default function Confetti() {
  const pieces = Array.from({ length: COUNT }).map((_, i) => ({
    key: i,
    delay: (i % 7) * 90,
    x: Math.round((i / COUNT) * (width - 24)) + 12,
    color: PIECE_COLORS[i % PIECE_COLORS.length],
  }));

  return (
    <View pointerEvents="none" style={styles.layer}>
      {pieces.map((p) => (
        <Piece key={p.key} {...p} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  layer: { ...StyleSheet.absoluteFillObject, alignItems: 'center', overflow: 'hidden' },
  piece: {
    position: 'absolute',
    top: 0,
    width: 12,
    height: 16,
    borderRadius: 3,
  },
});
