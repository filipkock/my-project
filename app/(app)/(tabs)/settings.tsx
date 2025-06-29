import React from "react";
import { View, Alert, SafeAreaView, ScrollView } from "react-native";
import { Text } from "~/components/ui/text";
import { useAuth } from "~/src/context/auth";
import { User } from "firebase/auth";
import { Button } from "~/components/ui/button";
import { clearStorage } from "~/src/services/storage";
import { useNotification } from "~/src/context/notificationsContext";
import { ThemeToggle } from "~/components/ThemeToggle";
import { Card, CardContent, CardTitle } from "~/components/ui/card";
import { router } from "expo-router";

import * as Notifications from "expo-notifications";

const Settings = () => {
  const { user, signOut } = useAuth(); // Access the signOut function and user from AuthProvider

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

  // Remove all notifications
  async function clearAllNotifications() {
    await Notifications.cancelAllScheduledNotificationsAsync();
    console.log("All scheduled notifications cleared!");
  }

  return (
    <SafeAreaView className="flex-1">
      <ScrollView
        className="flex-1 w-full"
        contentContainerStyle={{ padding: 24, paddingBottom: 40 }}
      >
        <Text className="text-3xl font-bold px-2 pt-8 pb-2">Settings</Text>
        <View className="gap-6">
          {/* Subscription Section */}
          <Card className="bg-black mb-6">
            <CardContent className="gap-2 p-6">
              <CardTitle className="text-2xl text-white mb-2">
                Subscription
              </CardTitle>
              <Text className="text-white text-base mb-4">
                Unlock premium features and support the app!
              </Text>
              <Button
                variant="default"
                className="bg-white border-0"
                onPress={() => {
                  router.push("/subscription/subscriptionPlans");
                }}
              >
                <Text className="text-black font-bold">
                  Manage Subscription
                </Text>
              </Button>
            </CardContent>
          </Card>

          {/* Account Section */}
          <Card>
            <CardContent className="gap-2 p-4">
              <CardTitle className="text-lg mb-2">Account</CardTitle>
              {user?.isAnonymous ? (
                <>
                  <Text className="text-muted-foreground text-sm mb-4">
                    You're currently using a guest account. Create an account to
                    save your progress and avoid losing your data.
                  </Text>
                  <Button
                    variant={"default"}
                    className="w-full"
                    onPress={() =>
                      router.push("/(app)/settings/upgradeAccount")
                    }
                  >
                    <Text>Sign up</Text>
                  </Button>
                </>
              ) : (
                <Button
                  variant={"outline"}
                  className="w-full"
                  onPress={handleLogout}
                >
                  <Text>Logout</Text>
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Appearance Section - commented out for now as animation and images to not support dark mode */}
          {/* <Card>
            <CardContent className="gap-2 p-4 flex-row items-center justify-between">
              <CardTitle className="text-lg">Appearance</CardTitle>
              <ThemeToggle />
            </CardContent>
          </Card> */}

          {/* Notifications Section - add during testing */}
          {/* <Card>
            <CardContent className="gap-2 p-4">
              <CardTitle className="text-lg mb-2">
                Notifications - TESTING
              </CardTitle>
              <Button
                variant="outline"
                className="w-full"
                onPress={clearAllNotifications}
              >
                <Text>Remove scheduled notifications</Text>
              </Button>
            </CardContent>
          </Card> */}

          {/* Terms & Agreements Section */}
          <Card>
            <CardContent className="gap-2 p-4">
              <CardTitle className="text-lg mb-2">Legal</CardTitle>
              <Button
                variant="outline"
                className="w-full"
                onPress={() => {
                  // TODO: Navigate to terms screen or open modal
                  Alert.alert(
                    "Terms & Privacy",
                    "Open Terms & Privacy screen."
                  );
                }}
              >
                <Text>View Terms & Privacy</Text>
              </Button>
            </CardContent>
          </Card>

          {/* Feedback Section */}
          <Card>
            <CardContent className="gap-2 p-4">
              <CardTitle className="text-lg mb-2">Feedback</CardTitle>
              <Button
                variant="outline"
                className="w-full"
                onPress={() => {
                  // TODO: Open feedback screen or form
                  Alert.alert("Feedback", "Open feedback form or screen.");
                }}
              >
                <Text>Send Feedback</Text>
              </Button>
            </CardContent>
          </Card>

          {/* App Info Section */}
          <Card>
            <CardContent className="gap-2 p-4">
              <CardTitle className="text-lg mb-2">About</CardTitle>
              <Text className="text-muted-foreground">App version 1.0.0</Text>
              <Text className="text-muted-foreground">Made with ❤️</Text>
            </CardContent>
          </Card>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default Settings;
