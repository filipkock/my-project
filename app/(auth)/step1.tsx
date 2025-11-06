import React from "react";
import { Audio } from "expo-av";
import { playSound } from "~/lib/sound";
import { SafeAreaView, View, Image, Platform } from "react-native";
import { router } from "expo-router";
import { Text } from "~/components/ui/text";
import { Button } from "~/components/ui/button";
import { VideoView } from "expo-video";
import { useSilentVideo } from "~/lib/useSilentVideo";

export default function Step1() {
  const soundRef = React.useRef<Audio.Sound | null>(null);
  const [phase, setPhase] = React.useState<0 | 1 | 2>(0); // 0: video, 1: intro msg, 2: help msg

  // Expo Video player (keep videos truly silent)
  const player = useSilentVideo(
    require("~/assets/animations/onboarding.mp4"),
    false
  );

  const handleContinue = async () => {
    try {
      if (soundRef.current) {
        // Stop immediately and free resources
        await soundRef.current.stopAsync().catch(() => {});
        await soundRef.current.unloadAsync().catch(() => {});
        soundRef.current = null;
      }
    } finally {
      router.push("/(auth)/signup");
    }
  };

  React.useEffect(() => {
    playSound(require("~/assets/audio/onboarding_sound.wav"));
  }, []);

  return (
    <SafeAreaView className="flex-1 bg-secondary/40">
      <View className="flex-1 p-12">
        <View className="flex-1 gap-4">
          <Image
            source={require("~/assets/images/logo.png")}
            style={{ width: 80, height: 80 }}
            resizeMode="contain"
          />

          <View
            className="items-center"
            style={{ height: 80, width: "100%", justifyContent: "center" }}
          >
            {phase === 1 && (
              <Text className="text-3xl font-bold text-center">
                H-hey… I-I’m Poka.
              </Text>
            )}
            {phase === 2 && (
              <Text className="text-3xl font-bold text-center">
                I-I’m here to help you remember your meds.
              </Text>
            )}
          </View>
          <View
            className="items-center"
            style={{ height: 420, width: "100%", justifyContent: "center" }}
          >
            <VideoView
              style={{ width: 420, height: 420 }}
              player={player}
              allowsFullscreen={false}
              allowsPictureInPicture={false}
              nativeControls={false}
            />
          </View>
        </View>
        <View>
          <>
            <Button
              className="w-full"
              onPress={async () => {
                if (phase === 0) {
                  setPhase(1);
                  return;
                }
                if (phase === 1) {
                  setPhase(2);
                  return;
                }
                await handleContinue();
              }}
            >
              <Text>Continue</Text>
            </Button>
            <Text className="text-xs text-center text-muted-foreground mt-5">
              By continuing, you agree to our terms and services.
            </Text>
          </>
        </View>
      </View>
    </SafeAreaView>
  );
}
