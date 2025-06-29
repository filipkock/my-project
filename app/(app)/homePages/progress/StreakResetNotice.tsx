import { View } from "react-native";
import { Text } from "~/components/ui/text";
import { Button } from "~/components/ui/button";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { XMarkIcon } from "react-native-heroicons/solid";
import { useVideoPlayer, VideoView } from "expo-video";

export default function StreakResetNotice() {
  const player = useVideoPlayer(
    require("~/assets/animations/poka_melting.mp4"),
    (player) => {
      player.play();
      player.muted = true;
    }
  );
  return (
    <SafeAreaView className="flex-1 bg-secondary/40">
      <View className="flex-1 p-12">
        <View className="flex-row justify-between items-center mb-8">
          <XMarkIcon
            size={32}
            color="black"
            onPress={() => router.replace("/(app)/(tabs)/(home)")}
          />
        </View>
        <View className="flex-1 justify-between items-center py-10 mt-4">
          <Text className="text-3xl font-bold text-center">Streak Reset</Text>
          <View className="items-center">
            <VideoView
              style={{
                width: 300,
                height: 300,
              }}
              player={player}
              allowsFullscreen={false}
              allowsPictureInPicture={false}
              nativeControls={false}
            />
          </View>
          <Text className="text-lg text-center text-gray-700">
            Oops! You missed a day, so your streak was reset. But no worries,
            today’s a fresh start!
          </Text>
        </View>
        <Button
          className="w-full"
          onPress={() => router.replace("/(app)/(tabs)/(home)")}
        >
          <Text>Start Fresh</Text>
        </Button>
      </View>
    </SafeAreaView>
  );
}
