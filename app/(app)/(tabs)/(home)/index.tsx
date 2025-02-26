import React from "react";
import { SafeAreaView, View } from "react-native";
import MedicationList from "~/components/custom/medicationList";

export default function Screen() {
  return (
    <SafeAreaView className="flex-1 bg-secondary/30">
      <View className="flex-1 w-full">
        <MedicationList />
      </View>
    </SafeAreaView>
  );
}
