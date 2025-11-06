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
import {
  generateReminderDates,
  clampEndToWindow,
  alignStartToPhase,
} from "~/src/services/reminderSchedule";
import { getFromStorage, setLocalStorage } from "~/src/services/storage";

function normalizeSpecificDays(input: unknown): number[] | undefined {
  // Already stored as numbers in DB: return as-is when non-empty; otherwise undefined disables weekly filtering
  return Array.isArray(input) && input.length > 0
    ? (input as number[])
    : undefined;
}

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

  for (const medDoc of medicationSnap.docs) {
    const med = medDoc.data();
    const medId = medDoc.id;

    // Determine the rolling window end (today + 14d) and clamp to the med's endDate if sooner
    const medEndDate: Date | null = med.endDate?.toDate
      ? med.endDate.toDate()
      : null;

    const effectiveEnd = clampEndToWindow(
      medEndDate ?? undefined,
      todayStart,
      14
    );

    // Determine scheduling start: use the later of medication start-of-day and sevenDaysAgo
    let medStartDate: Date | null = null;
    if (med.startDate?.toDate) {
      const d = med.startDate.toDate();
      medStartDate = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    }
    const scheduleStart = medStartDate
      ? medStartDate > sevenDaysAgo
        ? medStartDate
        : sevenDaysAgo
      : sevenDaysAgo;

    // If the medication starts after our scheduling window end, skip scheduling
    if (medStartDate && medStartDate > effectiveEnd) {
      console.log(
        `Skipping ${medId}, startDate ${medStartDate.toISOString()} is after window ending ${effectiveEnd.toISOString()}`
      );
      continue;
    }

    // if we’ve already scheduled up to (or beyond) what we intend, skip.
    if (med.chunkEndDate?.toDate() >= effectiveEnd) {
      console.log(
        `Skipping ${medId}, already scheduled as needed past ${effectiveEnd}`
      );
      continue;
    }

    const existingRemindersSnap = await getDocs(
      query(
        collection(db, "reminders"),
        where("medId", "==", medId),
        where("uid", "==", userinfo.uid),
        where("date", ">=", Timestamp.fromDate(scheduleStart)),
        where("date", "<=", Timestamp.fromDate(effectiveEnd))
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

    // Compute the correct first date inside the window based on the original start date
    // so the medication keeps its intended "every X days" rhythm.
    const alignedStart = alignStartToPhase(
      med.startDate?.toDate(),
      scheduleStart,
      med.intakeInterval,
      med.customInterval
    );

    // Normalize weekday selection (if any) to numeric format expected by generator.
    const normalizedSpecificDays = normalizeSpecificDays(
      med.specificDaysOfWeek
    );

    // Generate reminder dates only within the window, starting from the phase-aligned date.
    const newReminderDates = generateReminderDates(
      alignedStart,
      effectiveEnd,
      med.intakeInterval,
      {
        customIntervalValue: Number(med.customInterval),
        specificDaysOfWeek: normalizedSpecificDays,
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
          medId,
          notificationId: null,
        });
      }
    }

    // Update chunkEndDate
    await updateDoc(doc(db, "medication", medId), {
      chunkEndDate: Timestamp.fromDate(effectiveEnd),
    });
  }
  await setLocalStorage("lastReminderRefreshDate", new Date().toISOString());
}
