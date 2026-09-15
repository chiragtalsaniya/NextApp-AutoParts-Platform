declare global {
  namespace NodeJS {
    interface ProcessEnv {
      // API Configuration
      EXPO_PUBLIC_API_URL: string;
      EXPO_PUBLIC_API_VERSION: string;

      // App Environment
      EXPO_PUBLIC_APP_ENV: 'development' | 'staging' | 'production';
      EXPO_PUBLIC_APP_VERSION: string;

      // File Upload Configuration
      EXPO_PUBLIC_MAX_FILE_SIZE: string;

      // API Rate Limiting
      EXPO_PUBLIC_RATE_LIMIT_WINDOW_MS: string;
      EXPO_PUBLIC_RATE_LIMIT_MAX_REQUESTS: string;

      // Mobile App Configuration
      EXPO_PUBLIC_MOBILE_API_VERSION: string;
      EXPO_PUBLIC_MOBILE_APP_SECRET: string;

      // Security Configuration
      EXPO_PUBLIC_JWT_EXPIRES_IN: string;
    }
  }
}

// Ensure this file is treated as a module
export {};