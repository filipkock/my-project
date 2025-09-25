import {
  View,
  SafeAreaView,
  TouchableWithoutFeedback,
  Keyboard,
  ActivityIndicator,
  ScrollView,
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
import {
  generateReminderDates,
  clampEndToWindow,
} from "~/src/services/reminderSchedule";
import { getFromStorage } from "~/src/services/storage";
import { db } from "~/config/firebase";
import { getAuth } from "firebase/auth";
import type { FormData } from "~/src/types/medication";
import { ChevronLeftIcon } from "react-native-heroicons/solid";
import { useState } from "react";
import toastConfig from "~/src/constants/toastConfig";
import Toast from "react-native-toast-message";
import { Stepper } from "~/components/custom/Stepper";

export default function ConfirmStep() {
  const [isSaving, setIsSaving] = useState(false);
  const {
    medicationName,
    medicationType,
    whenToTake,
    interval,
    specificDaysOfWeek,
    customIntervalValue,
    timesPerDay,
    startDate,
    endDate,
    reminderTimes,
  } = useLocalSearchParams();

  const auth = getAuth();
  const uid = auth.currentUser?.uid;

  const parsedSpecificDays =
    typeof specificDaysOfWeek === "string" && specificDaysOfWeek.length > 0
      ? specificDaysOfWeek.split(",").map(Number)
      : [];

  const parsedReminderTimes =
    typeof reminderTimes === "string" && reminderTimes.length > 0
      ? JSON.parse(reminderTimes as string)
      : ["08:00"];

  // Format reminder times to "hh:mm"
  const formatTime = (time: string) => {
    const [h, m] = time.split(":").map(Number);
    const hh = h.toString().padStart(2, "0");
    const mm = m.toString().padStart(2, "0");
    return `${hh}:${mm}`;
  };

  const formattedReminderTimes = parsedReminderTimes.map(formatTime);

  const formData: FormData = {
    medicationName: medicationName as string,
    medicationType: medicationType as string,
    whenToTake: whenToTake as string,
    intakeInterval: interval as string,
    specificDaysOfWeek: parsedSpecificDays,
    startDate: startDate ? new Date(startDate as string) : undefined,
    endDate: endDate ? new Date(endDate as string) : undefined,
    reminderTimes: formattedReminderTimes,
    customIntervalValue:
      typeof customIntervalValue === "string"
        ? customIntervalValue
        : Array.isArray(customIntervalValue)
        ? customIntervalValue[0] ?? undefined
        : undefined,
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
      const effectiveEnd = clampEndToWindow(formData.endDate, now, 14);
      const customInterval = parseInt(formData.customIntervalValue || "1", 10);

      // Generate desired dates similar to EditMedicationForm
      const reminderTimes = formData.reminderTimes || [];
      const desiredPairs: { date: Date; time: string }[] = [];

      for (const reminderTime of reminderTimes) {
        const dates = generateReminderDates(
          start,
          effectiveEnd,
          formData.intakeInterval,
          {
            customIntervalValue: customInterval,
            specificDaysOfWeek: formData.specificDaysOfWeek,
          }
        );
        for (const d of dates) {
          desiredPairs.push({ date: d.toDate(), time: reminderTime });
        }
      }

      const medRef = await addDoc(collection(db, "medication"), {
        medicationName: formData.medicationName,
        medicationType: formData.medicationType,
        whenToTake: formData.whenToTake,
        intakeInterval: formData.intakeInterval,
        customInterval: customInterval,
        specificDaysOfWeek: formData.specificDaysOfWeek,
        startDate: Timestamp.fromDate(start),
        endDate: trueEndDate ? Timestamp.fromDate(trueEndDate) : null,
        chunkEndDate: Timestamp.fromDate(effectiveEnd),
        ...(userinfo.email ? { userEmail: userinfo.email } : {}),
        createdAt: serverTimestamp(),
        uid: userinfo.uid,
        reminderTimes: formData.reminderTimes,
      });

      const reminderWrites = desiredPairs.map(async ({ date, time }) => {
        const formattedTime = formatTime(time);
        const docRef = await addDoc(collection(db, "reminders"), {
          date: Timestamp.fromDate(date),
          time: formattedTime,
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

        const [hours, minutes] = formattedTime.split(":").map(Number);
        const fullDateTime = new Date(date);
        fullDateTime.setHours(hours, minutes, 0, 0);

        if (fullDateTime > now && fullDateTime < twoWeeksFromNow) {
          await scheduleMedicationReminder({
            id: docRef.id,
            uid: userinfo.uid,
            date: Timestamp.fromDate(date),
            time: formattedTime,
            whenToTake: formData.whenToTake,
            medId: medRef.id,
            notificationId: null,
          });
        }
      });

      await Promise.all(reminderWrites);

      router.replace("/(app)/(tabs)/(medications)");
      setTimeout(() => {
        Toast.show({
          type: "plain",
          text1: "Medication created",
          text2: "Your medication was added successfully!",
        });
      }, 500);
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
            <View className="flex-row justify-between items-center">
              <ChevronLeftIcon
                size={32}
                color="black"
                onPress={() => router.back()}
                className="mb-6"
              />
              <View className="flex-1 items-center -ml-8">
                <Stepper totalSteps={9} currentStep={9} />
              </View>
            </View>
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
        <ScrollView>
          <View className="flex-1 gap-3 p-8">
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
              <Text className="text-lg">
                {interval &&
                typeof interval === "string" &&
                interval.includes("X")
                  ? interval.replace("X", String(customIntervalValue || "1"))
                  : interval}
              </Text>
            </View>

            <View>
              <Label className="text-gray-500 mb-1">Times per day</Label>
              <Text className="text-lg">
                {timesPerDay} {Number(timesPerDay) === 1 ? "time" : "times"} per
                day
              </Text>
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
              <Label className="text-gray-500 mb-1">Reminder times</Label>
              <Text className="text-lg">
                {formData.reminderTimes.join(", ")}
              </Text>
            </View>
          </View>
        </ScrollView>
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
