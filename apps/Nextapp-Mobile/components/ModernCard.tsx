import React from 'react';
import { View, StyleSheet, ViewStyle, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface ModernCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  onPress?: () => void;
  variant?: 'default' | 'gradient' | 'glass' | 'elevated';
  gradientColors?: string[];
}

export const ModernCard: React.FC<ModernCardProps> = ({
  children,
  style,
  onPress,
  variant = 'default',
  gradientColors = ['#667eea', '#764ba2'],
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
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  gradient: {
    borderRadius: 20,
    padding: 20,
  },
  glass: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    backdropFilter: 'blur(20px)',
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