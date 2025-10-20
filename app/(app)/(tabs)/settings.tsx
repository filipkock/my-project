import React, { useEffect, useState } from "react";
import {
  View,
  Alert,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
  Modal,
  BackHandler,
} from "react-native";
import { getAuth } from "firebase/auth";
import {
  getFirestore,
  collection,
  doc,
  query,
  where,
  limit,
  getDocs,
  startAfter,
  writeBatch,
  deleteDoc,
} from "firebase/firestore";
import { Text } from "~/components/ui/text";
import { useAuth } from "~/src/context/auth";
import { Button } from "~/components/ui/button";
import { clearStorage } from "~/src/services/storage";
import { useNotification } from "~/src/context/notificationsContext";
import { ThemeToggle } from "~/components/ThemeToggle";
import { Card, CardContent, CardTitle } from "~/components/ui/card";
import { router } from "expo-router";
import { useSettings } from "~/src/context/settingsContext";
import { Switch } from "react-native";

import * as Notifications from "expo-notifications";
import * as Linking from "expo-linking";
import Purchases from "react-native-purchases";

const Settings = () => {
  const { user, signOut } = useAuth(); // Access the signOut function and user from AuthProvider

  const [isSubscribed, setIsSubscribed] = useState(false);
  const [planName, setPlanName] = useState("");
  const [deleting, setDeleting] = useState(false);

  const { soundEnabled, toggleSound } = useSettings();

  useEffect(() => {
    const fetchSubscriptionStatus = async () => {
      try {
        const customerInfo = await Purchases.getCustomerInfo();
        const activeEntitlements = customerInfo.entitlements.active;
        if (activeEntitlements && Object.keys(activeEntitlements).length > 0) {
          const firstEntitlement =
            activeEntitlements[Object.keys(activeEntitlements)[0]];
          const productId = firstEntitlement.productIdentifier || "";

          // Fetch offerings to find product title
          const offerings = await Purchases.getOfferings();
          let productTitle = productId;

          if (
            offerings.current &&
            offerings.current.availablePackages &&
            offerings.current.availablePackages.length > 0
          ) {
            const matchedPackage = offerings.current.availablePackages.find(
              (pkg) => pkg.product.identifier === productId
            );
            if (matchedPackage) {
              productTitle = matchedPackage.product.title || productId;
            }
          }

          setIsSubscribed(true);
          setPlanName(productTitle);
        } else {
          setIsSubscribed(false);
          setPlanName("");
        }
      } catch (error) {
        console.log("Error fetching subscription status:", error);
        setIsSubscribed(false);
        setPlanName("");
      }
    };

    fetchSubscriptionStatus();
  }, []);

  useEffect(() => {
    if (!deleting) return;
    const sub = BackHandler.addEventListener("hardwareBackPress", () => true);
    return () => sub.remove();
  }, [deleting]);

  const handleLogout = async () => {
    try {
      await signOut(); // Trigger the Firebase Auth sign-out
      clearStorage();
      Alert.alert("Logged Out", "You have been logged out successfully.");
    } catch (error: any) {
      Alert.alert("Logout Error", error.message);
    }
  };

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

  // --- Client-side account & data deletion helpers ---
  async function deleteCollectionByUidChunks(
    collectionPath: string,
    uid: string,
    chunkSize = 300
  ) {
    const db = getFirestore();
    let lastDoc: any = null;
    while (true) {
      const base = collection(db, collectionPath);
      const q = lastDoc
        ? query(
            base,
            where("uid", "==", uid),
            limit(chunkSize),
            startAfter(lastDoc)
          )
        : query(base, where("uid", "==", uid), limit(chunkSize));
      const snap = await getDocs(q);
      if (snap.empty) break;
      const batch = writeBatch(db);
      snap.docs.forEach((d) => batch.delete(d.ref));
      await batch.commit();
      lastDoc = snap.docs[snap.docs.length - 1];
      if (snap.size < chunkSize) break;
    }
  }

  async function deleteDocById(collectionPath: string, id: string) {
    const db = getFirestore();
    const ref = doc(db, collectionPath, id);
    try {
      await deleteDoc(ref);
    } catch (e) {
      // ok if it doesn't exist
    }
  }

  async function deleteAllUserDataClientSide(uid: string) {
    // Collections with a `uid` field per document
    await deleteCollectionByUidChunks("medication", uid);
    await deleteCollectionByUidChunks("reminders", uid);
    await deleteCollectionByUidChunks("userCards", uid);
    await deleteCollectionByUidChunks("userStreaks", uid);

    // Collections where document ID == uid (no `uid` field)
    await deleteDocById("userStreakMeta", uid);
    await deleteDocById("users", uid);
  }
  // --- End helpers ---

  // Remove all notifications - for testing
  async function clearAllNotifications() {
    await Notifications.cancelAllScheduledNotificationsAsync();
    console.log("All scheduled notifications cleared!");
  }

  const handleConfirmDelete = async () => {
    try {
      setDeleting(true);

      const auth = getAuth();
      const current = auth.currentUser;
      if (!current) throw new Error("Not signed in.");
      const uid = current.uid;

      // 1) Delete Firestore data tied to this uid (client-side)
      await deleteAllUserDataClientSide(uid);

      // 2) Delete the authenticated user from Firebase Auth (may require recent login)
      await current.delete();

      // Log out of RevenueCat identity on this device
      try {
        await Purchases.logOut();
      } catch {}

      // 3) Local cleanup and redirect
      clearStorage();
      Alert.alert(
        "Account deleted",
        "Your account and all associated data have been deleted.",
        [{ text: "OK", onPress: () => router.replace("/") }]
      );
    } catch (err: any) {
      console.log("Delete account error:", err);
      Alert.alert(
        "Deletion failed",
        "Something went wrong while deleting your account. You may need to log out and sign back in, then try again."
      );
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteAccount = () => {
    if (isSubscribed) {
      Alert.alert(
        "Delete account?",
        "You're currently subscribed. Deleting your account will NOT cancel your subscription. To stop future charges, manage your subscription in the App Store/Google Play.\n\nYou can still delete your account if you prefer.",
        [
          {
            text: "Manage Subscription",
            onPress: () => {
              // iOS deep link; Play Store link can be added if you support Android billing
              Linking.openURL(
                "itms-apps://apps.apple.com/account/subscriptions"
              );
            },
          },
          { text: "Cancel", style: "cancel" },
          {
            text: "Delete Anyway",
            style: "destructive",
            onPress: handleConfirmDelete,
          },
        ]
      );
    } else {
      Alert.alert(
        "Delete account?",
        "This will permanently delete your account and data. This action cannot be undone.",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Delete",
            style: "destructive",
            onPress: handleConfirmDelete,
          },
        ]
      );
    }
  };

  return (
    <SafeAreaView className="flex-1">
      <ScrollView
        className="flex-1 w-full"
        contentContainerStyle={{ padding: 24, paddingBottom: 40 }}
      >
        <Text className="text-3xl font-bold px-2 pt-8 pb-2">Settings</Text>
        <View className="gap-6">
          {/* Subscription Section */}
          {isSubscribed ? (
            <Card>
              <CardContent className="gap-2 p-4">
                <CardTitle className="text-lg mb-2">Subscription</CardTitle>
                <Text className="text-base mb-4">
                  You're subscribed to {planName}
                </Text>
                <Button
                  variant={"outline"}
                  className="w-full"
                  onPress={() => {
                    Linking.openURL(
                      "itms-apps://apps.apple.com/account/subscriptions"
                    );
                  }}
                >
                  <Text>Manage Subscription</Text>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card className="bg-black mb-6">
              <CardContent className="gap-2 p-6">
                <CardTitle className="text-2xl text-white mb-2">
                  Subscription
                </CardTitle>
                <Text className="text-white text-base mb-4">
                  Unlock premium features and support Poka!
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
          )}

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
                  <Button
                    variant={"outline"}
                    className="w-full border-red-600"
                    onPress={handleDeleteAccount}
                    disabled={deleting}
                  >
                    <Text className="text-red-600">
                      {deleting ? "Deleting…" : "Delete account"}
                    </Text>
                  </Button>
                  <Text className="text-muted-foreground text-xs mt-1">
                    Deleting your account will remove your personal data
                    associated with this app. This cannot be undone.
                  </Text>
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

          <Card>
            <CardContent className="p-4 flex-row items-center justify-between">
              <View className="flex-1 pr-3">
                <CardTitle className="text-lg mb-2">Sound settings</CardTitle>
                <Text className="text-muted-foreground text-xs">
                  {soundEnabled ? "Enabled" : "Disabled"}
                </Text>
              </View>
              {/* Consider refactoring to RNR component later */}
              <Switch
                value={soundEnabled}
                onValueChange={toggleSound}
                trackColor={{ false: "#E5E7EB", true: "#111827" }}
                thumbColor={soundEnabled ? "#FFFFFF" : "#FFFFFF"}
                ios_backgroundColor="#E5E7EB"
                style={{ transform: [{ scale: 1.05 }] }}
              />
            </CardContent>
          </Card>

          {/* Contact us Section */}
          <Card>
            <CardContent className="gap-2 p-4">
              <CardTitle className="text-lg mb-2">Contact</CardTitle>
              <Text className="text-muted-foreground text-sm mb-2">
                Need help or have feedback? Whether it’s ideas, bugs, or
                questions, we’d love to hear from you!
              </Text>
              <Button
                variant="outline"
                className="w-full"
                onPress={() => {
                  Linking.openURL("mailto:pokareminder@gmail.com");
                }}
              >
                <Text>Contact us</Text>
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
                Hi! Poka started as a passion project to make daily routines
                like taking medications a bit more fun. I hope you enjoy it, and
                thank you for supporting it ❤️
              </Text>
            </CardContent>
          </Card>
        </View>
      </ScrollView>
      <Modal
        visible={deleting}
        animationType="fade"
        transparent
        presentationStyle="overFullScreen"
        onRequestClose={() => {}}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.5)",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <View
            style={{
              backgroundColor: "white",
              borderRadius: 12,
              paddingVertical: 20,
              paddingHorizontal: 24,
              minWidth: 260,
              alignItems: "center",
            }}
          >
            <ActivityIndicator size="large" />
            <Text className="mt-3 text-center">
              Deleting your account…{"\n"}
              Please keep the app open and stay on this screen.
            </Text>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default Settings;
