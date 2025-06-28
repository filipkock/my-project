import {
  View,
  SafeAreaView,
  TouchableWithoutFeedback,
  Keyboard,
  ActivityIndicator,
} from "react-native";
import { Text } from "~/components/ui/text";
import { Label } from "~/components/ui/label";
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
import { ChevronLeft } from "~/lib/icons/ChevronLeft";
import { useState } from "react";
import toastConfig from "~/src/constants/toastConfig";
import Toast from "react-native-toast-message";

export default function ConfirmStep() {
  const [isSaving, setIsSaving] = useState(false);
  const {
    medicationName,
    medicationType,
    whenToTake,
    interval,
    startDate,
    endDate,
    reminderTime,
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
    reminderTime: reminderTime
      ? new Date(reminderTime as string).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        })
      : "08:00",
    customIntervalValue: "1",
    specificDaysOfWeek: [],
    reminderDates: [],
  };

  const handleSave = async () => {
    setIsSaving(true);
    if (!uid) return;

    try {
      const userinfo = await getFromStorage("userDetails");
      if (!userinfo?.uid) {
        Alert.alert("User not found", "Please sign in again.");
        setIsSaving(false);
        return;
      }

      const start = formData.startDate!;
      const now = new Date();
      const trueEndDate = formData.endDate; // can be null
      const chunkEndDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      const customInterval = parseInt(formData.customIntervalValue || "1", 10);

      const reminderDates = generateReminderDates(
        start,
        chunkEndDate,
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
        endDate: trueEndDate ? Timestamp.fromDate(trueEndDate) : null,
        chunkEndDate: Timestamp.fromDate(chunkEndDate),
        ...(userinfo.email ? { userEmail: userinfo.email } : {}),
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
          ...(userinfo.email ? { userEmail: userinfo.email } : {}),
          notificationId: null,
        });

        // ✅ Only schedule if within 14 days
        const now = new Date();
        const twoWeeksFromNow = new Date(
          now.getTime() + 14 * 24 * 60 * 60 * 1000
        );
        if (date.toDate() > now && date.toDate() < twoWeeksFromNow) {
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
          onPress: () => {
            router.replace("/(app)/(tabs)/(medications)");
            setTimeout(() => {
              Toast.show({
                type: "plain",
                text1: "Medication created",
                text2: "Your medication was added successfully!",
              });
            }, 500);
          },
        },
      ]);
      setIsSaving(false);
    } catch (e) {
      console.error(e);
      Alert.alert("Error", "Failed to save medication.");
      setIsSaving(false);
    }
  };

  return (
    <View className="flex-1">
      <SafeAreaView>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
          <View className="p-8">
            <ChevronLeft
              size={32}
              color="black"
              onPress={() => router.back()}
            />
            <Text className="text-2xl font-semibold mt-10">Summary</Text>
          </View>
        </TouchableWithoutFeedback>
      </SafeAreaView>

      <View
        className="flex-1 bg-white p-8 shadow-sm"
        style={{
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          backgroundColor: "white",
          shadowColor: "#000",
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.05,
          shadowRadius: 12,
          elevation: 8,
        }}
      >
        <View className="flex-1 gap-3">
          <View>
            <Label className="text-gray-500 mb-1">Medication</Label>
            <Text className="text-lg">{medicationName}</Text>
          </View>

          <View>
            <Label className="text-gray-500 mb-1">Type</Label>
            <Text className="text-lg">{medicationType}</Text>
          </View>

          <View>
            <Label className="text-gray-500 mb-1">When</Label>
            <Text className="text-lg">{whenToTake}</Text>
          </View>

          <View>
            <Label className="text-gray-500 mb-1">Interval</Label>
            <Text className="text-lg">{interval}</Text>
          </View>

          <View>
            <Label className="text-gray-500 mb-1">Start</Label>
            <Text className="text-lg">
              {new Date(startDate as string).toLocaleDateString()}
            </Text>
          </View>

          <View>
            <Label className="text-gray-500 mb-1">End</Label>
            <Text className="text-lg">
              {formData.endDate == null
                ? "No end date (take forever)"
                : formData.endDate.toLocaleDateString()}
            </Text>
          </View>

          <View>
            <Label className="text-gray-500 mb-1">Reminder time</Label>
            <Text className="text-lg">{formData.reminderTime}</Text>
          </View>
        </View>
        <Button className="mt-4" onPress={handleSave} disabled={isSaving}>
          {isSaving ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <Text>Save Medication</Text>
          )}
        </Button>
      </View>
    </View>
  );
}
