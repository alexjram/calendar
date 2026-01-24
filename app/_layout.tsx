import Ionicons from "@expo/vector-icons/Ionicons";
import { StatusBar } from "expo-status-bar";
import { Tabs } from "expo-router";
import { useFonts } from "@expo-google-fonts/happy-monkey/useFonts"
import { HappyMonkey_400Regular } from '@expo-google-fonts/happy-monkey/400Regular'
import { BLACK, PRIMARY, WHITE } from "@/constants/Colors";
import * as SQLite from "expo-sqlite";
import { drizzle } from 'drizzle-orm/expo-sqlite';
import Toast from 'react-native-toast-message';
import { useMigrations } from 'drizzle-orm/expo-sqlite/migrator';
import migrations from '../drizzle/migrations';
import { DBProvider } from "@/context/DBContext";
import { View } from "react-native";
import StyledText from "@/components/StyledText";
import * as Sentry from '@sentry/react-native';

Sentry.init({
  dsn: 'https://fb8e5e590241a7d2d9da8be7943796d0@o4510761183674368.ingest.us.sentry.io/4510761184395264',

  // Adds more context data to events (IP address, cookies, user, etc.)
  // For more information, visit: https://docs.sentry.io/platforms/react-native/data-management/data-collected/
  sendDefaultPii: true,

  // Enable Logs
  enableLogs: true,

  // Configure Session Replay
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1,
  integrations: [Sentry.mobileReplayIntegration()],

  // uncomment the line below to enable Spotlight (https://spotlightjs.com)
  // spotlight: __DEV__,
});

const expo = SQLite.openDatabaseSync('db.sqlite');
const db = drizzle(expo);

export default Sentry.wrap(function RootLayout() {
	const { success, error } = useMigrations(db, migrations);
	let [fontsLoaded] = useFonts({
		HappyMonkey_400Regular
	})
	if (!fontsLoaded) {
		return null
	}
	if (!success) {
		console.error('Database migration failed:', error);
		return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: WHITE }}>
			<StyledText>Database Error</StyledText>
			<StyledText>Please restart the app</StyledText>
		</View>
	}


	return (
		<DBProvider db={db}>
			<Tabs screenOptions={{
				tabBarActiveTintColor: PRIMARY,
				headerTintColor: BLACK,
			}}>
				<Tabs.Screen name="index" options={{
					title: 'Home',
					headerShown: false,
					tabBarIcon: ({ color, focused }) => (<Ionicons name={focused ? 'home-sharp' : 'home-outline'} color={color} size={24} />)
				}} />
				<Tabs.Screen name="(history)" options={{
					title: "History",
					headerShown: false,
					tabBarIcon: ({ color, focused }) => (<Ionicons name={focused ? 'calendar-sharp' : 'calendar-outline'} color={color} size={24} />)
				}} />
				<Tabs.Screen name="(stats)" options={{
					title: "Stats",
					headerShown: false,
					tabBarIcon: ({ color, focused }) => (<Ionicons name={focused ? 'stats-chart-sharp' : 'stats-chart-outline'} color={color} size={24} />)
				}} />
			</Tabs>
			<Toast />
			<StatusBar style="dark" />
		</DBProvider>
	);
});