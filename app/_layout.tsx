import "~/global.css";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  DarkTheme,
  DefaultTheme,
  Theme,
  ThemeProvider,
} from "@react-navigation/native";
import { Slot, SplashScreen } from "expo-router";
import React, { useState } from "react";
import Splash from "./SplashScreen";
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
import { SelectedDateProvider } from "~/src/context/SelectedDateContext";
import Toast from "react-native-toast-message";
import toastConfig from "~/src/constants/toastConfig";
import NoInternetBanner from "~/components/custom/NoInternetBanner";
import Purchases, { LOG_LEVEL } from "react-native-purchases";
import Constants from "expo-constants";
import { SubscriptionProvider } from "~/src/providers/SubscriptionProvider";

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
  const [showSplash, setShowSplash] = useState(true);
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
  // Force light mode, uncomment if it is to be added
  // const { colorScheme, setColorScheme, isDarkColorScheme } = useColorScheme();
  const isDarkColorScheme = false;
  const [isColorSchemeLoaded, setIsColorSchemeLoaded] = React.useState(false);

  // Force light mode, consider removing later on
  React.useEffect(() => {
    // (async () => {
    //   const theme = await AsyncStorage.getItem("theme");
    //   if (Platform.OS === "web") {
    //     // Adds the background color to the html element to prevent white background on overscroll.
    //     document.documentElement.classList.add("bg-background");
    //   }
    //   if (!theme) {
    //     AsyncStorage.setItem("theme", colorScheme);
    //     setIsColorSchemeLoaded(true);
    //     return;
    //   }
    //   const colorTheme = theme === "dark" ? "dark" : "light";
    //   if (colorTheme !== colorScheme) {
    //     setColorScheme(colorTheme);
    //     setAndroidNavigationBar(colorTheme);
    //     setIsColorSchemeLoaded(true);
    //     return;
    //   }
    //   setAndroidNavigationBar(colorTheme);
    //   setIsColorSchemeLoaded(true);
    // })();
    // Force color scheme loaded for light mode
    setIsColorSchemeLoaded(true);
  }, []);

  // Subscription plans setup - needs further setup and testing
  React.useEffect(() => {
    Purchases.setLogLevel(LOG_LEVEL.VERBOSE);

    if (Platform.OS === "ios") {
      Purchases.configure({
        apiKey: Constants.expoConfig?.extra?.appstoreApiKey ?? "",
      });
    }
    // ===== I need to set this up later once I have tested the app on Android =====
    // else if (Platform.OS === "android") {
    //   Purchases.configure({ apiKey: "YOUR_REVENUECAT_GOOGLE_API_KEY" });

    //   // OR: if building for Amazon, be sure to follow the installation instructions then:
    //   Purchases.configure({
    //     apiKey: "YOUR_REVENUECAT_AMAZON_API_KEY",
    //     useAmazon: true,
    //   });
    // }
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
    <>
      {showSplash ? (
        <Splash onFinish={() => setShowSplash(false)} />
      ) : (
        <AuthProvider>
          <SubscriptionProvider>
            <NotificationProvider>
              <ThemeProvider
                value={isDarkColorScheme ? DARK_THEME : LIGHT_THEME}
              >
                <SelectedDateProvider>
                  <NoInternetBanner />
                  <Slot />

                  {/* Keep these inside, too */}
                  <PortalHost />
                  <Toast config={toastConfig} />
                </SelectedDateProvider>
              </ThemeProvider>
            </NotificationProvider>
          </SubscriptionProvider>
        </AuthProvider>
      )}
    </>
  );
}
