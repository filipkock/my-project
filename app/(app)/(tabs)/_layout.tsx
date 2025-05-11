import { Tabs } from "expo-router";
import { useTheme } from "@react-navigation/native";

const TabsLayout = () => {
  const { colors } = useTheme();

  return (
    <Tabs
      screenOptions={{
        tabBarStyle: {
          backgroundColor: colors.background,
          borderTopWidth: 0,
        },
      }}
    >
      <Tabs.Screen
        name="(home)"
        options={{
          headerShown: false,
        }}
      ></Tabs.Screen>
      <Tabs.Screen
        name="(medications)/index"
        options={{
          headerShown: false,
        }}
      ></Tabs.Screen>
      <Tabs.Screen
        name="about"
        options={{
          headerShown: false,
        }}
      ></Tabs.Screen>
      <Tabs.Screen
        name="settings"
        options={{
          headerShown: false,
        }}
      ></Tabs.Screen>
    </Tabs>
  );
};

export default TabsLayout;
