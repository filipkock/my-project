import React from "react";
import { View, Alert, SafeAreaView } from "react-native";
import * as Notifications from "expo-notifications";
import { Button } from "~/components/ui/button";
import { Text } from "~/components/ui/text";
import { useRouter } from "expo-router";
import { ChevronLeft } from "~/lib/icons/ChevronLeft";
import NotificationImage from "~/assets/images/poka_notification.svg";

export default function AllowNotification() {
  const router = useRouter();

  const requestPermission = async () => {
    const { status } = await Notifications.requestPermissionsAsync();
    if (status === "granted") {
      router.replace("/(auth)/createMedication");
    } else {
      Alert.alert(
        "Permission required",
        "You can enable notifications later in settings."
      );
      router.replace("/(auth)/createMedication");
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-secondary/40">
      <View className="flex-1 p-12">
        <View className="flex-row justify-between items-center mb-8">
          <ChevronLeft
            size={32}
            color="black"
            onPress={() => router.push("../signup")}
          />
          <Text
            className="text-sm text-muted-foreground "
            onPress={requestPermission}
          >
            Skip
          </Text>
        </View>
        <View className="flex-1 justify-between items-center py-10 mt-4">
          <Text className="text-3xl font-bold text-center">
            Allow Poka to poke you?
          </Text>
          <NotificationImage width={230} height={230} />
          <Text className="text-center">
            We'll remind you when it's time to take your medication.
          </Text>
        </View>
        <Button className="w-full" onPress={requestPermission}>
          <Text>Enable Notifications</Text>
        </Button>
      </View>
    </SafeAreaView>
  );
}
