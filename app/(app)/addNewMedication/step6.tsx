// app/(app)/addNewMedication/step6.tsx
import { View } from "react-native";
import { Text } from "~/components/ui/text";
import { Button } from "~/components/ui/button";
import { useLocalSearchParams, router } from "expo-router";
import { doc, setDoc } from "firebase/firestore";
import {
  addDoc,
  collection,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { Alert } from "react-native";
import { scheduleMedicationReminder } from "~/src/utils/scheduleMedicationReminder";
import { generateReminderDates } from "~/src/services/reminderSchedule";
import { getFromStorage } from "~/src/services/storage";
import { db } from "~/config/firebase";
import { getAuth } from "firebase/auth";
import type { FormData } from "~/src/types/medication";

export default function ConfirmStep() {
  const {
    medicationName,
    medicationType,
    whenToTake,
    interval,
    startDate,
    endDate,
  } = useLocalSearchParams();
  const auth = getAuth();
  const uid = auth.currentUser?.uid;

  const formData: FormData = {
    medicationName: medicationName as string,
    medicationType: medicationType as string,
    whenToTake: whenToTake as string,
    intakeInterval: interval as string,
    startDate: startDate ? new Date(startDate as string) : undefined,
    endDate: endDate ? new Date(endDate as string) : undefined,
    reminderTime: "08:00",
    customIntervalValue: "1",
    specificDaysOfWeek: [],
    reminderDates: [],
  };

  const handleSave = async () => {
    if (!uid) return;

    try {
      const userinfo = await getFromStorage("userDetails");
      if (!userinfo?.uid || !userinfo?.email) {
        Alert.alert("User not found", "Please sign in again.");
        return;
      }

      const start = formData.startDate!;
      const end = formData.endDate!;
      const customInterval = parseInt(formData.customIntervalValue || "1", 10);

      const reminderDates = generateReminderDates(
        start,
        end,
        formData.intakeInterval,
        {
          customIntervalValue: customInterval,
          specificDaysOfWeek: formData.specificDaysOfWeek,
        }
      );

      const medRef = await addDoc(collection(db, "medication"), {
        medicationName: formData.medicationName,
        medicationType: formData.medicationType,
        whenToTake: formData.whenToTake,
        intakeInterval: formData.intakeInterval,
        customInterval,
        specificDaysOfWeek: formData.specificDaysOfWeek,
        startDate: Timestamp.fromDate(start),
        endDate: Timestamp.fromDate(end),
        userEmail: userinfo.email,
        createdAt: serverTimestamp(),
        uid: userinfo.uid,
        time: formData.reminderTime,
      });

      const reminderWrites = reminderDates.map(async (date) => {
        const docRef = await addDoc(collection(db, "reminders"), {
          date,
          time: formData.reminderTime,
          whenToTake: formData.whenToTake,
          status: "pending",
          medId: medRef.id,
          uid: userinfo.uid,
          userEmail: userinfo.email,
          notificationId: null,
        });

        if (date.toDate().getTime() > Date.now()) {
          await scheduleMedicationReminder({
            id: docRef.id,
            uid: userinfo.uid,
            date,
            time: formData.reminderTime,
            whenToTake: formData.whenToTake,
            medId: medRef.id,
            notificationId: null,
          });
        }
      });

      await Promise.all(reminderWrites);

      Alert.alert("Success", "Medication and reminders created!", [
        {
          text: "OK",
          onPress: () => router.replace("/(app)/(tabs)/(medications)"),
        },
      ]);
    } catch (e) {
      console.error(e);
      Alert.alert("Error", "Failed to save medication.");
    }
  };

  return (
    <View className="p-6">
      <Text className="font-bold text-lg mb-2">Confirm Medication</Text>
      <Text>Name: {medicationName}</Text>
      <Text>Type: {medicationType}</Text>
      <Text>When: {whenToTake}</Text>
      <Text>Interval: {interval}</Text>
      <Text>Start: {new Date(startDate as string).toLocaleDateString()}</Text>
      <Text>End: {formData.endDate?.toLocaleDateString()}</Text>

      <Button className="mt-4" onPress={handleSave}>
        <Text>Save Medication</Text>
      </Button>
    </View>
  );
}
