import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "~/config/firebase";
import { scheduleMedicationReminder } from "~/src/utils/scheduleMedicationReminder";

// Only used when the user goes from notifications denied to allowed
export async function reschedulePendingReminders(uid: string) {
  console.log("Rescheduling pending reminders...");

  const now = new Date();
  const twoWeeksFromNow = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);

  // ✅ Fetch reminders for the user
  const remindersQuery = query(
    collection(db, "reminders"),
    where("uid", "==", uid)
  );
  const snapshot = await getDocs(remindersQuery);

  for (const docSnap of snapshot.docs) {
    const reminder = docSnap.data();

    // Combine date and time into a full Date object
    const baseDate = reminder.date.toDate();
    const [hours, minutes] = (reminder.time || "00:00").split(":").map(Number);
    const fullReminderDate = new Date(baseDate);
    fullReminderDate.setHours(hours, minutes, 0, 0);

    if (fullReminderDate > now && fullReminderDate < twoWeeksFromNow) {
      await scheduleMedicationReminder({
        id: docSnap.id, // ✅ Use the existing Firestore doc ID
        uid,
        date: reminder.date,
        time: reminder.time,
        whenToTake: reminder.whenToTake,
        medId: reminder.medId,
        notificationId: reminder.notificationId || null,
      });
    }
  }
}
