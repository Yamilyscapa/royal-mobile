import { Text, TextStyle, StyleSheet, ViewStyle, View } from 'react-native';
import { useTheme } from '@react-navigation/native';
import Colors from '@/constants/Colors';

interface ThemeTextProps {
	children: React.ReactNode;
	style?: TextStyle;
}

interface ContainerProps {
	children: React.ReactNode;
	style?: ViewStyle;
}

export function ThemeText({ children, style }: ThemeTextProps) {
	const theme = useTheme();
	const textStyle = theme.dark ? styles.dark.text : styles.light.text;

	return <Text style={[textStyle, style]}>{children}</Text>;
}

export function Container({ children, style }: ContainerProps) {
	return <View style={{ paddingHorizontal: 20, ...style }}>{children}</View>;
}

const stylesDark = StyleSheet.create({
	text: {
		color: Colors.dark.text,
	},
});

const stylesLight = StyleSheet.create({
	text: {
		color: Colors.light.text,
	},
});

const styles = {
	dark: stylesDark,
	light: stylesLight,
} as const;
