import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useAuth } from '@/context/AuthContext';
import { Plus, Package, ShoppingCart, Users, ChartBar as BarChart3, Scan, Camera, FileText, TriangleAlert as AlertTriangle } from 'lucide-react-native';

interface QuickAction {
  id: string;
  title: string;
  icon: React.ComponentType<any>;
  color: string;
  backgroundColor: string;
  onPress: () => void;
  roles: string[];
}

interface QuickActionsProps {
  onAction?: (actionId: string) => void;
}

export const QuickActions: React.FC<QuickActionsProps> = ({ onAction }) => {
  const { user } = useAuth();

  const quickActions: QuickAction[] = [
    {
      id: 'scan_barcode',
      title: 'Scan Part',
      icon: Scan,
      color: '#2563EB',
      backgroundColor: '#EFF6FF',
      onPress: () => onAction?.('scan_barcode'),
      roles: ['admin', 'manager', 'storeman', 'salesman'],
    },
    {
      id: 'new_order',
      title: 'New Order',
      icon: Plus,
      color: '#059669',
      backgroundColor: '#DCFCE7',
      onPress: () => onAction?.('new_order'),
      roles: ['admin', 'manager', 'salesman'],
    },
    {
      id: 'quick_stock',
      title: 'Quick Stock',
      icon: Package,
      color: '#7C3AED',
      backgroundColor: '#EDE9FE',
      onPress: () => onAction?.('quick_stock'),
      roles: ['admin', 'manager', 'storeman'],
    },
    {
      id: 'photo_report',
      title: 'Photo Report',
      icon: Camera,
      color: '#DC2626',
      backgroundColor: '#FEE2E2',
      onPress: () => onAction?.('photo_report'),
      roles: ['admin', 'manager', 'storeman', 'salesman'],
    },
    {
      id: 'low_stock_alert',
      title: 'Stock Alerts',
      icon: AlertTriangle,
      color: '#D97706',
      backgroundColor: '#FEF3C7',
      onPress: () => onAction?.('low_stock_alert'),
      roles: ['admin', 'manager', 'storeman'],
    },
    {
      id: 'daily_report',
      title: 'Daily Report',
      icon: FileText,
      color: '#0891B2',
      backgroundColor: '#CFFAFE',
      onPress: () => onAction?.('daily_report'),
      roles: ['admin', 'manager', 'salesman'],
    },
    {
      id: 'find_retailer',
      title: 'Find Retailer',
      icon: Users,
      color: '#7C2D12',
      backgroundColor: '#FEF2F2',
      onPress: () => onAction?.('find_retailer'),
      roles: ['admin', 'manager', 'salesman'],
    },
    {
      id: 'sales_summary',
      title: 'Sales Summary',
      icon: BarChart3,
      color: '#BE185D',
      backgroundColor: '#FCE7F3',
      onPress: () => onAction?.('sales_summary'),
      roles: ['admin', 'manager', 'salesman'],
    },
  ];

  const availableActions = quickActions.filter(action =>
    action.roles.includes(user?.role || '')
  );

  if (availableActions.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Quick Actions</Text>
      <View style={styles.actionsGrid}>
        {availableActions.map((action) => (
          <TouchableOpacity
            key={action.id}
            style={[styles.actionCard, { backgroundColor: action.backgroundColor }]}
            onPress={action.onPress}
            activeOpacity={0.7}
          >
            <View style={[styles.iconContainer, { backgroundColor: action.color + '20' }]}>
              <action.icon size={24} color={action.color} />
            </View>
            <Text style={[styles.actionText, { color: action.color }]}>
              {action.title}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
    fontFamily: 'Inter-SemiBold',
    marginBottom: 16,
    paddingHorizontal: 20,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    gap: 12,
  },
  actionCard: {
    flex: 1,
    minWidth: 100,
    maxWidth: '48%',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  actionText: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
    textAlign: 'center',
    lineHeight: 16,
  },
});