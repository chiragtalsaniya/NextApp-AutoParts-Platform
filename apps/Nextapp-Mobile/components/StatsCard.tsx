import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { TrendingUp, TrendingDown } from 'lucide-react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  variant?: 'default' | 'gradient';
  gradientColors?: string[];
  delay?: number;
}

export const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  trend,
  variant = 'default',
  gradientColors = ['#667eea', '#764ba2'],
  delay = 0,
}) => {
  const renderContent = () => (
    <View style={styles.content}>
      <View style={styles.header}>
        <View style={[styles.iconContainer, variant === 'gradient' && styles.gradientIcon]}>
          {icon}
        </View>
        {trend && (
          <View style={[
            styles.trendContainer,
            { backgroundColor: trend.isPositive ? '#dcfce7' : '#fee2e2' }
          ]}>
            {trend.isPositive ? (
              <TrendingUp size={12} color="#059669" />
            ) : (
              <TrendingDown size={12} color="#dc2626" />
            )}
            <Text style={[
              styles.trendText,
              { color: trend.isPositive ? '#059669' : '#dc2626' }
            ]}>
              {Math.abs(trend.value)}%
            </Text>
          </View>
        )}
      </View>
      
      <Text style={[styles.value, variant === 'gradient' && styles.gradientValue]}>
        {value}
      </Text>
      
      <Text style={[styles.title, variant === 'gradient' && styles.gradientTitle]}>
        {title}
      </Text>
      
      {subtitle && (
        <Text style={[styles.subtitle, variant === 'gradient' && styles.gradientSubtitle]}>
          {subtitle}
        </Text>
      )}
    </View>
  );

  if (variant === 'gradient') {
    return (
      <Animated.View 
        entering={FadeInUp.delay(delay).duration(600)}
        style={[styles.container, styles.gradientContainer]}
      >
        <LinearGradient
          colors={gradientColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradient}
        >
          {renderContent()}
        </LinearGradient>
      </Animated.View>
    );
  }

  return (
    <Animated.View 
      entering={FadeInUp.delay(delay).duration(600)}
      style={[styles.container, styles.defaultContainer]}
    >
      {renderContent()}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    minWidth: 160,
    marginHorizontal: 6,
    marginVertical: 8,
  },
  defaultContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  gradientContainer: {
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 12,
  },
  gradient: {
    borderRadius: 20,
    padding: 20,
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f8fafc',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gradientIcon: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  trendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  trendText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  value: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 4,
  },
  gradientValue: {
    color: '#FFFFFF',
  },
  title: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
    marginBottom: 4,
  },
  gradientTitle: {
    color: 'rgba(255, 255, 255, 0.9)',
  },
  subtitle: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '400',
  },
  gradientSubtitle: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
});