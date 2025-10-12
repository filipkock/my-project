import React from "react";
import { View } from "react-native";
import { Text } from "~/components/ui/text";
import MedicationCard from "./medicationCard";
import type { Medication } from "~/src/types/medication";
import LottieView from "lottie-react-native";
import PokaMelted from "~/assets/static/poka_melted.svg";

interface MedicationListForDayProps {
  items: Medication[];
  loading: boolean;
  onMedicationUpdate: (medication: Medication) => void;
  openDateTimePicker: (
    medication: Medication,
    date: Date
  ) => Promise<Date | null>;
}

export default function MedicationListForDay({
  items,
  loading,
  onMedicationUpdate,
  openDateTimePicker,
}: MedicationListForDayProps) {
  if (loading) {
    return (
      <View className="flex-1 justify-center items-center">
        <LottieView
          source={require("~/assets/animations/loading.json")}
          style={{ width: 250, height: 250 }}
          autoPlay
          loop
        />
      </View>
    );
  }

  if (items.length === 0) {
    return (
      <View className="flex-1 items-center justify-center p-4 mt-10">
        <View className="items-center justify-center w-full">
          <PokaMelted width={140} height={140} />
        </View>
        <Text className="text-center text-lg text-gray-700">
          N-no reminders today… s-see you another day.
        </Text>
      </View>
    );
  }

  // Group items by reminder time
  const groupedItems = items.reduce((acc, item) => {
    const time = item.reminderTime;
    if (!acc[time]) {
      acc[time] = [];
    }
    acc[time].push(item);
    return acc;
  }, {} as { [key: string]: Medication[] });

  return (
    <View className="flex-1 pt-6">
      {Object.entries(groupedItems).map(([time, timeItems]) => (
        <View key={time} className="mb-6">
          <Text className="text-4xl font-semibold mb-4 mx-10">{time}</Text>
          {timeItems.map((item) => (
            <View key={item.reminderDocID} className="mx-10 mb-5">
              <MedicationCard
                medication={item}
                onMedicationUpdate={onMedicationUpdate}
                openDateTimePicker={(date) => openDateTimePicker(item, date)}
              />
            </View>
          ))}
        </View>
      ))}
    </View>
  );
}
