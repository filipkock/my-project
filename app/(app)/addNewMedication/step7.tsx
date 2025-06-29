import React, { useState, useRef } from "react";
import {
  View,
  SafeAreaView,
  TouchableWithoutFeedback,
  Keyboard,
  Animated,
  Platform,
  UIManager,
} from "react-native";
import { Button } from "~/components/ui/button";
import { Text } from "~/components/ui/text";
import { router, useLocalSearchParams } from "expo-router";
import DateTimePicker from "@react-native-community/datetimepicker";
import { ChevronLeftIcon } from "react-native-heroicons/solid";
import { Stepper } from "~/components/custom/Stepper";

export default function Step7ReminderTime() {
  const {
    medicationName,
    medicationType,
    whenToTake,
    interval,
    specificDaysOfWeek,
    timesPerDay,
    startDate,
    endDate,
  } = useLocalSearchParams();
  const times = parseInt(timesPerDay as string, 10) || 1;
  const [currentIndex, setCurrentIndex] = useState(0);
  const [reminderTimes, setReminderTimes] = useState<Date[]>(
    Array(times)
      .fill(null)
      .map(() => new Date())
  );

  const questionOpacity = useRef(new Animated.Value(1)).current;

  if (
    Platform.OS === "android" &&
    UIManager.setLayoutAnimationEnabledExperimental
  ) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
  }

  return (
    <View className="flex-1">
      <SafeAreaView>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
          <View className="p-8">
            <View className="flex-row justify-between items-center">
              <ChevronLeftIcon
                size={32}
                color="black"
                onPress={() => router.back()}
                className="mb-6"
              />
              <View className="flex-1 items-center -ml-8">
                <Stepper totalSteps={7} currentStep={7} />
              </View>
            </View>
            <Animated.View
              style={{
                opacity: questionOpacity,
              }}
            >
              <Text className="text-2xl font-semibold mt-10">
                What times should we remind you?
              </Text>
            </Animated.View>
          </View>
        </TouchableWithoutFeedback>
      </SafeAreaView>

      <View
        className="flex-1 bg-white p-8 shadow-sm justify-center items-center"
        style={{
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          backgroundColor: "white",
          shadowColor: "#000",
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.05,
          shadowRadius: 12,
          elevation: 8,
        }}
      >
        <View className="flex-1 w-full justify-center items-center">
          <View className="mb-8 items-center w-full">
            <Text className="mb-4 font-semibold text-lg text-center">
              {times > 1
                ? `Dose ${currentIndex + 1} of ${times}`
                : "Time to take"}
            </Text>
            <DateTimePicker
              value={reminderTimes[currentIndex] ?? new Date()}
              mode="time"
              display={Platform.OS === "ios" ? "spinner" : "clock"}
              onChange={(event, date) => {
                if (date) {
                  const updated = [...reminderTimes];
                  updated[currentIndex] = date;
                  setReminderTimes(updated);
                }
              }}
            />
          </View>
        </View>

        <Button
          className="mt-6 w-full py-4"
          onPress={() => {
            const selected = reminderTimes[currentIndex] ?? new Date();
            const updated = [...reminderTimes];
            updated[currentIndex] = selected;
            setReminderTimes(updated);

            if (currentIndex < times - 1) {
              setCurrentIndex((prev) => prev + 1);
            } else {
              router.push({
                pathname: "/addNewMedication/confirmStep",
                params: {
                  medicationName,
                  medicationType,
                  whenToTake,
                  interval,
                  specificDaysOfWeek,
                  timesPerDay,
                  startDate,
                  endDate,
                  reminderTimes: JSON.stringify(
                    reminderTimes.map(
                      (t) =>
                        t.getHours().toString().padStart(2, "0") +
                        ":" +
                        t.getMinutes().toString().padStart(2, "0")
                    )
                  ),
                },
              });
            }
          }}
        >
          <Text className="text-lg">NEXT</Text>
        </Button>
      </View>
    </View>
  );
}
