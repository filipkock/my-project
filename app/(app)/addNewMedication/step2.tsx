import {
  View,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  Keyboard,
  TouchableWithoutFeedback,
  Animated,
  Platform,
  UIManager,
} from "react-native";
import { Text } from "~/components/ui/text";
import { router, useLocalSearchParams } from "expo-router";
import { useState, useRef } from "react";
import { ChevronLeft } from "~/lib/icons/ChevronLeft";
import { ChevronRight } from "~/lib/icons/ChevronRight";
import { TypeList } from "~/src/constants/addMedicationOptions";

export default function Step2() {
  const { medicationName } = useLocalSearchParams();
  const [medicationType, setMedicationType] = useState("");

  const questionOpacity = useRef(new Animated.Value(1)).current;
  const questionHeight = useRef(new Animated.Value(60)).current;

  if (
    Platform.OS === "android" &&
    UIManager.setLayoutAnimationEnabledExperimental
  ) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
  }

  const handleSelect = (option: string) => {
    setMedicationType(option);
    Keyboard.dismiss();
    router.push({
      pathname: "/addNewMedication/step3",
      params: { medicationName, medicationType: option },
    });
  };

  return (
    <View className="flex-1">
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <SafeAreaView>
          <View className="p-8">
            <ChevronLeft
              size={32}
              color="black"
              onPress={() =>
                router.push({
                  pathname: "/addNewMedication/step1",
                  params: { medicationName },
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
                What type is the medication?
              </Text>
            </Animated.View>
          </View>
        </SafeAreaView>
      </TouchableWithoutFeedback>

      <Animated.View
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
        <FlatList
          data={TypeList}
          keyboardShouldPersistTaps="handled"
          keyExtractor={(item) => item}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => handleSelect(item)}
              className="py-3 flex-row justify-between items-center border-b border-gray-200"
            >
              <Text>{item}</Text>
              <ChevronRight size={20} />
            </TouchableOpacity>
          )}
        />
      </Animated.View>
    </View>
  );
}
