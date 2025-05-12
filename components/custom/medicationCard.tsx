import { View } from "react-native";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { router } from "expo-router";
import { Text } from "~/components/ui/text";
import { getFromStorage } from "~/src/services/storage";
import { collection, query, Timestamp } from "firebase/firestore";
import { db } from "~/config/firebase";
import { useState } from "react";
import { Circle } from "~/lib/icons/Circle";

interface Medication {
  medicationName: string;
  medicationType: string;
  reminderTime: string;
  whenToTake: string;
  status: string;
  reminderDocID: string;
}

const medicationCard = ({
  medication,
  onTakeMedication,
}: {
  medication: Medication;
  onTakeMedication: (reminderDocID: string) => void;
}) => {
  const [status, setStatus] = useState(medication.status);

  const handleTakeMedication = () => {
    setStatus("taken");
    onTakeMedication(medication.reminderDocID);
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
        <CardContent className="p-0">
          <Text className="text-2xl font-bold mb-2">
            {medication.medicationName}
          </Text>
          <View className="flex-row gap-4">
            <Text>Type: {medication.medicationType}</Text>
            <Text>Take: {medication.whenToTake}</Text>
          </View>
        </CardContent>
      </Card>
    </View>
  );
};

export default medicationCard;
