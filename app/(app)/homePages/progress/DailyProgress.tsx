import { useLocalSearchParams, router } from "expo-router";
import { View, Animated } from "react-native";
import { useRef, useEffect, useState } from "react";
import { Button } from "~/components/ui/button";
import { Text } from "~/components/ui/text";
import { useTheme } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";
import { getFromStorage } from "~/src/services/storage";
import { getStreakFromFirestore } from "~/src/utils/streak";
import { Video, ResizeMode } from "expo-av";

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
    <SafeAreaView className="flex-1">
      <View className="flex-1 items-center p-6">
        <View className="flex-1 justify-center items-center gap-6">
          <Text className="text-2xl font-semibold text-center">
            {takenCount === totalCount
              ? "Medication taken! All done for today!"
              : "Medication taken! Great job!"}
          </Text>
          <Video
            source={require("~/assets/animations/poka_celebrate.mp4")}
            style={{ width: 400, height: 400 }}
            isMuted
            shouldPlay
            resizeMode={ResizeMode.CONTAIN}
          />

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
            </>
          )}
        </View>

        <Button
          className="w-full"
          onPress={() =>
            router.replace(
              takenCount === totalCount
                ? "/(app)/homePages/progress/Reward"
                : "/(app)/(tabs)/(home)"
            )
          }
          size={"lg"}
        >
          <Text>CONTINUE</Text>
        </Button>
      </View>
    </SafeAreaView>
  );
}
