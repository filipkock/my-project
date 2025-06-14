import React from "react";
import { View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Text } from "~/components/ui/text";
import { Button } from "~/components/ui/button";
import { useRouter } from "expo-router";

export default function Reward() {
  const router = useRouter();

  const handleGoHome = () => {
    router.replace("/(app)/(tabs)/(home)");
  };

  return (
    <SafeAreaView className="flex-1 bg-white justify-center items-center p-6">
      <View className="items-center">
        <Text className="text-4xl font-bold text-primary mb-4">🎉</Text>
        <Text className="text-2xl font-semibold text-center text-gray-900 mb-2">
          You earned a reward!
        </Text>
        <Text className="text-base text-center text-gray-600 mb-8">
          Great job staying on track with your medication! Keep it up to earn
          even more rewards.
        </Text>
        <Button onPress={handleGoHome}>
          <Text className="text-white font-medium">Back to Home</Text>
        </Button>
      </View>
    </SafeAreaView>
  );
}
