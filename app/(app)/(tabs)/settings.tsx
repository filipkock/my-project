import React from "react";
import { View, Alert, SafeAreaView } from "react-native";
import { Text } from "~/components/ui/text";
import { useAuth } from "~/src/context/auth";
import { Button } from "~/components/ui/button";
import { clearStorage } from "~/src/services/storage";
import { useNotification } from "~/src/context/notificationsContext";
import { ThemeToggle } from "~/components/ThemeToggle";

import * as Notifications from "expo-notifications";

const Settings = () => {
  const { signOut } = useAuth(); // Access the signOut function from AuthProvider

  const handleLogout = async () => {
    try {
      await signOut(); // Trigger the Firebase Auth sign-out
      clearStorage();
      Alert.alert("Logged Out", "You have been logged out successfully.");
    } catch (error: any) {
      Alert.alert("Logout Error", error.message);
    }
  };

  // Expo notificaion testing
  const { notification, expoPushToken, error } = useNotification();
  if (error) {
    return <Text>Error: {error.message}</Text>;
  }

  // Remove all notifications
  async function clearAllNotifications() {
    await Notifications.cancelAllScheduledNotificationsAsync();
    console.log("All scheduled notifications cleared!");
  }

  return (
    <SafeAreaView className="flex-1 bg-secondary/30 p-8">
      <View className="flex-1 w-full p-10">
        <Text className="text-xl mb-5">Settings</Text>
        <Button variant={"default"} className="w-full" onPress={handleLogout}>
          <Text>Logout</Text>
        </Button>
        <View className="w-full flex-row py-10">
          <ThemeToggle />
        </View>

        {/* notificaion testing section */}
        <Text>Updates Demo 5</Text>
        <Text>Expo token:</Text>
        <Text>{expoPushToken}</Text>
        <Text>Latest notification:</Text>
        <Text>{notification?.request.content.title}</Text>
        <Text>
          {JSON.stringify(notification?.request.content.data, null, 2)}
        </Text>
      </View>

      <Button
        variant={"default"}
        className="w-full"
        onPress={clearAllNotifications}
      >
        <Text>Remove notifications</Text>
      </Button>
    </SafeAreaView>
  );
};

export default Settings;
