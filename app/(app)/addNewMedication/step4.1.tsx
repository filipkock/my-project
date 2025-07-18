import React, { useRef } from "react";
import {
  View,
  SafeAreaView,
  TouchableOpacity,
  Keyboard,
  TouchableWithoutFeedback,
  Animated,
  Platform,
  UIManager,
} from "react-native";
import { Text } from "~/components/ui/text";
import { router, useLocalSearchParams } from "expo-router";
import { ChevronLeftIcon } from "react-native-heroicons/solid";
import { ChevronRight } from "~/lib/icons/ChevronRight";
import { Stepper } from "~/components/custom/Stepper";

const FrequencyList = [
  "Once a day",
  "Twice a day",
  "Three times a day",
  "Four times a day",
  "Five times a day",
  "Six times a day",
];

export default function Step4_1() {
  const {
    medicationName,
    medicationType,
    whenToTake,
    interval,
    specificDaysOfWeek,
    customIntervalValue,
  } = useLocalSearchParams();
  const questionOpacity = useRef(new Animated.Value(1)).current;

  if (
    Platform.OS === "android" &&
    UIManager.setLayoutAnimationEnabledExperimental
  ) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
  }

  const handleSelect = (index: number) => {
    const timesPerDay = (index + 1).toString();
    Keyboard.dismiss();
    router.push({
      pathname: "/addNewMedication/step5",
      params: {
        medicationName,
        medicationType,
        whenToTake,
        interval,
        specificDaysOfWeek,
        customIntervalValue,
        timesPerDay,
      },
    });
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
                <Stepper totalSteps={7} currentStep={4} />
              </View>
            </View>
            <Animated.View
              style={{
                opacity: questionOpacity,
              }}
            >
              <Text className="text-2xl font-semibold mt-10">
                How many times a day do you take it?
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
        <View className="flex-1 w-full justify-start items-center">
          {FrequencyList.map((option, index) => (
            <TouchableOpacity
              key={option}
              onPress={() => handleSelect(index)}
              className="py-4 flex-row justify-between items-center border-b border-gray-200 px-2 mb-2 min-h-[56px] w-full rounded-xl bg-white"
            >
              <Text className="text-lg">{option}</Text>
              <ChevronRight size={28} color="black" />
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );
}
