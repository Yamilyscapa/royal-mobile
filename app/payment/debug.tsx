import React from 'react';
import DebugDeepLinks from '@/components/DebugDeepLinks';
import { useRouter } from 'expo-router';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import Colors from '@/constants/Colors';

export default function PaymentDebugScreen() {
	const router = useRouter();

	const goBack = () => {
		router.back();
	};

	return (
		<>
			<DebugDeepLinks />
			<TouchableOpacity style={styles.backButton} onPress={goBack}>
				<Text style={styles.backButtonText}>Go Back</Text>
			</TouchableOpacity>
		</>
	);
}

const styles = StyleSheet.create({
	backButton: {
		position: 'absolute',
		top: 50,
		left: 20,
		backgroundColor: Colors.dark.tint,
		padding: 12,
		borderRadius: 8,
	},
	backButtonText: {
		color: Colors.dark.text,
		fontSize: 16,
		fontWeight: '600',
	},
}); 