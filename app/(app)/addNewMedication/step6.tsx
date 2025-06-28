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

export default function Step6EndDate() {
  const { medicationName, medicationType, whenToTake, interval, startDate } =
    useLocalSearchParams();
  const [endDate, setEndDate] = useState<Date | null>(new Date());

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
            <ChevronLeft
              size={32}
              color="black"
              onPress={() => router.back()}
              className="mb-6"
            />
            <Animated.View
              style={{
                opacity: questionOpacity,
              }}
            >
              <Text className="text-2xl font-semibold mt-10">
                When do you stop this medication?
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
          <Text className="mb-10 font-semibold text-lg text-center">
            End date
          </Text>
          <View
            style={{
              alignItems: "center",
              justifyContent: "center",
              width: "100%",
            }}
          >
            <DateTimePicker
              value={endDate ?? new Date()}
              mode="date"
              display={Platform.OS === "ios" ? "spinner" : "calendar"}
              onChange={(event, date) => setEndDate(date ?? endDate)}
              style={{ width: 250, height: 120, transform: [{ scale: 1.3 }] }}
            />
          </View>
        </View>

        <Button
          className="mt-4 w-full"
          variant="outline"
          onPress={() =>
            router.push({
              pathname: "/addNewMedication/step7",
              params: {
                medicationName,
                medicationType,
                whenToTake,
                interval,
                startDate,
                endDate: "",
              },
            })
          }
        >
          <Text>No end date (take forever)</Text>
        </Button>

        <Button
          className="mt-6 w-full py-4"
          onPress={() =>
            router.push({
              pathname: "/addNewMedication/step7",
              params: {
                medicationName,
                medicationType,
                whenToTake,
                interval,
                startDate,
                ...(endDate
                  ? { endDate: endDate.toISOString() }
                  : { endDate: "" }),
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
