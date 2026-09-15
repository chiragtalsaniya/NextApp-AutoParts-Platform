import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  Switch,
} from 'react-native';
import { router } from 'expo-router';
import { apiService } from '@/services/api';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { useAuth } from '@/context/AuthContext';
import {
  ArrowLeft,
  Save,
  Package,
  DollarSign,
  Tag,
  Info,
  Star,
  Award,
  Zap,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInUp } from 'react-native-reanimated';

interface PartForm {
  Part_Number: string;
  Part_Name: string;
  Part_Price: string;
  Part_MinQty: string;
  Part_BasicDisc: string;
  Part_SchemeDisc: string;
  Part_AdditionalDisc: string;
  Part_Application: string;
  Part_Catagory: string;
  Focus_Group: string;
  GuruPoint: string;
  ChampionPoint: string;
  Is_Order_Pad: boolean;
}

export default function AddPartScreen() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [form, setForm] = useState<PartForm>({
    Part_Number: '',
    Part_Name: '',
    Part_Price: '',
    Part_MinQty: '1',
    Part_BasicDisc: '0',
    Part_SchemeDisc: '0',
    Part_AdditionalDisc: '0',
    Part_Application: '',
    Part_Catagory: '',
    Focus_Group: '',
    GuruPoint: '0',
    ChampionPoint: '0',
    Is_Order_Pad: false,
  });

  const canAddParts = ['super_admin', 'admin', 'manager'].includes(user?.role || '');

  if (!canAddParts) {
    return (
      <View style={styles.container}>
        <View style={styles.unauthorizedContainer}>
          <Package size={64} color="#94a3b8" />
          <Text style={styles.unauthorizedTitle}>Access Denied</Text>
          <Text style={styles.unauthorizedText}>
            You don't have permission to add new parts.
          </Text>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const updateForm = (field: keyof PartForm, value: string | boolean) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const validateForm = (): boolean => {
    if (!form.Part_Number.trim()) {
      Alert.alert('Validation Error', 'Part Number is required');
      return false;
    }
    
    if (!form.Part_Name.trim()) {
      Alert.alert('Validation Error', 'Part Name is required');
      return false;
    }
    
    if (!form.Part_Price.trim() || isNaN(parseFloat(form.Part_Price))) {
      Alert.alert('Validation Error', 'Valid Part Price is required');
      return false;
    }
    
    if (!form.Part_Catagory.trim()) {
      Alert.alert('Validation Error', 'Part Category is required');
      return false;
    }
    
    if (!form.Focus_Group.trim()) {
      Alert.alert('Validation Error', 'Focus Group is required');
      return false;
    }
    
    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const partData = {
        ...form,
        Part_Price: parseFloat(form.Part_Price),
        Part_MinQty: parseInt(form.Part_MinQty) || 1,
        Part_BasicDisc: parseFloat(form.Part_BasicDisc) || 0,
        Part_SchemeDisc: parseFloat(form.Part_SchemeDisc) || 0,
        Part_AdditionalDisc: parseFloat(form.Part_AdditionalDisc) || 0,
        GuruPoint: parseInt(form.GuruPoint) || 0,
        ChampionPoint: parseInt(form.ChampionPoint) || 0,
        Is_Order_Pad: form.Is_Order_Pad ? 1 : 0,
        Item_Status: 'Active',
        Order_Pad_Category: form.Is_Order_Pad ? 1 : 0,
      };

      // In a real app, you would call the API
      // await apiService.createPart(partData);
      
      Alert.alert(
        'Success',
        'Part has been added successfully!',
        [
          {
            text: 'OK',
            onPress: () => router.back(),
          },
        ]
      );
    } catch (error: any) {
      Alert.alert('Error', error.error || 'Failed to add part');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <LinearGradient
          colors={['#667eea', '#764ba2']}
          style={styles.headerGradient}
        >
          <View style={styles.headerContent}>
            <TouchableOpacity
              style={styles.headerBackButton}
              onPress={() => router.back()}
            >
              <ArrowLeft size={24} color="#FFFFFF" />
            </TouchableOpacity>
            
            <View style={styles.headerTitle}>
              <Text style={styles.headerTitleText}>Add New Part</Text>
              <Text style={styles.headerSubtitle}>Create a new auto part</Text>
            </View>
            
            <View style={styles.headerSpacer} />
          </View>
        </LinearGradient>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {/* Basic Information */}
        <Animated.View entering={FadeInUp.delay(0).duration(600)} style={styles.section}>
          <View style={styles.sectionHeader}>
            <Package size={24} color="#667eea" />
            <Text style={styles.sectionTitle}>Basic Information</Text>
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Part Number *</Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g., BP-002-BREMBO"
              value={form.Part_Number}
              onChangeText={(text) => updateForm('Part_Number', text)}
              autoCapitalize="characters"
            />
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Part Name *</Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g., Brembo Brake Pads - Front Set"
              value={form.Part_Name}
              onChangeText={(text) => updateForm('Part_Name', text)}
            />
          </View>
          
          <View style={styles.inputRow}>
            <View style={styles.inputGroupHalf}>
              <Text style={styles.inputLabel}>Category *</Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g., Brake Pads"
                value={form.Part_Catagory}
                onChangeText={(text) => updateForm('Part_Catagory', text)}
              />
            </View>
            
            <View style={styles.inputGroupHalf}>
              <Text style={styles.inputLabel}>Focus Group *</Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g., Brake System"
                value={form.Focus_Group}
                onChangeText={(text) => updateForm('Focus_Group', text)}
              />
            </View>
          </View>
        </Animated.View>

        {/* Pricing Information */}
        <Animated.View entering={FadeInUp.delay(200).duration(600)} style={styles.section}>
          <View style={styles.sectionHeader}>
            <DollarSign size={24} color="#059669" />
            <Text style={styles.sectionTitle}>Pricing Information</Text>
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Base Price *</Text>
            <TextInput
              style={styles.textInput}
              placeholder="0.00"
              value={form.Part_Price}
              onChangeText={(text) => updateForm('Part_Price', text)}
              keyboardType="numeric"
            />
          </View>
          
          <View style={styles.inputRow}>
            <View style={styles.inputGroupThird}>
              <Text style={styles.inputLabel}>Basic Discount (%)</Text>
              <TextInput
                style={styles.textInput}
                placeholder="0"
                value={form.Part_BasicDisc}
                onChangeText={(text) => updateForm('Part_BasicDisc', text)}
                keyboardType="numeric"
              />
            </View>
            
            <View style={styles.inputGroupThird}>
              <Text style={styles.inputLabel}>Scheme Discount (%)</Text>
              <TextInput
                style={styles.textInput}
                placeholder="0"
                value={form.Part_SchemeDisc}
                onChangeText={(text) => updateForm('Part_SchemeDisc', text)}
                keyboardType="numeric"
              />
            </View>
            
            <View style={styles.inputGroupThird}>
              <Text style={styles.inputLabel}>Additional Discount (%)</Text>
              <TextInput
                style={styles.textInput}
                placeholder="0"
                value={form.Part_AdditionalDisc}
                onChangeText={(text) => updateForm('Part_AdditionalDisc', text)}
                keyboardType="numeric"
              />
            </View>
          </View>
        </Animated.View>

        {/* Inventory Information */}
        <Animated.View entering={FadeInUp.delay(400).duration(600)} style={styles.section}>
          <View style={styles.sectionHeader}>
            <Tag size={24} color="#f59e0b" />
            <Text style={styles.sectionTitle}>Inventory Information</Text>
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Minimum Quantity</Text>
            <TextInput
              style={styles.textInput}
              placeholder="1"
              value={form.Part_MinQty}
              onChangeText={(text) => updateForm('Part_MinQty', text)}
              keyboardType="numeric"
            />
          </View>
          
          <View style={styles.switchGroup}>
            <View style={styles.switchInfo}>
              <Zap size={20} color="#10b981" />
              <Text style={styles.switchLabel}>Quick Order Pad</Text>
            </View>
            <Switch
              value={form.Is_Order_Pad}
              onValueChange={(value) => updateForm('Is_Order_Pad', value)}
              trackColor={{ false: '#e2e8f0', true: '#dcfce7' }}
              thumbColor={form.Is_Order_Pad ? '#10b981' : '#94a3b8'}
            />
          </View>
        </Animated.View>

        {/* Special Points */}
        <Animated.View entering={FadeInUp.delay(600).duration(600)} style={styles.section}>
          <View style={styles.sectionHeader}>
            <Star size={24} color="#8b5cf6" />
            <Text style={styles.sectionTitle}>Special Points</Text>
          </View>
          
          <View style={styles.inputRow}>
            <View style={styles.inputGroupHalf}>
              <Text style={styles.inputLabel}>Guru Points</Text>
              <View style={styles.pointsInput}>
                <Award size={16} color="#f59e0b" />
                <TextInput
                  style={styles.pointsTextInput}
                  placeholder="0"
                  value={form.GuruPoint}
                  onChangeText={(text) => updateForm('GuruPoint', text)}
                  keyboardType="numeric"
                />
              </View>
            </View>
            
            <View style={styles.inputGroupHalf}>
              <Text style={styles.inputLabel}>Champion Points</Text>
              <View style={styles.pointsInput}>
                <Star size={16} color="#8b5cf6" />
                <TextInput
                  style={styles.pointsTextInput}
                  placeholder="0"
                  value={form.ChampionPoint}
                  onChangeText={(text) => updateForm('ChampionPoint', text)}
                  keyboardType="numeric"
                />
              </View>
            </View>
          </View>
        </Animated.View>

        {/* Application Information */}
        <Animated.View entering={FadeInUp.delay(800).duration(600)} style={styles.section}>
          <View style={styles.sectionHeader}>
            <Info size={24} color="#64748b" />
            <Text style={styles.sectionTitle}>Application Information</Text>
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Compatible Vehicles</Text>
            <TextInput
              style={styles.textAreaInput}
              placeholder="e.g., BMW 3 Series, Mercedes C-Class, Audi A4"
              value={form.Part_Application}
              onChangeText={(text) => updateForm('Part_Application', text)}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>
        </Animated.View>

        {/* Save Button */}
        <Animated.View entering={FadeInUp.delay(1000).duration(600)} style={styles.saveButtonContainer}>
          <TouchableOpacity
            style={styles.saveButton}
            onPress={handleSave}
            disabled={isLoading}
          >
            <LinearGradient
              colors={['#667eea', '#764ba2']}
              style={styles.saveGradient}
            >
              {isLoading ? (
                <LoadingSpinner size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Save size={20} color="#FFFFFF" />
                  <Text style={styles.saveButtonText}>Add Part</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    paddingTop: 50,
  },
  headerGradient: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerBackButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitleText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  headerSpacer: {
    width: 44,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingBottom: 40,
  },
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    margin: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    marginLeft: 12,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 12,
  },
  inputGroupHalf: {
    flex: 1,
    marginBottom: 20,
  },
  inputGroupThird: {
    flex: 1,
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1e293b',
    backgroundColor: '#FFFFFF',
  },
  textAreaInput: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1e293b',
    backgroundColor: '#FFFFFF',
    minHeight: 80,
  },
  switchGroup: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    marginBottom: 20,
  },
  switchInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  switchLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginLeft: 8,
  },
  pointsInput: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
  },
  pointsTextInput: {
    flex: 1,
    fontSize: 16,
    color: '#1e293b',
    marginLeft: 8,
  },
  saveButtonContainer: {
    marginHorizontal: 20,
    marginTop: 8,
  },
  saveButton: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  saveGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  unauthorizedContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  unauthorizedTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
    marginTop: 20,
    marginBottom: 12,
  },
  unauthorizedText: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  backButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#667eea',
    borderRadius: 12,
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});