import { Platform } from 'react-native';

// Get the correct localhost URL for Android
const getDevBaseURL = () => {
  if (Platform.OS === 'android') {
    // For physical Android device, uncomment and use your machine's IP address:
    // return 'http://192.168.1.XXX:3001'; // Replace XXX with your machine's IP
    
    // For Android emulator, use 10.0.2.2 (maps to host machine's localhost)
    return process.env.EXPO_PUBLIC_DEV_API_URL || 'http://10.0.2.2:3001';
  }
  // For iOS simulator and web
  return 'http://localhost:3001';
};

// API Configuration
export const API_CONFIG = {
  // Development - reads from .env or falls back to staging
  development: {
    baseURL: process.env.EXPO_PUBLIC_API_URL || 'https://api-staging-d8aa.up.railway.app',
  },
  
  // Production - reads from .env or falls back to production domain
  production: {
    baseURL: process.env.EXPO_PUBLIC_API_URL || 'https://api.theroyalbarber.com',
  },
  
  // Get current environment
  get current() {
    return __DEV__ ? this.development : this.production;
  },
  
  // Get base URL for current environment
  get baseURL() {
    return this.current.baseURL;
  },
};

// API Endpoints
export const API_ENDPOINTS = {
  // Authentication
  auth: {
    signup: '/auth/signup',
    signin: '/auth/signin',
    refresh: '/auth/refresh',
    logout: '/auth/logout',
    deleteAccount: '/auth/delete-account',
  },
  
  // Users
  users: {
    profile: '/users/profile',
    updateProfile: '/users/profile',
  },
  
  // Appointments
  appointments: {
    create: '/appointments',
    getUserAppointments: '/appointments/user/me',
    getById: (id: string) => `/appointments/${id}`,
    update: (id: string) => `/appointments/${id}`,
    cancel: (id: string) => `/appointments/${id}/status`,
    reschedule: (id: string) => `/appointments/${id}/reschedule`,
    delete: (id: string) => `/appointments/${id}`,
    // Admin endpoints
    getByStatus: (status: string) => `/appointments/${status}`,
    updateStatus: (id: string) => `/appointments/${id}/status`,
  },
  
  // Services
  services: {
    getAll: '/services',
    getById: (id: string) => `/services/${id}`,
    create: '/services',
    update: (id: string) => `/services/${id}`,
    delete: (id: string) => `/services/${id}`,
  },
  
  // Schedules
  schedules: {
    getAvailability: '/schedules/availability',
    getBarberSchedules: (barberId: string) => `/schedules/barber/${barberId}`,
    getAll: '/schedules',
    setSchedule: '/schedules/set-schedule',
    update: (id: string) => `/schedules/${id}`,
    delete: (id: string) => `/schedules/${id}`,
  },
  
  // Payments
  payments: {
    create: '/payments',
    getById: (id: string) => `/payments/${id}`,
    getUserPayments: '/payments/user/me',
    getByAppointment: (appointmentId: string) => `/payments/appointment/${appointmentId}`,
    createIntent: '/payments/create-intent',
    confirm: (id: string) => `/payments/${id}/confirm`,
    cancel: (id: string) => `/payments/${id}/cancel`,
    refund: (id: string) => `/payments/${id}/refund`,
    stats: '/payments/stats',
  },
};

// API Headers
export const API_HEADERS = {
  'Content-Type': 'application/json',
  'Accept': 'application/json',
};

// API Timeouts
export const API_TIMEOUTS = {
  request: 3000, // 3 seconds (reduced from 5)
  upload: 15000, // 15 seconds (reduced from 30)
  staffRequest: 2000, // 2 seconds for staff requests (faster)
};

// API Retry Configuration
export const API_RETRY_CONFIG = {
  maxRetries: 1, // Reduced from 2
  retryDelay: 300, // 0.3 seconds (reduced from 0.5)
  retryOnStatusCodes: [408, 429, 500, 502, 503, 504],
}; 