import React from "react";
import { View } from "react-native";
import { Text } from "~/components/ui/text";

interface StreakDisplayProps {
  streak: number;
}

export default function StreakDisplay({ streak }: StreakDisplayProps) {
  return (
    <View className="absolute top-0 left-8 z-10">
      <Text className="text-lg font-semibold text-gray-800">🔥 {streak}</Text>
    </View>
  );
}
