import { View } from "react-native";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { router } from "expo-router";
import { Text } from "~/components/ui/text";
import { getFromStorage } from "~/services/storage";
import { collection, query, Timestamp } from "firebase/firestore";
import { db } from "~/config/firebase";
import { useState } from "react";

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
    <View className="m-6">
      <Card className="w-full rounded-2xl max-w-sm">
        <CardHeader>
          <CardTitle>{medication.medicationName}</CardTitle>
        </CardHeader>
        <CardContent>
          <Text className="text-base mb-5">
            Type: {medication.medicationType}
          </Text>
          <Text className="text-base mb-5">Take: {medication.whenToTake}</Text>
          <Text className="text-base mb-5">
            Time: {medication.reminderTime}
          </Text>
          {status === "pending" && (
            <Button
              className="flex-1 flex-row gap-2"
              onPress={() => handleTakeMedication()}
            >
              <Text>Take medication</Text>
            </Button>
          )}
          {status === "taken" && (
            <Text className="font-bold">Status: Medication has been taken</Text>
          )}
        </CardContent>
      </Card>
    </View>
  );
};

export default medicationCard;
