import { Tabs } from "expo-router";

const TabsLayout = () => {
  return (
    <Tabs>
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
