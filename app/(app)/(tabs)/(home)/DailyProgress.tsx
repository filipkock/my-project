import { useLocalSearchParams, router } from "expo-router";
import { View } from "react-native";
import { AnimatedCircularProgress } from "react-native-circular-progress";
import { Button } from "~/components/ui/button";
import { Text } from "~/components/ui/text";

export default function DailyProgress() {
  const { taken, total } = useLocalSearchParams();

  const takenCount = Number(taken);
  const totalCount = Number(total);
  const percent = (takenCount / totalCount) * 100;

  return (
    <View className="flex-1 justify-center items-center bg-white p-6">
      <AnimatedCircularProgress
        size={180}
        width={12}
        fill={percent}
        tintColor="#4ade80"
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
  );
}
