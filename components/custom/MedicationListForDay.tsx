import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { Text } from '~/components/ui/text';
import MedicationCard from './medicationCard';
import type { Medication } from '~/src/types/medication';

interface MedicationListForDayProps {
  items: Medication[];
  loading: boolean;
  onMedicationUpdate: (medication: Medication) => void;
  openDateTimePicker: (medication: Medication, date: Date) => Promise<Date | null>;
}

export default function MedicationListForDay({ 
  items, 
  loading, 
  onMedicationUpdate,
  openDateTimePicker 
}: MedicationListForDayProps) {
  if (loading) {
    return (
      <View className="flex-1 items-center justify-center p-4">
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (items.length === 0) {
    return (
      <View className="flex-1 items-center justify-center p-4">
        <Text className="text-muted-foreground">No medication reminders today.</Text>
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
          <Text className="text-4xl font-semibold mb-4 mx-10">
            {time}
          </Text>
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