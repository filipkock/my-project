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
import { useState, useRef } from "react";
import { ChevronLeft } from "~/lib/icons/ChevronLeft";

export default function Step6EndDate() {
  const { medicationName, medicationType, whenToTake, interval, startDate } =
    useLocalSearchParams();
  const [endDate, setEndDate] = useState(new Date());

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
            />
            <Animated.View
              style={{
                opacity: questionOpacity,
                height: questionHeight,
                overflow: "hidden",
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
        className="flex-1 bg-white p-8 shadow-sm"
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
        <Text className="mb-2 font-semibold">End date</Text>
        <DateTimePicker
          value={endDate}
          mode="date"
          display="spinner"
          onChange={(event, date) => date && setEndDate(date)}
        />

        <Button
          className="mt-6"
          onPress={() =>
            router.push({
              pathname: "/addNewMedication/confirmStep",
              params: {
                medicationName,
                medicationType,
                whenToTake,
                interval,
                startDate,
                endDate: endDate.toISOString(),
              },
            })
          }
        >
          <Text>Next</Text>
        </Button>
      </View>
    </View>
  );
}
