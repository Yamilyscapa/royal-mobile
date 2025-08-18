import { apiClient, ApiResponse } from './api';

// Types
export interface User {
  id: string;
  email: string;
  name: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  isAdmin?: boolean;
  role?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone: string;
  role: 'customer' | 'staff' | 'admin';
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

// Authentication Service
export class AuthService {
  // User registration
  static async register(data: RegisterData): Promise<ApiResponse<AuthResponse>> {
    try {
      const response = await apiClient.post<AuthResponse>('/auth/signup', data, false);
      
      if (response.success && response.data) {
        // Store tokens
        await apiClient.setTokens(response.data.accessToken, response.data.refreshToken);
      }
      
      return response;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Registration failed',
      };
    }
  }

  // User login
  static async login(credentials: LoginCredentials): Promise<ApiResponse<AuthResponse>> {
    try {
      const response = await apiClient.post<AuthResponse>('/auth/signin', credentials, false);
      
      if (response.success && response.data) {
        // Store tokens
        await apiClient.setTokens(response.data.accessToken, response.data.refreshToken);
      }
      
      return response;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Login failed',
      };
    }
  }

  // User logout
  static async logout(): Promise<ApiResponse<void>> {
    try {
      const response = await apiClient.post<void>('/auth/logout', {});
      
      // Clear tokens regardless of response
      await apiClient.clearTokens();
      
      return response;
    } catch (error) {
      // Clear tokens even if logout fails
      await apiClient.clearTokens();
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Logout failed',
      };
    }
  }

  // Refresh tokens
  static async refreshTokens(): Promise<ApiResponse<AuthResponse>> {
    try {
      const response = await apiClient.post<AuthResponse>('/auth/refresh', {}, false);
      
      if (response.success && response.data) {
        await apiClient.setTokens(response.data.accessToken, response.data.refreshToken);
      }
      
      return response;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Token refresh failed',
      };
    }
  }

  // Delete account
  static async deleteAccount(): Promise<ApiResponse<void>> {
    try {
      const response = await apiClient.delete<void>('/auth/delete-account');
      
      if (response.success) {
        await apiClient.clearTokens();
      }
      
      return response;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Account deletion failed',
      };
    }
  }

  // Get current user profile
  static async getCurrentUser(): Promise<ApiResponse<User>> {
    try {
      const response = await apiClient.get<User>('/users/profile');
      return response;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get user profile',
      };
    }
  }

  // Update user profile
  static async updateProfile(data: Partial<User>): Promise<ApiResponse<User>> {
    try {
      return await apiClient.put<User>('/users/profile', data);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update profile',
      };
    }
  }

  // Check if user is authenticated
  static async isAuthenticated(): Promise<boolean> {
    try {
      const response = await this.getCurrentUser();
      return response.success;
    } catch (error) {
      return false;
    }
  }
} 