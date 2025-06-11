// app/(app)/addNewMedication/step5.tsx
import { View } from "react-native";
import { Button } from "~/components/ui/button";
import { Text } from "~/components/ui/text";
import { router, useLocalSearchParams } from "expo-router";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useState } from "react";

export default function Step5() {
  const { medicationName, medicationType, whenToTake, interval } =
    useLocalSearchParams();
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());

  return (
    <View className="p-6">
      <Text className="mb-2 font-semibold">Start date</Text>
      <DateTimePicker
        value={startDate}
        mode="date"
        display="default"
        onChange={(event, date) => date && setStartDate(date)}
      />

      <Text className="mb-2 font-semibold mt-4">End date</Text>
      <DateTimePicker
        value={endDate}
        mode="date"
        display="default"
        onChange={(event, date) => date && setEndDate(date)}
      />

      <Button
        className="mt-4"
        onPress={() =>
          router.push({
            pathname: "/addNewMedication/step6",
            params: {
              medicationName,
              medicationType,
              whenToTake,
              interval,
              startDate: startDate.toISOString(),
              endDate: endDate.toISOString(),
            },
          })
        }
      >
        <Text>Next</Text>
      </Button>
    </View>
  );
}
