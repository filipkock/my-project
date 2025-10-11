import React from "react";
import { Alert } from "react-native";
import { Tabs } from "expo-router";
import { useTheme } from "@react-navigation/native";
import {
  HomeIcon,
  SquaresPlusIcon,
  BookOpenIcon,
  UserCircleIcon,
  PlusIcon,
} from "react-native-heroicons/solid";
import { Button } from "~/components/ui/button";
import { router } from "expo-router";
import { checkAndResetStreakIfNeeded } from "~/src/utils/streakResetOnLaunch";
import { refreshRemindersOnLaunch } from "~/src/utils/refreshRemindersOnLaunch";
import { useGlobalNotificationHandler } from "~/src/utils/useGlobalNotificationHandler";
import { usePremiumGate } from "~/src/hooks/usePremiumGate";
import { getFromStorage } from "~/src/services/storage";
import { db } from "~/config/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";

const TabsLayout = () => {
  const { colors } = useTheme();
  const { isPremium } = usePremiumGate();

  React.useEffect(() => {
    // Check if we should reset the streak on app launch
    checkAndResetStreakIfNeeded();
    // Create relevant reminders and notifications
    refreshRemindersOnLaunch();
  }, []);

  // Runs if user changes from notificatinos denied to allowed, and reschedule notifications
  useGlobalNotificationHandler();

  const handleAddMedicationPress = async () => {
    try {
      if (isPremium) {
        router.push("/addNewMedication/step1");
        return;
      }

      // Free users: allow only one medication
      const user = await getFromStorage("userDetails");
      const uid = user?.uid;
      if (!uid) {
        // Fallback: if no user, block and hint to login
        Alert.alert("Sign in required", "Please sign in to add a medication.");
        return;
      }

      const medicationQuery = query(
        collection(db, "medication"),
        where("uid", "==", uid)
      );
      const snapshot = await getDocs(medicationQuery);
      const count = snapshot.size;

      if (count >= 2) {
        Alert.alert(
          "Limit reached",
          "The free version allows two medication. Upgrade to Premium for unlimited.",
          [
            { text: "OK", style: "cancel" },
            {
              text: "Upgrade to Premium",
              onPress: () => router.push("/subscription/subscriptionPlans"),
            },
          ]
        );
        return;
      }

      // Under the limit → allow
      router.push("/addNewMedication/step1");
    } catch (e) {
      console.error("Add medication gate error", e);
      Alert.alert("Something went wrong", "Please try again in a moment.");
    }
  };

  return (
    <>
      <Tabs
        screenOptions={({ route }) => ({
          tabBarStyle: {
            backgroundColor: colors.background,
            borderTopWidth: 0,
          },
          tabBarItemStyle:
            route.name === "(medications)"
              ? { marginRight: 56 }
              : route.name === "collection"
              ? { marginLeft: 56 }
              : {},
        })}
      >
        <Tabs.Screen
          name="(home)"
          options={{
            headerShown: false,
            tabBarIcon: ({ color, size }) => (
              <HomeIcon color={color} size={size} />
            ),
            tabBarLabel: () => null,
            animation: "fade",
          }}
        />
        <Tabs.Screen
          name="(medications)"
          options={{
            headerShown: false,
            tabBarIcon: ({ color, size }) => (
              <SquaresPlusIcon color={color} size={size} />
            ),
            tabBarLabel: () => null,
            animation: "fade",
          }}
        />

        <Tabs.Screen
          name="(myCollection)"
          options={{
            headerShown: false,
            tabBarIcon: ({ color, size }) => (
              <BookOpenIcon color={color} size={size} />
            ),
            tabBarLabel: () => null,
            animation: "fade",
          }}
        />
        <Tabs.Screen
          name="settings"
          options={{
            headerShown: false,
            tabBarIcon: ({ color, size }) => (
              <UserCircleIcon color={color} size={size} />
            ),
            tabBarLabel: () => null,
            animation: "fade",
          }}
        />
      </Tabs>
      <Button
        className="absolute left-1/2 -translate-x-1/2 w-16 h-16 rounded-full"
        style={{ bottom: 50 }}
        onPress={handleAddMedicationPress}
        size={"icon"}
      >
        <PlusIcon size={24} color="white" />
      </Button>
    </>
  );
};

export default TabsLayout;
