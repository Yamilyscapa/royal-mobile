import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Alert, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native';
import { ThemeText, Container } from '@/components/Themed';
import { SafeAreaView } from 'react-native-safe-area-context';
import Colors from '@/constants/Colors';
import { Stack, useLocalSearchParams, router } from 'expo-router';
import DatePicker from '@/components/ui/DatePicker';
import Button from '@/components/Button';
import { StatusBar } from 'react-native';
import { AppointmentsService } from '@/services';
import { Appointment } from '@/services';
import { apiClient } from '@/services/api';
import { useAuth } from '@/components/auth/AuthContext';
import ScreenWrapper from '@/components/ui/ScreenWrapper';

export default function RescheduleScreen() {
    const { appointmentId } = useLocalSearchParams();
    const { user, isLoading: authLoading } = useAuth();
    const [selectedDate, setSelectedDate] = useState<string>("");
    const [selectedTime, setSelectedTime] = useState<string>("");
    const [isRescheduling, setIsRescheduling] = useState(false);
    const [appointment, setAppointment] = useState<Appointment | null>(null);
    const [allUserAppointments, setAllUserAppointments] = useState<Appointment[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [apiReady, setApiReady] = useState(false);

    // Force API client to re-initialize every time this screen is entered
    useEffect(() => {
        apiClient.initialize().then(() => setApiReady(true));
    }, [appointmentId, user]);

    // Fetch appointment data from API only after auth and api are ready
    useEffect(() => {
        if (!apiReady || authLoading || !user) return;
        if (!appointmentId) {
            Alert.alert(
                'Error',
                'No se encontró el ID de la cita. Intenta de nuevo desde el historial.',
                [{ text: 'OK', onPress: () => router.back() }]
            );
            setIsLoading(false);
            return;
        }
        // Debug: log token and headers
        const headers = (apiClient as any).getHeaders();
        console.log('=== RESCHEDULE DEBUG ===');
        console.log('Token:', (apiClient as any).accessToken);
        console.log('Headers:', headers);
        console.log('User:', user);
        console.log('AppointmentId:', appointmentId);
        console.log('========================');
        loadAppointment();
        loadAllUserAppointments();
    }, [appointmentId, apiReady, authLoading, user]);

    // Check if this is the closest appointment and redirect if not
    useEffect(() => {
        if (appointment && allUserAppointments.length > 0) {
            checkAndRedirectIfNotClosest();
        }
    }, [appointment, allUserAppointments]);

    // Check if appointment has already been rescheduled and redirect
    useEffect(() => {
        if (appointment) {
            const rescheduleCount = appointment.rescheduleCount || 0;
            if (rescheduleCount >= 1) {
                Alert.alert(
                    "No se puede reprogramar",
                    "Esta cita ya ha sido reprogramada el máximo de veces permitido (1 vez).",
                    [
                        {
                            text: "OK",
                            onPress: () => router.replace('/(tabs)/history')
                        }
                    ]
                );
            }
        }
    }, [appointment]);

    const loadAppointment = async () => {
        try {
            setIsLoading(true);
            const response = await AppointmentsService.getAppointmentById(appointmentId as string);
            if (response.success && response.data) {
                setAppointment(response.data);
            } else {
                Alert.alert(
                    "Error",
                    response.error || "No se pudo cargar la información de la cita",
                    [{ text: "OK", onPress: () => router.back() }]
                );
            }
        } catch (error) {
            console.error('Error loading appointment:', error);
            Alert.alert(
                "Error",
                "No se pudo cargar la información de la cita",
                [{ text: "OK", onPress: () => router.back() }]
            );
        } finally {
            setIsLoading(false);
        }
    };

    const checkAndRedirectIfNotClosest = () => {
        if (appointment && allUserAppointments.length > 0) {
            const closestAppointment = getClosestUpcomingAppointment();
            if (closestAppointment && closestAppointment.id !== appointment.id) {
                Alert.alert(
                    "Cita no disponible",
                    "Solo puedes reprogramar tu próxima cita programada. Serás redirigido a tu próxima cita.",
                    [
                        {
                            text: "OK",
                            onPress: () => {
                                router.replace(`/appointment/reschedule/${closestAppointment.id}`);
                            }
                        }
                    ]
                );
            }
        }
    };

    const loadAllUserAppointments = async () => {
        try {
            const response = await AppointmentsService.getUserAppointments();
            if (response.success && response.data) {
                setAllUserAppointments(response.data);
            }
        } catch (error) {
            console.error('Error loading user appointments:', error);
        }
    };

    const getClosestUpcomingAppointment = (): Appointment | null => {
        // Ensure allUserAppointments is an array before filtering
        if (!allUserAppointments || !Array.isArray(allUserAppointments)) {
            return null;
        }

        const now = new Date();
        const upcomingAppointments = allUserAppointments.filter(apt => {
            const aptDate = new Date(apt.appointmentDate);
            return aptDate > now && (apt.status === 'confirmed' || apt.status === 'pending');
        });

        if (upcomingAppointments.length === 0) return null;

        // Sort by appointment date and time, then return the closest one
        return upcomingAppointments.sort((a, b) => {
            const dateA = new Date(a.appointmentDate);
            const dateB = new Date(b.appointmentDate);
            return dateA.getTime() - dateB.getTime();
        })[0];
    };

    const isClosestAppointment = (): boolean => {
        if (!appointment) return false;
        const closestAppointment = getClosestUpcomingAppointment();
        return closestAppointment?.id === appointment.id;
    };

    const formatDate = (dateString: string) => {
        if (!dateString) return "";
        let date: Date;
        if (dateString.includes('/')) {
            const [day, month, year] = dateString.split('/');
            date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
        } else {
            date = new Date(dateString);
        }
        // Format as dd/mm/yyyy
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
    };

    const formatTime = (timeString: string) => {
        if (!timeString) return "";
        const [hour, minute = '00'] = timeString.split(':');
        const hourNum = parseInt(hour);
        const minuteNum = parseInt(minute);
        // Format as hh:mm
        return `${hourNum.toString().padStart(2, '0')}:${minuteNum.toString().padStart(2, '0')}`;
    };

    const isWithin30Minutes = () => {
        if (!appointment) return false;
        const appointmentDateTime = new Date(appointment.appointmentDate);
        const currentTime = new Date();
        const timeDifferenceMs = appointmentDateTime.getTime() - currentTime.getTime();
        const timeDifferenceMinutes = timeDifferenceMs / (1000 * 60);
        return timeDifferenceMinutes <= 30;
    };

    const canReschedule = () => {
        if (!appointment) return false;
        const canRescheduleStatus = appointment.status === 'confirmed' || appointment.status === 'pending';
        const canRescheduleCount = (appointment.rescheduleCount || 0) < 1;
        
        // Check if appointment is within 30 minutes
        const isWithin30Min = isWithin30Minutes();
        
        // Check if this is the closest upcoming appointment
        const isClosest = isClosestAppointment();
        
        // Debug logging
        console.log('=== RESCHEDULE VALIDATION ===');
        console.log('Appointment ID:', appointment.id);
        console.log('Status:', appointment.status);
        console.log('Reschedule Count:', appointment.rescheduleCount);
        console.log('Can Reschedule Status:', canRescheduleStatus);
        console.log('Can Reschedule Count:', canRescheduleCount);
        console.log('Is Within 30 Min:', isWithin30Min);
        console.log('Is Closest:', isClosest);
        console.log('Final Can Reschedule:', canRescheduleStatus && canRescheduleCount && !isWithin30Min && isClosest);
        console.log('================================');
        
        return canRescheduleStatus && canRescheduleCount && !isWithin30Min && isClosest;
    };

    const handleReschedule = () => {
        if (!appointment) return;
        
        // Additional safety check for reschedule count
        if ((appointment.rescheduleCount || 0) >= 1) {
            Alert.alert(
                "No se puede reprogramar",
                "Esta cita ya ha sido reprogramada el máximo de veces permitido (1 vez).",
                [{ text: "OK" }]
            );
            return;
        }
        
        if (!canReschedule()) {
            if (!isClosestAppointment()) {
                Alert.alert(
                    "No se puede reprogramar",
                    "Solo puedes reprogramar tu próxima cita programada. Esta cita no es tu próxima cita.",
                    [{ text: "OK" }]
                );
            } else if (isWithin30Minutes()) {
                Alert.alert(
                    "No se puede reprogramar",
                    "No se puede reprogramar una cita 30 minutos antes de la hora programada.",
                    [{ text: "OK" }]
                );
            } else {
                Alert.alert(
                    "No se puede reprogramar",
                    "Esta cita ya ha sido reprogramada el máximo de veces permitido o no está en un estado válido para reprogramar.",
                    [{ text: "OK" }]
                );
            }
            return;
        }
        setIsRescheduling(true);
    };

    const convertDateToBackendFormat = (dateString: string): string => {
        const [year, month, day] = dateString.split('-');
        return `${day}/${month}/${year}`;
    };

    const handleConfirmReschedule = async (date: string, time: string) => {
        if (!appointment) return;
        Alert.alert(
            "Confirmar Reprogramación",
            `¿Estás seguro de que quieres reprogramar tu cita de "${appointment.service?.name || 'Servicio'}"?\n\nFecha actual: ${formatDate(appointment.appointmentDate)} a las ${formatTime(appointment.timeSlot)}\nNueva fecha: ${formatDate(date)} a las ${formatTime(time)}`,
            [
                {
                    text: "Cancelar",
                    style: "cancel"
                },
                {
                    text: "Confirmar",
                    onPress: async () => {
                        await performReschedule(date, time);
                    }
                }
            ]
        );
    };

    const performReschedule = async (date: string, time: string) => {
        if (!appointment) return;
        
        // Additional safety check for reschedule count
        if ((appointment.rescheduleCount || 0) >= 1) {
            Alert.alert(
                "No se puede reprogramar",
                "Esta cita ya ha sido reprogramada el máximo de veces permitido (1 vez).",
                [{ text: "OK" }]
            );
            return;
        }
        
        try {
            setIsSubmitting(true);
            const backendDate = convertDateToBackendFormat(date);
            const response = await AppointmentsService.rescheduleAppointment(
                appointment.id,
                backendDate,
                time
            );
            if (response.success && response.data) {
                Alert.alert(
                    "¡Cita Reprogramada!",
                    `Tu cita ha sido reprogramada exitosamente para ${formatDate(date)} a las ${formatTime(time)}.`,
                    [
                        {
                            text: "OK",
                            onPress: () => {
                                router.replace('/(tabs)/history');
                            }
                        }
                    ]
                );
            } else {
                // Handle specific error cases
                let errorMessage = response.error || "No se pudo reprogramar la cita. Por favor, intenta nuevamente.";
                
                if (response.error?.includes('Maximum reschedule limit reached')) {
                    errorMessage = "Esta cita ya ha sido reprogramada el máximo de veces permitido (1 vez).";
                } else if (response.error?.includes('30 minutos antes')) {
                    errorMessage = "No se puede reprogramar una cita 30 minutos antes de la hora programada.";
                } else if (response.error?.includes('not available')) {
                    errorMessage = "El horario seleccionado no está disponible. Por favor, elige otro horario.";
                }
                
                Alert.alert(
                    "Error al Reprogramar",
                    errorMessage,
                    [{ text: "OK" }]
                );
            }
        } catch (error) {
            console.error('Error rescheduling appointment:', error);
            Alert.alert(
                "Error al Reprogramar",
                "Ocurrió un error al reprogramar la cita. Por favor, intenta nuevamente.",
                [{ text: "OK" }]
            );
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCancel = () => {
        Alert.alert(
            "Cancelar Reprogramación",
            "¿Estás seguro de que quieres cancelar la reprogramación?",
            [
                {
                    text: "Continuar",
                    style: "cancel"
                },
                {
                    text: "Cancelar",
                    onPress: () => router.back()
                }
            ]
        );
    };

    if (authLoading) {
        return (
            <ScreenWrapper>
                <Container style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={Colors.dark.primary} />
                    <ThemeText style={styles.loadingText}>Cargando autenticación...</ThemeText>
                </Container>
            </ScreenWrapper>
        );
    }

    if (!user) {
        // Redirect to welcome screen if there's no session
        router.replace('/auth/welcome');
        return null;
    }

    if (isLoading) {
        return (
            <SafeAreaView style={{ flex: 1, backgroundColor: Colors.dark.background }} edges={['top', 'bottom']}>
                <Container style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={Colors.dark.primary} />
                    <ThemeText style={styles.loadingText}>Cargando información de la cita...</ThemeText>
                </Container>
            </SafeAreaView>
        );
    }

    if (!appointment) {
        return (
            <SafeAreaView style={{ flex: 1, backgroundColor: Colors.dark.background }} edges={['top', 'bottom']}>
                <Container style={styles.container}>
                    <ThemeText style={styles.errorText}>No se encontró la cita especificada.</ThemeText>
                    <Button onPress={() => router.back()}>
                        Volver
                    </Button>
                </Container>
            </SafeAreaView>
        );
    }

    return (
        <ScreenWrapper showBottomFade={true} showTopFade={false} edges={['top', 'bottom']}>
            <Stack.Screen
                options={{
                    headerShown: false
                }}
            />
            
            {/* Custom Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                    <ThemeText style={styles.backButtonText}>← Volver</ThemeText>
                </TouchableOpacity>
                <ThemeText style={styles.headerTitle}>Reprogramar Cita</ThemeText>
                <View style={styles.headerSpacer} />
            </View>
            
            <ScrollView style={styles.scrollView}>
                <Container style={styles.container}>
                    {/* Current Appointment Info */}
                    <View style={styles.section}>
                        <ThemeText style={styles.sectionTitle}>
                            Cita Actual
                        </ThemeText>
                        <View style={styles.appointmentCard}>
                            <ThemeText style={styles.serviceTitle}>
                                {appointment.service?.name || 'Servicio'}
                            </ThemeText>
                            <View style={styles.appointmentDetails}>
                                <ThemeText style={styles.detailText}>
                                    📅 {formatDate(appointment.appointmentDate)}
                                </ThemeText>
                                <ThemeText style={styles.detailText}>
                                    🕐 {formatTime(appointment.timeSlot)}
                                </ThemeText>
                                {appointment.barber && (
                                    <ThemeText style={styles.detailText}>
                                        👨‍💼 {appointment.barber.name}
                                    </ThemeText>
                                )}
                                {appointment.service && (
                                    <ThemeText style={styles.detailText}>
                                        💰 ${appointment.service.price}
                                    </ThemeText>
                                )}
                            </View>
                        </View>
                    </View>
                    {/* Reschedule Status */}
                    <View style={styles.section}>
                        <View style={styles.statusCard}>
                            <ThemeText style={styles.statusTitle}>
                                Estado de Reprogramación
                            </ThemeText>
                            <ThemeText style={styles.statusText}>
                                {canReschedule()
                                    ? "✅ Puedes reprogramar esta cita"
                                    : isWithin30Minutes()
                                    ? "⏰ No se puede reprogramar (menos de 30 minutos)"
                                    : !isClosestAppointment()
                                    ? "📅 Solo puedes reprogramar tu próxima cita"
                                    : "❌ Esta cita ya no puede ser reprogramada"
                                }
                            </ThemeText>
                            <ThemeText style={styles.statusSubtext}>
                                Reprogramaciones realizadas: {appointment.rescheduleCount || 0}/1
                            </ThemeText>
                            <ThemeText style={styles.statusSubtext}>
                                Estado: {appointment.status === 'confirmed' ? 'Confirmada' :
                                    appointment.status === 'pending' ? 'Pendiente' :
                                        appointment.status === 'completed' ? 'Completada' :
                                            appointment.status === 'cancelled' ? 'Cancelada' :
                                                appointment.status}
                            </ThemeText>
                            {isWithin30Minutes() && (
                                <ThemeText style={{ ...styles.statusSubtext, color: '#FF6B6B', fontWeight: 'bold' }}>
                                    ⚠️ Restricción: No se puede reprogramar 30 minutos antes de la cita
                                </ThemeText>
                            )}
                            {!isClosestAppointment() && appointment && (
                                <ThemeText style={{ ...styles.statusSubtext, color: '#FFA500', fontWeight: 'bold' }}>
                                    ℹ️ Solo puedes reprogramar tu próxima cita programada
                                </ThemeText>
                            )}
                        </View>
                    </View>
                    {/* Reschedule Button */}
                    {canReschedule() && !isRescheduling && (appointment.rescheduleCount || 0) < 1 && (
                        <View style={styles.section}>
                            <Button onPress={handleReschedule}>
                                Reprogramar Cita
                            </Button>
                        </View>
                    )}
                    {/* Date/Time Picker for Rescheduling */}
                    {isRescheduling && (
                        <View style={styles.section}>
                            <ThemeText style={styles.sectionTitle}>
                                Seleccionar Nueva Fecha y Hora
                            </ThemeText>
                            <DatePicker
                                barberId={appointment.barberId}
                                onDateSelect={setSelectedDate}
                                onTimeSelect={setSelectedTime}
                                onConfirm={handleConfirmReschedule}
                                selectedDate={selectedDate}
                                selectedTime={selectedTime}
                                title="Reprogramar Cita"
                                subtitle="Elige la nueva fecha y hora"
                                confirmButtonText="Confirmar Reprogramación"
                            />
                        </View>
                    )}
                    {/* Cancel Button */}
                    {isRescheduling && (
                        <View style={styles.section}>
                            <Button
                                onPress={handleCancel}
                                secondary
                                disabled={isSubmitting}
                            >
                                Cancelar Reprogramación
                            </Button>
                        </View>
                    )}
                    {/* Loading indicator for submission */}
                    {isSubmitting && (
                        <View style={styles.section}>
                            <View style={styles.loadingContainer}>
                                <ActivityIndicator size="small" color={Colors.dark.primary} />
                                <ThemeText style={styles.loadingText}>Procesando reprogramación...</ThemeText>
                            </View>
                        </View>
                    )}
                </Container>
            </ScrollView>
        </ScreenWrapper>
    );
}

const styles = StyleSheet.create({
    scrollView: {
        flex: 1,
    },
    container: {
        flex: 1,
        paddingHorizontal: 20,
        paddingTop: 20,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 40,
    },
    loadingText: {
        marginTop: 10,
        fontSize: 16,
        color: Colors.dark.textLight,
    },
    errorText: {
        fontSize: 16,
        color: Colors.dark.textLight,
        textAlign: 'center',
        marginBottom: 20,
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 16,
    },
    appointmentCard: {
        backgroundColor: Colors.dark.gray,
        borderRadius: 12,
        padding: 20,
        borderWidth: 1,
        borderColor: Colors.dark.primary,
    },
    serviceTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 12,
        color: Colors.dark.primary,
    },
    appointmentDetails: {
        gap: 8,
    },
    detailText: {
        fontSize: 16,
        color: Colors.dark.text,
    },
    statusCard: {
        backgroundColor: Colors.dark.gray,
        borderRadius: 12,
        padding: 20,
        borderWidth: 1,
        borderColor: Colors.dark.textLight,
    },
    statusTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    statusText: {
        fontSize: 14,
        marginBottom: 4,
    },
    statusSubtext: {
        fontSize: 12,
        color: Colors.dark.textLight,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 16,
        backgroundColor: Colors.dark.background,
        borderBottomWidth: 1,
        borderBottomColor: Colors.dark.gray,
    },
    backButton: {
        flex: 1,
    },
    backButtonText: {
        fontSize: 16,
        color: Colors.dark.primary,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: Colors.dark.text,
        textAlign: 'center',
        flex: 2,
    },
    headerSpacer: {
        flex: 1,
    },
});