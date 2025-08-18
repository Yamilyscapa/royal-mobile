import React from 'react';
import { View, StyleSheet } from 'react-native';
import { CalendarCheck, Clock, User, DollarSign } from 'lucide-react-native';
import Colors from '@/constants/Colors';
import { ThemeText } from '@/components/Themed';
import { LinearGradient } from 'expo-linear-gradient';

interface Appointment {
	id: string;
	appointmentDate: string;
	timeSlot: string;
	service?: {
		id: string;
		name: string;
		price: number;
		duration: number;
	};
	barber?: {
		id: string;
		name: string;
	};
	// Flat properties from API
	serviceName?: string;
	servicePrice?: number;
	barberName?: string;
	status?: string;
}

interface AppointmentReminderProps {
	appointment?: Appointment | null;
}

export default function AppointmentReminder({ appointment }: AppointmentReminderProps) {
	// Don't render if no appointment
	if (!appointment) {
		return null;
	}

	const formatTime = (timeSlot: string) => {
		const [hours, minutes] = timeSlot.split(':');
		const hour = parseInt(hours);
		const ampm = hour >= 12 ? 'PM' : 'AM';
		const displayHour = hour % 12 || 12;
		return `${displayHour}:${minutes} ${ampm}`;
	};

	const formatDate = (dateString: string) => {
		try {
			// Handle different date formats
			let date: Date;

			if (dateString.includes('/')) {
				// Handle dd/mm/yyyy format
				const [day, month, year] = dateString.split('/');
				date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
			} else {
				// Handle ISO format (2025-06-29T06:00:00.000Z) or other standard formats
				date = new Date(dateString);
			}

			// Check if date is valid
			if (isNaN(date.getTime())) {
				return 'Fecha inválida';
			}

			return date.toLocaleDateString('es-ES', {
				weekday: 'short',
				month: 'short',
				day: 'numeric',
			});
		} catch (error) {
			return 'Fecha inválida';
		}
	};

	// Get service name and price from either nested object or flat properties
	const serviceName = appointment.service?.name || appointment.serviceName || 'Servicio';
	const servicePrice = appointment.servicePrice
	const barberName = appointment.barber?.name || appointment.barberName;
	
	return (
		<View style={styles.container}>
			{/* Gradient Background */}
			<LinearGradient
				colors={[Colors.dark.primary, '#f4d47a']}
				start={{ x: 0, y: 0 }}
				end={{ x: 1, y: 1 }}
				style={styles.gradientBackground}
			/>

			{/* Content */}
			<View style={styles.content}>
				{/* Header with Icon */}
				<View style={styles.header}>
					<View style={styles.iconContainer}>
						<CalendarCheck color="#FFFFFF" size={24} />
					</View>
					<View style={styles.headerText}>
						<ThemeText style={styles.title}>Próxima Cita</ThemeText>
						<ThemeText style={styles.subtitle}>Tu cita está confirmada</ThemeText>
					</View>
				</View>

				{/* Service Info */}
				<View style={styles.serviceSection}>
					<View style={styles.serviceRow}>
						<View style={styles.serviceIcon}>
							<DollarSign color={Colors.dark.primary} size={16} />
						</View>
						<View style={styles.serviceInfo}>
							<ThemeText style={styles.serviceName}>{serviceName}</ThemeText>
							<ThemeText style={styles.servicePrice}>
								${servicePrice ? (typeof servicePrice === 'number' ? servicePrice.toFixed(2) : parseFloat(servicePrice).toFixed(2)) : '0.00'}
							</ThemeText>
						</View>
					</View>
				</View>

				{/* Barber Info */}
				{barberName && (
					<View style={styles.barberSection}>
						<View style={styles.barberRow}>
							<View style={styles.barberIcon}>
								<User color={Colors.dark.primary} size={16} />
							</View>
							<ThemeText style={styles.barberName}>Con {barberName}</ThemeText>
						</View>
					</View>
				)}

				{/* Date and Time */}
				<View style={styles.datetimeSection}>
					<View style={styles.datetimeRow}>
						<View style={styles.datetimeIcon}>
							<Clock color={Colors.dark.primary} size={16} />
						</View>
						<ThemeText style={styles.datetimeText}>
							{formatDate(appointment.appointmentDate)} a las {formatTime(appointment.timeSlot)}
						</ThemeText>
					</View>
				</View>


			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		marginBottom: 20,
		borderRadius: 20,
		overflow: 'hidden',
		shadowColor: '#000',
		shadowOffset: {
			width: 0,
			height: 6,
		},
		shadowOpacity: 0.15,
		shadowRadius: 12,
		elevation: 10,
	},
	gradientBackground: {
		position: 'absolute',
		top: 0,
		left: 0,
		right: 0,
		bottom: 0,
	},
	content: {
		padding: 24,
		backgroundColor: 'rgba(32, 28, 19, 0.95)',
	},
	header: {
		flexDirection: 'row',
		alignItems: 'center',
		marginBottom: 20,
	},
	iconContainer: {
		width: 56,
		height: 56,
		borderRadius: 28,
		backgroundColor: Colors.dark.primary,
		justifyContent: 'center',
		alignItems: 'center',
		marginRight: 16,
		shadowColor: Colors.dark.primary,
		shadowOffset: {
			width: 0,
			height: 2,
		},
		shadowOpacity: 0.15,
		shadowRadius: 4,
		elevation: 3,
	},
	headerText: {
		flex: 1,
	},
	title: {
		fontSize: 22,
		fontWeight: '700',
		color: Colors.dark.primary,
		marginBottom: 4,
	},
	subtitle: {
		fontSize: 15,
		color: Colors.dark.textLight,
		fontWeight: '500',
	},
	serviceSection: {
		marginBottom: 16,
	},
	serviceRow: {
		flexDirection: 'row',
		alignItems: 'center',
	},
	serviceIcon: {
		width: 40,
		height: 40,
		borderRadius: 20,
		backgroundColor: 'rgba(234, 193, 106, 0.15)',
		justifyContent: 'center',
		alignItems: 'center',
		marginRight: 16,
	},
	serviceInfo: {
		flex: 1,
	},
	serviceName: {
		fontSize: 17,
		fontWeight: '600',
		color: Colors.dark.text,
		marginBottom: 4,
	},
	servicePrice: {
		fontSize: 16,
		color: Colors.dark.primary,
		fontWeight: '700',
	},
	barberSection: {
		marginBottom: 16,
	},
	barberRow: {
		flexDirection: 'row',
		alignItems: 'center',
	},
	barberIcon: {
		width: 40,
		height: 40,
		borderRadius: 20,
		backgroundColor: 'rgba(234, 193, 106, 0.15)',
		justifyContent: 'center',
		alignItems: 'center',
		marginRight: 16,
	},
	barberName: {
		fontSize: 16,
		color: Colors.dark.text,
		fontWeight: '600',
	},
	datetimeSection: {
		marginBottom: 20,
	},
	datetimeRow: {
		flexDirection: 'row',
		alignItems: 'center',
	},
	datetimeIcon: {
		width: 40,
		height: 40,
		borderRadius: 20,
		backgroundColor: 'rgba(234, 193, 106, 0.15)',
		justifyContent: 'center',
		alignItems: 'center',
		marginRight: 16,
	},
	datetimeText: {
		fontSize: 16,
		color: Colors.dark.text,
		fontWeight: '600',
	},

});
