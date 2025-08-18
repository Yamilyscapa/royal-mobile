// React core imports
import React, { useEffect } from 'react';

// Third-party library imports
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Stack, Tabs, router } from 'expo-router';

// Local imports
import Colors from '@/constants/Colors';
import { useAuth } from '@/components/auth/AuthContext';

function TabBarIcon(props: {
	name: React.ComponentProps<typeof FontAwesome>['name'];
	color: string;
}) {
	return <FontAwesome size={28} style={{ marginBottom: -3 }} {...props} />;
}

export default function TabLayout() {
	const { user, isLoading } = useAuth();
	
	// Redirect unauthenticated users to welcome page
	useEffect(() => {
		if (!isLoading && !user) {
			console.log('TabLayout: No user detected, redirecting to welcome');
			router.replace('/auth/welcome');
		}
	}, [user, isLoading]);
	
	// Don't render tabs if user is not authenticated
	if (isLoading || !user) {
		return null;
	}
	
	return (
		<Tabs
			screenOptions={{
				tabBarActiveTintColor: Colors.dark.primary,
				headerShown: false,
			}}
		>
			<Tabs.Screen
				name="index"
				options={{
					title: 'Inicio',
					headerShown: false,
					tabBarIcon: ({ color }) => <TabBarIcon name="home" color={color} />,
				}}
			/>
			<Tabs.Screen
				name="history"
				options={{
					title: 'Historial',
					headerShown: false,
					tabBarIcon: ({ color }) => (
						<TabBarIcon name="history" color={color} />
					),
				}}
			/>

			<Tabs.Screen
				name="profile"
				options={{
					title: 'Perfil',
					headerShown: false,
					tabBarIcon: ({ color }) => <TabBarIcon name="user" color={color} />,
				}}
			/>
		</Tabs>
	);
}
