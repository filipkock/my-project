import React from "react";
import { View, Modal, ScrollView, Alert } from "react-native";
import * as Notifications from "expo-notifications";
import { Card, CardContent, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Text } from "~/components/ui/text";

// Build a Date from iOS UNCalendarNotificationTrigger dateComponents
function dateFromDateComponents(dc: any): Date | null {
  if (!dc) return null;
  const now = new Date();
  const year = dc.year ?? now.getFullYear();
  const month = (dc.month ?? now.getMonth() + 1) - 1; // JS 0-based
  const day = dc.day ?? now.getDate();
  const hour = dc.hour ?? 0;
  const minute = dc.minute ?? 0;
  const second = dc.second ?? 0;
  const d = new Date(year, month, day, hour, minute, second);
  return isNaN(d.getTime()) ? null : d;
}

// Format a Date as local YYYY-MM-DD HH:mm
const fmtLocal = (d: Date) => {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`;
};

export default function NotificationsDevPanel() {
  const [show, setShow] = React.useState(false);
  const [items, setItems] = React.useState<any[]>([]);

  const clearAll = async () => {
    await Notifications.cancelAllScheduledNotificationsAsync();
    console.log("All scheduled notifications cleared!");
    setItems([]);
  };

  const refresh = async () => {
    try {
      const list = await Notifications.getAllScheduledNotificationsAsync();
      console.log("FULL NOTIF LIST:", JSON.stringify(list, null, 2));
      // sort by actual fire time
      const toMillis = (n: any) => {
        const t = n?.trigger;
        if (t?.dateComponents || t?.date || t?.value) {
          const dc = t?.dateComponents;
          const d = dc
            ? dateFromDateComponents(dc)
            : t?.date
            ? new Date(t.date)
            : t?.value
            ? new Date(t.value)
            : null;
          return d ? d.getTime() : Number.MAX_SAFE_INTEGER;
        }
        if (typeof t?.seconds === "number")
          return Date.now() + t.seconds * 1000;
        return Number.MAX_SAFE_INTEGER;
      };
      const sorted = [...list].sort((a, b) => toMillis(a) - toMillis(b));
      setItems(sorted as any);
      setShow(true);
    } catch (e) {
      Alert.alert("Error", "Could not fetch scheduled notifications.");
      console.log("getAllScheduledNotificationsAsync error", e);
    }
  };

  return (
    <Card>
      <CardContent className="gap-2 p-4">
        <CardTitle className="text-lg mb-2">Notifications (dev)</CardTitle>
        <Button variant="outline" className="w-full" onPress={refresh}>
          <Text>View scheduled notifications</Text>
        </Button>
        <Button variant="outline" className="w-full" onPress={clearAll}>
          <Text>Clear all scheduled notifications</Text>
        </Button>

        <Modal
          visible={show}
          animationType="slide"
          transparent
          onRequestClose={() => setShow(false)}
        >
          <View
            style={{
              flex: 1,
              backgroundColor: "rgba(0,0,0,0.5)",
              justifyContent: "center",
              padding: 16,
            }}
          >
            <View
              style={{
                backgroundColor: "white",
                borderRadius: 12,
                maxHeight: "80%",
                padding: 16,
              }}
            >
              <Text className="text-lg font-bold mb-2">
                Scheduled notifications
              </Text>
              <ScrollView style={{ maxHeight: 400 }}>
                {items.length === 0 ? (
                  <Text className="text-sm">None scheduled.</Text>
                ) : (
                  items.map((n: any, idx: number) => {
                    // compute fireAt for display
                    let fireAt: Date | null = null;
                    const t = n?.trigger;
                    if (
                      t?.class === "UNCalendarNotificationTrigger" ||
                      t?.type === "calendar"
                    ) {
                      if (t?.dateComponents)
                        fireAt = dateFromDateComponents(t.dateComponents);
                      else if (t?.date) fireAt = new Date(t.date);
                      else if (t?.value) fireAt = new Date(t.value);
                    }
                    if (!fireAt && typeof t?.seconds === "number") {
                      fireAt = new Date(Date.now() + t.seconds * 1000);
                    }

                    return (
                      <View
                        key={n?.identifier ?? idx}
                        style={{ marginBottom: 12 }}
                      >
                        <Text className="text-xs font-bold">
                          {n?.content?.title ?? "Notification"}
                        </Text>
                        <Text className="text-xs">
                          Fires at (local):{" "}
                          {fireAt ? fmtLocal(fireAt) : "Unknown"}
                        </Text>
                        {/* intentionally hide body to reduce noise */}
                      </View>
                    );
                  })
                )}
              </ScrollView>

              <Button
                variant={"outline" as any}
                className="w-full mt-2"
                onPress={() => setShow(false)}
              >
                <Text>Close</Text>
              </Button>
            </View>
          </View>
        </Modal>
      </CardContent>
    </Card>
  );
}
