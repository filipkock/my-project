import React, { useEffect, useState } from "react";
import { View, Alert, SafeAreaView, ScrollView } from "react-native";
import { Text } from "~/components/ui/text";
import { useAuth } from "~/src/context/auth";
import { Button } from "~/components/ui/button";
import { clearStorage } from "~/src/services/storage";
import { useNotification } from "~/src/context/notificationsContext";
import { ThemeToggle } from "~/components/ThemeToggle";
import { Card, CardContent, CardTitle } from "~/components/ui/card";
import { router } from "expo-router";

import * as Notifications from "expo-notifications";
import * as Linking from "expo-linking";

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
  const [permissionGranted, setPermissionGranted] = useState<boolean | null>(
    null
  );
  const { registerPushToken } = useNotification();

  useEffect(() => {
    const checkNotificationPermissions = async () => {
      const { status } = await Notifications.getPermissionsAsync();
      setPermissionGranted(status === "granted");
    };

    checkNotificationPermissions();
  }, []);

  const requestAndRegisterNotifications = async () => {
    const { status } = await Notifications.requestPermissionsAsync();
    if (status === "granted") {
      await registerPushToken();
      setPermissionGranted(true);
    } else {
      console.log("Notification permission not granted.");
    }
  };

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
                <>
                  {user?.email ? (
                    <Text className="text-muted-foreground text-sm mb-4">
                      Signed in as {user.email}
                    </Text>
                  ) : (
                    <Text className="text-muted-foreground text-sm mb-4">
                      You are signed in.
                    </Text>
                  )}
                  <Button
                    variant={"outline"}
                    className="w-full"
                    onPress={handleLogout}
                  >
                    <Text>Logout</Text>
                  </Button>
                </>
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

          {permissionGranted === false && (
            <Card>
              <CardContent className="gap-2 p-4">
                <CardTitle className="text-lg mb-2">
                  Enable Notifications
                </CardTitle>
                <Text className="text-muted-foreground text-sm mb-4">
                  Turn on push notifications to get medication reminders and
                  updates.
                </Text>
                <Button
                  variant="default"
                  className="w-full"
                  onPress={async () => {
                    const { status, canAskAgain } =
                      await Notifications.getPermissionsAsync();

                    if (status === "granted") {
                      setPermissionGranted(true);
                      await registerPushToken();
                    } else if (!canAskAgain) {
                      Alert.alert(
                        "Enable Notifications",
                        "You've previously denied notification access. To enable it, go to Settings > Notifications.",
                        [
                          {
                            text: "Open Settings",
                            onPress: () => {
                              Linking.openSettings();
                            },
                          },
                          { text: "Cancel", style: "cancel" },
                        ]
                      );
                    } else {
                      const request =
                        await Notifications.requestPermissionsAsync();
                      if (request.status === "granted") {
                        setPermissionGranted(true);
                        await registerPushToken();
                      } else {
                        console.log("Permission denied again.");
                      }
                    }
                  }}
                >
                  <Text>Allow Notifications</Text>
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Feedback Section */}
          <Card>
            <CardContent className="gap-2 p-4">
              <CardTitle className="text-lg mb-2">Feedback</CardTitle>
              <Text className="text-muted-foreground text-sm mb-2">
                All feedback is welcome. Feature requests, ideas for what you'd
                like to see, bugs, or any questions.
              </Text>
              <Button
                variant="outline"
                className="w-full"
                onPress={() => {
                  Linking.openURL("mailto:pokareminder@gmail.com");
                }}
              >
                <Text>Send Feedback</Text>
              </Button>
            </CardContent>
          </Card>

          {/* Terms & Agreements Section */}
          <Card>
            <CardContent className="gap-2 p-4">
              <CardTitle className="text-lg mb-2">Legal</CardTitle>
              <Text className="text-muted-foreground text-sm mb-2">
                Read our policies to understand how we handle your data and your
                rights.
              </Text>
              <Button
                variant="outline"
                className="w-full"
                onPress={() => {
                  Linking.openURL("https://pokareminder.com/privacy.html");
                }}
              >
                <Text>Privacy Policy</Text>
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onPress={() => {
                  Linking.openURL("https://pokareminder.com/terms.html");
                }}
              >
                <Text>Terms & Conditions</Text>
              </Button>
            </CardContent>
          </Card>

          {/* App Info Section */}
          <Card>
            <CardContent className="gap-2 p-4">
              <CardTitle className="text-lg mb-2">About</CardTitle>
              <Text className="text-muted-foreground text-sm mb-2">
                Hi! I’m the developer and designer behind Poka. I built it as a
                passion project to make everyday tasks like taking medications a
                little more fun. I hope you enjoy it, and thank you for
                supporting it ❤️
              </Text>
            </CardContent>
          </Card>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default Settings;
