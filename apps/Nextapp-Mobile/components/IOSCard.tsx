import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';

interface IOSCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  onPress?: () => void;
  variant?: 'default' | 'grouped' | 'inset';
}

export const IOSCard: React.FC<IOSCardProps> = ({
  children,
  style,
  onPress,
  variant = 'default',
}) => {
  const Component = onPress ? TouchableOpacity : View;
  
  return (
    <Component
      style={[
        styles.card,
        variant === 'grouped' && styles.groupedCard,
        variant === 'inset' && styles.insetCard,
        style,
      ]}
      onPress={onPress}
      activeOpacity={onPress ? 0.6 : 1}
    >
      {children}
    </Component>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    marginHorizontal: 16,
    marginVertical: 4,
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  groupedCard: {
    marginHorizontal: 0,
    borderRadius: 0,
    borderTopWidth: 0.5,
    borderBottomWidth: 0.5,
    borderColor: '#C6C6C8',
    shadowOpacity: 0,
    elevation: 0,
  },
  insetCard: {
    marginHorizontal: 20,
    borderRadius: 10,
  },
});