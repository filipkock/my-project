// app/(app)/addNewMedication/step4.tsx
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

const IntervalList = [
  "Every day",
  "Every other day",
  "Every 3 days",
  "Specific days of the week",
];

export default function Step4() {
  const { medicationName, medicationType, whenToTake } = useLocalSearchParams();
  const [interval, setInterval] = useState("");

  return (
    <View className="p-6">
      <Select onValueChange={(option) => setInterval(option?.value ?? "")}>
        <SelectTrigger>
          <SelectValue placeholder="Select interval" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            {IntervalList.map((item) => (
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
            pathname: "/addNewMedication/step5",
            params: {
              medicationName,
              medicationType,
              whenToTake,
              interval,
            },
          })
        }
      >
        <Text>Next</Text>
      </Button>
    </View>
  );
}
