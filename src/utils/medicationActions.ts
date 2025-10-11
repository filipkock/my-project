import {
  collection,
  getDocs,
  query,
  Timestamp,
  where,
  getDoc,
} from "firebase/firestore";
import moment from "moment";
import type { Medication } from "~/src/types/medication";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "~/config/firebase";
import { updateStreak, maybeDecrementStreakOnUntake } from "~/src/utils/streak";
import { getFromStorage } from "~/src/services/storage";
import { cancelMedicationReminder } from "~/src/utils/scheduleMedicationReminder";
import { scheduleMedicationReminder } from "~/src/utils/scheduleMedicationReminder";

/** Convert Firestore Timestamp → JS Date */
export const tsToDate = (ts: Timestamp | { seconds: number }): Date =>
  "toDate" in ts ? ts.toDate() : new Date(ts.seconds * 1000);

export interface MedicationActionCallbacks {
  onSuccess: (takenTime: Date, onTime: boolean) => void;
  onError: (error: Error) => void;
  openDateTimePicker: (date: Date) => Promise<Date | null>;
  showTakeMedicationSheet?: () => void;
}

export const getScheduledDate = (medication: Medication): Date => {
  const date = tsToDate(medication.date);
  const [hours, minutes] = medication.reminderTime.split(":").map(Number);
  date.setHours(hours, minutes, 0, 0);
  return date;
};

export const shouldShowActionSheet = (medication: Medication): boolean => {
  const now = new Date();
  const scheduledTime = getScheduledDate(medication);
  const diffMinutes = Math.abs(now.getTime() - scheduledTime.getTime()) / 60000;
  const isSameDay = scheduledTime.toDateString() === now.toDateString();
  const withinOneHr = diffMinutes <= 60;
  return !(isSameDay && withinOneHr);
};

export const handleTakeMedication = async (
  medication: Medication,
  callbacks: MedicationActionCallbacks,
  selectedDate?: string
) => {
  try {
    const now = new Date();
    const scheduledTime = getScheduledDate(medication);

    if (!scheduledTime) {
      throw new Error("Invalid medication time format");
    }

    const diffMinutes =
      Math.abs(now.getTime() - scheduledTime.getTime()) / 60000;
    const isSameDay = scheduledTime.toDateString() === now.toDateString();
    const withinOneHr = diffMinutes <= 60;

    // If within time window, mark as taken immediately
    if (isSameDay && withinOneHr) {
      await markMedicationAsTaken(
        medication,
        now,
        true,
        callbacks,
        selectedDate ?? moment().format("YYYY-MM-DD")
      );
      return;
    }

    // Show the bottom sheet for other cases
    callbacks.showTakeMedicationSheet?.();
  } catch (error) {
    callbacks.onError(error as Error);
  }
};

export const handleUntakeMedication = async (
  medication: Medication,
  callbacks: MedicationActionCallbacks,
  selectedDate: string
) => {
  try {
    const userinfo = await getFromStorage("userDetails");
    if (userinfo && selectedDate) {
      const todayStr = moment().format("YYYY-MM-DD");
      if (selectedDate === todayStr) {
        await maybeDecrementStreakOnUntake(userinfo.uid, selectedDate);
      }
    }

    const reminderRef = doc(db, "reminders", medication.reminderDocID);
    await updateDoc(reminderRef, {
      status: "pending",
      takenTime: null,
      onTime: null,
    });

    // Re-schedule the reminder after undo
    try {
      const snap = await getDoc(reminderRef);
      if (snap.exists()) {
        const data = snap.data() as any;
        await scheduleMedicationReminder({
          id: medication.reminderDocID,
          uid: data?.uid ?? userinfo?.uid ?? "",
          date: data?.date,
          time: data?.time,
          medId: data?.medId ?? medication.medDocID,
          notificationId: data?.notificationId ?? null,
        });
      }
    } catch (e) {
      console.warn("Failed to re-schedule reminder after undo:", e);
    }

    callbacks.onSuccess(new Date(), false);
  } catch (error) {
    callbacks.onError(error as Error);
  }
};

export const markMedicationAsTaken = async (
  medication: Medication,
  takenTime: Date,
  onTime: boolean,
  callbacks: MedicationActionCallbacks,
  selectedDate: string
) => {
  try {
    const isToday = selectedDate === moment().format("YYYY-MM-DD");

    const reminderRef = doc(db, "reminders", medication.reminderDocID);
    await updateDoc(reminderRef, {
      status: "taken",
      takenTime: Timestamp.fromDate(takenTime),
      onTime,
    });

    // Always update streak - increment if on time, reset to 0 if not on time
    const userinfo = await getFromStorage("userDetails");
    if (userinfo) {
      await updateStreak(userinfo.uid, isToday);
    }

    // ✅ Fetch reminder to get notificationId
    const reminderSnap = await getDoc(reminderRef);
    if (reminderSnap.exists()) {
      const reminderData = reminderSnap.data();
      const scheduledTime = getScheduledDate(medication);

      if (
        reminderData.notificationId && // Notification exists
        takenTime < scheduledTime // Taken before scheduled reminder time
      ) {
        await cancelMedicationReminder(
          medication.reminderDocID,
          reminderData.notificationId
        );
      }
    }

    callbacks.onSuccess(takenTime, onTime);
  } catch (error) {
    callbacks.onError(error as Error);
  }
};
