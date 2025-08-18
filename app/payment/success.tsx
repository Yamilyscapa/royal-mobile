import React, { useEffect, useState } from 'react';
import {
	View,
	Text,
	StyleSheet,
	TouchableOpacity,
	Alert,
	Linking,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Colors from '@/constants/Colors';

interface PaymentSuccessParams {
	timeSlot?: string;
	appointmentDate?: string;
	serviceName?: string;
	barberName?: string;
	amount?: string;
}

export default function PaymentSuccessScreen() {
	const router = useRouter();
	const params = useLocalSearchParams() as PaymentSuccessParams;
	const [formattedTime, setFormattedTime] = useState<string>('');
	const [formattedDate, setFormattedDate] = useState<string>('');

	useEffect(() => {
		// Format the time for display
		if (params.timeSlot) {
			const formatTime = (time: string) => {
				const [hours, minutes] = time.split(':');
				const hour = parseInt(hours);
				const ampm = hour >= 12 ? 'PM' : 'AM';
				const displayHour = hour % 12 || 12;
				return `${displayHour}:${minutes} ${ampm}`;
			};
			setFormattedTime(formatTime(params.timeSlot));
		}

		// Format the date for display
		if (params.appointmentDate) {
			const formatDate = (dateStr: string) => {
				const [day, month, year] = dateStr.split('/');
				const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
				return date.toLocaleDateString('es-MX', {
					weekday: 'long',
					year: 'numeric',
					month: 'long',
					day: 'numeric',
				});
			};
			setFormattedDate(formatDate(params.appointmentDate));
		}
	}, [params.timeSlot, params.appointmentDate]);

	const handleGoHome = () => {
		router.replace('/(tabs)');
	};

	const handleViewHistory = () => {
		router.replace('/(tabs)/history');
	};

	const formatPrice = (price: string | number) => {
		const numericPrice = typeof price === 'string' ? parseFloat(price) : price;
		return new Intl.NumberFormat('es-MX', {
			style: 'currency',
			currency: 'MXN',
		}).format(numericPrice);
	};

	return (
		<SafeAreaView style={styles.container}>
			<View style={styles.content}>
				{/* Success Message */}
				<Text style={styles.title}>¡Pago Exitoso!</Text>
				<Text style={styles.subtitle}>
					Tu cita ha sido confirmada y el pago procesado correctamente.
				</Text>

				{/* Appointment Details */}
				<View style={styles.detailsContainer}>
					<Text style={styles.detailsTitle}>Detalles de tu cita:</Text>
					
					{params.serviceName && (
						<View style={styles.detailRow}>
							<Ionicons name="cut" size={20} color={Colors.dark.primary} />
							<Text style={styles.detailText}>{params.serviceName}</Text>
						</View>
					)}

					{params.barberName && (
						<View style={styles.detailRow}>
							<Ionicons name="person" size={20} color={Colors.dark.primary} />
							<Text style={styles.detailText}>{params.barberName}</Text>
						</View>
					)}

					{formattedDate && (
						<View style={styles.detailRow}>
							<Ionicons name="calendar" size={20} color={Colors.dark.primary} />
							<Text style={styles.detailText}>{formattedDate}</Text>
						</View>
					)}

					{formattedTime && (
						<View style={styles.detailRow}>
							<Ionicons name="time" size={20} color={Colors.dark.primary} />
							<Text style={styles.detailText}>{formattedTime}</Text>
						</View>
					)}

					{params.amount && (
						<View style={styles.detailRow}>
							<Ionicons name="card" size={20} color={Colors.dark.primary} />
							<Text style={styles.detailText}>{formatPrice(params.amount)}</Text>
						</View>
					)}
				</View>

				{/* Instructions */}
				<View style={styles.instructionsContainer}>
					<Text style={styles.instructionsTitle}>Próximos pasos:</Text>
					<Text style={styles.instructionsText}>
						• Llega 10 minutos antes de tu cita{'\n'}
						• Trae una identificación válida{'\n'}
						• Si necesitas cancelar, hazlo con 24 horas de anticipación
					</Text>
				</View>

				{/* Action Buttons */}
				<View style={styles.buttonContainer}>
					<TouchableOpacity style={styles.primaryButton} onPress={handleGoHome}>
						<Text style={styles.primaryButtonText}>Ir al Inicio</Text>
					</TouchableOpacity>

					<TouchableOpacity style={styles.secondaryButton} onPress={handleViewHistory}>
						<Text style={styles.secondaryButtonText}>Ver Historial</Text>
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
	iconContainer: {
		marginBottom: 32,
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
	detailsContainer: {
		width: '100%',
		backgroundColor: Colors.dark.tint,
		borderRadius: 12,
		padding: 20,
		marginBottom: 24,
	},
	detailsTitle: {
		fontSize: 18,
		fontWeight: '600',
		color: Colors.dark.text,
		marginBottom: 16,
	},
	detailRow: {
		flexDirection: 'row',
		alignItems: 'center',
		marginBottom: 12,
	},
	detailText: {
		fontSize: 16,
		color: Colors.dark.text,
		marginLeft: 12,
		flex: 1,
	},
	instructionsContainer: {
		width: '100%',
		backgroundColor: Colors.dark.tint,
		borderRadius: 12,
		padding: 20,
		marginBottom: 32,
	},
	instructionsTitle: {
		fontSize: 18,
		fontWeight: '600',
		color: Colors.dark.text,
		marginBottom: 12,
	},
	instructionsText: {
		fontSize: 14,
		color: Colors.dark.textLight,
		lineHeight: 20,
	},
	buttonContainer: {
		width: '100%',
		gap: 12,
	},
	primaryButton: {
		backgroundColor: Colors.dark.primary,
		paddingVertical: 16,
		paddingHorizontal: 24,
		borderRadius: 12,
		alignItems: 'center',
	},
	primaryButtonText: {
		color: Colors.dark.background,
		fontSize: 16,
		fontWeight: '600',
	},
	secondaryButton: {
		backgroundColor: 'transparent',
		paddingVertical: 16,
		paddingHorizontal: 24,
		borderRadius: 12,
		borderWidth: 1,
		borderColor: Colors.dark.primary,
		alignItems: 'center',
	},
	secondaryButtonText: {
		color: Colors.dark.primary,
		fontSize: 16,
		fontWeight: '600',
	},
}); 