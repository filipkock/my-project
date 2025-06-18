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
import { ChevronLeft } from "~/lib/icons/ChevronLeft";

export default function Step5StartDate() {
  const { medicationName, medicationType, whenToTake, interval } =
    useLocalSearchParams();
  const [startDate, setStartDate] = useState(new Date());

  const questionOpacity = useRef(new Animated.Value(1)).current;
  const questionHeight = useRef(new Animated.Value(60)).current;

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
                When do you start this medication?
              </Text>
            </Animated.View>
          </View>
        </TouchableWithoutFeedback>
      </SafeAreaView>

      <View
        className="flex-1 bg-white p-8 shadow-sm justify-start items-center"
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
          <Text className="mb-10 font-semibold text-lg">Start date</Text>
          <View
            style={{
              alignItems: "center",
              justifyContent: "center",
              width: "100%",
            }}
          >
            <DateTimePicker
              value={startDate}
              mode="date"
              display={Platform.OS === "ios" ? "spinner" : "calendar"}
              onChange={(event, date) => date && setStartDate(date)}
              style={{ width: 250, height: 120, transform: [{ scale: 1.3 }] }}
            />
          </View>
        </View>

        <Button
          className="mt-6 w-full py-4"
          onPress={() =>
            router.push({
              pathname: "/addNewMedication/step6",
              params: {
                medicationName,
                medicationType,
                whenToTake,
                interval,
                startDate: startDate.toISOString(),
              },
            })
          }
        >
          <Text className="text-lg">Next</Text>
        </Button>
      </View>
    </View>
  );
}
