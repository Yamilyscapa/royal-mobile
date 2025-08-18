// React Native core imports
import { SafeAreaView } from 'react-native-safe-area-context';
import {
	ScrollView,
	TouchableOpacity,
	Image,
	StyleSheet,
	View,
	TextInput,
	Alert,
	Modal,
	Switch,
	Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useState, useEffect } from 'react';
import MaskedView from '@react-native-masked-view/masked-view';
import { LinearGradient } from 'expo-linear-gradient';

// Local imports
import { ThemeText, Container } from '@/components/Themed';
import ScreenWrapper from '@/components/ui/ScreenWrapper';
import Colors from '@/constants/Colors';
import { useAuth } from '@/components/auth/AuthContext';
import { AuthService } from '@/services';
import { formatPhoneAsTyping, isValidPhoneNumber } from '@/helpers/phoneFormatter';

export default function ProfileScreen() {
	const { user, signOut, refreshUser } = useAuth();
	const [isEditing, setIsEditing] = useState(false);
	const [showNotificationsModal, setShowNotificationsModal] = useState(false);
	const [showLogoutModal, setShowLogoutModal] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const [notificationSettings, setNotificationSettings] = useState({
		pushNotifications: true,
		emailNotifications: true,
		smsNotifications: false,
		appointmentReminders: true,
		promotionalOffers: false,
	});

	const [userData, setUserData] = useState({
		firstName: '',
		lastName: '',
		email: '',
		phone: '',
	});

	const [originalUserData, setOriginalUserData] = useState({
		firstName: '',
		lastName: '',
		email: '',
		phone: '',
	});

	// Initialize user data from context
	useEffect(() => {
		if (user) {
			const userDataFromContext = {
				firstName: user.firstName || '',
				lastName: user.lastName || '',
				email: user.email || '',
				phone: user.phone || '',
			};
			setUserData(userDataFromContext);
			setOriginalUserData(userDataFromContext);
		}
	}, [user]);

	const handleSave = async () => {
		if (!user) return;

		// Validate phone number format for Twilio compatibility
		if (!isValidPhoneNumber(userData.phone)) {
			Alert.alert('Error', 'Por favor ingresa un número de teléfono válido en formato internacional (ej: +1234567890)');
			return;
		}

		try {
			setIsLoading(true);

			// Call the update profile API
			const response = await AuthService.updateProfile({
				firstName: userData.firstName,
				lastName: userData.lastName,
				email: userData.email,
				phone: userData.phone,
			});

			if (response.success) {
				// Update the original data to the new saved data
				setOriginalUserData(userData);
				// Refresh user data in context
				await refreshUser();
				Alert.alert('Éxito', '¡Perfil actualizado correctamente!');
				setIsEditing(false);
			} else {
				Alert.alert('Error', response.error || 'No se pudo actualizar el perfil');
			}
		} catch (error) {
			Alert.alert('Error', 'Ocurrió un error al actualizar el perfil');
		} finally {
			setIsLoading(false);
		}
	};

	const handleCancel = () => {
		// Reset to original data
		setUserData(originalUserData);
		setIsEditing(false);
	};

	const handleLogout = async () => {
		try {
			setIsLoading(true);
			await signOut();
			setShowLogoutModal(false);
		} catch (error) {
			Alert.alert('Error', 'Ocurrió un error al cerrar sesión');
		} finally {
			setIsLoading(false);
		}
	};

	const handleNotificationSave = () => {
		// Here you would typically save notification settings to backend
		Alert.alert('Éxito', '¡Configuración de notificaciones guardada!');
		setShowNotificationsModal(false);
	};

	return (
		<ScreenWrapper showBottomFade={true} showTopFade={false}>
			<ScrollView showsVerticalScrollIndicator={false}>
				<Container>
					{/* Header */}
					<View style={styles.header}>
						<View style={styles.headerContent}>
							<ThemeText style={styles.headerTitle}>Mi Perfil</ThemeText>
						</View>
						{!isEditing ? (
							<TouchableOpacity
								style={styles.editButton}
								onPress={() => setIsEditing(true)}
							>
								<Ionicons name="pencil" size={20} color={Colors.dark.primary} />
							</TouchableOpacity>
						) : (
							<View style={styles.editActions}>
								<TouchableOpacity
									style={styles.actionButton}
									onPress={handleCancel}
								>
									<ThemeText style={styles.cancelText}>Cancelar</ThemeText>
								</TouchableOpacity>
								<TouchableOpacity
									style={[styles.actionButton, styles.saveButton, isLoading && styles.saveButtonDisabled]}
									onPress={handleSave}
									disabled={isLoading}
								>
									<ThemeText style={styles.saveText}>
										{isLoading ? 'Guardando...' : 'Guardar'}
									</ThemeText>
								</TouchableOpacity>
							</View>
						)}
					</View>



					{/* Profile Information Card */}
					<View style={styles.profileCard}>
						<View style={styles.cardHeader}>
							<Ionicons
								name="person-circle"
								size={24}
								color={Colors.dark.primary}
							/>
							<ThemeText style={styles.cardTitle}>
								Información Personal
							</ThemeText>
						</View>

						<View style={styles.formSection}>
							<View style={styles.inputGroup}>
								<ThemeText style={styles.inputLabel}>Nombre</ThemeText>
								{isEditing ? (
									<TextInput
										style={styles.textInput}
										value={userData.firstName}
										onChangeText={text =>
											setUserData({ ...userData, firstName: text })
										}
										placeholderTextColor={Colors.dark.textLight}
									/>
								) : (
									<View style={styles.displayContainer}>
										<ThemeText style={styles.displayText}>
											{userData.firstName}
										</ThemeText>
									</View>
								)}
							</View>

							<View style={styles.inputGroup}>
								<ThemeText style={styles.inputLabel}>Apellidos</ThemeText>
								{isEditing ? (
									<TextInput
										style={styles.textInput}
										value={userData.lastName}
										onChangeText={text =>
											setUserData({ ...userData, lastName: text })
										}
										placeholderTextColor={Colors.dark.textLight}
									/>
								) : (
									<View style={styles.displayContainer}>
										<ThemeText style={styles.displayText}>
											{userData.lastName}
										</ThemeText>
									</View>
								)}
							</View>

							<View style={styles.inputGroup}>
								<ThemeText style={styles.inputLabel}>
									Correo Electrónico
								</ThemeText>
								{isEditing ? (
									<TextInput
										style={styles.textInput}
										value={userData.email}
										onChangeText={text =>
											setUserData({ ...userData, email: text })
										}
										placeholderTextColor={Colors.dark.textLight}
										keyboardType="email-address"
									/>
								) : (
									<View style={styles.displayContainer}>
										<ThemeText style={styles.displayText}>
											{userData.email}
										</ThemeText>
									</View>
								)}
							</View>

							<View style={styles.inputGroup}>
								<ThemeText style={styles.inputLabel}>
									Número de Teléfono
								</ThemeText>
								{isEditing ? (
									<>
										<TextInput
											style={styles.textInput}
											value={userData.phone}
											onChangeText={text =>
												setUserData({ ...userData, phone: formatPhoneAsTyping(text) })
											}
											placeholder="+1 (234) 567-8900"
											placeholderTextColor={Colors.dark.textLight}
											keyboardType="phone-pad"
										/>
										{/* Helper and warning text for phone format */}
										<ThemeText style={styles.helperText}>
											Incluye el código de país, por ejemplo: +1 234 567 8900
										</ThemeText>
										<ThemeText style={styles.notificationText}>
											📱 Este número se usa para enviarte notificaciones sobre tus citas
										</ThemeText>
										{userData.phone.length > 0 && !isValidPhoneNumber(userData.phone) && (
											<ThemeText style={styles.warningText}>
												Formato inválido. Usa el formato internacional: +1 234 567 8900
											</ThemeText>
										)}
									</>
								) : (
									<View style={styles.displayContainer}>
										<ThemeText style={styles.displayText}>
											{userData.phone}
										</ThemeText>
									</View>
								)}
							</View>
						</View>
					</View>

					{/* Settings Card */}
					<View style={styles.settingsCard}>
						<View style={styles.cardHeader}>
							<Ionicons name="settings" size={24} color={Colors.dark.primary} />
							<ThemeText style={styles.cardTitle}>Configuración</ThemeText>
						</View>

						{/* Disclaimer */}
						<View style={styles.disclaimerContainer}>
							<Ionicons name="information-circle" size={20} color={Colors.dark.primary} />
							<ThemeText style={styles.disclaimerText}>
								Los recordatorios de citas se envían automáticamente vía WhatsApp 15 minutos antes de tu cita programada.
							</ThemeText>
						</View>

						<TouchableOpacity
							style={styles.menuItem}
							onPress={() => setShowLogoutModal(true)}
						>
							<View style={styles.menuItemLeft}>
								<View style={[styles.menuIcon, { backgroundColor: '#ff3b30' }]}>
									<Ionicons
										name="log-out-outline"
										size={20}
										color={Colors.dark.background}
									/>
								</View>
								<View style={styles.menuText}>
									<ThemeText style={styles.menuTitle}>Cerrar Sesión</ThemeText>
									<ThemeText style={styles.menuSubtitle}>
										Salir de tu cuenta
									</ThemeText>
								</View>
							</View>
							<Ionicons
								name="chevron-forward"
								size={20}
								color={Colors.dark.textLight}
							/>
						</TouchableOpacity>
					</View>

					{/* Legal Links Card */}
					<View style={styles.settingsCard}>
						<View style={styles.cardHeader}>
							<Ionicons name="document-text" size={24} color={Colors.dark.primary} />
							<ThemeText style={styles.cardTitle}>Legal</ThemeText>
						</View>

						<TouchableOpacity
							style={styles.menuItem}
							onPress={() => Linking.openURL('https://theroyalbarber.com/privacy')}
						>
							<View style={styles.menuItemLeft}>
								<View style={[styles.menuIcon, { backgroundColor: '#007AFF' }]}>
									<Ionicons
										name="shield-checkmark"
										size={20}
										color={Colors.dark.background}
									/>
								</View>
								<View style={styles.menuText}>
									<ThemeText style={styles.menuTitle}>Política de Privacidad</ThemeText>
									<ThemeText style={styles.menuSubtitle}>
										Cómo protegemos tu información
									</ThemeText>
								</View>
							</View>
							<Ionicons
								name="chevron-forward"
								size={20}
								color={Colors.dark.textLight}
							/>
						</TouchableOpacity>

						<TouchableOpacity
							style={styles.menuItem}
							onPress={() => Linking.openURL('https://theroyalbarber.com/terms')}
						>
							<View style={styles.menuItemLeft}>
								<View style={[styles.menuIcon, { backgroundColor: '#34C759' }]}>
									<Ionicons
										name="document-text"
										size={20}
										color={Colors.dark.background}
									/>
								</View>
								<View style={styles.menuText}>
									<ThemeText style={styles.menuTitle}>Términos de Servicio</ThemeText>
									<ThemeText style={styles.menuSubtitle}>
										Condiciones de uso de la app
									</ThemeText>
								</View>
							</View>
							<Ionicons
								name="chevron-forward"
								size={20}
								color={Colors.dark.textLight}
							/>
						</TouchableOpacity>
					</View>

					{/* App Version */}
					<View style={styles.versionSection}>
						<ThemeText style={styles.versionText}>Versión 1.0.0</ThemeText>
					</View>
				</Container>
			</ScrollView>

			{/* Notifications Modal */}
			<Modal
				visible={showNotificationsModal}
				animationType="slide"
				presentationStyle="pageSheet"
				onRequestClose={() => setShowNotificationsModal(false)}
			>
				<SafeAreaView
					style={{ flex: 1, backgroundColor: Colors.dark.background }}
				>
					<View style={styles.modalHeader}>
						<TouchableOpacity
							style={styles.modalCloseButton}
							onPress={() => setShowNotificationsModal(false)}
						>
							<Ionicons name="close" size={24} color={Colors.dark.text} />
						</TouchableOpacity>
						<ThemeText style={styles.modalTitle}>Notificaciones</ThemeText>
						<TouchableOpacity
							style={styles.modalSaveButton}
							onPress={handleNotificationSave}
						>
							<ThemeText style={styles.modalSaveText}>Guardar</ThemeText>
						</TouchableOpacity>
					</View>
				</SafeAreaView>
			</Modal>

			{/* Logout Modal */}
			<Modal
				visible={showLogoutModal}
				animationType="fade"
				transparent={true}
				onRequestClose={() => setShowLogoutModal(false)}
			>
				<View style={styles.overlay}>
					<View style={styles.logoutModal}>
						<View style={styles.logoutIcon}>
							<Ionicons name="log-out" size={48} color={Colors.dark.primary} />
						</View>

						<ThemeText style={styles.logoutTitle}>¿Cerrar Sesión?</ThemeText>
						<ThemeText style={styles.logoutMessage}>
							¿Estás seguro de que quieres cerrar sesión? Tendrás que volver a
							iniciar sesión para acceder a tu cuenta.
						</ThemeText>

						<View style={styles.logoutActions}>
							<TouchableOpacity
								style={styles.logoutCancelButton}
								onPress={() => setShowLogoutModal(false)}
							>
								<ThemeText style={styles.logoutCancelText}>Cancelar</ThemeText>
							</TouchableOpacity>

							<TouchableOpacity
								style={[styles.logoutConfirmButton, isLoading && styles.logoutButtonDisabled]}
								onPress={handleLogout}
								disabled={isLoading}
							>
								<ThemeText style={styles.logoutConfirmText}>
									{isLoading ? 'Cerrando...' : 'Cerrar Sesión'}
								</ThemeText>
							</TouchableOpacity>
						</View>
					</View>
				</View>
			</Modal>
		</ScreenWrapper>
	);
}

const styles = StyleSheet.create({
	header: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'flex-start',
		marginBottom: 30,
		paddingTop: 20,
	},
	headerContent: {
		flex: 1,
	},
	headerTitle: {
		fontSize: 24,
		fontWeight: 'bold',
		marginBottom: 4,
	},
	editButton: {
		padding: 12,
		backgroundColor: Colors.dark.tint,
		borderRadius: 12,
	},
	editActions: {
		flexDirection: 'row',
		alignItems: 'center',
	},
	actionButton: {
		paddingHorizontal: 16,
		paddingVertical: 8,
		marginLeft: 8,
		borderRadius: 8,
	},
	saveButton: {
		backgroundColor: Colors.dark.primary,
	},
	saveButtonDisabled: {
		opacity: 0.6,
	},
	cancelText: {
		color: Colors.dark.textLight,
		fontSize: 16,
	},
	saveText: {
		color: Colors.dark.background,
		fontSize: 16,
		fontWeight: '500',
	},
	statsCard: {
		backgroundColor: Colors.dark.tint,
		borderRadius: 20,
		padding: 24,
		marginBottom: 24,
	},
	statsContent: {
		flexDirection: 'row',
		alignItems: 'center',
	},
	statIcon: {
		width: 48,
		height: 48,
		borderRadius: 24,
		backgroundColor: Colors.dark.background,
		justifyContent: 'center',
		alignItems: 'center',
		marginRight: 16,
	},
	statInfo: {
		flex: 1,
	},
	statNumber: {
		fontSize: 28,
		fontWeight: 'bold',
		color: Colors.dark.primary,
		marginBottom: 4,
	},
	statLabel: {
		fontSize: 14,
		color: Colors.dark.textLight,
	},
	profileCard: {
		backgroundColor: Colors.dark.tint,
		borderRadius: 20,
		padding: 24,
		marginBottom: 24,
	},
	settingsCard: {
		backgroundColor: Colors.dark.tint,
		borderRadius: 20,
		padding: 24,
		marginBottom: 24,
	},
	cardHeader: {
		flexDirection: 'row',
		alignItems: 'center',
		marginBottom: 20,
	},
	cardTitle: {
		fontSize: 20,
		fontWeight: '600',
		marginLeft: 12,
		color: Colors.dark.primary,
	},
	formSection: {
		gap: 20,
	},
	inputGroup: {
		gap: 8,
	},
	inputLabel: {
		fontSize: 14,
		fontWeight: '500',
		color: Colors.dark.textLight,
		marginLeft: 4,
	},
	textInput: {
		backgroundColor: Colors.dark.background,
		borderRadius: 12,
		padding: 16,
		fontSize: 16,
		color: Colors.dark.text,
		borderWidth: 1,
		borderColor: Colors.dark.gray,
	},
	displayContainer: {
		backgroundColor: Colors.dark.background,
		borderRadius: 12,
		padding: 16,
		borderWidth: 1,
		borderColor: Colors.dark.gray,
	},
	displayText: {
		fontSize: 16,
		color: Colors.dark.text,
	},
	menuItem: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		backgroundColor: Colors.dark.background,
		borderRadius: 12,
		padding: 16,
		marginBottom: 12,
	},
	menuItemLeft: {
		flexDirection: 'row',
		alignItems: 'center',
		flex: 1,
	},
	menuIcon: {
		width: 40,
		height: 40,
		borderRadius: 20,
		justifyContent: 'center',
		alignItems: 'center',
		marginRight: 16,
	},
	menuText: {
		flex: 1,
	},
	menuTitle: {
		fontSize: 16,
		fontWeight: '500',
		marginBottom: 2,
	},
	menuSubtitle: {
		fontSize: 14,
		color: Colors.dark.textLight,
	},
	versionSection: {
		alignItems: 'center',
		paddingVertical: 20,
	},
	versionText: {
		fontSize: 14,
		color: Colors.dark.textLight,
	},
	// Modal Styles
	modalHeader: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		paddingHorizontal: 20,
		paddingVertical: 16,
		borderBottomWidth: 1,
		borderBottomColor: Colors.dark.gray,
	},
	modalCloseButton: {
		padding: 8,
	},
	modalTitle: {
		fontSize: 20,
		fontWeight: '600',
		color: Colors.dark.primary,
	},
	modalSaveButton: {
		paddingHorizontal: 16,
		paddingVertical: 8,
		backgroundColor: Colors.dark.primary,
		borderRadius: 8,
	},
	modalSaveText: {
		color: Colors.dark.background,
		fontSize: 16,
		fontWeight: '500',
	},
	modalContent: {
		flex: 1,
		paddingHorizontal: 20,
	},
	notificationSection: {
		paddingVertical: 20,
	},
	notificationItem: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		backgroundColor: Colors.dark.tint,
		borderRadius: 12,
		padding: 16,
		marginBottom: 16,
	},
	notificationInfo: {
		flex: 1,
		marginRight: 16,
	},
	notificationTitle: {
		fontSize: 16,
		fontWeight: '500',
		marginBottom: 4,
	},
	notificationSubtitle: {
		fontSize: 14,
		color: Colors.dark.textLight,
	},
	disclaimerContainer: {
		flexDirection: 'row',
		alignItems: 'flex-start',
		backgroundColor: Colors.dark.background,
		borderRadius: 12,
		padding: 16,
		marginBottom: 16,
		borderWidth: 1,
		borderColor: Colors.dark.primary,
	},
	disclaimerText: {
		fontSize: 14,
		color: Colors.dark.textLight,
		marginLeft: 8,
		flex: 1,
		lineHeight: 20,
	},
	// Logout Modal Styles
	overlay: {
		flex: 1,
		backgroundColor: 'rgba(0, 0, 0, 0.5)',
		justifyContent: 'center',
		alignItems: 'center',
		paddingHorizontal: 20,
	},
	logoutModal: {
		backgroundColor: Colors.dark.tint,
		borderRadius: 20,
		padding: 24,
		alignItems: 'center',
		width: '100%',
		maxWidth: 320,
	},
	logoutIcon: {
		width: 80,
		height: 80,
		borderRadius: 40,
		backgroundColor: Colors.dark.background,
		justifyContent: 'center',
		alignItems: 'center',
		marginBottom: 20,
	},
	logoutTitle: {
		fontSize: 24,
		fontWeight: 'bold',
		marginBottom: 12,
		textAlign: 'center',
	},
	logoutMessage: {
		fontSize: 16,
		color: Colors.dark.textLight,
		textAlign: 'center',
		lineHeight: 22,
		marginBottom: 24,
	},
	logoutActions: {
		flexDirection: 'row',
		gap: 12,
		width: '100%',
	},
	logoutCancelButton: {
		flex: 1,
		borderRadius: 12,
		backgroundColor: Colors.dark.background,
		alignItems: 'center',
		justifyContent: 'center',
	},
	logoutCancelText: {
		fontSize: 16,
		color: Colors.dark.text,
		fontWeight: '500',
	},
	logoutConfirmButton: {
		flex: 1,
		paddingVertical: 12,
		paddingHorizontal: 16,
		borderRadius: 12,
		backgroundColor: '#ff3b30',
		alignItems: 'center',
	},
	logoutConfirmText: {
		fontSize: 16,
		color: Colors.dark.background,
		fontWeight: '500',
		textAlign: 'center',
	},
	logoutButtonDisabled: {
		opacity: 0.6,
	},
	helperText: {
		fontSize: 12,
		color: Colors.dark.textLight,
		marginTop: 4,
		marginLeft: 2,
	},
	warningText: {
		fontSize: 12,
		color: '#ff3b30',
		marginTop: 2,
		marginLeft: 2,
	},
	notificationText: {
		fontSize: 12,
		color: Colors.dark.primary,
		marginTop: 4,
		marginLeft: 2,
		fontStyle: 'italic',
	},
});
