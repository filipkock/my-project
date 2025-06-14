import {
  View,
  Platform,
  UIManager,
  SafeAreaView,
  TouchableWithoutFeedback,
  Keyboard,
  TouchableOpacity,
} from "react-native";
import { SelectContent, SelectGroup, SelectItem } from "~/components/ui/select";
import { Button } from "~/components/ui/button";
import { Text } from "~/components/ui/text";
import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { WhenToTakeList } from "~/src/constants/addMedicationOptions";
import { ChevronLeft } from "~/lib/icons/ChevronLeft";
import { ChevronRight } from "~/lib/icons/ChevronRight";

export default function Step3() {
  const { medicationName, medicationType } = useLocalSearchParams();
  const [whenToTake, setWhenToTake] = useState("");

  const handleSelect = (option: string) => {
    setWhenToTake(option);
    Keyboard.dismiss();
    router.push({
      pathname: "/addNewMedication/step4",
      params: {
        medicationName,
        medicationType,
        whenToTake: option,
      },
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
            />
            <View style={{ overflow: "hidden" }}>
              <Text className="text-2xl font-semibold mt-10">
                When do you take it?
              </Text>
            </View>
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
        <View className="mt-2">
          {WhenToTakeList.map((item) => (
            <TouchableOpacity
              key={item}
              onPress={() => handleSelect(item)}
              style={{
                paddingVertical: 14,
                borderBottomWidth: 1,
                borderBottomColor: "#eee",
                flexDirection: "row",
                justifyContent: "space-between",
              }}
            >
              <Text>{item}</Text>
              <ChevronRight size={20} />
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );
}
