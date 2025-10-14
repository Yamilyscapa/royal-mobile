import { apiClient, ApiResponse } from './api';
import { Appointment, Service } from './index';

// Admin-specific types
export interface AdminAppointment extends Appointment {
  customerName?: string;
  customerLastName?: string;
  barberName?: string;
  barberLastName?: string;
  serviceName?: string;
  servicePrice?: number;
}

export interface AdminStats {
  totalAppointments: number;
  pendingAppointments: number;
  confirmedAppointments: number;
  completedAppointments: number;
  cancelledAppointments: number;
  totalRevenue: number;
  monthlyRevenue: number;
}

export interface AdminUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: 'customer' | 'staff';
  isAdmin: boolean;
  createdAt: string;
  updatedAt: string;
}

// Admin Service Class
export class AdminService {
  // Appointments Management
  static async getAllAppointments(): Promise<ApiResponse<AdminAppointment[]>> {
    try {
      // Use the working /appointments/all endpoint
      const response = await apiClient.get<AdminAppointment[]>('/appointments/all');
      
      if (response.success && response.data) {
        return {
          success: true,
          data: response.data
        };
      }
      
      return {
        success: false,
        error: response.error || 'Failed to fetch appointments',
        data: []
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch appointments',
      };
    }
  }

  static async getAppointmentsByStatus(status: string): Promise<ApiResponse<AdminAppointment[]>> {
    try {
      console.log(`AdminService: Fetching appointments with status: ${status}`);
      
      // Get all appointments and filter by status on the frontend
      const allAppointmentsResponse = await this.getAllAppointments();
      
      if (!allAppointmentsResponse.success || !allAppointmentsResponse.data) {
        return {
          success: false,
          error: allAppointmentsResponse.error || 'Failed to fetch appointments',
          data: []
        };
      }
      
      // Filter appointments by status
      const filteredAppointments = allAppointmentsResponse.data.filter(appointment => 
        appointment.status === status
      );
      
      console.log(`AdminService: Filtered ${filteredAppointments.length} appointments with status ${status}`);
      
      return {
        success: true,
        data: filteredAppointments
      };
    } catch (error) {
      console.error(`AdminService: Error fetching appointments by status ${status}:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch appointments by status',
      };
    }
  }

  static async updateAppointmentStatus(id: string, status: string): Promise<ApiResponse<AdminAppointment>> {
    try {
      return await apiClient.put<AdminAppointment>(`/appointments/${id}/status`, { status });
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update appointment status',
      };
    }
  }

  static async deleteAppointment(id: string): Promise<ApiResponse<void>> {
    try {
      return await apiClient.delete<void>(`/appointments/${id}`);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete appointment',
      };
    }
  }

  // Services Management
  static async createService(serviceData: {
    name: string;
    description: string;
    price: number;
    duration: number;
    category?: string;
    isActive?: boolean;
  }): Promise<ApiResponse<Service>> {
    try {
      return await apiClient.post<Service>('/services', serviceData);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create service',
      };
    }
  }

  static async updateService(id: string, serviceData: {
    name?: string;
    description?: string;
    price?: number;
    duration?: number;
    category?: string;
    isActive?: boolean;
  }): Promise<ApiResponse<Service>> {
    try {
      return await apiClient.put<Service>(`/services/${id}`, serviceData);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update service',
      };
    }
  }

  static async deleteService(id: string): Promise<ApiResponse<void>> {
    try {
      return await apiClient.delete<void>(`/services/${id}`);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete service',
      };
    }
  }

  // Schedules Management
  static async getAllSchedules(): Promise<ApiResponse<any[]>> {
    try {
      return await apiClient.get<any[]>('/schedules');
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch schedules',
      };
    }
  }

  static async setSchedule(scheduleData: {
    barberId: string;
    dayOfWeek: string;
    availableTimeSlots: string[];
  }): Promise<ApiResponse<any>> {
    try {
      return await apiClient.post<any>('/schedules/set-schedule', scheduleData);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to set schedule',
      };
    }
  }

  static async updateSchedule(id: string, scheduleData: any): Promise<ApiResponse<any>> {
    try {
      return await apiClient.put<any>(`/schedules/${id}`, scheduleData);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update schedule',
      };
    }
  }

  static async deleteSchedule(id: string): Promise<ApiResponse<void>> {
    try {
      return await apiClient.delete<void>(`/schedules/${id}`);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete schedule',
      };
    }
  }

  // Users Management
  static async getAllUsers(role?: 'customer' | 'staff'): Promise<ApiResponse<AdminUser[]>> {
    try {
      const endpoint = role ? `/users/all?role=${role}` : '/users/all';
      return await apiClient.get<AdminUser[]>(endpoint);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch users',
      };
    }
  }

  static async createUser(userData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone?: string;
    role: 'customer' | 'staff' | 'admin';
  }): Promise<ApiResponse<AdminUser>> {
    try {
      return await apiClient.post<AdminUser>('/users/new', userData);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create user',
      };
    }
  }

  static async updateUser(id: string, userData: {
    email?: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
    role?: 'customer' | 'staff';
    isAdmin?: boolean;
  }): Promise<ApiResponse<AdminUser>> {
    try {
      return await apiClient.put<AdminUser>(`/users/${id}`, userData);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update user',
      };
    }
  }

  static async deleteUser(id: string): Promise<ApiResponse<void>> {
    try {
      return await apiClient.delete<void>(`/users/${id}`);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete user',
      };
    }
  }

  // Statistics
  static async getStats(): Promise<ApiResponse<AdminStats>> {
    try {
      // This would be a custom endpoint for admin statistics
      // For now, we'll calculate from appointments
      const appointmentsResponse = await this.getAllAppointments();
      
      if (!appointmentsResponse.success || !appointmentsResponse.data) {
        return {
          success: false,
          error: 'Failed to fetch appointments for stats',
        };
      }

      const appointments = appointmentsResponse.data;
      const stats: AdminStats = {
        totalAppointments: appointments.length,
        pendingAppointments: appointments.filter(a => a.status === 'pending').length,
        confirmedAppointments: appointments.filter(a => a.status === 'confirmed').length,
        completedAppointments: appointments.filter(a => a.status === 'completed').length,
        cancelledAppointments: appointments.filter(a => a.status === 'cancelled').length,
        totalRevenue: appointments
          .filter(a => a.status === 'completed')
          .reduce((sum, a) => sum + (a.servicePrice || 0), 0),
        monthlyRevenue: appointments
          .filter(a => {
            const appointmentDate = new Date(a.appointmentDate);
            const currentMonth = new Date().getMonth();
            const currentYear = new Date().getFullYear();
            return a.status === 'completed' && 
                   appointmentDate.getMonth() === currentMonth && 
                   appointmentDate.getFullYear() === currentYear;
          })
          .reduce((sum, a) => sum + (a.servicePrice || 0), 0),
      };

      return {
        success: true,
        data: stats,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to calculate stats',
      };
    }
  }
} 