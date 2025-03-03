// ReminderScheduler.tsx
// This can be used to set up and schedule reminder again after app is mounted. Can be relevant if e.g. if user remove and install computer again
// removed for now as not needed atm

// import React, { useEffect, useState } from "react";
// import * as Notifications from "expo-notifications";
// import { useReminders } from "~/src/hooks/useReminders";
// import { scheduleMedicationReminder } from "~/src/utils/scheduleMedicationReminder";
// import { getFromStorage } from "~/src/services/storage";

// export default function ReminderScheduler() {
//   const [userUid, setUserUid] = useState<string | null>(null);
//   const [hasCheckedNotifications, setHasCheckedNotifications] = useState(false); // Prevents rescheduling

//   // Fetch user UID on component mount
//   useEffect(() => {
//     (async () => {
//       const user = await getFromStorage("userDetails");
//       setUserUid(user?.uid || null);
//     })();
//   }, []);

//   // Fetch reminders when UID is available
//   const reminders = useReminders(userUid || "");

//   useEffect(() => {
//     if (!reminders.length || hasCheckedNotifications) return;
//     console.log("reminders:" + reminders);

//     const scheduleReminders = async () => {
//       const existingNotifications =
//         await Notifications.getAllScheduledNotificationsAsync();
//       const existingIds = new Set(
//         existingNotifications.map((n) => n.identifier)
//       );

//       for (const reminder of reminders) {
//         // 🔹 Skip if the reminder already has a scheduled notification
//         if (
//           reminder.notificationId &&
//           existingIds.has(reminder.notificationId)
//         ) {
//           console.log(`Skipping already scheduled reminder: ${reminder.id}`);
//           continue;
//         }

//         console.log(`Scheduling reminder: ${reminder.id}`);
//         await scheduleMedicationReminder(reminder);
//       }

//       setHasCheckedNotifications(true); // Ensures this runs only once
//     };

//     scheduleReminders();
//   }, [reminders]);

//   return null;
// }
