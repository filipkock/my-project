import {
  collection,
  getDocs,
  query,
  where,
  addDoc,
  Timestamp,
  updateDoc,
  doc,
} from "firebase/firestore";
import { db } from "~/config/firebase";
import { scheduleMedicationReminder } from "~/src/utils/scheduleMedicationReminder";
import { generateReminderDates } from "~/src/services/reminderSchedule";
import { getFromStorage, setLocalStorage } from "~/src/services/storage";

export async function refreshRemindersOnLaunch() {
  const userinfo = await getFromStorage("userDetails");
  const lastRefreshStr = await getFromStorage("lastReminderRefreshDate");
  const lastRefreshDate = lastRefreshStr ? new Date(lastRefreshStr) : null;
  const today = new Date().toDateString();

  if (lastRefreshDate?.toDateString() === today) {
    console.log("Reminders already refreshed today");
    return;
  }

  if (!userinfo?.uid) return;

  const medicationSnap = await getDocs(
    query(collection(db, "medication"), where("uid", "==", userinfo.uid))
  );

  const now = new Date(Date.now() * 24 * 60 * 60 * 1000);

  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const chunkEndDate = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);

  for (const medDoc of medicationSnap.docs) {
    const med = medDoc.data();
    const medId = medDoc.id;

    if (med.chunkEndDate?.toDate() >= chunkEndDate) {
      console.log(`Skipping ${medId}, already scheduled past ${chunkEndDate}`);
      continue;
    }

    const existingRemindersSnap = await getDocs(
      query(
        collection(db, "reminders"),
        where("medId", "==", medId),
        where("date", ">=", Timestamp.fromDate(sevenDaysAgo)),
        where("date", "<", Timestamp.fromDate(chunkEndDate))
      )
    );

    const existingDates = new Set(
      existingRemindersSnap.docs.map((doc) => doc.data().date?.seconds)
    );

    const newReminderDates = generateReminderDates(
      med.startDate.toDate(),
      chunkEndDate,
      med.intakeInterval,
      {
        customIntervalValue: med.customInterval || 1,
        specificDaysOfWeek: med.specificDaysOfWeek,
      }
    );

    for (const date of newReminderDates) {
      const seconds = Math.floor(
        (date instanceof Date ? date : date.toDate()).getTime() / 1000
      );
      if (existingDates.has(seconds)) continue;

      const docRef = await addDoc(collection(db, "reminders"), {
        date: Timestamp.fromDate(date instanceof Date ? date : date.toDate()),
        time: med.time,
        whenToTake: med.whenToTake,
        status: "pending",
        medId,
        uid: userinfo.uid,
        ...(userinfo.email ? { userEmail: userinfo.email } : {}),
        notificationId: null,
      });

      await scheduleMedicationReminder({
        id: docRef.id,
        uid: userinfo.uid,
        date: date,
        time: med.time,
        whenToTake: med.whenToTake,
        medId,
        notificationId: null,
      });
    }

    // Update chunkEndDate
    await updateDoc(doc(db, "medication", medId), {
      chunkEndDate: Timestamp.fromDate(chunkEndDate),
    });
  }
  await setLocalStorage("lastReminderRefreshDate", new Date().toISOString());
}
