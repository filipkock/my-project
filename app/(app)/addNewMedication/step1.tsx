// app/(app)/addNewMedication/step1.tsx
import { View } from "react-native";
import { Input } from "~/components/ui/input";
import { Button } from "~/components/ui/button";
import { Text } from "~/components/ui/text";
import { router } from "expo-router";
import { useState } from "react";
import { ChevronLeft } from "~/lib/icons/ChevronLeft";

export default function Step1() {
  const [medicationName, setMedicationName] = useState("");

  return (
    <View className="p-6">
      <ChevronLeft
        size={32}
        color="black"
        onPress={() => router.push("/(app)/(tabs)/(medications)")}
      />
      <Input
        placeholder="Enter medication name"
        value={medicationName}
        onChangeText={setMedicationName}
      />
      <Button
        onPress={() =>
          router.push({
            pathname: "/addNewMedication/step2",
            params: { medicationName },
          })
        }
        className="mt-4"
      >
        <Text>Next</Text>
      </Button>
    </View>
  );
}
