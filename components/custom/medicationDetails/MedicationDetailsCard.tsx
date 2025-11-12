import React from "react";
import { View, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { Text } from "~/components/ui/text";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import type { FirestoreMedication } from "~/src/types/medication";

interface MedicationCardProps {
  medication: FirestoreMedication & { id: string };
}

const MedicationDetailsCard: React.FC<MedicationCardProps> = ({
  medication,
}) => {
  const router = useRouter();

  const handlePress = () => {
    router.push({
      pathname: "/medicationList/medicationDetails",
      params: { medication: JSON.stringify(medication) },
    });
  };

  return (
    <Pressable onPress={handlePress}>
      <Card className="w-full">
        <CardHeader>
          <CardTitle>
            {medication.medicationName} - {medication.medicationType}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Text className="text-gray-600">
            {medication.intakeInterval} - {medication.reminderTimes?.join(", ")}
          </Text>
        </CardContent>
      </Card>
    </Pressable>
  );
};

export default MedicationDetailsCard;
