import React, { useState, useRef, useEffect } from "react";
import {
  View,
  TouchableWithoutFeedback,
  Keyboard,
  Animated,
  Platform,
  UIManager,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
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
    interval,
    specificDaysOfWeek,
    customIntervalValue,
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
  const [showAndroidPicker, setShowAndroidPicker] = useState(false);

  const questionOpacity = useRef(new Animated.Value(1)).current;

  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (
      Platform.OS === "android" &&
      UIManager.setLayoutAnimationEnabledExperimental
    ) {
      UIManager.setLayoutAnimationEnabledExperimental(true);
    }
  }, []);

  return (
    <View
      className="flex-1"
      style={{
        paddingTop: insets.top,
        paddingLeft: insets.left,
        paddingRight: insets.right,
      }}
    >
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
              <Stepper totalSteps={8} currentStep={7} />
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
            {Platform.OS === "ios" ? (
              <DateTimePicker
                value={reminderTimes[currentIndex] ?? new Date()}
                mode="time"
                display="spinner"
                onChange={(event, date) => {
                  if (date) {
                    const updated = [...reminderTimes];
                    updated[currentIndex] = date;
                    setReminderTimes(updated);
                  }
                }}
              />
            ) : (
              <>
                <Button
                  variant="outline"
                  onPress={() => setShowAndroidPicker(true)}
                  size="lg"
                >
                  <Text className="font-bold">
                    {reminderTimes[currentIndex]?.toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                      hour12: false,
                    })}
                  </Text>
                </Button>
                {showAndroidPicker && (
                  <DateTimePicker
                    value={reminderTimes[currentIndex] ?? new Date()}
                    mode="time"
                    display="clock"
                    onChange={(event, date) => {
                      setShowAndroidPicker(false);
                      if (date) {
                        const updated = [...reminderTimes];
                        updated[currentIndex] = date;
                        setReminderTimes(updated);
                      }
                    }}
                  />
                )}
              </>
            )}
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
                  interval,
                  specificDaysOfWeek,
                  customIntervalValue,
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
