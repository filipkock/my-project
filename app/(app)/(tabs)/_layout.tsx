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

const TabsLayout = () => {
  const { colors } = useTheme();

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
              ? { marginRight: 42 }
              : route.name === "collection"
              ? { marginLeft: 42 }
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
          name="(collection)"
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
        className="absolute bottom-16 left-1/2 -translate-x-1/2 w-16 h-16 rounded-full"
        onPress={() => router.push("/addNewMedication/step1")}
        size={"icon"}
      >
        <PlusIcon size={24} color="white" />
      </Button>
    </>
  );
};

export default TabsLayout;
