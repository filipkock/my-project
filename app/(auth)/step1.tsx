import React from "react";
import { SafeAreaView, View, Image } from "react-native";
import { router } from "expo-router";
import { Text } from "~/components/ui/text";
import { Button } from "~/components/ui/button";
import { useVideoPlayer, VideoView } from "expo-video";

export default function Step1() {
  const handleContinue = () => {
    router.push("/(auth)/signup");
  };

  const player = useVideoPlayer(
    require("~/assets/animations/onboarding.mp4"),
    (player) => {
      player.play();
      player.muted = true;
    }
  );

  return (
    <SafeAreaView className="flex-1 bg-secondary/40">
      <View className="flex-1 p-12">
        <View className="flex-1 gap-10">
          <Image
            source={require("~/assets/images/logo.png")}
            className="w-20 h-20"
            resizeMode="contain"
          />

          <Text className="text-3xl font-semibold -mb-6">
            Here to help you remember your meds!
          </Text>
          <View className="items-center">
            <VideoView
              style={{
                width: 420,
                height: 420,
              }}
              player={player}
              allowsFullscreen={false}
              allowsPictureInPicture={false}
              nativeControls={false}
            />
          </View>
        </View>
        <View>
          <Button className="w-full" onPress={handleContinue}>
            <Text>Continue</Text>
          </Button>
          <Text className="text-xs text-center text-muted-foreground mt-5">
            By continuing, you agree to our terms and services.
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}
