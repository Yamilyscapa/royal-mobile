import React from 'react';
import {
	View,
	Text,
	StyleSheet,
	TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Colors from '@/constants/Colors';

export default function PaymentTestScreen() {
	const router = useRouter();

	const testSuccessScreen = () => {
		router.push({
			pathname: '/payment/success',
			params: {
				timeSlot: '14:30',
				appointmentDate: '15/07/2025',
				serviceName: 'Corte Clásico',
				barberName: 'Juan Pérez',
				amount: '250.00',
			}
		});
	};

	const testFailedScreen = () => {
		router.push({
			pathname: '/payment/failed',
			params: {
				timeSlot: '14:30',
				appointmentDate: '15/07/2025',
				serviceName: 'Corte Clásico',
				barberName: 'Juan Pérez',
				amount: '250.00',
				errorMessage: 'Tarjeta declinada. Verifica los datos de tu tarjeta.',
			}
		});
	};

	const goBack = () => {
		router.back();
	};

	return (
		<SafeAreaView style={styles.container}>
			<View style={styles.content}>
				<Text style={styles.title}>Payment Screens Test</Text>
				<Text style={styles.subtitle}>
					Test the payment success and failure screens
				</Text>

				<View style={styles.buttonContainer}>
					<TouchableOpacity style={styles.successButton} onPress={testSuccessScreen}>
						<Text style={styles.buttonText}>Test Success Screen</Text>
					</TouchableOpacity>

					<TouchableOpacity style={styles.failedButton} onPress={testFailedScreen}>
						<Text style={styles.buttonText}>Test Failed Screen</Text>
					</TouchableOpacity>

					<TouchableOpacity style={styles.backButton} onPress={goBack}>
						<Text style={styles.backButtonText}>Go Back</Text>
					</TouchableOpacity>
				</View>
			</View>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: Colors.dark.background,
	},
	content: {
		flex: 1,
		padding: 24,
		justifyContent: 'center',
		alignItems: 'center',
	},
	title: {
		fontSize: 28,
		fontWeight: 'bold',
		color: Colors.dark.text,
		textAlign: 'center',
		marginBottom: 12,
	},
	subtitle: {
		fontSize: 16,
		color: Colors.dark.textLight,
		textAlign: 'center',
		marginBottom: 40,
		lineHeight: 24,
	},
	buttonContainer: {
		width: '100%',
		gap: 16,
	},
	successButton: {
		backgroundColor: Colors.dark.success,
		paddingVertical: 16,
		paddingHorizontal: 24,
		borderRadius: 12,
		alignItems: 'center',
	},
	failedButton: {
		backgroundColor: Colors.dark.error,
		paddingVertical: 16,
		paddingHorizontal: 24,
		borderRadius: 12,
		alignItems: 'center',
	},
	buttonText: {
		color: Colors.dark.background,
		fontSize: 16,
		fontWeight: '600',
	},
	backButton: {
		backgroundColor: 'transparent',
		paddingVertical: 16,
		paddingHorizontal: 24,
		borderRadius: 12,
		borderWidth: 1,
		borderColor: Colors.dark.primary,
		alignItems: 'center',
		marginTop: 20,
	},
	backButtonText: {
		color: Colors.dark.primary,
		fontSize: 16,
		fontWeight: '600',
	},
}); 