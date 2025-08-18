// React core imports
import React, { useState, useEffect } from 'react';

// React Native core imports
import { StatusBar, View, FlatList, ScrollView, Alert, ActivityIndicator, Pressable, Linking, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as WebBrowser from 'expo-web-browser';
import * as ExpoLinking from 'expo-linking';

// Third-party library imports
import MaskedView from '@react-native-masked-view/masked-view';
import { LinearGradient } from 'expo-linear-gradient';

// Local imports
import { ThemeText, Container } from '@/components/Themed';
import Button from '@/components/Button';
import ServiceCard from '@/components/services/Card';
import AppointmentDatePicker from '@/components/ui/AppointmentDatePicker';
import ScreenWrapper from '@/components/ui/ScreenWrapper';
import Colors from '@/constants/Colors';
import { haircuts, spa, ServiceInterface } from '@/constants/services';
import { router, Stack } from 'expo-router';
import { useAuth } from '@/components/auth/AuthContext';
import { ServicesService, AppointmentsService, PaymentsService, apiClient } from '@/services';
import { Service, CreateAppointmentData } from '@/services';
import { API_CONFIG } from '@/config/api';

interface Barber {
	id: string;
	name: string;
	email: string;
	firstName: string;
	lastName: string;
}

export default function AppointmentScreen() {
	const { user } = useAuth();
	const [services, setServices] = useState<Service[]>([]);
	const [barbers, setBarbers] = useState<Barber[]>([]);
	const [selectedService, setSelectedService] = useState<Service | null>(null);
	const [selectedBarber, setSelectedBarber] = useState<Barber | null>(null);
	const [selectedDate, setSelectedDate] = useState<string>('');
	const [selectedTime, setSelectedTime] = useState<string>('');
	const [paymentType, setPaymentType] = useState<'full' | 'advance'>('full');
	const [isLoading, setIsLoading] = useState(true);
	const [isLoadingBarbers, setIsLoadingBarbers] = useState(false);
	const [isBooking, setIsBooking] = useState(false);
	const [selectedServiceName, setSelectedServiceName] = useState<string | null>(null);
	const [barberError, setBarberError] = useState<string | null>(null);
	const [servicesError, setServicesError] = useState<string | null>(null);
	const [isMounted, setIsMounted] = useState(true);
	const [alertShown, setAlertShown] = useState(false); // Local flag to prevent duplicate alerts
	const [paymentCancelled, setPaymentCancelled] = useState(false); // Track if payment was cancelled
	const [hasAttemptedLoad, setHasAttemptedLoad] = useState(false);


	useEffect(() => {
		setIsMounted(true);
	}, []);

	// Effect to handle initial load and user state changes
	useEffect(() => {
		if (user && !hasAttemptedLoad) {
			loadInitialData();
			setHasAttemptedLoad(true);
		} else if (!user && hasAttemptedLoad) {
			// Reset state when user becomes unavailable
			setServices([]);
			setBarbers([]);
			setSelectedService(null);
			setSelectedBarber(null);
			setHasAttemptedLoad(false);
			setIsLoading(false);
		}
	}, [user, hasAttemptedLoad]);

	// Note: Deep link handling has been moved to the global layout
	// This ensures payment callbacks work from anywhere in the app

	const loadInitialData = async () => {
		try {
			setIsLoading(true);

			// Load services and barbers in parallel with proper error handling
			const [servicesResult, barbersResult] = await Promise.allSettled([
				loadServices(),
				loadBarbers()
			]);

		} catch (error) {
			// Error handling silently
		} finally {
			setIsLoading(false);
		}
	};

	const retryLoadServices = async () => {
		try {
			console.log('🔄 Retrying services load...');
			setServices([]); // Clear existing services
			setServicesError(null); // Clear any previous errors

			// Clear services cache to force fresh load
			ServicesService.clearCache();

			await loadServices();
		} catch (error) {
			console.error('❌ Error retrying services load:', error);
			setServicesError('Error al cargar servicios. Por favor, intenta nuevamente.');
		}
	};

	const retryLoadBarbers = async () => {
		try {
			console.log('🔄 Retrying barbers load...');
			setBarbers([]); // Clear existing barbers
			setBarberError(null); // Clear any previous errors

			await loadBarbers();
		} catch (error) {
			console.error('❌ Error retrying barbers load:', error);
			setBarberError('Error al cargar barberos. Por favor, intenta nuevamente.');
		}
	};

	const retryLoadAll = async () => {
		try {
			console.log('🔄 Retrying all data load...');
			setIsLoading(true);
			setServices([]);
			setBarbers([]);
			setServicesError(null);
			setBarberError(null);

			// Clear services cache to force fresh load
			ServicesService.clearCache();

			// Load both in parallel
			await Promise.allSettled([
				loadServices(),
				loadBarbers()
			]);
		} catch (error) {
			console.error('❌ Error retrying all data load:', error);
		} finally {
			setIsLoading(false);
		}
	};

	const loadServices = async () => {
		try {
			// Reset services and error state
			setServices([]);
			setServicesError(null);

			console.log('🔄 Loading services from:', `${API_CONFIG.baseURL}/services`);

			// Use the optimized service with caching
			const response = await ServicesService.getAllServices();

			console.log('📡 Services API Response:', response);

			if (response.success && response.data) {
				console.log('🎯 Services loaded:', response.data.length);
				setServices(response.data);
			} else {
				console.error('Failed to load services:', response.error);
				setServicesError('No se pudieron cargar los servicios. Por favor, intenta nuevamente.');
			}
		} catch (error) {
			console.error('Error loading services:', error);

			// Log detailed error information for debugging
			if (error instanceof Error) {
				console.log('🔍 Services error details:', {
					name: error.name,
					message: error.message,
					stack: error.stack
				});

				// Handle specific error types and set appropriate error messages
				if (error.name === 'AbortError') {
					console.log('⏰ Services request timed out');
					setServicesError('Tiempo de espera agotado. Por favor, intenta nuevamente.');
				} else if (error.message.includes('Network') || error.message.includes('fetch')) {
					console.log('🌐 Services network error');
					setServicesError('Error de conexión. Por favor, verifica tu internet e intenta nuevamente.');
				} else if (error.message.includes('404') || error.message.includes('not found')) {
					console.log('🔍 Services endpoint not found');
					setServicesError('No hay servicios disponibles en el sistema. Por favor, contacta al administrador.');
				} else if (error.message.includes('500') || error.message.includes('server')) {
					console.log('💥 Services server error');
					setServicesError('Error del servidor. Por favor, intenta más tarde.');
				} else {
					// Limit error message length to prevent truncation
					const errorMsg = error.message.length > 50 ?
						error.message.substring(0, 50) + '...' :
						error.message;
					setServicesError(`Error al cargar servicios: ${errorMsg}`);
				}
			} else {
				setServicesError('Error de conexión. Por favor, verifica tu internet e intenta nuevamente.');
			}
		}
	};

	// Network connectivity test
	const testNetworkConnectivity = async () => {
		try {
			console.log('🌐 Testing network connectivity to:', API_CONFIG.baseURL);
			const controller = new AbortController();
			const timeoutId = setTimeout(() => controller.abort(), 3000);

			const response = await fetch(`${API_CONFIG.baseURL}/health`, {
				method: 'GET',
				headers: {
					'Content-Type': 'application/json',
				},
				signal: controller.signal,
			});

			clearTimeout(timeoutId);
			console.log('✅ Network connectivity test successful:', response.status);
			return true;
		} catch (error) {
			console.log('❌ Network connectivity test failed:', error);
			return false;
		}
	};

	const loadBarbers = async () => {
		try {
			setIsLoadingBarbers(true);
			setBarberError(null);
			console.log('🔄 Loading barbers from:', `${API_CONFIG.baseURL}/users/staff`);

			// Use the optimized API client with caching
			const response = await apiClient.get<any[]>('/users/staff', true, true); // Use caching

			console.log('📡 Barber API Response:', response);

			if (response.success && response.data && Array.isArray(response.data)) {
				console.log('👥 Staff users found:', response.data.length);
				console.log('👥 Staff users data:', response.data);

				if (response.data.length === 0) {
					console.log('⚠️ No barbers found in response');
					setBarberError('No hay barberos disponibles en el sistema');
					setBarbers([]);
					setSelectedBarber(null);
					return;
				}

				const mappedBarbers = response.data.map((user: any) => ({
					id: user.id,
					name: `${user.firstName} ${user.lastName}`,
					email: user.email,
					firstName: user.firstName,
					lastName: user.lastName
				}));

				console.log('🎯 Mapped barbers:', mappedBarbers);
				setBarbers(mappedBarbers);

				// Auto-select Carlos Rodriguez if available
				const carlos = response.data.find((user: any) => user.email === 'barber@theroyalbarber.com');
				if (carlos) {
					const selectedCarlos = {
						id: carlos.id,
						name: `${carlos.firstName} ${carlos.lastName}`,
						email: carlos.email,
						firstName: carlos.firstName,
						lastName: carlos.lastName
					};
					console.log('🎯 Auto-selecting Carlos:', selectedCarlos);
					setSelectedBarber(selectedCarlos);
				} else if (response.data.length > 0) {
					// If Carlos not found, select the first available barber
					const firstBarber = response.data[0];
					const selectedFirstBarber = {
						id: firstBarber.id,
						name: `${firstBarber.firstName} ${firstBarber.lastName}`,
						email: firstBarber.email,
						firstName: firstBarber.firstName,
						lastName: firstBarber.lastName
					};
					console.log('🎯 Auto-selecting first barber:', selectedFirstBarber);
					setSelectedBarber(selectedFirstBarber);
				}
			} else {
				console.log('❌ API response failed or no data');
				console.log('❌ Response structure:', {
					success: response.success,
					hasData: !!response.data,
					isArray: Array.isArray(response.data),
					dataType: typeof response.data
				});
				setBarberError('No se pudieron cargar los barberos. Por favor, intenta nuevamente.');
				setBarbers([]);
				setSelectedBarber(null);
			}
		} catch (error) {
			console.error('❌ Error loading barbers:', error);

			// Log detailed error information for debugging
			if (error instanceof Error) {
				console.log('🔍 Barbers error details:', {
					name: error.name,
					message: error.message,
					stack: error.stack
				});
			}

			if (error instanceof Error) {
				if (error.name === 'AbortError') {
					setBarberError('Tiempo de espera agotado. Por favor, intenta nuevamente.');
				} else if (error.message.includes('Network') || error.message.includes('fetch')) {
					setBarberError('Error de conexión. Por favor, verifica tu internet e intenta nuevamente.');
				} else if (error.message.includes('404') || error.message.includes('not found')) {
					setBarberError('No hay barberos disponibles en el sistema. Por favor, contacta al administrador.');
				} else if (error.message.includes('500') || error.message.includes('server')) {
					setBarberError('Error del servidor. Por favor, intenta más tarde.');
				} else {
					// Limit error message length to prevent truncation
					const errorMsg = error.message.length > 50 ?
						error.message.substring(0, 50) + '...' :
						error.message;
					setBarberError(`Error al cargar barberos: ${errorMsg}`);
				}
			} else {
				setBarberError('Error de conexión. Por favor, verifica tu internet e intenta nuevamente.');
			}

			setBarbers([]);
			setSelectedBarber(null);
		} finally {
			setIsLoadingBarbers(false);
		}
	};

	const handleDateSelect = (date: string) => {
		setSelectedDate(date);
	};

	const handleTimeSelect = (time: string) => {
		setSelectedTime(time);
	};

	const handleServiceSelect = (service: Service) => {
		setSelectedService(service);
		setSelectedServiceName(service.name);
	};

	const handleBooking = async () => {

		if (!user?.id) {
			Alert.alert('Error', 'Please log in to book an appointment');
			return;
		}

		if (!selectedService || !selectedDate || !selectedTime || !selectedBarber) {
			Alert.alert('Error', 'Please select a barber, service, date, and time');
			return;
		}

		try {
			setIsBooking(true);
			setAlertShown(false); // Reset alert flag for new payment
			setPaymentCancelled(false); // Reset payment cancelled flag

					// Format date for API (expects dd/mm/yyyy format) - use timezone-safe parsing
		const formattedDate = (() => {
			// selectedDate is in ISO format (YYYY-MM-DD), parse it directly
			const [year, month, day] = selectedDate.split('-');
			return `${day}/${month}/${year}`;
		})();

            // Use HTTPS bounce pages (Safari-friendly) that immediately redirect to our app scheme; auth session will close automatically
            const successUrl = `https://theroyalbarber.com/payment/success?status=success&timeSlot=${encodeURIComponent(selectedTime)}&appointmentDate=${encodeURIComponent(formattedDate)}&serviceName=${encodeURIComponent(selectedService.name)}&barberName=${encodeURIComponent(selectedBarber.name)}&amount=${encodeURIComponent(selectedService.price.toString())}`;
            const cancelUrl = `https://theroyalbarber.com/payment/failed?status=cancel&timeSlot=${encodeURIComponent(selectedTime)}&appointmentDate=${encodeURIComponent(formattedDate)}&serviceName=${encodeURIComponent(selectedService.name)}&barberName=${encodeURIComponent(selectedBarber.name)}&amount=${encodeURIComponent(selectedService.price.toString())}&errorMessage=${encodeURIComponent('Pago cancelado por el usuario')}`;

            // (Kept for reference; not used in Checkout request)
            const altSuccessUrl = `theroyalbarber://payment/success?status=success&timeSlot=${encodeURIComponent(selectedTime)}&appointmentDate=${encodeURIComponent(formattedDate)}&serviceName=${encodeURIComponent(selectedService.name)}&barberName=${encodeURIComponent(selectedBarber.name)}&amount=${encodeURIComponent(selectedService.price.toString())}`;
            const altCancelUrl = `theroyalbarber://payment/failed?status=cancel&timeSlot=${encodeURIComponent(selectedTime)}&appointmentDate=${encodeURIComponent(formattedDate)}&serviceName=${encodeURIComponent(selectedService.name)}&barberName=${encodeURIComponent(selectedBarber.name)}&amount=${encodeURIComponent(selectedService.price.toString())}&errorMessage=${encodeURIComponent('Pago cancelado por el usuario')}`;

			// Simplified URLs for embedded browser compatibility
			const simpleSuccessUrl = `app://payment/success?status=success&timeSlot=${selectedTime}&appointmentDate=${formattedDate}&serviceName=${selectedService.name}&barberName=${selectedBarber.name}&amount=${selectedService.price}`;
			const simpleCancelUrl = `app://payment/failed?status=cancel&timeSlot=${selectedTime}&appointmentDate=${formattedDate}&serviceName=${selectedService.name}&barberName=${selectedBarber.name}&amount=${selectedService.price}&errorMessage=Pago cancelado por el usuario`;

			// For embedded browser compatibility, use the simplest possible URLs
			// The embedded browser has issues with complex URL encoding
			const embeddedSuccessUrl = `app://payment/success?status=success&timeSlot=${selectedTime}&appointmentDate=${formattedDate}&serviceName=${selectedService.name.replace(/[^a-zA-Z0-9\s]/g, '')}&barberName=${selectedBarber.name.replace(/[^a-zA-Z0-9\s]/g, '')}&amount=${selectedService.price}`;
			const embeddedCancelUrl = `app://payment/failed?status=cancel&timeSlot=${selectedTime}&appointmentDate=${formattedDate}&serviceName=${selectedService.name.replace(/[^a-zA-Z0-9\s]/g, '')}&barberName=${selectedBarber.name.replace(/[^a-zA-Z0-9\s]/g, '')}&amount=${selectedService.price}&errorMessage=Pago cancelado por el usuario`;

			console.log('🔗 Payment URLs created:');
            console.log('Primary Success URL (HTTPS bounce):', successUrl);
            console.log('Alternative Success URL (scheme):', altSuccessUrl);
            console.log('Primary Cancel URL (HTTPS bounce):', cancelUrl);
            console.log('Alternative Cancel URL (scheme):', altCancelUrl);
			console.log('Embedded Success URL:', embeddedSuccessUrl);
			console.log('Embedded Cancel URL:', embeddedCancelUrl);

			// Use the primary URLs for better compatibility
			const checkoutData = {
				serviceId: selectedService.id,
				paymentType: paymentType,
				successUrl: successUrl, // Use primary URL with proper encoding
				cancelUrl: cancelUrl,   // Use primary URL with proper encoding
				userId: user.id,
				appointmentData: {
					barberId: selectedBarber.id,
					appointmentDate: formattedDate,
					timeSlot: selectedTime,
					notes: undefined
				}
			};

			console.log('💳 Creating checkout session with data:', checkoutData);

            // No timeout-based fallbacks; deep link handler will redirect immediately on success

			const response = await PaymentsService.createCheckoutSession(checkoutData);

				if (response.success && response.data) {
				console.log('Checkout session created, opening in-app browser:', response.data.url);

				// Mark that a payment attempt is being made
				(global as any).paymentAttempted = true;
				console.log('💰 Payment attempt marked - evidence flag set');

                // Compute a return URL prefix so auth session closes for success OR failed
                const returnUrl = ExpoLinking.createURL('payment'); // resolves to app://payment

								// Start polling for payment completion since browser might get stuck
			let polling = true;
			let pollTimer: ReturnType<typeof setTimeout> | null = null;
			
			const deriveSessionId = (urlStr: string): string | null => {
				try {
					const url = new URL(urlStr);
					const byParam = url.searchParams.get('session_id');
					if (byParam) return byParam;
					const match = url.href.match(/cs_(?:test|live)_[A-Za-z0-9]+/);
					return match ? match[0] : null;
				} catch { return null; }
			};

			const sessionId = response.data.sessionId || deriveSessionId(response.data.url);
			console.log('🔍 Session ID for polling:', sessionId);
			
			if (sessionId) {
				const poll = async () => {
					if (!polling) return;
					console.log('🔄 Polling session status...');
					
					try {
						const statusResp = await PaymentsService.getCheckoutSessionStatus(sessionId);
						if (statusResp.success && statusResp.data) {
							const s = statusResp.data;
							console.log('📊 Session status:', s.status, 'Payment status:', s.paymentStatus);
							
							if (s.status === 'complete' || s.paymentStatus === 'paid') {
								console.log('✅ Payment completed via polling!');
								polling = false;
								
								// Force close the browser
								try { 
									WebBrowser.dismissBrowser(); 
									console.log('🔒 Browser dismissed');
								} catch (e) { 
									console.log('⚠️ Could not dismiss browser:', e);
								}
								
								// Navigate to success
								router.replace({ pathname: '/payment/success', params: {
									timeSlot: selectedTime,
									appointmentDate: formattedDate,
									serviceName: selectedService.name,
									barberName: selectedBarber.name,
									amount: String(selectedService.price),
								}});
								return;
							}
						}
					} catch (error) {
						console.log('❌ Poll error:', error);
					}
					
					// Schedule next poll
					pollTimer = setTimeout(poll, 2000);
				};
				
				// Start polling after browser opens
				pollTimer = setTimeout(poll, 3000);
			}

                // Use regular browser - we'll handle the redirect ourselves
                const result = await WebBrowser.openBrowserAsync(response.data.url, {
                    presentationStyle: WebBrowser.WebBrowserPresentationStyle.FULL_SCREEN,
                    showTitle: true,
                    enableBarCollapsing: true,
                    showInRecents: false,
                    toolbarColor: Colors.dark.background,
                    controlsColor: Colors.dark.primary,
                    dismissButtonStyle: 'cancel',
                    createTask: false,
                });

				console.log('WebBrowser result:', result);
				console.log('WebBrowser result type:', result.type);

				// Handle the browser result
                if (result.type === 'cancel') {
					console.log('❌ Payment cancelled by user');
					setPaymentCancelled(true);

					(global as any).paymentAttempted = false;
					console.log('💰 Payment evidence cleared - user cancelled');

                    // No global timeout/callbacks to clear

					const appointmentDate = formattedDate;
					const serviceName = selectedService.name;
					const barberName = selectedBarber.name;
					const amount = selectedService.price;
					const errorMessage = 'Pago cancelado por el usuario';

					if (isMounted) {
						try {
							router.replace({
								pathname: '/payment/failed',
								params: {
									timeSlot: selectedTime,
									appointmentDate,
									serviceName,
									barberName,
									amount,
									errorMessage,
								}
							});
						} catch (navError) {
							console.error('Navigation error:', navError);
							Alert.alert(
								'Error de Navegación',
								'No se pudo mostrar la pantalla de error. Por favor, intenta nuevamente.',
								[{ text: 'OK', style: 'default' }]
							);
						}
					} else {
						// Fallback if component is not mounted
						Alert.alert(
							'Pago Cancelado',
							'El pago fue cancelado. Tu cita no ha sido reservada. Puedes intentar nuevamente.',
							[{ text: 'OK', style: 'default' }]
						);
					}
                } else if (result.type === 'dismiss') {
                    // Browser was dismissed by user
                    console.log('🔕 Browser dismissed by user');
                    polling = false;
                    if (pollTimer) clearTimeout(pollTimer);
                }

                // Clean up polling
                polling = false;
                if (pollTimer) clearTimeout(pollTimer);
			} else {
				Alert.alert('Error', response.error || 'Failed to create payment session');
			}
		} catch (error) {
			console.error('Error creating payment session:', error);

			// Check if the error is related to navigation timing
			if (error instanceof Error && error.message.includes('Root Layout')) {
				Alert.alert(
					'Error de Navegación',
					'El sistema de navegación no está listo. Por favor, intenta nuevamente.',
					[{ text: 'OK', style: 'default' }]
				);
			} else {
				Alert.alert('Error', 'Failed to create payment session');
			}
		} finally {
			setIsBooking(false);
		}
	};

    // No timeout cleanup needed

	const formatTime = (time: string) => {
		const [hours, minutes] = time.split(':');
		const hour = parseInt(hours);
		const ampm = hour >= 12 ? 'PM' : 'AM';
		const displayHour = hour % 12 || 12;
		return `${displayHour}:${minutes} ${ampm}`;
	};

	const formatPrice = (price: string | number) => {
		const numericPrice = typeof price === 'string' ? parseFloat(price) : price;
		return new Intl.NumberFormat('es-MX', {
			style: 'currency',
			currency: 'MXN',
		}).format(numericPrice);
	};

	// Always render the main screen, handle loading states within the content
	return (
		<ScreenWrapper showBottomFade={true} showTopFade={false} isLoading={isLoading} edges={['top', 'bottom']}>
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
				<ThemeText style={styles.headerTitle}>Agendar Cita</ThemeText>
				<View style={styles.headerSpacer} />
			</View>

			<ScrollView contentContainerStyle={{ paddingTop: 0 }}>
				<Container style={{ paddingBottom: 30 }}>
					{/* Loading State */}
					{isLoading && (
						<View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 50 }}>
							<ActivityIndicator size="large" color={Colors.dark.primary} />
							<ThemeText style={{ marginTop: 10, textAlign: 'center' }}>
								Cargando servicios y barberos...
							</ThemeText>
						</View>
					)}

					{/* Error State - No Data */}
					{!isLoading && services.length === 0 && barbers.length === 0 && (
						<View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
							<ThemeText style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 10, textAlign: 'center' }}>
								No hay datos disponibles
							</ThemeText>
							<ThemeText style={{ marginBottom: 20, textAlign: 'center', color: Colors.dark.textLight }}>
								No se pudieron cargar los servicios o barberos. Esto puede deberse a:
							</ThemeText>
							<View style={{ marginBottom: 20, paddingHorizontal: 20 }}>
								<ThemeText style={{ marginBottom: 8, color: Colors.dark.textLight, fontSize: 14 }}>
									• Problemas de conexión a internet
								</ThemeText>
								<ThemeText style={{ marginBottom: 8, color: Colors.dark.textLight, fontSize: 14 }}>
									• Servicios temporalmente no disponibles
								</ThemeText>
								<ThemeText style={{ marginBottom: 8, color: Colors.dark.textLight, fontSize: 14 }}>
									• No hay barberos activos en el sistema
								</ThemeText>
							</View>
							<Button onPress={() => retryLoadAll()} style={{ marginBottom: 10 }}>
								Reintentar
							</Button>
							<Button secondary onPress={() => router.back()}>
								Volver
							</Button>
						</View>
					)}

					{/* Main Content - Only show when not loading and we have some data */}
					{!isLoading && (services.length > 0 || barbers.length > 0) && (
						<>
							{/* Barber Selection */}
							<View style={{ marginBottom: 30, marginTop: 0 }}>
								<ThemeText style={{ fontSize: 18, fontWeight: 'bold', marginVertical: 15 }}>
									Seleccionar Barbero
								</ThemeText>

								{barbers.length === 0 ? (
									<View style={{
										padding: 20,
										backgroundColor: Colors.dark.gray,
										borderRadius: 10,
										alignItems: 'center'
									}}>
										{isLoadingBarbers ? (
											<>
												<ActivityIndicator size="small" color={Colors.dark.primary} style={{ marginBottom: 10 }} />
												<ThemeText style={{
													textAlign: 'center',
													color: Colors.dark.textLight,
													marginBottom: 5
												}}>
													Cargando barberos...
												</ThemeText>
											</>
										) : (
											<>
												<ThemeText style={{
													textAlign: 'center',
													color: Colors.dark.textLight,
													marginBottom: 5
												}}>
													{barberError || 'No hay barberos disponibles'}
												</ThemeText>
												<ThemeText style={{
													textAlign: 'center',
													color: Colors.dark.textLight,
													fontSize: 12,
													marginBottom: 10
												}}>
													Por favor contacta al administrador
												</ThemeText>
												<Button
													onPress={() => retryLoadBarbers()}
													style={{ marginTop: 5 }}
													secondary
													disabled={isLoadingBarbers}
												>
													{isLoadingBarbers ? 'Cargando...' : 'Reintentar'}
												</Button>
											</>
										)}
									</View>
								) : (
									<ScrollView
										horizontal
										showsHorizontalScrollIndicator={false}
										contentContainerStyle={{ paddingHorizontal: 5 }}
									>
										{barbers.map((barber, index) => (
											<Pressable
												key={barber.id}
												onPress={() => {
													setSelectedBarber(barber);
													// Reset date and time when barber changes
													setSelectedDate('');
													setSelectedTime('');
												}}
												style={{
													width: 120,
													marginRight: index === barbers.length - 1 ? 0 : 15,
													padding: 15,
													backgroundColor: selectedBarber?.id === barber.id ? Colors.dark.primary : Colors.dark.background,
													borderColor: selectedBarber?.id === barber.id ? Colors.dark.primary : Colors.dark.gray,
													borderWidth: 1,
													borderRadius: 10,
													alignItems: 'center'
												}}
											>
												<View style={{
													width: 50,
													height: 50,
													borderRadius: 25,
													backgroundColor: selectedBarber?.id === barber.id ? 'rgba(255,255,255,0.2)' : Colors.dark.gray,
													justifyContent: 'center',
													alignItems: 'center',
													marginBottom: 8
												}}>
													<ThemeText style={{
														fontSize: 18,
														fontWeight: 'bold',
														color: selectedBarber?.id === barber.id ? Colors.dark.background : Colors.dark.text
													}}>
														{barber.firstName.charAt(0)}{barber.lastName.charAt(0)}
													</ThemeText>
												</View>
												<ThemeText style={{
													fontSize: 12,
													fontWeight: '600',
													textAlign: 'center',
													color: selectedBarber?.id === barber.id ? Colors.dark.background : Colors.dark.text
												}}>
													{barber.firstName}
												</ThemeText>
												<ThemeText style={{
													fontSize: 12,
													textAlign: 'center',
													color: selectedBarber?.id === barber.id ? Colors.dark.background : Colors.dark.text
												}}>
													{barber.lastName}
												</ThemeText>
											</Pressable>
										))}
									</ScrollView>
								)}
							</View>

							{/* Services Section - Fixed Height Vertical Scroll */}
							<View style={{ marginBottom: 30 }}>
								<ThemeText style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 15 }}>
									Seleccionar Servicio
								</ThemeText>
								<ScrollView
									showsVerticalScrollIndicator={false}
									style={{
										height: 220, // Fixed height to maintain layout
										borderRadius: 10,
										backgroundColor: 'rgba(255, 255, 255, 0.05)'
									}}
									contentContainerStyle={{
										padding: 10,
										gap: 12
									}}
								>
									{services.length === 0 ? (
										<View style={{
											padding: 20,
											backgroundColor: Colors.dark.gray,
											borderRadius: 10,
											alignItems: 'center'
										}}>
											{servicesError ? (
												<>
													<ThemeText style={{
														textAlign: 'center',
														color: Colors.dark.textLight,
														marginBottom: 5
													}}>
														{servicesError}
													</ThemeText>
													<ThemeText style={{
														textAlign: 'center',
														color: Colors.dark.textLight,
														fontSize: 12,
														marginBottom: 10
													}}>
														Por favor contacta al administrador
													</ThemeText>
													<Button
														onPress={() => retryLoadServices()}
														style={{ marginTop: 5 }}
														secondary
													>
														Reintentar
													</Button>
												</>
											) : (
												<>
													<ThemeText style={{
														textAlign: 'center',
														color: Colors.dark.textLight,
														marginBottom: 5
													}}>
														No hay servicios disponibles
													</ThemeText>
													<Button
														onPress={() => retryLoadServices()}
														style={{ marginTop: 5 }}
														secondary
													>
														Reintentar
													</Button>
												</>
											)}
										</View>
									) : (
										services.map((service) => (
											<ServiceCard
												key={service.id}
												title={service.name}
												price={service.price}
												description={service.description || ''}
												selected={[selectedServiceName, (serviceName) => {
													setSelectedServiceName(serviceName);
													if (serviceName) {
														const foundService = services.find(s => s.name === serviceName);
														setSelectedService(foundService || null);
													} else {
														setSelectedService(null);
													}
												}]}
											/>
										))
									)}
								</ScrollView>
							</View>

							{/* Payment Type Selection */}
							{selectedService && (
								<View style={{ marginBottom: 30 }}>
									<ThemeText style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 15 }}>
										Tipo de Pago
									</ThemeText>
									<View style={{ flexDirection: 'row', gap: 15 }}>
										<Pressable
											onPress={() => setPaymentType('full')}
											style={{
												flex: 1,
												padding: 15,
												backgroundColor: paymentType === 'full' ? Colors.dark.primary : Colors.dark.background,
												borderColor: paymentType === 'full' ? Colors.dark.primary : Colors.dark.gray,
												borderWidth: 1,
												borderRadius: 10,
												alignItems: 'center'
											}}
										>
											<ThemeText style={{
												fontSize: 16,
												fontWeight: '600',
												color: paymentType === 'full' ? Colors.dark.background : Colors.dark.text,
												marginBottom: 5
											}}>
												Pago Completo
											</ThemeText>
											<ThemeText style={{
												fontSize: 14,
												color: paymentType === 'full' ? Colors.dark.background : Colors.dark.textLight
											}}>
												{formatPrice(selectedService.price)}
											</ThemeText>
										</Pressable>

										<Pressable
											onPress={() => setPaymentType('advance')}
											style={{
												flex: 1,
												padding: 15,
												backgroundColor: paymentType === 'advance' ? Colors.dark.primary : Colors.dark.background,
												borderColor: paymentType === 'advance' ? Colors.dark.primary : Colors.dark.gray,
												borderWidth: 1,
												borderRadius: 10,
												alignItems: 'center'
											}}
										>
											<ThemeText style={{
												fontSize: 16,
												fontWeight: '600',
												color: paymentType === 'advance' ? Colors.dark.background : Colors.dark.text,
												marginBottom: 5
											}}>
												Anticipo (50%)
											</ThemeText>
											<ThemeText style={{
												fontSize: 14,
												color: paymentType === 'advance' ? Colors.dark.background : Colors.dark.textLight
											}}>
												{formatPrice(parseFloat(selectedService.price) * 0.5)}
											</ThemeText>
										</Pressable>
									</View>
									<ThemeText style={{
										fontSize: 12,
										color: Colors.dark.textLight,
										textAlign: 'center',
										marginTop: 10
									}}>
										{paymentType === 'advance'
											? 'Pagarás el resto del servicio en la barbería'
											: 'Pago completo del servicio'
										}
									</ThemeText>
								</View>
							)}

							{/* Date and Time Selection */}
							<View style={{ marginBottom: 30 }}>
								{selectedBarber && (
									<AppointmentDatePicker
										barberId={selectedBarber.id}
										onDateSelect={setSelectedDate}
										onTimeSelect={setSelectedTime}
										showConfirmButton={false}
										showSummary={false}
										title="Seleccionar Fecha y Hora"
										subtitle="Elige la fecha y hora de tu cita"
									/>
								)}
								{!selectedBarber && (
									<View style={{ padding: 15, backgroundColor: Colors.dark.gray, borderRadius: 10 }}>
										<ThemeText style={{ textAlign: 'center', color: Colors.dark.textLight }}>
											Por favor selecciona un barbero primero
										</ThemeText>
									</View>
								)}
							</View>

							{/* Booking Summary */}
							{selectedBarber && selectedService && selectedDate && selectedTime && (
								<View style={{ marginBottom: 30, padding: 15, backgroundColor: Colors.dark.gray, borderRadius: 10 }}>
									<ThemeText style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 10 }}>
										Resumen de la Cita
									</ThemeText>
									<ThemeText style={{ marginBottom: 5 }}>
										Barbero: {selectedBarber.name}
									</ThemeText>
									<ThemeText style={{ marginBottom: 5 }}>
										Servicio: {selectedService.name}
									</ThemeText>
									<ThemeText style={{ marginBottom: 5 }}>
										Precio del servicio: {formatPrice(selectedService.price)}
									</ThemeText>
									<ThemeText style={{ marginBottom: 5, fontWeight: '600', color: Colors.dark.primary }}>
										Monto a pagar: {paymentType === 'full'
											? formatPrice(selectedService.price)
											: formatPrice(parseFloat(selectedService.price) * 0.5)
										} ({paymentType === 'full' ? 'Pago completo' : 'Anticipo 50%'})
									</ThemeText>
									<ThemeText style={{ marginBottom: 5 }}>
										Duración: {selectedService.duration} minutos
									</ThemeText>
									<ThemeText style={{ marginBottom: 5 }}>
										Fecha: {new Date(selectedDate).toLocaleDateString('es-ES')}
									</ThemeText>
									<ThemeText>
										Hora: {formatTime(selectedTime)}
									</ThemeText>
									{paymentType === 'advance' && (
										<View style={{
											marginTop: 10,
											padding: 10,
											backgroundColor: 'rgba(255, 193, 7, 0.1)',
											borderRadius: 5,
											borderLeftWidth: 3,
											borderLeftColor: '#ffc107'
										}}>
											<ThemeText style={{ fontSize: 12, color: '#ffc107', fontWeight: '500' }}>
												💡 Recordatorio: Pagarás el resto ({formatPrice(parseFloat(selectedService.price) * 0.5)}) en la barbería
											</ThemeText>
										</View>
									)}
								</View>
							)}

							{/* Payment Info */}
							{selectedBarber && selectedService && selectedDate && selectedTime && (
								<View style={{
									marginBottom: 20,
									padding: 12,
									backgroundColor: 'rgba(75, 181, 67, 0.1)',
									borderRadius: 8,
									borderLeftWidth: 3,
									borderLeftColor: '#4bb543'
								}}>
									<ThemeText style={{ fontSize: 12, color: '#4bb543', fontWeight: '500' }}>
										🔒 Pago seguro con Stripe • Tu cita se confirmará automáticamente
									</ThemeText>
								</View>
							)}

							{/* Book Button */}
							<Button
								onPress={handleBooking}
								disabled={!selectedBarber || !selectedService || !selectedDate || !selectedTime || isBooking}
								style={{ marginBottom: 20 }}
							>
								{isBooking ? 'Creando sesión de pago...' : '💳 Pagar y Reservar'}
							</Button>

							<Button secondary onPress={() => router.back()}>
								Cancelar
							</Button>
						</>
					)}
				</Container>
			</ScrollView>
		</ScreenWrapper>
	);
}

const styles = StyleSheet.create({
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
