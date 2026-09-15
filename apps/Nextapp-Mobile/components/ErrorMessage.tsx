import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { CircleAlert as AlertCircle, RefreshCw, Wifi, WifiOff } from 'lucide-react-native';
import { ModernButton } from './ModernButton';
import { ModernCard } from './ModernCard';
import Animated, { FadeIn } from 'react-native-reanimated';

interface ErrorMessageProps {
  error: string;
  onRetry?: () => void;
  showRetry?: boolean;
  variant?: 'default' | 'minimal' | 'network';
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({
  error,
  onRetry,
  showRetry = true,
  variant = 'default',
}) => {
  const isNetworkError = error.toLowerCase().includes('cors') || 
                        error.toLowerCase().includes('network') || 
                        error.toLowerCase().includes('connection');

  if (variant === 'minimal') {
    return (
      <Animated.View entering={FadeIn.duration(300)} style={styles.minimalContainer}>
        <AlertCircle size={24} color="#ef4444" />
        <Text style={styles.minimalErrorText}>{error}</Text>
        {showRetry && onRetry && (
          <TouchableOpacity style={styles.minimalRetryButton} onPress={onRetry}>
            <RefreshCw size={16} color="#667eea" />
            <Text style={styles.minimalRetryText}>Try Again</Text>
          </TouchableOpacity>
        )}
      </Animated.View>
    );
  }

  if (variant === 'network' || isNetworkError) {
    return (
      <View style={styles.container}>
        <Animated.View entering={FadeIn.duration(300)}>
          <ModernCard style={styles.networkCard}>
            <View style={styles.networkIconContainer}>
              <View style={styles.networkIconWrapper}>
                <WifiOff size={32} color="#ef4444" />
              </View>
            </View>
            
            <Text style={styles.networkTitle}>Connection Issue</Text>
            <Text style={styles.networkText}>{error}</Text>
            
            {Platform.OS === 'web' && (
              <View style={styles.webSolutionsContainer}>
                <Text style={styles.solutionsTitle}>Possible Solutions:</Text>
                <View style={styles.solutionsList}>
                  <Text style={styles.solutionItem}>• Try using the mobile app instead</Text>
                  <Text style={styles.solutionItem}>• Check your internet connection</Text>
                  <Text style={styles.solutionItem}>• Refresh the page and try again</Text>
                  <Text style={styles.solutionItem}>• Contact support if the issue persists</Text>
                </View>
              </View>
            )}
            
            {showRetry && onRetry && (
              <ModernButton
                title="Try Again"
                onPress={onRetry}
                variant="gradient"
                icon={<RefreshCw size={18} color="#FFFFFF" />}
                style={styles.networkRetryButton}
              />
            )}
          </ModernCard>
        </Animated.View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Animated.View entering={FadeIn.duration(300)}>
        <ModernCard style={styles.errorCard}>
          <View style={styles.iconContainer}>
            <View style={styles.iconWrapper}>
              <AlertCircle size={32} color="#ef4444" />
            </View>
          </View>
          
          <Text style={styles.errorTitle}>Something went wrong</Text>
          <Text style={styles.errorText}>{error}</Text>
          
          {showRetry && onRetry && (
            <ModernButton
              title="Try Again"
              onPress={onRetry}
              variant="gradient"
              icon={<RefreshCw size={18} color="#FFFFFF" />}
              style={styles.retryButton}
            />
          )}
        </ModernCard>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#f8fafc',
  },
  errorCard: {
    alignItems: 'center',
    maxWidth: 320,
  },
  networkCard: {
    alignItems: 'center',
    maxWidth: 400,
  },
  iconContainer: {
    marginBottom: 20,
  },
  iconWrapper: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#fee2e2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  networkIconContainer: {
    marginBottom: 20,
  },
  networkIconWrapper: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#fee2e2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 12,
    textAlign: 'center',
  },
  networkTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 12,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  networkText: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 24,
  },
  webSolutionsContainer: {
    width: '100%',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  solutionsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  solutionsList: {
    gap: 4,
  },
  solutionItem: {
    fontSize: 14,
    color: '#64748b',
    lineHeight: 20,
  },
  retryButton: {
    minWidth: 140,
  },
  networkRetryButton: {
    minWidth: 160,
  },
  minimalContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fee2e2',
    padding: 16,
    borderRadius: 12,
    margin: 16,
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  minimalErrorText: {
    flex: 1,
    fontSize: 14,
    color: '#dc2626',
    marginLeft: 12,
    fontWeight: '500',
  },
  minimalRetryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    marginLeft: 12,
  },
  minimalRetryText: {
    color: '#667eea',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
});