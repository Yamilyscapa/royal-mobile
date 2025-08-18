import { getItem, setItem, deleteItem } from '@/helpers/secureStore';
import { API_CONFIG, API_TIMEOUTS, API_RETRY_CONFIG } from '@/config/api';
import { performanceMonitor } from '@/helpers/performance';

// Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

// Request deduplication cache
const requestCache = new Map<string, Promise<any>>();

// API Client Class
class ApiClient {
  private baseURL: string;
  private accessToken: string | null = null;
  private refreshToken: string | null = null;
  private tokensInitialized = false;
  private initializationPromise: Promise<void> | null = null;

  constructor() {
    this.baseURL = API_CONFIG.baseURL;
  }

  // Initialize tokens from secure storage (with caching)
  async initialize() {
    // Prevent multiple simultaneous initializations
    if (this.initializationPromise) {
      return this.initializationPromise;
    }

    if (this.tokensInitialized) {
      return;
    }

    this.initializationPromise = this._initializeTokens();
    return this.initializationPromise;
  }

  private async _initializeTokens() {
    const timerId = performanceMonitor.startTimer('api_initialize');
    try {
      if (__DEV__) {
        console.log('API Client: Initializing...');
        console.log('API Client: Base URL:', this.baseURL);
      }
      
      this.accessToken = await getItem('accessToken');
      this.refreshToken = await getItem('refreshToken');
      
      if (__DEV__) {
        console.log('API Client initialized with tokens:', {
          hasAccessToken: !!this.accessToken,
          hasRefreshToken: !!this.refreshToken,
          accessTokenLength: this.accessToken?.length || 0
        });
      }
      
      // Test connectivity only in development
      if (__DEV__) {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 3000);
          
          const testResponse = await fetch(`${this.baseURL}/health`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
            signal: controller.signal
          });
          
          clearTimeout(timeoutId);
          console.log('API Client: Connectivity test result:', testResponse.status);
        } catch (error) {
          console.warn('API Client: Connectivity test failed:', error);
        }
      }
      
      this.tokensInitialized = true;
    } catch (error) {
      if (__DEV__) {
        console.error('Error initializing API client:', error);
      }
      throw error;
    } finally {
      performanceMonitor.endTimer(timerId);
      this.initializationPromise = null;
    }
  }

  // Set tokens
  async setTokens(accessToken: string, refreshToken: string) {
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;
    
    if (__DEV__) {
      console.log('Setting tokens:', {
        accessTokenSet: !!accessToken,
        refreshTokenSet: !!refreshToken,
        accessTokenLength: accessToken?.length || 0
      });
    }
    
    try {
      await setItem('accessToken', accessToken);
      await setItem('refreshToken', refreshToken);
      if (__DEV__) {
        console.log('Tokens stored successfully in secure storage');
      }
    } catch (error) {
      if (__DEV__) {
        console.error('Error storing tokens:', error);
      }
    }
  }

  // Clear tokens
  async clearTokens() {
    this.accessToken = null;
    this.refreshToken = null;
    this.tokensInitialized = false;
    
    try {
      await deleteItem('accessToken');
      await deleteItem('refreshToken');
    } catch (error) {
      if (__DEV__) {
        console.error('Error clearing tokens:', error);
      }
    }
  }

  // Get headers for requests (optimized - no storage calls)
  private getHeaders(includeAuth: boolean = true): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };

    if (includeAuth && this.accessToken) {
      headers['Authorization'] = `Bearer ${this.accessToken}`;
      if (__DEV__) {
        console.log('Including auth token in headers (length:', this.accessToken.length, ')');
      }
    } else if (includeAuth) {
      if (__DEV__) {
        console.log('Auth requested but no token available');
      }
    }

    return headers;
  }

  // Retry logic with exponential backoff
  private async retryRequest<T>(
    requestFn: () => Promise<ApiResponse<T>>,
    retryCount: number = 0
  ): Promise<ApiResponse<T>> {
    try {
      return await requestFn();
    } catch (error) {
      if (retryCount < API_RETRY_CONFIG.maxRetries) {
        const delay = API_RETRY_CONFIG.retryDelay * Math.pow(2, retryCount); // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.retryRequest(requestFn, retryCount + 1);
      }
      throw error;
    }
  }

  // Generate cache key for request deduplication
  private getCacheKey(endpoint: string, options: RequestInit = {}): string {
    const method = options.method || 'GET';
    const body = options.body ? JSON.stringify(options.body) : '';
    return `${method}:${endpoint}:${body}`;
  }

  // Make HTTP request with timeout and caching
  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {},
    includeAuth: boolean = true,
    useCache: boolean = false
  ): Promise<ApiResponse<T>> {
    const cacheKey = this.getCacheKey(endpoint, options);
    
    // Check if we have a pending request for this endpoint
    if (useCache && requestCache.has(cacheKey)) {
      if (__DEV__) {
        console.log('Using cached request for:', endpoint);
      }
      return requestCache.get(cacheKey)!;
    }

    const requestPromise = this._makeRequestInternal<T>(endpoint, options, includeAuth);
    
    if (useCache) {
      requestCache.set(cacheKey, requestPromise);
      // Clean up cache after request completes
      requestPromise.finally(() => {
        requestCache.delete(cacheKey);
      });
    }

    return requestPromise;
  }

  private async _makeRequestInternal<T>(
    endpoint: string,
    options: RequestInit = {},
    includeAuth: boolean = true
  ): Promise<ApiResponse<T>> {
    const timerId = performanceMonitor.startTimer(`api_request_${options.method || 'GET'}_${endpoint.split('/')[1] || 'unknown'}`);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUTS.request);

    try {
      const url = `${this.baseURL}${endpoint}`;
      
      // Only reload tokens if not already initialized
      if (includeAuth && !this.tokensInitialized) {
        await this.initialize();
      }
      
      const headers = this.getHeaders(includeAuth);

      const response = await fetch(url, {
        ...options,
        headers: {
          ...headers,
          ...options.headers,
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const data = await response.json();

      if (!response.ok) {
        // Handle token refresh if 401
        if (response.status === 401 && this.refreshToken && includeAuth) {
          const refreshResult = await this.refreshAccessToken();
          if (refreshResult.success) {
            // Retry the original request
            return this.makeRequest(endpoint, options, includeAuth);
          }
        }

        return {
          success: false,
          error: data.message || data.error || `HTTP ${response.status}`,
        };
      }

      return {
        success: true,
        data: data.data || data,
        message: data.message,
      };
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          return {
            success: false,
            error: 'Request timeout',
          };
        }
      }
      
      if (__DEV__) {
        console.error('API request error:', error);
      }
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
      };
    } finally {
      performanceMonitor.endTimer(timerId);
    }
  }

  // Refresh access token
  private async refreshAccessToken(): Promise<ApiResponse<AuthTokens>> {
    if (!this.refreshToken) {
      return { success: false, error: 'No refresh token available' };
    }

    const timerId = performanceMonitor.startTimer('api_token_refresh');
    try {
      const response = await fetch(`${this.baseURL}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken: this.refreshToken }),
      });

      const data = await response.json();

      if (!response.ok) {
        await this.clearTokens();
        return { success: false, error: data.message || 'Token refresh failed' };
      }

      const tokens = data.data || data;
      await this.setTokens(tokens.accessToken, tokens.refreshToken);

      return { success: true, data: tokens };
    } catch (error) {
      if (__DEV__) {
        console.error('Token refresh error:', error);
      }
      await this.clearTokens();
      return { success: false, error: 'Token refresh failed' };
    } finally {
      performanceMonitor.endTimer(timerId);
    }
  }

  // Public methods with caching support
  async get<T>(endpoint: string, includeAuth: boolean = true, useCache: boolean = false): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(endpoint, { method: 'GET' }, includeAuth, useCache);
  }

  async post<T>(endpoint: string, body: any, includeAuth: boolean = true): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(endpoint, { method: 'POST', body: JSON.stringify(body) }, includeAuth);
  }

  async put<T>(endpoint: string, body: any, includeAuth: boolean = true): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(endpoint, { method: 'PUT', body: JSON.stringify(body) }, includeAuth);
  }

  async delete<T>(endpoint: string, includeAuth: boolean = true): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(endpoint, { method: 'DELETE' }, includeAuth);
  }

  async patch<T>(endpoint: string, body: any, includeAuth: boolean = true): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(endpoint, { method: 'PATCH', body: JSON.stringify(body) }, includeAuth);
  }

  // Get performance summary
  getPerformanceSummary() {
    return performanceMonitor.getSummary();
  }
}

// Create and export a singleton instance
export const apiClient = new ApiClient(); 