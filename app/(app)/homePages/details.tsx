import React, { useEffect, useState, useCallback } from "react";
import { View, ScrollView, Alert } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Text } from "~/components/ui/text";
import { Badge } from "~/components/ui/badge";
import { Label } from "~/components/ui/label";
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
  updateDoc,
  getDoc,
  doc,
} from "firebase/firestore";
import { db } from "~/config/firebase";
import {
  getScheduledDate,
  handleUntakeMedication,
  markMedicationAsTaken,
} from "~/src/utils/medicationActions";
import UndoMedicationModal from "~/components/custom/UndoMedicationModal";
import TakeMedicationSheet from "~/components/custom/TakeMedicationSheet";
import { useSelectedDate } from "~/src/context/SelectedDateContext";
import BottomSheet from "~/components/custom/BottomSheet";
import { ChevronLeftIcon } from "react-native-heroicons/solid";
import { SafeAreaView } from "react-native-safe-area-context";
import { cancelMedicationReminder } from "~/src/utils/scheduleMedicationReminder";
import PokaMelted from "~/assets/static/poka_melted.svg";

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
  const [showSkippedInfo, setShowSkippedInfo] = useState(false);
  const { selectedDate } = useSelectedDate();

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
    if (localMed.status === "skipped") {
      return "Skipped";
    }
    const scheduledTime = getScheduledDate(localMed);
    const now = new Date();
    if (scheduledTime < now) {
      return "Overdue";
    }
    return "Upcoming";
  }, [localMed]);

  const handleTakeOnTime = async () => {
    const scheduledTime = getScheduledDate(localMed);
    await markMedicationAsTaken(
      localMed,
      scheduledTime,
      true,
      {
        onSuccess: handleSuccessfulIntake,
        onError: (error: Error) => {
          console.error("Error marking medication as taken:", error);
          Alert.alert(
            "Error",
            "Failed to mark medication as taken. Please try again."
          );
        },
        openDateTimePicker: async () => null,
        showTakeMedicationSheet: () => {},
      },
      selectedDate
    );
  };

  const handleMedicationAction = useCallback(async () => {
    if (localMed.status === "taken") {
      setShowUndoModal(true);
    } else {
      const scheduledTime = getScheduledDate(localMed);
      const now = new Date();
      const timeDiff = Math.abs(scheduledTime.getTime() - now.getTime());
      const oneHour = 60 * 60 * 1000;

      if (timeDiff <= oneHour) {
        await handleTakeOnTime();
      } else {
        setIsTakeSheetVisible(true);
      }
    }
  }, [localMed, handleTakeOnTime]);

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

      // Navigation to DailyProgress page is handled from the medication list page.
    },
    [localMed, fetchLastTakenReminder]
  );

  const handleTakeNow = async () => {
    const now = new Date();
    await markMedicationAsTaken(
      localMed,
      now,
      false,
      {
        onSuccess: handleSuccessfulIntake,
        onError: (error: Error) => {
          console.error("Error marking medication as taken:", error);
          Alert.alert(
            "Error",
            "Failed to mark medication as taken. Please try again."
          );
        },
        openDateTimePicker: async () => null,
        showTakeMedicationSheet: () => {},
      },
      selectedDate
    );
  };

  const handleSetTime = async (date: Date) => {
    const scheduledTime = getScheduledDate(localMed);
    const isOnTime =
      Math.abs(date.getTime() - scheduledTime.getTime()) <= 60 * 60 * 1000; // Within 1 hour
    await markMedicationAsTaken(
      localMed,
      date,
      isOnTime,
      {
        onSuccess: handleSuccessfulIntake,
        onError: (error: Error) => {
          console.error("Error marking medication as taken:", error);
          Alert.alert(
            "Error",
            "Failed to mark medication as taken. Please try again."
          );
        },
        openDateTimePicker: async () => null,
        showTakeMedicationSheet: () => {},
      },
      selectedDate
    );
  };

  const handleUndoConfirm = useCallback(async () => {
    setShowUndoModal(false);
    await handleUntakeMedication(
      localMed,
      {
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
        },
        onError: (error: Error) => {
          console.error("Error undoing medication:", error);
          Alert.alert("Error", "Failed to undo medication. Please try again.");
        },
        openDateTimePicker: async () => null,
        showTakeMedicationSheet: () => {},
      },
      selectedDate
    );
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

  const handlePress = useCallback(() => {
    router.push({
      pathname: "/(app)/(tabs)/(home)",
    });
  }, [router]);

  return (
    <SafeAreaView className="flex-1">
      <View className="flex-1 p-8">
        <ChevronLeftIcon
          size={32}
          color="black"
          onPress={handlePress}
          className="mb-14"
        />
        <View className="mt-14 flex-1 p-8 gap-3">
          <Badge variant="default" className="self-start">
            <Text className="text-xs font-medium">{calculateStatus()}</Text>
          </Badge>

          <Text className="text-4xl font-bold mb-4 uppercase">
            {localMed.medicationName}
          </Text>

          <View>
            <Label className="text-gray-500 mb-1">Time</Label>
            <Text className="text-lg">{formatScheduledTime()}</Text>
          </View>

          <View>
            <Label className="text-gray-500 mb-1">Dosage</Label>
            <Text className="text-lg">
              Take {localMed.dosageAmount || 1}{" "}
              {localMed.medicationType || "pill"}
              {localMed.dosageStrength ? `, ${localMed.dosageStrength}` : ""}
            </Text>
          </View>

          {formatTakenTime() && (
            <View>
              <Label className="text-gray-500 mb-1">Taken</Label>
              <Text className="text-lg text-muted-foreground">
                {formatTakenTime()}
              </Text>
            </View>
          )}

          {localMed.status === "skipped" && (
            <View>
              <Label className="text-gray-500 mb-1">Status</Label>
              <Text className="text-lg text-muted-foreground">
                This medication was marked as skipped.
              </Text>
            </View>
          )}

          {lastTakenInfo && localMed.status !== "taken" && (
            <View>
              <Label className="text-gray-500 mb-1">Last Taken</Label>
              <Text className="text-lg">{lastTakenInfo}</Text>
            </View>
          )}
        </View>

        <View>
          {localMed.status === "taken" && (
            <Button
              onPress={() => setShowUndoModal(true)}
              className="w-full"
              variant="outline"
            >
              <Text className="text-foreground capitalize">
                Undo Medication
              </Text>
            </Button>
          )}

          {localMed.status === "skipped" && (
            <Button
              onPress={async () => {
                setIsTakeSheetVisible(true);
              }}
              className="w-full"
              variant="default"
            >
              <Text className="text-white capitalize">Mark as Taken</Text>
            </Button>
          )}

          {localMed.status === "pending" && (
            <>
              <Button
                onPress={handleMedicationAction}
                className="w-full"
                variant="default"
              >
                <Text className="text-white capitalize">Take Medication</Text>
              </Button>
              <View className="mt-2">
                <Button
                  onPress={async () => {
                    const updatedMedication = {
                      ...localMed,
                      status: "skipped",
                      takenTime: null,
                      onTime: false,
                    };
                    setLocalMed(updatedMedication);
                    router.setParams({
                      medication: JSON.stringify(updatedMedication),
                    });

                    // Update Firestore
                    if (localMed.reminderDocID) {
                      const reminderRef = doc(
                        db,
                        "reminders",
                        localMed.reminderDocID
                      );
                      await updateDoc(reminderRef, {
                        status: "skipped",
                        takenTime: null,
                        onTime: false,
                      });

                      // ✅ Cancel scheduled notification if exists
                      // Fetch the reminder document to get notificationId
                      const reminderSnap = await getDoc(reminderRef);
                      if (reminderSnap.exists()) {
                        const reminderData = reminderSnap.data();
                        if (reminderData.notificationId) {
                          await cancelMedicationReminder(
                            localMed.reminderDocID,
                            reminderData.notificationId
                          );
                        }
                      }
                    }

                    setShowSkippedInfo(true);
                  }}
                  className="w-full"
                  variant="outline"
                >
                  <Text className="text-foreground capitalize">
                    Skip Medication
                  </Text>
                </Button>
              </View>
            </>
          )}
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

        <BottomSheet
          visible={showSkippedInfo}
          onClose={() => setShowSkippedInfo(false)}
          title="Skipped!"
        >
          <View className="px-6 py-6">
            <View className="items-center justify-center w-full">
              <PokaMelted width={160} height={160} />
            </View>
            <Text className="text-center text-lg text-gray-700">
              O-okay... I marked it as skipped. D-don’t worry, you’re still
              doing great!
            </Text>
          </View>
        </BottomSheet>
      </View>
    </SafeAreaView>
  );
}
