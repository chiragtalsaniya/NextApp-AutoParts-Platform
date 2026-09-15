import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { ChevronRight } from 'lucide-react-native';

interface IOSListItemProps {
  title: string;
  subtitle?: string;
  value?: string;
  icon?: React.ReactNode;
  onPress?: () => void;
  showChevron?: boolean;
  isFirst?: boolean;
  isLast?: boolean;
  destructive?: boolean;
}

export const IOSListItem: React.FC<IOSListItemProps> = ({
  title,
  subtitle,
  value,
  icon,
  onPress,
  showChevron = false,
  isFirst = false,
  isLast = false,
  destructive = false,
}) => {
  const Component = onPress ? TouchableOpacity : View;

  return (
    <Component
      style={[
        styles.container,
        isFirst && styles.firstItem,
        isLast && styles.lastItem,
      ]}
      onPress={onPress}
      activeOpacity={onPress ? 0.6 : 1}
    >
      {icon && <View style={styles.iconContainer}>{icon}</View>}
      
      <View style={styles.content}>
        <View style={styles.textContainer}>
          <Text style={[
            styles.title,
            destructive && styles.destructiveText
          ]}>
            {title}
          </Text>
          {subtitle && (
            <Text style={styles.subtitle}>{subtitle}</Text>
          )}
        </View>
        
        {value && (
          <Text style={styles.value}>{value}</Text>
        )}
        
        {(showChevron || onPress) && (
          <ChevronRight size={16} color="#C6C6C8" style={styles.chevron} />
        )}
      </View>
    </Component>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: '#C6C6C8',
  },
  firstItem: {
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
  },
  lastItem: {
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
    borderBottomWidth: 0,
  },
  iconContainer: {
    marginRight: 12,
    width: 32,
    alignItems: 'center',
  },
  content: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 17,
    color: '#000000',
    fontFamily: 'Inter-Regular',
  },
  subtitle: {
    fontSize: 15,
    color: '#8E8E93',
    fontFamily: 'Inter-Regular',
    marginTop: 2,
  },
  value: {
    fontSize: 17,
    color: '#8E8E93',
    fontFamily: 'Inter-Regular',
    marginRight: 8,
  },
  chevron: {
    marginLeft: 8,
  },
  destructiveText: {
    color: '#FF3B30',
  },
});