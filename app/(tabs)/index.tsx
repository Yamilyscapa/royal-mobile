// React Native core imports
import React from 'react';
import { View, ScrollView, Alert, RefreshControl } from 'react-native';
import { useState, useCallback, useEffect } from 'react';

// Third-party library imports
import { Link, router, useFocusEffect } from 'expo-router';

// Local imports
import { ThemeText, Container } from '@/components/Themed';
import Button from '@/components/Button';
import AppointmentReminder from '@/components/ui/AppoinmentReminder';
import ScreenWrapper from '@/components/ui/ScreenWrapper';
import Colors from '@/constants/Colors';
import { useAuth } from '@/components/auth/AuthContext';
import { AppointmentsService, Appointment } from '@/services';

export default function HomeScreen() {
	const { user, clearStorage, isLoading: authLoading } = useAuth();
	const [upcomingAppointment, setUpcomingAppointment] = useState<Appointment | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [refreshing, setRefreshing] = useState(false);
	const [response, setResponse] = useState<any>(null);
	const [hasAttemptedFetch, setHasAttemptedFetch] = useState(false);
	const [hasShownAlert, setHasShownAlert] = useState(false);

	// Redirect unauthenticated users to welcome page
	useEffect(() => {
		if (!authLoading && !user) {
			console.log('HomeScreen: No user detected, redirecting to welcome');
			router.replace('/auth/welcome');
		}
	}, [user, authLoading]);

	// Don't render if user is not authenticated
	if (authLoading || !user) {
		return null;
	}


	// Effect to handle initial load and user state changes
	useEffect(() => {
		if (user && !hasAttemptedFetch) {
			fetchUpcomingAppointment();
			setHasAttemptedFetch(true);
			// Reset alert state when user logs in
			setHasShownAlert(false);
		} else if (!user && hasAttemptedFetch) {
			// Reset state when user becomes unavailable
			setUpcomingAppointment(null);
			setHasAttemptedFetch(false);
			setIsLoading(false);
		}
	}, [user, hasAttemptedFetch, isLoading, hasShownAlert]);



	useFocusEffect(
		useCallback(() => {
			// Only fetch if user is available and we haven't attempted yet
			if (user && !hasAttemptedFetch) {
				fetchUpcomingAppointment();
				setHasAttemptedFetch(true);
			}
		}, [user, hasAttemptedFetch])
	);

	const fetchUpcomingAppointment = async () => {
		try {
			setIsLoading(true);

			if (!user) {
				setUpcomingAppointment(null);
				setIsLoading(false);
				return;
			}

			// Use the optimized API client with caching
			const response = await AppointmentsService.getUserAppointments();

			if (response.success && response.data && response.data.length > 0) {

				// Filter upcoming appointments (confirmed or pending status, and future dates)
				const upcomingAppointments = response.data
					.filter(appointment => {
						// Only include confirmed or pending
						if (!['confirmed', 'pending'].includes(appointment.status)) return false;

						// Combine appointment date and time for accurate comparison
						const appointmentDate = new Date(appointment.appointmentDate);
						const [hours, minutes] = appointment.timeSlot.split(':');
						appointmentDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);

						const now = new Date();

						// Temporarily include appointments from today for testing
						const today = new Date();
						today.setHours(0, 0, 0, 0);
						const appointmentDateOnly = new Date(appointmentDate);
						appointmentDateOnly.setHours(0, 0, 0, 0);

						const isFuture = appointmentDate > now || appointmentDateOnly.getTime() === today.getTime();
						return isFuture;
					})
					.sort((a, b) => new Date(a.appointmentDate).getTime() - new Date(b.appointmentDate).getTime());

				// Get the next upcoming appointment
				if (upcomingAppointments.length > 0) {
					setUpcomingAppointment(upcomingAppointments[0]);
				} else {
					setUpcomingAppointment(null);
				}
			} else {
				setUpcomingAppointment(null);
			}
			setResponse(response);
		} catch (error) {
			Alert.alert('Error', 'Failed to load appointment data');
		} finally {
			setIsLoading(false);
		}
	};

	const onRefresh = useCallback(async () => {
		setRefreshing(true);
		await fetchUpcomingAppointment();
		setRefreshing(false);
	}, []);

	const formatTime = (timeSlot: string) => {
		const [hours, minutes] = timeSlot.split(':');
		const hour = parseInt(hours);
		const ampm = hour >= 12 ? 'PM' : 'AM';
		const displayHour = hour % 12 || 12;
		return `${displayHour}:${minutes} ${ampm}`;
	};

	const formatDate = (dateString: string) => {
		// Handle dd/mm/yyyy format from API
		if (dateString.includes('/')) {
			const [day, month, year] = dateString.split('/');
			const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
			return date.toLocaleDateString('es-ES', {
				weekday: 'long',
				year: 'numeric',
				month: 'long',
				day: 'numeric',
			});
		} else {
			// Fallback to standard date parsing
			const date = new Date(dateString);
			return date.toLocaleDateString('es-ES', {
				weekday: 'long',
				year: 'numeric',
				month: 'long',
				day: 'numeric',
			});
		}
	};

	const isWithin30Minutes = (appointment: Appointment) => {
		const appointmentDateTime = new Date(appointment.appointmentDate);
		const currentTime = new Date();
		const timeDifferenceMs = appointmentDateTime.getTime() - currentTime.getTime();
		const timeDifferenceMinutes = timeDifferenceMs / (1000 * 60);
		return timeDifferenceMinutes <= 30;
	};

	const canRescheduleAppointment = (appointment: Appointment) => {
		const validStatus = appointment.status === 'confirmed' || appointment.status === 'pending';
		const validRescheduleCount = (appointment.rescheduleCount || 0) < 1;
		const notWithin30Minutes = !isWithin30Minutes(appointment);
		// Since this is the upcoming appointment from the API, it should be the closest one
		const isClosest = true; // The upcomingAppointment is already the closest one
		return validStatus && validRescheduleCount && notWithin30Minutes && isClosest;
	};

	return (
		<ScreenWrapper showBottomFade={true} showTopFade={false} isLoading={isLoading}>
			<ScrollView
				refreshControl={
					<RefreshControl
						refreshing={refreshing}
						onRefresh={onRefresh}
						tintColor={Colors.dark.primary}
						colors={[Colors.dark.primary]}
					/>
				}
			>
				<View
					style={{
						flexDirection: 'row',
						justifyContent: 'space-between',
						alignItems: 'center',
						padding: 20,
					}}
				>
					<ThemeText style={{ fontSize: 24, fontWeight: 'bold' }}>
						Inicio
					</ThemeText>
				</View>

				<Container>
					<View style={{ marginBottom: 20 }}>
						<ThemeText
							style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 5 }}
						>
							Hola, {user?.firstName || 'Usuario'}!
						</ThemeText>

						{isLoading ? (
							<ThemeText
								style={{
									fontSize: 16,
									marginBottom: 5,
									color: Colors.dark.textLight,
								}}
							>
								Cargando citas...
							</ThemeText>
						) : upcomingAppointment ? (
							<>
								<ThemeText
									style={{
										fontSize: 16,
										marginBottom: 5,
										color: Colors.dark.textLight,
									}}
								>
									Tienes una cita agendada para las {formatTime(upcomingAppointment.timeSlot)}
								</ThemeText>
								<ThemeText style={{ fontSize: 16, color: Colors.dark.textLight, marginBottom: 5 }}>
									Fecha: {formatDate(upcomingAppointment.appointmentDate)}
								</ThemeText>
								{upcomingAppointment.barber && (
									<ThemeText style={{ fontSize: 16, color: Colors.dark.textLight }}>
										Tu barbero es: {upcomingAppointment.barber.name}
									</ThemeText>
								)}
								{upcomingAppointment.service && (
									<ThemeText style={{ fontSize: 16, color: Colors.dark.textLight }}>
										Servicio: {upcomingAppointment.service.name}
									</ThemeText>
								)}
							</>
						) : (
							<ThemeText
								style={{
									fontSize: 16,
									marginBottom: 5,
									color: Colors.dark.textLight,
								}}
							>
								No tienes citas agendadas
							</ThemeText>
						)}
					</View>

					<View
						style={{
							flex: 1,
							flexDirection: 'row',
							justifyContent: 'space-between',
							marginBottom: 20,
						}}
					>
						<Button onPress={() => router.push('/appointment')}>
							Agendar cita
						</Button>
						<Button
							secondary
							disabled={!upcomingAppointment || (upcomingAppointment && !canRescheduleAppointment(upcomingAppointment))}
							onPress={() => {
								if (upcomingAppointment) {
									if (!canRescheduleAppointment(upcomingAppointment)) {
										if (isWithin30Minutes(upcomingAppointment)) {
											Alert.alert('No se puede reprogramar', 'No se puede reprogramar una cita 30 minutos antes de la hora programada');
										} else {
											Alert.alert('No se puede reprogramar', 'Esta cita ya no puede ser reprogramada');
										}
										return;
									}
									try {
										// Add a small delay to show button press feedback
										setTimeout(() => {
											router.push(`/appointment/reschedule/${upcomingAppointment.id}`);
										}, 100);
									} catch (error) {
										Alert.alert('Error', 'No se pudo abrir la página de reprogramación');
									}
								} else {
									Alert.alert('Sin citas', 'No tienes citas disponibles para reprogramar');
								}
							}}
						>
							{upcomingAppointment 
								? (canRescheduleAppointment(upcomingAppointment) 
									? 'Reagendar' 
									: isWithin30Minutes(upcomingAppointment) 
										? 'Muy pronto' 
										: 'No disponible')
								: 'Sin citas'
							}
						</Button>
					</View>

					<AppointmentReminder appointment={upcomingAppointment} />
				</Container>

				<View
					style={{ marginTop: 20, marginBottom: 20, paddingHorizontal: 20 }}
				>
					<ThemeText
						style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 15 }}
					>
						Enlaces
					</ThemeText>
					<Link
						href="/(tabs)/history"
						style={{
							flexDirection: 'row',
							justifyContent: 'space-between',
							alignItems: 'center',
							marginBottom: 15,
						}}
					>
						<ThemeText style={{ fontSize: 16, color: Colors.dark.text }}>
							Mis citas{'  '}
						</ThemeText>
						<ThemeText style={{ fontSize: 20, color: Colors.dark.text }}>
							→
						</ThemeText>
					</Link>

					<Link
						href="/history"
						style={{
							flexDirection: 'row',
							justifyContent: 'space-between',
							alignItems: 'center',
							marginBottom: 15,
						}}
					>
						<ThemeText style={{ fontSize: 16, color: Colors.dark.text }}>
							Historial de citas{'  '}
						</ThemeText>
						<ThemeText style={{ fontSize: 20, color: Colors.dark.text }}>
							→
						</ThemeText>
					</Link>

					<Link
						href="/profile"
						style={{
							flexDirection: 'row',
							justifyContent: 'space-between',
							alignItems: 'center',
							marginBottom: 15,
						}}
					>
						<ThemeText style={{ fontSize: 16, color: Colors.dark.text }}>
							Perfil{'  '}
						</ThemeText>
						<ThemeText style={{ fontSize: 20, color: Colors.dark.text }}>
							→
						</ThemeText>
					</Link>

					{/* Admin Panel link - only visible for admin/staff users */}
					{user && (user.isAdmin === true || user.role === 'staff') && (
						<Link
							href="/admin"
							style={{
								flexDirection: 'row',
								justifyContent: 'space-between',
								alignItems: 'center',
								marginBottom: 15,
								backgroundColor: Colors.dark.primary + '20',
								padding: 10,
								borderRadius: 8,
								borderLeftWidth: 3,
								borderLeftColor: Colors.dark.primary,
							}}
						>
							<ThemeText style={{ fontSize: 16, color: Colors.dark.primary, fontWeight: '600' }}>
								Panel de Administración{'  '}
							</ThemeText>
							<ThemeText style={{ fontSize: 20, color: Colors.dark.primary }}>
								→
							</ThemeText>
						</Link>
					)}
				</View>
			</ScrollView>
		</ScreenWrapper>
	);
}
