import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
  ActivityIndicator,
  Modal,
  TextInput,
  Pressable,
  Platform,
} from 'react-native';
import { Calendar, LocaleConfig } from 'react-native-calendars';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'react-native';
import { useAuth } from '../../components/auth/AuthContext';
import { ThemeText, Container } from '../../components/Themed';
import Button from '../../components/Button';
import Colors from '../../constants/Colors';
import { ServiceInterface, haircuts, spa } from '../../constants/services';
import { availableTimesData } from '../../constants/availability';
import AvailabilityEditor from '../../components/ui/AvailabilityEditor';
import ServiceEditor from '../../components/ui/ServiceEditor';
import { AppointmentsService, Appointment as ApiAppointment } from '../../services/appointments.service';
import { ServicesService, Service as ApiService } from '../../services/services.service';
import { SchedulesService, BarberSchedule } from '../../services/schedules.service';
import { AdminService, AdminUser } from '../../services/admin.service';
import { apiClient } from '@/services';
import AppointmentDatePicker from '@/components/ui/AppointmentDatePicker';
import {
  formatAppointmentDateDisplay,
  formatAppointmentTime,
  formatDateForBackend,
  parseAppointmentDate,
  parseAppointmentDateTime,
} from '@/helpers/date';

// Configure Spanish locale for Calendar
LocaleConfig.locales['es'] = {
  monthNames: [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ],
  monthNamesShort: [
    'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
    'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'
  ],
  dayNames: [
    'Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'
  ],
  dayNamesShort: [
    'Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'
  ],
  today: 'Hoy'
};
LocaleConfig.defaultLocale = 'es';

interface DaySchedule {
  day: string;
  isOpen: boolean;
  timeSlots: { id: string; time: string }[];
}

const AdminPanel = () => {
  const { user, isLoading, signOut } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'appointments' | 'services' | 'availability' | 'users'>('appointments');
  const [refreshing, setRefreshing] = useState(false);
  const [appointments, setAppointments] = useState<ApiAppointment[]>([]);
  
  // Safe setter for appointments that ensures it's always an array
  const setAppointmentsSafe = (appointmentsData: ApiAppointment[] | null | undefined) => {
    if (Array.isArray(appointmentsData)) {
      setAppointments(appointmentsData);
    } else {
      console.log('setAppointmentsSafe: Invalid data provided, setting empty array');
      setAppointments([]);
    }
  };

  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [services, setServices] = useState<ApiService[]>([]);
  const [schedules, setSchedules] = useState<BarberSchedule[]>([]);
  const [showAvailabilityEditor, setShowAvailabilityEditor] = useState(false);
  const [showServiceEditor, setShowServiceEditor] = useState(false);
  const [editingDay, setEditingDay] = useState('');
  const [editingService, setEditingService] = useState<ApiService | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newAppointment, setNewAppointment] = useState({
    userId: '',
    barberId: '',
    serviceId: '',
    appointmentDate: '',
    timeSlot: '',
  });
  const [creating, setCreating] = useState(false);
  const [staffList, setStaffList] = useState<AdminUser[]>([]);
  const [serviceList, setServiceList] = useState<ApiService[]>([]);
  const [selectedService, setSelectedService] = useState<ApiService | null>(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [barberNames, setBarberNames] = useState<{ [id: string]: string }>({});
  const [isLoadingAppointments, setIsLoadingAppointments] = useState(false);
  const [appointmentsLoaded, setAppointmentsLoaded] = useState(0);
  const [totalAppointments, setTotalAppointments] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('');
  const [barberFilter, setBarberFilter] = useState<string>('');
  const [filteredAppointments, setFilteredAppointments] = useState<ApiAppointment[]>([]);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [userSearchEmail, setUserSearchEmail] = useState<string>('');
  const [searchedUser, setSearchedUser] = useState<any>(null);
  const [isSearchingUser, setIsSearchingUser] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [viewMode, setViewMode] = useState<'proximas' | 'este-mes' | 'historial'>('proximas');
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const hasAdminView = Boolean(user?.isAdmin || user?.role === 'staff');
  const isStaffOnlyView = Boolean(!user?.isAdmin && user?.role === 'staff');
  
  const filterAppointmentsForViewer = (appointmentsList: ApiAppointment[]) => {
    if (isStaffOnlyView && user?.id) {
      return appointmentsList.filter(apt => apt.barberId === user.id);
    }
    return appointmentsList;
  };

  // Optimized appointment loading function
  const loadAppointments = async () => {
    if (!hasAdminView) return;
    
    setIsLoadingAppointments(true);
    setAppointmentsLoaded(0);
    setTotalAppointments(0);
    
    try {
      // Always fetch all appointments and filter in memory
      const res = await AdminService.getAllAppointments();

      if (res && res.success && res.data && Array.isArray(res.data)) {
        const viewerFilteredAppointments = filterAppointmentsForViewer(res.data);
        
        setAppointmentsSafe(viewerFilteredAppointments);
        setTotalAppointments(viewerFilteredAppointments.length);
        setAppointmentsLoaded(viewerFilteredAppointments.length);
        
        console.log(`Loaded ${viewerFilteredAppointments.length} appointments`);
      } else {
        setAppointmentsSafe([]);
        setTotalAppointments(0);
        console.log('Failed to load appointments:', res?.error);
      }
    } catch (error) {
      console.error('Error loading appointments:', error);
      setAppointmentsSafe([]);
      setTotalAppointments(0);
    } finally {
      setIsLoadingAppointments(false);
    }
  };
  const [isUpdatingUserRole, setIsUpdatingUserRole] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  // Arrays de días para la API y la UI
  // Backend uses: ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const dayLabels = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

  // Set mounted state
  useEffect(() => {
    setIsMounted(true);
    return () => setIsMounted(false);
  }, []);

  // Fetch appointments, services, and schedules from API
  useEffect(() => {
    if (!isLoading && user && isMounted) {
      fetchAllData();
    }
  }, [user, isLoading, activeTab, isMounted]);

  // Force refresh when tab changes
  useEffect(() => {
    if (user && !isLoading) {
      fetchAllData();
    }
  }, [activeTab]);

  useEffect(() => {
    if (showCreateModal) {
      apiClient.get('/users/staff').then((res: any) => {
        if (res.success && res.data && Array.isArray(res.data)) {
          setStaffList(res.data);
        } else {
          setStaffList([]);
        }
      });
      // Fetch active services
      ServicesService.getActiveServices().then(res => {
        if (res.success && res.data) setServiceList(res.data);
        else setServiceList([]);
      });
    }
  }, [showCreateModal]);

  useEffect(() => {
    const fetchMissingBarberNames = async () => {
      // Ensure schedules is an array before filtering
      if (!schedules || !Array.isArray(schedules)) {
        return;
      }

      const missingIds = schedules
        .filter(s => !s.barber?.name && !barberNames[s.barberId])
        .map(s => s.barberId);
      const uniqueIds = [...new Set(missingIds)];
      for (const id of uniqueIds) {
        try {
          const res = await apiClient.get(`/users/${id}`);
          if (res.success && res.data) {
            const user = res.data as any;
            let fullName = '';
            if (user.name) {
              fullName = user.name;
            } else if (user.firstName && user.lastName) {
              fullName = `${user.firstName} ${user.lastName}`;
            } else {
              fullName = user.firstName || user.lastName || '';
            }
            setBarberNames(prev => ({ ...prev, [id]: fullName }));
          }
        } catch (e) {
          // Optionally handle error
        }
      }
    };
    if (schedules.length > 0) {
      fetchMissingBarberNames();
    }
  }, [schedules]);

  const getAppointmentTimestamp = (apt: ApiAppointment) => {
    const dateTime = parseAppointmentDateTime(apt.appointmentDate, apt.timeSlot || '00:00');
    return dateTime ? dateTime.getTime() : 0;
  };

  const applyFilters = () => {
    // Only apply filters if component is mounted
    if (!isMounted) {
      console.log('applyFilters: Component not mounted, skipping');
      return;
    }
    
    // Ensure appointments is an array before filtering
    if (!appointments || !Array.isArray(appointments)) {
      console.log('applyFilters: appointments is not an array, setting empty filtered appointments');
      setFilteredAppointments([]);
      return;
    }

    let filtered = appointments;

    // Filter by View Mode
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    if (viewMode === 'proximas') {
      filtered = filtered.filter(apt => {
        const aptDate = parseAppointmentDate(apt.appointmentDate);
        if (!aptDate) return false;
        
        // Check if date is today or future
        const isUpcoming = aptDate >= todayStart;
        
        // Check if status is valid (not completed or cancelled)
        const isValidStatus = !['completed', 'cancelled', 'no-show'].includes(apt.status);
        
        return isUpcoming && isValidStatus;
      });
    } else if (viewMode === 'este-mes') {
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();
      
      filtered = filtered.filter(apt => {
        const aptDate = parseAppointmentDate(apt.appointmentDate);
        if (!aptDate) return false;
        
        return aptDate.getMonth() === currentMonth && aptDate.getFullYear() === currentYear;
      });
    } else if (viewMode === 'historial') {
      filtered = filtered.filter(apt => {
        const aptDate = parseAppointmentDate(apt.appointmentDate);
        if (!aptDate) return false;
        
        return aptDate.getMonth() === selectedMonth && aptDate.getFullYear() === selectedYear;
      });
    }

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(apt => apt.status === statusFilter);
    }

    // Filter by date (DD/MM/YYYY format)
    if (dateFilter) {
      const parsedFilterDate = parseAppointmentDate(dateFilter);
      filtered = filtered.filter(apt => {
        if (!parsedFilterDate) {
          return true;
        }

        const aptDate = parseAppointmentDate(apt.appointmentDate);
        if (!aptDate) {
          return true;
        }

        return aptDate.toDateString() === parsedFilterDate.toDateString();
      });
    }

    // Filter by barber (for admin/staff users)
    if (barberFilter && hasAdminView) {
      filtered = filtered.filter(apt => {
        const a = apt as any;
        const barberFullName = `${a.barberName || ''} ${a.barberLastName || ''}`.trim().toLowerCase();
        return barberFullName.includes(barberFilter.toLowerCase());
      });
    }

    const sortedFiltered = filtered
      .slice()
      .sort((a, b) => {
        const tsA = getAppointmentTimestamp(a);
        const tsB = getAppointmentTimestamp(b);
        return sortOrder === 'asc' ? tsA - tsB : tsB - tsA;
      });
    
    setFilteredAppointments(sortedFiltered);
  };

  // Apply filters whenever appointments or filter values change
  useEffect(() => {
    if (!isMounted) return;
    
    console.log('applyFilters useEffect triggered:', {
      appointmentsLength: appointments?.length || 0,
      isArray: Array.isArray(appointments),
      statusFilter,
      dateFilter,
      barberFilter,
      sortOrder,
      viewMode,
      selectedMonth,
      selectedYear
    });
    
    const timeoutId = setTimeout(() => {
      applyFilters();
    }, 100);
    
    return () => clearTimeout(timeoutId);
  }, [appointments, statusFilter, dateFilter, barberFilter, sortOrder, viewMode, selectedMonth, selectedYear, isMounted]);

  // Calculate counts for tabs
  const viewCounts = useMemo(() => {
    if (!appointments || !Array.isArray(appointments)) return { proximas: 0, esteMes: 0 };
    
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    let proximas = 0;
    let esteMes = 0;
    
    appointments.forEach(apt => {
      const aptDate = parseAppointmentDate(apt.appointmentDate);
      if (!aptDate) return;
      
      // Proximas logic
      const isUpcoming = aptDate >= todayStart;
      const isValidStatus = !['completed', 'cancelled', 'no-show'].includes(apt.status);
      if (isUpcoming && isValidStatus) proximas++;
      
      // Este Mes logic
      if (aptDate.getMonth() === currentMonth && aptDate.getFullYear() === currentYear) {
        esteMes++;
      }
    });
    
    return { proximas, esteMes };
  }, [appointments]);

  const searchUserByEmail = async () => {
    if (!userSearchEmail.trim()) {
      Alert.alert('Error', 'Por favor ingresa un email');
      return;
    }

    setIsSearchingUser(true);
    try {
      // Normalize email to lowercase and trim whitespace
      const normalizedEmail = userSearchEmail.trim().toLowerCase();
      const response = await apiClient.get(`/users/search?email=${encodeURIComponent(normalizedEmail)}`);
      
      if (response.success && response.data) {
        setSearchedUser(response.data);
      } else {
        setSearchedUser(null);
        Alert.alert('No encontrado', 'No se encontró un usuario con ese email');
      }
    } catch (error) {
      Alert.alert('Error', 'Error al buscar el usuario');
      setSearchedUser(null);
    } finally {
      setIsSearchingUser(false);
    }
  };

  const updateUserRole = async (userId: string, newRole: 'customer' | 'staff' | 'admin') => {
    setIsUpdatingUserRole(true);
    try {
      const response = await apiClient.put(`/users/${userId}/role`, { role: newRole });
      
      if (response.success) {
        Alert.alert('Éxito', `Rol actualizado a ${newRole}`);
        setSearchedUser(response.data);
      } else {
        Alert.alert('Error', response.error || 'Error al actualizar el rol');
      }
    } catch (error) {
      Alert.alert('Error', 'Error al actualizar el rol del usuario');
    } finally {
      setIsUpdatingUserRole(false);
    }
  };

  const fetchAllData = async () => {
    if (!user) {
      return;
    }
    setRefreshing(true);
    
    // Appointments
    if (activeTab === 'appointments') {
      console.log('fetchAllData: Loading appointments for user:', hasAdminView ? 'admin_or_staff' : user.role);
      try {
        if (hasAdminView) {
          // Use optimized loading (loads all for client-side filtering)
          await loadAppointments();
        } else {
          // Regular users see only their own appointments
          const res = await AppointmentsService.getUserAppointments();
          console.log('Fetched user appointments:', res);
          if (res && res.success && res.data && Array.isArray(res.data)) {
            // Show all appointments
            setAppointmentsSafe(res.data);
          } else {
            console.log('No user appointments data');
            console.log('Response structure:', { success: res?.success, hasData: !!res?.data, isArray: Array.isArray(res?.data) });
            setAppointmentsSafe([]);
          }
        }
      } catch (error) {
        console.error('Error loading appointments:', error);
        setAppointmentsSafe([]);
        setTotalAppointments(0);
        setAppointmentsLoaded(0);
      } finally {
        setIsLoadingAppointments(false);
        console.log('Appointments loading completed');
      }
    }
    
    // Services
    if (activeTab === 'services') {
      console.log('fetchAllData: Loading services');
      const res = await ServicesService.getAllServices();
      if (res.success && res.data) setServices(res.data);
      else setServices([]);
    }
    
    // Schedules
    if (activeTab === 'availability') {
      console.log('fetchAllData: Loading schedules');
      if (user.isAdmin) {
        const res = await SchedulesService.getAllSchedules();
        if (res.success && res.data) setSchedules(res.data);
        else setSchedules([]);
      } else if (user.role === 'staff') {
        const res = await SchedulesService.getBarberSchedules(user.id);
        if (res.success && res.data) setSchedules(res.data);
        else setSchedules([]);
      }
    }
    
    setRefreshing(false);
    console.log('fetchAllData: Completed for tab:', activeTab);
  };

  const onRefresh = React.useCallback(() => {
    fetchAllData();
  }, [user, activeTab]);

  const handleSignOut = async () => {
    Alert.alert(
      'Cerrar Sesión',
      '¿Estás seguro de que quieres cerrar sesión?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Cerrar Sesión',
          style: 'destructive',
          onPress: async () => {
            await signOut();
            router.replace('/auth/login');
          },
        },
      ]
    );
  };

  const formatDate = (dateString: string) => formatAppointmentDateDisplay(dateString);

  const formatTime = (time: string) => formatAppointmentTime(time);

  const formatDateToDDMMYYYY = (dateInput: string) => formatDateForBackend(dateInput);

  const updateAppointmentStatus = async (id: string, status: ApiAppointment['status']) => {
    Alert.alert(
      'Confirmar cambio de estado',
      `¿Estás seguro de que quieres marcar la cita como "${status}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Sí, actualizar',
          style: 'destructive',
          onPress: async () => {
            try {
              setUpdatingId(id + status);
              const res = await AppointmentsService.updateAppointment(id, { status });
              console.log('Update response:', res);
              if (res.success) {
                Alert.alert('Éxito', `Estado actualizado a ${status}`);
                fetchAllData();
              } else {
                Alert.alert('Error', res.error || 'No se pudo actualizar el estado');
              }
            } catch (error) {
              Alert.alert('Error', 'No se pudo actualizar el estado');
            } finally {
              setUpdatingId(null);
            }
          },
        },
      ]
    );
  };

  const toggleServiceStatus = (id: string) => {
    setServices(prev =>
      prev.map(service =>
        service.id === id ? { ...service, isActive: !service.isActive } : service
      )
    );
  };

  const handleEditService = (service: ApiService) => {
    // Convert API service to UI format for editor
    setEditingService({
      ...service,
      description: service.description || '',
    } as any);
    setShowServiceEditor(true);
  };

  const handleSaveService = async (serviceData: any) => {
    // Convert UI format to API format
    const apiData = {
      ...serviceData,
      description: Array.isArray(serviceData.description) ? serviceData.description.join(' ') : serviceData.description,
      price: typeof serviceData.price === 'string' ? parseFloat(serviceData.price) : serviceData.price,
      duration: typeof serviceData.duration === 'string' ? parseInt(serviceData.duration) : serviceData.duration,
    };
    // Frontend validation
    if (!apiData.name || !apiData.price || !apiData.duration || apiData.price <= 0 || apiData.duration <= 0) {
      Alert.alert('Error', 'Todos los campos son obligatorios y deben ser válidos (nombre, precio, duración)');
      return;
    }
    let result;
    if (editingService && editingService.id) {
      // Update existing service
      result = await ServicesService.updateService(editingService.id, apiData);
    } else {
      // Create new service
      result = await ServicesService.createService(apiData);
    }
    if (!result?.success) {
      Alert.alert('Error', result?.error || 'No se pudo crear/actualizar el servicio');
      return;
    }
    setShowServiceEditor(false);
    setEditingService(null);
    fetchAllData();
    Alert.alert('Éxito', 'Servicio guardado correctamente');
  };

  const handleAddService = () => {
    setEditingService({
      name: '',
      price: 0,
      description: [],
      duration: 30,
      isActive: true,
      id: '',
      createdAt: '',
      updatedAt: '',
    } as any);
    setShowServiceEditor(true);
  };

  const handleDeleteService = async (id: string) => {
    await ServicesService.deleteService(id);
    fetchAllData();
  };

  const handleEditAvailability = (dayOfWeek: number, barberId?: string) => {
    // Calculate the next occurrence of this day
    const today = new Date();
    const targetDay = dayOfWeek; // 0 = Sunday, 1 = Monday, etc. (matches backend)
    const currentDay = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
    
    let daysUntilTarget = targetDay - currentDay;
    if (daysUntilTarget <= 0) {
      daysUntilTarget += 7; // Next week
    }
    
    const nextOccurrence = new Date(today);
    nextOccurrence.setDate(today.getDate() + daysUntilTarget);
    
    const formattedDate = nextOccurrence.toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    
    Alert.alert(
      'Configurar Horario',
      `¿Quieres configurar el horario para ${dayLabels[dayOfWeek]}?\n\nEste horario se aplicará a todos los ${dayLabels[dayOfWeek]}s, comenzando el ${formattedDate}.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Configurar',
          onPress: () => {
            setEditingDay(dayOfWeek.toString());
            setShowAvailabilityEditor(true);
          }
        }
      ]
    );
  };

  const handleSaveAvailability = async (uiSchedule: any) => {
    try {
      if (!user?.id) {
        Alert.alert('Error', 'No se pudo identificar el usuario');
        return;
      }
      // Convert UI time format to API format (HH:MM)
      const availableTimeSlots = uiSchedule.timeSlots.map((slot: any) => {
        const time = slot.time;
        const [timePart, period] = time.split(' ');
        const [hours, minutes] = timePart.split(':');
        let hour = parseInt(hours);
        if (period === 'PM' && hour !== 12) hour += 12;
        if (period === 'AM' && hour === 12) hour = 0;
        return `${hour.toString().padStart(2, '0')}:${minutes}`;
      });
      // Use the editingDay state to determine which day to save the schedule for
      const dayIndex = parseInt(editingDay, 10);
      const dayOfWeek = dayNames[dayIndex];
      // Validación antes de enviar a la API
      if (
        !user.id ||
        typeof dayOfWeek !== 'string' ||
        !dayNames.includes(dayOfWeek) ||
        !Array.isArray(availableTimeSlots)
      ) {
        Alert.alert('Error', 'Datos inválidos para crear el horario. Intenta de nuevo.');
        return;
      }
      
      // Si el día está cerrado, permitir horarios vacíos
      if (uiSchedule.isOpen && availableTimeSlots.length === 0) {
        Alert.alert('Error', 'Debe haber al menos un horario disponible cuando el día está abierto');
        return;
      }
      // Check if schedule already exists
      const schedule = schedules.find(s => 
        s.barberId === user.id && s.dayOfWeek === dayOfWeek
      );
      if (schedule) {
        // Update existing schedule
        const result = await SchedulesService.updateSchedule(schedule.id, {
          availableTimeSlots: availableTimeSlots
        });
        if (!result.success) {
          throw new Error(result.error || 'Error updating schedule');
        }
      } else {
        // Create new schedule
        const result = await SchedulesService.setBarberSchedule({
          barberId: user.id,
          dayOfWeek: dayOfWeek,
          availableTimeSlots: availableTimeSlots
        });
        if (!result.success) {
          throw new Error(result.error || 'Error creating schedule');
        }
      }
      // Calculate when this schedule will take effect
      const today = new Date();
      const targetDay = parseInt(editingDay);
      const currentDay = today.getDay();
      
      let daysUntilTarget = targetDay - currentDay;
      if (daysUntilTarget <= 0) {
        daysUntilTarget += 7; // Next week
      }
      
      const nextOccurrence = new Date(today);
      nextOccurrence.setDate(today.getDate() + daysUntilTarget);
      
      const formattedDate = nextOccurrence.toLocaleDateString('es-ES', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      
      const statusMessage = uiSchedule.isOpen 
        ? `Horarios actualizados correctamente para ${dayLabels[targetDay]}.\n\nEste horario se aplicará a todos los "${dayLabels[targetDay]}", comenzando el ${formattedDate}.`
        : `Día marcado como cerrado para ${dayLabels[targetDay]}.\n\nEste día estará cerrado a partir del ${formattedDate}.`;
      
      Alert.alert('Éxito', statusMessage);
      setShowAvailabilityEditor(false);
      fetchAllData();
    } catch (error) {
      console.error('Error saving availability:', error);
      Alert.alert('Error', 'No se pudieron guardar los horarios: ' + (error instanceof Error ? error.message : 'Error desconocido'));
    }
  };

  const getStatusColor = (status: ApiAppointment['status']) => {
    switch (status) {
      case 'confirmed':
        return Colors.dark.primary;
      case 'pending':
        return '#FFA500'; // orange
      case 'completed':
        return '#2ecc40'; // green
      case 'cancelled':
        return '#ff3b30'; // red
      default:
        return Colors.dark.text;
    }
  };

  const getStatusText = (status: ApiAppointment['status']) => {
    switch (status) {
      case 'pending': return 'Pendiente';
      case 'confirmed': return 'Confirmado';
      case 'completed': return 'Completado';
      case 'cancelled': return 'Cancelado';
      case 'no-show': return 'No Show';
      default: return status;
    }
  };

  const getRoleColor = (role: string, isAdmin?: boolean) => {
    if (isAdmin) return '#dc3545'; // Red for admin
    switch (role) {
      case 'staff': return '#ffc107'; // Yellow
      case 'customer': return '#28a745'; // Green
      default: return Colors.dark.primary;
    }
  };

  const getRoleText = (role: string, isAdmin?: boolean) => {
    if (isAdmin) return 'Administrador';
    switch (role) {
      case 'staff': return 'Barbero';
      case 'customer': return 'Cliente';
      default: return role;
    }
  };

  // Helper function to format payment amount correctly
  const formatPaymentAmount = (amount: string | number | null | undefined) => {
    if (!amount) return '0.00';
    
    // Convert to number and ensure it's treated as dollars, not cents
    const numericAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    
    // Debug logging
    console.log('Payment amount debug:', {
      original: amount,
      type: typeof amount,
      numeric: numericAmount,
      formatted: numericAmount.toFixed(2)
    });
    
    return numericAmount.toFixed(2);
  };

  const handleCreateAppointment = async () => {
    if (!newAppointment.userId) {
      Alert.alert('Error', 'Debes ingresar el ID del cliente.');
      return;
    }
    try {
      setCreating(true);
      const appointmentData = {
        ...newAppointment,
        appointmentDate: formatDateToDDMMYYYY(selectedDate),
        timeSlot: selectedTime,
      };
      await AppointmentsService.createAppointment(appointmentData);
      setShowCreateModal(false);
      setNewAppointment({ userId: '', barberId: '', serviceId: '', appointmentDate: '', timeSlot: '' });
      fetchAllData();
      Alert.alert('Éxito', 'Cita creada con estado pendiente');
    } catch (error) {
      Alert.alert('Error', 'Error al crear la cita.');
    } finally {
      setCreating(false);
    }
  };

  const renderAppointmentsTab = () => (
    <View style={{ flex: 1 }}>
      <ScrollView showsVerticalScrollIndicator={false} style={{ marginTop: 0 }}>
        <Container>
          <View style={styles.sectionHeader}>
            <ThemeText style={styles.sectionTitle}>Citas Programadas</ThemeText>
            <View style={styles.headerRight}>
              <TouchableOpacity 
                style={styles.filterToggleButton}
                onPress={() => setShowFilterModal(true)}
              >
                <ThemeText style={styles.filterToggleText}>
                  🔍 Filtros
                </ThemeText>
              </TouchableOpacity>
              <ThemeText style={styles.appointmentCount}>
                {isLoadingAppointments ? `${appointmentsLoaded}/${totalAppointments}` : filteredAppointments.length} citas
              </ThemeText>
            </View>
          </View>

          {/* View Mode Tabs */}
          <View style={styles.viewModeContainer}>
            <TouchableOpacity 
              style={[styles.viewModeTab, viewMode === 'proximas' && styles.viewModeTabActive]} 
              onPress={() => setViewMode('proximas')}
            >
              <ThemeText style={viewMode === 'proximas' ? [styles.viewModeText, styles.viewModeTextActive] as any : styles.viewModeText}>
                Próximas ({viewCounts.proximas})
              </ThemeText>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.viewModeTab, viewMode === 'este-mes' && styles.viewModeTabActive]} 
              onPress={() => setViewMode('este-mes')}
            >
              <ThemeText style={viewMode === 'este-mes' ? [styles.viewModeText, styles.viewModeTextActive] as any : styles.viewModeText}>
                Este Mes ({viewCounts.esteMes})
              </ThemeText>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.viewModeTab, viewMode === 'historial' && styles.viewModeTabActive]} 
              onPress={() => setViewMode('historial')}
            >
              <ThemeText style={viewMode === 'historial' ? [styles.viewModeText, styles.viewModeTextActive] as any : styles.viewModeText}>Historial</ThemeText>
            </TouchableOpacity>
          </View>

          {viewMode === 'historial' && (
            <View style={styles.monthPickerContainer}>
              <TouchableOpacity 
                style={styles.monthNavButton} 
                onPress={() => {
                  if (selectedMonth === 0) {
                    setSelectedMonth(11);
                    setSelectedYear(prev => prev - 1);
                  } else {
                    setSelectedMonth(prev => prev - 1);
                  }
                }}
              >
                <ThemeText style={styles.monthNavButtonText}>←</ThemeText>
              </TouchableOpacity>
              
              <ThemeText style={styles.monthYearTitle}>
                {LocaleConfig.locales['es'].monthNames[selectedMonth]} {selectedYear}
              </ThemeText>
              
              <TouchableOpacity 
                style={styles.monthNavButton}
                onPress={() => {
                  if (selectedMonth === 11) {
                    setSelectedMonth(0);
                    setSelectedYear(prev => prev + 1);
                  } else {
                    setSelectedMonth(prev => prev + 1);
                  }
                }}
              >
                <ThemeText style={styles.monthNavButtonText}>→</ThemeText>
              </TouchableOpacity>
            </View>
          )}

          {/* Active Filters Chips (Always visible if filters active) */}
          {(statusFilter !== 'all' || dateFilter || barberFilter || sortOrder !== 'asc') && (
            <View style={styles.activeFiltersContainer}>
              <ThemeText style={styles.activeFiltersLabel}>Filtros activos:</ThemeText>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.activeFiltersChips}>
                  {statusFilter !== 'all' && (
                    <TouchableOpacity onPress={() => setStatusFilter('all')} style={styles.activeFilterChip}>
                      <ThemeText style={styles.activeFilterChipText}>
                        Estado: {getStatusText(statusFilter as ApiAppointment['status'])} ✕
                      </ThemeText>
                    </TouchableOpacity>
                  )}
                  {dateFilter && (
                    <TouchableOpacity onPress={() => setDateFilter('')} style={styles.activeFilterChip}>
                      <ThemeText style={styles.activeFilterChipText}>Fecha: {dateFilter} ✕</ThemeText>
                    </TouchableOpacity>
                  )}
                  {barberFilter && (
                    <TouchableOpacity onPress={() => setBarberFilter('')} style={styles.activeFilterChip}>
                      <ThemeText style={styles.activeFilterChipText}>Barbero: {barberFilter} ✕</ThemeText>
                    </TouchableOpacity>
                  )}
                  {sortOrder !== 'asc' && (
                    <TouchableOpacity onPress={() => setSortOrder('asc')} style={styles.activeFilterChip}>
                      <ThemeText style={styles.activeFilterChipText}>Orden: Más lejanas ✕</ThemeText>
                    </TouchableOpacity>
                  )}
                </View>
              </ScrollView>
            </View>
          )}

          {isLoadingAppointments ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={Colors.dark.primary} />
              <ThemeText style={styles.loadingText}>Cargando citas...</ThemeText>
              {totalAppointments > 0 && (
                <ThemeText style={styles.progressText}>
                  {appointmentsLoaded} de {totalAppointments} citas cargadas
                </ThemeText>
              )}
            </View>
          ) : filteredAppointments.length === 0 ? (
            <View style={styles.emptyState}>
              <ThemeText style={styles.emptyStateText}>
                {viewMode === 'proximas' ? 'No hay citas próximas' :
                 viewMode === 'este-mes' ? 'No hay citas este mes' :
                 viewMode === 'historial' ? `No hay citas en ${LocaleConfig.locales['es'].monthNames[selectedMonth]} ${selectedYear}` :
                 'No hay citas programadas'}
              </ThemeText>
            </View>
          ) : (
            filteredAppointments.map((appointment) => {
              const a = appointment as any;
              return (
                <View key={appointment.id} style={styles.card}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                    <View style={styles.customerTitleContainer}>
                      <ThemeText style={styles.customerIcon}>👤</ThemeText>
                      <ThemeText style={styles.cardTitle}>
                        {a.customerName && a.customerLastName 
                          ? `${a.customerName} ${a.customerLastName}` 
                          : a.customerName || appointment.user?.name || appointment.userId}
                      </ThemeText>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(appointment.status) }]}> 
                      <ThemeText style={styles.statusText}>{getStatusText(appointment.status)}</ThemeText>
                    </View>
                  </View>
                  <ThemeText style={styles.cardPrice}>{a.serviceName || appointment.service?.name || appointment.serviceId}</ThemeText>
                  <ThemeText style={styles.cardDescription}>{formatDate(appointment.appointmentDate)} - {formatTime(appointment.timeSlot)}</ThemeText>
                  <ThemeText style={styles.cardDescription}>{a.customerPhone || (appointment.user as any)?.phone || a.customerEmail || appointment.user?.email || ''}</ThemeText>
                  
                  {/* Payment Information */}
                  {(a.paymentAmount || a.paymentType) && (
                    <View style={styles.paymentContainer}>
                      <ThemeText style={styles.paymentLabel}>💰 PAGO:</ThemeText>
                      <ThemeText style={styles.paymentAmount}>
                        {a.paymentAmount
                          ? `$${formatPaymentAmount(a.paymentAmount)}`
                          : 'Monto no disponible'}
                      </ThemeText>
                      {a.paymentType && (
                        <View style={[
                          styles.paymentTypeBadge,
                          { backgroundColor: a.paymentType === 'full' ? '#28a745' : '#ffc107' }
                        ]}>
                          <ThemeText style={styles.paymentTypeText}>
                            {a.paymentType === 'full' ? 'PAGO COMPLETO' : 'ANTICIPO'}
                          </ThemeText>
                        </View>
                      )}
                    </View>
                  )}
                  {hasAdminView && a.barberName && (
                    <View style={styles.barberContainer}>
                      <ThemeText style={styles.barberLabel}>👨‍💼 BARBERO:</ThemeText>
                      <ThemeText style={styles.barberName}>
                        {a.barberName} {a.barberLastName || ''}
                      </ThemeText>
                    </View>
                  )}
                  {user?.role === 'staff' && (
                    <View style={styles.customerContainer}>
                      <ThemeText style={styles.customerLabel}>👤 CLIENTE:</ThemeText>
                      <ThemeText style={styles.customerName}>
                        {a.customerName} {a.customerLastName || ''}
                      </ThemeText>
                    </View>
                  )}
                  <View style={styles.actionButtons}>
                    {appointment.status === 'pending' && (
                      <>
                        <TouchableOpacity
                          style={[styles.actionButton, styles.confirmButton]}
                          onPress={() => updateAppointmentStatus(appointment.id, 'confirmed')}
                          disabled={updatingId === appointment.id + 'confirmed'}
                        >
                          <ThemeText style={styles.actionButtonText}>
                            {updatingId === appointment.id + 'confirmed' ? 'Confirmando...' : 'Confirmar'}
                          </ThemeText>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.actionButton, styles.cancelButton]}
                          onPress={() => updateAppointmentStatus(appointment.id, 'cancelled')}
                          disabled={updatingId === appointment.id + 'cancelled'}
                        >
                          <ThemeText style={styles.actionButtonText}>
                            {updatingId === appointment.id + 'cancelled' ? 'Cancelando...' : 'Cancelar'}
                          </ThemeText>
                        </TouchableOpacity>
                      </>
                    )}
                    {appointment.status === 'confirmed' && (
                      <TouchableOpacity
                        style={[styles.actionButton, styles.completeButton]}
                        onPress={() => updateAppointmentStatus(appointment.id, 'completed')}
                        disabled={updatingId === appointment.id + 'completed'}
                      >
                        <ThemeText style={styles.actionButtonText}>
                          {updatingId === appointment.id + 'completed' ? 'Completando...' : 'Completar'}
                        </ThemeText>
                      </TouchableOpacity>
                    )}
                    {appointment.status === 'completed' && (
                      <View style={styles.completedStatusContainer}>
                        <ThemeText style={styles.completedStatusText}>
                          ✅ Cita completada exitosamente
                        </ThemeText>
                      </View>
                    )}
                    {appointment.status === 'cancelled' && (
                      <View style={styles.cancelledStatusContainer}>
                        <ThemeText style={styles.cancelledStatusText}>
                          ❌ Cita cancelada
                        </ThemeText>
                      </View>
                    )}
                  </View>
                </View>
              );
            })
          )}
        </Container>
      </ScrollView>
    </View>
  );

  const renderServicesTab = () => (
    <ScrollView showsVerticalScrollIndicator={false}>
      <Container>
        <View style={styles.sectionHeader}>
          <ThemeText style={styles.sectionTitle}>Servicios</ThemeText>
          <Button onPress={() => handleAddService()} style={styles.addButton}>+ Nuevo</Button>
        </View>
        {services.map((service) => (
          <View key={service.id} style={styles.card}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <ThemeText style={styles.cardTitle}>{service.name}</ThemeText>
              <View style={[styles.statusBadge, { backgroundColor: service.isActive ? Colors.dark.primary : Colors.dark.gray }]}>
                <ThemeText style={{ ...styles.statusText, color: Colors.dark.background }}>{service.isActive ? 'Activo' : 'Inactivo'}</ThemeText>
              </View>
            </View>
            <ThemeText style={styles.cardPrice}>${service.price}</ThemeText>
            {service.description && (
              <ThemeText style={styles.cardDescription}>{service.description}</ThemeText>
            )}
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
              <TouchableOpacity style={styles.editServiceButton} onPress={() => handleEditService(service)}>
                <ThemeText style={styles.editServiceButtonText}>✏️</ThemeText>
              </TouchableOpacity>
              <TouchableOpacity style={styles.deleteServiceButton} onPress={() => handleDeleteService(service.id)}>
                <ThemeText style={styles.deleteServiceButtonText}>🗑️</ThemeText>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </Container>
    </ScrollView>
  );

  const renderAvailabilityTab = () => {
    const getScheduleForDay = (dayOfWeek: number, barberId?: string) => {
      const targetBarberId = barberId || user?.id;
      const dayOfWeekString = dayNames[dayOfWeek];
      return schedules.find(s => 
        s.barberId === targetBarberId && s.dayOfWeek === dayOfWeekString
      );
    };

    const formatTimeSlots = (timeSlots: string[]) => {
      return timeSlots.map(time => {
        const [hours, minutes] = time.split(':');
        const hour = parseInt(hours);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const displayHour = hour % 12 || 12;
        return `${displayHour}:${minutes} ${ampm}`;
      });
    };

    const isSelectedDay = (index: number) => editingDay === index.toString();

    return (
      <ScrollView showsVerticalScrollIndicator={false}>
        <Container>
          {/* Personal Schedules Section */}
          <View style={styles.section}>
            <ThemeText style={styles.sectionTitle}>Mis Horarios</ThemeText>
            <ThemeText style={styles.availabilityNote}>
              Configura tus horarios disponibles para cada día de la semana
            </ThemeText>
            
            <View style={styles.daysColumnContainer}>
              <View style={styles.daysColumn}>
                {dayLabels.map((dayName, index) => {
                  const schedule = getScheduleForDay(index);
                  return (
                    <TouchableOpacity
                      key={index}
                      style={[
                        styles.dayCardColumn,
                        schedule ? styles.dayWithSchedule : styles.dayWithoutSchedule
                      ]}
                      onPress={() => handleEditAvailability(index)}
                    >
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                        <ThemeText style={styles.dayCardTitleColumn}>{dayName}</ThemeText>
                        {schedule && (
                          <View style={styles.scheduleIndicator}>
                            <ThemeText style={styles.scheduleCount}>
                              {schedule.availableTimeSlots.length === 0 ? 'Cerrado' : `${schedule.availableTimeSlots.length} horarios`}
                            </ThemeText>
                          </View>
                        )}
                      </View>
                      {schedule && schedule.availableTimeSlots.length > 0 && (
                        <View style={styles.chipsRow}>
                          {schedule.availableTimeSlots.slice(0, 3).map((time, idx) => (
                            <View key={idx} style={styles.chip}>
                              <ThemeText style={styles.chipText}>
                                {formatTimeSlots([time])[0]}
                              </ThemeText>
                            </View>
                          ))}
                          {schedule.availableTimeSlots.length > 3 && (
                            <View style={styles.chipMore}>
                              <ThemeText style={styles.chipMoreText}>
                                +{schedule.availableTimeSlots.length - 3}
                              </ThemeText>
                            </View>
                          )}
                        </View>
                      )}
                      {schedule && schedule.availableTimeSlots.length === 0 && (
                        <View style={styles.closedDayIndicator}>
                          <ThemeText style={styles.closedDayText}>
                            🔒 Día cerrado
                          </ThemeText>
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </View>

          {/* Staff Schedules Section (Admin only) */}
          {user?.isAdmin && staffList.length > 0 && (
            <View style={styles.section}>
              <ThemeText style={styles.sectionTitle}>Horarios del Staff</ThemeText>
              <ThemeText style={styles.availabilityNote}>
                Gestiona los horarios de todo el equipo
              </ThemeText>
              
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {staffList.map((staff) => (
                  <View key={staff.id} style={styles.staffCard}>
                    <ThemeText style={styles.staffName}>
                      {staff.firstName} {staff.lastName}
                    </ThemeText>
                    <View style={styles.staffDaysContainer}>
                      {dayLabels.map((dayName, index) => {
                        const schedule = getScheduleForDay(index, staff.id);
                        return (
                          <TouchableOpacity
                            key={index}
                            style={[
                              styles.staffDayButton,
                              schedule ? styles.dayWithSchedule : styles.dayWithoutSchedule
                            ]}
                            onPress={() => handleEditAvailability(index, staff.id)}
                          >
                            <ThemeText style={styles.staffDayButtonText}>
                              {dayName.slice(0, 3)}
                            </ThemeText>
                            {schedule && (
                              <ThemeText style={styles.scheduleCount}>
                                {schedule.availableTimeSlots.length === 0 ? '❌' : schedule.availableTimeSlots.length}
                              </ThemeText>
                            )}
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>
                ))}
              </ScrollView>
            </View>
          )}

          {/* Legacy schedules display for backward compatibility */}
          {schedules.length > 0 && (
            <View style={styles.section}>
              <ThemeText style={styles.sectionTitle}>Todos los Horarios</ThemeText>
              {schedules.map((schedule) => (
                <View key={schedule.id} style={styles.cardAllSchedules}>
                  <View style={styles.scheduleHeader}>
                    <ThemeText style={styles.cardAllSchedulesTitle}>
                      {schedule.barber?.name || barberNames[schedule.barberId] || `Barbero ${schedule.barberId.slice(0, 8)}...`}
                    </ThemeText>
                    <ThemeText style={styles.cardAllSchedulesDay}>
                      {dayLabels[dayNames.indexOf(schedule.dayOfWeek)]}
                    </ThemeText>
                  </View>
                  <View style={styles.scheduleChipsContainer}>
                    {schedule.availableTimeSlots.length > 0 ? (
                      schedule.availableTimeSlots.map((time, idx) => (
                        <View key={idx} style={styles.scheduleChip}>
                          <ThemeText style={styles.scheduleChipText}>🕒 {formatTimeSlots([time])[0]}</ThemeText>
                        </View>
                      ))
                    ) : (
                      <ThemeText style={styles.noScheduleText}>Sin horarios configurados</ThemeText>
                    )}
                  </View>
                  <Button onPress={() => handleEditAvailability(dayNames.indexOf(schedule.dayOfWeek), schedule.barberId)} style={styles.editButton}>
                    Editar Horarios
                  </Button>
                </View>
              ))}
            </View>
          )}
        </Container>
      </ScrollView>
    );
  };

  const renderUsersTab = () => (
    <View style={{ flex: 1 }}>
      <ScrollView showsVerticalScrollIndicator={false} style={{ marginTop: 0 }}>
        <Container>
          <View style={styles.sectionHeader}>
            <ThemeText style={styles.sectionTitle}>Gestión de Usuarios</ThemeText>
            <ThemeText style={styles.appointmentCount}>
              {isSearchingUser ? 'Buscando...' : searchedUser ? 'Usuario encontrado' : 'Buscar usuario'}
            </ThemeText>
          </View>

          {/* Search Section */}
          <View style={styles.filtersCard}>
            <View style={styles.filterSection}>
              <ThemeText style={styles.filterSectionTitle}>📧 Buscar por Email</ThemeText>
              <View style={styles.dateFilterContainer}>
                <TextInput
                  style={styles.dateInputField}
                  placeholder="Email del usuario..."
                  value={userSearchEmail}
                  onChangeText={setUserSearchEmail}
                  placeholderTextColor={Colors.dark.textLight}
                />
                {userSearchEmail && (
                  <TouchableOpacity 
                    style={styles.clearDateButton}
                    onPress={() => {
                      setUserSearchEmail('');
                      setSearchedUser(null);
                    }}
                  >
                    <ThemeText style={styles.clearButtonText}>✕</ThemeText>
                  </TouchableOpacity>
                )}
              </View>
            </View>

            <View style={styles.filterActions}>
              <TouchableOpacity 
                style={styles.searchButton}
                onPress={searchUserByEmail}
                disabled={isSearchingUser || !userSearchEmail.trim()}
              >
                <ThemeText style={styles.searchButtonText}>
                  {isSearchingUser ? '🔍 Buscando...' : '🔍 Buscar Usuario'}
                </ThemeText>
              </TouchableOpacity>
            </View>
          </View>

          {isSearchingUser ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={Colors.dark.primary} />
              <ThemeText style={styles.loadingText}>Buscando usuario...</ThemeText>
            </View>
          ) : searchedUser ? (
            <View style={styles.card}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <ThemeText style={styles.cardTitle}>
                  {searchedUser.firstName && searchedUser.lastName 
                    ? `${searchedUser.firstName} ${searchedUser.lastName}` 
                    : searchedUser.email}
                </ThemeText>
                <View style={[styles.statusBadge, { backgroundColor: getRoleColor(searchedUser.role, searchedUser.isAdmin) }]}>
                  <ThemeText style={{
                    ...styles.statusText,
                    color: Colors.dark.background
                  }}>
                    {getRoleText(searchedUser.role, searchedUser.isAdmin)}
                  </ThemeText>
                </View>
              </View>

              <View style={styles.filterSection}>
                <ThemeText style={styles.filterSectionTitle}>🧭 Ordenar por Fecha</ThemeText>
                <ThemeText style={styles.helperText}>Organiza la lista de citas según la fecha seleccionada.</ThemeText>
                <View style={styles.statusFilterContainer}>
                  {[
                    { key: 'asc', label: 'Más próximas', icon: '⬆️' },
                    { key: 'desc', label: 'Más lejanas', icon: '⬇️' },
                  ].map(option => (
                    <TouchableOpacity
                      key={option.key}
                      style={[
                        styles.statusFilterButton,
                        sortOrder === option.key && styles.statusFilterButtonActive,
                        { borderColor: sortOrder === option.key ? Colors.dark.primary : Colors.dark.gray }
                      ]}
                      onPress={() => setSortOrder(option.key as 'asc' | 'desc')}
                    >
                      <ThemeText style={{
                        ...styles.statusFilterText,
                        ...(sortOrder === option.key ? styles.statusFilterTextActive : {})
                      }}>
                        {option.icon} {option.label}
                      </ThemeText>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
              <ThemeText style={styles.cardDescription}>Email: {searchedUser.email}</ThemeText>
              <ThemeText style={styles.cardDescription}>ID: {searchedUser.id}</ThemeText>
              <View style={styles.actionButtons}>
                <TouchableOpacity
                  style={[styles.actionButton, styles.confirmButton]}
                  onPress={() => updateUserRole(searchedUser.id, 'admin')}
                  disabled={isUpdatingUserRole || searchedUser.isAdmin}
                >
                  <ThemeText style={styles.actionButtonText}>
                    {isUpdatingUserRole ? 'Actualizando...' : 'Hacer Admin'}
                  </ThemeText>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionButton, { backgroundColor: '#ffc107', borderColor: '#ffc107' }]}
                  onPress={() => updateUserRole(searchedUser.id, 'staff')}
                  disabled={isUpdatingUserRole || (searchedUser.role === 'staff' && !searchedUser.isAdmin)}
                >
                  <ThemeText style={styles.actionButtonText}>
                    {isUpdatingUserRole ? 'Actualizando...' : 'Hacer Barbero'}
                  </ThemeText>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionButton, styles.cancelButton]}
                  onPress={() => updateUserRole(searchedUser.id, 'customer')}
                  disabled={isUpdatingUserRole || searchedUser.role === 'customer'}
                >
                  <ThemeText style={styles.actionButtonText}>
                    {isUpdatingUserRole ? 'Actualizando...' : 'Hacer Cliente'}
                  </ThemeText>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={styles.emptyState}>
              <ThemeText style={styles.emptyStateText}>
                {userSearchEmail ? 'No se encontró ningún usuario con ese email.' : 'Ingresa un email para buscar un usuario.'}
              </ThemeText>
            </View>
          )}
        </Container>
      </ScrollView>
    </View>
  );

  if (!user) {
    // Redirect to welcome screen if there's no session
    router.replace('/auth/welcome');
    return null;
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ThemeText style={styles.backButtonText}>← Volver</ThemeText>
        </TouchableOpacity>
        <ThemeText style={styles.headerTitle}>Admin</ThemeText>
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'appointments' && styles.activeTab]}
          onPress={() => setActiveTab('appointments')}
        >
          <View style={styles.tabContent}>
            <ThemeText style={styles.tabIcon}>📅</ThemeText>
            <ThemeText style={{
              ...styles.tabText,
              ...(activeTab === 'appointments' ? styles.activeTabText : {})
            }}>
              Citas
            </ThemeText>
          </View>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'services' && styles.activeTab]}
          onPress={() => setActiveTab('services')}
        >
          <View style={styles.tabContent}>
            <ThemeText style={styles.tabIcon}>✂️</ThemeText>
            <ThemeText style={{
              ...styles.tabText,
              ...(activeTab === 'services' ? styles.activeTabText : {})
            }}>
              Servicios
            </ThemeText>
          </View>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'availability' && styles.activeTab]}
          onPress={() => setActiveTab('availability')}
        >
          <View style={styles.tabContent}>
            <ThemeText style={styles.tabIcon}>🕐</ThemeText>
            <ThemeText style={{
              ...styles.tabText,
              ...(activeTab === 'availability' ? styles.activeTabText : {})
            }}>
              Horarios
            </ThemeText>
          </View>
        </TouchableOpacity>
        {user?.isAdmin && (
          <TouchableOpacity
            style={[styles.tab, activeTab === 'users' && styles.activeTab]}
            onPress={() => setActiveTab('users')}
          >
            <View style={styles.tabContent}>
              <ThemeText style={styles.tabIcon}>👥</ThemeText>
              <ThemeText style={{
                ...styles.tabText,
                ...(activeTab === 'users' ? styles.activeTabText : {})
              }}>
                Usuarios
              </ThemeText>
            </View>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh}
            tintColor={Colors.dark.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {activeTab === 'appointments' && renderAppointmentsTab()}
        {activeTab === 'services' && renderServicesTab()}
        {activeTab === 'availability' && renderAvailabilityTab()}
        {activeTab === 'users' && user?.isAdmin && renderUsersTab()}
      </ScrollView>

      <Modal
        visible={showFilterModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowFilterModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.filterModalContent}>
            <View style={styles.filterModalHeader}>
              <ThemeText style={styles.filterModalTitle}>Filtros</ThemeText>
              <TouchableOpacity 
                style={styles.modalCloseButton}
                onPress={() => setShowFilterModal(false)}
              >
                <ThemeText style={styles.modalCloseText}>×</ThemeText>
              </TouchableOpacity>
            </View>
            
            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Status Filter */}
              <View style={styles.filterField}>
                <ThemeText style={styles.filterLabel}>Estado de la Cita</ThemeText>
                <View style={styles.filterOptionsContainer}>
                  {[
                    { key: 'all', label: 'Todas' },
                    { key: 'pending', label: 'Pendientes' },
                    { key: 'confirmed', label: 'Confirmadas' },
                    { key: 'cancelled', label: 'Canceladas' },
                    { key: 'completed', label: 'Completadas' }
                  ].map(status => (
                    <TouchableOpacity
                      key={status.key}
                      style={[
                        styles.filterOptionChip,
                        statusFilter === status.key && styles.filterOptionChipActive
                      ]}
                      onPress={() => setStatusFilter(status.key)}
                    >
                      <ThemeText style={statusFilter === status.key ? [styles.filterOptionText, styles.filterOptionTextActive] as any : styles.filterOptionText}>
                        {status.label}
                      </ThemeText>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Sort Filter */}
              <View style={styles.filterField}>
                <ThemeText style={styles.filterLabel}>Ordenar por</ThemeText>
                <View style={styles.filterOptionsContainer}>
                  {[
                    { key: 'asc', label: 'Más próximas' },
                    { key: 'desc', label: 'Más lejanas' }
                  ].map(option => (
                    <TouchableOpacity
                      key={option.key}
                      style={[
                        styles.filterOptionChip,
                        sortOrder === option.key && styles.filterOptionChipActive
                      ]}
                      onPress={() => setSortOrder(option.key as 'asc' | 'desc')}
                    >
                      <ThemeText style={sortOrder === option.key ? [styles.filterOptionText, styles.filterOptionTextActive] as any : styles.filterOptionText}>
                        {option.label}
                      </ThemeText>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
              
              <TouchableOpacity 
                style={styles.applyFilterButton}
                onPress={() => setShowFilterModal(false)}
              >
                <ThemeText style={styles.applyFilterButtonText}>Aplicar Filtros</ThemeText>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      <AvailabilityEditor
        visible={showAvailabilityEditor}
        onClose={() => setShowAvailabilityEditor(false)}
        onSave={handleSaveAvailability}
        initialSchedule={(() => {
          let validDay = (!editingDay || isNaN(Number(editingDay)) || Number(editingDay) < 0 || Number(editingDay) > 6)
            ? '0'
            : editingDay;
          const schedule = schedules.find(s => {
            const dayOfWeekString = dayNames[parseInt(validDay, 10)];
            return s.dayOfWeek === dayOfWeekString;
          });
          return schedule
            ? {
                day: validDay,
                isOpen: schedule.availableTimeSlots.length > 0,
                timeSlots: schedule.availableTimeSlots.map((time, idx) => ({ id: idx.toString(), time })),
              }
            : {
                day: validDay,
                isOpen: false,
                timeSlots: [],
              };
        })()}
      />

      <ServiceEditor
        visible={showServiceEditor}
        onClose={() => {
          setShowServiceEditor(false);
          setEditingService(null);
        }}
        onSave={handleSaveService}
        initialService={editingService ? { ...editingService, price: Number(editingService.price), description: editingService.description || '' } : undefined}
        category={'barber'}
      />

      <Modal visible={showCreateModal} animationType="slide" onRequestClose={() => setShowCreateModal(false)}>
        <SafeAreaView style={{ flex: 1, backgroundColor: Colors.dark.background, padding: 20 }}>
          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 30 }}>
            <ThemeText style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 20 }}>Crear Nueva Cita</ThemeText>
            <ThemeText style={{ fontSize: 16, marginBottom: 8 }}>Barbero</ThemeText>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 5 }} style={{ marginBottom: 20 }}>
              {staffList.map((staff, index) => (
                <Pressable
                  key={staff.id}
                  onPress={() => setNewAppointment(a => ({ ...a, barberId: staff.id }))}
                  style={{
                    width: 120,
                    marginRight: index === staffList.length - 1 ? 0 : 15,
                    padding: 15,
                    backgroundColor: newAppointment.barberId === staff.id ? Colors.dark.primary : Colors.dark.background,
                    borderColor: newAppointment.barberId === staff.id ? Colors.dark.primary : Colors.dark.gray,
                    borderWidth: 1,
                    borderRadius: 10,
                    alignItems: 'center'
                  }}
                >
                  <View style={{
                    width: 50,
                    height: 50,
                    borderRadius: 25,
                    backgroundColor: newAppointment.barberId === staff.id ? 'rgba(255,255,255,0.2)' : Colors.dark.gray,
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginBottom: 8
                  }}>
                    <ThemeText style={{ fontSize: 18, fontWeight: 'bold', color: newAppointment.barberId === staff.id ? Colors.dark.background : Colors.dark.text }}>
                      {staff.firstName.charAt(0)}{staff.lastName.charAt(0)}
                    </ThemeText>
                  </View>
                  <ThemeText style={{ fontSize: 12, fontWeight: '600', textAlign: 'center', color: newAppointment.barberId === staff.id ? Colors.dark.background : Colors.dark.text }}>
                    {staff.firstName}
                  </ThemeText>
                  <ThemeText style={{ fontSize: 12, textAlign: 'center', color: newAppointment.barberId === staff.id ? Colors.dark.background : Colors.dark.text }}>
                    {staff.lastName}
                  </ThemeText>
                </Pressable>
              ))}
            </ScrollView>
            <ThemeText style={{ fontSize: 16, marginBottom: 8 }}>Servicio</ThemeText>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 5 }} style={{ marginBottom: 20 }}>
              {serviceList.map((service, index) => (
                <Pressable
                  key={service.id}
                  onPress={() => {
                    setSelectedService(service);
                    setNewAppointment(a => ({ ...a, serviceId: service.id }));
                  }}
                  style={{
                    width: 200,
                    marginRight: index === serviceList.length - 1 ? 0 : 15,
                    padding: 15,
                    backgroundColor: newAppointment.serviceId === service.id ? Colors.dark.primary : Colors.dark.background,
                    borderColor: newAppointment.serviceId === service.id ? Colors.dark.primary : Colors.dark.gray,
                    borderWidth: 1,
                    borderRadius: 10,
                    alignItems: 'flex-start'
                  }}
                >
                  <ThemeText style={{ fontSize: 14, fontWeight: 'bold', color: newAppointment.serviceId === service.id ? Colors.dark.background : Colors.dark.text, marginBottom: 4, textAlign: 'left' }}>{service.name}</ThemeText>
                  <ThemeText style={{ fontSize: 12, color: newAppointment.serviceId === service.id ? Colors.dark.background : Colors.dark.textLight, textAlign: 'left' }}>{service.description}</ThemeText>
                  <ThemeText style={{ fontSize: 12, color: newAppointment.serviceId === service.id ? Colors.dark.background : Colors.dark.text, marginTop: 4, textAlign: 'left' }}>${parseFloat(service.price).toFixed(2)}</ThemeText>
                </Pressable>
              ))}
            </ScrollView>
            <View style={{ marginTop: 20 }}>
              <AppointmentDatePicker
                barberId={newAppointment.barberId}
                selectedDate={selectedDate}
                selectedTime={selectedTime}
                onDateSelect={date => setSelectedDate(date)}
                onTimeSelect={time => setSelectedTime(time)}
                showConfirmButton={false}
                showSummary={false}
              />
            </View>
            {!newAppointment.userId && (
              <ThemeText style={{ color: Colors.dark.textLight, marginTop: 10, textAlign: 'center' }}>
                Solo puedes crear citas para usuarios registrados. Ingresa el ID del cliente.
              </ThemeText>
            )}
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 20 }}>
              <Button
                onPress={handleCreateAppointment}
                style={styles.confirmButton}
                disabled={creating || !newAppointment.userId}
              >
                Crear
              </Button>
              <Button onPress={() => setShowCreateModal(false)} style={styles.cancelButton}>
                Cancelar
              </Button>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    gap: 15,
  },
  backButton: {
    backgroundColor: Colors.dark.gray,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.dark.primary,
  },
  backButtonText: {
    color: Colors.dark.primary,
    fontWeight: '600',
    fontSize: 14,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.dark.text,
  },
  signOutButton: {
    backgroundColor: '#ff3b30',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  signOutButtonText: {
    color: Colors.dark.background,
    fontWeight: '600',
    fontSize: 14,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.dark.background,
    borderBottomWidth: 1,
    borderBottomColor: Colors.dark.gray,
    paddingHorizontal: 20,
  },
  tab: {
    flex: 1,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: Colors.dark.primary,
  },
  tabText: {
    fontSize: 14,
    color: Colors.dark.textLight,
    textAlign: 'center',
  },
  activeTabText: {
    color: Colors.dark.primary,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.dark.primary,
    marginTop: 24,
    marginBottom: 12,
  },
  appointmentCount: {
    fontSize: 14,
    color: Colors.dark.textLight,
  },
  addButton: {
    backgroundColor: Colors.dark.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    minWidth: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    backgroundColor: Colors.dark.gray,
    borderRadius: 8,
    padding: 20,
    borderColor: Colors.dark.primary,
    borderWidth: 1,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.dark.text,
  },
  cardPrice: {
    fontSize: 16,
    color: Colors.dark.primary,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  cardDescription: {
    fontSize: 14,
    color: Colors.dark.textLight,
    marginBottom: 2,
  },
  statusBadge: {
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 4,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 60,
  },
  statusText: {
    color: Colors.dark.background,
    fontWeight: 'bold',
    fontSize: 12,
    textAlign: 'center',
  },
  confirmButton: {
    backgroundColor: Colors.dark.primary,
    borderColor: Colors.dark.primary,
  },
  cancelButton: {
    backgroundColor: '#e74c3c',
    borderColor: '#e74c3c',
  },
  editServiceButton: {
    padding: 6,
  },
  editServiceButtonText: {
    fontSize: 16,
    color: Colors.dark.text,
  },
  deleteServiceButton: {
    padding: 6,
  },
  deleteServiceButtonText: {
    fontSize: 16,
    color: Colors.dark.text,
  },
  timeSlot: {
    backgroundColor: Colors.dark.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginBottom: 4,
  },
  timeText: {
    color: Colors.dark.background,
    fontSize: 12,
    fontWeight: '600',
  },
  noTimesText: {
    fontSize: 14,
    color: Colors.dark.textLight,
    fontStyle: 'italic',
  },
  editButton: {
    backgroundColor: Colors.dark.primary,
    borderColor: Colors.dark.primary,
    minWidth: 120,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 16,
    color: Colors.dark.textLight,
  },
  errorText: {
    fontSize: 18,
    color: '#ff3b30',
    textAlign: 'center',
    marginTop: 100,
    marginBottom: 20,
  },
  availabilityNote: {
    fontSize: 14,
    color: Colors.dark.textLight,
    marginBottom: 20,
    fontStyle: 'italic',
  },
  textInput: {
    backgroundColor: Colors.dark.gray,
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.dark.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: Colors.dark.gray,
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
  },
  section: {
    marginBottom: 30,
  },
  daysColumnContainer: {
    marginTop: 0,
  },
  daysColumn: {
    flexDirection: 'column',
    width: '100%',
    gap: 4,
  },
  dayCardColumn: {
    backgroundColor: '#29251a',
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 24,
    marginBottom: 4,
    width: '100%',
    alignItems: 'flex-start',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    borderWidth: 1,
    borderColor: '#39331e',
  },
  dayCardTitleColumn: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.dark.text,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 4,
    marginBottom: 2,
    justifyContent: 'center',
  },
  chip: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 3,
    marginRight: 4,
    marginBottom: 4,
    borderWidth: 1,
    borderColor: Colors.dark.primary,
  },
  chipText: {
    fontSize: 13,
    color: Colors.dark.primary,
    fontWeight: '600',
  },
  chipMore: {
    backgroundColor: Colors.dark.primary,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginRight: 4,
    marginBottom: 4,
  },
  chipMoreText: {
    fontSize: 13,
    color: Colors.dark.background,
    fontWeight: 'bold',
  },
  closedDayIndicator: {
    backgroundColor: '#ff3b30',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  closedDayText: {
    fontSize: 12,
    color: Colors.dark.background,
    fontWeight: 'bold',
  },
  addScheduleMiniBtn: {
    marginTop: 8,
    backgroundColor: Colors.dark.primary,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  addScheduleMiniBtnText: {
    color: Colors.dark.background,
    fontWeight: 'bold',
    fontSize: 13,
  },
  staffCard: {
    backgroundColor: Colors.dark.gray,
    borderRadius: 12,
    padding: 15,
    marginHorizontal: 10,
    minWidth: 200,
  },
  staffName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
    color: Colors.dark.text,
  },
  staffDaysContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  staffDayButton: {
    backgroundColor: Colors.dark.background,
    borderRadius: 6,
    padding: 8,
    marginBottom: 8,
    minWidth: '25%',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.dark.gray,
  },
  staffDayButtonText: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 3,
    color: Colors.dark.text,
  },
  dayWithSchedule: {
    borderColor: Colors.dark.primary,
    backgroundColor: Colors.dark.primary + '20',
  },
  dayWithoutSchedule: {
    borderColor: Colors.dark.gray,
  },
  scheduleCount: {
    fontSize: 12,
    color: Colors.dark.primary,
    fontWeight: 'bold',
  },
  scheduleChipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 4,
  },
  scheduleChip: {
    backgroundColor: Colors.dark.background,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginRight: 4,
    marginBottom: 4,
    borderWidth: 1,
    borderColor: Colors.dark.primary,
  },
  scheduleChipText: {
    fontSize: 12,
    color: Colors.dark.primary,
  },
  cardAllSchedules: {
    backgroundColor: Colors.dark.background,
    borderRadius: 10,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.dark.primary,
  },
  cardAllSchedulesTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: Colors.dark.primary,
    marginBottom: 2,
  },
  cardAllSchedulesDay: {
    fontSize: 13,
    color: Colors.dark.textLight,
    marginBottom: 8,
  },
  scheduleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  noScheduleText: {
    fontSize: 14,
    color: Colors.dark.textLight,
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 10,
  },
  scheduleIndicator: {
    backgroundColor: Colors.dark.primary + '20',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
  },
  loadingText: {
    marginTop: 10,
    color: Colors.dark.textLight,
    fontSize: 16,
  },
  progressText: {
    marginTop: 10,
    color: Colors.dark.textLight,
    fontSize: 14,
  },
  barberInfo: {
    fontSize: 14,
    color: Colors.dark.textLight,
    marginTop: 8,
    fontStyle: 'italic',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtonText: {
    color: Colors.dark.background,
    fontWeight: '600',
    fontSize: 14,
    textAlign: 'center',
  },
  completeButton: {
    backgroundColor: '#2ecc40',
    borderColor: '#2ecc40',
  },
  customerInfo: {
    fontSize: 14,
    color: Colors.dark.textLight,
    marginTop: 8,
    fontStyle: 'italic',
  },
  barberContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 4,
  },
  barberLabel: {
    fontSize: 14,
    color: Colors.dark.textLight,
    marginRight: 5,
  },
  barberName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: Colors.dark.text,
  },
  customerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 4,
  },
  customerLabel: {
    fontSize: 14,
    color: Colors.dark.textLight,
    marginRight: 5,
  },
  customerName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: Colors.dark.text,
  },
  customerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  customerIcon: {
    fontSize: 20,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  filterToggleButton: {
    backgroundColor: Colors.dark.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  filterToggleText: {
    color: Colors.dark.background,
    fontWeight: '600',
    fontSize: 14,
  },
  filtersCard: {
    backgroundColor: Colors.dark.gray,
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: Colors.dark.primary,
  },
  filterSection: {
    marginBottom: 15,
  },
  filterSectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.dark.text,
    marginBottom: 10,
  },
  helperText: {
    fontSize: 12,
    color: Colors.dark.textLight,
    marginBottom: 6,
  },
  activeFiltersContainer: {
    backgroundColor: Colors.dark.background,
    borderRadius: 10,
    padding: 10,
    marginBottom: 15,
  },
  activeFiltersLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.dark.text,
  },
  activeFiltersChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  activeFilterChip: {
    backgroundColor: Colors.dark.primary,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  activeFilterChipText: {
    color: Colors.dark.background,
    fontSize: 12,
    fontWeight: '600',
  },
  statusFilterContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  statusFilterButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: Colors.dark.gray,
  },
  statusFilterButtonActive: {
    backgroundColor: Colors.dark.primary,
    borderColor: Colors.dark.primary,
  },
  statusFilterText: {
    fontSize: 13,
    color: Colors.dark.textLight,
    fontWeight: '600',
  },
  statusFilterTextActive: {
    color: Colors.dark.background,
  },
  dateFilterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.dark.gray,
    borderRadius: 8,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: Colors.dark.gray,
  },
  dateInputField: {
    flex: 1,
    paddingVertical: 10,
    color: Colors.dark.text,
    fontSize: 14,
  },
  clearDateButton: {
    padding: 5,
  },
  clearButtonText: {
    fontSize: 16,
    color: Colors.dark.textLight,
  },
  barberFilterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.dark.gray,
    borderRadius: 8,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: Colors.dark.gray,
  },
  barberInputField: {
    flex: 1,
    paddingVertical: 10,
    color: Colors.dark.text,
    fontSize: 14,
  },
  clearBarberButton: {
    padding: 5,
  },
  filterActions: {
    alignItems: 'center',
    marginTop: 15,
  },
  clearAllFiltersButton: {
    backgroundColor: Colors.dark.gray,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.dark.primary,
  },
  clearAllFiltersText: {
    color: Colors.dark.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  loadingMoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    padding: 8,
  },
  loadingMoreText: {
    marginLeft: 8,
    fontSize: 12,
    color: Colors.dark.textLight,
  },
  searchButton: {
    backgroundColor: Colors.dark.primary,
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchButtonText: {
    color: Colors.dark.background,
    fontWeight: '600',
    fontSize: 14,
  },
  paymentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 4,
    gap: 8,
  },
  paymentLabel: {
    fontSize: 14,
    color: Colors.dark.textLight,
    fontWeight: '600',
  },
  paymentAmount: {
    fontSize: 14,
    fontWeight: 'bold',
    color: Colors.dark.text,
  },
  paymentTypeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  paymentTypeText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: Colors.dark.background,
    textAlign: 'center',
  },
  completedStatusContainer: {
    backgroundColor: '#2ecc40',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  completedStatusText: {
    color: Colors.dark.background,
    fontWeight: 'bold',
    fontSize: 14,
    textAlign: 'center',
  },
  cancelledStatusContainer: {
    backgroundColor: '#e74c3c',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  cancelledStatusText: {
    color: Colors.dark.background,
    fontWeight: 'bold',
    fontSize: 14,
    textAlign: 'center',
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  filterModalContent: {
    backgroundColor: Colors.dark.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '85%',
    borderTopWidth: 1,
    borderTopColor: Colors.dark.gray,
  },
  filterModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.dark.gray,
  },
  filterModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.dark.text,
  },
  modalCloseButton: {
    padding: 5,
  },
  modalCloseText: {
    fontSize: 24,
    color: Colors.dark.textLight,
    lineHeight: 24,
  },
  filterField: {
    marginBottom: 20,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.dark.text,
    marginBottom: 8,
    marginLeft: 4,
  },
  filterInputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.dark.gray,
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#333',
  },
  filterInputIcon: {
    fontSize: 16,
    marginRight: 10,
  },
  filterInputText: {
    fontSize: 16,
    color: Colors.dark.text,
    flex: 1,
  },
  filterInputPlaceholder: {
    color: Colors.dark.textLight,
  },
  filterInputArrow: {
    fontSize: 14,
    color: Colors.dark.textLight,
  },
  filterOptionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 5,
  },
  filterOptionChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.dark.gray,
    borderWidth: 1,
    borderColor: '#333',
  },
  filterOptionChipActive: {
    backgroundColor: Colors.dark.primary,
    borderColor: Colors.dark.primary,
  },
  filterOptionText: {
    fontSize: 14,
    color: Colors.dark.textLight,
  },
  filterOptionTextActive: {
    color: Colors.dark.background,
    fontWeight: '600',
  },
  applyFilterButton: {
    backgroundColor: Colors.dark.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  applyFilterButtonText: {
    color: Colors.dark.background,
    fontSize: 16,
    fontWeight: 'bold',
  },
  calendarModalContent: {
    backgroundColor: Colors.dark.background,
    margin: 20,
    borderRadius: 20,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    alignSelf: 'center',
    width: '90%',
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  calendarTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.dark.text,
  },
  closeButtonText: {
    color: Colors.dark.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  dateSelectorButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.dark.gray,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: Colors.dark.gray,
  },
  dateSelectorText: {
    flex: 1,
    fontSize: 14,
    color: Colors.dark.text,
  },
  dateSelectorPlaceholder: {
    color: Colors.dark.textLight,
  },
  calendarIcon: {
    fontSize: 16,
  },
  clearDateButtonInside: {
    padding: 4,
  },
  viewModeContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.dark.gray,
    borderRadius: 12,
    padding: 4,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: Colors.dark.primary,
  },
  viewModeTab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
  },
  viewModeTabActive: {
    backgroundColor: Colors.dark.primary,
  },
  viewModeText: {
    color: Colors.dark.textLight,
    fontWeight: '600',
    fontSize: 13,
  },
  viewModeTextActive: {
    color: Colors.dark.background,
    fontWeight: 'bold',
  },
  monthPickerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.dark.gray,
    borderRadius: 12,
    padding: 10,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#333',
  },
  monthNavButton: {
    padding: 10,
    backgroundColor: Colors.dark.background,
    borderRadius: 8,
    width: 40,
    alignItems: 'center',
  },
  monthNavButtonText: {
    color: Colors.dark.primary,
    fontSize: 18,
    fontWeight: 'bold',
  },
  monthYearTitle: {
    color: Colors.dark.text,
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default AdminPanel; 
