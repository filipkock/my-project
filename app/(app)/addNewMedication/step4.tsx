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
} from "react-native";
import { Text } from "~/components/ui/text";
import { router, useLocalSearchParams } from "expo-router";
import { ChevronLeft } from "~/lib/icons/ChevronLeft";
import { ChevronRight } from "~/lib/icons/ChevronRight";

const IntervalList = [
  "Every day",
  "Every other day",
  "Every 3 days",
  "Specific days of the week",
];

export default function Step4() {
  const { medicationName, medicationType, whenToTake } = useLocalSearchParams();
  const [interval, setInterval] = useState("");

  const questionOpacity = useRef(new Animated.Value(1)).current;
  const questionHeight = useRef(new Animated.Value(60)).current;

  if (
    Platform.OS === "android" &&
    UIManager.setLayoutAnimationEnabledExperimental
  ) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
  }

  const handleSelect = (option: string) => {
    setInterval(option);
    Keyboard.dismiss();
    router.push({
      pathname: "/addNewMedication/step5",
      params: { medicationName, medicationType, whenToTake, interval: option },
    });
  };

  return (
    <View className="flex-1">
      <SafeAreaView>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
          <View className="p-8">
            <ChevronLeft
              size={32}
              color="black"
              onPress={() => router.back()}
              className="mb-6"
            />
            <Animated.View
              style={{
                opacity: questionOpacity,
                height: questionHeight,
                overflow: "hidden",
              }}
            >
              <Text className="text-2xl font-semibold mt-10">
                How often do you take this medication?
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
          {IntervalList.map((option) => (
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
        </View>
      </View>
    </View>
  );
}
