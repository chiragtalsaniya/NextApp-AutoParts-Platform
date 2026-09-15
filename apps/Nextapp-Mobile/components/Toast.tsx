import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { CircleCheck as CheckCircle, CircleAlert as AlertCircle, Info, TriangleAlert as AlertTriangle } from 'lucide-react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring, 
  withTiming, 
  runOnJS 
} from 'react-native-reanimated';

const { width } = Dimensions.get('window');

interface ToastProps {
  visible: boolean;
  message: string;
  type?: 'success' | 'error' | 'info' | 'warning';
  duration?: number;
  onHide?: () => void;
}

export const Toast: React.FC<ToastProps> = ({
  visible,
  message,
  type = 'success',
  duration = 3000,
  onHide,
}) => {
  const translateY = useSharedValue(-100);
  const opacity = useSharedValue(0);

  const getToastConfig = () => {
    switch (type) {
      case 'success':
        return {
          icon: <CheckCircle size={24} color="#FFFFFF" />,
          backgroundColor: '#10b981',
          borderColor: '#059669',
        };
      case 'error':
        return {
          icon: <AlertCircle size={24} color="#FFFFFF" />,
          backgroundColor: '#ef4444',
          borderColor: '#dc2626',
        };
      case 'warning':
        return {
          icon: <AlertTriangle size={24} color="#FFFFFF" />,
          backgroundColor: '#f59e0b',
          borderColor: '#d97706',
        };
      case 'info':
      default:
        return {
          icon: <Info size={24} color="#FFFFFF" />,
          backgroundColor: '#3b82f6',
          borderColor: '#2563eb',
        };
    }
  };

  const config = getToastConfig();

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }), []); // Fixed: Added empty dependency array

  useEffect(() => {
    if (visible) {
      // Show toast
      translateY.value = withSpring(0, { damping: 15, stiffness: 150 });
      opacity.value = withTiming(1, { duration: 300 });

      // Auto hide after duration
      const timer = setTimeout(() => {
        translateY.value = withSpring(-100, { damping: 15, stiffness: 150 });
        opacity.value = withTiming(0, { duration: 300 }, () => {
          if (onHide) {
            runOnJS(onHide)();
          }
        });
      }, duration);

      return () => clearTimeout(timer);
    } else {
      // Hide toast
      translateY.value = withSpring(-100, { damping: 15, stiffness: 150 });
      opacity.value = withTiming(0, { duration: 300 });
    }
  }, [visible, duration, onHide]);

  // Don't render anything if not visible and already hidden
  if (!visible && translateY.value === -100) {
    return null;
  }

  return (
    <Animated.View 
      style={[styles.container, animatedStyle]}
      pointerEvents={visible ? 'auto' : 'none'}
      accessibilityLiveRegion="polite"
      accessibilityRole="alert"
    >
      <View
        style={[
          styles.toast,
          {
            backgroundColor: config.backgroundColor,
            borderColor: config.borderColor,
          },
        ]}
      >
        <View style={styles.iconContainer}>
          {config.icon}
        </View>
        <Text style={styles.message} numberOfLines={2}>
          {message}
        </Text>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 60,
    left: 20,
    right: 20,
    zIndex: 9999,
    elevation: 9999,
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
  },
  iconContainer: {
    marginRight: 12,
  },
  message: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    lineHeight: 22,
  },
});