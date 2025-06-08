import React, { useState } from "react";
import { View } from "react-native";
import { Text } from "~/components/ui/text";
import { Button } from "~/components/ui/button";
import { Alert, AlertTitle, AlertDescription } from "~/components/ui/alert";
import { AlertTriangle } from "~/lib/icons/AlertTriangle";
import BottomSheet from "./BottomSheet";
import type { Medication } from "~/src/types/medication";
import DateTimePicker from "@react-native-community/datetimepicker";
import { getScheduledDate } from "~/src/utils/medicationActions";

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

  const scheduledTime = getScheduledDate(medication);
  const now = new Date();
  const isFutureMedication = scheduledTime > now;
  const isSameDay =
    scheduledTime.getDate() === now.getDate() &&
    scheduledTime.getMonth() === now.getMonth() &&
    scheduledTime.getFullYear() === now.getFullYear();
  const isSameDayFuture = isFutureMedication && isSameDay;
  const isDifferentDayFuture = isFutureMedication && !isSameDay;

  const handleDateChange = (event: any, date?: Date) => {
    if (date) {
      setSelectedDate(date);
    }
  };

  const handleConfirm = () => {
    onSetTime(selectedDate);
    onDismiss();
  };

  const handleTakeOnTime = () => {
    onTakeOnTime();
    onDismiss();
  };

  const handleTakeNow = () => {
    onTakeNow();
    onDismiss();
  };

  return (
    <BottomSheet
      visible={visible}
      onClose={onDismiss}
      title={
        showDatePicker
          ? "Select Date & Time"
          : `When did you take ${medication.medicationName}?`
      }
    >
      <View className="px-4 pb-7">
        {!showDatePicker ? (
          <>
            <View className="mb-8">
              {isSameDayFuture && (
                <Alert icon={AlertTriangle} variant="destructive">
                  <Text>Warning! This is scheduled for later today.</Text>
                </Alert>
              )}
            </View>

            {isDifferentDayFuture ? (
              <View className="bg-muted p-4 rounded-md">
                <Text className="text-center text-base font-medium">
                  🎉 You're early! We'll remind you when it's time to take your
                  medication.
                </Text>
              </View>
            ) : (
              <>
                <View className="space-y-4 flex flex-col gap-3">
                  <Button
                    variant="secondary"
                    onPress={handleTakeOnTime}
                    className="w-full"
                    size="lg"
                  >
                    <View className="items-center">
                      <Text className="text-lg font-semibold mb-1">
                        On Time
                      </Text>
                    </View>
                  </Button>

                  <Button
                    variant="secondary"
                    onPress={handleTakeNow}
                    className="w-full"
                    size="lg"
                  >
                    <View className="items-center">
                      <Text className="text-lg font-semibold mb-1">Now</Text>
                    </View>
                  </Button>

                  <Button
                    variant="secondary"
                    onPress={() => setShowDatePicker(true)}
                    className="w-full"
                    size="lg"
                  >
                    <View className="items-center">
                      <Text className="text-lg font-semibold mb-1">
                        Set Time
                      </Text>
                    </View>
                  </Button>
                </View>
              </>
            )}
          </>
        ) : (
          <View className="space-y-6">
            <Text className="text-lg font-semibold text-center mb-2">
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
            <Button onPress={handleConfirm} className="w-full py-4 mt-4">
              <Text className="text-lg font-semibold">Confirm Time</Text>
            </Button>
          </View>
        )}

        <Button
          variant="ghost"
          onPress={showDatePicker ? () => setShowDatePicker(false) : onDismiss}
          className="w-full py-4 mt-4"
        >
          <Text className="text-base text-muted-foreground">
            {showDatePicker ? "Back" : "Cancel"}
          </Text>
        </Button>
      </View>
    </BottomSheet>
  );
};

export default TakeMedicationSheet;
