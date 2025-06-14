import React from "react";
import { View } from "react-native";
import { Text } from "~/components/ui/text";
import { FireIcon } from "react-native-heroicons/solid";

interface StreakDisplayProps {
  streak: number;
}

export default function StreakDisplay({ streak }: StreakDisplayProps) {
  return (
    <View className="absolute top-0 left-8 z-10 flex flex-row">
      <FireIcon size={24} color="black" />
      <Text className="text-lg font-semibold text-gray-800"> {streak}</Text>
    </View>
  );
}
