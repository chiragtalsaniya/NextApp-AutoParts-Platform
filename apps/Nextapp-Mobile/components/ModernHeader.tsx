import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, StatusBar, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { ChevronLeft, MoveHorizontal as MoreHorizontal } from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { colors, radii } from '@/constants/theme';

interface ModernHeaderProps {
  title: string;
  subtitle?: string;
  leftButton?: React.ReactNode | {
    icon?: React.ReactNode;
    title?: string;
    onPress: () => void;
  };
  rightButton?: {
    icon?: React.ReactNode;
    title?: string;
    onPress: () => void;
  };
  variant?: 'default' | 'gradient' | 'glass' | 'minimal';
  showBackButton?: boolean;
  onBackPress?: () => void;
}

export const ModernHeader: React.FC<ModernHeaderProps> = ({
  title,
  subtitle,
  leftButton,
  rightButton,
  variant = 'default',
  showBackButton = false,
  onBackPress,
}) => {
  const renderContent = () => (
    <Animated.View entering={FadeInDown.duration(600)} style={styles.content}>
      {/* Left Section */}
      <View style={styles.leftSection}>
        {showBackButton && onBackPress && (
          <TouchableOpacity
            style={styles.backButton}
            onPress={onBackPress}
            activeOpacity={0.7}
          >
            <ChevronLeft size={24} color={variant === 'minimal' ? colors.primary : colors.surface} />
          </TouchableOpacity>
        )}
        {typeof leftButton === 'object' && leftButton !== null && 'onPress' in leftButton ? (
          <TouchableOpacity
            style={styles.actionButton}
            onPress={leftButton.onPress}
            activeOpacity={0.7}
          >
            {leftButton.icon || <ChevronLeft size={24} color={variant === 'minimal' ? colors.primary : colors.surface} />}
            {leftButton.title && (
              <Text style={styles.buttonText}>{leftButton.title}</Text>
            )}
          </TouchableOpacity>
        ) : (
          leftButton
        )}
      </View>

      {/* Title Section */}
      <View style={styles.titleSection}>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        {subtitle && (
          <Text style={styles.subtitle} numberOfLines={1}>
            {subtitle}
          </Text>
        )}
      </View>

      {/* Right Section */}
      <View style={styles.rightSection}>
        {rightButton && (
          <TouchableOpacity
            style={styles.actionButton}
            onPress={rightButton.onPress}
            activeOpacity={0.7}
          >
            {rightButton.title && (
              <Text style={styles.buttonText}>{rightButton.title}</Text>
            )}
            {rightButton.icon || <MoreHorizontal size={24} color={variant === 'minimal' ? colors.primary : colors.surface} />}
          </TouchableOpacity>
        )}
      </View>
    </Animated.View>
  );

  if (variant === 'gradient') {
    return (
      <>
        <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
        <LinearGradient
          colors={[colors.primary, colors.primaryLight]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.container}
        >
          {renderContent()}
        </LinearGradient>
      </>
    );
  }

  if (variant === 'glass') {
    return (
      <>
        <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
        <BlurView intensity={80} style={styles.container}>
          <View style={styles.glassOverlay}>
            {renderContent()}
          </View>
        </BlurView>
      </>
    );
  }

  if (variant === 'minimal') {
    return (
      <>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
        <View style={[styles.container, styles.minimal]}>
          {renderContent()}
        </View>
      </>
    );
  }

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor={colors.primary} />
      <View style={[styles.container, styles.default]}>
        {renderContent()}
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingTop: Platform.OS === 'ios' ? 50 : (StatusBar.currentHeight || 0) + 10,
    paddingBottom: 16,
    paddingHorizontal: 20,
  },
  default: {
    backgroundColor: colors.primary,
  },
  minimal: {
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  glassOverlay: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 0,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 44,
  },
  leftSection: {
    flex: 1,
    alignItems: 'flex-start',
    flexDirection: 'row',
  },
  titleSection: {
    flex: 2,
    alignItems: 'center',
  },
  rightSection: {
    flex: 1,
    alignItems: 'flex-end',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: radii.md,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  buttonText: {
    fontSize: 16,
    color: colors.surface,
    fontWeight: '500',
    marginHorizontal: 4,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.surface,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    marginTop: 2,
  },
});