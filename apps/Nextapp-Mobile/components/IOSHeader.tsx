import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, StatusBar } from 'react-native';
import { ChevronLeft, MoveHorizontal as MoreHorizontal } from 'lucide-react-native';

interface IOSHeaderProps {
  title: string;
  subtitle?: string;
  leftButton?: {
    icon?: React.ReactNode;
    title?: string;
    onPress: () => void;
  };
  rightButton?: {
    icon?: React.ReactNode;
    title?: string;
    onPress: () => void;
  };
  large?: boolean;
}

export const IOSHeader: React.FC<IOSHeaderProps> = ({
  title,
  subtitle,
  leftButton,
  rightButton,
  large = false,
}) => {
  return (
    <>
      <StatusBar barStyle="dark-content" backgroundColor="#F8F9FA" />
      <View style={[styles.container, large && styles.largeContainer]}>
        <View style={styles.content}>
          {/* Left Button */}
          <View style={styles.leftSection}>
            {leftButton && (
              <TouchableOpacity
                style={styles.button}
                onPress={leftButton.onPress}
                activeOpacity={0.6}
              >
                {leftButton.icon || <ChevronLeft size={24} color="#007AFF" />}
                {leftButton.title && (
                  <Text style={styles.buttonText}>{leftButton.title}</Text>
                )}
              </TouchableOpacity>
            )}
          </View>

          {/* Title Section */}
          <View style={styles.titleSection}>
            <Text style={[styles.title, large && styles.largeTitle]} numberOfLines={1}>
              {title}
            </Text>
            {subtitle && (
              <Text style={styles.subtitle} numberOfLines={1}>
                {subtitle}
              </Text>
            )}
          </View>

          {/* Right Button */}
          <View style={styles.rightSection}>
            {rightButton && (
              <TouchableOpacity
                style={styles.button}
                onPress={rightButton.onPress}
                activeOpacity={0.6}
              >
                {rightButton.title && (
                  <Text style={styles.buttonText}>{rightButton.title}</Text>
                )}
                {rightButton.icon || <MoreHorizontal size={24} color="#007AFF" />}
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#F8F9FA',
    paddingTop: 44, // Status bar height
    paddingBottom: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: '#C6C6C8',
  },
  largeContainer: {
    paddingBottom: 16,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    minHeight: 44,
  },
  leftSection: {
    flex: 1,
    alignItems: 'flex-start',
  },
  titleSection: {
    flex: 2,
    alignItems: 'center',
  },
  rightSection: {
    flex: 1,
    alignItems: 'flex-end',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  buttonText: {
    fontSize: 17,
    color: '#007AFF',
    fontFamily: 'Inter-Regular',
    marginHorizontal: 4,
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000000',
    fontFamily: 'Inter-SemiBold',
    textAlign: 'center',
  },
  largeTitle: {
    fontSize: 34,
    fontWeight: 'bold',
    fontFamily: 'Inter-Bold',
  },
  subtitle: {
    fontSize: 13,
    color: '#8E8E93',
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
    marginTop: 2,
  },
});