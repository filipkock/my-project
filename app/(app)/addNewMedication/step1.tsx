import {
  View,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  Keyboard,
  TouchableWithoutFeedback,
  Animated,
  LayoutAnimation,
  Platform,
  UIManager,
} from "react-native";
import { Input } from "~/components/ui/input";
import { Text } from "~/components/ui/text";
import { router } from "expo-router";
import { useState, useRef } from "react";
import { XMarkIcon } from "react-native-heroicons/solid";
import { ChevronRight } from "~/lib/icons/ChevronRight";
import { medicationSuggestions } from "~/src/constants/medicationSuggestions";

export default function Step1() {
  const [medicationName, setMedicationName] = useState("");
  const [filteredOptions, setFilteredOptions] = useState<string[]>([]);
  const [isInputFocused, setIsInputFocused] = useState(false);

  const questionOpacity = useRef(new Animated.Value(1)).current;
  const questionHeight = useRef(new Animated.Value(60)).current;

  if (
    Platform.OS === "android" &&
    UIManager.setLayoutAnimationEnabledExperimental
  ) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
  }

  const handleInputChange = (text: string) => {
    setMedicationName(text);
    setIsInputFocused(true);

    if (!text.trim()) {
      setFilteredOptions([]);
      return;
    }

    const filtered = medicationSuggestions.filter((med) =>
      med.toLowerCase().includes(text.toLowerCase())
    );

    const uniqueOptions = [
      text,
      ...filtered.filter((m) => m.toLowerCase() !== text.toLowerCase()),
    ];

    setFilteredOptions(uniqueOptions);
  };

  const handleSelect = (option: string) => {
    setMedicationName(option);
    setFilteredOptions([]);
    Keyboard.dismiss();
    router.push({
      pathname: "/addNewMedication/step2",
      params: { medicationName: option },
    });
  };

  return (
    <View className="flex-1">
      <SafeAreaView>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
          <View className="p-8">
            <XMarkIcon
              size={32}
              color="black"
              onPress={() => router.push("/(app)/(tabs)/(medications)")}
            />
            <Animated.View
              style={{
                opacity: questionOpacity,
                height: questionHeight,
                overflow: "hidden",
              }}
            >
              <Text className="text-2xl font-semibold mt-10">
                What medication are you taking?
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
        <Input
          placeholder="Enter medication name"
          value={medicationName}
          className="border border-gray-300"
          onFocus={() => {
            Animated.parallel([
              Animated.timing(questionOpacity, {
                toValue: 0,
                duration: 200,
                useNativeDriver: false,
              }),
              Animated.timing(questionHeight, {
                toValue: 0,
                duration: 200,
                useNativeDriver: false,
              }),
            ]).start();
            setIsInputFocused(true);
          }}
          onBlur={() => {
            Animated.parallel([
              Animated.timing(questionOpacity, {
                toValue: 1,
                duration: 200,
                useNativeDriver: false,
              }),
              Animated.timing(questionHeight, {
                toValue: 60,
                duration: 200,
                useNativeDriver: false,
              }),
            ]).start();
            setIsInputFocused(false);
          }}
          onChangeText={handleInputChange}
        />

        {filteredOptions.length === 0 && (
          <View className="mt-4">
            <Text className="text-gray-500">
              Start typing to see suggestions.
            </Text>
          </View>
        )}

        <FlatList
          data={filteredOptions}
          keyboardShouldPersistTaps="handled"
          keyExtractor={(item) => item}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => handleSelect(item)}
              className="py-3 flex-row justify-between items-center border-b border-gray-200"
            >
              <Text>{item}</Text>
              <ChevronRight size={20} color="black" />
            </TouchableOpacity>
          )}
        />
      </View>
    </View>
  );
}
