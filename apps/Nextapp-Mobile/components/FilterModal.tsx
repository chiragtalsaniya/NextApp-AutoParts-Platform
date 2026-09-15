import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
  SafeAreaView,
  Dimensions,
} from 'react-native';
import { X, Check } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { SlideInDown, SlideOutDown, FadeIn } from 'react-native-reanimated';

const { height } = Dimensions.get('window');

interface FilterOption {
  key: string;
  label: string;
  icon?: React.ComponentType<any>;
  count?: number;
}

interface SortOption {
  key: string;
  label: string;
  icon?: React.ComponentType<any>;
}

interface FilterModalProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  filters: FilterOption[];
  sorts: SortOption[];
  selectedFilter: string;
  selectedSort: string;
  onFilterSelect: (filter: string) => void;
  onSortSelect: (sort: string) => void;
}

export const FilterModal: React.FC<FilterModalProps> = ({
  visible,
  onClose,
  title,
  filters,
  sorts,
  selectedFilter,
  selectedSort,
  onFilterSelect,
  onSortSelect,
}) => {
  const handleApply = () => {
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
      accessibilityViewIsModal
    >
      <View style={styles.modalOverlay}>
        <TouchableOpacity 
          style={styles.modalBackdrop} 
          activeOpacity={1} 
          onPress={onClose}
        />
        
        <Animated.View 
          entering={SlideInDown.duration(300)} 
          exiting={SlideOutDown.duration(300)}
          style={styles.filterModal}
        >
          <SafeAreaView style={styles.modalSafeArea}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleContainer}>
                <Text style={styles.modalTitle}>{title}</Text>
              </View>
              <TouchableOpacity 
                onPress={onClose}
                style={styles.closeButton}
              >
                <X size={24} color="#64748b" />
              </TouchableOpacity>
            </View>
            
            <ScrollView 
              style={styles.modalContent}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.modalScrollContent}
            >
              {/* Filter Section */}
              <View style={styles.filterSection}>
                <Text style={styles.filterSectionTitle}>Filter Options</Text>
                <View style={styles.filterGrid}>
                  {filters.map((filter) => (
                    <TouchableOpacity
                      key={filter.key}
                      style={[
                        styles.filterOption,
                        selectedFilter === filter.key && styles.selectedFilterOption
                      ]}
                      onPress={() => onFilterSelect(filter.key)}
                    >
                      <View style={styles.filterOptionContent}>
                        {filter.icon && (
                          <filter.icon 
                            size={20} 
                            color={selectedFilter === filter.key ? '#667eea' : '#64748b'} 
                          />
                        )}
                        <Text style={[
                          styles.filterOptionText,
                          selectedFilter === filter.key && styles.selectedFilterOptionText
                        ]}>
                          {filter.label}
                        </Text>
                      </View>
                      {filter.count !== undefined && (
                        <View style={[
                          styles.filterCount,
                          selectedFilter === filter.key && styles.selectedFilterCount
                        ]}>
                          <Text style={[
                            styles.filterCountText,
                            selectedFilter === filter.key && styles.selectedFilterCountText
                          ]}>
                            {filter.count}
                          </Text>
                        </View>
                      )}
                      {selectedFilter === filter.key && (
                        <View style={styles.selectedIndicator}>
                          <Check size={16} color="#667eea" />
                        </View>
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
              
              {/* Sort Section */}
              <View style={styles.sortSection}>
                <Text style={styles.filterSectionTitle}>Sort Options</Text>
                <View style={styles.sortGrid}>
                  {sorts.map((sort) => (
                    <TouchableOpacity
                      key={sort.key}
                      style={[
                        styles.sortOption,
                        selectedSort === sort.key && styles.selectedSortOption
                      ]}
                      onPress={() => onSortSelect(sort.key)}
                    >
                      {sort.icon && (
                        <sort.icon 
                          size={18} 
                          color={selectedSort === sort.key ? '#667eea' : '#64748b'} 
                        />
                      )}
                      <Text style={[
                        styles.sortOptionText,
                        selectedSort === sort.key && styles.selectedSortOptionText
                      ]}>
                        {sort.label}
                      </Text>
                      {selectedSort === sort.key && (
                        <View style={styles.selectedIndicator}>
                          <Check size={16} color="#667eea" />
                        </View>
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </ScrollView>
            
            {/* Apply Button */}
            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.applyButton}
                onPress={handleApply}
              >
                <LinearGradient
                  colors={['#667eea', '#764ba2']}
                  style={styles.applyGradient}
                >
                  <Check size={20} color="#FFFFFF" />
                  <Text style={styles.applyButtonText}>Apply Filters</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalBackdrop: {
    flex: 1,
  },
  filterModal: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: height * 0.85,
    minHeight: height * 0.5,
  },
  modalSafeArea: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  modalTitleContainer: {
    flex: 1,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f8fafc',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalContent: {
    flex: 1,
  },
  modalScrollContent: {
    paddingBottom: 20,
  },
  filterSection: {
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  filterSectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 16,
  },
  filterGrid: {
    gap: 8,
  },
  filterOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#FFFFFF',
  },
  selectedFilterOption: {
    backgroundColor: '#ede9fe',
    borderColor: '#667eea',
  },
  filterOptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  filterOptionText: {
    fontSize: 16,
    color: '#64748b',
    marginLeft: 12,
    fontWeight: '500',
  },
  selectedFilterOptionText: {
    color: '#667eea',
    fontWeight: '600',
  },
  filterCount: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    minWidth: 32,
    alignItems: 'center',
    marginRight: 8,
  },
  selectedFilterCount: {
    backgroundColor: '#667eea',
  },
  filterCountText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
  },
  selectedFilterCountText: {
    color: '#FFFFFF',
  },
  selectedIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#ede9fe',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sortSection: {
    paddingHorizontal: 24,
    paddingTop: 32,
  },
  sortGrid: {
    gap: 8,
  },
  sortOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#FFFFFF',
  },
  selectedSortOption: {
    backgroundColor: '#ede9fe',
    borderColor: '#667eea',
  },
  sortOptionText: {
    fontSize: 16,
    color: '#64748b',
    marginLeft: 12,
    fontWeight: '500',
    flex: 1,
  },
  selectedSortOptionText: {
    color: '#667eea',
    fontWeight: '600',
  },
  modalFooter: {
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  applyButton: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  applyGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  applyButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
});