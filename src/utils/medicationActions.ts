import { Timestamp } from "firebase/firestore";
import { Alert, Platform, ActionSheetIOS } from "react-native";
import moment from "moment";
import type { Medication } from "~/src/types/medication";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "~/config/firebase";

/** Convert Firestore Timestamp → JS Date */
export const tsToDate = (ts: Timestamp | { seconds: number }): Date =>
  "toDate" in ts ? ts.toDate() : new Date(ts.seconds * 1000);

export interface MedicationActionCallbacks {
  onSuccess: (takenTime: Date, onTime: boolean) => void;
  onError: (error: Error) => void;
  openDateTimePicker: (date: Date) => Promise<Date | null>;
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

    const diffMinutes = Math.abs(now.getTime() - scheduledTime.getTime()) / 60000;
    const isSameDay = scheduledTime.toDateString() === now.toDateString();
    const withinOneHr = diffMinutes <= 60;

    // If within time window, mark as taken immediately
    if (isSameDay && withinOneHr) {
      await markMedicationAsTaken(medication, now, true, callbacks);
      return;
    }

    // Otherwise, show action sheet
    const options = ["Cancel", "On Time", "Now", "Set Time"];
    const cancelButtonIndex = 0;

    const handleAction = async (index: number) => {
      if (index === 1) {
        // On Time
        await markMedicationAsTaken(medication, scheduledTime, true, callbacks);
      } else if (index === 2) {
        // Now
        await markMedicationAsTaken(medication, now, false, callbacks);
      } else if (index === 3) {
        // Set Time
        const picked = await callbacks.openDateTimePicker(scheduledTime);
        if (picked) {
          const onTime = Math.abs(picked.getTime() - scheduledTime.getTime()) / 60000 <= 60;
          await markMedicationAsTaken(medication, picked, onTime, callbacks);
        }
      }
    };

    if (Platform.OS === "ios") {
      ActionSheetIOS.showActionSheetWithOptions(
        { options, cancelButtonIndex },
        handleAction
      );
    } else {
      Alert.alert("Mark as Taken", "Choose when you took your medication:", [
        { text: "Cancel", style: "cancel" },
        { text: "On Time", onPress: () => handleAction(1) },
        { text: "Now", onPress: () => handleAction(2) },
        { text: "Set Time", onPress: () => handleAction(3) },
      ]);
    }
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
    callbacks.onSuccess(new Date(), false);
  } catch (error) {
    callbacks.onError(error as Error);
  }
};

const markMedicationAsTaken = async (
  medication: Medication,
  takenTime: Date,
  onTime: boolean,
  callbacks: MedicationActionCallbacks
) => {
  try {
    const reminderRef = doc(db, "reminders", medication.reminderDocID);
    await updateDoc(reminderRef, {
      status: "taken",
      takenTime: Timestamp.fromDate(takenTime),
      onTime,
    });
    callbacks.onSuccess(takenTime, onTime);
  } catch (error) {
    callbacks.onError(error as Error);
  }
}; 