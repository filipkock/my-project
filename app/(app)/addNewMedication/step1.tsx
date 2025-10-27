import React, { useState, useRef, useEffect } from "react";
import {
  View,
  FlatList,
  TouchableOpacity,
  Keyboard,
  TouchableWithoutFeedback,
  Animated,
  LayoutAnimation,
  Platform,
  UIManager,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Input } from "~/components/ui/input";
import { Text } from "~/components/ui/text";
import { router } from "expo-router";
import { XMarkIcon } from "react-native-heroicons/solid";
import { ChevronRight } from "~/lib/icons/ChevronRight";
import { medicationSuggestions } from "~/src/constants/medicationSuggestions";
import { Stepper } from "~/components/custom/Stepper";

export default function Step1() {
  const [medicationName, setMedicationName] = useState("");
  const [filteredOptions, setFilteredOptions] = useState<string[]>([]);
  const [isInputFocused, setIsInputFocused] = useState(false);

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
            <XMarkIcon
              size={32}
              color="black"
              onPress={() => {
                if (router.canGoBack()) {
                  router.back();
                } else {
                  router.replace("/");
                }
              }}
              className="mb-6"
            />
            <View className="flex-1 items-center -ml-8">
              <Stepper totalSteps={8} currentStep={1} />
            </View>
          </View>
          <Text className="text-2xl font-semibold mt-10">
            What medication do you want to add?
          </Text>
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
        <View className="flex-1 w-full justify-center items-center">
          <Input
            placeholder="Enter medication name"
            value={medicationName}
            className="border border-gray-300 text-xl py-6 px-6 rounded-3fxl mb-4 w-full"
            style={{ minHeight: 64 }}
            onFocus={() => {
              Animated.timing(questionOpacity, {
                toValue: 0,
                duration: 200,
                useNativeDriver: false,
              }).start();
              setIsInputFocused(true);
            }}
            onBlur={() => {
              Animated.timing(questionOpacity, {
                toValue: 1,
                duration: 200,
                useNativeDriver: false,
              }).start();
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
                className="py-4 flex-row justify-between items-center border-b border-gray-200 px-2"
                style={{ minHeight: 56 }}
              >
                <Text className="text-lg">{item}</Text>
                <ChevronRight size={28} color="black" />
              </TouchableOpacity>
            )}
            style={{ width: "100%" }}
          />
        </View>
      </View>
    </View>
  );
}
