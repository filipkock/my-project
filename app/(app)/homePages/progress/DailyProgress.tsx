import { useLocalSearchParams, router } from "expo-router";
import { View, Animated } from "react-native";
import { useRef, useEffect, useState } from "react";
import { Button } from "~/components/ui/button";
import { Text } from "~/components/ui/text";
import { useTheme } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";
import { getFromStorage } from "~/src/services/storage";
import { getStreakFromFirestore } from "~/src/utils/streak";
import { useVideoPlayer, VideoView } from "expo-video";
import { FireIcon } from "react-native-heroicons/solid";
import { GiftIcon } from "react-native-heroicons/solid";
import { playSound } from "~/lib/sound";

const animationSound = require("~/assets/audio/onboarding_sound.wav");

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

  const player = useVideoPlayer(
    require("~/assets/animations/poka_celebrate.mp4"),
    (player) => {
      player.play();
      player.muted = true;
    }
  );

  useEffect(() => {
    const playButtonSound = async () => {
      await playSound(animationSound, 2); // 1.4x faster
    };
    playButtonSound();
  }, []);

  return (
    <SafeAreaView className="flex-1">
      <View className="flex-1 items-center p-8">
        <View className="flex-1 justify-center items-center gap-4">
          <Text className="text-2xl font-semibold text-center">
            {takenCount === totalCount
              ? "A-all done for today... you did great!"
              : "N-nice work... see you later for the next one!"}
          </Text>
          <VideoView
            style={{ width: 400, height: 400 }}
            player={player}
            allowsFullscreen={false}
            allowsPictureInPicture={false}
            nativeControls={false}
          />
          {takenCount === totalCount && (
            <View className="flex flex-row items-center gap-1">
              <FireIcon size={24} color="black" />
              <Text className="text-gray-600">Streak boost earned</Text>
            </View>
          )}
          {takenCount === totalCount ? (
            <View className="flex flex-row items-center gap-1">
              <GiftIcon size={24} color="black" />

              <Text className="text-gray-600">Reward earned</Text>
            </View>
          ) : (
            <Text className="text-center text-gray-600 italic mt-2">
              {`You've taken ${takenCount} of ${totalCount} today. Take them all to earn a reward!`}
            </Text>
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
