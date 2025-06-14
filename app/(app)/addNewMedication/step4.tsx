// app/(app)/addNewMedication/step4.tsx
import {
  View,
  TouchableOpacity,
  Animated,
  Platform,
  UIManager,
  Keyboard,
  TouchableWithoutFeedback,
} from "react-native";
import { useEffect, useRef, useState } from "react";
import { Button } from "~/components/ui/button";
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
  const [isInputFocused, setIsInputFocused] = useState(false);
  const questionOpacity = useRef(new Animated.Value(1)).current;
  const questionHeight = useRef(new Animated.Value(60)).current;

  useEffect(() => {
    if (
      Platform.OS === "android" &&
      UIManager.setLayoutAnimationEnabledExperimental
    ) {
      UIManager.setLayoutAnimationEnabledExperimental(true);
    }
  }, []);

  const handleSelect = (interval: string) => {
    Keyboard.dismiss();
    router.push({
      pathname: "/addNewMedication/step5",
      params: {
        medicationName,
        medicationType,
        whenToTake,
        interval,
      },
    });
  };

  return (
    <View className="flex-1">
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <View className="p-8">
          <ChevronLeft
            size={32}
            color="black"
            onPress={() =>
              router.push({
                pathname: "/addNewMedication/step3",
                params: {
                  medicationName,
                  medicationType,
                  whenToTake,
                },
              })
            }
          />
          <Animated.View
            style={{
              opacity: questionOpacity,
              height: questionHeight,
              overflow: "hidden",
            }}
          >
            <Text className="text-2xl font-semibold mt-10">
              How often do you take it?
            </Text>
          </Animated.View>
        </View>
      </TouchableWithoutFeedback>

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
        {IntervalList.map((item) => (
          <TouchableOpacity
            key={item}
            onPress={() => handleSelect(item)}
            className="py-3 flex-row justify-between items-center border-b border-gray-200"
          >
            <Text>{item}</Text>
            <ChevronRight size={20} />
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}
