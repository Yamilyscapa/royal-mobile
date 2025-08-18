import { apiClient, ApiResponse } from './api';

// Types
export interface Appointment {
  id: string;
  userId: string;
  barberId: string;
  serviceId: string;
  appointmentDate: string;
  timeSlot: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'no-show';
  rescheduleCount?: number;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    name: string;
    email: string;
  };
  barber?: {
    id: string;
    name: string;
    email: string;
  };
  service?: {
    id: string;
    name: string;
    price: number;
    duration: number;
  };
}

export interface CreateAppointmentData {
  userId: string;
  barberId: string;
  serviceId: string;
  appointmentDate: string;
  timeSlot: string;
}

export interface UpdateAppointmentData {
  barberId?: string;
  serviceId?: string;
  appointmentDate?: string;
  timeSlot?: string;
  status?: string;
}

export interface AppointmentFilters {
  status?: string;
  date?: string;
  barberId?: string;
}

// Appointments Service
export class AppointmentsService {
  // Create a new appointment
  static async createAppointment(data: CreateAppointmentData): Promise<ApiResponse<Appointment>> {
    try {
      // Convert date from yyyy-mm-dd to dd/mm/yyyy format for backend
      const [year, month, day] = data.appointmentDate.split('-');
      const formattedDate = `${day}/${month}/${year}`;
      
      const appointmentData = {
        ...data,
        appointmentDate: formattedDate
      };
      
      console.log('Sending appointment data to API:', appointmentData);
      
      const response = await apiClient.post<Appointment>('/appointments', appointmentData);
      
      if (!response.success) {
        // Handle specific error cases
        const errorMessage = response.error || 'Error al crear la cita';
        
        if (errorMessage.includes('no encontrado')) {
          return {
            success: false,
            error: 'Datos no encontrados. Por favor, verifica tu sesión e intenta nuevamente.',
          };
        } else if (errorMessage.includes('no está disponible')) {
          return {
            success: false,
            error: 'El horario seleccionado ya no está disponible. Por favor, selecciona otro horario.',
          };
        } else if (errorMessage.includes('Formato de fecha inválido')) {
          return {
            success: false,
            error: 'Formato de fecha incorrecto. Por favor, intenta nuevamente.',
          };
        } else if (errorMessage.includes('Campos requeridos faltantes')) {
          return {
            success: false,
            error: 'Faltan datos requeridos. Por favor, completa todos los campos.',
          };
        } else if (errorMessage.includes('Error interno del servidor')) {
          return {
            success: false,
            error: 'Error del servidor. Por favor, intenta más tarde.',
          };
        }
        
        return {
          success: false,
          error: errorMessage,
        };
      }
      
      return response;
    } catch (error) {
      console.error('Error creating appointment:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error al crear la cita. Por favor, intenta nuevamente.',
      };
    }
  }

  // Get user's appointments
  static async getUserAppointments(filters?: AppointmentFilters): Promise<ApiResponse<Appointment[]>> {
    try {
      let endpoint = '/appointments/user/me';
      
      if (filters) {
        const params = new URLSearchParams();
        if (filters.status) params.append('status', filters.status);
        if (filters.date) params.append('date', filters.date);
        if (filters.barberId) params.append('barberId', filters.barberId);
        
        if (params.toString()) {
          endpoint += `?${params.toString()}`;
        }
      }
      
      const response = await apiClient.get<Appointment[]>(endpoint);
      
      // Ensure response has proper structure
      if (response && typeof response === 'object') {
        return {
          success: response.success || false,
          data: Array.isArray(response.data) ? response.data : [],
          error: response.error,
          message: response.message
        };
      }
      
      return {
        success: false,
        error: 'Invalid response format',
        data: []
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch appointments',
        data: []
      };
    }
  }

  // Get appointment by ID
  static async getAppointmentById(id: string): Promise<ApiResponse<Appointment>> {
    try {
      return await apiClient.get<Appointment>(`/appointments/${id}`, true);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch appointment',
      };
    }
  }

  // Update appointment
  static async updateAppointment(id: string, data: UpdateAppointmentData): Promise<ApiResponse<Appointment>> {
    try {
      if (data.status) {
        // Use the status-specific endpoint
        return await apiClient.put<Appointment>(`/appointments/${id}/status`, { status: data.status });
      }
      // Fallback to generic update if needed
      return await apiClient.put<Appointment>(`/appointments/${id}`, data);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update appointment',
      };
    }
  }

  // Cancel appointment
  static async cancelAppointment(id: string): Promise<ApiResponse<Appointment>> {
    try {
      return await apiClient.put<Appointment>(`/appointments/${id}/status`, { status: 'cancelled' });
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to cancel appointment',
      };
    }
  }

  // Reschedule appointment
  static async rescheduleAppointment(id: string, newDate: string, newTimeSlot: string): Promise<ApiResponse<Appointment>> {
    try {
      return await apiClient.put<Appointment>(`/appointments/${id}/reschedule`, {
        appointmentDate: newDate,
        timeSlot: newTimeSlot,
      }, true);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to reschedule appointment',
      };
    }
  }

  // Delete appointment
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

  // Get upcoming appointments
  static async getUpcomingAppointments(): Promise<ApiResponse<Appointment[]>> {
    try {
      return await this.getUserAppointments({ status: 'confirmed' });
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch upcoming appointments',
      };
    }
  }

  // Get past appointments
  static async getPastAppointments(): Promise<ApiResponse<Appointment[]>> {
    try {
      return await this.getUserAppointments({ status: 'completed' });
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch past appointments',
      };
    }
  }

  // Get pending appointments
  static async getPendingAppointments(): Promise<ApiResponse<Appointment[]>> {
    try {
      return await this.getUserAppointments({ status: 'pending' });
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch pending appointments',
      };
    }
  }

  // Get all appointments (admin only)
  static async getAllAppointments(): Promise<ApiResponse<Appointment[]>> {
    try {
      const response = await apiClient.get<Appointment[]>('/appointments/all');
      
      // Ensure response has proper structure
      if (response && typeof response === 'object') {
        return {
          success: response.success || false,
          data: Array.isArray(response.data) ? response.data : [],
          error: response.error,
          message: response.message
        };
      }
      
      return {
        success: false,
        error: 'Invalid response format',
        data: []
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch all appointments',
        data: []
      };
    }
  }

  // Get all appointments for a specific barber (staff)
  static async getBarberAppointments(barberId: string): Promise<ApiResponse<Appointment[]>> {
    try {
      const response = await apiClient.get<Appointment[]>(`/appointments/barber/${barberId}`);
      
      // Ensure response has proper structure
      if (response && typeof response === 'object') {
        return {
          success: response.success || false,
          data: Array.isArray(response.data) ? response.data : [],
          error: response.error,
          message: response.message
        };
      }
      
      return {
        success: false,
        error: 'Invalid response format',
        data: []
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch barber appointments',
        data: []
      };
    }
  }
} 