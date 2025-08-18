import { apiClient, ApiResponse } from './api';

// Types
export interface Service {
  id: string;
  name: string;
  description?: string;
  price: string; // Price comes as string from decimal field
  duration: number; // in minutes
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateServiceData {
  name: string;
  description?: string;
  price: number;
  duration: number;
}

export interface UpdateServiceData {
  name?: string;
  description?: string;
  price?: number;
  duration?: number;
  isActive?: boolean;
}

// Cache for services
let servicesCache: Service[] | null = null;
let servicesCacheTime: number = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Services Service
export class ServicesService {
  // Get all services with caching
  static async getAllServices(): Promise<ApiResponse<Service[]>> {
    try {
      // Check cache first
      const now = Date.now();
      if (servicesCache && (now - servicesCacheTime) < CACHE_DURATION) {
        return {
          success: true,
          data: servicesCache,
        };
      }

      const response = await apiClient.get<Service[]>('/services', true, true); // Use caching

      if (response.success && response.data) {
        // Update cache
        servicesCache = response.data;
        servicesCacheTime = now;
      }

      return response;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch services',
      };
    }
  }

  // Get active services only
  static async getActiveServices(): Promise<ApiResponse<Service[]>> {
    try {
      const response = await this.getAllServices();
      
      if (response.success && response.data) {
        const activeServices = response.data.filter(service => service.isActive);
        return {
          success: true,
          data: activeServices,
        };
      }
      
      return response;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch active services',
      };
    }
  }

  // Get service by ID
  static async getServiceById(id: string): Promise<ApiResponse<Service>> {
    try {
      return await apiClient.get<Service>(`/services/${id}`, true);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch service',
      };
    }
  }

  // Create new service
  static async createService(data: CreateServiceData): Promise<ApiResponse<Service>> {
    try {
      const response = await apiClient.post<Service>('/services', data);
      
      // Clear cache on successful creation
      if (response.success) {
        servicesCache = null;
        servicesCacheTime = 0;
      }
      
      return response;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create service',
      };
    }
  }

  // Update service
  static async updateService(id: string, data: UpdateServiceData): Promise<ApiResponse<Service>> {
    try {
      const response = await apiClient.put<Service>(`/services/${id}`, data);
      
      // Clear cache on successful update
      if (response.success) {
        servicesCache = null;
        servicesCacheTime = 0;
      }
      
      return response;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update service',
      };
    }
  }

  // Delete service
  static async deleteService(id: string): Promise<ApiResponse<void>> {
    try {
      const response = await apiClient.delete<void>(`/services/${id}`);
      
      // Clear cache on successful deletion
      if (response.success) {
        servicesCache = null;
        servicesCacheTime = 0;
      }
      
      return response;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete service',
      };
    }
  }

  // Clear services cache (useful for testing or manual refresh)
  static clearCache() {
    servicesCache = null;
    servicesCacheTime = 0;
  }
} 