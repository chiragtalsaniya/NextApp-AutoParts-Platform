import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Image,
  ScrollView,
  Dimensions,
} from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { ErrorMessage } from '@/components/ErrorMessage';
import { Eye, EyeOff, CircleAlert as AlertCircle, Wifi, WifiOff } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';

const { width, height } = Dimensions.get('window');

interface ValidationErrors {
  email?: string;
  password?: string;
  general?: string;
}

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  const { login, isAuthenticated, error, clearError } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      router.replace('/(tabs)');
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (error) {
      setValidationErrors({ general: error });
      clearError();
    }
  }, [error]);

  const validateEmail = (email: string): string | undefined => {
    if (!email.trim()) {
      return 'Email is required';
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return 'Please enter a valid email address';
    }
    return undefined;
  };

  const validatePassword = (password: string): string | undefined => {
    if (!password) {
      return 'Password is required';
    }
    if (password.length < 6) {
      return 'Password must be at least 6 characters';
    }
    return undefined;
  };

  const validateForm = (): boolean => {
    const errors: ValidationErrors = {};
    
    const emailError = validateEmail(email);
    const passwordError = validatePassword(password);
    
    if (emailError) errors.email = emailError;
    if (passwordError) errors.password = passwordError;
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleLogin = async () => {
    // Clear previous errors
    setValidationErrors({});
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await login({ email: email.trim(), password });
    } catch (error: any) {
      setValidationErrors({ 
        general: error.error || 'Login failed. Please check your credentials and try again.' 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const fillTestCredentials = (role: string) => {
    setValidationErrors({}); // Clear errors when filling test credentials
    
    switch (role) {
      case 'admin':
        setEmail('admin@company1.com');
        setPassword('password');
        break;
      case 'manager':
        setEmail('manager@store1.com');
        setPassword('password');
        break;
      case 'salesman':
        setEmail('salesman@store1.com');
        setPassword('password');
        break;
      case 'retailer':
        setEmail('retailer@downtownauto.com');
        setPassword('password');
        break;
      default:
        setEmail('admin@nextapp.com');
        setPassword('password');
    }
  };

  const handleEmailChange = (text: string) => {
    setEmail(text);
    // Clear email error when user starts typing
    if (validationErrors.email) {
      setValidationErrors(prev => ({ ...prev, email: undefined }));
    }
  };

  const handlePasswordChange = (text: string) => {
    setPassword(text);
    // Clear password error when user starts typing
    if (validationErrors.password) {
      setValidationErrors(prev => ({ ...prev, password: undefined }));
    }
  };

  // Check if error is network/CORS related
  const isNetworkError = validationErrors.general?.toLowerCase().includes('cors') || 
                        validationErrors.general?.toLowerCase().includes('network') || 
                        validationErrors.general?.toLowerCase().includes('connection');

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />
      
      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent} 
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Logo Section */}
          <View style={styles.logoContainer}>
            <View style={styles.logoWrapper}>
              <Image
                source={{
                  uri: 'https://images.pexels.com/photos/3688890/pexels-photo-3688890.jpeg?auto=compress&cs=tinysrgb&w=400',
                }}
                style={styles.logo}
              />
            </View>
            <Text style={styles.title}>NextApp Auto Parts</Text>
            <Text style={styles.subtitle}>Field CRM Mobile</Text>
          </View>

          {/* Platform-specific notice for web users */}
          {Platform.OS === 'web' && (
            <View style={styles.webNoticeContainer}>
              <BlurView intensity={20} style={styles.webNoticeBlur}>
                <View style={styles.webNoticeContent}>
                  <WifiOff size={20} color="#f59e0b" />
                  <View style={styles.webNoticeText}>
                    <Text style={styles.webNoticeTitle}>Web Version Notice</Text>
                    <Text style={styles.webNoticeSubtitle}>
                      For the best experience, use the mobile app. Web version may have connectivity limitations.
                    </Text>
                  </View>
                </View>
              </BlurView>
            </View>
          )}

          {/* Enhanced Error Message for Network Issues */}
          {validationErrors.general && (
            <View style={styles.errorContainer}>
              {isNetworkError ? (
                <ErrorMessage 
                  error={validationErrors.general} 
                  variant="network"
                  onRetry={() => {
                    setValidationErrors({});
                    handleLogin();
                  }}
                />
              ) : (
                <BlurView intensity={20} style={styles.errorBlur}>
                  <View style={styles.errorContent}>
                    <AlertCircle size={20} color="#ef4444" />
                    <Text style={styles.errorText}>{validationErrors.general}</Text>
                  </View>
                </BlurView>
              )}
            </View>
          )}

          {/* Login Form */}
          <View style={styles.formContainer}>
            <BlurView intensity={20} style={styles.formBlur}>
              <View style={styles.formContent}>
                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Email</Text>
                  <View style={[
                    styles.inputWrapper,
                    validationErrors.email && styles.inputError
                  ]}>
                    <TextInput
                      style={styles.input}
                      placeholder="Enter your email"
                      placeholderTextColor="rgba(255, 255, 255, 0.6)"
                      value={email}
                      onChangeText={handleEmailChange}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoCorrect={false}
                      editable={!isSubmitting}
                    />
                  </View>
                  {validationErrors.email && (
                    <View style={styles.fieldErrorContainer}>
                      <AlertCircle size={14} color="#ef4444" />
                      <Text style={styles.fieldErrorText}>{validationErrors.email}</Text>
                    </View>
                  )}
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Password</Text>
                  <View style={[
                    styles.passwordContainer,
                    validationErrors.password && styles.inputError
                  ]}>
                    <TextInput
                      style={styles.passwordInput}
                      placeholder="Enter your password"
                      placeholderTextColor="rgba(255, 255, 255, 0.6)"
                      value={password}
                      onChangeText={handlePasswordChange}
                      secureTextEntry={!showPassword}
                      editable={!isSubmitting}
                    />
                    <TouchableOpacity
                      style={styles.eyeButton}
                      onPress={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff size={20} color="rgba(255, 255, 255, 0.8)" />
                      ) : (
                        <Eye size={20} color="rgba(255, 255, 255, 0.8)" />
                      )}
                    </TouchableOpacity>
                  </View>
                  {validationErrors.password && (
                    <View style={styles.fieldErrorContainer}>
                      <AlertCircle size={14} color="#ef4444" />
                      <Text style={styles.fieldErrorText}>{validationErrors.password}</Text>
                    </View>
                  )}
                </View>

                <TouchableOpacity
                  style={[styles.loginButton, isSubmitting && styles.loginButtonDisabled]}
                  onPress={handleLogin}
                  disabled={isSubmitting}
                >
                  <LinearGradient
                    colors={isSubmitting ? ['#94a3b8', '#64748b'] : ['#10b981', '#059669']}
                    style={styles.loginGradient}
                  >
                    {isSubmitting ? (
                      <LoadingSpinner size="small" color="#FFFFFF" />
                    ) : (
                      <Text style={styles.loginButtonText}>Sign In</Text>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </BlurView>
          </View>

          {/* Test Credentials */}
          <View style={styles.testCredentialsContainer}>
            <BlurView intensity={20} style={styles.testCredentialsBlur}>
              <View style={styles.testCredentialsContent}>
                <Text style={styles.testTitle}>Test Accounts</Text>
                <View style={styles.credentialButtons}>
                  {[
                    { role: 'admin', label: 'Admin', colors: ['#667eea', '#764ba2'] },
                    { role: 'manager', label: 'Manager', colors: ['#f093fb', '#f5576c'] },
                    { role: 'salesman', label: 'Salesman', colors: ['#4facfe', '#00f2fe'] },
                    { role: 'retailer', label: 'Retailer', colors: ['#43e97b', '#38f9d7'] },
                  ].map((item) => (
                    <TouchableOpacity
                      key={item.role}
                      style={styles.credentialButton}
                      onPress={() => fillTestCredentials(item.role)}
                      activeOpacity={0.8}
                      disabled={isSubmitting}
                    >
                      <LinearGradient
                        colors={item.colors}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={[styles.credentialGradient, isSubmitting && styles.disabledButton]}
                      >
                        <Text style={styles.credentialButtonText}>{item.label}</Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </BlurView>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardContainer: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 40,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoWrapper: {
    width: 120,
    height: 120,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
  },
  logo: {
    width: 100,
    height: 100,
    borderRadius: 25,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  subtitle: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    fontWeight: '500',
  },
  webNoticeContainer: {
    marginHorizontal: 0,
    marginBottom: 20,
    borderRadius: 16,
    overflow: 'hidden',
  },
  webNoticeBlur: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  webNoticeContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  webNoticeText: {
    flex: 1,
    marginLeft: 12,
  },
  webNoticeTitle: {
    color: '#f59e0b',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  webNoticeSubtitle: {
    color: 'rgba(245, 158, 11, 0.8)',
    fontSize: 12,
    lineHeight: 16,
  },
  errorContainer: {
    marginHorizontal: 0,
    marginBottom: 20,
  },
  errorBlur: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    overflow: 'hidden',
  },
  errorContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  errorText: {
    color: '#ef4444',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
    flex: 1,
  },
  formContainer: {
    borderRadius: 24,
    marginBottom: 24,
    overflow: 'hidden',
  },
  formBlur: {
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  formContent: {
    padding: 32,
  },
  inputContainer: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  inputWrapper: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 16,
    fontSize: 16,
    color: '#FFFFFF',
  },
  inputError: {
    borderColor: 'rgba(239, 68, 68, 0.5)',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 16,
    fontSize: 16,
    color: '#FFFFFF',
  },
  eyeButton: {
    padding: 16,
  },
  fieldErrorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingHorizontal: 4,
  },
  fieldErrorText: {
    color: '#ef4444',
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 6,
  },
  loginButton: {
    marginTop: 16,
    borderRadius: 16,
    overflow: 'hidden',
  },
  loginButtonDisabled: {
    opacity: 0.7,
  },
  loginGradient: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  testCredentialsContainer: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  testCredentialsBlur: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  testCredentialsContent: {
    padding: 24,
  },
  testTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 20,
    textAlign: 'center',
  },
  credentialButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  credentialButton: {
    flex: 1,
    minWidth: '45%',
    borderRadius: 16,
    overflow: 'hidden',
  },
  credentialGradient: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    alignItems: 'center',
  },
  disabledButton: {
    opacity: 0.5,
  },
  credentialButtonText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '600',
  },
});