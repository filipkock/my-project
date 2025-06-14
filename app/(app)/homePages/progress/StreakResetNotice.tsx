import { View } from "react-native";
import { Text } from "~/components/ui/text";
import { Button } from "~/components/ui/button";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";

export default function StreakResetNotice() {
  return (
    <SafeAreaView className="flex-1 bg-white justify-center items-center px-6">
      <Text className="text-3xl font-bold text-red-600 text-center mb-4">
        Streak Reset 🔁
      </Text>
      <Text className="text-lg text-center text-gray-700 mb-8">
        You missed logging all your medications for a day, so your streak has
        been reset. Don’t worry — today’s a fresh start! Let’s get back on
        track.
      </Text>
      <Button onPress={() => router.replace("/(app)/(tabs)/(home)")}>
        <Text className="text-white font-semibold">Back to Home</Text>
      </Button>
    </SafeAreaView>
  );
}
