import Colors from '@/constants/Colors';
import {
	Pressable,
	StyleProp,
	StyleSheet,
	Text,
	ViewStyle,
} from 'react-native';

interface ButtonProps {
	children: React.ReactNode;
	onPress?: () => void;
	style?: StyleProp<ViewStyle>;
	secondary?: boolean;
	disabled?: boolean;
}

export default function Button({
	children,
	onPress,
	style,
	secondary,
	disabled,
}: ButtonProps) {
	return (
		<Pressable
			onPress={disabled ? undefined : onPress}
			style={[
				styles.button,
				style,
				secondary && styles.secondary,
				disabled && styles.disabled,
			]}
		>
			<Text style={[styles.text, secondary && styles.secondaryText]}>
				{children}
			</Text>
		</Pressable>
	);
}

const styles = StyleSheet.create({
	button: {
		backgroundColor: Colors.dark.primary,
		alignItems: 'center',
		justifyContent: 'center',
		borderRadius: 10,
		padding: 10,
		maxWidth: '100%',
		minWidth: '49%',
		height: 50,
		borderWidth: 1,
		borderColor: Colors.dark.primary,
	},
	text: {
		color: Colors.dark.background,
		fontSize: 16,
		fontWeight: 'bold',
	},
	secondary: {
		backgroundColor: Colors.dark.gray,
		borderColor: Colors.dark.primary,
	},
	secondaryText: {
		color: Colors.dark.text,
	},
	disabled: {
		opacity: 0.3,
	},
});
