import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Search, X, Filter } from 'lucide-react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withTiming } from 'react-native-reanimated';

interface ModernSearchBarProps {
  onSearch: (query: string) => void;
  placeholder?: string;
  value?: string;
  showFilter?: boolean;
  onFilterPress?: () => void;
}

export const ModernSearchBar: React.FC<ModernSearchBarProps> = ({
  onSearch,
  placeholder = 'Search...',
  value = '',
  showFilter = false,
  onFilterPress,
}) => {
  const [searchQuery, setSearchQuery] = useState(value);
  const [isFocused, setIsFocused] = useState(false);
  
  const scale = useSharedValue(1);
  const borderColor = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    borderColor: withTiming(
      borderColor.value === 1 ? '#667eea' : '#e2e8f0',
      { duration: 200 }
    ),
  }));

  const handleFocus = () => {
    setIsFocused(true);
    scale.value = withSpring(1.02);
    borderColor.value = withTiming(1);
  };

  const handleBlur = () => {
    setIsFocused(false);
    scale.value = withSpring(1);
    borderColor.value = withTiming(0);
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    onSearch(query);
  };

  const clearSearch = () => {
    setSearchQuery('');
    onSearch('');
  };

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.searchContainer, animatedStyle]}>
        <View style={styles.searchIcon}>
          <Search size={20} color={isFocused ? '#667eea' : '#94a3b8'} />
        </View>
        
        <TextInput
          style={styles.input}
          placeholder={placeholder}
          placeholderTextColor="#94a3b8"
          value={searchQuery}
          onChangeText={handleSearch}
          onFocus={handleFocus}
          onBlur={handleBlur}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="search"
        />
        
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={clearSearch} style={styles.clearButton}>
            <View style={styles.clearIcon}>
              <X size={14} color="#FFFFFF" />
            </View>
          </TouchableOpacity>
        )}
        
        {showFilter && (
          <TouchableOpacity onPress={onFilterPress} style={styles.filterButton}>
            <Filter size={20} color="#667eea" />
          </TouchableOpacity>
        )}
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 52,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  searchIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#1e293b',
    fontWeight: '400',
  },
  clearButton: {
    marginLeft: 8,
    marginRight: 4,
  },
  clearIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#94a3b8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterButton: {
    marginLeft: 8,
    padding: 4,
  },
});