import React, { useEffect, useState, useCallback } from "react";
import { View, ScrollView, Alert } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Text } from "~/components/ui/text";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import moment from "moment";
import type { Medication } from "~/src/types/medication";
import {
  Timestamp,
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
} from "firebase/firestore";
import { db } from "~/config/firebase";
import {
  getScheduledDate,
  handleTakeMedication,
  handleUntakeMedication,
  markMedicationAsTaken,
} from "~/src/utils/medication";
import { updateStreak, decrementStreak } from "~/src/utils/streak";
import { getFromStorage } from "~/src/services/storage";
import UndoMedicationModal from "~/components/custom/UndoMedicationModal";
import TakeMedicationSheet from "~/components/custom/TakeMedicationSheet";

interface ReminderData {
  takenTime: Timestamp;
  medId: string;
  status: string;
  onTime?: boolean;
  uid?: string;
  date?: Timestamp;
}

interface LastTakenReminder {
  takenTime: Timestamp;
}

export default function MedicationDetails() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const [localMed, setLocalMed] = useState<Medication>(() => {
    const parsed = JSON.parse(params.medication as string);
    return {
      ...parsed,
      date: new Timestamp(parsed.date.seconds, parsed.date.nanoseconds),
    };
  });
  const [lastTakenInfo, setLastTakenInfo] = useState<string | null>(null);
  const [showUndoModal, setShowUndoModal] = useState(false);
  const [isTakeSheetVisible, setIsTakeSheetVisible] = useState(false);

  const fetchLastTakenReminder = useCallback(async () => {
    try {
      const q = query(
        collection(db, "reminders"),
        where("medId", "==", localMed.medDocID),
        where("status", "==", "taken"),
        orderBy("takenTime", "desc"),
        limit(1)
      );
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        const lastTaken = snapshot.docs[0].data() as ReminderData;
        const takenTime = lastTaken.takenTime.toDate();
        setLastTakenInfo(
          `Last taken on ${moment(takenTime).format(
            "MMMM D, YYYY"
          )} at ${moment(takenTime).format("HH:mm")}`
        );
      } else {
        setLastTakenInfo(null);
      }
    } catch (error) {
      console.error("Error fetching last taken reminder:", error);
      setLastTakenInfo(null);
    }
  }, [localMed.medDocID]);

  useEffect(() => {
    fetchLastTakenReminder();
  }, [fetchLastTakenReminder]);

  const calculateStatus = useCallback(() => {
    if (localMed.status === "taken") {
      return "Taken";
    }
    const scheduledTime = getScheduledDate(localMed);
    const now = new Date();
    if (scheduledTime < now) {
      return "Overdue";
    }
    return "Upcoming";
  }, [localMed]);

  const handleMedicationAction = useCallback(async () => {
    if (localMed.status === "taken") {
      setShowUndoModal(true);
    } else {
      setIsTakeSheetVisible(true);
    }
  }, [localMed]);

  const handleSuccessfulIntake = useCallback(
    async (takenTime: Date, onTime: boolean) => {
      const updatedMedication = {
        ...localMed,
        status: "taken",
        takenTime: Timestamp.fromDate(takenTime),
        onTime,
      };
      setLocalMed(updatedMedication);
      await fetchLastTakenReminder();
      router.setParams({ medication: JSON.stringify(updatedMedication) });

      const userinfo = await getFromStorage("userDetails");
      if (userinfo) {
        const today = new Date();
        const start = new Date(today.setHours(0, 0, 0, 0));
        const end = new Date(today.setHours(23, 59, 59, 999));
        const q = query(
          collection(db, "reminders"),
          where("uid", "==", userinfo.uid),
          where("date", ">=", Timestamp.fromDate(start)),
          where("date", "<=", Timestamp.fromDate(end))
        );
        const docs = await getDocs(q);
        const reminders = docs.docs.map((d) => d.data() as ReminderData);
        const takenToday = reminders.filter((r) => r.onTime).length;
        const totalToday = reminders.length;
        if (totalToday > 1) {
          router.push({
            pathname: "/(app)/(tabs)/(home)/DailyProgress",
            params: {
              taken: String(takenToday),
              total: String(totalToday),
            },
          });
        }
      }
    },
    [localMed, fetchLastTakenReminder, router]
  );

  const handleTakeOnTime = async () => {
    const scheduledTime = getScheduledDate(localMed);
    await markMedicationAsTaken(localMed, scheduledTime, true, {
      onSuccess: handleSuccessfulIntake,
      onError: (error) => {
        console.error("Error marking medication as taken:", error);
        Alert.alert(
          "Error",
          "Failed to mark medication as taken. Please try again."
        );
      },
      openDateTimePicker: async () => null,
      showTakeMedicationSheet: () => {},
    });
  };

  const handleTakeNow = async () => {
    const now = new Date();
    await markMedicationAsTaken(localMed, now, false, {
      onSuccess: handleSuccessfulIntake,
      onError: (error) => {
        console.error("Error marking medication as taken:", error);
        Alert.alert(
          "Error",
          "Failed to mark medication as taken. Please try again."
        );
      },
      openDateTimePicker: async () => null,
      showTakeMedicationSheet: () => {},
    });
  };

  const handleSetTime = async (date: Date) => {
    const scheduledTime = getScheduledDate(localMed);
    const isOnTime =
      Math.abs(date.getTime() - scheduledTime.getTime()) <= 60 * 60 * 1000; // Within 1 hour
    await markMedicationAsTaken(localMed, date, isOnTime, {
      onSuccess: handleSuccessfulIntake,
      onError: (error) => {
        console.error("Error marking medication as taken:", error);
        Alert.alert(
          "Error",
          "Failed to mark medication as taken. Please try again."
        );
      },
      openDateTimePicker: async () => null,
      showTakeMedicationSheet: () => {},
    });
  };

  const handleUndoConfirm = useCallback(async () => {
    setShowUndoModal(false);
    await handleUntakeMedication(localMed, {
      onSuccess: async (takenTime, onTime) => {
        const updatedMedication = {
          ...localMed,
          status: "pending",
          takenTime: null,
          onTime: null,
        };
        setLocalMed(updatedMedication);
        await fetchLastTakenReminder();
        router.setParams({ medication: JSON.stringify(updatedMedication) });

        // Decrement streak by 1 if the medication was taken on time
        if (localMed.onTime === true) {
          const userinfo = await getFromStorage("userDetails");
          if (userinfo) {
            await decrementStreak(userinfo.uid);
          }
        }
      },
      onError: (error) => {
        console.error("Error undoing medication:", error);
        Alert.alert("Error", "Failed to undo medication. Please try again.");
      },
      openDateTimePicker: async () => null,
      showTakeMedicationSheet: () => {},
    });
  }, [localMed, fetchLastTakenReminder, router]);

  const formatScheduledTime = useCallback(() => {
    const scheduledTime = getScheduledDate(localMed);
    const isToday = moment(scheduledTime).isSame(new Date(), "day");
    const timeStr = moment(scheduledTime).format("HH:mm");
    return `Scheduled for ${timeStr}, ${
      isToday ? "today" : moment(scheduledTime).format("MMMM D")
    }`;
  }, [localMed]);

  const formatTakenTime = useCallback(() => {
    if (!localMed.takenTime || !(localMed.takenTime instanceof Timestamp))
      return null;
    const takenTime = localMed.takenTime.toDate();
    return `Taken at ${moment(takenTime).format("HH:mm")}`;
  }, [localMed]);

  return (
    <View className="flex-1 bg-background">
      <ScrollView className="flex-1">
        <View className="p-10 space-y-6">
          <Badge variant="default" className="self-start">
            <Text className="text-xs font-medium">{calculateStatus()}</Text>
          </Badge>

          <Text className="text-3xl font-bold">{localMed.medicationName}</Text>

          <View className="flex-row items-center space-x-3">
            {/* Add relevant icons here later */}
            <Text className="text-base">{formatScheduledTime()}</Text>
          </View>

          <View className="flex-row items-center space-x-3">
            <Text className="text-base">
              Take {localMed.dosageAmount || 1} {localMed.dosageUnit || "pill"}
              {localMed.dosageStrength ? `, ${localMed.dosageStrength}` : ""}
            </Text>
          </View>

          {formatTakenTime() && (
            <View className="flex-row items-center space-x-3">
              <Text className="text-base text-muted-foreground">
                {formatTakenTime()}
              </Text>
            </View>
          )}

          {lastTakenInfo && localMed.status !== "taken" && (
            <View className="flex-row items-center space-x-3">
              <Text className="text-base text-muted-foreground">
                {lastTakenInfo}
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      <View className="p-4 border-t border-border bg-background">
        <Button
          onPress={handleMedicationAction}
          className="w-full"
          variant={localMed.status === "taken" ? "outline" : "default"}
        >
          <Text
            className={
              localMed.status === "taken" ? "text-foreground" : "text-white"
            }
          >
            {localMed.status === "taken"
              ? "Undo Medication"
              : "Take Medication"}
          </Text>
        </Button>
      </View>

      <UndoMedicationModal
        visible={showUndoModal}
        onConfirm={handleUndoConfirm}
        onCancel={() => setShowUndoModal(false)}
      />

      <TakeMedicationSheet
        visible={isTakeSheetVisible}
        onDismiss={() => setIsTakeSheetVisible(false)}
        medication={localMed}
        onTakeOnTime={handleTakeOnTime}
        onTakeNow={handleTakeNow}
        onSetTime={handleSetTime}
      />
    </View>
  );
}
