import "~/global.css";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  DarkTheme,
  DefaultTheme,
  Theme,
  ThemeProvider,
} from "@react-navigation/native";
import { Slot, SplashScreen } from "expo-router";
import * as React from "react";
import { Platform } from "react-native";
import { NAV_THEME } from "~/lib/constants";
import { useColorScheme } from "~/lib/useColorScheme";
import { PortalHost } from "@rn-primitives/portal";
import { setAndroidNavigationBar } from "~/lib/android-navigation-bar";
import { AuthProvider } from "../src/context/auth";
import { NotificationProvider } from "~/src/context/notificationsContext";
import * as Notifications from "expo-notifications";
import {
  Poppins_300Light,
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold,
  Poppins_800ExtraBold,
  useFonts,
} from "@expo-google-fonts/poppins";
import { checkAndResetStreakIfNeeded } from "~/src/utils/streakResetOnLaunch";
import { SelectedDateProvider } from "~/src/context/SelectedDateContext";
import Toast from "react-native-toast-message";

// ==== react native reusables theme setup ====
const LIGHT_THEME: Theme = {
  ...DefaultTheme,
  colors: NAV_THEME.light,
};
const DARK_THEME: Theme = {
  ...DarkTheme,
  colors: NAV_THEME.dark,
};

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from "expo-router";

// Prevent the splash screen from auto-hiding before getting the color scheme.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    /* PostScript names — needed by Agenda */
    PoppinsLight: Poppins_300Light,
    PoppinsRegular: Poppins_400Regular,
    PoppinsMedium: Poppins_500Medium,
    PoppinsSemiBold: Poppins_600SemiBold,
    PoppinsBold: Poppins_700Bold,
    PoppinsExtraBold: Poppins_800ExtraBold,

    /* Generic family used by Tailwind / NativeWind */
    Poppins: Poppins_400Regular, // base weight
  });
  const { colorScheme, setColorScheme, isDarkColorScheme } = useColorScheme();
  const [isColorSchemeLoaded, setIsColorSchemeLoaded] = React.useState(false);

  // Default functionality included from project start
  React.useEffect(() => {
    (async () => {
      const theme = await AsyncStorage.getItem("theme");
      if (Platform.OS === "web") {
        // Adds the background color to the html element to prevent white background on overscroll.
        document.documentElement.classList.add("bg-background");
      }
      if (!theme) {
        AsyncStorage.setItem("theme", colorScheme);
        setIsColorSchemeLoaded(true);
        return;
      }
      const colorTheme = theme === "dark" ? "dark" : "light";
      if (colorTheme !== colorScheme) {
        setColorScheme(colorTheme);
        setAndroidNavigationBar(colorTheme);
        setIsColorSchemeLoaded(true);
        return;
      }
      setAndroidNavigationBar(colorTheme);
      setIsColorSchemeLoaded(true);
    })();
  }, []);

  // Check if we should reset the streak on app launch
  React.useEffect(() => {
    checkAndResetStreakIfNeeded();
  }, []);

  // Ensure font and color is loaded
  React.useEffect(() => {
    if (fontsLoaded && isColorSchemeLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, isColorSchemeLoaded]);

  if (!isColorSchemeLoaded || !fontsLoaded) {
    return null;
  }

  // ==== Notification setup inside app ====
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });

  return (
    <AuthProvider>
      <NotificationProvider>
        <ThemeProvider value={isDarkColorScheme ? DARK_THEME : LIGHT_THEME}>
          <SelectedDateProvider>
            <Slot></Slot>
            <PortalHost />
            <Toast />
          </SelectedDateProvider>
        </ThemeProvider>
      </NotificationProvider>
    </AuthProvider>
  );
}
