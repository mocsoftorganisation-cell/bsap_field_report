
export const environment = {
  production: false,
  apiUrl: 'http://localhost:5000/api/', // local development API
                       //           apiUrl: 'http://164.52.217.93:9071/api/', // staging API
  wsUrl: 'http://localhost:5050',
  // API Endpoints
  endpoints: {
    // Authentication
    auth: {
      login: 'auth/login',
      logout: 'auth/logout',
      refresh: 'auth/refresh',
      profile: 'auth/profile',
      changePassword: 'auth/change-password',
      forgotPassword: 'auth/forgot-password',
      resetPassword: 'auth/reset-password'
    },
    
    // Menu
    menu: {
      userMenu: 'menu/user-menu',
      adminMenu: 'menu/admin-menu',
      permissions: 'menu/permissions'
    },
    
    // User Management
    users: {
      list: 'users',
      create: 'users',
      update: 'users',
      delete: 'users',
      profile: 'users/profile'
    },
    
    // Dashboard
    dashboard: {
      stats: 'dashboard/stats',
      activities: 'dashboard/activities',
      notifications: 'dashboard/notifications'
    },
    
    // Settings
    settings: {
      general: 'settings/general',
      security: 'settings/security',
      preferences: 'settings/preferences'
    }
  },
  
  // Application Configuration
  app: {
    name: 'BSAP Frontend',
    version: '1.0.0',
    tokenKey: 'token',
    refreshTokenKey: 'refreshToken',
    userKey: 'user',
    
    // Token configuration
    token: {
      expirationBuffer: 300, // 5 minutes before expiration
      refreshThreshold: 900, // 15 minutes before expiration
      maxRetries: 3
    },
    
    // UI Configuration
    ui: {
      defaultPageSize: 10,
      maxPageSize: 100,
      debounceTime: 300,
      toastDuration: 5000
    },
    
    // Feature flags
    features: {
      enableNotifications: true,
      enableDarkMode: true,
      enableMultiLanguage: false,
      enableAdvancedSearch: true,
      enableFileUpload: true,
      enableExport: true
    }
  },
  
  // External Services (if any)
  external: {
    // Google Analytics
    googleAnalytics: {
      enabled: false,
      trackingId: ''
    },
    
    // Error tracking (e.g., Sentry)
    errorTracking: {
      enabled: false,
      dsn: ''
    },
    
    // File storage
    fileStorage: {
      maxFileSize: 10 * 1024 * 1024, // 10MB
      allowedTypes: ['image/jpeg', 'image/png', 'application/pdf', 'text/csv'],
      uploadUrl: 'files/upload'
    }
  },
  
  // Development specific settings
  dev: {
    enableLogger: true,
    enableDebugMode: true,
    mockApiDelay: 1000,
    enableMockData: false
  }

};

