import React, { useState, useRef, useEffect } from "react";
import {
  View,
  TouchableOpacity,
  Keyboard,
  TouchableWithoutFeedback,
  Animated,
  Platform,
  UIManager,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Text } from "~/components/ui/text";
import { router, useLocalSearchParams } from "expo-router";
import { ChevronLeftIcon } from "react-native-heroicons/solid";
import { ChevronRight } from "~/lib/icons/ChevronRight";
import { TypeList } from "~/src/constants/addMedicationOptions";
import { Stepper } from "~/components/custom/Stepper";

export default function Step2() {
  const { medicationName } = useLocalSearchParams();
  const [medicationType, setMedicationType] = useState("");

  const questionOpacity = useRef(new Animated.Value(1)).current;

  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
      UIManager.setLayoutAnimationEnabledExperimental(true);
    }
  }, []);

  const handleSelect = (option: string) => {
    setMedicationType(option);
    Keyboard.dismiss();
    router.push({
      pathname: "/addNewMedication/step4",
      params: { medicationName, medicationType: option },
    });
  };

  return (
    <View
      className="flex-1"
      style={{ paddingTop: insets.top, paddingLeft: insets.left, paddingRight: insets.right }}
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
              <Stepper totalSteps={8} currentStep={2} />
            </View>
          </View>
          <Animated.View
            style={{
              opacity: questionOpacity,
            }}
          >
            <Text className="text-2xl font-semibold mt-10">
              What type of medication is it?
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
        <View className="flex-1 w-full justify-start items-center">
          {TypeList.map((option) => (
            <TouchableOpacity
              key={option}
              onPress={() => handleSelect(option)}
              className="py-4 flex-row justify-between items-center border-b border-gray-200 px-2 mb-2"
              style={{
                minHeight: 56,
                width: "100%",
                borderRadius: 12,
                backgroundColor: medicationType === option ? "#f3f4f6" : "#fff",
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
