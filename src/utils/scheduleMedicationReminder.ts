import * as Notifications from "expo-notifications";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "~/config/firebase"; // your Firestore instance
import { getDateTimeFromReminder } from "~/src/utils/getDateTimeFromReminder";

interface Reminder {
  id: string;
  uid: string;
  date: any; // Firestore Timestamp
  time: string | undefined; // e.g. "20:14"
  whenToTake: string | undefined;
  notificationId?: string | null; // optional
  medId: string;
}

export async function scheduleMedicationReminder(reminder: Reminder) {
  const scheduledDate = await getDateTimeFromReminder(reminder);

  // If there's already a notificationId stored, cancel it (avoid duplicates)
  if (reminder.notificationId) {
    try {
      await Notifications.cancelScheduledNotificationAsync(
        reminder.notificationId
      );
    } catch (error) {
      console.warn("Could not cancel old notification", error);
    }
  }

  try {
    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: "Medication Reminder",
        body: `It's time to take your ${reminder.whenToTake} medication!`,
        data: { reminderId: reminder.id },
      },
      trigger: {
        date: scheduledDate,
        type: Notifications.SchedulableTriggerInputTypes.DATE,
      } as Notifications.DateTriggerInput,
    });

    // 4. Save the newNotificationId in Firestore
    await updateDoc(doc(db, "reminders", reminder.id), {
      notificationId: notificationId,
    });

    console.log("Scheduled Notification ID:", notificationId);
  } catch (err) {
    console.error("Error scheduling notification:", err);
  }
}
