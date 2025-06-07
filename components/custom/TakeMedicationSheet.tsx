import React, { useState } from 'react';
import { View } from 'react-native';
import { Text } from '~/components/ui/text';
import { Button } from '~/components/ui/button';
import BottomSheet from './BottomSheet';
import type { Medication } from '~/src/types/medication';
import DateTimePicker from '@react-native-community/datetimepicker';
import { getScheduledDate } from '~/src/utils/medicationActions';

interface TakeMedicationSheetProps {
  visible: boolean;
  onDismiss: () => void;
  medication: Medication;
  onTakeOnTime: () => void;
  onTakeNow: () => void;
  onSetTime: (date: Date) => void;
}

const TakeMedicationSheet: React.FC<TakeMedicationSheetProps> = ({
  visible,
  onDismiss,
  medication,
  onTakeOnTime,
  onTakeNow,
  onSetTime,
}) => {
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());

  const handleDateChange = (event: any, date?: Date) => {
    if (date) {
      setSelectedDate(date);
    }
  };

  const handleConfirm = () => {
    onSetTime(selectedDate);
  };

  const handleTakeOnTime = () => {
    onTakeOnTime();
  };

  const handleTakeNow = () => {
    onTakeNow();
  };

  return (
    <BottomSheet
      visible={visible}
      onClose={onDismiss}
      title={showDatePicker ? "Select Date & Time" : "Mark as Taken"}
    >
      <View className="space-y-8 px-4">
        {!showDatePicker ? (
          <>
            <View className="space-y-2">
              <Text className="text-lg text-gray-900">
                When did you take {medication.medicationName}?
              </Text>
              <Text className="text-base text-gray-500">
                Choose the most accurate option:
              </Text>
            </View>
            
            <View className="space-y-8 flex flex-col gap-2">
              <Button
                variant="secondary"
                onPress={handleTakeOnTime}
                className="w-full py-10"
              >
                <Text className="text-lg font-medium">On Time</Text>
                <Text className="text-base text-gray-500">Mark as taken at scheduled time</Text>
              </Button>

              <Button
                variant="secondary"
                onPress={handleTakeNow}
                className="w-full py-6"
              >
                <Text className="text-lg font-medium">Now</Text>
                <Text className="text-base text-gray-500">Mark as taken at current time</Text>
              </Button>

              <Button
                variant="secondary"
                onPress={() => setShowDatePicker(true)}
                className="w-full py-4"
              >
                <Text className="text-lg font-medium">Set Time</Text>
                <Text className="text-base text-gray-500">Choose a specific time</Text>
              </Button>
            </View>
          </>
        ) : (
          <View className="space-y-6">
            <Text className="text-base text-gray-500 text-center">
              Select when you took {medication.medicationName}
            </Text>
            <DateTimePicker
              value={selectedDate}
              mode="datetime"
              display="spinner"
              onChange={handleDateChange}
              maximumDate={new Date()}
              minimumDate={new Date(2020, 0, 1)}
            />
            <Button
              onPress={handleConfirm}
              className="w-full py-4"
            >
              <Text className="text-lg font-medium">Confirm Time</Text>
            </Button>
          </View>
        )}

        <Button
          variant="ghost"
          onPress={showDatePicker ? () => setShowDatePicker(false) : onDismiss}
          className="w-full py-4"
        >
          <Text className="text-lg text-gray-500">
            {showDatePicker ? "Back" : "Cancel"}
          </Text>
        </Button>
      </View>
    </BottomSheet>
  );
};

export default TakeMedicationSheet; 