import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    StatusBar,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Colors from '@/constants/Colors';

interface PaymentFailedParams {
    timeSlot?: string;
    appointmentDate?: string;
    serviceName?: string;
    barberName?: string;
    amount?: string;
    errorMessage?: string;
}

export default function PaymentFailedScreen() {
    const router = useRouter();
    const params = useLocalSearchParams() as PaymentFailedParams;

    const handleTryAgain = () => {
        router.back();
    };

    const handleGoHome = () => {
        router.replace('/(tabs)');
    };

    const handleContactSupport = () => {
        // You can implement contact support functionality here
        // For now, we'll just show an alert
        alert('Para contactar soporte, envía un mensaje a: support@theroyalbarber.com');
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
            <StatusBar barStyle="light-content" />
            <View style={styles.content}>
                {/* Error Details */}
                {params.errorMessage && (
                    <View style={styles.errorContainer}>
                        <Text style={styles.errorTitle}>Detalles del error:</Text>
                        <Text style={styles.errorText}>{params.errorMessage}</Text>
                    </View>
                )}

                {/* Appointment Details (if they exist) */}
                {(params.serviceName || params.barberName || params.amount) && (
                    <View style={styles.detailsContainer}>
                        <Text style={styles.detailsTitle}>Detalles de la cita:</Text>

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

                        {params.amount && (
                            <View style={styles.detailRow}>
                                <Ionicons name="card" size={20} color={Colors.dark.primary} />
                                <Text style={styles.detailText}>{formatPrice(params.amount)}</Text>
                            </View>
                        )}
                    </View>
                )}

                {/* Possible Solutions */}
                <View style={styles.solutionsContainer}>
                    <Text style={styles.solutionsTitle}>Posibles soluciones:</Text>
                    <Text style={styles.solutionsText}>
                        • Verifica que tu tarjeta tenga fondos suficientes{'\n'}
                        • Asegúrate de que los datos de la tarjeta sean correctos{'\n'}
                        • Intenta con una tarjeta diferente{'\n'}
                        • Verifica tu conexión a internet
                    </Text>
                </View>

                {/* Action Buttons */}
                <View style={styles.buttonContainer}>
                    <TouchableOpacity style={styles.secondaryButton} onPress={handleGoHome}>
                        <Text style={styles.secondaryButtonText}>Ir al Inicio</Text>
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
    errorContainer: {
        width: '100%',
        backgroundColor: Colors.dark.error,
        borderRadius: 12,
        padding: 20,
        marginBottom: 24,
    },
    errorTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: Colors.dark.text,
        marginBottom: 12,
    },
    errorText: {
        fontSize: 14,
        color: Colors.dark.text,
        lineHeight: 20,
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
    solutionsContainer: {
        width: '100%',
        backgroundColor: Colors.dark.tint,
        borderRadius: 12,
        padding: 20,
        marginBottom: 32,
    },
    solutionsTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: Colors.dark.text,
        marginBottom: 12,
    },
    solutionsText: {
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
    supportButton: {
        backgroundColor: 'transparent',
        paddingVertical: 16,
        paddingHorizontal: 24,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: Colors.dark.error,
        alignItems: 'center',
    },
    supportButtonText: {
        color: Colors.dark.error,
        fontSize: 16,
        fontWeight: '600',
    },
}); 