import React from 'react';
import { View, StyleSheet, ViewStyle, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, radii } from '@/constants/theme';

interface ModernCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  onPress?: () => void;
  variant?: 'default' | 'gradient' | 'glass' | 'elevated';
  gradientColors?: [string, string, ...string[]];
}

export const ModernCard: React.FC<ModernCardProps> = ({
  children,
  style,
  onPress,
  variant = 'default',
  gradientColors = [colors.primary, colors.primaryLight],
}) => {
  const Component = onPress ? TouchableOpacity : View;

  if (variant === 'gradient') {
    return (
      <Component
        style={[styles.container, style]}
        onPress={onPress}
        activeOpacity={onPress ? 0.8 : 1}
      >
        <LinearGradient
          colors={gradientColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradient}
        >
          {children}
        </LinearGradient>
      </Component>
    );
  }

  return (
    <Component
      style={[
        styles.container,
        variant === 'glass' && styles.glass,
        variant === 'elevated' && styles.elevated,
        style,
      ]}
      onPress={onPress}
      activeOpacity={onPress ? 0.95 : 1}
    >
      {children}
    </Component>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    padding: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  gradient: {
    borderRadius: radii.md,
    padding: 16,
  },
  glass: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  elevated: {
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 12,
    backgroundColor: '#FFFFFF',
  },
});