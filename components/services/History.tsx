import { useState } from 'react';
import { View, Pressable } from 'react-native';
import { ThemeText } from '@/components/Themed';
import Colors from '@/constants/Colors';

interface HistoryCardProps {
	title: string;
	price: number;
	date: string; // DD-MM-YYYY
}

/**
 * HistoryCard component displays a service history item with title, price, and date.
 *
 * @param title - The name of the service that was performed
 * @param price - The cost of the service in dollars
 * @param date - The date when the service was performed (format: DD-MM-YYYY)
 *
 * @returns A pressable card component showing service history details with relative time calculation
 */

export default function HistoryCard({ title, price, date }: HistoryCardProps) {
	const [focusedStyle, setFocusedStyle] = useState<{ borderColor?: string }>(
		{}
	);

	const calculateDaysAgo = (dateString: string): string => {
		// Parse DD-MM-YYYY format
		const [day, month, year] = dateString.split('-');
		const serviceDate = new Date(
			parseInt(year),
			parseInt(month) - 1,
			parseInt(day)
		);
		const today = new Date();

		// Reset time to compare only dates
		serviceDate.setHours(0, 0, 0, 0);
		today.setHours(0, 0, 0, 0);

		const timeDiff = today.getTime() - serviceDate.getTime();
		const daysDiff = Math.floor(timeDiff / (1000 * 3600 * 24));

		if (daysDiff === 0) return 'Hoy';
		if (daysDiff === 1) return 'Ayer';
		if (daysDiff < 7) return `Hace ${daysDiff} días`;
		if (daysDiff < 30) return `Hace ${Math.floor(daysDiff / 7)} semanas`;
		if (daysDiff < 365) return `Hace ${Math.floor(daysDiff / 30)} meses`;
		return `Hace ${Math.floor(daysDiff / 365)} años`;
	};

	const handlePress = () => {
		if (focusedStyle.borderColor === Colors.dark.primary) {
			setFocusedStyle({});
			return;
		}

		setFocusedStyle({
			borderColor: Colors.dark.primary,
		});
	};

	return (
		<Pressable
			onPress={() => handlePress()}
			style={{
				width: '100%',
				borderColor: Colors.dark.gray,
				borderWidth: 1,
				borderRadius: 8,
				padding: 20,
				...focusedStyle,
			}}
		>
			<View style={{ flex: 1, justifyContent: 'center', gap: 8 }}>
				<ThemeText style={{ fontSize: 16, fontWeight: 'bold' }}>
					{title}
				</ThemeText>
				<ThemeText style={{ fontSize: 16, color: Colors.dark.textLight }}>
					${price.toFixed(2)}
				</ThemeText>
				<View
					style={{
						flexDirection: 'row',
						justifyContent: 'space-between',
						alignItems: 'center',
					}}
				>
					<ThemeText style={{ fontSize: 14, color: Colors.dark.textLight }}>
						{date}
					</ThemeText>
					<ThemeText style={{ fontSize: 12, color: Colors.dark.primary }}>
						{calculateDaysAgo(date)}
					</ThemeText>
				</View>
			</View>
		</Pressable>
	);
}
