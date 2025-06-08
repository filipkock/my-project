import React from "react";
import { View, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { Text } from "~/components/ui/text";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";

interface Medication {
  id: string;
  medicationName: string;
  medicationType: string;
  intakeInterval: string;
  time: string;
  whenToTake: string;
}

interface MedicationCardProps {
  medication: Medication;
}

const MedicationCreationCard: React.FC<MedicationCardProps> = ({
  medication,
}) => {
  const router = useRouter();

  const handlePress = () => {
    router.push({
      pathname: "/(app)/(tabs)/(medications)/MedicationDetails",
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
          <Text className=" text-gray-600">
            {medication.intakeInterval} - {medication.time}
          </Text>
        </CardContent>
      </Card>
    </Pressable>
  );
};

export default MedicationCreationCard;
