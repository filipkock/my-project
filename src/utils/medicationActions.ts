import { Timestamp } from "firebase/firestore";
import moment from "moment";
import type { Medication } from "~/src/types/medication";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "~/config/firebase";
import { updateStreak, decrementStreak } from "~/src/utils/streak";
import { getFromStorage } from "~/src/services/storage";
import { useSelectedDate } from "~/src/context/SelectedDateContext";

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
  callbacks: MedicationActionCallbacks
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
      await markMedicationAsTaken(medication, now, true, callbacks);
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
  callbacks: MedicationActionCallbacks
) => {
  try {
    const reminderRef = doc(db, "reminders", medication.reminderDocID);
    await updateDoc(reminderRef, {
      status: "pending",
      takenTime: null,
      onTime: null,
    });

    // If the medication was taken on time, decrement the streak by 1
    if (medication.onTime === true) {
      const userinfo = await getFromStorage("userDetails");
      if (userinfo) {
        await decrementStreak(userinfo.uid);
      }
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
  callbacks: MedicationActionCallbacks
) => {
  try {
    const { selectedDate } = useSelectedDate();
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
      await updateStreak(userinfo.uid, onTime, isToday);
    }

    callbacks.onSuccess(takenTime, onTime);
  } catch (error) {
    callbacks.onError(error as Error);
  }
};
