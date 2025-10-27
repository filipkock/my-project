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

export default function Step5StartDate() {
  const {
    medicationName,
    medicationType,
    interval,
    specificDaysOfWeek,
    customIntervalValue,
    timesPerDay,
  } = useLocalSearchParams();
  const [startDate, setStartDate] = useState(new Date());
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
              <Stepper totalSteps={8} currentStep={5} />
            </View>
          </View>
          <Animated.View
            style={{
              opacity: questionOpacity,
            }}
          >
            <Text className="text-2xl font-semibold mt-10">
              When do you start this medication?
            </Text>
          </Animated.View>
        </View>
      </TouchableWithoutFeedback>

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
            {Platform.OS === "ios" ? (
              <DateTimePicker
                value={startDate}
                mode="date"
                display="spinner"
                minimumDate={new Date()}
                onChange={(event, date) => date && setStartDate(date)}
              />
            ) : (
              <>
                <Button
                  variant="outline"
                  onPress={() => setShowAndroidPicker(true)}
                  size="lg"
                >
                  <Text className="font-bold">{startDate.toDateString()}</Text>
                </Button>
                {showAndroidPicker && (
                  <DateTimePicker
                    value={startDate}
                    mode="date"
                    display="calendar"
                    minimumDate={new Date()}
                    onChange={(event, date) => {
                      setShowAndroidPicker(false);
                      if (date) {
                        setStartDate(date);
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
          onPress={() =>
            router.push({
              pathname: "/addNewMedication/step6",
              params: {
                medicationName,
                medicationType,
                interval,
                specificDaysOfWeek,
                customIntervalValue,
                timesPerDay,
                startDate: startDate.toISOString(),
              },
            })
          }
        >
          <Text className="text-lg">NEXT</Text>
        </Button>
      </View>
    </View>
  );
}
