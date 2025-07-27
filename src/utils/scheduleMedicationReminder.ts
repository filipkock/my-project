import * as Notifications from "expo-notifications";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "~/config/firebase"; // your Firestore instance
import { getDateTimeFromReminder } from "~/src/utils/getDateTimeFromReminder";
import getNotificationBody from "~/src/constants/notificationMessages";

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
  // ✅ Check if permission is granted
  const { status } = await Notifications.getPermissionsAsync();
  if (status !== "granted") {
    console.warn("Skipping scheduling: Notifications permission not granted.");
    return;
  }

  const scheduledDate = await getDateTimeFromReminder(reminder);

  const now = new Date();
  if (scheduledDate <= now) {
    console.warn(
      "Skipping scheduling: scheduledDate is in the past.",
      scheduledDate
    );
    return;
  }

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
        body: getNotificationBody(reminder),
        data: { reminderId: reminder.id },
        sound: "default",
      },
      trigger: {
        date: scheduledDate,
        type: Notifications.SchedulableTriggerInputTypes.DATE,
      } as Notifications.DateTriggerInput,
    });

    // Save the new notificationId in Firestore
    await updateDoc(doc(db, "reminders", reminder.id), {
      notificationId: notificationId,
    });

    console.log("Scheduled Notification ID:", notificationId);
  } catch (err) {
    console.error("Error scheduling notification:", err);
  }
}

export async function cancelMedicationReminder(
  reminderId: string,
  notificationId: string
) {
  try {
    // Cancel the scheduled local notification
    await Notifications.cancelScheduledNotificationAsync(notificationId);

    // Update Firestore to remove the notificationId reference
    await updateDoc(doc(db, "reminders", reminderId), {
      notificationId: null,
    });

    console.log(
      `Canceled notification ${notificationId} for reminder ${reminderId}`
    );
  } catch (error) {
    console.error("Error canceling notification:", error);
  }
}
