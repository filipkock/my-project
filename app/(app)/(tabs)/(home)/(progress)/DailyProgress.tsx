import { useLocalSearchParams, router } from "expo-router";
import { View, Animated } from "react-native";
import { useRef, useEffect, useState } from "react";
import { AnimatedCircularProgress } from "react-native-circular-progress";
import { Button } from "~/components/ui/button";
import { Text } from "~/components/ui/text";
import { useTheme } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";
import { getFromStorage } from "~/src/services/storage";
import { getStreakFromFirestore } from "~/src/utils/streak";

export default function DailyProgress() {
  const { taken, total } = useLocalSearchParams();

  const takenCount = Number(taken);
  const totalCount = Number(total);
  const percent = (takenCount / totalCount) * 100;

  const { colors } = useTheme();

  const scale = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  const [streak, setStreak] = useState<number | null>(null);

  useEffect(() => {
    if (takenCount === totalCount) {
      Animated.parallel([
        Animated.spring(scale, {
          toValue: 1,
          useNativeDriver: true,
          friction: 4,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
      ]).start();
    }

    const fetchStreak = async () => {
      const userinfo = await getFromStorage("userDetails");
      if (userinfo) {
        const currentStreak = await getStreakFromFirestore(userinfo.uid);
        setStreak(currentStreak);
      }
    };
    fetchStreak();
  }, [takenCount, totalCount]);

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

        {streak !== null && (
          <Text className="mt-2 text-base text-gray-500">
            Current Streak: {streak} 🔥
          </Text>
        )}

        <Text className="mt-6 text-xl font-semibold">
          {takenCount === totalCount
            ? "🎉 All done for today! Great job!"
            : "✅ Nice! Keep going!"}
        </Text>

        {takenCount === totalCount && (
          <>
            <Animated.Text
              style={{
                transform: [{ scale }],
                opacity,
                fontSize: 32,
                fontWeight: "bold",
                color: colors.primary,
                marginTop: 20,
              }}
            >
              🔥 Streak +1!
            </Animated.Text>
            <Button
              className="mt-4"
              onPress={() =>
                router.replace("/(app)/(tabs)/(home)/(progress)/Reward")
              }
            >
              <Text>🎁 Claim Your Reward</Text>
            </Button>
          </>
        )}

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
