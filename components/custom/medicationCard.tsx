import React from "react";
import { View, TouchableWithoutFeedback } from "react-native";
import { Card, CardContent } from "~/components/ui/card";
import { Text } from "~/components/ui/text";
import { Circle } from "~/lib/icons/Circle";
import type { Medication } from "~/src/types/medication";
import { useRouter } from "expo-router";
import { handleTakeMedication, handleUntakeMedication } from "~/src/utils/medicationActions";
import { Alert } from "react-native";
import { Timestamp } from "firebase/firestore";

interface MedicationCardProps {
  medication: Medication;
  onMedicationUpdate: (medication: Medication) => void;
  openDateTimePicker: (date: Date) => Promise<Date | null>;
}

const MedicationCard = ({
  medication,
  onMedicationUpdate,
  openDateTimePicker,
}: MedicationCardProps) => {
  const router = useRouter();

  const handleMedicationAction = async () => {
    if (medication.status === "taken") {
      await handleUntakeMedication(medication, {
        onSuccess: (takenTime, onTime) => {
          onMedicationUpdate({
            ...medication,
            status: "pending",
            takenTime: null,
            onTime: null
          });
        },
        onError: (error) => {
          console.error("Error undoing medication:", error);
          Alert.alert("Error", "Failed to undo medication. Please try again.");
        },
        openDateTimePicker
      });
    } else {
      await handleTakeMedication(medication, {
        onSuccess: (takenTime, onTime) => {
          onMedicationUpdate({
            ...medication,
            status: "taken",
            takenTime: Timestamp.fromDate(takenTime),
            onTime
          });
        },
        onError: (error) => {
          console.error("Error marking medication as taken:", error);
          Alert.alert("Error", "Failed to mark medication as taken. Please try again.");
        },
        openDateTimePicker
      });
    }
  };

  const handleCardPress = () => {
    router.push({
      pathname: "/(app)/(tabs)/(home)/details/details",
      params: { medication: JSON.stringify(medication) }
    });
  };

  let takenTimeStr = "";
  if (medication.status === "taken" && medication.takenTime instanceof Timestamp) {
    const taken = medication.takenTime.toDate();
    takenTimeStr = `${taken.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    })}, ${taken.toLocaleDateString()}`;
  }

  return (
    <View className="w-full">
      <Card className="w-full flex flex-row items-center p-6 gap-4">
        {medication.status === "pending" && (
          <>
            <Circle
              size={32}
              className="text-primary"
              onPress={handleMedicationAction}
            />
            <TouchableWithoutFeedback onPress={handleCardPress}>
              <CardContent className="p-0 flex-1">
                <Text className="font-bold text-lg mb-2">
                  {medication.medicationName}
                </Text>
                <View className="flex-row gap-3 items-center">
                  <Text className="text-gray-500">
                    {medication.medicationType}
                  </Text>
                  <View className="w-1 h-1 rounded-full bg-gray-500" />
                  <Text className="text-gray-500">{medication.whenToTake}</Text>
                </View>
              </CardContent>
            </TouchableWithoutFeedback>
          </>
        )}
        {medication.status === "taken" && (
          <TouchableWithoutFeedback onPress={handleCardPress}>
            <View className="flex-1">
              <Text className="font-bold">
                Status: Medication has been taken {takenTimeStr}
                {typeof medication.onTime !== undefined && (
                  <Text>({medication.onTime ? "on time" : "not on time"})</Text>
                )}
              </Text>
            </View>
          </TouchableWithoutFeedback>
        )}
      </Card>
    </View>
  );
};

export default MedicationCard;
