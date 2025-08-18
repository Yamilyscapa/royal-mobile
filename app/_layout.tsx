// React core imports
import React, { useEffect } from 'react';

// Third-party library imports
import {
	DarkTheme,
	DefaultTheme,
	ThemeProvider,
} from '@react-navigation/native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useFonts } from 'expo-font';
import { Stack, useRouter } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Alert } from 'react-native';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import 'react-native-reanimated';

// Local imports
import { AuthProvider, useAuth } from '@/components/auth/AuthContext';
import LoadingScreen from '@/components/auth/LoadingScreen';

export {
	// Catch any errors thrown by the Layout component.
	ErrorBoundary,
} from 'expo-router';

export const unstable_settings = {
	// Ensure that reloading on `/modal` keeps a back button present.
	// Removed initialRouteName to let the navigation logic handle routing
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

function RootLayoutNav() {
	const { user, isLoading, isFirstTime } = useAuth();
	const [forceUpdate, setForceUpdate] = React.useState(0);
	const router = useRouter();



	// Force re-render when auth state changes
	React.useEffect(() => {
		const timer = setTimeout(() => {
			setForceUpdate(prev => prev + 1);
		}, 100);
		return () => clearTimeout(timer);
	}, [user, isLoading, isFirstTime]);

	// Add a fallback timeout to prevent infinite loading
	const [showFallback, setShowFallback] = React.useState(false);
	
	React.useEffect(() => {
		const timer = setTimeout(() => {
			if (isLoading) {
				setShowFallback(true);
			}
		}, 8000); // Increased to 8 second timeout
		
		return () => clearTimeout(timer);
	}, [isLoading]);

    // Global deep link handling for payment callbacks
	React.useEffect(() => {
        // Track alert state and cancellation state (used for non-timeout fallbacks)
        let alertShown = false;
        let paymentCancelled = false;

		const handleUrl = (url: string) => {
			console.log('🔗 Global URL handler received:', url);
			
			// Normalize URL to handle both schemes
			const normalizedUrl = url.replace('theroyalbarber://', 'app://');
			
            // Reset flags when a payment-related deep link is received
            if (normalizedUrl.includes('app://payment/') || normalizedUrl.includes('app://payment-callback')) {
                alertShown = false;
                paymentCancelled = false;
            }
			
            // Handle payment success URLs (custom schemes and HTTPS bounce page)
            if (
                normalizedUrl.includes('app://payment/success') ||
                normalizedUrl.includes('theroyalbarber://payment/success') ||
                normalizedUrl.includes('https://theroyalbarber.com/payment/success')
            ) {
                // Close any open WebBrowser session
                try { WebBrowser.dismissBrowser(); } catch {}
				
				// Clear payment evidence since payment was successful
				(global as any).paymentAttempted = false;
				console.log('💰 Payment evidence cleared - payment successful');
				
				// Parse URL parameters with better error handling
				let urlObj;
				try {
					urlObj = new URL(url);
				} catch (urlError) {
                    // If URL parsing fails, still navigate to success screen without delays
                    router.replace({ pathname: '/payment/success' });
                    return;
				}
				
                const status = urlObj.searchParams.get('status');
				const timeSlot = urlObj.searchParams.get('timeSlot');
				
                // Always navigate to success screen immediately (no timeouts or alerts)
                const appointmentDate = urlObj.searchParams.get('appointmentDate');
                const serviceName = urlObj.searchParams.get('serviceName');
                const barberName = urlObj.searchParams.get('barberName');
                const amount = urlObj.searchParams.get('amount');

                const decodedParams = {
                    timeSlot: timeSlot ? decodeURIComponent(timeSlot) : undefined,
                    appointmentDate: appointmentDate ? decodeURIComponent(appointmentDate) : undefined,
                    serviceName: serviceName ? decodeURIComponent(serviceName) : undefined,
                    barberName: barberName ? decodeURIComponent(barberName) : undefined,
                    amount: amount ? decodeURIComponent(amount) : undefined,
                } as Record<string, string | undefined>;

                try {
                    if (user && !isLoading) {
                        router.replace({ pathname: '/payment/success', params: decodedParams });
                    } else {
                        // Navigate without waiting; router will handle stack readiness
                        router.replace({ pathname: '/payment/success', params: decodedParams });
                    }
                } catch (navError) {
                    // As a last resort, navigate to success without params
                    router.replace({ pathname: '/payment/success' });
                }
			}
            // Handle payment failure URLs (custom schemes and HTTPS bounce page)
            else if (
                normalizedUrl.includes('app://payment/failed') ||
                normalizedUrl.includes('theroyalbarber://payment/failed') ||
                normalizedUrl.includes('https://theroyalbarber.com/payment/failed')
            ) {
                // Close any open WebBrowser session
                try { WebBrowser.dismissBrowser(); } catch {}
				
				// Clear payment evidence since payment failed
				(global as any).paymentAttempted = false;
				console.log('💰 Payment evidence cleared - payment failed');
				
				// Parse URL parameters with better error handling
				let urlObj;
				try {
					urlObj = new URL(url);
				} catch (urlError) {
					console.error('Failed to parse URL:', url, urlError);
					return;
				}
				
				const status = urlObj.searchParams.get('status');
				const timeSlot = urlObj.searchParams.get('timeSlot');
				
				// Handle failure even if some parameters are missing (embedded browser limitation)
				if (status === 'cancel') {
					// Navigate to failed screen with error details
					const appointmentDate = urlObj.searchParams.get('appointmentDate');
					const serviceName = urlObj.searchParams.get('serviceName');
					const barberName = urlObj.searchParams.get('barberName');
					const amount = urlObj.searchParams.get('amount');
					const errorMessage = urlObj.searchParams.get('errorMessage') || 'El pago no se pudo procesar. Por favor, intenta nuevamente.';
					
					// Decode URL parameters
					const decodedParams = {
						timeSlot: timeSlot ? decodeURIComponent(timeSlot) : 'TBD',
						appointmentDate: appointmentDate ? decodeURIComponent(appointmentDate) : 'TBD',
						serviceName: serviceName ? decodeURIComponent(serviceName) : 'Servicio',
						barberName: barberName ? decodeURIComponent(barberName) : 'Barbero',
						amount: amount ? decodeURIComponent(amount) : '0',
						errorMessage: errorMessage ? decodeURIComponent(errorMessage) : 'El pago no se pudo procesar. Por favor, intenta nuevamente.',
					};
					
					console.log('Attempting to navigate to failed screen with params:', decodedParams);
					
					// Wait for navigation to be ready and user to be authenticated
					const attemptNavigation = () => {
						try {
							// Check if user is authenticated and navigation is ready
							if (user && !isLoading) {
								router.replace({
									pathname: '/payment/failed',
									params: decodedParams
								});
								console.log('✅ Successfully navigated to payment failed screen');
								return true; // Navigation successful
							} else {
								console.log('Navigation not ready yet, retrying...');
								return false; // Navigation failed, will retry
							}
						} catch (navError) {
							console.error('Global navigation error in failure handler:', navError);
							// Fallback to alert if navigation fails
							WebBrowser.dismissBrowser();
							Alert.alert(
								'Pago Fallido',
								decodedParams.errorMessage || 'El pago no se pudo procesar. Por favor, intenta nuevamente.',
								[{ text: 'OK', onPress: () => router.replace('/(tabs)') }]
							);
							return true; // Don't retry after fallback
						}
					};
					
					// Try navigation immediately
					if (!attemptNavigation()) {
						// If failed, retry with increasing delays
						const retryDelays = [500, 1000, 2000];
						retryDelays.forEach((delay, index) => {
							setTimeout(() => {
								if (!attemptNavigation()) {
									console.log(`Navigation attempt ${index + 1} failed, will retry in ${retryDelays[index + 1] || 3000}ms`);
								}
							}, delay);
						});
						
						// Final fallback after 5 seconds
						setTimeout(() => {
							console.log('🔄 Final fallback: Showing failure alert');
							WebBrowser.dismissBrowser();
							Alert.alert(
								'Pago Fallido',
								decodedParams.errorMessage || 'El pago no se pudo procesar. Por favor, intenta nuevamente.',
								[{ text: 'OK', onPress: () => router.replace('/(tabs)') }]
							);
						}, 5000);
					}
				} else {
					console.warn('Invalid failure URL parameters:', { status, timeSlot });
					// Show failure message even if parameters are invalid
					WebBrowser.dismissBrowser();
					Alert.alert(
						'Pago Fallido',
						'El pago no se pudo procesar. Por favor, intenta nuevamente.',
						[{ text: 'OK', onPress: () => router.replace('/(tabs)') }]
					);
				}
			}
            // Handle legacy payment-callback URLs for backward compatibility (both schemes)
			else if (normalizedUrl.includes('app://payment-callback')) {
                // Close any open WebBrowser session
                try { WebBrowser.dismissBrowser(); } catch {}
				
				// Parse URL parameters with better error handling
				let urlObj;
				try {
					urlObj = new URL(url);
				} catch (urlError) {
					console.error('Failed to parse URL:', url, urlError);
					return;
				}
				
				const status = urlObj.searchParams.get('status');
				const timeSlot = urlObj.searchParams.get('timeSlot');
				
                // Handle legacy success immediately without timeouts
                if (status === 'success') {
                    const appointmentDate = urlObj.searchParams.get('appointmentDate');
                    const serviceName = urlObj.searchParams.get('serviceName');
                    const barberName = urlObj.searchParams.get('barberName');
                    const amount = urlObj.searchParams.get('amount');

                    const decodedParams = {
                        timeSlot: timeSlot ? decodeURIComponent(timeSlot) : undefined,
                        appointmentDate: appointmentDate ? decodeURIComponent(appointmentDate) : undefined,
                        serviceName: serviceName ? decodeURIComponent(serviceName) : undefined,
                        barberName: barberName ? decodeURIComponent(barberName) : undefined,
                        amount: amount ? decodeURIComponent(amount) : undefined,
                    } as Record<string, string | undefined>;

                    try {
                        router.replace({ pathname: '/payment/success', params: decodedParams });
                    } catch (navError) {
                        router.replace({ pathname: '/payment/success' });
                    }
                } else {
                    console.warn('Invalid legacy URL parameters:', { status, timeSlot });
                    router.replace({ pathname: '/payment/success' });
                }
			}
		};

        // Remove timeout-based fallback flow; no global expectation or clear functions

		const subscription = Linking.addEventListener('url', ({ url }) => {
			console.log('🔗 Expo Linking URL event received:', url);
			handleUrl(url);
		});

		// Check if app was opened from a URL
		Linking.getInitialURL().then((url) => {
			if (url) {
				console.log('🔗 Expo Linking initial URL:', url);
				handleUrl(url);
			}
		});

		// Enhanced deep link availability check
		const checkDeepLinkAvailability = async () => {
			try {
				const testUrls = [
					'app://payment/success',
					'theroyalbarber://payment/success',
					'app://payment/failed',
					'theroyalbarber://payment/failed'
				];
				
				for (const url of testUrls) {
					try {
						const canOpen = await Linking.canOpenURL(url);
						console.log(`🔗 Can open deep link ${url}:`, canOpen);
						
						if (canOpen) {
							console.log('✅ Deep link is available and working');
							return true;
						}
					} catch (error) {
						console.warn(`⚠️ Error checking ${url}:`, error);
					}
				}
				
				console.warn('⚠️ No deep links are available - this may cause Safari issues');
				return false;
			} catch (error) {
				console.error('❌ Error checking deep link availability:', error);
				return false;
			}
		};

		// Check deep link availability after a delay
		setTimeout(checkDeepLinkAvailability, 2000);

		// Add monitoring for embedded browser failures
		const monitorEmbeddedBrowserFailure = () => {
			// This will be called when we detect that the embedded browser failed
			console.log('🔄 Detected embedded browser failure - showing fallback message');
			if (!alertShown && !paymentCancelled) {
				alertShown = true;
				WebBrowser.dismissBrowser();
				Alert.alert(
					'Pago Procesado',
					'El pago ha sido procesado. Si el pago fue exitoso, tu cita ha sido confirmada. Revisa tu historial para confirmar.',
					[
						{ 
							text: 'Ver Historial', 
							onPress: () => router.replace('/(tabs)/history') 
						},
						{ 
							text: 'OK', 
							onPress: () => router.replace('/(tabs)') 
						}
					]
				);
			}
		};

		// Expose the failure handler globally
		(global as any).handleEmbeddedBrowserFailure = monitorEmbeddedBrowserFailure;

		return () => subscription?.remove();
	}, [router, user, isLoading]);

	if (isLoading && !showFallback) {
		console.log('Showing LoadingScreen');
		return <LoadingScreen />;
	}

	// Determine which screens to show based on authentication state
	const shouldShowAuth = isFirstTime || !user || showFallback;

	console.log('Navigation decision - shouldShowAuth:', shouldShowAuth, 'showFallback:', showFallback);

	// If no user is authenticated or it's first time, show auth screens
	if (shouldShowAuth) {
		console.log('No user detected or first time - showing auth screens');
		return (
			<ThemeProvider value={DarkTheme}>
				<Stack screenOptions={{ headerShown: false }}>
					<Stack.Screen name="auth/welcome" options={{ headerShown: false }} />
					<Stack.Screen name="auth/login" options={{ headerShown: false }} />
					<Stack.Screen name="auth/signup" options={{ headerShown: false }} />
					{/* Payment screens available even when not authenticated for deep link handling */}
					<Stack.Screen name="payment/success" options={{ headerShown: false }} />
					<Stack.Screen name="payment/failed" options={{ headerShown: false }} />
					<Stack.Screen name="payment/test" options={{ headerShown: false }} />
					<Stack.Screen name="payment/debug" options={{ headerShown: false }} />
				</Stack>
			</ThemeProvider>
		);
	}

	// If user is authenticated, show main app
	console.log('User authenticated - showing main app');
	return (
		<ThemeProvider value={DarkTheme}>
			<Stack screenOptions={{ headerShown: false }}>
				<Stack.Screen name="(tabs)" options={{ headerShown: false }} />
				<Stack.Screen name="auth/welcome" options={{ headerShown: false }} />
				<Stack.Screen name="auth/login" options={{ headerShown: false }} />
				<Stack.Screen name="auth/signup" options={{ headerShown: false }} />
				<Stack.Screen name="admin/index" options={{ headerShown: false }} />
				<Stack.Screen name="appointment/index" options={{ headerShown: false }} />
				<Stack.Screen name="appointment/reschedule/[appointmentId]" options={{ headerShown: false }} />
				{/* Payment screens available even when not authenticated for deep link handling */}
				<Stack.Screen name="payment/success" options={{ headerShown: false }} />
				<Stack.Screen name="payment/failed" options={{ headerShown: false }} />
				<Stack.Screen name="payment/test" options={{ headerShown: false }} />
				<Stack.Screen name="payment/debug" options={{ headerShown: false }} />
			</Stack>
		</ThemeProvider>
	);
}

export default function RootLayout() {
	const [loaded, error] = useFonts({
		SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
		...FontAwesome.font,
	});

	// Expo Router uses Error Boundaries to catch errors in the navigation tree.
	useEffect(() => {
		if (error) throw error;
	}, [error]);

	useEffect(() => {
		if (loaded) {
			SplashScreen.hideAsync();
		}
	}, [loaded]);

	if (!loaded) {
		return null;
	}

	return (
		<SafeAreaProvider>
			<AuthProvider>
				<RootLayoutNav />
			</AuthProvider>
		</SafeAreaProvider>
	);
}
