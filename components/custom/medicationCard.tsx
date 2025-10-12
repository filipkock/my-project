import React, { useState } from "react";
import { View, TouchableOpacity, TouchableWithoutFeedback } from "react-native";
import { Text } from "~/components/ui/text";
import { CheckCircleIcon } from "react-native-heroicons/solid";
import type { Medication } from "~/src/types/medication";
import {
  handleTakeMedication,
  handleUntakeMedication,
} from "~/src/utils/medicationActions";
import { getScheduledDate } from "~/src/utils/medicationActions";
import TakeMedicationSheet from "./TakeMedicationSheet";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import { Card, CardContent } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { Circle } from "~/lib/icons/Circle";
import { useRouter } from "expo-router";
import { Timestamp } from "firebase/firestore";
import { markMedicationAsTaken } from "~/src/utils/medicationActions";
import { useTheme } from "@react-navigation/native";
import { useSelectedDate } from "~/src/context/SelectedDateContext";
import { triggerFeedback } from "~/lib/feedback";
import { useSettings } from "~/src/context/settingsContext";

interface MedicationCardProps {
  medication: Medication;
  onMedicationUpdate: (medication: Medication) => void;
  openDateTimePicker: (date: Date) => Promise<Date | null>;
}

const MedicationCard: React.FC<MedicationCardProps> = ({
  medication,
  onMedicationUpdate,
  openDateTimePicker,
}) => {
  const router = useRouter();
  const { selectedDate } = useSelectedDate();
  const [isTakeSheetVisible, setIsTakeSheetVisible] = useState(false);
  const [isDateTimePickerVisible, setIsDateTimePickerVisible] = useState(false);
  const { colors } = useTheme();
  const { soundEnabled } = useSettings();

  const handleMedicationAction = async () => {
    await triggerFeedback({ enableSound: soundEnabled });
    if (medication.status === "taken") {
      await handleUntakeMedication(
        medication,
        {
          onSuccess: (takenTime, onTime) => {
            onMedicationUpdate({
              ...medication,
              status: "pending",
              takenTime: null,
              onTime: null,
            });
          },
          onError: (error) => {
            console.error("Error undoing medication:", error);
          },
          openDateTimePicker: async () => null,
          showTakeMedicationSheet: () => {},
        },
        selectedDate
      );
    } else {
      await handleTakeMedication(medication, {
        onSuccess: (takenTime, onTime) => {
          onMedicationUpdate({
            ...medication,
            status: "taken",
            takenTime: Timestamp.fromDate(takenTime),
            onTime,
          });
        },
        onError: (error) => {
          console.error("Error marking medication as taken:", error);
        },
        openDateTimePicker: async (date: Date) => {
          setIsDateTimePickerVisible(true);
          return new Promise<Date | null>((resolve) => {
            const handleDatePicked = (pickedDate: Date) => {
              setIsDateTimePickerVisible(false);
              resolve(pickedDate);
            };
            // @ts-ignore
            window.handleDatePicked = handleDatePicked;
          });
        },
        showTakeMedicationSheet: () => {
          setIsTakeSheetVisible(true);
        },
      });
    }
  };

  const handleTakeOnTime = async () => {
    const scheduledTime = getScheduledDate(medication);
    await markMedicationAsTaken(
      medication,
      scheduledTime,
      true,
      {
        onSuccess: (takenTime: Date, onTime: boolean) => {
          onMedicationUpdate({
            ...medication,
            status: "taken",
            takenTime: Timestamp.fromDate(takenTime),
            onTime,
          });
        },
        onError: (error: Error) => {
          console.error("Error marking medication as taken:", error);
        },
        openDateTimePicker: async () => null,
        showTakeMedicationSheet: () => {},
      },
      selectedDate
    );
    setIsTakeSheetVisible(false);
  };

  const handleTakeNow = async () => {
    const now = new Date();
    await markMedicationAsTaken(
      medication,
      now,
      false,
      {
        onSuccess: (takenTime: Date, onTime: boolean) => {
          onMedicationUpdate({
            ...medication,
            status: "taken",
            takenTime: Timestamp.fromDate(takenTime),
            onTime,
          });
        },
        onError: (error: Error) => {
          console.error("Error marking medication as taken:", error);
        },
        openDateTimePicker: async () => null,
        showTakeMedicationSheet: () => {},
      },
      selectedDate
    );
    setIsTakeSheetVisible(false);
  };

  const handleSetTime = async (date: Date) => {
    const scheduledTime = getScheduledDate(medication);
    const isOnTime =
      Math.abs(date.getTime() - scheduledTime.getTime()) <= 60 * 60 * 1000; // Within 1 hour
    await markMedicationAsTaken(
      medication,
      date,
      isOnTime,
      {
        onSuccess: (takenTime: Date, onTime: boolean) => {
          onMedicationUpdate({
            ...medication,
            status: "taken",
            takenTime: Timestamp.fromDate(takenTime),
            onTime,
          });
        },
        onError: (error: Error) => {
          console.error("Error marking medication as taken:", error);
        },
        openDateTimePicker: async () => null,
        showTakeMedicationSheet: () => {},
      },
      selectedDate
    );
    setIsTakeSheetVisible(false);
  };

  const handleCardPress = () => {
    router.push({
      pathname: "/(app)/homePages/details",
      params: { medication: JSON.stringify(medication) },
    });
  };

  let takenTimeStr = "";
  if (
    medication.status === "taken" &&
    medication.takenTime instanceof Timestamp
  ) {
    const taken = medication.takenTime.toDate();
    const scheduledTime = getScheduledDate(medication);
    const isSameDay = taken.toDateString() === scheduledTime.toDateString();

    takenTimeStr = taken.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

    if (!isSameDay) {
      takenTimeStr += `, ${taken.toLocaleDateString([], {
        day: "numeric",
        month: "short",
      })}`;
    }
  }

  return (
    <View className="w-full">
      <Card
        className={`relative w-full flex flex-row items-center p-6 gap-4 ${
          medication.status === "taken" || medication.status === "skipped"
            ? "opacity-60"
            : ""
        }`}
      >
        {medication.status === "pending" && (
          <>
            <Circle
              size={32}
              className="text-primary"
              onPress={handleMedicationAction}
            />
            <TouchableWithoutFeedback onPress={handleCardPress}>
              <CardContent className="p-0 flex-1">
                {(() => {
                  const scheduledTime = getScheduledDate(medication);
                  const now = new Date();
                  const oneHour = 60 * 60 * 1000;
                  const timeDiff = Math.abs(
                    scheduledTime.getTime() - now.getTime()
                  );

                  if (timeDiff <= oneHour) {
                    return (
                      <Badge className="absolute -top-9 -left-10 z-10">
                        <Text className="text-xs">TAKE NOW</Text>
                      </Badge>
                    );
                  }
                  return null;
                })()}
                <Text className="font-bold text-lg mb-2">
                  {medication.medicationName}
                </Text>
                <View className="flex-row gap-3 items-center">
                  <Text className="text-gray-500">
                    {medication.medicationType}
                  </Text>
                </View>
              </CardContent>
            </TouchableWithoutFeedback>
          </>
        )}
        {medication.status === "taken" && (
          <>
            <CheckCircleIcon size={32} color={colors.primary} opacity={0.7} />
            <TouchableWithoutFeedback onPress={handleCardPress}>
              <View className="flex-1">
                <Text className="font-bold text-lg mb-2">
                  {medication.medicationName}
                </Text>
                <View className="flex-row gap-3 items-center">
                  <Text className="text-gray-500">Taken {takenTimeStr}</Text>
                  {typeof medication.onTime !== undefined && (
                    <Text className="text-gray-500">
                      {medication.onTime ? "•  On time" : "•  Not on time"}
                    </Text>
                  )}
                </View>
              </View>
            </TouchableWithoutFeedback>
          </>
        )}
        {medication.status === "skipped" && (
          <>
            <Circle size={32} className="text-primary" />
            <TouchableWithoutFeedback onPress={handleCardPress}>
              <View className="flex-1">
                <Text className="font-bold text-lg mb-2">
                  {medication.medicationName}
                </Text>
                <View className="flex-row gap-3 items-center">
                  <Text className="text-gray-500">Skipped</Text>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </>
        )}
      </Card>

      <TakeMedicationSheet
        visible={isTakeSheetVisible}
        onDismiss={() => setIsTakeSheetVisible(false)}
        medication={medication}
        onTakeOnTime={handleTakeOnTime}
        onTakeNow={handleTakeNow}
        onSetTime={handleSetTime}
      />

      <DateTimePickerModal
        isVisible={isDateTimePickerVisible}
        mode="datetime"
        onConfirm={(date: Date) => {
          setIsDateTimePickerVisible(false);
          // @ts-ignore
          window.handleDatePicked(date);
        }}
        onCancel={() => setIsDateTimePickerVisible(false)}
      />
    </View>
  );
};

export default MedicationCard;
