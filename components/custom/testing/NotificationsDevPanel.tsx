import React from "react";
import { View, Modal, ScrollView, Alert } from "react-native";
import * as Notifications from "expo-notifications";
import { Card, CardContent, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Text } from "~/components/ui/text";

// Treat numeric epoch as seconds if it looks like seconds (10 digits), otherwise ms
function toDateFromUnknownEpoch(v: any): Date | null {
  if (v == null) return null;
  if (typeof v === "number") {
    const ms = v < 1e12 ? v * 1000 : v; // seconds -> ms heuristic
    const d = new Date(ms);
    return isNaN(d.getTime()) ? null : d;
  }
  if (typeof v === "string") {
    const num = Number(v);
    if (!isNaN(num)) return toDateFromUnknownEpoch(num);
    const d = new Date(v);
    return isNaN(d.getTime()) ? null : d;
  }
  if (v instanceof Date) return v;
  return null;
}

// Best-effort: build the *next* fire date from partial dateComponents (iOS calendar triggers)
function nextFromDateComponents(dc: any, now = new Date()): Date | null {
  if (!dc) return null;
  // Start from today by default
  const base = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    0,
    0,
    0,
    0
  );
  const y = dc.year ?? base.getFullYear();
  const m = (dc.month ?? base.getMonth() + 1) - 1; // JS 0-based
  const d = dc.day ?? base.getDate();
  const h = dc.hour ?? 0;
  const mi = dc.minute ?? 0;
  const s = dc.second ?? 0;

  // If weekday is present, prefer that over explicit day for *repeating* calendar triggers
  // Apple weekday: 1=Sun..7=Sat. Convert to JS: 0=Sun..6=Sat
  const hasWeekday = typeof dc.weekday === "number";
  if (hasWeekday) {
    const targetDow = ((dc.weekday % 7) + 7) % 7; // 0..6 where 0=Sun
    const candidate = new Date(
      base.getFullYear(),
      base.getMonth(),
      base.getDate(),
      h,
      mi,
      s,
      0
    );
    // bump forward until weekday matches and time is in the future
    let i = 0;
    while ((candidate.getDay() !== targetDow || candidate <= now) && i < 8) {
      candidate.setDate(candidate.getDate() + 1);
      i++;
    }
    return candidate;
  }

  // Build direct candidate
  let cand = new Date(y, m, d, h, mi, s, 0);
  if (isNaN(cand.getTime())) return null;

  // If only time-of-day (no explicit year/month/day), roll to next day when past
  const onlyTime = dc.year == null && dc.month == null && dc.day == null;
  if (onlyTime && cand <= now) {
    cand.setDate(cand.getDate() + 1);
  }

  return cand;
}

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

// Try to extract an absolute fire date from various iOS/Expo trigger fields
function extractAbsoluteFromTrigger(trigger: any): Date | null {
  if (!trigger) return null;

  // 1) Explicit absolute timestamp fields (most reliable)
  const absoluteKeys = [
    "date", // Expo iOS
    "value", // sometimes
    "timestamp", // some native bridges
    "nextTriggerDate", // iOS
    "fireDate", // legacy
    "time", // catch-all
    "timeIntervalEnd", // rare
  ];
  for (const k of absoluteKeys) {
    if (trigger[k] != null) {
      const d = toDateFromUnknownEpoch(trigger[k]);
      if (d) return d;
    }
  }

  // 2) Calendar dateComponents (year/month/day/hour/minute/...)
  if (trigger.dateComponents) {
    // Use exact build if fully specified, else compute next occurrence
    const exact = dateFromDateComponents(trigger.dateComponents);
    if (exact) return exact;
    const next = nextFromDateComponents(trigger.dateComponents);
    if (next) return next;
  }

  return null;
}

// Format a Date as local YYYY-MM-DD HH:mm
const fmtLocal = (d: Date) => {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`;
};

const fmtIn = (target: Date, now = new Date()) => {
  const ms = target.getTime() - now.getTime();
  const sign = ms < 0 ? -1 : 1;
  const abs = Math.abs(ms);
  const m = Math.floor(abs / 60000);
  const h = Math.floor(m / 60);
  const mm = m % 60;
  const s = Math.floor((abs % 60000) / 1000);
  if (h > 0) return `${sign < 0 ? "-" : ""}${h}h ${mm}m`;
  if (m > 0) return `${sign < 0 ? "-" : ""}${m}m`;
  return `${sign < 0 ? "-" : ""}${s}s`;
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

      // Capture a stable base time so interval triggers don't drift on re-render
      const capturedAt = Date.now();

      const withComputed = list.map((n: any) => {
        const t = n?.trigger;
        let fireAt: Date | null = null;
        let approx = false;

        // 1) Prefer the absolute time we stored when scheduling
        const dataFire =
          n?.content?.data?.fireAtMs ?? n?.content?.data?.fireAtIso;
        if (dataFire != null) {
          const d = toDateFromUnknownEpoch(dataFire);
          if (d) fireAt = d;
        }

        // 2) Fallback: ask OS trigger for an absolute timestamp (date/value/nextTriggerDate etc.)
        if (!fireAt) {
          fireAt = extractAbsoluteFromTrigger(t);
        }

        // 3) Never synthesize from trigger.seconds (interval). If only seconds exist, we can't know the wall clock time.
        if (!fireAt && typeof t?.seconds === "number") {
          approx = true;
        }

        return { ...n, _fireAt: fireAt, _approx: approx };
      });

      // Sort using the computed fireAt
      const sorted = withComputed.sort((a: any, b: any) => {
        const ta =
          a?._fireAt instanceof Date
            ? a._fireAt.getTime()
            : Number.MAX_SAFE_INTEGER;
        const tb =
          b?._fireAt instanceof Date
            ? b._fireAt.getTime()
            : Number.MAX_SAFE_INTEGER;
        return ta - tb;
      });

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
                    const fireAt: Date | null = n?._fireAt ?? null;
                    const approx: boolean = Boolean(n?._approx);

                    return (
                      <View
                        key={n?.identifier ?? idx}
                        style={{ marginBottom: 12 }}
                      >
                        <Text className="text-xs font-bold">
                          {n?.content?.title ?? "Notification"}
                        </Text>
                        {fireAt ? (
                          <>
                            <Text className="text-xs">
                              Fires at (local): {fmtLocal(fireAt)}
                            </Text>
                            <Text className="text-[10px] opacity-70">
                              in {fmtIn(fireAt)}
                            </Text>
                          </>
                        ) : (
                          <Text className="text-xs">
                            Exact time unknown (interval trigger: seconds=
                            {String(n?.trigger?.seconds ?? "?")})
                          </Text>
                        )}
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
