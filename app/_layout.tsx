import Ionicons from "@expo/vector-icons/Ionicons";
import { Tabs } from "expo-router";
import { useFonts } from "@expo-google-fonts/happy-monkey/useFonts"
import { HappyMonkey_400Regular } from '@expo-google-fonts/happy-monkey/400Regular'
import { BLACK, PRIMARY, WHITE } from "@/constants/Colors";
import * as SQLite from "expo-sqlite";
import { drizzle } from 'drizzle-orm/expo-sqlite';
import { DefaultLogger } from 'drizzle-orm/logger';
import { useMigrations } from 'drizzle-orm/expo-sqlite/migrator';
import migrations from '../drizzle/migrations';
import { DBProvider } from "@/context/DBContext";
import { View } from "react-native";
import StyledText from "@/components/StyledText";

const expo = SQLite.openDatabaseSync('db.sqlite');
const db = drizzle(expo, { logger: true });

export default function RootLayout() {
	const { success, error } = useMigrations(db, migrations);
	let [fontsLoaded] = useFonts({
		HappyMonkey_400Regular
	})
	if (!fontsLoaded) {
		return null
	}
	if (!success) {
		console.error(error);
		return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: WHITE }}>
			<StyledText>Error loading DB</StyledText>
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
		</DBProvider>
	);
}
