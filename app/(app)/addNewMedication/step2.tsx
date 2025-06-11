// app/(app)/addNewMedication/step2.tsx
import { View } from "react-native";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Button } from "~/components/ui/button";
import { Text } from "~/components/ui/text";
import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { TypeList } from "~/src/constants/addMedicationOptions";

export default function Step2() {
  const { medicationName } = useLocalSearchParams();
  const [medicationType, setMedicationType] = useState("");

  return (
    <View className="p-6">
      <Select
        onValueChange={(option) => setMedicationType(option?.value ?? "")}
      >
        <SelectTrigger>
          <SelectValue placeholder="Select medication type" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            {TypeList.map((type) => (
              <SelectItem key={type} value={type} label={type}>
                {type}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>

      <Button
        className="mt-4"
        onPress={() =>
          router.push({
            pathname: "/addNewMedication/step3",
            params: { medicationName, medicationType },
          })
        }
      >
        <Text>Next</Text>
      </Button>
    </View>
  );
}
