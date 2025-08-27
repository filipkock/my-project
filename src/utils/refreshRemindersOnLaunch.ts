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

  // anchor to local midnight today
  const todayStart = new Date(
    new Date().getFullYear(),
    new Date().getMonth(),
    new Date().getDate()
  );

  // start-of-day exactly 7 days ago
  const sevenDaysAgo = new Date(
    todayStart.getFullYear(),
    todayStart.getMonth(),
    todayStart.getDate() - 7
  );

  // end-of-day 14 days ahead (we use "<" for the query upper bound)
  const chunkEndDate = new Date(
    todayStart.getFullYear(),
    todayStart.getMonth(),
    todayStart.getDate() + 14,
    23,
    59,
    59,
    999
  );

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

    const existingDateTimeKeys = new Set(
      existingRemindersSnap.docs.map((d) => {
        const data = d.data();
        const ts = data?.date;
        const t = data?.time;
        let normalizedSec = "";
        if (ts?.seconds) {
          const dDate = new Date(ts.seconds * 1000);
          dDate.setHours(0, 0, 0, 0);
          normalizedSec = Math.floor(dDate.getTime() / 1000).toString();
        }
        return `${normalizedSec}_${t}`;
      })
    );

    const newReminderDates = generateReminderDates(
      sevenDaysAgo,
      chunkEndDate,
      med.intakeInterval,
      {
        customIntervalValue: med.customInterval || 1,
        specificDaysOfWeek: med.specificDaysOfWeek,
      }
    );

    console.log("Generated dates:", newReminderDates.length);

    // Build times array: prefer reminderTimes[], fallback to single time string
    const times: string[] =
      Array.isArray(med.reminderTimes) && med.reminderTimes.length
        ? med.reminderTimes
        : typeof med.time === "string" && med.time
        ? [med.time]
        : [];

    if (!times.length) {
      console.warn("Skipping med with no reminder times:", medId);
    }

    for (const date of newReminderDates) {
      const asDate = date instanceof Date ? date : date.toDate();
      const normalizedDate = new Date(
        asDate.getFullYear(),
        asDate.getMonth(),
        asDate.getDate()
      );
      const seconds = Math.floor(normalizedDate.getTime() / 1000);

      for (const timeStr of times) {
        if (typeof timeStr !== "string" || !timeStr.includes(":")) {
          console.warn("Skipping invalid time format for", medId, timeStr);
          continue;
        }

        const key = `${seconds}_${timeStr}`;
        if (existingDateTimeKeys.has(key)) continue;

        const docRef = await addDoc(collection(db, "reminders"), {
          date: Timestamp.fromDate(normalizedDate),
          time: timeStr,
          whenToTake: med.whenToTake,
          status: "pending",
          medId,
          uid: userinfo.uid,
          ...(userinfo.email ? { userEmail: userinfo.email } : {}),
          notificationId: null,
        });
        existingDateTimeKeys.add(key);
        console.log(
          "Created reminder with ID:",
          docRef.id,
          "for time",
          timeStr
        );

        await scheduleMedicationReminder({
          id: docRef.id,
          uid: userinfo.uid,
          date: asDate,
          time: timeStr,
          whenToTake: med.whenToTake,
          medId,
          notificationId: null,
        });
      }
    }

    // Update chunkEndDate
    await updateDoc(doc(db, "medication", medId), {
      chunkEndDate: Timestamp.fromDate(chunkEndDate),
    });
  }
  await setLocalStorage("lastReminderRefreshDate", new Date().toISOString());
}
