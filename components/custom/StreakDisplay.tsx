import React from 'react';
import { View, Text } from 'react-native';

interface StreakDisplayProps {
  streak: number;
}

export default function StreakDisplay({ streak }: StreakDisplayProps) {
  return (
    <View className="absolute top-4 left-4 z-10 bg-white/90 rounded-full px-4 py-2 shadow-sm">
      <Text className="text-lg font-semibold text-gray-800">
        🔥 Streak: {streak}
      </Text>
    </View>
  );
} 