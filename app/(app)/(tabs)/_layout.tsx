import { Tabs } from "expo-router";

const TabsLayout = () => {
  return (
    <Tabs>
      <Tabs.Screen name="(home)"></Tabs.Screen>
      <Tabs.Screen name="about"></Tabs.Screen>
      <Tabs.Screen name="settings"></Tabs.Screen>
    </Tabs>
  );
};

export default TabsLayout;
