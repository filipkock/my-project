import React from "react";
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

const TabsLayout = () => {
  const { colors } = useTheme();

  // Check if we should reset the streak on app launch
  // Create relevant reminders and notifications
  React.useEffect(() => {
    checkAndResetStreakIfNeeded();
    refreshRemindersOnLaunch();
  }, []);

  // Runs if user changes from notificatinos denied to allowed, and reschedule notifications
  useGlobalNotificationHandler();

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
              ? { marginRight: 48 }
              : route.name === "collection"
              ? { marginLeft: 48 }
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
        style={{ bottom: 32 }}
        onPress={() => router.push("/addNewMedication/step1")}
        size={"icon"}
      >
        <PlusIcon size={24} color="white" />
      </Button>
    </>
  );
};

export default TabsLayout;
