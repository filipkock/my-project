import { SafeAreaView, View } from "react-native";
import { router, useLocalSearchParams, useNavigation } from "expo-router";
import { useEffect, useState } from "react";
import { Text } from "~/components/ui/text";
import { Button } from "~/components/ui/button";
import { Label } from "~/components/ui/label";
import { ChevronLeftIcon } from "react-native-heroicons/solid";

interface Medication {
  id: string;
  medicationName: string;
  medicationType: string;
  intakeInterval: string;
  reminderTimes: string[];
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
      <View className="flex-1 p-8">
        <ChevronLeftIcon
          size={32}
          color="black"
          onPress={() => handlePress()}
        />

        <View className="mt-14 flex-1 p-8 gap-3">
          <Text className="text-4xl font-bold mb-4 uppercase">
            {parsedMedication.medicationName}
          </Text>

          <View>
            <Label className="text-gray-500 mb-1">Type</Label>
            <Text className="text-lg">{parsedMedication.medicationType}</Text>
          </View>

          <View>
            <Label className="text-gray-500 mb-1">Interval</Label>
            <Text className="text-lg">{parsedMedication.intakeInterval}</Text>
          </View>

          <View>
            <Label className="text-gray-500 mb-1">Times</Label>
            <Text className="text-lg">
              {parsedMedication.reminderTimes?.join(", ")}
            </Text>
          </View>
        </View>

        <View>
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
