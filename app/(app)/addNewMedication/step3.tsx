// app/(app)/addNewMedication/step3.tsx
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
import { WhenToTakeList } from "~/src/constants/addMedicationOptions";

export default function Step3() {
  const { medicationName, medicationType } = useLocalSearchParams();
  const [whenToTake, setWhenToTake] = useState("");

  return (
    <View className="p-6">
      <Select onValueChange={(option) => setWhenToTake(option?.value ?? "")}>
        <SelectTrigger>
          <SelectValue placeholder="When to take" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            {WhenToTakeList.map((item) => (
              <SelectItem key={item} value={item} label={item}>
                {item}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>

      <Button
        className="mt-4"
        onPress={() =>
          router.push({
            pathname: "/addNewMedication/step4",
            params: {
              medicationName,
              medicationType,
              whenToTake,
            },
          })
        }
      >
        <Text>Next</Text>
      </Button>
    </View>
  );
}
