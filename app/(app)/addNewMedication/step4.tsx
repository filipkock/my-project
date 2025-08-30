// app/(app)/addNewMedication/step4.tsx
import React, { useState, useRef } from "react";
import {
  View,
  SafeAreaView,
  TouchableOpacity,
  Keyboard,
  TouchableWithoutFeedback,
  Animated,
  Platform,
  UIManager,
  ScrollView,
} from "react-native";
import { Text } from "~/components/ui/text";
import { router, useLocalSearchParams } from "expo-router";
import { ChevronLeftIcon } from "react-native-heroicons/solid";
import { ChevronRight } from "~/lib/icons/ChevronRight";
import { Button } from "~/components/ui/button";
import { DaySelector } from "~/components/custom/DaySelector";
import { Stepper } from "~/components/custom/Stepper";
import { Label } from "~/components/ui/label";
import { Input } from "~/components/ui/input";
import { intervalToTakeList } from "~/src/constants/addMedicationOptions";

export default function Step4() {
  const { medicationName, medicationType, whenToTake } = useLocalSearchParams();
  const [interval, setInterval] = useState("");
  // Add specificDays and showDaySelector state hooks
  const [specificDays, setSpecificDays] = useState<number[]>([]);
  const [showDaySelector, setShowDaySelector] = useState(false);
  const [showIntervalSelector, setShowIntervalSelector] = useState(false);
  const [customIntervalValue, setCustomIntervalValue] = useState("");

  const questionOpacity = useRef(new Animated.Value(1)).current;

  if (
    Platform.OS === "android" &&
    UIManager.setLayoutAnimationEnabledExperimental
  ) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
  }

  const toggleDay = (dayIndex: number) => {
    setSpecificDays((prev) =>
      prev.includes(dayIndex)
        ? prev.filter((d) => d !== dayIndex)
        : [...prev, dayIndex]
    );
  };

  const handleSelect = (option: string) => {
    setInterval(option);
    Keyboard.dismiss();
    if (option === "Specific days weekly") {
      setShowDaySelector(true);
      setShowIntervalSelector(false);
    } else if (
      option === "every X days" ||
      option === "every X weeks" ||
      option === "every X months"
    ) {
      setShowIntervalSelector(true);
      setShowDaySelector(false);
    } else {
      setShowIntervalSelector(false);
      setShowDaySelector(false);
      router.push({
        pathname: "/addNewMedication/step4.1",
        params: {
          medicationName,
          medicationType,
          whenToTake,
          interval: option,
        },
      });
    }
  };

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
                <Stepper totalSteps={9} currentStep={4} />
              </View>
            </View>
            <Animated.View
              style={{
                opacity: questionOpacity,
              }}
            >
              <Text className="text-2xl font-semibold mt-10">
                How often do you take this medication?
              </Text>
            </Animated.View>
          </View>
        </TouchableWithoutFeedback>
      </SafeAreaView>

      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
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
          <ScrollView
            className="flex-1 w-full"
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {intervalToTakeList.map((option) => (
              <TouchableOpacity
                key={option}
                onPress={() => handleSelect(option)}
                className="py-4 flex-row justify-between items-center border-b border-gray-200 px-2 mb-2"
                style={{
                  minHeight: 56,
                  width: "100%",
                  borderRadius: 12,
                  backgroundColor: interval === option ? "#f3f4f6" : "#fff",
                }}
              >
                <Text className="text-lg">{option}</Text>
                <ChevronRight size={28} color="black" />
              </TouchableOpacity>
            ))}

            {showDaySelector && (
              <>
                <DaySelector
                  selectedDays={specificDays}
                  onToggleDay={toggleDay}
                />
                <Button
                  className="mt-auto w-full"
                  onPress={() => {
                    router.push({
                      pathname: "/addNewMedication/step4.1",
                      params: {
                        medicationName,
                        medicationType,
                        whenToTake,
                        interval,
                        specificDaysOfWeek: specificDays.join(","),
                      },
                    });
                  }}
                >
                  <Text className="text-white text-center font-semibold ">
                    NEXT
                  </Text>
                </Button>
              </>
            )}

            {["every X days", "every X weeks", "every X months"].includes(
              interval
            ) && (
              <>
                <Label className="mt-5 mb-2">Enter X (number)</Label>
                <Input
                  keyboardType="numeric"
                  placeholder="Input custom interval value"
                  value={customIntervalValue}
                  className="border w-full mb-4"
                  onChangeText={(value) => {
                    const numericValue = value.replace(/[^0-9]/g, "");
                    setCustomIntervalValue(numericValue);
                  }}
                />
                <Button
                  className="mt-auto w-full"
                  onPress={() => {
                    router.push({
                      pathname: "/addNewMedication/step4.1",
                      params: {
                        medicationName,
                        medicationType,
                        whenToTake,
                        interval,
                        specificDaysOfWeek: specificDays.join(","),
                        customIntervalValue: customIntervalValue || "1",
                      },
                    });
                  }}
                >
                  <Text className="text-white text-center font-semibold ">
                    NEXT
                  </Text>
                </Button>
              </>
            )}
          </ScrollView>
        </View>
      </TouchableWithoutFeedback>
    </View>
  );
}
