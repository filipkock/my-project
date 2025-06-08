import { useLocalSearchParams, router } from "expo-router";
import { View } from "react-native";
import { AnimatedCircularProgress } from "react-native-circular-progress";
import { Button } from "~/components/ui/button";
import { Text } from "~/components/ui/text";
import { useTheme } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function DailyProgress() {
  const { taken, total } = useLocalSearchParams();

  const takenCount = Number(taken);
  const totalCount = Number(total);
  const percent = (takenCount / totalCount) * 100;

  const { colors } = useTheme();

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top"]}>
      <View className="flex-1 justify-start items-center pt-20 p-6">
        <AnimatedCircularProgress
          size={180}
          width={12}
          fill={percent}
          tintColor={colors.primary}
          backgroundColor="#e5e7eb"
          duration={800}
        >
          {() => (
            <Text className="text-xl font-bold">
              {takenCount} / {totalCount}
            </Text>
          )}
        </AnimatedCircularProgress>

        <Text className="mt-6 text-xl font-semibold">
          {takenCount === totalCount
            ? "🎉 All done for today! Great job!"
            : "✅ Nice! Keep going!"}
        </Text>

        <Button
          className="mt-6"
          onPress={() => router.replace("/(app)/(tabs)/(home)")}
        >
          <Text> Back to Home</Text>
        </Button>
      </View>
    </SafeAreaView>
  );
}
