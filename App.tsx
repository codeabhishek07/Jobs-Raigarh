import 'react-native-gesture-handler';
import React from 'react';
import { View, ActivityIndicator, Text, StyleSheet, Platform } from 'react-native';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import Ionicons from '@expo/vector-icons/Ionicons';

import { StoreProvider, useStore } from './lib/store';
import { colors } from './lib/theme';

import AuthScreen from './screens/AuthScreen';
import HomeScreen from './screens/HomeScreen';
import JobsScreen from './screens/JobsScreen';
import JobDetailsScreen from './screens/JobDetailsScreen';
import ApplyScreen from './screens/ApplyScreen';
import ApplicationsScreen from './screens/ApplicationsScreen';
import SavedScreen from './screens/SavedScreen';
import ProfileScreen from './screens/ProfileScreen';
import EditProfileScreen from './screens/EditProfileScreen';
import NotificationsScreen from './screens/NotificationsScreen';
import AboutScreen from './screens/AboutScreen';
import LegalScreen from './screens/LegalScreen';
import AdminScreen from './screens/AdminScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const navTheme = {
  ...DefaultTheme,
  colors: { ...DefaultTheme.colors, background: colors.bg, primary: colors.primary, card: colors.card, text: colors.text, border: colors.border },
};

const TAB_ICONS: Record<string, [string, string]> = {
  Home: ['home', 'home-outline'],
  Jobs: ['briefcase', 'briefcase-outline'],
  Applications: ['documents', 'documents-outline'],
  Saved: ['bookmark', 'bookmark-outline'],
  Profile: ['person', 'person-outline'],
};

function SeekerTabs() {
  const { unreadCount, applications, user } = useStore();
  const myApps = applications.filter((a) => a.userId === user?.id).length;
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textFaint,
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopColor: colors.border,
          height: Platform.OS === 'ios' ? 84 : 64,
          paddingBottom: Platform.OS === 'ios' ? 28 : 10,
          paddingTop: 8,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '700' },
        tabBarIcon: ({ focused, color, size }) => {
          const [active, inactive] = TAB_ICONS[route.name];
          return <Ionicons name={(focused ? active : inactive) as any} size={22} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Jobs" component={JobsScreen} />
      <Tab.Screen name="Applications" component={ApplicationsScreen} options={{ tabBarBadge: myApps > 0 ? myApps : undefined }} />
      <Tab.Screen name="Saved" component={SavedScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

function SeekerNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Tabs" component={SeekerTabs} />
      <Stack.Screen name="JobDetails" component={JobDetailsScreen} />
      <Stack.Screen name="Apply" component={ApplyScreen} options={{ presentation: 'modal' }} />
      <Stack.Screen name="EditProfile" component={EditProfileScreen} options={{ presentation: 'modal' }} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} />
      <Stack.Screen name="About" component={AboutScreen} />
      <Stack.Screen name="Legal" component={LegalScreen} />
    </Stack.Navigator>
  );
}

function Root() {
  const { loading, user } = useStore();
  if (loading) {
    return (
      <View style={styles.splash}>
        <View style={styles.splashLogo}>
          <Ionicons name="briefcase" size={38} color={colors.white} />
        </View>
        <Text style={styles.splashTitle}>Jobs at Raigarh</Text>
        <Text style={styles.splashSub}>Connecting Talent with Opportunities</Text>
        <ActivityIndicator color={colors.primary} style={{ marginTop: 20 }} />
      </View>
    );
  }
  if (!user) return <AuthScreen />;
  if (user.role === 'admin') return <AdminScreen />;
  return <SeekerNavigator />;
}

export default function App() {
  const [fontsLoaded] = useFonts({ ...Ionicons.font });
  if (!fontsLoaded) return null;
  return (
    <SafeAreaProvider>
      <NavigationContainer theme={navTheme}>
        <StoreProvider>
          <StatusBar style="dark" />
          <Root />
        </StoreProvider>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  splash: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg },
  splashLogo: { width: 84, height: 84, borderRadius: 22, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  splashTitle: { fontSize: 24, fontWeight: '900', color: colors.text, marginTop: 18 },
  splashSub: { fontSize: 13.5, color: colors.textMuted, marginTop: 5 },
});
