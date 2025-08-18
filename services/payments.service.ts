import { apiClient, ApiResponse } from './api';

// Types
export interface Payment {
  id: string;
  appointmentId: string;
  userId: string;
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  paymentMethod: string;
  stripePaymentIntentId?: string;
  createdAt: string;
  updatedAt: string;
  appointment?: {
    id: string;
    appointmentDate: string;
    timeSlot: string;
    service?: {
      name: string;
      price: number;
    };
  };
}

export interface CreatePaymentData {
  appointmentId: string;
  amount: number;
  currency?: string;
  paymentMethod: string;
}

export interface PaymentIntent {
  id: string;
  clientSecret: string;
  amount: number;
  currency: string;
  status: string;
}

export interface PaymentFilters {
  status?: string;
  startDate?: string;
  endDate?: string;
  appointmentId?: string;
}

export interface CheckoutSessionData {
  serviceId: string;
  paymentType: 'full' | 'advance';
  successUrl: string;
  cancelUrl: string;
  userId?: string;
  appointmentData?: {
    barberId: string;
    appointmentDate: string;
    timeSlot: string;
    notes?: string;
  };
}

export interface CheckoutResponse {
  url: string;
  sessionId?: string;
}

export interface StripeSessionStatusResponse {
  sessionId: string;
  status: string; // 'open' | 'complete' | 'expired'
  paymentStatus: string; // 'unpaid' | 'paid' | 'no_payment_required'
  metadata?: Record<string, string>;
  amountTotal?: number | null;
  currency?: string | null;
}

// Payments Service
export class PaymentsService {
  // Create a new payment
  static async createPayment(data: CreatePaymentData): Promise<ApiResponse<Payment>> {
    try {
      return await apiClient.post<Payment>('/payments', data);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create payment',
      };
    }
  }

  // Get payment by ID
  static async getPaymentById(id: string): Promise<ApiResponse<Payment>> {
    try {
      return await apiClient.get<Payment>(`/payments/${id}`);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch payment',
      };
    }
  }

  // Get user's payment history
  static async getUserPayments(filters?: PaymentFilters): Promise<ApiResponse<Payment[]>> {
    try {
      let endpoint = '/payments/user/me';
      
      if (filters) {
        const params = new URLSearchParams();
        if (filters.status) params.append('status', filters.status);
        if (filters.startDate) params.append('startDate', filters.startDate);
        if (filters.endDate) params.append('endDate', filters.endDate);
        if (filters.appointmentId) params.append('appointmentId', filters.appointmentId);
        
        if (params.toString()) {
          endpoint += `?${params.toString()}`;
        }
      }
      
      return await apiClient.get<Payment[]>(endpoint);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch payment history',
      };
    }
  }

  // Get payment by appointment ID
  static async getPaymentByAppointmentId(appointmentId: string): Promise<ApiResponse<Payment>> {
    try {
      return await apiClient.get<Payment>(`/payments/appointment/${appointmentId}`);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch payment for appointment',
      };
    }
  }

  // Create payment intent for Stripe
  static async createPaymentIntent(amount: number, currency: string = 'usd'): Promise<ApiResponse<PaymentIntent>> {
    try {
      return await apiClient.post<PaymentIntent>('/payments/create-intent', {
        amount,
        currency,
      });
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create payment intent',
      };
    }
  }

  // Confirm payment
  static async confirmPayment(paymentId: string, paymentIntentId: string): Promise<ApiResponse<Payment>> {
    try {
      return await apiClient.post<Payment>(`/payments/${paymentId}/confirm`, {
        paymentIntentId,
      });
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to confirm payment',
      };
    }
  }

  // Cancel payment
  static async cancelPayment(paymentId: string): Promise<ApiResponse<Payment>> {
    try {
      return await apiClient.post<Payment>(`/payments/${paymentId}/cancel`, {});
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to cancel payment',
      };
    }
  }

  // Refund payment
  static async refundPayment(paymentId: string, amount?: number): Promise<ApiResponse<Payment>> {
    try {
      const data = amount ? { amount } : {};
      return await apiClient.post<Payment>(`/payments/${paymentId}/refund`, data);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to refund payment',
      };
    }
  }

  // Get payment statistics
  static async getPaymentStats(): Promise<ApiResponse<{
    totalPayments: number;
    totalAmount: number;
    completedPayments: number;
    pendingPayments: number;
    failedPayments: number;
  }>> {
    try {
      return await apiClient.get('/payments/stats');
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch payment statistics',
      };
    }
  }

  // Get completed payments
  static async getCompletedPayments(): Promise<ApiResponse<Payment[]>> {
    try {
      return await this.getUserPayments({ status: 'completed' });
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch completed payments',
      };
    }
  }

  // Get pending payments
  static async getPendingPayments(): Promise<ApiResponse<Payment[]>> {
    try {
      return await this.getUserPayments({ status: 'pending' });
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch pending payments',
      };
    }
  }

  // Helper method to format currency
  static formatCurrency(amount: number, currency: string = 'USD'): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amount / 100); // Assuming amount is in cents
  }

  // Helper method to get payment status color
  static getPaymentStatusColor(status: string): string {
    switch (status) {
      case 'completed':
        return '#4CAF50'; // Green
      case 'pending':
        return '#FF9800'; // Orange
      case 'failed':
        return '#F44336'; // Red
      case 'refunded':
        return '#2196F3'; // Blue
      default:
        return '#9E9E9E'; // Gray
    }
  }

  // Create Stripe checkout session for appointment booking
  static async createCheckoutSession(data: CheckoutSessionData): Promise<ApiResponse<CheckoutResponse>> {
    try {
      return await apiClient.post<CheckoutResponse>('/payments/checkout', data);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create checkout session',
      };
    }
  }

  // Verify Stripe Checkout session status by ID
  static async getCheckoutSessionStatus(sessionId: string): Promise<ApiResponse<StripeSessionStatusResponse>> {
    try {
      return await apiClient.get<StripeSessionStatusResponse>(`/payments/session/${sessionId}`);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to retrieve session status',
      };
    }
  }
} 