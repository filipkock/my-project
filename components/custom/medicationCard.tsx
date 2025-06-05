import { View } from "react-native";
import { Card, CardContent } from "~/components/ui/card";
import { Text } from "~/components/ui/text";
import { Circle } from "~/lib/icons/Circle";
import type { Medication } from "~/types/medication";

const medicationCard = ({
  medication,
  onTakeMedication,
}: {
  medication: Medication;
  onTakeMedication: (reminderDocID: Medication) => void;
}) => {
  const handleTakeMedication = () => {
    onTakeMedication(medication);
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
          <Circle
            size={32}
            className="text-primary"
            onPress={handleTakeMedication}
          />
        )}
        {medication.status === "taken" && (
          <Text className="font-bold">
            Status: Medication has been taken {takenTimeStr}
            {typeof medication.onTime === "boolean" && (
              <Text>({medication.onTime ? "on time" : "not on time"})</Text>
            )}
          </Text>
        )}
        {medication.status !== "taken" && (
          <CardContent className="p-0">
            <Text className="font-bold text-lg mb-2">
              {medication.medicationName}
            </Text>
            <View className="flex-row gap-3 items-center">
              <Text className="text-gray-500">{medication.medicationType}</Text>
              <View className="w-1 h-1 rounded-full bg-gray-500" />
              <Text className="text-gray-500">{medication.whenToTake}</Text>
            </View>
          </CardContent>
        )}
      </Card>
    </View>
  );
};

export default medicationCard;
