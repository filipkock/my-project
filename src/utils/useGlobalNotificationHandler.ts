import { AppState } from "react-native";
import * as Notifications from "expo-notifications";
import { useEffect } from "react";
import { useNotification } from "~/src/context/notificationsContext";
import { reschedulePendingReminders } from "~/src/utils/reschedulePendingReminders";
import { getFromStorage } from "~/src/services/storage";
import AsyncStorage from "@react-native-async-storage/async-storage";

export function useGlobalNotificationHandler() {
  const { registerPushToken } = useNotification();

  useEffect(() => {
    const subscription = AppState.addEventListener(
      "change",
      async (nextState) => {
        if (nextState === "active") {
          const { status } = await Notifications.getPermissionsAsync();

          if (status === "granted") {
            const alreadyHandled = await AsyncStorage.getItem(
              "notificationsHandled"
            );
            if (!alreadyHandled) {
              await AsyncStorage.setItem("notificationsHandled", "true");

              await registerPushToken();
              const storedUser = await getFromStorage("userDetails");
              if (storedUser?.uid) {
                await reschedulePendingReminders(storedUser.uid);
              }
            }
          }
        }
      }
    );

    return () => subscription.remove();
  }, []);
}
