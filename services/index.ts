// Export API client and types
export { apiClient, ApiResponse, AuthTokens } from './api';

// Export authentication service
export { AuthService } from './auth.service';
export type { User, LoginCredentials, RegisterData, AuthResponse } from './auth.service';

// Export appointments service
export { AppointmentsService } from './appointments.service';
export type { 
  Appointment, 
  CreateAppointmentData, 
  UpdateAppointmentData, 
  AppointmentFilters 
} from './appointments.service';

// Export services service
export { ServicesService } from './services.service';
export type { 
  Service, 
  CreateServiceData, 
  UpdateServiceData 
} from './services.service';

// Export schedules service
export { SchedulesService } from './schedules.service';
export type { 
  TimeSlot, 
  BarberSchedule, 
  AvailabilityResponse, 
  SetScheduleData 
} from './schedules.service';

// Export payments service
export { PaymentsService } from './payments.service';
export type { 
  Payment, 
  CreatePaymentData, 
  PaymentIntent, 
  PaymentFilters,
  CheckoutSessionData,
  CheckoutResponse
} from './payments.service';

// Export admin service
export { AdminService } from './admin.service';
export type { 
  AdminAppointment, 
  AdminStats, 
  AdminUser 
} from './admin.service'; 