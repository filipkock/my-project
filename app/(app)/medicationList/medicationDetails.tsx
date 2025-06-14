import { SafeAreaView, View } from "react-native";
import { router, useLocalSearchParams, useNavigation } from "expo-router";
import { useEffect, useState } from "react";
import { Text } from "~/components/ui/text";
import { Card, CardHeader, CardTitle, CardContent } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { ChevronLeftIcon } from "react-native-heroicons/solid";

interface Medication {
  id: string;
  medicationName: string;
  medicationType: string;
  intakeInterval: string;
  time: string;
  whenToTake: string;
}

export default function MedicationDetails() {
  const { medication } = useLocalSearchParams();
  const navigation = useNavigation();
  const [parsedMedication, setParsedMedication] = useState<Medication | null>(
    null
  );

  useEffect(() => {
    if (medication && typeof medication === "string") {
      try {
        const parsed = JSON.parse(medication);
        setParsedMedication(parsed);
      } catch (error) {
        console.error("Failed to parse medication param:", error);
      }
    }
  }, [medication]);

  if (!parsedMedication) {
    return (
      <View className="flex-1 items-center justify-center p-6">
        <Text className="text-center text-lg">No medication found.</Text>
      </View>
    );
  }

  const handlePress = () => {
    router.push({
      pathname: "/(app)/(tabs)/(medications)",
    });
  };

  return (
    <SafeAreaView className="flex-1">
      <View className="flex-1 p-6">
        <ChevronLeftIcon
          size={32}
          color="black"
          onPress={() => handlePress()}
        />
        <Card className="w-full">
          <CardHeader>
            <CardTitle>{parsedMedication.medicationName}</CardTitle>
          </CardHeader>
          <CardContent className="gap-2">
            <Text>Type: {parsedMedication.medicationType}</Text>
            <Text>Interval: {parsedMedication.intakeInterval}</Text>
            <Text>Time: {parsedMedication.time}</Text>
            <Text>When to take: {parsedMedication.whenToTake}</Text>
          </CardContent>
        </Card>

        <View className="mt-3">
          <Button
            onPress={() =>
              router.push({
                pathname: "/medicationList/editMedication",
                params: { medication: JSON.stringify(parsedMedication) },
              })
            }
          >
            <Text>Edit Medication</Text>
          </Button>
        </View>
      </View>
    </SafeAreaView>
  );
}
