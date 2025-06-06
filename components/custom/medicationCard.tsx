import React from "react";
import { View, TouchableWithoutFeedback } from "react-native";
import { Card, CardContent } from "~/components/ui/card";
import { Text } from "~/components/ui/text";
import { Circle } from "~/lib/icons/Circle";
import type { Medication } from "~/types/medication";
import { useRouter } from "expo-router";

const medicationCard = ({
  medication,
  onTakeMedication,
}: {
  medication: Medication;
  onTakeMedication: (reminderDocID: Medication) => void;
}) => {
  const router = useRouter();

  const handleTakeMedication = () => {
    onTakeMedication(medication);
  };

  const handleCardPress = () => {
    router.push({
      pathname: "/(app)/(tabs)/(home)/details/details",
      params: { medication: JSON.stringify(medication) }
    });
  };

  let takenTimeStr = "";
  if (medication.status === "taken" && medication.takenTime) {
    const taken =
      typeof medication.takenTime === "object" &&
      typeof medication.takenTime.toDate === "function"
        ? medication.takenTime.toDate()
        : new Date(medication.takenTime);
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
              onPress={handleTakeMedication}
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

export default medicationCard;
