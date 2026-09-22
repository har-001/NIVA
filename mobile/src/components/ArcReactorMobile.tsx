// ============================================
// NIVA — Mobile Holographic Arc Reactor Core
// ============================================

import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity } from 'react-native';

export type OrbState = 'idle' | 'listening' | 'thinking' | 'speaking';

interface ArcReactorMobileProps {
  state?: OrbState;
  onPress?: () => void;
  size?: number;
}

export const ArcReactorMobile: React.FC<ArcReactorMobileProps> = ({
  state = 'idle',
  onPress,
  size = 180,
}: ArcReactorMobileProps) => {
  const spinAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Continuous rotation
    const spinLoop = Animated.loop(
      Animated.timing(spinAnim, {
        toValue: 1,
        duration: state === 'thinking' ? 3000 : 8000,
        useNativeDriver: true,
      })
    );
    spinLoop.start();

    // Pulse animation based on state
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: state === 'listening' ? 1.12 : state === 'speaking' ? 1.08 : 1.03,
          duration: state === 'listening' ? 600 : 1200,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: state === 'listening' ? 600 : 1200,
          useNativeDriver: true,
        }),
      ])
    );
    pulseLoop.start();

    return () => {
      spinLoop.stop();
      pulseLoop.stop();
    };
  }, [state]);

  const spin = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const reverseSpin = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['360deg', '0deg'],
  });

  const getThemeColor = () => {
    switch (state) {
      case 'listening':
        return '#38bdf8'; // Cyan Neon
      case 'thinking':
        return '#818cf8'; // Purple Indigo
      case 'speaking':
        return '#f472b6'; // Pink Neon
      default:
        return '#0284c7'; // Deep Sky Blue
    }
  };

  const themeColor = getThemeColor();

  return (
    <TouchableOpacity activeOpacity={0.85} onPress={onPress} style={[styles.container, { width: size, height: size }]}>
      {/* Outer Rotating Segmented Ring */}
      <Animated.View
        style={[
          styles.outerRing,
          {
            width: size,
            height: size,
            borderColor: themeColor,
            transform: [{ rotate: spin }, { scale: pulseAnim }],
          },
        ]}
      />

      {/* Counter-Rotating Middle Ring */}
      <Animated.View
        style={[
          styles.middleRing,
          {
            width: size * 0.78,
            height: size * 0.78,
            borderColor: themeColor,
            transform: [{ rotate: reverseSpin }],
          },
        ]}
      />

      {/* Inner Glowing Core */}
      <View
        style={[
          styles.innerCore,
          {
            width: size * 0.52,
            height: size * 0.52,
            backgroundColor: 'rgba(3, 7, 18, 0.92)',
            borderColor: themeColor,
            shadowColor: themeColor,
          },
        ]}
      >
        <Text style={[styles.coreGlyph, { color: themeColor }]}>
          {state === 'listening' ? '🎙️' : state === 'speaking' ? '🔊' : state === 'thinking' ? '🧠' : 'N'}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  outerRing: {
    position: 'absolute',
    borderRadius: 999,
    borderWidth: 2,
    borderStyle: 'dashed',
    opacity: 0.85,
  },
  middleRing: {
    position: 'absolute',
    borderRadius: 999,
    borderWidth: 1.5,
    borderStyle: 'dotted',
    opacity: 0.65,
  },
  innerCore: {
    borderRadius: 999,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 18,
    elevation: 10,
  },
  coreGlyph: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: 1,
  },
});
