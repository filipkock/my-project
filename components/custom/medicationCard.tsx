import { View } from "react-native";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Text } from "~/components/ui/text";
import { useState } from "react";
import { Circle } from "~/lib/icons/Circle";
import type { Medication } from "~/types/medication";

const medicationCard = ({
  medication,
  onTakeMedication,
}: {
  medication: Medication;
  onTakeMedication: (reminderDocID: Medication) => void;
}) => {
  const [status, setStatus] = useState(medication.status);

  const handleTakeMedication = () => {
    console.log("Taking medication:", medication);
    setStatus("taken");
    onTakeMedication(medication);
  };
  return (
    <View className="w-full">
      <Card className="w-full flex flex-row items-center p-6 gap-4">
        {status === "pending" && (
          <Circle
            size={32}
            className="text-primary"
            onPress={() => handleTakeMedication()}
          />
        )}
        {status === "taken" && (
          <Text className="font-bold">Status: Medication has been taken</Text>
        )}
        {status !== "taken" && (
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
